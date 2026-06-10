export type CliCommand = 'search' | 'help' | 'version' | 'doctor' | 'init' | 'mcp';

export function parseCommand(argv: string[]): CliCommand | null {
  if (argv.includes('--version') || argv.includes('-V')) {
    return 'version';
  }

  const command = argv[2];
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    return 'help';
  }

  const known: CliCommand[] = ['search', 'version', 'doctor', 'init', 'mcp', 'help'];
  if (known.includes(command as CliCommand)) {
    return command as CliCommand;
  }

  return null;
}

/** @internal Exported for tests only */
export const parseCommandForTest = parseCommand;
