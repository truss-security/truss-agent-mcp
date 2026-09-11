import { loadConfig } from '../config.js';
import { formatTrussError } from '../lib/errors.js';
import { postDiscordWebhook, discordWebhookErrorMessage } from './connections/discord.js';
import { executeJob, type ExecuteJobResult } from './execute-job.js';
import {
  findConnection,
  jobIsEnabled,
  loadDeliveryBundle,
} from './load-bundle.js';
import { searchProductsForDelivery } from './search.js';

export interface RunDeliveryJobResult extends ExecuteJobResult {
  ok: boolean;
  jobName: string;
  logs: string[];
  error?: string;
}

export async function runDeliveryJob(opts: {
  jobName: string;
  cwd?: string;
  log?: (message: string) => void;
}): Promise<RunDeliveryJobResult> {
  const logs: string[] = [];
  const log = (message: string): void => {
    logs.push(message);
    opts.log?.(message);
  };

  const fail = (
    error: string,
    extra: Partial<ExecuteJobResult> = {}
  ): RunDeliveryJobResult => ({
    ok: false,
    jobName: opts.jobName,
    pushed: extra.pushed ?? false,
    productCount: extra.productCount ?? 0,
    skipReason: extra.skipReason,
    error,
    logs,
  });

  let bundle;
  try {
    bundle = loadDeliveryBundle(opts.cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log(message);
    return fail(message);
  }

  const job = bundle.jobs.jobs.find((j) => j.name === opts.jobName);
  if (!job) {
    const message = `Job not found: ${opts.jobName}`;
    log(message);
    return fail(message);
  }
  if (!jobIsEnabled(job)) {
    const message = `Job ${job.name} is disabled`;
    log(message);
    return fail(message);
  }

  const connection = findConnection(bundle, job.connectionName);
  if (!connection) {
    const message = `Job ${job.name}: connection ${job.connectionName} not found`;
    log(message);
    return fail(message);
  }
  if (!connection.enabled) {
    const message = `Job ${job.name}: connection ${connection.name} is disabled`;
    log(message);
    return fail(message);
  }

  try {
    const config = loadConfig();
    const executed = await executeJob({
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

    if (executed.skipReason && executed.skipReason !== 'empty') {
      log(`Job ${job.name}: ${executed.skipReason}`);
      return fail(executed.skipReason, executed);
    }

    return {
      ok: true,
      jobName: job.name,
      ...executed,
      logs,
    };
  } catch (error) {
    const message = discordWebhookErrorMessage(formatTrussError(error));
    log(`Job ${job.name}: ${message}`);
    return fail(message);
  }
}
