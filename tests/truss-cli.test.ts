import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('truss CLI router', () => {
  it('parseCommand treats missing argv as help', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss-mcp']), 'help');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'help']), 'help');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', '--help']), 'help');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', '-h']), 'help');
  });

  it('parseCommand resolves all subcommands', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'search']), 'search');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'ask']), 'ask');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'doctor']), 'doctor');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'init']), 'init');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'mcp']), 'mcp');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'version']), 'version');
  });

  it('parseCommand handles --version flag', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', '--version']), 'version');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'search', '--version']), 'version');
  });

  it('parseCommand rejects unknown commands', async () => {
    const { parseCommandForTest } = await import('../src/truss-cli-router.ts');
    assert.equal(parseCommandForTest(['node', 'truss-mcp', 'unknown']), null);
  });
});
