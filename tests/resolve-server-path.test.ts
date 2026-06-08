import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(packageRoot, 'dist', 'cli.js');

describe('resolveServerCliPath', () => {
  const savedOverride = process.env.TRUSS_ASK_SERVER_PATH;

  beforeEach(() => {
    delete process.env.TRUSS_ASK_SERVER_PATH;
  });

  afterEach(() => {
    if (savedOverride === undefined) {
      delete process.env.TRUSS_ASK_SERVER_PATH;
    } else {
      process.env.TRUSS_ASK_SERVER_PATH = savedOverride;
    }
  });

  it('resolves dist/cli.js from package root', async () => {
    const { resolveServerCliPath } = await import('../src/ask/resolve-server-path.ts');
    const resolved = resolveServerCliPath(import.meta.url);
    assert.equal(resolved, serverPath);
    assert.equal(existsSync(resolved), true);
  });

  it('honors TRUSS_ASK_SERVER_PATH override', async () => {
    process.env.TRUSS_ASK_SERVER_PATH = serverPath;
    const { resolveServerCliPath } = await import('../src/ask/resolve-server-path.ts');
    assert.equal(resolveServerCliPath(import.meta.url), serverPath);
  });

  it('throws when override path does not exist', async () => {
    process.env.TRUSS_ASK_SERVER_PATH = '/nonexistent/cli.js';
    const { resolveServerCliPath } = await import('../src/ask/resolve-server-path.ts');
    assert.throws(() => resolveServerCliPath(import.meta.url), /does not exist/);
  });
});
