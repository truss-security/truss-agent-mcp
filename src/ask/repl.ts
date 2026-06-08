import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { AskConfig } from './config.js';
import { connectMcpSession, type McpSession } from './mcp-session.js';
import { printAssistantResponse } from './print-response.js';
import { parseReplInput, REPL_HELP_LINES } from './repl-commands.js';
import { runTurn, type TurnState } from './run-turn.js';
import { getProvider } from './providers/catalog.js';
import { withSpinner } from './spinner.js';
import { getSystemPrompt, type ReplMode } from './system-prompt.js';

const MODE_BANNERS: Record<ReplMode, string> = {
  search: 'Truss Search — live Truss threat intelligence (MCP tools enabled)',
  ask: 'Truss Ask — general assistant (no live Truss queries)',
};

const PROMPTS: Record<ReplMode, string> = {
  search: 'truss search> ',
  ask: 'truss ask> ',
};

function printModeHeader(config: AskConfig, mode: ReplMode, toolCount: number): void {
  const providerLabel = getProvider(config.provider)?.label ?? config.provider;
  const toolsLabel = mode === 'search' ? `${toolCount} Truss MCP tools` : 'none (use :search for live data)';
  console.log(`\n${MODE_BANNERS[mode]}`);
  console.log(`LLM: ${providerLabel} | Model: ${config.model} | Tools: ${toolsLabel}`);
  for (const line of REPL_HELP_LINES) {
    console.log(line);
  }
  console.log('');
}

export async function runRepl(config: AskConfig, initialMode: ReplMode): Promise<void> {
  let mode = initialMode;
  let session: McpSession | null = null;
  const stateByMode: Partial<Record<ReplMode, TurnState>> = {};
  let closing = false;

  const openSearchSession = async (): Promise<McpSession> => {
    if (!session) {
      session = await connectMcpSession(config);
    }
    return session;
  };

  const closeSearchSession = async (): Promise<void> => {
    if (session) {
      await session.close();
      session = null;
    }
  };

  const switchMode = async (newMode: ReplMode): Promise<void> => {
    if (newMode === mode) {
      console.log(`\nAlready in ${newMode} mode.\n`);
      return;
    }
    if (newMode === 'search') {
      await openSearchSession();
    } else {
      await closeSearchSession();
    }
    mode = newMode;
    const toolCount = newMode === 'search' && session ? session.tools.length : 0;
    printModeHeader(config, mode, toolCount);
  };

  const shutdown = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    await closeSearchSession();
  };

  process.on('SIGINT', () => {
    console.log('\n');
    void shutdown().then(() => process.exit(0));
  });

  let initialToolCount = 0;
  if (mode === 'search') {
    const active = await openSearchSession();
    initialToolCount = active.tools.length;
  }

  printModeHeader(config, mode, initialToolCount);

  const rl = readline.createInterface({ input, output });

  try {
    while (!closing) {
      const line = await rl.question(PROMPTS[mode]);
      const input_ = parseReplInput(line);

      if (input_.type === 'empty') continue;
      if (input_.type === 'exit') break;
      if (input_.type === 'switch') {
        await switchMode(input_.mode);
        continue;
      }

      try {
        const result = await withSpinner('Thinking...', () =>
          runTurn(
            config,
            mode,
            session,
            stateByMode[mode],
            input_.text,
            getSystemPrompt(mode)
          )
        );
        stateByMode[mode] = result.state;
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
