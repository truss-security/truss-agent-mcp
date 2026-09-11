import type { ProductSummary } from '../lib/summarize-product.js';
import type { DeliveryJob, DiscordConnection } from './schemas.js';
import { formatDiscordMetadata } from './formatters/metadata.js';
import { resolveJobFilter, resolveWindowMinutes } from './load-bundle.js';
import { SecretRefError, resolveEnvRef } from './secret-refs.js';

export interface ExecuteJobResult {
  pushed: boolean;
  productCount: number;
  skipReason?: string;
}

export interface ExecuteJobDeps {
  search: (opts: {
    filter: NonNullable<ReturnType<typeof resolveJobFilter>>;
    windowMinutes: number;
    includeIndicators: boolean;
  }) => Promise<ProductSummary[]>;
  postDiscord: (webhookUrl: string, body: unknown) => Promise<void>;
  env?: NodeJS.ProcessEnv;
  log?: (message: string) => void;
}

export async function executeJob(opts: {
  job: DeliveryJob;
  connection: DiscordConnection;
  agentName: string;
  deps: ExecuteJobDeps;
}): Promise<ExecuteJobResult> {
  const { job, connection, agentName, deps } = opts;
  const log = deps.log ?? (() => undefined);
  const env = deps.env ?? process.env;

  if (job.outputFormat !== 'metadata') {
    return {
      pushed: false,
      productCount: 0,
      skipReason: `outputFormat ${job.outputFormat} is not supported in the Discord slice (metadata only)`,
    };
  }

  if (connection.type !== 'discord') {
    return {
      pushed: false,
      productCount: 0,
      skipReason: `connection type ${String((connection as { type: string }).type)} is not supported in the Discord slice`,
    };
  }

  const filter = resolveJobFilter(job, connection);
  if (!filter) {
    log(`Job ${job.name}: skipped (no filter on job or connection)`);
    return { pushed: false, productCount: 0, skipReason: 'no filter' };
  }

  let webhookUrl: string;
  try {
    webhookUrl = resolveEnvRef(connection.webhookUrlEnv, env);
  } catch (error) {
    const message = error instanceof SecretRefError ? error.message : String(error);
    log(`Job ${job.name}: skipped (${message})`);
    return { pushed: false, productCount: 0, skipReason: message };
  }

  const windowMinutes = resolveWindowMinutes(job, connection);
  log(`Job ${job.name}: searching last ${windowMinutes} minute(s)`);
  const products = await deps.search({
    filter,
    windowMinutes,
    includeIndicators: job.includeIndicators === true,
  });

  if (products.length === 0) {
    log(`Job ${job.name}: no products in that window; not posting`);
    return { pushed: false, productCount: 0, skipReason: 'empty' };
  }

  const body = formatDiscordMetadata(products, agentName);
  await deps.postDiscord(webhookUrl, body);
  log(`Job ${job.name}: pushed ${products.length} product(s)`);
  return { pushed: true, productCount: products.length };
}
