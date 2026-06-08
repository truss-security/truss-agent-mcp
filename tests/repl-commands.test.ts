import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseReplInput } from '../src/ask/repl-commands.ts';

describe('parseReplInput', () => {
  it('parses mode switches', () => {
    assert.deepEqual(parseReplInput(':search'), { type: 'switch', mode: 'search' });
    assert.deepEqual(parseReplInput(':ask'), { type: 'switch', mode: 'ask' });
  });

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

  it('parses force prefixes', () => {
    assert.deepEqual(parseReplInput('!search now'), {
      type: 'message',
      text: 'search now',
      forceSearch: true,
    });
    assert.deepEqual(parseReplInput('search: find lockbit'), {
      type: 'message',
      text: 'find lockbit',
      forceSearch: true,
    });
    assert.deepEqual(parseReplInput('ask: build a filter'), {
      type: 'message',
      text: 'build a filter',
      forceAskPort: true,
    });
  });

  it('treats normal text as a message', () => {
    assert.deepEqual(parseReplInput('search for ransomware'), {
      type: 'message',
      text: 'search for ransomware',
    });
  });
});
