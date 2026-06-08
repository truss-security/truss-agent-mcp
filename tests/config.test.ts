import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

const ENV_KEYS = [
  'TRUSS_API_KEY',
  'TRUSS_API_URL',
  'TRUSS_MCP_MAX_LIMIT',
  'TRUSS_MCP_MAX_PAGES',
  'TRUSS_MCP_DEBOUNCE_MS',
] as const;

describe('loadConfig', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
    }
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
    const { loadConfig } = await import('../src/config.ts');
    assert.throws(() => loadConfig(), /TRUSS_API_KEY is required/);
  });

  it('throws when TRUSS_API_KEY is blank', async () => {
    process.env.TRUSS_API_KEY = '   ';
    const { loadConfig } = await import('../src/config.ts');
    assert.throws(() => loadConfig(), /TRUSS_API_KEY is required/);
  });

  it('uses default base URL and MCP caps', async () => {
    process.env.TRUSS_API_KEY = 'test-key';
    delete process.env.TRUSS_API_URL;
    delete process.env.TRUSS_MCP_MAX_LIMIT;
    delete process.env.TRUSS_MCP_MAX_PAGES;
    delete process.env.TRUSS_MCP_DEBOUNCE_MS;

    const { loadConfig } = await import('../src/config.ts');
    const config = loadConfig();

    assert.equal(config.apiKey, 'test-key');
    assert.equal(config.baseUrl, 'https://api.truss-security.com');
    assert.equal(config.maxLimit, 50);
    assert.equal(config.maxPages, 3);
    assert.equal(config.debounceMs, 200);
    assert.match(config.userAgent, /^truss-agent-mcp\//);
  });

  it('strips trailing slashes from TRUSS_API_URL', async () => {
    process.env.TRUSS_API_KEY = 'test-key';
    process.env.TRUSS_API_URL = 'https://api-test.truss-security.com///';

    const { loadConfig } = await import('../src/config.ts');
    const config = loadConfig();

    assert.equal(config.baseUrl, 'https://api-test.truss-security.com');
  });

  it('parses custom MCP cap env vars', async () => {
    process.env.TRUSS_API_KEY = 'test-key';
    process.env.TRUSS_MCP_MAX_LIMIT = '100';
    process.env.TRUSS_MCP_MAX_PAGES = '5';
    process.env.TRUSS_MCP_DEBOUNCE_MS = '500';

    const { loadConfig } = await import('../src/config.ts');
    const config = loadConfig();

    assert.equal(config.maxLimit, 100);
    assert.equal(config.maxPages, 5);
    assert.equal(config.debounceMs, 500);
  });
});
