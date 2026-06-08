import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SearchProductResponse } from '@truss-security/truss-sdk';
import { summarizeProduct } from '../src/lib/summarize-product.ts';

const sampleProduct: SearchProductResponse = {
  id: 42,
  truss_prod_id: 'TP-42',
  title: 'Sample Malware Report',
  category: 'Malware',
  source: 'FeedA',
  type: 'report',
  pub_date: '2024-06-01T12:00:00.000Z',
  indicators: {
    ipv4: ['1.2.3.4', '5.6.7.8'],
    domain: ['evil.example'],
  },
};

describe('summarizeProduct', () => {
  it('returns indicator_type_counts but not raw indicators by default', () => {
    const summary = summarizeProduct(sampleProduct, false);

    assert.equal(summary.id, 42);
    assert.equal(summary.truss_prod_id, 'TP-42');
    assert.equal(summary.title, 'Sample Malware Report');
    assert.deepEqual(summary.indicator_type_counts, { ipv4: 2, domain: 1 });
    assert.equal(summary.indicators, undefined);
  });

  it('includes full indicators when includeIndicators is true', () => {
    const summary = summarizeProduct(sampleProduct, true);

    assert.deepEqual(summary.indicators, {
      ipv4: ['1.2.3.4', '5.6.7.8'],
      domain: ['evil.example'],
    });
  });

  it('omits indicator_type_counts when product has no indicators', () => {
    const summary = summarizeProduct({ ...sampleProduct, indicators: undefined }, false);
    assert.equal(summary.indicator_type_counts, undefined);
  });
});
