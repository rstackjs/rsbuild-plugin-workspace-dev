import { getPackagesSync } from '@manypkg/get-packages';
import { spawn } from 'child_process';
import graphlib, { Graph } from 'graphlib';
import { join } from 'path';
import {
  PACKAGE_JSON,
  PLUGIN_LOG_TITLE,
  RSLIB_READY_MESSAGE,
  TSUP_READY_MESSAGE,
} from './constant.js';
import { debugLog, Logger } from './logger.js';
import type { PackageWithScripts } from './types.js';
import { readPackageJson } from './utils.js';

interface GraphNode {
  name: string;
  packageJson: PackageWithScripts['packageJson'];
  path: string;
}

export interface WorkspaceDevRunnerOptions {
  cwd?: string;
  workspaceFileDir?: string;
  projects?: Record<
    string,
    {
      match?: (stdout: string) => boolean;
      command?: string;
      skip?: boolean | 'only';
    }
  >;
  startCurrent?: boolean;
}

export class WorkspaceDevRunner {
  private options: WorkspaceDevRunnerOptions;
  private cwd: string;
  private workspaceFileDir: string;
  private packages: PackageWithScripts[] = [];
  private graph: Graph;
  private visited: Record<string, boolean>;
  private visiting: Record<string, boolean>;
  private matched: Record<string, boolean>;
  private metaData!: PackageWithScripts['packageJson'];

  constructor(options: WorkspaceDevRunnerOptions) {
    this.options = {
      startCurrent: false,
      ...options,
    };
    this.cwd = options.cwd || process.cwd();
    this.workspaceFileDir = options.workspaceFileDir || this.cwd;
    this.packages = [];
    this.visited = {};
    this.visiting = {};
    this.matched = {};
    this.graph = new Graph({ directed: true });
  }

  async init(): Promise<void> {
    this.metaData = await readPackageJson(join(this.cwd, PACKAGE_JSON));
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
    const { packages } = getPackagesSync(this.workspaceFileDir);
    const currentPackage = packages.find(
      (pkg) => pkg.packageJson.name === this.metaData.name,
    )!;
    this.packages = packages;

    const initNode = (pkg: PackageWithScripts) => {
      const { packageJson, dir } = pkg;
      const { name, dependencies, devDependencies, peerDependencies } =
        packageJson;
      const node: GraphNode = {
        name,
        packageJson,
        path: dir,
      };
      const skip = this.options.projects?.[name]?.skip;
      if (skip === true) {
        return;
      }
      this.graph.setNode(name, node);
      this.visited[name] = false;
      this.visiting[name] = false;
      this.matched[name] = false;

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

        const skip = this.options.projects?.[depName]?.skip;
        if (isInternalDep) {
          if (skip !== true) {
            this.graph.setEdge(packageName, depName);
            this.checkGraph();
            const depPackage = packages.find(
              (pkg) => pkg.packageJson.name === depName,
            )!;
            if (!this.getNode(depName)) {
              initNode(depPackage);
            }
          } else {
            debugLog(
              `Prune project ${depName} and its dependencies because it is marked as skip: true`,
            );
          }
        }
      }
    };

    initNode(currentPackage);
  }

  checkGraph() {
    const cycles = graphlib.alg.findCycles(this.graph);
    const nonSelfCycles = cycles.filter((c) => c.length !== 1);
    const nonSkipCycles = nonSelfCycles.filter((group) => {
      const isSkip = group.some((node) => this.options.projects?.[node]?.skip);
      return !isSkip;
    });
    if (nonSkipCycles.length) {
      throw new Error(
        `${PLUGIN_LOG_TITLE} Cycle dependency graph found: ${nonSkipCycles}, you should config projects in plugin options to skip someone, or fix the cycle dependency. Otherwise, a loop of dev will occur.`,
      );
    }
  }

  async start() {
    const promises = [];
    const allNodes = this.getNodes();
    const filterSelfNodes = allNodes.filter(
      (node) => node !== this.metaData.name,
    );
    const nodes = this.options.startCurrent ? allNodes : filterSelfNodes;

    for (const node of nodes) {
      const dependencies = this.getDependencies(node) || [];
      const canStart = dependencies.every((dep) => {
        const selfStart = node === dep;
        const isVisiting = this.visiting[dep];
        const skipDep = this.options.projects?.[dep]?.skip;
        const isVisited = selfStart || this.visited[dep] || skipDep;
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
      const { name, path, packageJson } = this.getNode(node);
      const logger = new Logger({
        name,
      });

      const config = this.options?.projects?.[name];
      const command = config?.command ? config.command : 'dev';
      const scripts = packageJson.scripts || {};
      if (config?.skip || !scripts[command]) {
        this.visited[node] = true;
        this.visiting[node] = false;
        debugLog(`Skip visit node: ${node}`);
        logger.emitLogOnce('stdout', `Skip visit node: ${name}`);
        return this.start().then(() => resolve());
      }
      this.visiting[node] = true;

      const child = spawn('npm', ['run', command], {
        cwd: path,
        env: {
          ...process.env,
          FORCE_COLOR: '3',
        },
        shell: true,
      });

      child.stdout.on('data', async (data) => {
        const stdout = data.toString();
        const content = data.toString().replace(/\n$/, '');
        if (this.matched[node]) {
          logger.emitLogOnce('stdout', content);
          return;
        }
        debugLog(content, `${name}: `);
        logger.appendLog('stdout', stdout);
        const match = config?.match;
        const matchResult = match
          ? match(stdout)
          : stdout.match(RSLIB_READY_MESSAGE) ||
            stdout.match(TSUP_READY_MESSAGE);

        if (matchResult) {
          logger.flushStdout();
          this.matched[node] = true;
          this.visited[node] = true;
          this.visiting[node] = false;
          await this.start();
          resolve();
        }
      });

      child.stderr.on('data', (data) => {
        const stderr = data.toString();
        logger.emitLogOnce('stderr', stderr);
      });

      child.on('close', () => {});
    });
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
}
