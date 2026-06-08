import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import type { FunctionParameters } from 'openai/resources/shared';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { McpSession } from '../mcp-session.js';
import type { ResolvedLlm } from './resolve.js';

export interface OpenAiTurnState {
  provider: 'openai';
  messages: ChatCompletionMessageParam[];
}

const MAX_TOOL_ROUNDS = 12;

function mcpToolsToOpenAi(tools: Tool[]): ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description ?? tool.name,
      parameters: (tool.inputSchema as FunctionParameters) ?? {
        type: 'object',
        properties: {},
      },
    },
  }));
}

function toolResultText(result: Record<string, unknown>): string {
  if (Array.isArray(result.content)) {
    const parts = result.content
      .filter((block) => typeof block === 'object' && block !== null && 'text' in block)
      .map((block) => String((block as { text?: string }).text ?? ''));
    if (parts.length > 0) return parts.join('\n');
  }
  return JSON.stringify(result);
}

export async function runOpenAiTurn(
  llm: ResolvedLlm,
  session: McpSession,
  state: OpenAiTurnState | undefined,
  userInput: string,
  systemPrompt: string
): Promise<{ state: OpenAiTurnState; displayText: string }> {
  const openai = new OpenAI({ apiKey: llm.apiKey });
  const openaiTools = mcpToolsToOpenAi(session.tools);
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(state?.messages ?? []),
    { role: 'user', content: userInput },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await openai.chat.completions.create({
      model: llm.model,
      max_tokens: 4096,
      messages,
      tools: openaiTools,
    });

    const choice = response.choices[0];
    if (!choice?.message) {
      throw new Error('OpenAI returned an empty response');
    }

    const assistantMessage = choice.message;
    messages.push(assistantMessage);

    const toolCalls = assistantMessage.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;
        const args = toolCall.function.arguments
          ? (JSON.parse(toolCall.function.arguments) as Record<string, unknown>)
          : {};
        const result = await session.client.callTool({
          name: toolCall.function.name,
          arguments: args,
        });
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResultText(result as Record<string, unknown>),
        });
      }
      continue;
    }

    const displayText = assistantMessage.content?.trim() ?? '';
    return {
      state: { provider: 'openai', messages: messages.slice(1) },
      displayText,
    };
  }

  throw new Error('OpenAI tool loop exceeded maximum rounds');
}
