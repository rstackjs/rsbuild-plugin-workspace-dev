import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      syntax: 'es6',
      dts: true,
    },
    {
      format: 'cjs',
      syntax: 'es6',
    },
  ],
});
