// Configuration guide: https://rstack.rs/config
import { define } from 'rstack';

define.lib({
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
