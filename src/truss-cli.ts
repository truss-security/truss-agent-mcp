#!/usr/bin/env node
import { loadAllEnv } from './lib/load-dotenv.js';
import { readPackageVersion } from './lib/package-version.js';
import { loadAskConfig } from './ask/config.js';
import { runDoctor } from './ask/doctor.js';
import { printHelp } from './ask/help.js';
import { runInit } from './ask/init.js';
import { runRepl } from './ask/repl.js';
import { parseCommand } from './truss-cli-router.js';
import { runServer } from './server.js';
import { parseValidateRemoteOptions, runValidateRemote } from './remote/validate-remote.js';

async function main(): Promise<void> {
  loadAllEnv();
  const command = parseCommand(process.argv);

  if (command === 'help') {
    printHelp();
    return;
  }

  if (command === 'version') {
    console.log(`truss-mcp ${readPackageVersion()}`);
    return;
  }

  if (command === null) {
    console.error(`Unknown command: ${process.argv[2] ?? '(none)'}\n`);
    printHelp();
    process.exit(1);
  }

  if (command === 'doctor') {
    const code = await runDoctor(undefined, process.argv);
    process.exit(code);
  }

  if (command === 'init') {
    process.exit(await runInit());
  }

  if (command === 'mcp') {
    await runServer();
    return;
  }

  if (command === 'validate-remote') {
    process.exit(await runValidateRemote(parseValidateRemoteOptions(process.argv)));
  }

  if (command === 'search') {
    const config = loadAskConfig();
    await runRepl(config);
    return;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
