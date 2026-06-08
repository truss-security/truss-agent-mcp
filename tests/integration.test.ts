import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateExpressionSyntax } from '@truss-security/truss-sdk';

const apiKey = process.env.TRUSS_API_KEY?.trim();
const runLive = process.env.TRUSS_RUN_INTEGRATION === '1' && apiKey;
const skipReason = 'Set TRUSS_RUN_INTEGRATION=1 and TRUSS_API_KEY to run live API tests';

async function getLiveClient() {
  const { loadConfig } = await import('../src/config.ts');
  const { getTrussClient, resetClientForTests } = await import('../src/client.ts');
  resetClientForTests();
  const config = loadConfig();
  return getTrussClient(config);
}

describe('integration (optional)', () => {
  it('searches products via POST /product/search', async (t) => {
    if (!runLive) {
      t.skip(skipReason);
      return;
    }

    const client = await getLiveClient();
    const response = await client.search.products({
      filterExpression: 'category = "Malware"',
      days: 7,
      limit: 3,
      page: 1,
    });

    assert.ok(Array.isArray(response.products));
    assert.ok(typeof response.total === 'number');
    assert.ok(typeof response.page === 'number');
    assert.ok(typeof response.limit === 'number');
    assert.ok(typeof response.hasMore === 'boolean');
  });

  it('returns STIX bundle via POST /product/search/stix', async (t) => {
    if (!runLive) {
      t.skip(skipReason);
      return;
    }

    const client = await getLiveClient();
    const stix = await client.search.productsStix({
      filterExpression: 'category = "Malware"',
      days: 7,
      limit: 2,
      page: 1,
    });

    assert.ok(stix);
    assert.equal(stix.type, 'bundle');
    assert.ok(Array.isArray(stix.objects));
  });

  it('fetches single-product STIX via GET /product/{id}/stix', async (t) => {
    if (!runLive) {
      t.skip(skipReason);
      return;
    }

    const client = await getLiveClient();
    const search = await client.search.products({
      filterExpression: 'category = "Malware"',
      days: 30,
      limit: 1,
      page: 1,
    });

    const productId = search.products[0]?.id;
    if (productId == null) {
      t.skip('No products returned from search; cannot test get_product_stix');
      return;
    }

    const stix = await client.search.productStix(productId);
    assert.ok(stix);
    assert.equal(stix.type, 'bundle');
    assert.ok(Array.isArray(stix.objects));
    assert.ok(stix.objects.length > 0);
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
