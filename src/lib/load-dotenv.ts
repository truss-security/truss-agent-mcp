import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

function applyEnvFile(path: string, shellKeys: Set<string>, overrideUser: boolean): void {
  if (!existsSync(path)) return;

  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');

    if (shellKeys.has(key)) continue;

    if (overrideUser) {
      process.env[key] = value;
    } else {
      process.env[key] ??= value;
    }
  }
}

/** Load env files: user config first, then project .env (project overrides user, never shell). */
export function loadAllEnv(cwd: string = process.cwd()): void {
  const shellKeys = new Set(Object.keys(process.env));
  const home = homedir();

  applyEnvFile(resolve(home, '.config', 'truss', 'env'), shellKeys, false);
  applyEnvFile(resolve(home, '.truss', '.env'), shellKeys, false);
  applyEnvFile(resolve(cwd, '.env'), shellKeys, true);
}

/** @deprecated Use loadAllEnv. Loads only cwd .env */
export function loadDotEnv(cwd: string = process.cwd()): void {
  const shellKeys = new Set(Object.keys(process.env));
  applyEnvFile(resolve(cwd, '.env'), shellKeys, true);
}
