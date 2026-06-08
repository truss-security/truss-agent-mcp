import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('runInit', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'truss-mcp-init-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates .env from env.example when missing', async () => {
    const { runInit } = await import('../src/ask/init.ts');
    const code = await runInit(tempDir, import.meta.url, { interactive: false });
    assert.equal(code, 0);
    const envPath = join(tempDir, '.env');
    assert.equal(existsSync(envPath), true);
    const content = readFileSync(envPath, 'utf8');
    assert.match(content, /TRUSS_API_KEY/);
    assert.match(content, /ANTHROPIC_API_KEY/);
  });

  it('reports complete when fully configured (non-interactive)', async () => {
    const envPath = join(tempDir, '.env');
    writeFileSync(
      envPath,
      'TRUSS_API_KEY=truss-key\nLLM_PROVIDER=anthropic\nLLM_MODEL=claude-sonnet-4-6\nANTHROPIC_API_KEY=anthropic-key\n'
    );
    const { runInit } = await import('../src/ask/init.ts');
    const code = await runInit(tempDir, import.meta.url, { interactive: false });
    assert.equal(code, 0);
    assert.match(readFileSync(envPath, 'utf8'), /TRUSS_API_KEY=truss-key/);
  });

  it('does not overwrite existing key values in .env', async () => {
    const envPath = join(tempDir, '.env');
    writeFileSync(envPath, 'TRUSS_API_KEY=existing\n');
    const { runInit } = await import('../src/ask/init.ts');
    const code = await runInit(tempDir, import.meta.url, { interactive: false });
    assert.equal(code, 0);
    assert.match(readFileSync(envPath, 'utf8'), /TRUSS_API_KEY=existing/);
  });
});
