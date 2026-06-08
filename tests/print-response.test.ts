import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { printAssistantResponse } from '../src/ask/print-response.ts';

describe('printAssistantResponse', () => {
  it('prints non-empty text with surrounding newlines', () => {
    let output = '';
    const original = console.log;
    console.log = (msg: string) => {
      output = msg;
    };
    try {
      printAssistantResponse('Hello');
      assert.equal(output, '\nHello\n');
    } finally {
      console.log = original;
    }
  });

  it('prints nothing for empty text', () => {
    let called = false;
    const original = console.log;
    console.log = () => {
      called = true;
    };
    try {
      printAssistantResponse('');
      assert.equal(called, false);
    } finally {
      console.log = original;
    }
  });
});
