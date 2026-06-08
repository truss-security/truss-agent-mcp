import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseReplInput } from '../src/ask/repl-commands.ts';

describe('parseReplInput', () => {
  it('parses mode switches', () => {
    assert.deepEqual(parseReplInput(':search'), { type: 'switch', mode: 'search' });
    assert.deepEqual(parseReplInput(':ask'), { type: 'switch', mode: 'ask' });
  });

  it('parses run command', () => {
    assert.deepEqual(parseReplInput('run'), { type: 'run' });
    assert.deepEqual(parseReplInput(':run'), { type: 'run' });
  });

  it('parses exit commands', () => {
    assert.deepEqual(parseReplInput('exit'), { type: 'exit' });
    assert.deepEqual(parseReplInput('quit'), { type: 'exit' });
  });

  it('treats normal text as a message', () => {
    assert.deepEqual(parseReplInput('search for ransomware'), {
      type: 'message',
      text: 'search for ransomware',
    });
  });
});
