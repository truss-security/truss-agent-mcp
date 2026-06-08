import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isEnvValueEmpty, readEnvFile, updateEnvFile } from '../lib/env-file.js';
import { maskSecret } from '../lib/mask-secret.js';
import { isFullyConfigured, needsLlmSetup, promptLlmSetup } from './init-llm.js';
import { getProvider } from './providers/catalog.js';
import { isInteractive, promptSecret } from './prompt-line.js';

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

  if (isFullyConfigured(values)) {
    const providerId = values.get('LLM_PROVIDER')?.trim() || 'anthropic';
    const provider = getProvider(providerId as 'anthropic' | 'openai');
    console.log('\nAlready configured:');
    console.log(`  ✓ TRUSS_API_KEY (${maskSecret(values.get('TRUSS_API_KEY')!)})`);
    console.log(`  ✓ ${provider?.apiKeyEnv} (${maskSecret(values.get(provider?.apiKeyEnv ?? 'ANTHROPIC_API_KEY')!)})`);
    console.log(`  ✓ LLM: ${provider?.label ?? providerId} / ${values.get('LLM_MODEL')}`);
    console.log('\nRun: truss-mcp doctor\n');
    return 0;
  }

  if (!interactive) {
    console.log('\nSet these in .env (non-interactive shell):');
    if (isEnvValueEmpty(values.get('TRUSS_API_KEY'))) {
      console.log('  TRUSS_API_KEY  — From the Truss dashboard');
    }
    if (needsLlmSetup(values)) {
      console.log('  LLM_PROVIDER, LLM_MODEL, and provider API key (ANTHROPIC_API_KEY or OPENAI_API_KEY)');
    }
    console.log('\nThen run: truss-mcp doctor\n');
    return 0;
  }

  const updates: Record<string, string> = {};

  if (isEnvValueEmpty(values.get('TRUSS_API_KEY'))) {
    console.log('\nTruss API key');
    console.log('  From the Truss dashboard (Billing / API settings)');
    const trussKey = await promptSecret('Truss API key');
    if (trussKey) {
      updates.TRUSS_API_KEY = trussKey;
      values.set('TRUSS_API_KEY', trussKey);
    }
  }

  const llmUpdates = await promptLlmSetup(values);
  Object.assign(updates, llmUpdates);
  values = readEnvFile(envPath);
  for (const [key, value] of Object.entries(updates)) {
    values.set(key, value);
  }

  if (Object.keys(updates).length > 0) {
    updateEnvFile(envPath, updates);
    console.log(`\nSaved to ${envPath}`);
  }

  values = readEnvFile(envPath);
  if (!isFullyConfigured(values)) {
    console.log('\nStill missing required configuration. Edit .env or run truss-mcp init again.\n');
    return 1;
  }

  console.log('\nNext steps:');
  console.log('  truss-mcp doctor');
  console.log('  truss-mcp search   (threat-intel retrieval)');
  console.log('  truss-mcp ask      (general assistant)\n');
  return 0;
}
