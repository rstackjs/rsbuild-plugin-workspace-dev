import fs from 'fs';
import json5 from 'json5';

import type { PackageWithScripts } from './types.js';

async function pathExists(path: string) {
  return fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false);
}

export const readJson = async <T>(jsonFileAbsPath: string): Promise<T> => {
  if (!(await pathExists(jsonFileAbsPath))) {
    return {} as T;
  }

  const content = await fs.promises.readFile(jsonFileAbsPath, 'utf-8');
  const json: T = json5.parse(content);
  return json;
};

export const readPackageJson = async (
  pkgJsonFilePath: string,
): Promise<PackageWithScripts['packageJson']> => {
  return readJson<PackageWithScripts['packageJson']>(pkgJsonFilePath);
};

export const isDebug =
  process.env.DEBUG === 'rsbuild' || process.env.DEBUG === '*';
