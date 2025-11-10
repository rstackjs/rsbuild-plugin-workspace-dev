import { getPackagesSync, type Package } from '@manypkg/get-packages';
import { spawn } from 'child_process';
import graphlib, { Graph } from 'graphlib';

interface GraphNode {
  name: string;
  packageJson: any;
  path: string;
}

export class BuildGraph {
  private rootDir: string;
  private packages: Package[] = [];
  private graph: Graph;
  private visited: Record<string, boolean>;
  private visiting: Record<string, boolean>;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || process.cwd();
    this.visited = {};
    this.visiting = {};
    this.graph = new Graph({ directed: true });
    this.buildDependencyGraph();
    this.checkGraph();
  }

  /**
   * 构建 monorepo 的依赖关系图
   */
  private buildDependencyGraph(): void {
    // 获取所有子项目
    const { packages } = getPackagesSync(this.rootDir);
    this.packages = packages;

    // 创建节点
    this.packages.forEach((pkg) => {
      const node: GraphNode = {
        name: pkg.packageJson.name,
        packageJson: pkg.packageJson,
        path: pkg.dir,
      };
      this.graph.setNode(node.name, node);
      this.visited[node.name] = false;
      this.visiting[node.name] = false;
    });

    for (const pkg of this.packages) {
      const packageName = pkg.packageJson.name;
      const dependencies = {
        ...pkg.packageJson.dependencies,
        ...pkg.packageJson.devDependencies,
        ...pkg.packageJson.peerDependencies,
      };

      // 检查每个依赖是否是 monorepo 中的另一个包
      for (const depName of Object.keys(dependencies)) {
        const isInternalDep = this.packages.some(
          (p) => p.packageJson.name === depName,
        );

        if (isInternalDep) {
          this.graph.setEdge(packageName, depName);
        }
      }
    }
  }

  private checkGraph() {
    const isAcyclic = graphlib.alg.isAcyclic(this.graph);
    if (!isAcyclic) {
      throw new Error('Graph is cyclic');
    }
    return isAcyclic;
  }

  /**
   * 获取依赖关系图
   */
  getDependencyGraph() {
    return this.graph;
  }

  /**
   * 获取所有节点（子项目）
   */
  getNodes() {
    return this.graph.nodes();
  }

  /**
   * 获取所有边（依赖关系）
   */
  getEdges() {
    return this.graph.edges();
  }

  getNode(name: string) {
    return this.graph.node(name);
  }

  /**
   * 获取依赖指定包的所有包
   */
  getDependents(packageName: string) {
    return this.graph.predecessors(packageName);
  }

  getDependencies(packageName: string) {
    return this.graph.successors(packageName);
  }

  visitNodes() {
    const nodes = this.getNodes();
    for (const node of nodes) {
      const dependencies = this.getDependencies(node) || [];
      const canStart = dependencies.every((dep) => {
        const isVisiting = this.visiting[dep];
        const isVisited = this.visited[dep];
        return isVisited && !isVisiting;
      });

      if (canStart && !this.visited[node] && !this.visiting[node]) {
        this.start(node);
      }
    }
  }

  start(node: string) {
    this.visiting[node] = true;
    const { name, path } = this.getNode(node);
    const child = spawn('npm', ['run', 'dev'], {
      cwd: path,
    });
    console.log(`start--- ${name} dev in ${path}`);

    child.stdout.on('data', (data) => {
      const stdoutData = data.toString();
      if (stdoutData.match('built in (.*?)s')) {
        console.log(`end--- ${name} dev in ${path}`);
        this.visited[node] = true;
        this.visiting[node] = false;
        this.visitNodes();
      }
    });
    child.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    child.on('close', () => {});
  }
}
