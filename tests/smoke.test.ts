import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const cliPath = join(rootDir, 'dist', 'cli.js');

describe('smoke', () => {
  it('starts stdio server without immediate exit when TRUSS_API_KEY is set', async () => {
    const child = spawn(process.execPath, [cliPath], {
      env: { ...process.env, TRUSS_API_KEY: 'smoke-test-key' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const exitCode = await new Promise<number | null>((resolve) => {
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        resolve(null);
      }, 1500);

      child.on('exit', (code) => {
        clearTimeout(timer);
        resolve(code ?? 1);
      });
    });

    assert.equal(exitCode, null, 'server should stay running on stdio until terminated');
  });

  it('exits with error when TRUSS_API_KEY is missing', async () => {
    const env = { ...process.env };
    delete env.TRUSS_API_KEY;

    const child = spawn(process.execPath, [cliPath], { env, stdio: 'pipe' });
    const [exitCode, stderr] = await Promise.all([
      new Promise<number | null>((resolve) => {
        child.on('exit', (code) => resolve(code));
      }),
      new Promise<string>((resolve) => {
        let data = '';
        child.stderr?.on('data', (chunk) => {
          data += String(chunk);
        });
        child.on('exit', () => resolve(data));
      }),
    ]);

    assert.notEqual(exitCode, 0);
    assert.match(stderr, /TRUSS_API_KEY is required/);
  });
});
