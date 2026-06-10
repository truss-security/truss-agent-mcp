import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTurnDiagnostics,
  summarizeToolArgs,
  summarizeToolResult,
} from '../src/ask/tool-trace.ts';

describe('tool-trace', () => {
  it('summarizeToolArgs includes filter and days', () => {
    const summary = summarizeToolArgs('search_products', {
      filterExpression: 'tags = "Sandworm"',
      days: 7,
    });
    assert.match(summary, /tags = "Sandworm"/);
    assert.match(summary, /days: 7/);
  });

  it('summarizeToolResult reports match count', () => {
    const summary = summarizeToolResult(
      'search_products',
      JSON.stringify({ products: [], total: 12 }),
      false
    );
    assert.equal(summary, '12 matches');
  });

  it('summarizeToolResult reports validation status', () => {
    assert.equal(
      summarizeToolResult('validate_filter_expression', JSON.stringify({ valid: true }), false),
      'valid'
    );
  });

  it('buildTurnDiagnostics extracts last search payload', () => {
    const diagnostics = buildTurnDiagnostics([
      {
        name: 'validate_filter_expression',
        args: {},
        resultText: '{"valid":true}',
        isError: false,
        durationMs: 10,
      },
      {
        name: 'search_products',
        args: { filterExpression: 'tags = "X"' },
        resultText: JSON.stringify({
          products: [{ id: 1, title: 'T' }],
          total: 1,
        }),
        isError: false,
        durationMs: 100,
      },
    ]);
    assert.equal(diagnostics.searchPayload?.products.length, 1);
  });
});
