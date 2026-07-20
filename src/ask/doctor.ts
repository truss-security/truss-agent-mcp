import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readEnvFile } from '../lib/env-file.js';
import { describeEnvKey, listEnvFilePaths, loadMergedEnvFile } from '../lib/env-sources.js';
import {
  defaultMcpUrlFromEnv,
  parseDoctorRemoteOptions,
  runValidateRemote,
} from '../remote/validate-remote.js';
import { getProvider } from './providers/catalog.js';
import { resolveLlmFromEnv } from './providers/resolve.js';
import { resolveServerCliPath } from './resolve-server-path.js';

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

function check(name: string, ok: boolean, detail: string): CheckResult {
  return { name, ok, detail };
}

export function wantsRemoteDoctor(argv: string[] = process.argv): boolean {
  return argv.includes('--remote');
}

export async function runDoctor(fromModuleUrl?: string, argv: string[] = process.argv): Promise<number> {
  if (wantsRemoteDoctor(argv)) {
    console.log('Truss MCP doctor — remote OAuth path (hosted MCP)\n');
    console.log(`  Default URL: ${defaultMcpUrlFromEnv()}`);
    console.log('  Tip: pass --url, --strict-claude, --verbose, --save-token, --token-file\n');
    return runValidateRemote(parseDoctorRemoteOptions(argv));
  }

  const results: CheckResult[] = [];
  const envFiles = loadMergedEnvFile();
  const envPaths = listEnvFilePaths();

  const trussStatus = describeEnvKey('TRUSS_API_KEY', envFiles, process.env.TRUSS_API_KEY);
  results.push(check('TRUSS_API_KEY', trussStatus.ok, trussStatus.detail));

  let llm: ReturnType<typeof resolveLlmFromEnv> | undefined;
  try {
    llm = resolveLlmFromEnv();
    const provider = getProvider(llm.provider);
    const llmKeyStatus = describeEnvKey(llm.apiKeyEnv, envFiles, process.env[llm.apiKeyEnv]);
    results.push(check(llm.apiKeyEnv, llmKeyStatus.ok, llmKeyStatus.detail));
    results.push(
      check(
        'LLM',
        true,
        `${provider?.label ?? llm.provider} / ${llm.model}`
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const providerId = (process.env.LLM_PROVIDER?.trim().toLowerCase() || 'anthropic') as
      | 'anthropic'
      | 'openai';
    const provider = getProvider(providerId) ?? getProvider('anthropic')!;
    const llmKeyStatus = describeEnvKey(provider.apiKeyEnv, envFiles, process.env[provider.apiKeyEnv]);
    results.push(check(provider.apiKeyEnv, llmKeyStatus.ok, llmKeyStatus.detail));
    results.push(check('LLM', false, message));
  }

  let serverPath = '';
  try {
    serverPath = resolveServerCliPath(fromModuleUrl ?? import.meta.url);
    results.push(check('MCP server binary', true, serverPath));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push(check('MCP server binary', false, message));
  }

  const trussKey = process.env.TRUSS_API_KEY?.trim();
  if (trussKey) {
    try {
      const { loadConfig } = await import('../config.js');
      const { getTrussClient, resetClientForTests } = await import('../client.js');
      resetClientForTests();
      const config = loadConfig();
      const client = getTrussClient(config);
      await client.search.products({
        filterExpression: 'category = "Malware"',
        days: 7,
        limit: 1,
        page: 1,
      });
      results.push(check('Truss API', true, 'reachable (test search succeeded)'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push(check('Truss API', false, message));
    }
  } else {
    results.push(check('Truss API', false, 'skipped — TRUSS_API_KEY not set'));
  }

  if (llm) {
    try {
      if (llm.provider === 'openai') {
        const client = new OpenAI({ apiKey: llm.apiKey });
        await client.chat.completions.create({
          model: llm.model,
          max_tokens: 8,
          messages: [{ role: 'user', content: 'ping' }],
        });
        results.push(check('OpenAI API', true, `reachable (model: ${llm.model})`));
      } else {
        const client = new Anthropic({ apiKey: llm.apiKey });
        await client.messages.create({
          model: llm.model,
          max_tokens: 8,
          messages: [{ role: 'user', content: 'ping' }],
        });
        results.push(check('Anthropic API', true, `reachable (model: ${llm.model})`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const label = llm.provider === 'openai' ? 'OpenAI API' : 'Anthropic API';
      results.push(check(label, false, message));
    }
  } else {
    results.push(check('LLM API', false, 'skipped — LLM API key not configured'));
  }

  results.push(
    check(
      'Env files',
      envPaths.length > 0,
      envPaths.length > 0 ? envPaths.join(', ') : 'no .env found (run truss-mcp init)'
    )
  );

  const projectEnv = join(process.cwd(), '.env');
  if (existsSync(projectEnv)) {
    const projectValues = readEnvFile(projectEnv);
    const providerId = (process.env.LLM_PROVIDER?.trim().toLowerCase() || 'anthropic') as
      | 'anthropic'
      | 'openai';
    const apiKeyEnv = getProvider(providerId)?.apiKeyEnv ?? 'ANTHROPIC_API_KEY';
    const keysToCheck = ['TRUSS_API_KEY', apiKeyEnv];
    const emptyInProject = keysToCheck.filter(
      (key) => projectValues.has(key) && !projectValues.get(key)?.trim()
    );
    const missingFromFile = keysToCheck.filter((key) => !projectValues.get(key)?.trim());
    if (emptyInProject.length > 0) {
      results.push(
        check('.env values', false, `empty in ${projectEnv}: ${emptyInProject.join(', ')}`)
      );
    } else if (missingFromFile.length > 0) {
      results.push(
        check('.env values', false, `missing in ${projectEnv}: ${missingFromFile.join(', ')}`)
      );
    } else {
      results.push(check('.env values', true, 'required keys have values in .env'));
    }
  }

  console.log('Truss MCP doctor — local stdio / REST keys\n');
  console.log('  For hosted OAuth (Cursor/Claude): truss-mcp doctor --remote [--strict-claude]\n');
  for (const r of results) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
  }
  console.log('');

  return results.every((r) => r.ok) ? 0 : 1;
}
