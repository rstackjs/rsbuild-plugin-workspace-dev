# rsbuild-plugin-workspace-dev

Start monorepo sub-projects in topological order.

`rsbuild-plugin-workspace-dev` is designed for monorepo development. It computes the dependency graph starting from the current project and starts sub-projects in topological order.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-workspace-dev">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-workspace-dev?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

English | [简体中文](./README.zh-CN.md)

## Usage

Install:

```bash
pnpm add rsbuild-plugin-workspace-dev -D
```

Register the plugin in `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginWorkspaceDev } from "rsbuild-plugin-workspace-dev";

export default {
  plugins: [pluginWorkspaceDev()],
};
```

## Use Cases

In a monorepo, one project may depend on multiple sub-projects, and those sub-projects can also depend on each other.

For example, the monorepo contains an app and several lib packages:

```ts
monorepo
├── app
└── lib1
└── lib2
└── lib3
```

Here, app is built with Rsbuild, and lib is built with Rslib. The app depends on lib1 and lib2:

```json
{
  "name": "app",
  "dependencies": {
    "lib1": "workspace:*",
    "lib2": "workspace:*"
  }
}
```

lib2 depends on lib3:

```json
{
  "name": "lib2",
  "dependencies": {
    "lib3": "workspace:*"
  }
}
```

When you run `pnpm dev` under app, sub-projects start in topological order: first lib1 and lib3, then lib2, and finally app. Starting a lib refers to running its dev command, for example:

```json
{
  "scripts": {
    "dev": "rslib build --watch"
  }
}
```

Whether a sub-project has finished starting is determined by matching sub-project logs. By default, logs from Rslib and tsup sub-projects are recognized. You can also provide a custom match function to determine when a sub-project is ready.

## Options

### projects
Configure how sub-projects are started and define custom log matching logic.

- Type:
```
type projects = {
  // The key is the name of the sub-project's package.json file.
  [key: string]: Projects;
}

interface projects {
  /**
   * Custom sub-project start command. Default is `dev` (runs `npm run dev`).
   */
  command?: string;
  /**
   * Custom logic to detect when a sub-project has started.
   * By default, logs from `Rsbuild` and `tsup` are supported.
   */
  match?: (stdout: string) => boolean;
  /**
   * Whether to skip starting the current sub-project. Default is `false`.
   * Useful for sub-projects that do not need to be started.
   */
  skip?: boolean;
}


// For example, to configure lib1 sub-project to use build:watch command and match watch success log
pluginWorkspaceDev({
  projects: {
    lib1: {
      command: 'build:watch',
      match: (stdout) => stdout.includes('watch success'),
    },
  },
})
```

### startCurrent

- Type: `boolean`
- Default: `false`

Whether to also start the current project. The default is `false`. In most cases, you start the current project manually, so the plugin does not interfere.

Consider a scenario where docs and lib are in the same project, and docs needs to debug the output of lib. In this case, you want to run `pnpm doc` for the docs, while lib should run `pnpm dev`. After configuring this option in your Rspress config, starting `pnpm doc` will automatically run `pnpm dev` to start the lib sub-project.

```
├── docs
│   └── index.mdx
├── package.json
├── src
│   └── Button.tsx
├── rslib.config.ts
├── rspress.config.ts
```

```
"scripts": {
  "dev": "rslib build --watch",
  "doc": "rspress dev"
},
```

### cwd

- Type: `string`
- Default: `process.cwd()`

Set the current working directory. The default is the current project directory; usually no configuration is needed.

### workspaceFileDir

- Type: `string`
- Default: `process.cwd()`

Set the directory where the workspace file resides. The default is the current project directory; usually no configuration is needed.

## Frequently Asked Questions

### Project startup stuck
Stuck may be due to slow sub-project builds, etc. The lack of log output is because, by default, sub-project logs are output all at once after startup (to avoid interleaving sub-project logs). You can enable debug mode by adding an environment variable, which will allow sub-project logs to be output in real time.

```
DEBUG=rsbuild pnpm dev
```

### Some projects don't need to start

If some sub-projects don't need to start, simply configure `skip: true` for the specified project in `rsbuild.config.ts`.

```ts
// rsbuild.config.ts
import { pluginWorkspaceDev } from "rsbuild-plugin-workspace-dev";

export default {
  plugins: [
    pluginWorkspaceDev({
      projects: {
        lib1: {
          skip: true,
        },
      },
    }),
  ],
};
```

## License

[MIT](./LICENSE).
