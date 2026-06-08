import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('truss CLI router', () => {
  it('parseCommand treats missing argv as help', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss']), 'help');
    assert.equal(parseCommandForTest(['node', 'truss', 'help']), 'help');
    assert.equal(parseCommandForTest(['node', 'truss', '--help']), 'help');
    assert.equal(parseCommandForTest(['node', 'truss', '-h']), 'help');
  });

  it('parseCommand resolves search and ask', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss', 'search']), 'search');
    assert.equal(parseCommandForTest(['node', 'truss', 'ask']), 'ask');
  });

  it('parseCommand rejects unknown commands', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss', 'unknown']), null);
  });
});
