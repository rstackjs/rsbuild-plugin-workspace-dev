import { getPackagesSync } from '@manypkg/get-packages';
import { expect, it, rs } from '@rstest/core';
import { exec, spawn } from 'child_process';
import { readPackageJson } from '../src/utils';
import { WorkspaceDevRunner } from '../src/workspace-dev';

const scripts = {
  a: 'dev a',
  b: 'dev b',
  c: 'dev c',
  d: 'dev d',
  e: 'dev e',
};
rs.mock('@manypkg/get-packages', () => {
  return {
    getPackagesSync: () => {
      const packages = [
        {
          packageJson: {
            name: 'a',
            scripts: {
              dev: scripts.a,
            },
            dependencies: {
              b: 'workspace:*',
            },
          },
          dir: 'a',
        },
        {
          packageJson: {
            name: 'b',
            scripts: {
              dev: scripts.b,
            },
            dependencies: {
              c: 'workspace:*',
              d: 'workspace:*',
            },
          },
          dir: 'b',
        },
        {
          packageJson: {
            name: 'c',
            scripts: {
              dev: scripts.c,
            },
          },
          dir: 'c',
        },
        {
          packageJson: {
            name: 'd',
            dependencies: {
              e: 'workspace:*',
            },
            scripts: {
              dev: scripts.d,
            },
          },
          dir: 'd',
        },
        {
          packageJson: {
            name: 'e',
            scripts: {
              dev: scripts.e,
            },
          },
          dir: 'e',
        },
      ];
      return { packages };
    },
  };
});

rs.mock('../src/utils', () => ({
  readPackageJson: () => {
    // @ts-expect-error
    const { packages } = getPackagesSync();
    const hostPackage = packages.find((pkg) => pkg.packageJson.name === 'a')!;

    return hostPackage.packageJson;
  },
}));

rs.mock('child_process', () => ({
  spawn: (cmd: string, args: string[], options: any) => {
    // @ts-expect-error
    const { packages } = getPackagesSync();
    const cwd = options.cwd;
    const devScript =
      // @ts-expect-error
      packages.find((pkg) => pkg.dir === cwd)!.packageJson.scripts['dev'];

    const mockStdout = {
      on: rs.fn((event, callback) => {
        if (event === 'data') {
          callback(devScript);
        }
      }),
    };
    const mockStderr = { on: rs.fn() };

    const mockChildProcess = {
      stdout: mockStdout,
      stderr: mockStderr,
      on: rs.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0));
        }
      }),
    };
    return mockChildProcess;
  },
}));

it('test', async () => {
  const order: string[] = [];
  const matchFn = (stdout: string, packageName: keyof typeof scripts) => {
    const matched = stdout.includes(scripts[packageName]);
    if (matched) {
      order.push(packageName);
    }
    return matched;
  };
  const runner = new WorkspaceDevRunner({
    projects: {
      a: {
        match: (stdout) => matchFn(stdout, 'a'),
      },
      b: {
        match: (stdout) => matchFn(stdout, 'b'),
      },
      c: {
        match: (stdout) => matchFn(stdout, 'c'),
      },
      d: {
        match: (stdout) => matchFn(stdout, 'd'),
      },
      e: {
        match: (stdout) => matchFn(stdout, 'e'),
      },
    },
  });
  await runner.init();
  await runner.start();

  expect(order).toEqual(['c', 'e', 'd', 'b']);
});
