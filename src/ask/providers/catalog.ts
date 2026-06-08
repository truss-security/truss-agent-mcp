export type LlmProviderId = 'anthropic' | 'openai';

export interface LlmModelInfo {
  id: string;
  label: string;
  /** USD per 1M input tokens (for sorting cheapest first) */
  inputUsdPer1M: number;
  /** USD per 1M output tokens */
  outputUsdPer1M: number;
}

export interface LlmProviderInfo {
  id: LlmProviderId;
  label: string;
  apiKeyEnv: string;
  models: LlmModelInfo[];
}

function sortByPrice(models: LlmModelInfo[]): LlmModelInfo[] {
  return [...models].sort((a, b) => a.inputUsdPer1M - b.inputUsdPer1M);
}

const ANTHROPIC_MODELS: LlmModelInfo[] = sortByPrice([
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', inputUsdPer1M: 1, outputUsdPer1M: 5 },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', inputUsdPer1M: 3, outputUsdPer1M: 15 },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', inputUsdPer1M: 15, outputUsdPer1M: 75 },
]);

const OPENAI_MODELS: LlmModelInfo[] = sortByPrice([
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  { id: 'o4-mini', label: 'o4-mini', inputUsdPer1M: 1.1, outputUsdPer1M: 4.4 },
  { id: 'gpt-4o', label: 'GPT-4o', inputUsdPer1M: 2.5, outputUsdPer1M: 10 },
  { id: 'o3', label: 'o3', inputUsdPer1M: 10, outputUsdPer1M: 40 },
]);

export const LLM_PROVIDERS: LlmProviderInfo[] = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    models: ANTHROPIC_MODELS,
  },
  {
    id: 'openai',
    label: 'OpenAI (GPT)',
    apiKeyEnv: 'OPENAI_API_KEY',
    models: OPENAI_MODELS,
  },
];

export function getProvider(id: string): LlmProviderInfo | undefined {
  return LLM_PROVIDERS.find((p) => p.id === id);
}

export function getDefaultModel(providerId: LlmProviderId): string {
  const provider = getProvider(providerId);
  return provider?.models[0]?.id ?? 'claude-sonnet-4-6';
}

export function formatModelPrice(model: LlmModelInfo): string {
  const inPrice = model.inputUsdPer1M < 1 ? model.inputUsdPer1M.toFixed(2) : model.inputUsdPer1M.toFixed(2);
  const outPrice = model.outputUsdPer1M < 1 ? model.outputUsdPer1M.toFixed(2) : model.outputUsdPer1M.toFixed(2);
  return `$${inPrice}/1M in · $${outPrice}/1M out`;
}

export function isKnownModel(providerId: LlmProviderId, modelId: string): boolean {
  return Boolean(getProvider(providerId)?.models.some((m) => m.id === modelId));
}
