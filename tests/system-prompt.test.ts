import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASK_SYSTEM_PROMPT,
  SEARCH_SYSTEM_PROMPT,
  getSystemPrompt,
} from '../src/ask/system-prompt.ts';
import { SERVER_INSTRUCTIONS } from '../src/instructions.ts';

describe('system prompts', () => {
  it('SEARCH_SYSTEM_PROMPT is Truss-first with FilterQL operators', () => {
    assert.ok(SEARCH_SYSTEM_PROMPT.includes(SERVER_INSTRUCTIONS));
    assert.match(SEARCH_SYSTEM_PROMPT, /Truss-first/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /!=/);
    assert.match(SEARCH_SYSTEM_PROMPT, /LIKE/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /validate_filter_expression/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /:ask/);
  });

  it('ASK_SYSTEM_PROMPT is Truss-first FilterQL coaching without live search', () => {
    assert.match(ASK_SYSTEM_PROMPT, /Truss-first/i);
    assert.match(ASK_SYSTEM_PROMPT, /do NOT have live Truss MCP tools/i);
    assert.match(ASK_SYSTEM_PROMPT, /:search/);
    assert.match(ASK_SYSTEM_PROMPT, /tags = "Sandworm"/);
    assert.match(ASK_SYSTEM_PROMPT, /!=/);
    assert.match(ASK_SYSTEM_PROMPT, /LIKE/i);
    assert.match(ASK_SYSTEM_PROMPT, /external/i);
    assert.doesNotMatch(ASK_SYSTEM_PROMPT, /search_products/);
  });

  it('includes all Truss FilterQL attributes in field guide', () => {
    for (const field of [
      'category',
      'region',
      'industry',
      'source',
      'author',
      'tags',
      'reference',
      'indicators',
      'title',
      'type',
      'validators',
    ]) {
      assert.match(SEARCH_SYSTEM_PROMPT, new RegExp(field));
    }
  });

  it('getSystemPrompt returns mode-specific prompts', () => {
    assert.equal(getSystemPrompt('search'), SEARCH_SYSTEM_PROMPT);
    assert.equal(getSystemPrompt('ask'), ASK_SYSTEM_PROMPT);
  });
});
