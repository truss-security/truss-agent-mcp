import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseReplInput } from '../src/ask/repl-commands.ts';

describe('parseReplInput', () => {
  it('parses run command with optional window', () => {
    assert.deepEqual(parseReplInput('run'), { type: 'run' });
    assert.deepEqual(parseReplInput(':run'), { type: 'run' });
    assert.deepEqual(parseReplInput('run 30'), { type: 'run', window: { days: 30 } });
    assert.deepEqual(parseReplInput('run start:2026-06-01 end:2026-06-08'), {
      type: 'run',
      window: { startDate: '2026-06-01', endDate: '2026-06-08' },
    });
  });

  it('parses days command', () => {
    assert.deepEqual(parseReplInput('days'), { type: 'days', showOnly: true });
    assert.deepEqual(parseReplInput('days 30'), { type: 'days', window: { days: 30 }, showOnly: false });
  });

  it('parses color command', () => {
    assert.deepEqual(parseReplInput('color'), { type: 'color', showOnly: true });
    assert.deepEqual(parseReplInput('color on'), { type: 'color', mode: 'always' });
    assert.deepEqual(parseReplInput('color off'), { type: 'color', mode: 'never' });
    assert.deepEqual(parseReplInput('color auto'), { type: 'color', mode: 'auto' });
  });

  it('parses stix and detect commands', () => {
    assert.deepEqual(parseReplInput('stix'), { type: 'stix' });
    assert.deepEqual(parseReplInput(':stix'), { type: 'stix' });
    assert.deepEqual(parseReplInput('detect splunk'), { type: 'detect', platform: 'splunk' });
    assert.deepEqual(parseReplInput(':detect falcon'), { type: 'detect', platform: 'falcon' });
  });

  it('parses utility commands', () => {
    assert.deepEqual(parseReplInput('help'), { type: 'help' });
    assert.deepEqual(parseReplInput('confirm'), { type: 'confirm' });
    assert.deepEqual(parseReplInput('filter'), { type: 'filter' });
    assert.deepEqual(parseReplInput('clear'), { type: 'clear' });
    assert.deepEqual(parseReplInput('status'), { type: 'status' });
  });

  it('parses exit commands', () => {
    assert.deepEqual(parseReplInput('exit'), { type: 'exit' });
    assert.deepEqual(parseReplInput('quit'), { type: 'exit' });
  });

  it('parses force prefix', () => {
    assert.deepEqual(parseReplInput('!search now'), {
      type: 'message',
      text: 'search now',
      forceSearch: true,
    });
  });

  it('treats normal text as a message', () => {
    assert.deepEqual(parseReplInput('search for ransomware'), {
      type: 'message',
      text: 'search for ransomware',
    });
  });

  it('does not parse removed mode switches as commands', () => {
    assert.deepEqual(parseReplInput(':search'), { type: 'message', text: ':search' });
    assert.deepEqual(parseReplInput(':ask'), { type: 'message', text: ':ask' });
  });
});
