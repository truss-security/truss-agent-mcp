import Anthropic from '@anthropic-ai/sdk';
import { mcpTools } from '@anthropic-ai/sdk/helpers/beta/mcp';
import type { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages/messages.mjs';
import { asMcpClientLike } from '../mcp-client-adapter.js';
import type { McpSession } from '../mcp-session.js';
import type { ToolTraceCallbacks, ToolTraceEvent } from '../tool-trace.js';
import type { ResolvedLlm } from './resolve.js';

export interface AnthropicTurnState {
  provider: 'anthropic';
  messages: BetaMessageParam[];
}

function extractTextFromBlocks(
  content: ReadonlyArray<{ type: string; text?: string }>
): string {
  return content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text ?? '')
    .join('\n')
    .trim();
}

export async function runAnthropicTurn(
  llm: ResolvedLlm,
  session: McpSession | null,
  state: AnthropicTurnState | undefined,
  userInput: string,
  systemPrompt: string,
  callbacks?: ToolTraceCallbacks,
  toolEvents: ToolTraceEvent[] = []
): Promise<{ state: AnthropicTurnState; displayText: string; toolEvents: ToolTraceEvent[] }> {
  const anthropic = new Anthropic({ apiKey: llm.apiKey });
  const prior = state?.messages ?? [];
  const updatedMessages: BetaMessageParam[] = [...prior, { role: 'user', content: userInput }];
  const collectedEvents = [...toolEvents];

  const wrappedCallbacks: ToolTraceCallbacks = {
    onToolStart: (name, argsSummary) => {
      callbacks?.onToolStart?.(name, argsSummary);
    },
    onToolEnd: (event) => {
      collectedEvents.push(event);
      callbacks?.onToolEnd?.(event);
    },
    onSpinnerLabel: callbacks?.onSpinnerLabel,
  };

  if (session) {
    const response = await anthropic.beta.messages.toolRunner({
      model: llm.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: updatedMessages,
      tools: mcpTools(session.tools, asMcpClientLike(session.client, wrappedCallbacks)),
    });

    return {
      state: {
        provider: 'anthropic',
        messages: [...updatedMessages, { role: 'assistant', content: response.content }],
      },
      displayText: extractTextFromBlocks(response.content),
      toolEvents: collectedEvents,
    };
  }

  const askMessages: MessageParam[] = updatedMessages.map((message) => ({
    role: message.role,
    content:
      typeof message.content === 'string'
        ? message.content
        : extractTextFromBlocks(message.content as ReadonlyArray<{ type: string; text?: string }>),
  }));

  const response = await anthropic.messages.create({
    model: llm.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: askMessages,
  });

  const assistantText = extractTextFromBlocks(response.content);

  return {
    state: {
      provider: 'anthropic',
      messages: [...updatedMessages, { role: 'assistant', content: assistantText }],
    },
    displayText: assistantText,
    toolEvents: collectedEvents,
  };
}
