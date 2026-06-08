import type { AskConfig } from './config.js';
import type { McpSession } from './mcp-session.js';
import { runAnthropicTurn, type AnthropicTurnState } from './providers/anthropic-runner.js';
import { runOpenAiTurn, type OpenAiTurnState } from './providers/openai-runner.js';
import type { ReplMode } from './system-prompt.js';

export type TurnState = AnthropicTurnState | OpenAiTurnState;

export interface TurnResult {
  state: TurnState;
  displayText: string;
}

export async function runTurn(
  config: AskConfig,
  mode: ReplMode,
  session: McpSession | null,
  state: TurnState | undefined,
  userInput: string,
  systemPrompt: string
): Promise<TurnResult> {
  const llm = {
    provider: config.provider,
    model: config.model,
    apiKey: config.llmApiKey,
    apiKeyEnv: config.llmApiKeyEnv,
  };

  const mcpSession = mode === 'search' ? session : null;

  if (config.provider === 'openai') {
    return runOpenAiTurn(
      llm,
      mcpSession,
      state?.provider === 'openai' ? state : undefined,
      userInput,
      systemPrompt
    );
  }

  return runAnthropicTurn(
    llm,
    mcpSession,
    state?.provider === 'anthropic' ? state : undefined,
    userInput,
    systemPrompt
  );
}
