import { defineConfig } from '@rstest/core';

export default defineConfig({
  env: {
    // Let Rsbuild choose the mode based on the command.
    NODE_ENV: undefined,
  },
  root: __dirname,
  include: ['./**/*.pw.test.ts'],
  isolate: false,
  retry: process.env.CI ? 3 : 0,
});
