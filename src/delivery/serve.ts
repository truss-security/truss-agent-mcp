import { loadConfig, type McpServerConfig } from '../config.js';
import { formatTrussError } from '../lib/errors.js';
import { postDiscordWebhook, discordWebhookErrorMessage } from './connections/discord.js';
import { executeJob } from './execute-job.js';
import {
  findConnection,
  jobIsEnabled,
  loadDeliveryBundle,
  type DeliveryBundle,
} from './load-bundle.js';
import { searchProductsForDelivery } from './search.js';
import type { DeliveryJob, DiscordConnection } from './schemas.js';

export interface RunnableJob {
  job: DeliveryJob;
  connection: DiscordConnection;
  intervalMs: number;
}

export function listRunnableJobs(bundle: DeliveryBundle): RunnableJob[] {
  const runnable: RunnableJob[] = [];
  for (const job of bundle.jobs.jobs) {
    if (!jobIsEnabled(job)) continue;
    const connection = findConnection(bundle, job.connectionName);
    if (!connection || !connection.enabled) continue;
    if (typeof job.schedule !== 'number') {
      throw new Error(
        `Job ${job.name}: cron schedules are not in the Discord slice; use interval minutes`
      );
    }
    runnable.push({
      job,
      connection,
      intervalMs: job.schedule * 60 * 1000,
    });
  }
  return runnable;
}

async function tickJob(
  bundle: DeliveryBundle,
  item: RunnableJob,
  config: McpServerConfig,
  log: (message: string) => void
): Promise<void> {
  try {
    await executeJob({
      job: item.job,
      connection: item.connection,
      agentName: bundle.agent.agentName,
      deps: {
        search: ({ filter, windowMinutes, includeIndicators }) =>
          searchProductsForDelivery({
            config,
            filter,
            windowMinutes,
            includeIndicators,
          }),
        postDiscord: (webhookUrl, body) => postDiscordWebhook(webhookUrl, body),
        log,
      },
    });
  } catch (error) {
    log(`Job ${item.job.name}: ${discordWebhookErrorMessage(formatTrussError(error))}`);
  }
}

export async function runDeliveryServe(opts: {
  cwd?: string;
  log?: (message: string) => void;
  setIntervalFn?: typeof setInterval;
  clearIntervalFn?: typeof clearInterval;
  onReady?: (handles: ReturnType<typeof setInterval>[]) => void;
}): Promise<void> {
  const log = opts.log ?? console.log;
  const bundle = loadDeliveryBundle(opts.cwd);
  const runnable = listRunnableJobs(bundle);
  if (runnable.length === 0) {
    throw new Error('No enabled jobs with enabled Discord connections');
  }

  const config = loadConfig();
  const setIntervalFn = opts.setIntervalFn ?? setInterval;
  const clearIntervalFn = opts.clearIntervalFn ?? clearInterval;
  const handles: ReturnType<typeof setInterval>[] = [];
  let queue: Promise<void> = Promise.resolve();

  const enqueue = (item: RunnableJob): void => {
    queue = queue.then(() => tickJob(bundle, item, config, log));
  };

  log(`truss-mcp serve: ${runnable.length} job(s); Ctrl+C to stop`);
  for (const item of runnable) {
    log(`Scheduled ${item.job.name} every ${item.job.schedule} minute(s)`);
    const handle = setIntervalFn(() => {
      enqueue(item);
    }, item.intervalMs);
    handles.push(handle);
  }

  opts.onReady?.(handles);

  await new Promise<void>((resolve) => {
    const stop = (): void => {
      for (const handle of handles) clearIntervalFn(handle);
      log('truss-mcp serve: stopped');
      resolve();
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
}
