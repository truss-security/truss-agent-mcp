import { resolve } from 'node:path';

export interface DeliveryPaths {
  cwd: string;
  agentFile: string;
  connectionsFile: string;
  jobsFile: string;
  envFile: string;
}

export function resolveDeliveryPaths(cwd: string = process.cwd()): DeliveryPaths {
  return {
    cwd,
    agentFile: resolve(cwd, process.env.AGENT_CONFIG_FILE?.trim() || 'config/agent.json'),
    connectionsFile: resolve(cwd, process.env.CONNECTIONS_FILE?.trim() || 'config/connections.json'),
    jobsFile: resolve(cwd, process.env.JOBS_FILE?.trim() || 'config/jobs.json'),
    envFile: resolve(cwd, '.env'),
  };
}
