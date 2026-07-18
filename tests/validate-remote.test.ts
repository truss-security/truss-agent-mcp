/// <reference types="node" />

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertTrussDataFromSearchThreats,
  audiencesFromPayload,
  authorizationServerMetadataUrls,
  buildClaudeCompatibilityChecklist,
  canonicalizeResourceUrl,
  parseSearchThreatsToolResult,
  parseValidateRemoteOptions,
} from '../src/remote/validate-remote.js';

describe('canonicalizeResourceUrl', () => {
  it('lowercases host and strips trailing slash and default https port', () => {
    assert.equal(
      canonicalizeResourceUrl('https://API-Test.Truss-Security.com:443/mcp/'),
      'https://api-test.truss-security.com/mcp'
    );
  });
});

describe('authorizationServerMetadataUrls', () => {
  it('maps a Supabase issuer to RFC 8414 path-aware well-known URLs', () => {
    const urls = authorizationServerMetadataUrls('https://example.supabase.co/auth/v1');
    assert.equal(urls[0], 'https://example.supabase.co/.well-known/oauth-authorization-server/auth/v1');
    assert.ok(urls.includes('https://example.supabase.co/auth/v1/.well-known/oauth-authorization-server'));
    assert.ok(urls.includes('https://example.supabase.co/auth/v1/.well-known/openid-configuration'));
  });

  it('keeps legacy direct well-known metadata URLs as a single candidate', () => {
    const legacy =
      'https://example.supabase.co/.well-known/oauth-authorization-server/auth/v1';
    assert.deepEqual(authorizationServerMetadataUrls(legacy), [legacy]);
  });
});

describe('audiencesFromPayload', () => {
  it('handles string and array aud claims', () => {
    assert.deepEqual(audiencesFromPayload({ aud: 'authenticated' }), ['authenticated']);
    assert.deepEqual(audiencesFromPayload({ aud: ['authenticated', 'other'] }), ['authenticated', 'other']);
    assert.deepEqual(audiencesFromPayload({}), []);
  });
});

describe('parseSearchThreatsToolResult / assertTrussDataFromSearchThreats', () => {
  it('parses structuredContent products', () => {
    const parsed = parseSearchThreatsToolResult({
      structuredContent: {
        products: [
          {
            id: 129213,
            truss_prod_id: '01KXSCW7TR67NQ3RKETZY6W7Z5',
            title: 'GigaWiper: Inside a Modular Cyberweapon',
            category: 'Malware',
          },
        ],
        total: 1,
      },
    });

    assert.equal(parsed.products.length, 1);
    assert.equal(parsed.products[0]?.id, 129213);
    assert.equal(parsed.products[0]?.title, 'GigaWiper: Inside a Modular Cyberweapon');
  });

  it('parses text JSON content blocks from tools/call', () => {
    const sample = assertTrussDataFromSearchThreats({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            products: [{ id: 42, title: 'Example Malware Report', category: 'Malware' }],
            total: 1,
          }),
        },
      ],
    });

    assert.equal(sample.id, 42);
    assert.equal(sample.title, 'Example Malware Report');
    assert.equal(sample.category, 'Malware');
  });

  it('fails when products array is empty', () => {
    assert.throws(
      () => assertTrussDataFromSearchThreats({ structuredContent: { products: [], total: 0 } }),
      /zero products/
    );
  });

  it('fails when product title is missing', () => {
    assert.throws(
      () =>
        parseSearchThreatsToolResult({
          structuredContent: { products: [{ id: 1 }] },
        }),
      /missing title/
    );
  });
});

describe('buildClaudeCompatibilityChecklist', () => {
  const mcpUrl = 'https://api-test.truss-security.com/mcp';

  it('warns when aud is authenticated instead of MCP resource URI', () => {
    const items = buildClaudeCompatibilityChecklist({
      mcpUrl,
      metadataResource: mcpUrl,
      authIssuer: 'https://example.supabase.co/auth/v1',
      codeChallengeMethods: ['S256'],
      redirectStatus: 401,
      tokenPayload: {
        iss: 'https://example.supabase.co/auth/v1',
        aud: 'authenticated',
        truss_role: 'growth',
      },
    });

    const audience = items.find((item) => item.id === 'audience-resource');
    assert.equal(audience?.status, 'warn');
    assert.match(audience?.detail ?? '', /Claude connectors expect resource-bound audience/);
  });

  it('passes when aud includes the MCP resource URI', () => {
    const items = buildClaudeCompatibilityChecklist({
      mcpUrl,
      metadataResource: mcpUrl,
      authIssuer: 'https://example.supabase.co/auth/v1',
      codeChallengeMethods: ['S256'],
      redirectStatus: 401,
      tokenPayload: {
        iss: 'https://example.supabase.co/auth/v1',
        aud: mcpUrl,
        truss_role: 'scale',
      },
    });

    assert.equal(items.find((item) => item.id === 'audience-resource')?.status, 'pass');
    assert.equal(items.every((item) => item.status === 'pass'), true);
  });

  it('fails on cross-host redirect and issuer mismatch', () => {
    const items = buildClaudeCompatibilityChecklist({
      mcpUrl,
      metadataResource: mcpUrl,
      authIssuer: 'https://example.supabase.co/auth/v1',
      codeChallengeMethods: ['plain'],
      redirectStatus: 307,
      redirectLocation: 'https://www.example.com/mcp',
      tokenPayload: {
        iss: 'https://other.example/auth/v1',
        aud: 'something-else',
        truss_role: 'community',
      },
    });

    assert.equal(items.find((item) => item.id === 'no-redirect')?.status, 'fail');
    assert.equal(items.find((item) => item.id === 'issuer-match')?.status, 'fail');
    assert.equal(items.find((item) => item.id === 'audience-resource')?.status, 'fail');
    assert.equal(items.find((item) => item.id === 'truss-role')?.status, 'fail');
    assert.equal(items.find((item) => item.id === 'pkce-s256')?.status, 'warn');
  });
});

describe('parseValidateRemoteOptions', () => {
  it('parses verbose, strict-claude, save-token, token-file, and port flags', () => {
    const options = parseValidateRemoteOptions([
      'node',
      'truss-mcp',
      'validate-remote',
      'https://api-test.truss-security.com/mcp',
      '--verbose',
      '--strict-claude',
      '--save-token',
      '/tmp/truss-mcp-token',
      '--token-file',
      '/tmp/truss-mcp-token',
      '--port',
      '9877',
      '--no-open',
    ]);

    assert.equal(options.mcpUrl, 'https://api-test.truss-security.com/mcp');
    assert.equal(options.verbose, true);
    assert.equal(options.strictClaude, true);
    assert.equal(options.saveTokenPath, '/tmp/truss-mcp-token');
    assert.equal(options.tokenFilePath, '/tmp/truss-mcp-token');
    assert.equal(options.redirectPort, 9877);
    assert.equal(options.openBrowser, false);
  });

  it('rejects missing URL', () => {
    assert.throws(() => parseValidateRemoteOptions(['node', 'truss-mcp', 'validate-remote']));
  });
});
