import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  UNIFIED_SEARCH_PROMPT,
  UNIFIED_SEARCH_PROMPT_REMOTE,
  getSystemPrompt,
} from '../src/ask/system-prompt.ts';
import {
  EPISTEMIC_GROUNDING,
  MCP_HOST_INSTRUCTIONS,
  REPL_SEARCH_INSTRUCTIONS,
  REPL_SEARCH_INSTRUCTIONS_REMOTE,
  GUIDED_WORKFLOW,
} from '../src/instructions.ts';

describe('system prompts', () => {
  it('UNIFIED_SEARCH_PROMPT is Truss-first with guided workflow', () => {
    assert.ok(UNIFIED_SEARCH_PROMPT.includes(REPL_SEARCH_INSTRUCTIONS));
    assert.match(UNIFIED_SEARCH_PROMPT, /Truss-first/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /guided/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /!=/);
    assert.match(UNIFIED_SEARCH_PROMPT, /LIKE/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /validate_filter_expression/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /run/);
    assert.match(UNIFIED_SEARCH_PROMPT, /do not call MCP tools/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /context-only/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /Epistemic grounding/i);
    assert.match(UNIFIED_SEARCH_PROMPT, /other sources may still/i);
    assert.doesNotMatch(UNIFIED_SEARCH_PROMPT, /:ask/);
  });

  it('remote prompt uses hosted tools', () => {
    assert.ok(UNIFIED_SEARCH_PROMPT_REMOTE.includes(REPL_SEARCH_INSTRUCTIONS_REMOTE));
    assert.match(UNIFIED_SEARCH_PROMPT_REMOTE, /search_threats/);
    assert.match(UNIFIED_SEARCH_PROMPT_REMOTE, /lookup_ioc/);
    assert.match(UNIFIED_SEARCH_PROMPT_REMOTE, /do not invent unavailable FilterQL tools/i);
  });

  it('REPL_SEARCH_INSTRUCTIONS includes guided workflow offers', () => {
    assert.match(REPL_SEARCH_INSTRUCTIONS, /Would you like to build a Filter for this\?/);
    assert.match(REPL_SEARCH_INSTRUCTIONS, /Would you like me to query Truss API for this data\?/);
    assert.match(GUIDED_WORKFLOW, /detection_rules/);
  });

  it('MCP_HOST_INSTRUCTIONS has guided workflow without REPL run command', () => {
    assert.doesNotMatch(MCP_HOST_INSTRUCTIONS, /type run to switch/i);
    assert.match(MCP_HOST_INSTRUCTIONS, /validate_filter_expression/i);
    assert.match(MCP_HOST_INSTRUCTIONS, /Would you like to build a Filter for this\?/);
    assert.match(MCP_HOST_INSTRUCTIONS, /run_job_now/);
  });

  it('epistemic grounding is shared by REPL and MCP host prompts', () => {
    assert.ok(REPL_SEARCH_INSTRUCTIONS.includes(EPISTEMIC_GROUNDING));
    assert.ok(MCP_HOST_INSTRUCTIONS.includes(EPISTEMIC_GROUNDING));
    assert.match(EPISTEMIC_GROUNDING, /does not currently have/i);
    assert.match(EPISTEMIC_GROUNDING, /could still exist in other sources/i);
    assert.doesNotMatch(EPISTEMIC_GROUNDING, /never exist/i);
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
      assert.match(UNIFIED_SEARCH_PROMPT, new RegExp(field));
    }
  });

  it('getSystemPrompt returns transport-aware prompts', () => {
    assert.equal(getSystemPrompt(), UNIFIED_SEARCH_PROMPT);
    assert.equal(getSystemPrompt('stdio'), UNIFIED_SEARCH_PROMPT);
    assert.equal(getSystemPrompt('remote'), UNIFIED_SEARCH_PROMPT_REMOTE);
  });
});
