import { runDeliveryJob } from './run-job.js';
import { runDeliveryServe } from './serve.js';

function argValue(argv: string[], flag: string): string | undefined {
  const index = argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (value == null || value.startsWith('--')) return undefined;
  return value;
}

export async function runJobCli(argv: string[] = process.argv): Promise<number> {
  const jobName = argv[3];
  if (!jobName || jobName.startsWith('--')) {
    console.error('Usage: truss-mcp run-job <name>');
    return 1;
  }
  const dir = argValue(argv, '--dir') ?? process.cwd();
  return runDeliveryJob({ jobName, cwd: dir, log: console.log });
}

export async function runServeCli(argv: string[] = process.argv): Promise<number> {
  const dir = argValue(argv, '--dir') ?? process.cwd();
  try {
    await runDeliveryServe({ cwd: dir, log: console.log });
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}
