import type { ReplMode } from './system-prompt.js';

export type ReplInput =
  | { type: 'exit' }
  | { type: 'switch'; mode: ReplMode }
  | { type: 'message'; text: string }
  | { type: 'empty' };

const EXIT_COMMANDS = new Set(['exit', 'quit', ':q']);

const MODE_SWITCH: Record<string, ReplMode> = {
  ':search': 'search',
  ':ask': 'ask',
};

export function parseReplInput(line: string): ReplInput {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'empty' };
  const lower = trimmed.toLowerCase();
  if (EXIT_COMMANDS.has(lower)) return { type: 'exit' };
  const mode = MODE_SWITCH[lower];
  if (mode) return { type: 'switch', mode };
  return { type: 'message', text: line };
}

export const REPL_HELP_LINES = [
  'Commands:',
  '  :search   Switch to search mode (live Truss queries via MCP tools)',
  '  :ask      Switch to ask mode (general help — no live Truss queries)',
  '  exit      Leave the REPL (also: quit, :q)',
];
