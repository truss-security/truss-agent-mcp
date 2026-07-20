import { readFileSync } from 'node:fs';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { AskConfig } from './config.js';

export interface McpSession {
  client: Client;
  tools: Tool[];
  close: () => Promise<void>;
}

function readBearerToken(tokenFilePath: string): string {
  const raw = readFileSync(tokenFilePath, 'utf8').trim();
  if (!raw) {
    throw new Error(`OAuth token file is empty: ${tokenFilePath}`);
  }
  // Allow files that store only the token, or "Bearer <token>".
  return raw.replace(/^Bearer\s+/i, '').trim();
}

async function connectStdioSession(config: AskConfig): Promise<McpSession> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [config.serverCliPath, 'mcp'],
    env: {
      TRUSS_API_KEY: config.trussApiKey,
      TRUSS_API_URL: config.trussApiUrl,
      TRUSS_MCP_MAX_LIMIT: String(config.maxLimit),
      TRUSS_MCP_MAX_PAGES: String(config.maxPages),
      TRUSS_MCP_DEBOUNCE_MS: String(config.debounceMs),
    },
  });

  const client = new Client({ name: 'truss-cli', version: '1.0.0' });
  await client.connect(transport);

  const { tools } = await client.listTools();

  return {
    client,
    tools,
    close: async () => {
      await transport.close();
    },
  };
}

async function connectRemoteSession(config: AskConfig): Promise<McpSession> {
  if (!config.oauthTokenFile) {
    throw new Error('Remote MCP session requires oauthTokenFile.');
  }

  const token = readBearerToken(config.oauthTokenFile);
  const transport = new StreamableHTTPClientTransport(new URL(config.mcpUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const client = new Client({ name: 'truss-cli-remote', version: '1.0.0' });
  await client.connect(transport);

  const { tools } = await client.listTools();

  return {
    client,
    tools,
    close: async () => {
      await transport.close();
    },
  };
}

export async function connectMcpSession(config: AskConfig): Promise<McpSession> {
  if (config.mcpTransport === 'remote') {
    return connectRemoteSession(config);
  }
  return connectStdioSession(config);
}
