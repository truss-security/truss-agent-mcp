import { resolveServerCliPath } from './resolve-server-path.js';

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

export interface AskConfig {
  trussApiKey: string;
  anthropicApiKey: string;
  model: string;
  trussApiUrl: string;
  serverCliPath: string;
  maxLimit: number;
  maxPages: number;
  debounceMs: number;
}

export function loadAskConfig(fromModuleUrl?: string): AskConfig {
  return {
    trussApiKey: requireEnv('TRUSS_API_KEY'),
    anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
    model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-6',
    trussApiUrl: (process.env.TRUSS_API_URL?.trim() || 'https://api.truss-security.com').replace(
      /\/+$/,
      ''
    ),
    serverCliPath: resolveServerCliPath(fromModuleUrl ?? import.meta.url),
    maxLimit: parsePositiveInt(process.env.TRUSS_MCP_MAX_LIMIT, 50),
    maxPages: parsePositiveInt(process.env.TRUSS_MCP_MAX_PAGES, 3),
    debounceMs: parsePositiveInt(process.env.TRUSS_MCP_DEBOUNCE_MS, 200),
  };
}
