import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { AskConfig } from './config.js';
import {
  buildRunSearchQuery,
  extractFilterFromText,
  isFilterConfirmation,
} from './extract-filter.js';
import { connectMcpSession, type McpSession } from './mcp-session.js';
import { printAssistantResponse } from './print-response.js';
import { shouldSuggestAskMode } from './classify-repl-intent.js';
import {
  ASK_MODE_HINT,
  buildPendingFilterHint,
  DRAFT_FILTER_HINT,
  formatFilterStatus,
  parseReplInput,
  REPL_HELP_LINES,
  REPL_QUICK_EXAMPLES,
} from './repl-commands.js';
import { runTurn, type TurnState } from './run-turn.js';
import { getProvider } from './providers/catalog.js';
import {
  defaultSearchWindow,
  extractSearchWindowFromText,
  formatSearchWindow,
  isExtendedSearchWindow,
  mergeSearchWindow,
  QUOTA_WINDOW_HINT,
  type SearchWindow,
} from './search-window.js';
import { withSpinner } from './spinner.js';
import { getSystemPrompt, type ReplMode } from './system-prompt.js';

const MODE_BANNERS: Record<ReplMode, string> = {
  search: 'Truss Search — live Truss threat intelligence (MCP tools enabled)',
  ask: 'Truss Ask — Truss FilterQL coaching (no live queries)',
};

const FIRST_RUN_TIPS: Record<ReplMode, string> = {
  search: 'Try: search: Find ransomware reports from the last 7 days',
  ask: 'Try: ask: Build a filter for Sandworm malware — then type run',
};

const SPINNER_LABELS: Record<ReplMode, string> = {
  search: 'Searching Truss…',
  ask: 'Building filter…',
};

function buildPrompt(mode: ReplMode, filterReady: boolean): string {
  if (mode === 'ask' && filterReady) return 'truss ask [filter ready]> ';
  return mode === 'search' ? 'truss search> ' : 'truss ask> ';
}

function printModeHeader(config: AskConfig, mode: ReplMode, toolCount: number): void {
  const providerLabel = getProvider(config.provider)?.label ?? config.provider;
  const toolsLabel =
    mode === 'search'
      ? `${toolCount} Truss MCP tools — type :ask for FilterQL coaching`
      : 'none — type run or :search for live data';
  console.log(`\n${MODE_BANNERS[mode]}`);
  console.log(`LLM: ${providerLabel} | Model: ${config.model} | Tools: ${toolsLabel}`);
  for (const line of REPL_HELP_LINES) {
    console.log(line);
  }
  console.log(`\n${FIRST_RUN_TIPS[mode]}\n`);
}

function maybePrintQuotaHint(window: SearchWindow): void {
  if (isExtendedSearchWindow(window)) {
    console.log(`\n${QUOTA_WINDOW_HINT}\n`);
  }
}

export async function runRepl(config: AskConfig, initialMode: ReplMode): Promise<void> {
  let mode = initialMode;
  let session: McpSession | null = null;
  const stateByMode: Partial<Record<ReplMode, TurnState>> = {};
  let draftFilter: string | undefined;
  let confirmedFilter: string | undefined;
  let searchWindow: SearchWindow = defaultSearchWindow();
  let pendingPortMessage: string | undefined;
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

  const printFilterReadyHint = (): void => {
    if (!confirmedFilter) return;
    const hint = buildPendingFilterHint(
      formatSearchWindow(searchWindow),
      isExtendedSearchWindow(searchWindow)
    );
    console.log(`\n${hint}\n`);
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
    printFilterReadyHint();
  };

  const executeTurn = async (userText: string, turnMode: ReplMode = mode): Promise<string> => {
    const result = await withSpinner(SPINNER_LABELS[turnMode], () =>
      runTurn(
        config,
        turnMode,
        turnMode === 'search' ? session : null,
        stateByMode[turnMode],
        userText,
        getSystemPrompt(turnMode)
      )
    );
    stateByMode[turnMode] = result.state;
    printAssistantResponse(result.displayText);
    return result.displayText;
  };

  const captureDraftFromAssistant = (displayText: string): void => {
    const extracted = extractFilterFromText(displayText, { allowDraft: true });
    if (!extracted || extracted === draftFilter) return;
    draftFilter = extracted;
    if (mode === 'ask' && !confirmedFilter) {
      console.log(`\n${DRAFT_FILTER_HINT}\n`);
    }
  };

  const promoteDraftToConfirmed = (): boolean => {
    if (!draftFilter) {
      console.log('\nNo draft filter to confirm. Build a filter in ask mode first.\n');
      return false;
    }
    confirmedFilter = draftFilter;
    printFilterReadyHint();
    return true;
  };

  const handleAssistantResponse = (displayText: string, userText: string): void => {
    const windowFromUser = extractSearchWindowFromText(userText);
    if (windowFromUser) {
      searchWindow = mergeSearchWindow(searchWindow, windowFromUser);
      maybePrintQuotaHint(searchWindow);
    }

    if (mode === 'ask' && isFilterConfirmation(userText)) {
      const confirmed = extractFilterFromText(displayText, { preferConfirmed: true });
      if (confirmed) draftFilter = confirmed;
      promoteDraftToConfirmed();
      return;
    }

    captureDraftFromAssistant(displayText);
  };

  const runMessageTurn = async (userText: string): Promise<void> => {
    const displayText = await executeTurn(userText);
    handleAssistantResponse(displayText, userText);
  };

  const runConfirmedFilter = async (windowOverride?: SearchWindow): Promise<void> => {
    if (!confirmedFilter) {
      console.log('\nNo confirmed filter. Build a filter in ask mode, confirm it, then type run.\n');
      return;
    }

    const window = windowOverride
      ? mergeSearchWindow(defaultSearchWindow(), windowOverride)
      : searchWindow;

    if (windowOverride) {
      searchWindow = window;
    }

    maybePrintQuotaHint(window);

    if (mode !== 'search') {
      await switchMode('search');
    }

    console.log(
      `\nRunning Truss search with:\n  ${confirmedFilter}\n  Window: ${formatSearchWindow(window)}\n`
    );
    await executeTurn(buildRunSearchQuery(confirmedFilter, window), 'search');
  };

  const printHelp = (): void => {
    for (const line of REPL_HELP_LINES) console.log(line);
    for (const line of REPL_QUICK_EXAMPLES) console.log(line);
    console.log('');
  };

  const printStatus = (): void => {
    const toolCount = mode === 'search' && session ? session.tools.length : 0;
    console.log('\nStatus:');
    console.log(`  Mode: ${mode}`);
    console.log(`  Model: ${config.model}`);
    console.log(`  Tools: ${mode === 'search' ? toolCount : 0}`);
    console.log(`  Window: ${formatSearchWindow(searchWindow)}`);
    console.log(`  Draft filter: ${draftFilter ?? '(none)'}`);
    console.log(`  Confirmed filter: ${confirmedFilter ?? '(none)'}`);
    console.log(`  Pending port: ${pendingPortMessage ?? '(none)'}`);
    console.log('');
  };

  const clearModeState = (): void => {
    delete stateByMode[mode];
    if (mode === 'ask') {
      draftFilter = undefined;
      confirmedFilter = undefined;
      searchWindow = defaultSearchWindow();
    }
    console.log(`\nCleared ${mode} mode conversation and pending filters.\n`);
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
      const line = await rl.question(buildPrompt(mode, Boolean(confirmedFilter)));
      const input_ = parseReplInput(line);

      if (input_.type === 'empty') continue;
      if (input_.type === 'exit') break;
      if (input_.type === 'help') {
        printHelp();
        continue;
      }
      if (input_.type === 'status') {
        printStatus();
        continue;
      }
      if (input_.type === 'clear') {
        clearModeState();
        continue;
      }
      if (input_.type === 'filter') {
        for (const l of formatFilterStatus(draftFilter, confirmedFilter, searchWindow)) {
          console.log(l);
        }
        console.log('');
        continue;
      }
      if (input_.type === 'confirm') {
        promoteDraftToConfirmed();
        continue;
      }
      if (input_.type === 'days') {
        if (input_.showOnly || !input_.window) {
          console.log(`\nCurrent window: ${formatSearchWindow(searchWindow)}\n`);
        } else {
          searchWindow = mergeSearchWindow(defaultSearchWindow(), input_.window);
          console.log(`\nWindow set to: ${formatSearchWindow(searchWindow)}\n`);
          maybePrintQuotaHint(searchWindow);
        }
        continue;
      }
      if (input_.type === 'run') {
        await runConfirmedFilter(input_.window);
        continue;
      }
      if (input_.type === 'switch') {
        const portMessage = input_.mode === 'ask' ? pendingPortMessage : undefined;
        pendingPortMessage = undefined;
        await switchMode(input_.mode);
        if (portMessage) {
          try {
            await runMessageTurn(portMessage);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error(`\nError: ${message}\n`);
          }
        }
        continue;
      }

      if (input_.type === 'message') {
        if (input_.forceAskPort && mode === 'search') {
          pendingPortMessage = input_.text;
          console.log(`\n${ASK_MODE_HINT}\n`);
          continue;
        }

        if (
          mode === 'search' &&
          !input_.forceSearch &&
          shouldSuggestAskMode(input_.text)
        ) {
          pendingPortMessage = input_.text;
          console.log(`\n${ASK_MODE_HINT}\n`);
          continue;
        }

        try {
          await runMessageTurn(input_.text);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`\nError: ${message}\n`);
        }
      }
    }
  } finally {
    rl.close();
    await shutdown();
  }
}
