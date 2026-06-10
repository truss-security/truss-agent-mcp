import type { AskConfig } from './config.js';
import type { McpSession } from './mcp-session.js';
import { runAnthropicTurn, type AnthropicTurnState } from './providers/anthropic-runner.js';
import { runOpenAiTurn, type OpenAiTurnState } from './providers/openai-runner.js';
import { buildTurnDiagnostics, type ToolTraceCallbacks, type TurnDiagnostics } from './tool-trace.js';

export type TurnState = AnthropicTurnState | OpenAiTurnState;

export interface TurnResult {
  state: TurnState;
  displayText: string;
  diagnostics?: TurnDiagnostics;
}

export async function runTurn(
  config: AskConfig,
  session: McpSession,
  state: TurnState | undefined,
  userInput: string,
  systemPrompt: string,
  callbacks?: ToolTraceCallbacks
): Promise<TurnResult> {
  const llm = {
    provider: config.provider,
    model: config.model,
    apiKey: config.llmApiKey,
    apiKeyEnv: config.llmApiKeyEnv,
  };

  if (config.provider === 'openai') {
    const result = await runOpenAiTurn(
      llm,
      session,
      state?.provider === 'openai' ? state : undefined,
      userInput,
      systemPrompt,
      callbacks
    );
    return {
      state: result.state,
      displayText: result.displayText,
      diagnostics: buildTurnDiagnostics(result.toolEvents),
    };
  }

  const result = await runAnthropicTurn(
    llm,
    session,
    state?.provider === 'anthropic' ? state : undefined,
    userInput,
    systemPrompt,
    callbacks
  );
  return {
    state: result.state,
    displayText: result.displayText,
    diagnostics: buildTurnDiagnostics(result.toolEvents),
  };
}
