import type { RsbuildPlugin } from '@rsbuild/core';
import { Logger } from './logger.js';
import {
  RecursiveRunner,
  type RecursiveRunnerOptions,
} from './recursive-dev.js';

export function pluginRecursiveDev(
  options?: RecursiveRunnerOptions,
): RsbuildPlugin {
  return {
    name: 'rsbuild-plugin-recursive-dev',
    async setup(api) {
      const rootPath = api.context.rootPath;
      api.onBeforeStartDevServer(async () => {
        const runner = new RecursiveRunner({
          cwd: rootPath,
          ...options,
        });

        await runner.init();
        await runner.start();
        Logger.setEndBanner();
      });
    },
  };
}
