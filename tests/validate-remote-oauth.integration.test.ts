/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateMcp } from '../src/remote/validate-remote.js';

const mcpUrl = process.env.TRUSS_MCP_URL?.trim() || 'https://api-test.truss-security.com/mcp';
const token = process.env.TRUSS_MCP_OAUTH_TOKEN?.trim();
const runLive = process.env.TRUSS_RUN_MCP_OAUTH === '1' && Boolean(token);
const skipReason =
  'Set TRUSS_RUN_MCP_OAUTH=1 and TRUSS_MCP_OAUTH_TOKEN (Bearer access token from validate-remote --save-token) to run live OAuth MCP data tests';

describe('remote MCP OAuth data (optional)', () => {
  it('is accessible with Bearer token and returns Truss product data', async (t) => {
    if (!runLive || !token) {
      t.skip(skipReason);
      return;
    }

    const sample = await validateMcp(mcpUrl, token, false);
    assert.ok(sample.id != null);
    assert.ok(sample.title.trim().length > 0);
  });
});
