import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { AskConfig } from './config.js';

export interface McpSession {
  client: Client;
  tools: Tool[];
  close: () => Promise<void>;
}

export async function connectMcpSession(config: AskConfig): Promise<McpSession> {
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
