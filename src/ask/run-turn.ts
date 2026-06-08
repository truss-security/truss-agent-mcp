import Anthropic from '@anthropic-ai/sdk';
import { mcpTools } from '@anthropic-ai/sdk/helpers/beta/mcp';
import type { BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs';
import type { AskConfig } from './config.js';
import { asMcpClientLike } from './mcp-client-adapter.js';
import type { McpSession } from './mcp-session.js';

export interface TurnResult {
  messages: BetaMessageParam[];
  content: Anthropic.Beta.BetaContentBlock[];
}

export async function runTurn(
  config: AskConfig,
  session: McpSession,
  messages: BetaMessageParam[],
  userInput: string,
  systemPrompt: string
): Promise<TurnResult> {
  const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
  const updatedMessages: BetaMessageParam[] = [
    ...messages,
    { role: 'user', content: userInput },
  ];

  const response = await anthropic.beta.messages.toolRunner({
    model: config.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: updatedMessages,
    tools: mcpTools(session.tools, asMcpClientLike(session.client)),
  });

  return {
    messages: [...updatedMessages, { role: 'assistant', content: response.content }],
    content: response.content,
  };
}
