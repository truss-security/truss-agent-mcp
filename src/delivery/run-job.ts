import { loadConfig } from '../config.js';
import { formatTrussError } from '../lib/errors.js';
import { postDiscordWebhook, discordWebhookErrorMessage } from './connections/discord.js';
import { executeJob } from './execute-job.js';
import {
  findConnection,
  jobIsEnabled,
  loadDeliveryBundle,
} from './load-bundle.js';
import { searchProductsForDelivery } from './search.js';

export async function runDeliveryJob(opts: {
  jobName: string;
  cwd?: string;
  log?: (message: string) => void;
}): Promise<number> {
  const log = opts.log ?? console.log;
  const bundle = loadDeliveryBundle(opts.cwd);
  const job = bundle.jobs.jobs.find((j) => j.name === opts.jobName);
  if (!job) {
    log(`Job not found: ${opts.jobName}`);
    return 1;
  }
  if (!jobIsEnabled(job)) {
    log(`Job ${job.name} is disabled`);
    return 1;
  }

  const connection = findConnection(bundle, job.connectionName);
  if (!connection) {
    log(`Job ${job.name}: connection ${job.connectionName} not found`);
    return 1;
  }
  if (!connection.enabled) {
    log(`Job ${job.name}: connection ${connection.name} is disabled`);
    return 1;
  }

  const config = loadConfig();
  try {
    const result = await executeJob({
      job,
      connection,
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

    if (result.skipReason && result.skipReason !== 'empty') {
      log(`Job ${job.name}: ${result.skipReason}`);
      return 1;
    }
    return 0;
  } catch (error) {
    log(`Job ${job.name}: ${discordWebhookErrorMessage(formatTrussError(error))}`);
    return 1;
  }
}
