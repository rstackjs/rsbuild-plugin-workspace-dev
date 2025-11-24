import { getPackagesSync, type Package } from '@manypkg/get-packages';
import { spawn } from 'child_process';
import graphlib, { Graph } from 'graphlib';
import path from 'path';

import {
  DEBUG_LOG_TITLE,
  PACKAGE_JSON,
  RSLIB_READY_MESSAGE,
} from './constant.js';
import { debugLog, Logger } from './logger.js';
import { readPackageJson } from './utils.js';

interface GraphNode {
  name: string;
  packageJson: Package['packageJson'];
  path: string;
}

export interface RecursiveRunnerOptions {
  cwd?: string;
  workspaceFilePath?: string;
  projectConfig?: Record<
    string,
    {
      match?: (stdout: string) => boolean;
      command?: string;
    }
  >;
}

export class RecursiveRunner {
  private options: RecursiveRunnerOptions;
  private cwd: string;
  private workspaceFilePath: string;
  private packages: Package[] = [];
  private graph: Graph;
  private visited: Record<string, boolean>;
  private visiting: Record<string, boolean>;
  private metaData!: Package['packageJson'];

  constructor(options: RecursiveRunnerOptions) {
    this.options = options;
    this.cwd = options.cwd || process.cwd();
    this.workspaceFilePath = options.workspaceFilePath || this.cwd;
    this.packages = [];
    this.visited = {};
    this.visiting = {};
    this.graph = new Graph({ directed: true });
  }

  async init(): Promise<void> {
    this.metaData = await readPackageJson(path.join(this.cwd, PACKAGE_JSON));
    this.buildDependencyGraph();
    debugLog(
      'Dependency graph:\n' +
        `nodes: ${this.getNodes().join(', ')}\n` +
        `edges: ${this.getEdges()
          .map((edge) => `${edge.v} -> ${edge.w}`)
          .join(', ')}\n`,
    );
  }

  buildDependencyGraph() {
    const { packages } = getPackagesSync(this.workspaceFilePath);
    const currentPackage = packages.find(
      (pkg) => pkg.packageJson.name === this.metaData.name,
    )!;
    this.packages = packages;

    const initNode = (pkg: Package) => {
      const { packageJson, dir } = pkg;
      const { name, dependencies, devDependencies, peerDependencies } =
        packageJson;
      const node: GraphNode = {
        name,
        packageJson,
        path: dir,
      };
      this.graph.setNode(name, node);
      this.visited[name] = false;
      this.visiting[name] = false;

      const packageName = name;
      const deps = {
        ...dependencies,
        ...devDependencies,
        ...peerDependencies,
      };

      for (const depName of Object.keys(deps)) {
        const isInternalDep = this.packages.some(
          (p) => p.packageJson.name === depName,
        );

        if (isInternalDep) {
          this.graph.setEdge(packageName, depName);
          this.checkGraph();
          const depPackage = packages.find(
            (pkg) => pkg.packageJson.name === depName,
          )!;
          initNode(depPackage);
        }
      }
    };

    initNode(currentPackage);
  }

  checkGraph() {
    const isAcyclic = graphlib.alg.isAcyclic(this.graph);
    if (!isAcyclic) {
      throw new Error(
        DEBUG_LOG_TITLE + 'Dependency graph do not allow cycles.',
      );
    }
    return isAcyclic;
  }

  getDependencyGraph() {
    return this.graph;
  }

  getNodes() {
    return this.graph.nodes();
  }

  getEdges() {
    return this.graph.edges();
  }

  getNode(name: string) {
    return this.graph.node(name);
  }

  getDependents(packageName: string) {
    return this.graph.predecessors(packageName);
  }

  getDependencies(packageName: string) {
    return this.graph.successors(packageName);
  }

  async start() {
    const promises = [];
    const nodes = this.getNodes().filter((node) => node !== this.metaData.name);
    for (const node of nodes) {
      const dependencies = this.getDependencies(node) || [];
      const canStart = dependencies.every((dep) => {
        const isVisiting = this.visiting[dep];
        const isVisited = this.visited[dep];
        return isVisited && !isVisiting;
      });

      if (canStart && !this.visited[node] && !this.visiting[node]) {
        debugLog(`Start visit node: ${node}`);
        const visitPromise = this.visitNodes(node);
        promises.push(visitPromise);
      }
    }
    await Promise.all(promises);
  }

  visitNodes(node: string): Promise<void> {
    return new Promise((resolve) => {
      this.visiting[node] = true;
      const { name, path } = this.getNode(node);
      const config = this.options?.projectConfig?.[name];

      const child = spawn(
        'npm',
        ['run', config?.command ? config.command : 'dev'],
        {
          cwd: path,
          env: {
            ...process.env,
            FORCE_COLOR: '3',
          },
          shell: true,
        },
      );

      const logger = new Logger({
        name,
      });
      child.stdout.on('data', async (data) => {
        const stdout = data.toString();
        logger.appendLog('stdout', stdout);
        const match = config?.match;
        const matchResult = match
          ? match(stdout)
          : stdout.match(RSLIB_READY_MESSAGE);

        if (matchResult) {
          logger.flushStdout();
          this.visited[node] = true;
          this.visiting[node] = false;
          await this.start();
          resolve();
        }
      });

      child.stderr.on('data', (data) => {
        const stderr = data.toString();
        logger.appendLog('stderr', stderr);
        logger.emitLog('stderr');
        logger.reset('stderr');
      });

      child.on('close', () => {});
    });
  }
}
