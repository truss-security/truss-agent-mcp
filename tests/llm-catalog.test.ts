import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LLM_PROVIDERS } from '../src/ask/providers/catalog.ts';

describe('LLM catalog', () => {
  it('sorts models by input price ascending', () => {
    for (const provider of LLM_PROVIDERS) {
      for (let i = 1; i < provider.models.length; i++) {
        assert.ok(
          provider.models[i].inputUsdPer1M >= provider.models[i - 1].inputUsdPer1M,
          `${provider.id} models not sorted by price`
        );
      }
    }
  });

  it('includes anthropic and openai providers', () => {
    const ids = LLM_PROVIDERS.map((p) => p.id);
    assert.deepEqual(ids, ['anthropic', 'openai']);
  });
});
