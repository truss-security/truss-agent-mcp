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

  it('maskWebhookUrl hides path tokens', async () => {
    const { maskWebhookUrl } = await import('../src/delivery/secret-refs.ts');
    const url = 'https://discord.com/api/webhooks/1/super-secret-token';
    const masked = maskWebhookUrl(url);
    assert.equal(masked.includes('super-secret-token'), false);
    assert.match(masked, /discord\.com/);
  });
});
