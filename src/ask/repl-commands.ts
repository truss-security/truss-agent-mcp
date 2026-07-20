import type { ColorMode } from '../lib/terminal-theme.js';
import type { SearchWindow } from './search-window.js';
import { formatSearchWindow, parseSearchWindowArg } from './search-window.js';
import type { McpTransportMode } from './config.js';

export type ReplInput =
  | { type: 'exit' }
  | { type: 'run'; window?: SearchWindow }
  | { type: 'days'; window?: SearchWindow; showOnly?: boolean }
  | { type: 'confirm' }
  | { type: 'filter' }
  | { type: 'stix' }
  | { type: 'detect'; platform: string }
  | { type: 'color'; mode?: ColorMode; showOnly?: boolean }
  | { type: 'help' }
  | { type: 'clear' }
  | { type: 'status' }
  | { type: 'message'; text: string; forceSearch?: boolean }
  | { type: 'empty' };

const EXIT_COMMANDS = new Set(['exit', 'quit', ':q']);

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
  if (lower === 'stix' || lower === ':stix') return { type: 'stix' };

  const colorMatch = /^color(?:\s+(.+))?$/i.exec(trimmed);
  if (colorMatch) {
    const arg = colorMatch[1]?.trim().toLowerCase();
    if (!arg) return { type: 'color', showOnly: true };
    if (arg === 'on' || arg === 'always') return { type: 'color', mode: 'always' };
    if (arg === 'off' || arg === 'never') return { type: 'color', mode: 'never' };
    if (arg === 'auto') return { type: 'color', mode: 'auto' };
    return { type: 'color', showOnly: true };
  }

  const detectMatch = /^(?:detect|:detect)\s+(.+)$/i.exec(trimmed);
  if (detectMatch) {
    const platform = detectMatch[1].trim();
    if (platform) return { type: 'detect', platform };
  }

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
  '  run       Execute the last confirmed FilterQL (default 7 days)',
  '  run 30    Execute with a 30-day window (may use more API quota)',
  '  days 30   Set rolling window without running (may use more API quota)',
  '  filter    Show draft/confirmed filters and current window',
  '  confirm   Lock draft filter for run',
  '  stix      Export results or confirmed filter as STIX',
  '  detect    Generate detection queries — e.g. detect splunk, detect falcon',
  '  color     Show color setting (color on | off | auto)',
  '  help      Show this help',
  '  clear     Reset conversation and pending filters',
  '  status    Show model, tools, and workflow state',
  '  exit      Leave the REPL (also: quit, :q)',
  '',
  '  days 30 / run 30 may use more Truss API quota than the 7-day default.',
];

export const REPL_QUICK_EXAMPLES = [
  'Examples:',
  '  What is Sandworm? — knowledge answer, then offers to build a filter',
  '  yes / build filter — draft FilterQL, validate, offer refine + query',
  '  run — execute confirmed filter against Truss API',
  '  stix — STIX bundle for last filter/results',
  '  detect splunk — Splunk SPL from IOCs in results',
];

export const DRAFT_FILTER_HINT =
  'Draft filter saved. Type `confirm` or reply with your choice (1/2) to lock the filter.';

export function buildPendingFilterHint(windowLabel: string, quotaNote: boolean): string {
  let hint = `Filter ready (${windowLabel}). Type \`run\` to execute against Truss API.`;
  if (quotaNote) {
    hint += ' Wider window may use additional Truss API quota.';
  }
  return hint;
}

export function buildStixQuery(
  filterExpression: string | undefined,
  hasQueryResults: boolean,
  transport: McpTransportMode = 'stdio'
): string {
  if (transport === 'remote') {
    if (filterExpression) {
      return (
        `Export Truss search results as STIX for this search intent:\n` +
        `${filterExpression}\n` +
        `Call search_stix (or get_product_stix for a specific product id). ` +
        `Summarize object counts from the bundle when available.`
      );
    }
    if (hasQueryResults) {
      return (
        'Export the most recent Truss search results from this conversation as STIX. ' +
        'Use search_stix with the last search intent from the thread, ' +
        'or get_product_stix for a specific product id the user mentioned.'
      );
    }
    return (
      'The user wants STIX output but no search intent or prior results are available. ' +
      'Ask them to confirm a search first, or specify a product id.'
    );
  }

  if (filterExpression) {
    return (
      `Export Truss search results as STIX using this filterExpression exactly:\n` +
      `${filterExpression}\n` +
      `Call validate_filter_expression first, then search_products_stix. ` +
      `Summarize objectCount from the bundle.`
    );
  }
  if (hasQueryResults) {
    return (
      'Export the most recent Truss search results from this conversation as STIX. ' +
      'Use search_products_stix with the last filterExpression from the thread, ' +
      'or get_product_stix for a specific product id the user mentioned.'
    );
  }
  return (
    'The user wants STIX output but no filter or prior results are available. ' +
    'Ask them to build and confirm a filter first, or specify a product id.'
  );
}

export function buildDetectQuery(platform: string, hasQueryResults: boolean): string {
  if (hasQueryResults) {
    return (
      `[intent: detection_rules] Build ${platform} detection/hunting queries using IOCs and context ` +
      `from prior Truss search results in this conversation. Do not invent IOCs not in the thread. ` +
      `Output labeled code blocks for the requested platform.`
    );
  }
  return (
    `[intent: detection_rules] The user wants ${platform} detection queries but no search results are in the thread. ` +
    'Explain that detection rules require prior search results with IOCs. Offer to run a search with include_indicators: true.'
  );
}

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
