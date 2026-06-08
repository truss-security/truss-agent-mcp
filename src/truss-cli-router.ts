import type { ReplMode } from './ask/system-prompt.js';

export function parseCommand(argv: string[]): ReplMode | 'help' | null {
  const command = argv[2];
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    return 'help';
  }
  if (command === 'search' || command === 'ask') {
    return command;
  }
  return null;
}

/** @internal Exported for tests only */
export const parseCommandForTest = parseCommand;
