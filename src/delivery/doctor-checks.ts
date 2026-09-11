import { existsSync } from 'node:fs';
import { envRefIsSet } from './secret-refs.js';
import { loadDeliveryBundle } from './load-bundle.js';
import { resolveDeliveryPaths } from './paths.js';

export interface DeliveryDoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

/** Schema + env-ref presence. Does not call Truss or Discord. */
export function collectDeliveryDoctorChecks(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env
): DeliveryDoctorCheck[] {
  const paths = resolveDeliveryPaths(cwd);
  if (!existsSync(paths.connectionsFile) && !existsSync(paths.jobsFile)) {
    return [];
  }

  const checks: DeliveryDoctorCheck[] = [];
  try {
    const bundle = loadDeliveryBundle(cwd);
    checks.push({
      name: 'Delivery config',
      ok: true,
      detail: `${bundle.connections.connections.length} connection(s), ${bundle.jobs.jobs.length} job(s)`,
    });

    const enabledJobs = bundle.jobs.jobs.filter((job) => job.enabled !== false);
    if (enabledJobs.length > 0 && !env.TRUSS_API_KEY?.trim()) {
      checks.push({
        name: 'Delivery TRUSS_API_KEY',
        ok: false,
        detail: 'required because enabled jobs are configured',
      });
    }

    for (const connection of bundle.connections.connections) {
      if (!connection.enabled) continue;
      const set = envRefIsSet(connection.webhookUrlEnv, env);
      checks.push({
        name: `Connection ${connection.name}`,
        ok: set,
        detail: set
          ? `${connection.webhookUrlEnv} is set`
          : `${connection.webhookUrlEnv} is unset`,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    checks.push({ name: 'Delivery config', ok: false, detail: message });
  }
  return checks;
}
