import { defineConfig } from '@rstest/core';

export default defineConfig({
  projects: [
    {
      name: 'unit',
      exclude: ['./**/*.pw.test.ts'],
    },
    {
      name: 'e2e',
      env: {
        // Let Rsbuild choose the mode based on the command.
        NODE_ENV: undefined,
      },
      include: ['./**/*.pw.test.ts'],
      retry: process.env.CI ? 3 : 0,
      testTimeout: 10_000,
    },
  ],
});
