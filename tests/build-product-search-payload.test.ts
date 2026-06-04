import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildProductSearchPayload,
  legacyArraysToFilterExpression,
} from '../src/lib/build-product-search-payload.ts';

describe('buildProductSearchPayload', () => {
  it('prefers filterExpression over legacy arrays', () => {
    const payload = buildProductSearchPayload(
      {
        filterExpression: 'category = "Malware"',
        category: ['Phishing'],
      },
      1,
      10
    );
    assert.equal(payload.filterExpression, 'category = "Malware"');
  });

  it('compiles legacy arrays to FilterQL', () => {
    const expr = legacyArraysToFilterExpression({
      category: ['Malware', 'Ransomware'],
      source: ['FeedA'],
    });
    assert.match(expr ?? '', /category = "Malware"/);
    assert.match(expr ?? '', /OR/);
    assert.match(expr ?? '', /source = "FeedA"/);
  });

  it('omits days when startDate is set', () => {
    const payload = buildProductSearchPayload(
      {
        filterExpression: 'category = "Malware"',
        startDate: '2024-01-01',
        days: 7,
      },
      1,
      25
    );
    assert.equal(payload.startDate, '2024-01-01');
    assert.equal(payload.days, undefined);
  });
});
