import Anthropic from '@anthropic-ai/sdk';
import { mcpTools } from '@anthropic-ai/sdk/helpers/beta/mcp';
import type { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs';
import type { McpSession } from '../mcp-session.js';
import { asMcpClientLike } from '../mcp-client-adapter.js';
import type { ResolvedLlm } from './resolve.js';

export interface AnthropicTurnState {
  provider: 'anthropic';
  messages: BetaMessageParam[];
}

export async function runAnthropicTurn(
  llm: ResolvedLlm,
  session: McpSession,
  state: AnthropicTurnState | undefined,
  userInput: string,
  systemPrompt: string
): Promise<{ state: AnthropicTurnState; displayText: string }> {
  const anthropic = new Anthropic({ apiKey: llm.apiKey });
  const prior = state?.messages ?? [];
  const updatedMessages: BetaMessageParam[] = [...prior, { role: 'user', content: userInput }];

  const response = await anthropic.beta.messages.toolRunner({
    model: llm.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: updatedMessages,
    tools: mcpTools(session.tools, asMcpClientLike(session.client)),
  });

  const text = response.content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();

  return {
    state: {
      provider: 'anthropic',
      messages: [...updatedMessages, { role: 'assistant', content: response.content }],
    },
    displayText: text,
  };
}
