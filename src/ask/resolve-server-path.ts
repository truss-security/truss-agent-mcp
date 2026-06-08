import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not find package root (package.json)');
}

export function resolveServerCliPath(fromModuleUrl: string = import.meta.url): string {
  const override = process.env.TRUSS_ASK_SERVER_PATH?.trim();
  if (override) {
    const resolved = resolve(override);
    if (!existsSync(resolved)) {
      throw new Error(`TRUSS_ASK_SERVER_PATH does not exist: ${resolved}`);
    }
    return resolved;
  }

  const moduleDir = dirname(fileURLToPath(fromModuleUrl));
  const packageRoot = findPackageRoot(moduleDir);
  const serverPath = join(packageRoot, 'dist', 'cli.js');

  if (!existsSync(serverPath)) {
    throw new Error(
      `MCP server not found at ${serverPath}. Run "npm run build" before truss search or truss ask.`
    );
  }

  return serverPath;
}
