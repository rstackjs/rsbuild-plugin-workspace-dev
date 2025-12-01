# rsbuild-plugin-workspace-dev

提供按拓扑顺序启动 monorepo 子项目的能力。

`rsbuild-plugin-workspace-dev` 用于 monorepo 开发场景，它支持从当前项目开始计算依赖关系生成拓扑图，按拓扑顺序启动子项目。

<p>
  <a href="https://npmjs.com/package/rsbuild-plugin-workspace-dev">
   <img src="https://img.shields.io/npm/v/rsbuild-plugin-workspace-dev?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

## 使用

安装：

```bash
pnpm add rsbuild-plugin-workspace-dev -D
```

在 `rsbuild.config.ts` 里注册插件:

```ts
// rsbuild.config.ts
import { pluginWorkspaceDev } from "rsbuild-plugin-workspace-dev";

export default {
  plugins: [pluginWorkspaceDev()],
};
```

## 使用场景

在 monorepo 中，一个项目可能依赖多个子项目，而子项目之间也可能存在依赖关系。

比如 monorepo 中包含了一个 app 应用和多个 lib 包：

```ts
monorepo
├── app
└── lib1
└── lib2
└── lib3
```

其中，app 是基于 Rsbuild 构建的, lib 是基于 Rslib 构建的。app 依赖了 lib1 和 lib2：

```json
{
  "name": "app",
  "dependencies": {
    "lib1": "workspace:*",
    "lib2": "workspace:*"
  }
}
```

lib2 依赖了 lib3：

```json
{
  "name": "lib2",
  "dependencies": {
    "lib3": "workspace:*"
  }
}
```
此时在 app 下执行 `pnpm dev` 后，会按照拓扑顺序先启动 lib1 和 lib3，再启动 lib2，最后启动 app。此处启动 lib 指的是执行 lib 的 dev 命令
```json
{
  "scripts": {
    "dev": "rslib build --watch"
  }
}
```
识别子项目是否启动完成是通过匹配子项目日志实现的，默认支持匹配 Rslib、tsup 子项目，同时支持手动配置 match 匹配日志。

## 选项

### projects
用于子项目的启动项配置和自定义日志匹配逻辑。

- **类型：**
```
type projects = {
  // key 为子项目 package.json name
  [key: string]: Projects;
}

interface Projects {
  /**
   * 自定义子项目启动命令，默认值为 `dev`, 即执行 `npm run dev`。
   */
  command?: string;
  /**
   * 自定义子项目启动完成匹配逻辑，默认支持 `Rsbuild`、`tsup` 子项目的日志匹配逻辑。
   */
  match?: (stdout: string) => boolean;
  /**
   * 是否跳过当前子项目的启动，默认值为 `false`，通常用于跳过一些不需要启动的子项目。
   */
  skip?: boolean;
}

// 例如，配置 lib1 子项目，用 build:watch 命令启动，匹配 watch success 日志
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

- **类型：** `boolean`
- **默认值：** `false`

插件是否同时启动当前项目，默认值为 `false`。通常无需手动配置，当前项目通常由用户手动执行 dev 启动，无需插件干预。

考虑如下场景，docs 和 lib 是在同一个项目中，而 docs 需要调试 lib 的产物，此时需要启动 `pnpm doc` 命令，而 lib 则需要启动 `pnpm dev` 命令，配置该选项到 rspress 配置中后，启动 `pnpm doc` 时会自动执行 `pnpm dev` 命令，用于启动 lib 子项目。
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

- **类型：** `string`
- **默认值：** `process.cwd()`

用于配置当前工作目录，默认值为当前项目目录，通常无需配置。

### workspaceFileDir

- **类型：** `string`
- **默认值：** `process.cwd()`

用于配置 workspace 文件目录，默认值为当前项目目录，通常无需配置。


## 常见问题

### 启动项目时卡住
卡住可能是因为子项目构建过慢等原因，没有日志输出是因为默认情况下子项目日志是启动完成后一次性输出的（为了避免子项目日志混和在一起交错输出），可以通过添加环境变量来开启调试模式，这会让子项目的日志实时输出。
```
DEBUG=rsbuild pnpm dev
```

### 某些项目无需启动
如果某些子项目不需要启动，只需要在 `rsbuild.config.ts` 中给指定项目配置 `skip: true` 即可。

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
