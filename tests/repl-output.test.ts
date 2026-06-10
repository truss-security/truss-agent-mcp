import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { formatAssistantText } from '../src/ask/repl-output.ts';
import { formatBlockHeader } from '../src/lib/format-search-results.ts';
import { initColorFromEnv, setRuntimeColorMode, stripAnsi } from '../src/lib/terminal-theme.ts';

describe('repl-output', () => {
  afterEach(() => {
    setRuntimeColorMode(undefined);
    initColorFromEnv();
  });

  beforeEach(() => {
    process.env.NO_COLOR = '1';
    initColorFromEnv();
  });

  it('formatAssistantText highlights offer lines', () => {
    const text = 'Some answer.\nWould you like to build a Filter for this?';
    const formatted = stripAnsi(formatAssistantText(text));
    assert.match(formatted, /Would you like to build a Filter for this\?/);
  });

  it('formatAssistantText preserves filterql blocks', () => {
    const text = 'Primary filter:\n```filterql\ntags = "Sandworm"\n```';
    const formatted = stripAnsi(formatAssistantText(text));
    assert.match(formatted, /tags = "Sandworm"/);
  });

  it('formatBlockHeader uses ASCII dashes', () => {
    const header = formatBlockHeader('You');
    assert.match(header, /^--- You -+/);
  });
});
