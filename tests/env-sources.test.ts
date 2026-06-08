import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { describeEnvKey } from '../src/lib/env-sources.ts';

describe('describeEnvKey', () => {
  it('reports masked value when set in .env file', () => {
    const envFiles = new Map([['TRUSS_API_KEY', 'super-secret-key-value']]);
    const status = describeEnvKey('TRUSS_API_KEY', envFiles, undefined);
    assert.equal(status.ok, true);
    assert.match(status.detail, /configured in \.env/);
    assert.doesNotMatch(status.detail, /super-secret-key-value/);
  });

  it('reports empty in .env when key exists but blank', () => {
    const envFiles = new Map([['TRUSS_API_KEY', '']]);
    const status = describeEnvKey('TRUSS_API_KEY', envFiles, undefined);
    assert.equal(status.ok, false);
    assert.match(status.detail, /empty in \.env/);
  });
});
