import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isEnvValueEmpty,
  parseEnvFile,
  updateEnvFile,
} from '../src/lib/env-file.ts';

describe('env-file', () => {
  it('parseEnvFile ignores comments and blank lines', () => {
    const map = parseEnvFile(`
# comment
TRUSS_API_KEY=abc

ANTHROPIC_API_KEY=def
`);
    assert.equal(map.get('TRUSS_API_KEY'), 'abc');
    assert.equal(map.get('ANTHROPIC_API_KEY'), 'def');
  });

  it('isEnvValueEmpty treats blank as empty', () => {
    assert.equal(isEnvValueEmpty(''), true);
    assert.equal(isEnvValueEmpty('  '), true);
    assert.equal(isEnvValueEmpty(undefined), true);
    assert.equal(isEnvValueEmpty('key'), false);
  });

  it('updateEnvFile replaces existing keys', () => {
    const dir = mkdtempSync(join(tmpdir(), 'truss-env-'));
    const envPath = join(dir, '.env');
    writeFileSync(envPath, 'TRUSS_API_KEY=\nANTHROPIC_API_KEY=\n');
    updateEnvFile(envPath, { TRUSS_API_KEY: 'new-truss' });
    const content = readFileSync(envPath, 'utf8');
    assert.match(content, /TRUSS_API_KEY=new-truss/);
    rmSync(dir, { recursive: true, force: true });
  });
});
