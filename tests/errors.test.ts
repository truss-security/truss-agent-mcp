import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TrussApiError,
  TrussNetworkError,
  TrussTimeoutError,
} from '@truss-security/truss-sdk';
import { formatTrussError } from '../src/lib/errors.ts';

function apiError(status: number, message: string): TrussApiError {
  return new TrussApiError(message, {
    data: {},
    status,
    statusText: 'Error',
    headers: {},
  });
}

describe('formatTrussError', () => {
  it('formats 429 rate limit errors', () => {
    const message = formatTrussError(apiError(429, 'Too Many Requests'));
    assert.match(message, /rate limit exceeded/i);
    assert.match(message, /HTTP 429/);
  });

  it('formats other API errors with status', () => {
    const message = formatTrussError(apiError(403, 'Forbidden'));
    assert.match(message, /Truss API error/);
    assert.match(message, /HTTP 403/);
    assert.match(message, /Forbidden/);
  });

  it('formats timeout errors', () => {
    const message = formatTrussError(new TrussTimeoutError(30000));
    assert.match(message, /timed out/i);
  });

  it('formats network errors', () => {
    const message = formatTrussError(new TrussNetworkError('Connection refused'));
    assert.match(message, /network error/i);
    assert.match(message, /Connection refused/);
  });

  it('formats generic Error instances', () => {
    assert.equal(formatTrussError(new Error('boom')), 'boom');
  });

  it('formats unknown values', () => {
    assert.equal(formatTrussError(42), '42');
  });
});
