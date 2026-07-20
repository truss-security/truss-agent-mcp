import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENV_KEYS = [
  'TRUSS_API_KEY',
  'LLM_PROVIDER',
  'LLM_MODEL',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_MODEL',
  'TRUSS_API_URL',
  'TRUSS_MCP_URL',
  'TRUSS_MCP_TRANSPORT',
  'TRUSS_MCP_OAUTH_TOKEN_FILE',
  'TRUSS_MCP_SERVER_PATH',
  'TRUSS_ASK_SERVER_PATH',
  'TRUSS_MCP_MAX_LIMIT',
  'TRUSS_MCP_MAX_PAGES',
  'TRUSS_MCP_DEBOUNCE_MS',
] as const;

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const serverPath = join(packageRoot, 'dist', 'truss-cli.js');

describe('loadAskConfig', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
    }
    process.env.TRUSS_API_KEY = 'test-truss-key';
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.TRUSS_MCP_SERVER_PATH = serverPath;
    delete process.env.LLM_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_MODEL;
    delete process.env.TRUSS_API_URL;
    delete process.env.TRUSS_MCP_URL;
    delete process.env.TRUSS_MCP_TRANSPORT;
    delete process.env.TRUSS_MCP_OAUTH_TOKEN_FILE;
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

  it('throws when Anthropic API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const { loadAskConfig } = await import('../src/ask/config.ts');
    assert.throws(() => loadAskConfig(), /ANTHROPIC_API_KEY is required/);
  });

  it('uses defaults for model and MCP caps', async () => {
    const { loadAskConfig } = await import('../src/ask/config.ts');
    const config = loadAskConfig(import.meta.url);

    assert.equal(config.trussApiKey, 'test-truss-key');
    assert.equal(config.provider, 'anthropic');
    assert.equal(config.llmApiKey, 'test-anthropic-key');
    assert.equal(config.model, 'claude-haiku-4-5');
    assert.equal(config.trussApiUrl, 'https://api.truss-security.com');
    assert.equal(config.maxLimit, 50);
    assert.equal(config.maxPages, 3);
    assert.equal(config.debounceMs, 200);
    assert.equal(config.serverCliPath, serverPath);
    assert.equal(config.mcpTransport, 'stdio');
    assert.equal(config.mcpUrl, 'https://api.truss-security.com/mcp');
  });

  it('uses remote transport when TRUSS_MCP_OAUTH_TOKEN_FILE is set', async () => {
    process.env.TRUSS_MCP_OAUTH_TOKEN_FILE = '/tmp/truss-mcp-token';
    delete process.env.TRUSS_API_KEY;
    const { loadAskConfig } = await import('../src/ask/config.ts');
    const config = loadAskConfig(import.meta.url);
    assert.equal(config.mcpTransport, 'remote');
    assert.equal(config.oauthTokenFile, '/tmp/truss-mcp-token');
    assert.equal(config.trussApiKey, '');
  });

  it('throws when remote transport lacks token file', async () => {
    process.env.TRUSS_MCP_TRANSPORT = 'remote';
    delete process.env.TRUSS_MCP_OAUTH_TOKEN_FILE;
    const { loadAskConfig } = await import('../src/ask/config.ts');
    assert.throws(() => loadAskConfig(), /TRUSS_MCP_OAUTH_TOKEN_FILE/);
  });

  it('respects LLM_MODEL override', async () => {
    process.env.LLM_MODEL = 'claude-opus-4-6';
    const { loadAskConfig } = await import('../src/ask/config.ts');
    const config = loadAskConfig(import.meta.url);
    assert.equal(config.model, 'claude-opus-4-6');
  });

  it('loads OpenAI provider when configured', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.LLM_MODEL = 'gpt-4o-mini';
    delete process.env.ANTHROPIC_API_KEY;
    const { loadAskConfig } = await import('../src/ask/config.ts');
    const config = loadAskConfig(import.meta.url);
    assert.equal(config.provider, 'openai');
    assert.equal(config.llmApiKey, 'test-openai-key');
    assert.equal(config.model, 'gpt-4o-mini');
  });
});
