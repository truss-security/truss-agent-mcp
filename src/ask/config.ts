import { resolveLlmFromEnv } from './providers/resolve.js';
import { resolveServerCliPath } from './resolve-server-path.js';
import type { LlmProviderId } from './providers/catalog.js';
import { defaultMcpUrlFromEnv } from '../remote/validate-remote.js';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for truss CLI. Set it in your environment or .env file.`);
  }
  return value;
}

export type McpTransportMode = 'stdio' | 'remote';

export interface AskConfig {
  /** Present for stdio mode; may be empty when using remote OAuth. */
  trussApiKey: string;
  provider: LlmProviderId;
  llmApiKey: string;
  llmApiKeyEnv: string;
  model: string;
  trussApiUrl: string;
  serverCliPath: string;
  maxLimit: number;
  maxPages: number;
  debounceMs: number;
  /** How the REPL connects to MCP tools. */
  mcpTransport: McpTransportMode;
  /** Hosted MCP URL when mcpTransport is remote. */
  mcpUrl: string;
  /** Path to Bearer token file from validate-remote --save-token. */
  oauthTokenFile?: string;
}

function resolveMcpTransport(): McpTransportMode {
  const explicit = process.env.TRUSS_MCP_TRANSPORT?.trim().toLowerCase();
  if (explicit === 'remote') return 'remote';
  if (explicit === 'stdio') return 'stdio';
  if (process.env.TRUSS_MCP_OAUTH_TOKEN_FILE?.trim()) return 'remote';
  return 'stdio';
}

export function loadAskConfig(fromModuleUrl?: string): AskConfig {
  const llm = resolveLlmFromEnv();
  const mcpTransport = resolveMcpTransport();
  const oauthTokenFile = process.env.TRUSS_MCP_OAUTH_TOKEN_FILE?.trim() || undefined;

  if (mcpTransport === 'remote' && !oauthTokenFile) {
    throw new Error(
      'Remote MCP search requires TRUSS_MCP_OAUTH_TOKEN_FILE (Bearer token from: truss-mcp validate-remote --save-token PATH).'
    );
  }

  const trussApiKey =
    mcpTransport === 'remote'
      ? (process.env.TRUSS_API_KEY?.trim() || '')
      : requireEnv('TRUSS_API_KEY');

  return {
    trussApiKey,
    provider: llm.provider,
    llmApiKey: llm.apiKey,
    llmApiKeyEnv: llm.apiKeyEnv,
    model: llm.model,
    trussApiUrl: (process.env.TRUSS_API_URL?.trim() || 'https://api.truss-security.com').replace(
      /\/+$/,
      ''
    ),
    serverCliPath: resolveServerCliPath(fromModuleUrl ?? import.meta.url),
    maxLimit: parsePositiveInt(process.env.TRUSS_MCP_MAX_LIMIT, 50),
    maxPages: parsePositiveInt(process.env.TRUSS_MCP_MAX_PAGES, 3),
    debounceMs: parsePositiveInt(process.env.TRUSS_MCP_DEBOUNCE_MS, 200),
    mcpTransport,
    mcpUrl: defaultMcpUrlFromEnv(),
    oauthTokenFile,
  };
}
