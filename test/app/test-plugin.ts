import type { RsbuildPlugin } from '@rsbuild/core';
import { TEST_SUIT_STARTED } from '../constant.js';

export function pluginLogAfterStart(): RsbuildPlugin {
  return {
    name: 'rsbuild-plugin-log-after-start',
    async setup(api) {
      api.onAfterStartDevServer(() => {
        console.log(TEST_SUIT_STARTED);
      });
    },
  };
}
