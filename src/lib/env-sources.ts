import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { isEnvValueEmpty, readEnvFile } from './env-file.js';
import { maskSecret } from './mask-secret.js';

export interface EnvKeyStatus {
  key: string;
  ok: boolean;
  detail: string;
}

export function listEnvFilePaths(cwd: string = process.cwd()): string[] {
  const home = homedir();
  return [
    resolve(cwd, '.env'),
    join(home, '.config', 'truss', 'env'),
    join(home, '.truss', '.env'),
  ].filter((p) => existsSync(p));
}

export function loadMergedEnvFile(cwd: string = process.cwd()): Map<string, string> {
  const merged = new Map<string, string>();
  const home = homedir();
  const paths = [
    join(home, '.config', 'truss', 'env'),
    join(home, '.truss', '.env'),
    resolve(cwd, '.env'),
  ];

  for (const path of paths) {
    if (!existsSync(path)) continue;
    for (const [key, value] of readEnvFile(path)) {
      merged.set(key, value);
    }
  }

  return merged;
}

export function describeEnvKey(
  key: string,
  envFiles: Map<string, string>,
  runtimeValue: string | undefined
): EnvKeyStatus {
  const fileValue = envFiles.get(key);
  const fileHasValue = !isEnvValueEmpty(fileValue);
  const runtimeHasValue = !isEnvValueEmpty(runtimeValue);

  if (fileHasValue) {
    return { key, ok: true, detail: `configured in .env (${maskSecret(fileValue!)})` };
  }

  if (runtimeHasValue) {
    return { key, ok: true, detail: `set in environment (${maskSecret(runtimeValue!)})` };
  }

  const inFile = envFiles.has(key);
  if (inFile) {
    return { key, ok: false, detail: 'empty in .env — run truss-mcp init' };
  }

  return { key, ok: false, detail: 'missing — run truss-mcp init' };
}
