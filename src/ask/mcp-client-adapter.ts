import type { MCPCallToolResultLike, MCPClientLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

function normalizeCallToolResult(result: Record<string, unknown>): MCPCallToolResultLike {
  if (Array.isArray(result.content)) {
    return {
      content: result.content as MCPCallToolResultLike['content'],
      structuredContent:
        typeof result.structuredContent === 'object' && result.structuredContent !== null
          ? (result.structuredContent as object)
          : undefined,
      isError: result.isError === true,
    };
  }

  if ('toolResult' in result) {
    return {
      content: [{ type: 'text', text: JSON.stringify(result.toolResult) }],
      isError: result.isError === true,
    };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
    isError: result.isError === true,
  };
}

export function asMcpClientLike(client: Client): MCPClientLike {
  return {
    callTool: async (params) => {
      const result = await client.callTool({
        name: params.name,
        arguments: params.arguments,
      });
      return normalizeCallToolResult(result as Record<string, unknown>);
    },
  };
}
