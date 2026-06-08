import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRunSearchQuery,
  extractFilterFromText,
} from '../src/ask/extract-filter.ts';

describe('extractFilterFromText', () => {
  it('extracts the last FilterQL code block', () => {
    const text = `
Primary:
\`\`\`
tags = "Sandworm"
\`\`\`

Confirmed:
\`\`\`
(tags = "Sandworm" OR tags = "APT44")
\`\`\`
`;
    assert.equal(
      extractFilterFromText(text),
      '(tags = "Sandworm" OR tags = "APT44")'
    );
  });

  it('ignores non-filter code blocks', () => {
    const text = '```\nnot a filter\n```\n```\ncategory = "Malware"\n```';
    assert.equal(extractFilterFromText(text), 'category = "Malware"');
  });
});

describe('buildRunSearchQuery', () => {
  it('includes filterExpression and days', () => {
    const q = buildRunSearchQuery('tags = "Sandworm"', 90);
    assert.match(q, /tags = "Sandworm"/);
    assert.match(q, /days: 90/);
    assert.match(q, /validate_filter_expression/i);
  });
});
