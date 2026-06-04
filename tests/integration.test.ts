import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateExpressionSyntax } from '@truss-security/truss-sdk';

const apiKey = process.env.TRUSS_API_KEY?.trim();
const runLive = process.env.TRUSS_RUN_INTEGRATION === '1' && apiKey;

describe('integration (optional)', () => {
  it('skips live API test unless TRUSS_RUN_INTEGRATION=1 and TRUSS_API_KEY set', async (t) => {
    if (!runLive) {
      t.skip('Set TRUSS_RUN_INTEGRATION=1 and TRUSS_API_KEY to run live search');
      return;
    }

    const { loadConfig } = await import('../src/config.ts');
    const { getTrussClient, resetClientForTests } = await import('../src/client.ts');
    resetClientForTests();
    const config = loadConfig();
    const client = getTrussClient(config);
    const response = await client.search.products({
      filterExpression: 'category = "Malware"',
      days: 7,
      limit: 3,
      page: 1,
    });
    assert.ok(Array.isArray(response.products));
    assert.ok(typeof response.total === 'number');
  });
});

describe('FilterQL validation', () => {
  it('accepts a simple expression', () => {
    assert.equal(validateExpressionSyntax('category = "Malware"'), true);
  });

  it('rejects invalid syntax', () => {
    assert.equal(validateExpressionSyntax('category === Malware'), false);
  });
});
