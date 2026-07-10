import { defineConfig } from '@rstest/core';

export default defineConfig({
  env: {
    // Let Rsbuild choose the mode based on the command.
    NODE_ENV: undefined,
  },
  retry: process.env.CI ? 3 : 0,
  testTimeout: 10_000,
});
