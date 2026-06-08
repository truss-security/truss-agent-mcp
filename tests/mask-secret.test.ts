import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskSecret } from '../src/lib/mask-secret.ts';

describe('maskSecret', () => {
  it('never returns the full secret', () => {
    const secret = 'sk-ant-api03-abcdefghijklmnop';
    const masked = maskSecret(secret);
    assert.notEqual(masked, secret);
    assert.match(masked, /chars\)$/);
  });

  it('reports empty for blank values', () => {
    assert.equal(maskSecret(''), 'empty');
  });
});
