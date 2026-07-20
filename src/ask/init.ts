import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEnvValueEmpty, readEnvFile, updateEnvFile } from '../lib/env-file.js';
import { isFullyConfigured, promptLlmSetup } from './init-llm.js';
import { isInteractive, promptLine, promptSecret } from './prompt-line.js';

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  throw new Error('Could not find package root (package.json)');
}

export interface InitOptions {
  interactive?: boolean;
}

export async function runInit(
  cwd: string = process.cwd(),
  fromModuleUrl?: string,
  options: InitOptions = {}
): Promise<number> {
  const interactive = options.interactive ?? isInteractive();
  const envPath = resolve(cwd, '.env');
  const packageRoot = findPackageRoot(dirname(fileURLToPath(fromModuleUrl ?? import.meta.url)));
  const examplePath = join(packageRoot, 'env.example');

  if (!existsSync(examplePath)) {
    console.error(`env.example not found at ${examplePath}`);
    return 1;
  }

  const created = !existsSync(envPath);
  if (created) {
    copyFileSync(examplePath, envPath);
    console.log(`Created ${envPath} from env.example`);
  } else {
    console.log(`Using existing ${envPath}`);
  }

  let values = readEnvFile(envPath);

  if (!interactive) {
    if (isFullyConfigured(values)) {
      console.log('\nConfiguration complete. Run: truss-mcp doctor --remote\n');
      return 0;
    }
    console.log('\nSet these in .env (non-interactive shell):');
    console.log('  Preferred (hosted MCP, same as Cursor/Claude):');
    console.log('    TRUSS_MCP_OAUTH_TOKEN_FILE  — from: truss-mcp doctor --remote --save-token PATH');
    console.log('  Legacy air-gap only:');
    console.log('    TRUSS_MCP_TRANSPORT=stdio and TRUSS_API_KEY');
    console.log('  LLM_PROVIDER, LLM_MODEL, and provider API key (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
    console.log('\nThen run: truss-mcp doctor --remote  (or doctor for stdio)\n');
    return 0;
  }

  console.log('\nTruss MCP setup — hosted OAuth (Cursor/Claude parity) preferred.\n');

  const updates: Record<string, string> = {};

  const hasToken = !isEnvValueEmpty(values.get('TRUSS_MCP_OAUTH_TOKEN_FILE'));
  const hasApiKey = !isEnvValueEmpty(values.get('TRUSS_API_KEY'));

  if (!hasToken && !hasApiKey) {
    console.log('Truss access (choose one):');
    console.log('  1) Remote OAuth token file (recommended — Growth+ dashboard consent)');
    console.log('  2) Legacy API key (stdio / air-gap only)');
    const choice = (await promptLine('Choice [1/2]: ')).trim() || '1';
    if (choice === '2') {
      console.log('Truss API key — from the Truss dashboard (Billing / API settings)');
      const trussKey = await promptSecret('Truss API key');
      if (trussKey) {
        updates.TRUSS_API_KEY = trussKey;
        updates.TRUSS_MCP_TRANSPORT = 'stdio';
        values.set('TRUSS_API_KEY', trussKey);
        values.set('TRUSS_MCP_TRANSPORT', 'stdio');
      }
    } else {
      console.log(
        'Run after init:\n' +
          '  truss-mcp doctor --remote --save-token /tmp/truss-mcp-token\n' +
          'Then set TRUSS_MCP_OAUTH_TOKEN_FILE=/tmp/truss-mcp-token in .env'
      );
      const tokenPath = (await promptLine('Token file path (optional, Enter to skip): ')).trim();
      if (tokenPath) {
        updates.TRUSS_MCP_OAUTH_TOKEN_FILE = tokenPath;
        values.set('TRUSS_MCP_OAUTH_TOKEN_FILE', tokenPath);
      }
    }
  } else if (!hasToken && hasApiKey) {
    console.log('TRUSS_API_KEY is set (legacy stdio). Prefer remote OAuth when possible.');
  }

  const llmUpdates = await promptLlmSetup(values, { alwaysPrompt: true });
  Object.assign(updates, llmUpdates);
  for (const [key, value] of Object.entries(updates)) {
    values.set(key, value);
  }

  if (Object.keys(updates).length > 0) {
    updateEnvFile(envPath, updates);
    console.log(`\nSaved to ${envPath}`);
  }

  values = readEnvFile(envPath);
  if (!isFullyConfigured(values)) {
    console.log('\nStill missing required configuration. Edit .env or run truss-mcp init again.');
    console.log('Remote: set TRUSS_MCP_OAUTH_TOKEN_FILE after doctor --remote --save-token.\n');
    return 1;
  }

  console.log('\nNext steps:');
  if (values.get('TRUSS_MCP_OAUTH_TOKEN_FILE')?.trim()) {
    console.log('  truss-mcp search');
  } else {
    console.log('  truss-mcp doctor --remote --save-token /tmp/truss-mcp-token');
    console.log('  # set TRUSS_MCP_OAUTH_TOKEN_FILE in .env, then:');
    console.log('  truss-mcp search');
    console.log('  # or legacy: TRUSS_MCP_TRANSPORT=stdio truss-mcp search');
  }
  console.log('');
  return 0;
}
