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

function serverPathOverride(): string | undefined {
  return (
    process.env.TRUSS_MCP_SERVER_PATH?.trim() ||
    process.env.TRUSS_ASK_SERVER_PATH?.trim() ||
    undefined
  );
}

export function resolveServerCliPath(fromModuleUrl: string = import.meta.url): string {
  const override = serverPathOverride();
  if (override) {
    const resolved = resolve(override);
    if (!existsSync(resolved)) {
      throw new Error(`TRUSS_MCP_SERVER_PATH does not exist: ${resolved}`);
    }
    return resolved;
  }

  const moduleDir = dirname(fileURLToPath(fromModuleUrl));
  const packageRoot = findPackageRoot(moduleDir);
  const serverPath = join(packageRoot, 'dist', 'truss-cli.js');

  if (!existsSync(serverPath)) {
    const isDevCheckout = existsSync(join(packageRoot, 'src', 'truss-cli.ts'));
    const hint = isDevCheckout
      ? 'Run "npm run build" in the truss-agent-mcp directory.'
      : 'Reinstall @truss-security/truss-agent-mcp (npm install -g @truss-security/truss-agent-mcp).';
    throw new Error(`MCP server not found at ${serverPath}. ${hint}`);
  }

  return serverPath;
}
