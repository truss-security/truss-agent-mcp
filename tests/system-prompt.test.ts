import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ASK_SYSTEM_PROMPT,
  SEARCH_SYSTEM_PROMPT,
  getSystemPrompt,
} from '../src/ask/system-prompt.ts';
import {
  MCP_HOST_INSTRUCTIONS,
  REPL_SEARCH_INSTRUCTIONS,
} from '../src/instructions.ts';

describe('system prompts', () => {
  it('SEARCH_SYSTEM_PROMPT is Truss-first with FilterQL operators', () => {
    assert.ok(SEARCH_SYSTEM_PROMPT.includes(REPL_SEARCH_INSTRUCTIONS));
    assert.match(SEARCH_SYSTEM_PROMPT, /Truss-first/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /!=/);
    assert.match(SEARCH_SYSTEM_PROMPT, /LIKE/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /validate_filter_expression/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /:ask/);
    assert.match(SEARCH_SYSTEM_PROMPT, /run/);
    assert.match(SEARCH_SYSTEM_PROMPT, /do not call MCP tools/i);
    assert.match(SEARCH_SYSTEM_PROMPT, /context-only/i);
  });

  it('ASK_SYSTEM_PROMPT is Truss-first FilterQL coaching without live search', () => {
    assert.match(ASK_SYSTEM_PROMPT, /Truss-first/i);
    assert.match(ASK_SYSTEM_PROMPT, /do NOT have live Truss MCP tools/i);
    assert.match(ASK_SYSTEM_PROMPT, /type run/i);
    assert.match(ASK_SYSTEM_PROMPT, /tags = "Sandworm"/);
    assert.match(ASK_SYSTEM_PROMPT, /!=/);
    assert.match(ASK_SYSTEM_PROMPT, /LIKE/i);
    assert.match(ASK_SYSTEM_PROMPT, /quota/i);
    assert.match(ASK_SYSTEM_PROMPT, /external/i);
    assert.doesNotMatch(ASK_SYSTEM_PROMPT, /search_products/);
  });

  it('MCP_HOST_INSTRUCTIONS has no REPL run command', () => {
    assert.doesNotMatch(MCP_HOST_INSTRUCTIONS, /type run to switch/i);
    assert.match(MCP_HOST_INSTRUCTIONS, /validate_filter_expression/i);
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
