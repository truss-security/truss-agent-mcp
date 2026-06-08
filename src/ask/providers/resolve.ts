import {
  getDefaultModel,
  getProvider,
  isKnownModel,
  type LlmProviderId,
} from './catalog.js';

export interface ResolvedLlm {
  provider: LlmProviderId;
  model: string;
  apiKey: string;
  apiKeyEnv: string;
}

function parseProvider(raw: string | undefined): LlmProviderId {
  const value = raw?.trim().toLowerCase();
  if (value === 'openai') return 'openai';
  return 'anthropic';
}

function resolveModel(provider: LlmProviderId): string {
  const llmModel = process.env.LLM_MODEL?.trim();
  if (llmModel) return llmModel;

  if (provider === 'anthropic') {
    const legacy = process.env.ANTHROPIC_MODEL?.trim();
    if (legacy) return legacy;
  }

  if (provider === 'openai') {
    const legacy = process.env.OPENAI_MODEL?.trim();
    if (legacy) return legacy;
  }

  return getDefaultModel(provider);
}

export function resolveLlmFromEnv(): ResolvedLlm {
  const provider = parseProvider(process.env.LLM_PROVIDER);
  const providerInfo = getProvider(provider);
  if (!providerInfo) {
    throw new Error(`Unknown LLM_PROVIDER: ${process.env.LLM_PROVIDER}`);
  }

  const apiKey = process.env[providerInfo.apiKeyEnv]?.trim();
  if (!apiKey) {
    throw new Error(
      `${providerInfo.apiKeyEnv} is required for truss CLI (LLM_PROVIDER=${provider}). Set it in your environment or .env file.`
    );
  }

  const model = resolveModel(provider);
  if (!isKnownModel(provider, model)) {
    console.warn(`Warning: model "${model}" is not in the ${provider} catalog — using it anyway.`);
  }

  return { provider, model, apiKey, apiKeyEnv: providerInfo.apiKeyEnv };
}
