import type { RsbuildPlugin } from '@rsbuild/core';
import { Logger } from './logger.js';
import {
  WorkspaceDevRunner,
  type WorkspaceDevRunnerOptions,
} from './workspace-dev.js';

export function pluginWorkspaceDev(
  options?: WorkspaceDevRunnerOptions,
): RsbuildPlugin {
  return {
    name: 'rsbuild-plugin-workspace-dev',
    async setup(api) {
      const rootPath = api.context.rootPath;
      api.onBeforeStartDevServer(async () => {
        const runner = new WorkspaceDevRunner({
          cwd: rootPath,
          ...options,
        });
        await runner.init();
        await runner.start();
        Logger.setEndBanner();
      });

      api.onBeforeBuild(async ({ isWatch, isFirstCompile }) => {
        if (!isWatch || !isFirstCompile) {
          return;
        }

        const runner = new WorkspaceDevRunner({
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
