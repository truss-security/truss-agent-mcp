import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function findPackageJson(startDir: string): string | undefined {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  return undefined;
}

export function readPackageVersion(fromModuleUrl: string = import.meta.url): string {
  try {
    const dir = dirname(fileURLToPath(fromModuleUrl));
    const pkgPath = findPackageJson(dir);
    if (!pkgPath) return '0.0.0';
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
