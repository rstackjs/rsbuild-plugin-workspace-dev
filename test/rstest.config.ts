import { defineConfig } from '@rstest/core';

export default defineConfig({
  name: 'integration',
  include: ['./**/*.test.ts'],
  exclude: ['**/node_modules/**', './**/*.pw.test.ts'], // Exclude Playwright tests
});
