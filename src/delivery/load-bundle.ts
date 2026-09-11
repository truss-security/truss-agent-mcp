import { existsSync, readFileSync } from 'node:fs';
import { LEGACY_ARRAY_FILTER_KEYS, type ApiSearchFilter } from '../lib/build-product-search-payload.js';
import {
  agentConfigSchema,
  connectionsFileSchema,
  jobsFileSchema,
  type AgentConfig,
  type ConnectionsFile,
  type DeliveryJob,
  type DiscordConnection,
  type JobsFile,
} from './schemas.js';
import { resolveDeliveryPaths, type DeliveryPaths } from './paths.js';

export interface DeliveryBundle {
  paths: DeliveryPaths;
  agent: AgentConfig;
  connections: ConnectionsFile;
  jobs: JobsFile;
}

function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function formatZodError(path: string, error: { issues: { path: (string | number)[]; message: string }[] }): string {
  const details = error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
  return `Invalid ${path}: ${details}`;
}

export function loadDeliveryBundle(cwd: string = process.cwd()): DeliveryBundle {
  const paths = resolveDeliveryPaths(cwd);

  if (!existsSync(paths.connectionsFile)) {
    throw new Error(`Connections file not found: ${paths.connectionsFile}`);
  }
  if (!existsSync(paths.jobsFile)) {
    throw new Error(`Jobs file not found: ${paths.jobsFile}`);
  }

  const connectionsParsed = connectionsFileSchema.safeParse(readJsonFile(paths.connectionsFile));
  if (!connectionsParsed.success) {
    throw new Error(formatZodError(paths.connectionsFile, connectionsParsed.error));
  }

  const jobsParsed = jobsFileSchema.safeParse(readJsonFile(paths.jobsFile));
  if (!jobsParsed.success) {
    throw new Error(formatZodError(paths.jobsFile, jobsParsed.error));
  }

  let agent: AgentConfig = { agentName: 'truss-agent' };
  if (existsSync(paths.agentFile)) {
    const agentParsed = agentConfigSchema.safeParse(readJsonFile(paths.agentFile));
    if (!agentParsed.success) {
      throw new Error(formatZodError(paths.agentFile, agentParsed.error));
    }
    agent = agentParsed.data;
  }

  return {
    paths,
    agent,
    connections: connectionsParsed.data,
    jobs: jobsParsed.data,
  };
}

export function hasSearchFilter(filter: ApiSearchFilter | undefined): boolean {
  if (!filter) return false;
  if (filter.filterExpression?.trim()) return true;
  for (const key of LEGACY_ARRAY_FILTER_KEYS) {
    const values = filter[key];
    if (Array.isArray(values) && values.some((v) => String(v).trim())) return true;
  }
  return false;
}

export function resolveJobFilter(
  job: DeliveryJob,
  connection: DiscordConnection
): ApiSearchFilter | undefined {
  if (hasSearchFilter(job.filter)) return job.filter;
  if (hasSearchFilter(connection.query?.filter)) return connection.query?.filter;
  return undefined;
}

/** Delivery window in minutes (not the investigation default of 7 days). */
export function resolveWindowMinutes(job: DeliveryJob, connection: DiscordConnection): number {
  if (job.windowMinutes != null) return job.windowMinutes;
  if (job.windowDays != null) return job.windowDays * 24 * 60;
  if (typeof job.schedule === 'number') return job.schedule;
  if (connection.query?.windowMinutes != null) return connection.query.windowMinutes;
  if (connection.query?.windowDays != null) return connection.query.windowDays * 24 * 60;
  return 24 * 60;
}

export function findConnection(
  bundle: DeliveryBundle,
  name: string
): DiscordConnection | undefined {
  return bundle.connections.connections.find((c) => c.name === name);
}

export function jobIsEnabled(job: DeliveryJob): boolean {
  return job.enabled !== false;
}
