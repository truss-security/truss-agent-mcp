import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    map.set(trimmed.slice(0, eq).trim(), trimmed.slice(eq + 1).trim());
  }
  return map;
}

export function isEnvValueEmpty(value: string | undefined): boolean {
  return !value?.trim();
}

export function updateEnvFile(envPath: string, updates: Record<string, string>): void {
  const content = readFileSync(envPath, 'utf8');
  let next = content;

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^(${escapeRegExp(key)}=).*$`, 'm');
    if (regex.test(next)) {
      next = next.replace(regex, `$1${value}`);
    } else {
      next = next.endsWith('\n') ? next : `${next}\n`;
      next += `${key}=${value}\n`;
    }
  }

  writeFileSync(envPath, next);
}

export function readEnvFile(envPath: string): Map<string, string> {
  if (!existsSync(envPath)) return new Map();
  return parseEnvFile(readFileSync(envPath, 'utf8'));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
