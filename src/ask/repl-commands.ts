import type { ReplMode } from './system-prompt.js';

export type ReplInput =
  | { type: 'exit' }
  | { type: 'switch'; mode: ReplMode }
  | { type: 'run' }
  | { type: 'message'; text: string }
  | { type: 'empty' };

const EXIT_COMMANDS = new Set(['exit', 'quit', ':q']);

const MODE_SWITCH: Record<string, ReplMode> = {
  ':search': 'search',
  ':ask': 'ask',
};

const RUN_COMMANDS = new Set(['run', ':run']);

export function parseReplInput(line: string): ReplInput {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'empty' };
  const lower = trimmed.toLowerCase();
  if (EXIT_COMMANDS.has(lower)) return { type: 'exit' };
  if (RUN_COMMANDS.has(lower)) return { type: 'run' };
  const mode = MODE_SWITCH[lower];
  if (mode) return { type: 'switch', mode };
  return { type: 'message', text: line };
}

export const REPL_HELP_LINES = [
  'Commands:',
  '  :search   Switch to search mode (live Truss MCP tools)',
  '  :ask      Switch to ask mode (FilterQL coaching — no live queries)',
  '  run       Switch to search and execute the last confirmed FilterQL',
  '  exit      Leave the REPL (also: quit, :q)',
];

export const PENDING_FILTER_HINT =
  'Filter ready. Type `run` to switch to search and execute, or `:search` to switch manually.';

export const ASK_MODE_HINT =
  'Coaching question detected. Type `:ask` to switch to FilterQL help (no live queries). Your question will carry over.';
