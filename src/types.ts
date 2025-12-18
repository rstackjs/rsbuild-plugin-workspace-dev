import type { Package } from '@manypkg/get-packages';

export interface PackageWithScripts extends Package {
  packageJson: Package['packageJson'] & {
    scripts?: Record<string, string>;
  };
}
