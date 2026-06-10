import type { MCPCallToolResultLike, MCPClientLike } from '@anthropic-ai/sdk/helpers/beta/mcp';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  toolResultText,
  traceToolCall,
  type ToolTraceCallbacks,
} from './tool-trace.js';

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

export function asMcpClientLike(
  client: Client,
  callbacks?: ToolTraceCallbacks
): MCPClientLike {
  return {
    callTool: async (params) => {
      const args = (params.arguments ?? {}) as Record<string, unknown>;
      const { result } = await traceToolCall(
        params.name,
        args,
        async () => {
          const raw = await client.callTool({
            name: params.name,
            arguments: args,
          });
          return raw as Record<string, unknown>;
        },
        callbacks
      );
      return normalizeCallToolResult(result);
    },
  };
}

export { toolResultText };
