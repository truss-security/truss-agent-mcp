import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';
import type { FunctionParameters } from 'openai/resources/shared';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { McpSession } from '../mcp-session.js';
import {
  buildTurnDiagnostics,
  toolResultText,
  traceToolCall,
  type ToolTraceCallbacks,
  type ToolTraceEvent,
} from '../tool-trace.js';
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

export async function runOpenAiTurn(
  llm: ResolvedLlm,
  session: McpSession | null,
  state: OpenAiTurnState | undefined,
  userInput: string,
  systemPrompt: string,
  callbacks?: ToolTraceCallbacks
): Promise<{ state: OpenAiTurnState; displayText: string; toolEvents: ToolTraceEvent[] }> {
  const openai = new OpenAI({ apiKey: llm.apiKey });
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(state?.messages ?? []),
    { role: 'user', content: userInput },
  ];
  const toolEvents: ToolTraceEvent[] = [];

  if (!session) {
    const response = await openai.chat.completions.create({
      model: llm.model,
      max_tokens: 4096,
      messages,
    });
    const choice = response.choices[0];
    if (!choice?.message) {
      throw new Error('OpenAI returned an empty response');
    }
    messages.push(choice.message);
    return {
      state: { provider: 'openai', messages: messages.slice(1) },
      displayText: choice.message.content?.trim() ?? '',
      toolEvents,
    };
  }

  const openaiTools = mcpToolsToOpenAi(session.tools);

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
        const { result, event } = await traceToolCall(
          toolCall.function.name,
          args,
          () =>
            session.client.callTool({
              name: toolCall.function.name,
              arguments: args,
            }) as Promise<Record<string, unknown>>,
          callbacks
        );
        toolEvents.push(event);
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResultText(result),
        });
      }
      continue;
    }

    const displayText = assistantMessage.content?.trim() ?? '';
    return {
      state: { provider: 'openai', messages: messages.slice(1) },
      displayText,
      toolEvents,
    };
  }

  throw new Error('OpenAI tool loop exceeded maximum rounds');
}
