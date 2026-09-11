import { maskSecret } from '../lib/mask-secret.js';

export class SecretRefError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecretRefError';
  }
}

/** Redact a webhook URL (secret is often in the path). Never returns the full URL. */
export function maskWebhookUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return 'empty';
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}/… (${trimmed.length} chars)`;
  } catch {
    return maskSecret(trimmed);
  }
}

export function webhookEnvNameFromConnectionName(name: string): string {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `WEBHOOK_${slug || 'CONNECTION'}`;
}

export function resolveEnvRef(
  envVarName: string,
  env: NodeJS.ProcessEnv = process.env
): string {
  const value = env[envVarName]?.trim();
  if (!value) {
    throw new SecretRefError(`Environment variable ${envVarName} is unset or empty`);
  }
  return value;
}

export function envRefIsSet(envVarName: string, env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env[envVarName]?.trim());
}
