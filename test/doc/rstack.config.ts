// Configuration guide: https://rstack.rs/config
import * as path from 'node:path';
import { define } from 'rstack';

define.lib(async () => {
  const { pluginReact } = await import('@rsbuild/plugin-react');

  return {
    lib: [
      {
        bundle: false,
        dts: true,
      },
    ],
    output: {
      target: 'web',
    },
    source: {
      tsconfigPath: 'tsconfig.build.json',
    },
    plugins: [pluginReact()],
  };
});

define.doc(async () => {
  const { pluginWorkspaceDev } = await import('../../src/index.ts');

  return {
    root: path.join(import.meta.dirname, 'docs'),
    title: 'Rslib Module Doc',
    lang: 'en',
    locales: [
      {
        lang: 'en',
        label: 'English',
      },
      {
        lang: 'zh',
        label: '简体中文',
      },
    ],
    builderConfig: {
      plugins: [
        pluginWorkspaceDev({
          startCurrent: true,
        }),
      ],
    },
  };
});
