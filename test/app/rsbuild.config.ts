import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginRecursiveDev } from '@rsbuild/plugin-recursive-dev';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

import { pluginLogAfterStart } from './test-plugin.js';

export default defineConfig({
  server: {
    port: 8080,
  },
  plugins: [
    pluginReact(),
    pluginTypeCheck(),
    pluginRecursiveDev(),
    pluginLogAfterStart(),
  ],
});
