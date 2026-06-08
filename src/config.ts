import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPackageVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface McpServerConfig {
  apiKey: string;
  baseUrl: string;
  maxLimit: number;
  maxPages: number;
  debounceMs: number;
  userAgent: string;
}

export function loadConfig(): McpServerConfig {
  const apiKey = process.env.TRUSS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'TRUSS_API_KEY is required. Set it in the MCP host env block (never in tool arguments).'
    );
  }

  const baseUrl = (process.env.TRUSS_API_URL?.trim() || 'https://api.truss-security.com').replace(
    /\/+$/,
    ''
  );

  const version = readPackageVersion();

  return {
    apiKey,
    baseUrl,
    maxLimit: parsePositiveInt(process.env.TRUSS_MCP_MAX_LIMIT, 50),
    maxPages: parsePositiveInt(process.env.TRUSS_MCP_MAX_PAGES, 3),
    debounceMs: parsePositiveInt(process.env.TRUSS_MCP_DEBOUNCE_MS, 200),
    userAgent: `truss-mcp/${version}`,
  };
}
