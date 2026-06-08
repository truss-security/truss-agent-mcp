import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_KEYS = [
  'TRUSS_API_KEY',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'TRUSS_API_URL',
  'TRUSS_ASK_SERVER_PATH',
  'TRUSS_MCP_MAX_LIMIT',
  'TRUSS_MCP_MAX_PAGES',
  'TRUSS_MCP_DEBOUNCE_MS',
] as const;

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(packageRoot, 'dist', 'cli.js');

describe('loadAskConfig', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
    }
    process.env.TRUSS_API_KEY = 'test-truss-key';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.TRUSS_ASK_SERVER_PATH = serverPath;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.TRUSS_API_URL;
    delete process.env.TRUSS_MCP_MAX_LIMIT;
    delete process.env.TRUSS_MCP_MAX_PAGES;
    delete process.env.TRUSS_MCP_DEBOUNCE_MS;
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  it('throws when TRUSS_API_KEY is missing', async () => {
    delete process.env.TRUSS_API_KEY;
    const { loadAskConfig } = await import('../src/ask/config.ts');
    assert.throws(() => loadAskConfig(), /TRUSS_API_KEY is required/);
  });

  it('throws when ANTHROPIC_API_KEY is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { loadAskConfig } = await import('../src/ask/config.ts');
    assert.throws(() => loadAskConfig(), /ANTHROPIC_API_KEY is required/);
  });

  it('uses defaults for model and MCP caps', async () => {
    const { loadAskConfig } = await import('../src/ask/config.ts');
    const config = loadAskConfig(import.meta.url);

    assert.equal(config.trussApiKey, 'test-truss-key');
    assert.equal(config.anthropicApiKey, 'test-anthropic-key');
    assert.equal(config.model, 'claude-sonnet-4-6');
    assert.equal(config.trussApiUrl, 'https://api.truss-security.com');
    assert.equal(config.maxLimit, 50);
    assert.equal(config.maxPages, 3);
    assert.equal(config.debounceMs, 200);
    assert.equal(config.serverCliPath, serverPath);
  });

  it('respects ANTHROPIC_MODEL override', async () => {
    process.env.ANTHROPIC_MODEL = 'claude-opus-4-8';
    const { loadAskConfig } = await import('../src/ask/config.ts');
    const config = loadAskConfig(import.meta.url);
    assert.equal(config.model, 'claude-opus-4-8');
  });
});
