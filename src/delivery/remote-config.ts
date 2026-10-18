import { agentConfigSchema, connectionsFileSchema, jobsFileSchema } from './schemas.js';
import type { DeliveryBundle } from './load-bundle.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function deliveryConfigIdFromEnv(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const id = env.TRUSS_DELIVERY_CONFIG_ID?.trim();
  return id || undefined;
}

export function deliveryRemoteFromEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env.TRUSS_DELIVERY_REMOTE?.trim().toLowerCase();
  return value === '1' || value === 'true';
}

export function deliveryRunnerFromEnv(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const name = env.TRUSS_DELIVERY_RUNNER?.trim();
  return name || undefined;
}

export function deliveryBundleFromPayload(payload: unknown): Pick<DeliveryBundle, 'agent' | 'connections' | 'jobs'> {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Delivery config response was empty');
  }
  const body = payload as { agent?: unknown; connections?: unknown; jobs?: unknown };
  const agentParsed = agentConfigSchema.safeParse(body.agent);
  const connectionsParsed = connectionsFileSchema.safeParse(body.connections);
  const jobsParsed = jobsFileSchema.safeParse(body.jobs);
  if (!agentParsed.success || !connectionsParsed.success || !jobsParsed.success) {
    throw new Error('Delivery config response did not match the job schema');
  }
  return {
    agent: agentParsed.data,
    connections: connectionsParsed.data,
    jobs: jobsParsed.data,
  };
}

export async function fetchRemoteDeliveryBundle(
  configId: string,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<Pick<DeliveryBundle, 'agent' | 'connections' | 'jobs'>> {
  if (!UUID_RE.test(configId)) {
    throw new Error('TRUSS_DELIVERY_CONFIG_ID is not a valid id');
  }
  const config = apiSettings(env);
  const url = `${config.baseUrl}/delivery/config/${configId}`;
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-api-key': config.apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`Delivery config request failed (HTTP ${response.status})`);
  }
  return deliveryBundleFromPayload(await response.json());
}

export async function fetchAccountDeliveryBundle(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = fetch
): Promise<Pick<DeliveryBundle, 'agent' | 'connections' | 'jobs'>> {
  const runner = deliveryRunnerFromEnv(env);
  if (!runner) {
    throw new Error('TRUSS_DELIVERY_RUNNER is required when TRUSS_DELIVERY_REMOTE is set');
  }
  const config = apiSettings(env);
  const response = await fetchImpl(`${config.baseUrl}/delivery/config?runner=${encodeURIComponent(runner)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'x-api-key': config.apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`Delivery config request failed (HTTP ${response.status})`);
  }
  const bundle = deliveryBundleFromPayload(await response.json());
  if (bundle.jobs.jobs.length === 0) {
    throw new Error('No delivery jobs are saved for this API key');
  }
  return bundle;
}

function apiSettings(env: NodeJS.ProcessEnv): { apiKey: string; baseUrl: string } {
  const apiKey = env.TRUSS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('TRUSS_API_KEY is required. Set it in the host env file.');
  }
  const baseUrl = (env.TRUSS_API_URL?.trim() || 'https://api.truss-security.com').replace(/\/+$/, '');
  return { apiKey, baseUrl };
}
