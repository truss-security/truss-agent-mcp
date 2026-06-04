import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { SERVER_INSTRUCTIONS } from './instructions.js';
import { registerTrussTools } from './tools/register-tools.js';

function readPackageVersion(): string {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(dir, '..', 'package.json'), 'utf8')) as {
      version?: string;
    };
    return pkg.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export async function runServer(): Promise<void> {
  const config = loadConfig();
  const version = readPackageVersion();

  const server = new McpServer(
    {
      name: 'truss-agent-mcp',
      version,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  registerTrussTools(server, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
