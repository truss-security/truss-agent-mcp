import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SERVER_INSTRUCTIONS } from '../src/instructions.ts';
import {
  ASK_SYSTEM_PROMPT,
  SEARCH_SYSTEM_PROMPT,
  getSystemPrompt,
} from '../src/ask/system-prompt.ts';

describe('system prompts', () => {
  it('SEARCH_SYSTEM_PROMPT includes SERVER_INSTRUCTIONS and search workflow', () => {
    assert.ok(SEARCH_SYSTEM_PROMPT.includes(SERVER_INSTRUCTIONS));
    assert.match(SEARCH_SYSTEM_PROMPT, /validate_filter_expression/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /search_products/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /:ask/);
  });

  it('ASK_SYSTEM_PROMPT forbids live Truss queries and points to :search', () => {
    assert.doesNotMatch(ASK_SYSTEM_PROMPT, /search_products/);
    assert.ok(!ASK_SYSTEM_PROMPT.includes(SERVER_INSTRUCTIONS));
    assert.match(ASK_SYSTEM_PROMPT, /do NOT have access to Truss MCP tools/i);
    assert.match(ASK_SYSTEM_PROMPT, /:search/);
  });

  it('getSystemPrompt returns mode-specific prompts', () => {
    assert.equal(getSystemPrompt('search'), SEARCH_SYSTEM_PROMPT);
    assert.equal(getSystemPrompt('ask'), ASK_SYSTEM_PROMPT);
  });
});
