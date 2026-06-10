import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSearchResultsTable,
  parseSearchToolResult,
} from '../src/lib/format-search-results.ts';
import { initColorFromEnv, stripAnsi } from '../src/lib/terminal-theme.ts';

describe('format-search-results', () => {
  beforeEach(() => {
    process.env.NO_COLOR = '1';
    initColorFromEnv();
  });

  afterEach(() => {
    delete process.env.NO_COLOR;
    initColorFromEnv();
  });

  it('parseSearchToolResult reads products array', () => {
    const parsed = parseSearchToolResult(
      JSON.stringify({
        products: [{ id: 1, title: 'Test report', source: 'CISA', pub_date: '2026-06-01' }],
        total: 1,
        hasMore: false,
      })
    );
    assert.equal(parsed?.products.length, 1);
    assert.equal(parsed?.total, 1);
  });

  it('formatSearchResultsTable renders columns', () => {
    const lines = formatSearchResultsTable({
      products: [
        {
          id: 4821,
          title: 'Sandworm targets energy sector',
          source: 'CISA',
          pub_date: '2026-06-01T00:00:00Z',
        },
      ],
      total: 1,
      filterExpression: 'tags = "Sandworm"',
      windowLabel: 'last 7 days',
    });
    const plain = lines.map((line) => stripAnsi(line)).join('\n');
    assert.match(plain, /Filter:\s+tags = "Sandworm"/);
    assert.match(plain, /4821/);
    assert.match(plain, /Sandworm targets/);
    assert.match(plain, /CISA/);
  });

  it('truncates long titles in table rows', () => {
    const longTitle = 'A'.repeat(40);
    const lines = formatSearchResultsTable({
      products: [{ id: 1, title: longTitle, source: 'Feed', pub_date: '2026-06-01' }],
      total: 1,
    });
    const row = stripAnsi(lines.find((l) => l.includes('AAAA')) ?? '');
    assert.ok(row.length > 0);
    assert.ok(row.includes('…'));
  });
});
