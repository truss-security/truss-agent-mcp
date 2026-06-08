import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { shouldSuggestAskMode } from '../src/ask/classify-repl-intent.ts';

describe('shouldSuggestAskMode', () => {
  it('detects filter-building questions', () => {
    assert.equal(
      shouldSuggestAskMode('Make for me a Truss Filter that will identify Sandworm malware'),
      true
    );
    assert.equal(shouldSuggestAskMode('Build a filter for LockBit ransomware'), true);
  });

  it('detects explanatory questions', () => {
    assert.equal(shouldSuggestAskMode('Why not use title = "Sandworm"?'), true);
    assert.equal(shouldSuggestAskMode('What aliases does Sandworm have?'), true);
  });

  it('allows live search requests in search mode', () => {
    assert.equal(shouldSuggestAskMode('Search Truss for Sandworm products'), false);
    assert.equal(shouldSuggestAskMode('Find reports tagged Sandworm from last 30 days'), false);
    assert.equal(shouldSuggestAskMode('List products with tags = "APT44"'), false);
  });
});
