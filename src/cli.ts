#!/usr/bin/env node
import { runServer } from './server.js';

runServer().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
