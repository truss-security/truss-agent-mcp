import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  describeColorSetting,
  initColorFromEnv,
  isColorEnabled,
  parseColorMode,
  setRuntimeColorMode,
  stripAnsi,
  style,
} from '../src/lib/terminal-theme.ts';

describe('terminal-theme', () => {
  const savedNoColor = process.env.NO_COLOR;
  const savedColor = process.env.TRUSS_MCP_COLOR;

  afterEach(() => {
    if (savedNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = savedNoColor;
    if (savedColor === undefined) delete process.env.TRUSS_MCP_COLOR;
    else process.env.TRUSS_MCP_COLOR = savedColor;
    setRuntimeColorMode(undefined);
    initColorFromEnv();
  });

  it('parseColorMode handles always, never, and auto', () => {
    assert.equal(parseColorMode('always'), 'always');
    assert.equal(parseColorMode('never'), 'never');
    assert.equal(parseColorMode(undefined), 'auto');
  });

  it('disables color when NO_COLOR is set', () => {
    process.env.NO_COLOR = '1';
    setRuntimeColorMode('always');
    assert.equal(isColorEnabled(), false);
    assert.equal(style('assistant', 'hello'), 'hello');
  });

  it('stripAnsi removes escape codes', () => {
    const colored = style('assistant', 'hello');
    if (isColorEnabled()) {
      assert.notEqual(colored, 'hello');
      assert.equal(stripAnsi(colored), 'hello');
    } else {
      assert.equal(colored, 'hello');
    }
  });

  it('describeColorSetting reports mode', () => {
    process.env.TRUSS_MCP_COLOR = 'auto';
    initColorFromEnv();
    assert.match(describeColorSetting(), /mode: auto/);
  });
});
