import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

import { TEST_SUIT_STARTED } from './constant.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should run dev succeed', async ({ page }) => {
  const cwd = join(__dirname, 'app');

  return new Promise<void>((resolve, reject) => {
    let testCompleted = false;
    let serverStarted = false;

    const child = spawn('pnpm', ['run', 'dev'], {
      cwd,
      shell: true,
    });

    child.stdout.on('data', async (data) => {
      const output = data.toString();
      console.log(output);

      if (output.includes(TEST_SUIT_STARTED) && !serverStarted) {
        serverStarted = true;

        try {
          await page.goto('http://localhost:8080', {
            waitUntil: 'networkidle',
          });

          const utilsMessageLocator = page.locator('#utils-message');
          await expect(utilsMessageLocator).toHaveText(
            'Utils Message: hello utils1',
          );
          const utilsMessage2Locator = page.locator('#utils-message2');
          await expect(utilsMessage2Locator).toHaveText(
            'Utils Message2: hello utils2',
          );

          testCompleted = true;

          child.kill('SIGTERM');
          resolve();
        } catch (error) {
          testCompleted = true;
          child.kill('SIGTERM');
          reject(error);
        }
      }
    });

    child.stderr.on('data', (data) => {
      console.error('stderr:', data.toString());
    });

    child.on('exit', (code, signal) => {
      console.log(
        `Child process exited with code ${code} and signal ${signal}`,
      );
      if (!testCompleted) {
        reject(new Error(`Server exited unexpectedly with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error('Child process error:', error);
      reject(error);
    });
  });
});
