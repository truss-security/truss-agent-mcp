import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractFilterFromText,
  isConfirmedFilterResponse,
  isFilterConfirmation,
  isSearchResultsSummary,
} from '../src/ask/filter-confirm.ts';

describe('filter-confirm', () => {
  it('isFilterConfirmation matches user confirmations', () => {
    assert.equal(isFilterConfirmation('2'), true);
    assert.equal(isFilterConfirmation('yes'), true);
    assert.equal(isFilterConfirmation('confirm'), true);
    assert.equal(isFilterConfirmation('search for x'), false);
  });

  it('isConfirmedFilterResponse detects assistant markers', () => {
    assert.equal(isConfirmedFilterResponse('## Confirmed filter\n```\ntags = "A"\n```'), true);
    assert.equal(isConfirmedFilterResponse('Primary filter only'), false);
  });

  it('extractFilterFromText prefers confirmed section', () => {
    const text = `
Draft:
\`\`\`
tags = "Sandworm"
\`\`\`

Confirmed filter:
\`\`\`
(tags = "Sandworm" OR tags = "APT44")
\`\`\`
`;
    assert.equal(
      extractFilterFromText(text, { preferConfirmed: true }),
      '(tags = "Sandworm" OR tags = "APT44")'
    );
  });

  it('extractFilterFromText returns undefined for draft when preferConfirmed without marker', () => {
    const text = '```\ntags = "Sandworm"\n```';
    assert.equal(extractFilterFromText(text, { preferConfirmed: true, allowDraft: false }), undefined);
  });

  it('does not treat executed search summaries as draft filters', () => {
    const text = `**Filter:** (tags = "TeamPCP" OR tags = "Shai-Hulud")
**Window:** Last 7 days
**Results:** 13 matches

1. [83529] A Record-Breaking Patch Tuesday`;
    assert.equal(isSearchResultsSummary(text), true);
    assert.equal(extractFilterFromText(text, { allowDraft: true }), undefined);
  });

  it('still extracts filterql blocks from search summaries when present', () => {
    const text = `**Results:** 2 matches
\`\`\`filterql
tags = "Sandworm"
\`\`\``;
    assert.equal(extractFilterFromText(text, { allowDraft: true }), 'tags = "Sandworm"');
  });
});
