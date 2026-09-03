// Configuration guide: https://rstack.rs/config
import { pluginReact } from '@rsbuild/plugin-react';
import { define } from 'rstack';

define.lib({
  source: {
    entry: {
      index: ['./src/**'],
    },
  },
  lib: [
    {
      bundle: false,
      dts: true,
    },
  ],
  output: {
    target: 'web',
  },
  plugins: [pluginReact()],
});
