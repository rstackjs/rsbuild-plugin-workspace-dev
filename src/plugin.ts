import type { RsbuildPlugin } from '@rsbuild/core';

import {
  RecursiveRunner,
  type RecursiveRunnerOptions,
} from './recursive-runner.js';

export function pluginRecursiveDev(
  options?: RecursiveRunnerOptions,
): RsbuildPlugin {
  return {
    name: 'rsbuild-plugin-watch-dev',
    async setup(api) {
      const rootPath = api.context.rootPath;
      api.onBeforeStartDevServer(async () => {
        const runner = new RecursiveRunner({
          cwd: rootPath,
          ...options,
        });

        await runner.init();
        await runner.start();
      });
    },
  };
}
