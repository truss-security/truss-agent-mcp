import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import type { AskConfig } from './config.js';
import {
  buildIntentHint,
  classifyWorkflowIntent,
} from './classify-workflow-intent.js';
import {
  buildRunSearchQuery,
  extractFilterFromText,
  isFilterConfirmation,
} from './extract-filter.js';
import { connectMcpSession, type McpSession } from './mcp-session.js';
import {
  buildDetectQuery,
  buildPendingFilterHint,
  buildStixQuery,
  DRAFT_FILTER_HINT,
  formatFilterStatus,
  parseReplInput,
  REPL_HELP_LINES,
  REPL_QUICK_EXAMPLES,
} from './repl-commands.js';
import {
  printAssistantBlock,
  printColorStatus,
  printError,
  printHeader,
  printHint,
  printMeta,
  printPlain,
  printPrompt,
  printResultsBlock,
  printToolEnd,
  printToolStart,
  printUserBlock,
} from './repl-output.js';
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
import { getSystemPrompt } from './system-prompt.js';
import { summarizeToolResult } from './tool-trace.js';
import {
  describeColorSetting,
  initColorFromEnv,
  setRuntimeColorMode,
  type ColorMode,
} from '../lib/terminal-theme.js';
import {
  clearFilters,
  createWorkflowState,
  formatWorkflowStatus,
  setConfirmedFilter,
  setDraftFilter,
  updateWorkflowFromAssistant,
  type WorkflowState,
} from './workflow-state.js';

const REPL_BANNER =
  'Truss Search — live Truss threat intelligence with guided FilterQL workflow (MCP tools enabled)';

const FIRST_RUN_TIP =
  'Try: What is Sandworm? — then yes to build a filter, confirm, and run';

const SPINNER_LABEL = 'Thinking…';

interface ExecuteTurnResult {
  displayText: string;
  searchExecuted: boolean;
}

function buildPromptLine(filterReady: boolean): string {
  if (filterReady) return 'truss search [filter ready]> ';
  return 'truss search> ';
}

function printReplHeader(config: AskConfig, toolCount: number): void {
  const providerLabel = getProvider(config.provider)?.label ?? config.provider;
  printHeader(REPL_BANNER);
  const transportLabel =
    config.mcpTransport === 'remote' ? `remote ${config.mcpUrl}` : 'local stdio';
  printMeta(
    `LLM: ${providerLabel} | Model: ${config.model} | Tools: ${toolCount} Truss MCP (${transportLabel})`
  );
  for (const line of REPL_HELP_LINES) {
    printPlain(line);
  }
  printPlain(`\n${FIRST_RUN_TIP}\n`);
}

function maybePrintQuotaHint(window: SearchWindow): void {
  if (isExtendedSearchWindow(window)) {
    printHint(QUOTA_WINDOW_HINT);
  }
}

function prepareUserMessage(text: string, workflow: WorkflowState, forceSearch?: boolean): string {
  const intent = forceSearch ? 'query_execute' : classifyWorkflowIntent(text, workflow);
  return `${buildIntentHint(intent)} ${text}`;
}

export async function runRepl(config: AskConfig): Promise<void> {
  initColorFromEnv();
  const session: McpSession = await connectMcpSession(config);
  let turnState: TurnState | undefined;
  let workflow: WorkflowState = createWorkflowState();
  let lastToolSummary: string | undefined;
  let closing = false;

  const printFilterReadyHint = (): void => {
    if (!workflow.confirmedFilter) return;
    const hint = buildPendingFilterHint(
      formatSearchWindow(workflow.searchWindow),
      isExtendedSearchWindow(workflow.searchWindow)
    );
    printHint(hint);
  };

  const executeTurn = async (
    userText: string,
    showUserBlock = false
  ): Promise<ExecuteTurnResult> => {
    if (showUserBlock) {
      printUserBlock(userText.replace(/^\[intent: [^\]]+\]\s*/, ''));
    }

    const result = await withSpinner(SPINNER_LABEL, (spinner) =>
      runTurn(config, session, turnState, userText, getSystemPrompt(config.mcpTransport), {
        onToolStart: (name, argsSummary) => {
          spinner.setLabel(`Running ${name}…`);
          printToolStart(name, argsSummary);
        },
        onToolEnd: (event) => {
          printToolEnd(event);
          lastToolSummary = `${event.name}: ${summarizeToolResult(
            event.name,
            event.resultText,
            event.isError
          )}`;
        },
        onSpinnerLabel: (label) => spinner.setLabel(label),
      })
    );

    turnState = result.state;

    const searchPayload = result.diagnostics?.searchPayload;
    if (searchPayload) {
      const filterFromEvent = result.diagnostics?.toolEvents
        ?.slice()
        .reverse()
        .find((e) => typeof e.args.filterExpression === 'string');
      printResultsBlock({
        ...searchPayload,
        filterExpression:
          (filterFromEvent?.args.filterExpression as string | undefined) ??
          workflow.confirmedFilter ??
          workflow.draftFilter ??
          workflow.lastFilterExpression,
        windowLabel: formatSearchWindow(workflow.searchWindow),
      });
    }

    printAssistantBlock(result.displayText);
    return {
      displayText: result.displayText,
      searchExecuted: Boolean(result.diagnostics?.searchPayload),
    };
  };

  const captureDraftFromAssistant = (
    displayText: string,
    searchExecuted = false
  ): void => {
    if (searchExecuted) return;

    const extracted = extractFilterFromText(displayText, { allowDraft: true });
    if (!extracted || extracted === workflow.draftFilter) return;
    if (workflow.confirmedFilter && extracted === workflow.confirmedFilter) return;

    workflow = setDraftFilter(workflow, extracted);
    if (!workflow.confirmedFilter) {
      printHint(DRAFT_FILTER_HINT);
    }
  };

  const promoteDraftToConfirmed = (): boolean => {
    if (!workflow.draftFilter) {
      printError('No draft filter to confirm. Build a filter first.');
      return false;
    }
    workflow = setConfirmedFilter(workflow, workflow.draftFilter);
    printFilterReadyHint();
    return true;
  };

  const handleAssistantResponse = (
    displayText: string,
    userText: string,
    searchExecuted = false
  ): void => {
    const windowFromUser = extractSearchWindowFromText(userText);
    if (windowFromUser) {
      workflow = {
        ...workflow,
        searchWindow: mergeSearchWindow(workflow.searchWindow, windowFromUser),
      };
      maybePrintQuotaHint(workflow.searchWindow);
    }

    if (isFilterConfirmation(userText)) {
      const confirmed = extractFilterFromText(displayText, { preferConfirmed: true });
      if (confirmed) workflow = setDraftFilter(workflow, confirmed);
      promoteDraftToConfirmed();
      return;
    }

    captureDraftFromAssistant(displayText, searchExecuted);
    workflow = updateWorkflowFromAssistant(workflow, displayText);
  };

  const runMessageTurn = async (userText: string, forceSearch?: boolean): Promise<void> => {
    const prepared = prepareUserMessage(userText, workflow, forceSearch);
    const { displayText, searchExecuted } = await executeTurn(prepared, true);
    handleAssistantResponse(displayText, userText, searchExecuted);
  };

  const runConfirmedFilter = async (windowOverride?: SearchWindow): Promise<void> => {
    const filter = workflow.confirmedFilter;
    if (!filter) {
      printError('No confirmed filter. Build a filter, confirm it, then type run.');
      return;
    }

    const window = windowOverride
      ? mergeSearchWindow(workflow.searchWindow, windowOverride)
      : workflow.searchWindow;

    if (windowOverride) {
      workflow = { ...workflow, searchWindow: window };
    }

    maybePrintQuotaHint(window);

    printHint(`Running Truss search with:\n  ${filter}\n  Window: ${formatSearchWindow(window)}`);
    const { displayText } = await executeTurn(buildRunSearchQuery(filter, window, config.mcpTransport));
    workflow = updateWorkflowFromAssistant(workflow, displayText);
  };

  const runStixExport = async (): Promise<void> => {
    const filter = workflow.confirmedFilter ?? workflow.draftFilter ?? workflow.lastFilterExpression;
    const query = buildStixQuery(filter, workflow.hasQueryResults, config.mcpTransport);
    printHint('Exporting STIX…');
    const { displayText } = await executeTurn(query);
    workflow = updateWorkflowFromAssistant(workflow, displayText);
  };

  const runDetectExport = async (platform: string): Promise<void> => {
    const query = buildDetectQuery(platform, workflow.hasQueryResults);
    printHint(`Building ${platform} detection queries…`);
    const { displayText } = await executeTurn(query);
    workflow = updateWorkflowFromAssistant(workflow, displayText);
  };

  const setColorMode = (mode: ColorMode): void => {
    if (mode === 'auto') {
      setRuntimeColorMode(undefined);
      printHint('Color reset to auto (env/TTY).');
      return;
    }
    setRuntimeColorMode(mode);
    printHint(`Color set to ${mode === 'always' ? 'on' : 'off'}.`);
  };

  const printHelp = (): void => {
    for (const line of REPL_HELP_LINES) printPlain(line);
    for (const line of REPL_QUICK_EXAMPLES) printPlain(line);
    printPlain('');
  };

  const printStatus = (): void => {
    printPlain('\nStatus:');
    printPlain(`  Model: ${config.model}`);
    printPlain(`  Tools: ${session.tools.length}`);
    printPlain(`  Window: ${formatSearchWindow(workflow.searchWindow)}`);
    printPlain(`  Color: ${describeColorSetting()}`);
    if (lastToolSummary) {
      printPlain(`  Last tool: ${lastToolSummary}`);
    }
    for (const line of formatWorkflowStatus(workflow)) {
      printPlain(`  ${line.replace(/^  /, '')}`);
    }
    printPlain('');
  };

  const clearConversation = (): void => {
    turnState = undefined;
    workflow = clearFilters(workflow);
    workflow = { ...workflow, searchWindow: defaultSearchWindow() };
    lastToolSummary = undefined;
    printHint('Cleared conversation and pending filters.');
  };

  const shutdown = async (): Promise<void> => {
    if (closing) return;
    closing = true;
    await session.close();
  };

  process.on('SIGINT', () => {
    printPlain('\n');
    void shutdown().then(() => process.exit(0));
  });

  printReplHeader(config, session.tools.length);

  const rl = readline.createInterface({ input, output });

  try {
    while (!closing) {
      const line = await rl.question(printPrompt(buildPromptLine(Boolean(workflow.confirmedFilter))));
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
        clearConversation();
        continue;
      }
      if (input_.type === 'color') {
        if (input_.showOnly || !input_.mode) {
          printColorStatus();
        } else {
          setColorMode(input_.mode);
        }
        continue;
      }
      if (input_.type === 'filter') {
        for (const l of formatFilterStatus(
          workflow.draftFilter,
          workflow.confirmedFilter,
          workflow.searchWindow
        )) {
          printPlain(l);
        }
        printPlain('');
        continue;
      }
      if (input_.type === 'confirm') {
        promoteDraftToConfirmed();
        continue;
      }
      if (input_.type === 'days') {
        if (input_.showOnly || !input_.window) {
          printHint(`Current window: ${formatSearchWindow(workflow.searchWindow)}`);
        } else {
          workflow = {
            ...workflow,
            searchWindow: mergeSearchWindow(workflow.searchWindow, input_.window),
          };
          printHint(`Window set to: ${formatSearchWindow(workflow.searchWindow)}`);
          maybePrintQuotaHint(workflow.searchWindow);
        }
        continue;
      }
      if (input_.type === 'run') {
        await runConfirmedFilter(input_.window);
        continue;
      }
      if (input_.type === 'stix') {
        try {
          await runStixExport();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          printError(message);
        }
        continue;
      }
      if (input_.type === 'detect') {
        try {
          await runDetectExport(input_.platform);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          printError(message);
        }
        continue;
      }

      if (input_.type === 'message') {
        try {
          await runMessageTurn(input_.text, input_.forceSearch);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          printError(message);
        }
      }
    }
  } finally {
    rl.close();
    await shutdown();
  }
}
