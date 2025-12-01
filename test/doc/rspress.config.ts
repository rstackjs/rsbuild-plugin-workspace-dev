import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginApiDocgen } from '@rspress/plugin-api-docgen';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginWorkspaceDev } from 'rsbuild-plugin-workspace-dev';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
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
  plugins: [
    pluginApiDocgen({
      entries: {
        Button: './src/button.tsx',
      },
      apiParseTool: 'react-docgen-typescript',
    }),
    pluginPreview(),
  ],
  builderConfig: {
    plugins: [
      pluginWorkspaceDev({
        startCurrent: true,
      }),
    ],
  },
});
