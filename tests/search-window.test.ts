import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SEARCH_DAYS,
  extractSearchWindowFromText,
  formatSearchWindow,
  isExtendedSearchWindow,
  parseSearchWindowArg,
} from '../src/ask/search-window.ts';

describe('search-window', () => {
  it('DEFAULT_SEARCH_DAYS is 7', () => {
    assert.equal(DEFAULT_SEARCH_DAYS, 7);
  });

  it('parseSearchWindowArg parses rolling days', () => {
    assert.deepEqual(parseSearchWindowArg('30'), { days: 30 });
  });

  it('parseSearchWindowArg parses explicit range', () => {
    assert.deepEqual(parseSearchWindowArg('start:2026-06-01 end:2026-06-08'), {
      startDate: '2026-06-01',
      endDate: '2026-06-08',
    });
  });

  it('extractSearchWindowFromText parses natural language', () => {
    assert.deepEqual(extractSearchWindowFromText('use last 30 days'), { days: 30 });
    assert.deepEqual(
      extractSearchWindowFromText('from 2026-06-01 to 2026-06-08'),
      { startDate: '2026-06-01', endDate: '2026-06-08' }
    );
  });

  it('formatSearchWindow formats days and ranges', () => {
    assert.equal(formatSearchWindow({ days: 7 }), 'last 7 days');
    assert.equal(
      formatSearchWindow({ startDate: '2026-06-01', endDate: '2026-06-08' }),
      '2026-06-01 to 2026-06-08'
    );
  });

  it('isExtendedSearchWindow detects wider windows', () => {
    assert.equal(isExtendedSearchWindow({ days: 7 }), false);
    assert.equal(isExtendedSearchWindow({ days: 30 }), true);
    assert.equal(
      isExtendedSearchWindow({ startDate: '2026-06-01', endDate: '2026-06-08' }),
      true
    );
  });
});
