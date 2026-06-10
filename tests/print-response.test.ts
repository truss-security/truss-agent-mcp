import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { printAssistantBlock } from '../src/ask/repl-output.ts';

describe('printAssistantBlock', () => {
  it('prints non-empty text with Truss block header', () => {
    let output = '';
    const original = console.log;
    console.log = (msg: string) => {
      output += `${msg}\n`;
    };
    try {
      process.env.NO_COLOR = '1';
      printAssistantBlock('Hello');
      assert.match(output, /--- Truss/);
      assert.match(output, /Hello/);
    } finally {
      console.log = original;
      delete process.env.NO_COLOR;
    }
  });

  it('prints nothing for empty text', () => {
    let called = false;
    const original = console.log;
    console.log = () => {
      called = true;
    };
    try {
      printAssistantBlock('');
      assert.equal(called, false);
    } finally {
      console.log = original;
    }
  });
});
