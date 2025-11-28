# rsbuild-plugin-workspace-dev

Start monorepo sub-projects in topological order.

`rsbuild-plugin-workspace-dev` is designed for monorepo development. It computes the dependency graph starting from the current project and starts sub-projects in topological order.

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-workspace-dev">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-workspace-dev?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

## Usage

Install:

```bash
npm add rsbuild-plugin-workspace-dev -D
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

`lib2` depends on `lib3`:

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

### projectConfig
Configure how sub-projects are started and define custom log matching logic.

- Type:
```
interface ProjectConfig {
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
```

### ignoreSelf

- Type: `boolean`
- Default: `true`

Whether to ignore starting the current project. The default is `true`. In most cases, you start the current project manually, so the plugin does not interfere.

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

## License

[MIT](./LICENSE).
