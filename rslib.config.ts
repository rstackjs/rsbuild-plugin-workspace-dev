import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: true,
      experiments: { advancedEsm: true },
    },
    { format: 'cjs', syntax: 'es2021' },
  ],
});
