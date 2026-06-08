import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { AskConfig } from './config.js';
import { connectMcpSession } from './mcp-session.js';
import { printAssistantResponse } from './print-response.js';
import { runTurn, type TurnState } from './run-turn.js';
import { getProvider } from './providers/catalog.js';
import { withSpinner } from './spinner.js';
import { getSystemPrompt, type ReplMode } from './system-prompt.js';

const EXIT_COMMANDS = new Set(['exit', 'quit', ':q']);

const BANNERS: Record<ReplMode, string> = {
  search: 'Truss Search — threat intelligence retrieval',
  ask: 'Truss Ask — general assistant',
};

const PROMPTS: Record<ReplMode, string> = {
  search: 'truss search> ',
  ask: 'truss ask> ',
};

function isExitCommand(line: string): boolean {
  return EXIT_COMMANDS.has(line.trim().toLowerCase());
}

export async function runRepl(config: AskConfig, mode: ReplMode): Promise<void> {
  const session = await connectMcpSession(config);
  const systemPrompt = getSystemPrompt(mode);
  let turnState: TurnState | undefined;
  let closing = false;

  const shutdown = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    await session.close();
  };

  process.on('SIGINT', () => {
    console.log('\n');
    void shutdown().then(() => process.exit(0));
  });

  console.log(BANNERS[mode]);
  const providerLabel = getProvider(config.provider)?.label ?? config.provider;
  console.log(`LLM: ${providerLabel} | Model: ${config.model} | Tools: ${session.tools.length}`);
  console.log('Type a question, or: exit | quit | :q\n');

  const rl = readline.createInterface({ input, output });
  const prompt = PROMPTS[mode];

  try {
    while (!closing) {
      const line = await rl.question(prompt);
      if (isExitCommand(line)) break;
      if (!line.trim()) continue;

      try {
        const result = await withSpinner('Thinking...', () =>
          runTurn(config, session, turnState, line, systemPrompt)
        );
        turnState = result.state;
        printAssistantResponse(result.displayText);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`\nError: ${message}\n`);
      }
    }
  } finally {
    rl.close();
    await shutdown();
  }
}
