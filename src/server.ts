import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { MCP_HOST_INSTRUCTIONS } from './instructions.js';
import { readPackageVersion } from './lib/package-version.js';
import { registerTrussTools } from './tools/register-tools.js';

export async function runServer(): Promise<void> {
  const config = loadConfig();
  const version = readPackageVersion();

  const server = new McpServer(
    {
      name: 'truss-mcp',
      version,
    },
    {
      instructions: MCP_HOST_INSTRUCTIONS,
    }
  );

  registerTrussTools(server, config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
