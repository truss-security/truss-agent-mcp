#!/usr/bin/env node
import { loadDotEnv } from './lib/load-dotenv.js';
import { loadAskConfig } from './ask/config.js';
import { printHelp } from './ask/help.js';
import { runRepl } from './ask/repl.js';
import { parseCommand } from './truss-cli-router.js';

async function main(): Promise<void> {
  loadDotEnv();
  const command = parseCommand(process.argv);

  if (command === 'help') {
    printHelp();
    return;
  }

  if (command === null) {
    console.error(`Unknown command: ${process.argv[2] ?? '(none)'}\n`);
    printHelp();
    process.exit(1);
  }

  const config = loadAskConfig();
  await runRepl(config, command);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
