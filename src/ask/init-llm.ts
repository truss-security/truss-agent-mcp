import {
  formatModelPrice,
  getDefaultModel,
  getProvider,
  LLM_PROVIDERS,
  type LlmProviderId,
} from './providers/catalog.js';
import { promptLine, promptSecret } from './prompt-line.js';

export interface LlmSetupOptions {
  /** When true, always show provider and model menus (interactive init). */
  alwaysPrompt?: boolean;
}

function resolveProviderId(values: Map<string, string>): LlmProviderId | undefined {
  const raw = values.get('LLM_PROVIDER')?.trim().toLowerCase();
  if (raw && getProvider(raw as LlmProviderId)) return raw as LlmProviderId;
  return undefined;
}

function resolveCurrentModel(values: Map<string, string>, providerId: LlmProviderId): string | undefined {
  const llmModel = values.get('LLM_MODEL')?.trim();
  if (llmModel) return llmModel;
  if (providerId === 'anthropic') return values.get('ANTHROPIC_MODEL')?.trim();
  if (providerId === 'openai') return values.get('OPENAI_MODEL')?.trim();
  return undefined;
}

export async function promptLlmSetup(
  values: Map<string, string>,
  options: LlmSetupOptions = {}
): Promise<Record<string, string>> {
  const alwaysPrompt = options.alwaysPrompt ?? false;
  const updates: Record<string, string> = {};

  const existingProvider = resolveProviderId(values);
  let providerId = existingProvider;

  if (alwaysPrompt || !providerId) {
    console.log('\nChoose LLM provider:\n');
    const currentIndex = existingProvider
      ? LLM_PROVIDERS.findIndex((p) => p.id === existingProvider)
      : -1;
    LLM_PROVIDERS.forEach((p, i) => {
      const marker = i === currentIndex ? '  ← current' : '';
      console.log(`  ${i + 1}. ${p.label}${marker}`);
    });
    const defaultChoice = currentIndex >= 0 ? String(currentIndex + 1) : '1';
    const choice = await promptLine(`\nProvider [${defaultChoice}]: `);
    const index = choice ? Number.parseInt(choice, 10) - 1 : currentIndex >= 0 ? currentIndex : 0;
    providerId = LLM_PROVIDERS[index]?.id ?? existingProvider ?? 'anthropic';
    updates.LLM_PROVIDER = providerId;
    values.set('LLM_PROVIDER', providerId);
  }

  const provider = getProvider(providerId!)!;
  const existingModel = resolveCurrentModel(values, providerId!);

  if (alwaysPrompt || !existingModel) {
    console.log(`\nModels for ${provider.label} (sorted by input price, lowest first):\n`);
    const currentModelIndex = existingModel
      ? provider.models.findIndex((m) => m.id === existingModel)
      : -1;
    provider.models.forEach((model, i) => {
      const marker = i === currentModelIndex ? '  ← current' : '';
      console.log(`  ${i + 1}. ${model.id.padEnd(20)} ${formatModelPrice(model)}${marker}`);
    });
    const defaultIndex =
      currentModelIndex >= 0
        ? currentModelIndex
        : provider.models.findIndex((m) => m.id === getDefaultModel(providerId!));
    const defaultLabel = defaultIndex >= 0 ? String(defaultIndex + 1) : '1';
    const choice = await promptLine(`\nModel [${defaultLabel}]: `);
    const index = choice ? Number.parseInt(choice, 10) - 1 : defaultIndex >= 0 ? defaultIndex : 0;
    const modelId = provider.models[index]?.id ?? getDefaultModel(providerId!);
    updates.LLM_MODEL = modelId;
    values.set('LLM_MODEL', modelId);
    console.log(`  Selected: ${modelId}`);
  }

  const apiKey = values.get(provider.apiKeyEnv);
  if (!apiKey?.trim()) {
    console.log(`\n${provider.label} API key`);
    console.log(`  Set ${provider.apiKeyEnv} for truss-mcp search / ask`);
    const value = await promptSecret(`${provider.label} API key`);
    if (value) {
      updates[provider.apiKeyEnv] = value;
      values.set(provider.apiKeyEnv, value);
    }
  }

  return updates;
}

function hasModel(values: Map<string, string>, providerId: LlmProviderId): boolean {
  if (values.get('LLM_MODEL')?.trim()) return true;
  if (providerId === 'anthropic' && values.get('ANTHROPIC_MODEL')?.trim()) return true;
  if (providerId === 'openai' && values.get('OPENAI_MODEL')?.trim()) return true;
  return false;
}

export function needsLlmSetup(values: Map<string, string>): boolean {
  const providerId = resolveProviderId(values) ?? 'anthropic';
  const provider = getProvider(providerId) ?? getProvider('anthropic')!;
  const modelMissing = !hasModel(values, providerId);
  const keyMissing = !values.get(provider.apiKeyEnv)?.trim();
  return modelMissing || keyMissing;
}

export function isFullyConfigured(values: Map<string, string>): boolean {
  if (!values.get('TRUSS_API_KEY')?.trim()) return false;
  return !needsLlmSetup(values);
}
