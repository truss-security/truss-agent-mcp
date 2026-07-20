import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRunSearchQuery } from '../src/ask/extract-filter.ts';
import { DEFAULT_SEARCH_DAYS } from '../src/ask/search-window.ts';

describe('buildRunSearchQuery', () => {
  it('includes filterExpression and default 7 days', () => {
    const q = buildRunSearchQuery('tags = "Sandworm"');
    assert.match(q, /tags = "Sandworm"/);
    assert.match(q, new RegExp(`days: ${DEFAULT_SEARCH_DAYS}`));
    assert.match(q, /validate_filter_expression/i);
  });

  it('includes explicit date range', () => {
    const q = buildRunSearchQuery('tags = "Sandworm"', {
      startDate: '2026-06-01',
      endDate: '2026-06-08',
    });
    assert.match(q, /startDate: "2026-06-01"/);
    assert.match(q, /endDate: "2026-06-08"/);
    assert.doesNotMatch(q, /Use days:/);
  });

  it('includes custom rolling days', () => {
    const q = buildRunSearchQuery('tags = "Sandworm"', { days: 30 });
    assert.match(q, /days: 30/);
  });

  it('remote transport uses hosted search tools', () => {
    const q = buildRunSearchQuery('ransomware healthcare', { days: 7 }, 'remote');
    assert.match(q, /search_threats/);
    assert.match(q, /lookup_ioc/);
    assert.doesNotMatch(q, /validate_filter_expression/);
  });
});
