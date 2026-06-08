import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromContent } from '../src/ask/print-response.ts';

describe('extractTextFromContent', () => {
  it('joins text blocks', () => {
    const text = extractTextFromContent([
      { type: 'text', text: 'Hello' },
      { type: 'text', text: 'world' },
    ]);
    assert.equal(text, 'Hello\nworld');
  });

  it('ignores non-text blocks', () => {
    const text = extractTextFromContent([
      { type: 'text', text: 'Result' },
      { type: 'tool_use', id: '1', name: 'search_products', input: {} },
    ] as Parameters<typeof extractTextFromContent>[0]);
    assert.equal(text, 'Result');
  });

  it('returns empty string when no text blocks', () => {
    assert.equal(extractTextFromContent([]), '');
  });
});
