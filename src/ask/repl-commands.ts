import type { SearchWindow } from './search-window.js';
import { formatSearchWindow, parseSearchWindowArg } from './search-window.js';
import type { ReplMode } from './system-prompt.js';

export type ReplInput =
  | { type: 'exit' }
  | { type: 'switch'; mode: ReplMode }
  | { type: 'run'; window?: SearchWindow }
  | { type: 'days'; window?: SearchWindow; showOnly?: boolean }
  | { type: 'confirm' }
  | { type: 'filter' }
  | { type: 'help' }
  | { type: 'clear' }
  | { type: 'status' }
  | { type: 'message'; text: string; forceSearch?: boolean; forceAskPort?: boolean }
  | { type: 'empty' };

const EXIT_COMMANDS = new Set(['exit', 'quit', ':q']);

const MODE_SWITCH: Record<string, ReplMode> = {
  ':search': 'search',
  ':ask': 'ask',
};

function parseDaysArgs(rest: string): { window?: SearchWindow; showOnly: boolean } {
  const trimmed = rest.trim();
  if (!trimmed) return { showOnly: true };
  const window = parseSearchWindowArg(trimmed);
  return { window, showOnly: false };
}

function parseForcedMessage(line: string): ReplInput | undefined {
  if (line.startsWith('!')) {
    const text = line.slice(1).trim();
    return text ? { type: 'message', text, forceSearch: true } : undefined;
  }
  const searchMatch = /^search:\s*(.*)$/i.exec(line);
  if (searchMatch) {
    const text = searchMatch[1].trim();
    return text ? { type: 'message', text, forceSearch: true } : undefined;
  }
  const askMatch = /^ask:\s*(.*)$/i.exec(line);
  if (askMatch) {
    const text = askMatch[1].trim();
    return text ? { type: 'message', text, forceAskPort: true } : undefined;
  }
  return undefined;
}

export function parseReplInput(line: string): ReplInput {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'empty' };
  const lower = trimmed.toLowerCase();

  if (EXIT_COMMANDS.has(lower)) return { type: 'exit' };
  if (lower === 'help' || lower === ':help') return { type: 'help' };
  if (lower === 'confirm' || lower === ':confirm') return { type: 'confirm' };
  if (lower === 'filter' || lower === ':filter') return { type: 'filter' };
  if (lower === 'clear' || lower === ':clear') return { type: 'clear' };
  if (lower === 'status' || lower === ':status') return { type: 'status' };

  const mode = MODE_SWITCH[lower];
  if (mode) return { type: 'switch', mode };

  const runMatch = /^(?:run|:run)(?:\s+(.+))?$/i.exec(trimmed);
  if (runMatch) {
    const window = runMatch[1] ? parseSearchWindowArg(runMatch[1]) : undefined;
    return window ? { type: 'run', window } : { type: 'run' };
  }

  const daysMatch = /^days(?:\s+(.+))?$/i.exec(trimmed);
  if (daysMatch) {
    const parsed = parseDaysArgs(daysMatch[1] ?? '');
    if (parsed.showOnly) return { type: 'days', showOnly: true };
    return { type: 'days', window: parsed.window, showOnly: false };
  }

  const forced = parseForcedMessage(trimmed);
  if (forced) return forced;

  return { type: 'message', text: line };
}

export const REPL_HELP_LINES = [
  'Commands:',
  '  :search   Switch to search mode (live Truss MCP tools)',
  '  :ask      Switch to ask mode (FilterQL coaching — no live queries)',
  '  run       Switch to search and execute the last confirmed FilterQL (default 7 days)',
  '  run 30    Execute with a 30-day window (may use more API quota)',
  '  days 30   Set rolling window without running (may use more API quota)',
  '  filter    Show draft/confirmed filters and current window',
  '  confirm   Lock draft filter for run',
  '  help      Show this help',
  '  clear     Reset conversation for current mode',
  '  status    Show mode, model, and pending state',
  '  exit      Leave the REPL (also: quit, :q)',
  '',
  '  days 30 / run 30 may use more Truss API quota than the 7-day default.',
];

export const REPL_QUICK_EXAMPLES = [
  'Examples:',
  '  search: Find ransomware reports from the last 7 days',
  '  ask: Build a filter for Sandworm malware',
  '  After confirming a filter in ask mode, type run',
];

export const DRAFT_FILTER_HINT =
  'Draft filter saved. Type `confirm` or reply with your choice (1/2) to lock the filter.';

export function buildPendingFilterHint(windowLabel: string, quotaNote: boolean): string {
  let hint = `Filter ready (${windowLabel}). Type \`run\` to switch to search and execute, or \`:search\` to switch manually.`;
  if (quotaNote) {
    hint += ' Wider window may use additional Truss API quota.';
  }
  return hint;
}

export const ASK_MODE_HINT =
  'Coaching question detected. Type `:ask` to switch to FilterQL coaching (no live queries). Your question will carry over.';

export function formatFilterStatus(
  draftFilter: string | undefined,
  confirmedFilter: string | undefined,
  window: SearchWindow
): string[] {
  const lines = ['Filter state:'];
  lines.push(`  Window: ${formatSearchWindow(window)}`);
  lines.push(`  Draft: ${draftFilter ?? '(none)'}`);
  lines.push(`  Confirmed: ${confirmedFilter ?? '(none)'}`);
  return lines;
}
