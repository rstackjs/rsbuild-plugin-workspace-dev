// Configuration guide: https://rstack.rs/config
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';
import { define } from 'rstack';
import { pluginWorkspaceDev } from '../../src/index.ts';
import { pluginLogAfterStart } from './test-plugin.ts';

define.app({
  server: {
    port: 8080,
  },
  plugins: [
    pluginReact(),
    pluginTypeCheck({
      tsCheckerOptions: {
        // TypeScript 7 always checks with --noEmit, which is incompatible
        // with build mode for project references.
        typescript: {
          build: false,
        },
      },
    }),
    pluginWorkspaceDev(),
    pluginLogAfterStart(),
  ],
});
