import {
  formatModelPrice,
  getDefaultModel,
  getProvider,
  LLM_PROVIDERS,
  type LlmProviderId,
} from './providers/catalog.js';
import { isInteractive, promptLine, promptSecret } from './prompt-line.js';

export async function promptLlmSetup(
  values: Map<string, string>
): Promise<Record<string, string>> {
  const updates: Record<string, string> = {};

  let providerId = values.get('LLM_PROVIDER')?.trim().toLowerCase() as LlmProviderId | undefined;
  if (!providerId || !getProvider(providerId)) {
    console.log('\nChoose LLM provider:\n');
    LLM_PROVIDERS.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.label}`);
    });
    const choice = await promptLine('\nProvider [1]: ');
    const index = choice ? Number.parseInt(choice, 10) - 1 : 0;
    providerId = LLM_PROVIDERS[index]?.id ?? 'anthropic';
    updates.LLM_PROVIDER = providerId;
    values.set('LLM_PROVIDER', providerId);
  }

  const provider = getProvider(providerId)!;
  const currentModel =
    values.get('LLM_MODEL')?.trim() ||
    (providerId === 'anthropic' ? values.get('ANTHROPIC_MODEL')?.trim() : undefined) ||
    (providerId === 'openai' ? values.get('OPENAI_MODEL')?.trim() : undefined);

  if (!currentModel) {
    console.log(`\nModels for ${provider.label} (sorted by input price, lowest first):\n`);
    provider.models.forEach((model, i) => {
      console.log(`  ${i + 1}. ${model.id.padEnd(20)} ${formatModelPrice(model)}`);
    });
    const defaultIndex = provider.models.findIndex((m) => m.id === getDefaultModel(providerId!));
    const defaultLabel = defaultIndex >= 0 ? String(defaultIndex + 1) : '1';
    const choice = await promptLine(`\nModel [${defaultLabel}]: `);
    const index = choice ? Number.parseInt(choice, 10) - 1 : defaultIndex >= 0 ? defaultIndex : 0;
    const modelId = provider.models[index]?.id ?? getDefaultModel(providerId);
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
  const providerId = (values.get('LLM_PROVIDER')?.trim().toLowerCase() || 'anthropic') as LlmProviderId;
  const provider = getProvider(providerId) ?? getProvider('anthropic')!;
  const modelMissing = !hasModel(values, providerId);
  const keyMissing = !values.get(provider.apiKeyEnv)?.trim();
  return modelMissing || keyMissing;
}

export function isFullyConfigured(values: Map<string, string>): boolean {
  if (!values.get('TRUSS_API_KEY')?.trim()) return false;
  return !needsLlmSetup(values);
}
