import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';

type ProtectedResourceMetadata = {
  resource?: string;
  authorization_servers?: string[];
  bearer_methods_supported?: string[];
};

type AuthorizationServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri?: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  code_challenge_methods_supported?: string[];
};

type ClientRegistrationResponse = {
  client_id: string;
  client_secret?: string;
  token_endpoint_auth_method?: string;
};

type TokenResponse = {
  access_token: string;
  token_type?: string;
  refresh_token?: string;
  expires_in?: number;
  id_token?: string;
};

export type ValidationOptions = {
  mcpUrl: string;
  redirectPort: number;
  openBrowser: boolean;
  verbose: boolean;
  strictClaude: boolean;
  saveTokenPath?: string;
  /** Skip browser OAuth and reuse a previously saved access token. */
  tokenFilePath?: string;
};

export type TrussProductSample = {
  id: number | string;
  title: string;
  category?: string;
  truss_prod_id?: string;
};

type JsonRpcResponse = {
  result?: any;
  error?: any;
};

export type ChecklistStatus = 'pass' | 'warn' | 'fail';

export type ChecklistItem = {
  id: string;
  status: ChecklistStatus;
  summary: string;
  detail?: string;
};

const DEFAULT_REDIRECT_PORT = 9876;
const VERBOSE_BODY_LIMIT = 600;

/** Canonical production hosted MCP URL (Cursor / Claude / registries). */
export const DEFAULT_PROD_MCP_URL = 'https://api.truss-security.com/mcp';

/** Default test hosted MCP URL. */
export const DEFAULT_TEST_MCP_URL = 'https://api-test.truss-security.com/mcp';

export function defaultMcpUrlFromEnv(): string {
  return (process.env.TRUSS_MCP_URL?.trim() || DEFAULT_PROD_MCP_URL).replace(/\/+$/, '');
}

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function logInfo(message: string): void {
  console.log(`→ ${message}`);
}

function logWarn(message: string): void {
  console.warn(`! ${message}`);
}

function logVerbose(verbose: boolean, message: string): void {
  if (verbose) console.log(`  ${message}`);
}

function truncate(text: string, limit = VERBOSE_BODY_LIMIT): string {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}… (${text.length} bytes)`;
}

function maskToken(token: string): string {
  if (token.length <= 16) return '(redacted)';
  return `${token.slice(0, 8)}…${token.slice(-6)} (${token.length} chars)`;
}

/** Canonical MCP resource URL per Claude connector guidance. */
export function canonicalizeResourceUrl(input: string): string {
  const url = new URL(input);
  url.hash = '';
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if (
    (url.protocol === 'https:' && url.port === '443') ||
    (url.protocol === 'http:' && url.port === '80')
  ) {
    url.port = '';
  }
  let path = url.pathname;
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  url.pathname = path || '/';
  url.search = '';
  return url.toString().replace(/\/$/, '') || url.origin;
}

function normalizeUrl(input: string): string {
  return canonicalizeResourceUrl(input);
}

function defaultProtectedResourceUrl(mcpUrl: string): string {
  const url = new URL(mcpUrl);
  return `${url.origin}/.well-known/oauth-protected-resource`;
}

function resourceSpecificProtectedResourceUrl(mcpUrl: string): string {
  const url = new URL(mcpUrl);
  const path = url.pathname.replace(/\/$/, '') || '/mcp';
  return `${url.origin}/.well-known/oauth-protected-resource${path}`;
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function createPkce(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const command =
    platform === 'darwin'
      ? 'open'
      : platform === 'win32'
        ? 'cmd'
        : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function readResponseText(response: Response, verbose: boolean, label: string): Promise<string> {
  const text = await response.text();
  logVerbose(
    verbose,
    `${label}: HTTP ${response.status} ${response.statusText || ''}`.trim()
  );
  if (verbose) {
    const auth =
      response.headers.get('www-authenticate') ??
      response.headers.get('x-amzn-remapped-www-authenticate');
    if (auth) logVerbose(true, `${label} WWW-Authenticate: ${auth}`);
    const location = response.headers.get('location');
    if (location) logVerbose(true, `${label} Location: ${location}`);
    if (text) logVerbose(true, `${label} body: ${truncate(text)}`);
  }
  return text;
}

async function readJson<T>(response: Response, label: string, verbose = false): Promise<T> {
  const text = await readResponseText(response, verbose, label);
  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${text}`);
  }
  return JSON.parse(text) as T;
}

function wwwAuthenticate(response: Response): string | null {
  return (
    response.headers.get('www-authenticate') ??
    response.headers.get('x-amzn-remapped-www-authenticate')
  );
}

function resourceMetadataFromAuthenticate(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const match = /resource_metadata="([^"]+)"/.exec(headerValue);
  return match?.[1] ?? null;
}

export function audiencesFromPayload(payload: Record<string, unknown>): string[] {
  const aud = payload.aud;
  if (typeof aud === 'string') return [aud];
  if (Array.isArray(aud)) return aud.filter((value): value is string => typeof value === 'string');
  return [];
}

export function buildClaudeCompatibilityChecklist(args: {
  mcpUrl: string;
  metadataResource?: string;
  authIssuer?: string;
  codeChallengeMethods?: string[];
  redirectStatus?: number | null;
  redirectLocation?: string | null;
  tokenPayload?: Record<string, unknown> | null;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const canonicalMcp = canonicalizeResourceUrl(args.mcpUrl);
  const metadataResource = args.metadataResource
    ? canonicalizeResourceUrl(args.metadataResource)
    : undefined;

  if (!metadataResource) {
    items.push({
      id: 'resource-metadata',
      status: 'fail',
      summary: 'Protected resource metadata missing resource URI',
      detail: 'Claude connectors need a canonical resource URL in /.well-known/oauth-protected-resource.',
    });
  } else if (metadataResource !== canonicalMcp) {
    items.push({
      id: 'resource-metadata',
      status: 'warn',
      summary: 'Advertised resource URI differs from MCP URL',
      detail: `metadata.resource=${metadataResource}; mcpUrl=${canonicalMcp}. Register the metadata resource URL in Claude.`,
    });
  } else {
    items.push({
      id: 'resource-metadata',
      status: 'pass',
      summary: 'Protected resource URI matches MCP URL',
      detail: metadataResource,
    });
  }

  if (args.redirectStatus != null && args.redirectStatus >= 300 && args.redirectStatus < 400) {
    const locationHost = args.redirectLocation ? new URL(args.redirectLocation, args.mcpUrl).host : '(missing)';
    const mcpHost = new URL(args.mcpUrl).host;
    const crossHost = locationHost !== mcpHost;
    items.push({
      id: 'no-redirect',
      status: crossHost ? 'fail' : 'warn',
      summary: crossHost
        ? 'MCP URL redirects across hosts (Bearer header will be stripped)'
        : 'MCP URL returns a redirect',
      detail: `HTTP ${args.redirectStatus} → ${args.redirectLocation ?? '(no Location)'}`,
    });
  } else {
    items.push({
      id: 'no-redirect',
      status: 'pass',
      summary: 'MCP URL does not redirect to another host',
    });
  }

  const methods = args.codeChallengeMethods ?? [];
  if (methods.includes('S256')) {
    items.push({
      id: 'pkce-s256',
      status: 'pass',
      summary: 'Authorization server advertises PKCE S256',
    });
  } else {
    items.push({
      id: 'pkce-s256',
      status: 'warn',
      summary: 'Authorization server metadata does not list S256 PKCE',
      detail: methods.length ? `code_challenge_methods_supported=${JSON.stringify(methods)}` : 'code_challenge_methods_supported missing',
    });
  }

  const payload = args.tokenPayload;
  if (!payload) {
    items.push({
      id: 'token-claims',
      status: 'fail',
      summary: 'Could not decode access token claims',
    });
    return items;
  }

  const tokenIss = typeof payload.iss === 'string' ? payload.iss.replace(/\/$/, '') : undefined;
  const metaIss = args.authIssuer?.replace(/\/$/, '');
  if (tokenIss && metaIss && tokenIss === metaIss) {
    items.push({
      id: 'issuer-match',
      status: 'pass',
      summary: 'Token issuer matches authorization server metadata',
      detail: tokenIss,
    });
  } else {
    items.push({
      id: 'issuer-match',
      status: 'fail',
      summary: 'Token issuer does not match authorization server metadata',
      detail: `token.iss=${tokenIss ?? '(missing)'}; metadata.issuer=${metaIss ?? '(missing)'}`,
    });
  }

  const audiences = audiencesFromPayload(payload);
  const expectedResource = metadataResource ?? canonicalMcp;
  if (audiences.includes(expectedResource)) {
    items.push({
      id: 'audience-resource',
      status: 'pass',
      summary: 'Token audience includes MCP resource URI',
      detail: `aud=${JSON.stringify(audiences)}`,
    });
  } else if (audiences.includes('authenticated')) {
    items.push({
      id: 'audience-resource',
      status: 'warn',
      summary: 'Token audience is Supabase "authenticated", not the MCP resource URI',
      detail:
        `aud=${JSON.stringify(audiences)}; Claude connectors expect resource-bound audience ${expectedResource}. ` +
        'Truss /mcp currently accepts aud=authenticated, so validate-remote can pass while Claude still fails after consent.',
    });
  } else {
    items.push({
      id: 'audience-resource',
      status: 'fail',
      summary: 'Token audience is neither MCP resource URI nor authenticated',
      detail: `aud=${JSON.stringify(audiences)}; expected ${expectedResource} or authenticated`,
    });
  }

  const role = payload.truss_role;
  if (typeof role === 'string' && role.length > 0) {
    if (role === 'community') {
      items.push({
        id: 'truss-role',
        status: 'fail',
        summary: 'Token truss_role=community cannot use MCP',
      });
    } else {
      items.push({
        id: 'truss-role',
        status: 'pass',
        summary: `Token includes truss_role=${role}`,
      });
    }
  } else {
    items.push({
      id: 'truss-role',
      status: 'warn',
      summary: 'Token missing truss_role claim',
      detail: 'API may fall back to truss_users lookup by sub.',
    });
  }

  return items;
}

function printClaudeChecklist(items: ChecklistItem[]): void {
  console.log('');
  console.log('Claude connector compatibility checklist');
  console.log('----------------------------------------');
  for (const item of items) {
    const mark = item.status === 'pass' ? 'PASS' : item.status === 'warn' ? 'WARN' : 'FAIL';
    console.log(`[${mark}] ${item.summary}`);
    if (item.detail) console.log(`       ${item.detail}`);
  }
  console.log('');
  const warnings = items.filter((item) => item.status === 'warn');
  const fails = items.filter((item) => item.status === 'fail');
  if (fails.length || warnings.length) {
    logWarn(
      'Local Truss MCP may still work while Claude connectors fail. ' +
        'If Claude shows ofid_… after Allow access, check API logs for a Bearer POST /mcp from Anthropic, then compare this checklist.'
    );
  }
}

async function probeMcpRedirect(
  mcpUrl: string,
  verbose: boolean
): Promise<{ status: number | null; location: string | null }> {
  try {
    const response = await fetch(mcpUrl, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'truss-mcp-redirect-probe', version: '0.0.0' },
        },
      }),
    });
    await readResponseText(response, verbose, 'MCP redirect probe');
    return {
      status: response.status,
      location: response.headers.get('location'),
    };
  } catch (error) {
    logWarn(`MCP redirect probe failed: ${error instanceof Error ? error.message : String(error)}`);
    return { status: null, location: null };
  }
}

async function discoverProtectedResource(
  mcpUrl: string,
  verbose: boolean
): Promise<{ metadata: ProtectedResourceMetadata; metadataUrl: string; authenticate: string | null }> {
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    }),
  });

  const body = await readResponseText(response, verbose, 'Unauthenticated MCP probe');
  if (response.status !== 401) {
    logWarn(`Unauthenticated MCP request returned ${response.status}; expected 401.`);
    if (!verbose && body) logVerbose(true, `body: ${truncate(body)}`);
  }

  const authenticate = wwwAuthenticate(response);
  if (response.headers.get('x-amzn-remapped-www-authenticate') && !response.headers.get('www-authenticate')) {
    logWarn('WWW-Authenticate was remapped to x-amzn-remapped-www-authenticate by API Gateway.');
  }

  const metadataUrl =
    resourceMetadataFromAuthenticate(authenticate) ??
    defaultProtectedResourceUrl(mcpUrl);
  const metadata = await readJson<ProtectedResourceMetadata>(
    await fetch(metadataUrl),
    'Protected resource metadata',
    verbose
  );

  // Prefer resource-specific well-known path when present (Claude also tries this).
  const resourceSpecificUrl = resourceSpecificProtectedResourceUrl(mcpUrl);
  if (resourceSpecificUrl !== metadataUrl) {
    try {
      const altResponse = await fetch(resourceSpecificUrl);
      if (altResponse.ok) {
        logVerbose(verbose, `Also found resource-specific metadata at ${resourceSpecificUrl}`);
      } else {
        logVerbose(verbose, `Resource-specific metadata ${resourceSpecificUrl} → HTTP ${altResponse.status}`);
      }
    } catch {
      // optional probe
    }
  }

  logOk(`Protected resource metadata discovered: ${metadataUrl}`);
  return { metadata, metadataUrl, authenticate };
}

async function discoverAuthorizationServer(
  metadata: ProtectedResourceMetadata,
  verbose: boolean
): Promise<AuthorizationServerMetadata> {
  const [authServerUrl] = metadata.authorization_servers ?? [];
  if (!authServerUrl) {
    throw new Error('Protected resource metadata does not include authorization_servers.');
  }

  const candidates = authorizationServerMetadataUrls(authServerUrl);
  logVerbose(verbose, `Resolving authorization server from: ${authServerUrl}`);
  logVerbose(verbose, `Metadata candidates: ${candidates.join(' | ')}`);

  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (!response.ok) {
        lastError = new Error(`Authorization server metadata failed (${response.status}) at ${candidate}`);
        logVerbose(verbose, lastError.message);
        continue;
      }
      const authMetadata = await readJson<AuthorizationServerMetadata>(
        response,
        'Authorization server metadata',
        verbose
      );

      if (!authMetadata.registration_endpoint) {
        throw new Error('Authorization server metadata is missing registration_endpoint; DCR is unavailable.');
      }

      logOk(`Authorization server metadata discovered: ${candidate}`);
      logOk(`Dynamic Client Registration available: ${authMetadata.registration_endpoint}`);
      logVerbose(verbose, `issuer=${authMetadata.issuer}`);
      logVerbose(
        verbose,
        `code_challenge_methods_supported=${JSON.stringify(authMetadata.code_challenge_methods_supported ?? [])}`
      );
      return authMetadata;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logVerbose(verbose, `Candidate failed (${candidate}): ${lastError.message}`);
    }
  }

  throw lastError ?? new Error(`Unable to resolve authorization server metadata from ${authServerUrl}`);
}

/**
 * Build RFC 8414 / OIDC discovery URLs for an authorization server issuer
 * (or a legacy direct well-known metadata URL).
 */
export function authorizationServerMetadataUrls(issuerOrMetadataUrl: string): string[] {
  const raw = issuerOrMetadataUrl.trim().replace(/\/$/, '');
  const url = new URL(raw);
  const urls: string[] = [];

  // Legacy: authorization_servers already pointed at a well-known metadata document.
  if (url.pathname.includes('/.well-known/')) {
    urls.push(raw);
    return urls;
  }

  // RFC 8414: insert /.well-known/oauth-authorization-server between host and path.
  const path = url.pathname === '/' ? '' : url.pathname;
  urls.push(`${url.origin}/.well-known/oauth-authorization-server${path}`);

  // Also try well-known under the issuer path (common for some IdPs).
  urls.push(`${raw}/.well-known/oauth-authorization-server`);
  urls.push(`${raw}/.well-known/openid-configuration`);

  // Root well-known without path (issuer with no path component already covered above).
  if (path) {
    urls.push(`${url.origin}/.well-known/oauth-authorization-server`);
    urls.push(`${url.origin}/.well-known/openid-configuration`);
  }

  return [...new Set(urls)];
}

async function registerClient(
  metadata: AuthorizationServerMetadata,
  redirectUri: string,
  verbose: boolean
): Promise<ClientRegistrationResponse> {
  if (!metadata.registration_endpoint) {
    throw new Error('registration_endpoint is required for Dynamic Client Registration.');
  }

  const response = await fetch(metadata.registration_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Truss MCP Remote OAuth Validator',
      redirect_uris: [redirectUri],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    }),
  });

  const client = await readJson<ClientRegistrationResponse>(response, 'Dynamic client registration', verbose);
  logOk(`Dynamic client registration succeeded: ${client.client_id}`);
  return client;
}

function waitForCallback(port: number, expectedState: string): Promise<{ code: string; state: string }> {
  const callbackUrl = `http://127.0.0.1:${port}/callback`;

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutMs = 180_000;

    const finish = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearInterval(heartbeat);
      fn();
    };

    const timeout = setTimeout(() => {
      finish(() => {
        server.close();
        reject(
          new Error(
            `Timed out waiting for OAuth callback at ${callbackUrl}.\n` +
              'Login alone is not enough — after signing in, complete MFA if prompted, then open /oauth/consent.\n' +
              'Growth+ accounts must click Allow access. Community accounts are auto-denied (access_denied) so the client does not hang.\n' +
              'Then the browser should redirect to 127.0.0.1 (this CLI). If you landed on the main dashboard,\n' +
              'Ctrl+C and re-run; finish consent before navigating away.\n' +
              'Community plans cannot use MCP (Growth+ required).'
          )
        );
      });
    }, timeoutMs);

    const heartbeat = setInterval(() => {
      logInfo(
        `Still waiting for browser redirect to ${callbackUrl} (complete MFA if needed, then Allow access on /oauth/consent — Community is auto-denied)…`
      );
    }, 15_000);

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
        if (url.pathname === '/' || url.pathname === '') {
          res.statusCode = 200;
          res.setHeader('content-type', 'text/plain');
          res.end(
            `Truss MCP OAuth callback listener is running.\nExpected path: ${callbackUrl}\nKeep this terminal open until the doctor finishes.`
          );
          return;
        }
        if (url.pathname !== '/callback') {
          res.statusCode = 404;
          res.end(`Not found. OAuth redirect must hit ${callbackUrl}`);
          return;
        }

        logInfo(`OAuth callback received: ${url.pathname}${url.search ? ' (with query)' : ''}`);

        const error = url.searchParams.get('error');
        if (error) {
          const description = (url.searchParams.get('error_description') ?? '').trim();
          const communityHint =
            error === 'access_denied'
              ? ' If this is a Community account, MCP requires Growth or above — upgrade or use a Growth+ test user.'
              : '';
          throw new Error(
            `OAuth error: ${error}${description ? ` ${description}` : ''}.${communityHint}`.trim()
          );
        }

        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        if (!code || !state) {
          throw new Error('OAuth callback is missing code or state.');
        }
        if (state !== expectedState) {
          throw new Error('OAuth callback state mismatch.');
        }

        res.statusCode = 200;
        res.setHeader('content-type', 'text/plain');
        res.end(
          'Truss MCP OAuth authorization code received. Return to the terminal for the final validation result. This page does not store tokens.'
        );
        finish(() => {
          server.close();
          resolve({ code, state });
        });
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('content-type', 'text/plain');
        res.end(err instanceof Error ? err.message : 'OAuth callback failed.');
        finish(() => {
          server.close();
          reject(err);
        });
      }
    });

    server.on('error', (err) => {
      finish(() => {
        reject(
          new Error(
            `Could not listen on ${callbackUrl}: ${err instanceof Error ? err.message : String(err)}. ` +
              'Try --port 9877 if something else is using 9876.'
          )
        );
      });
    });

    server.listen(port, '127.0.0.1', () => {
      logOk(`Listening for OAuth callback at ${callbackUrl}`);
      logInfo('After login, complete MFA if enrolled, then Allow access on /oauth/consent for “Truss MCP Remote OAuth Validator”.');
      logInfo('Community accounts are auto-denied (Growth+ required). Leave this terminal running until the browser redirects.');
    });
  });
}

function authUrl(args: {
  metadata: AuthorizationServerMetadata;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  resource: string;
}): string {
  const url = new URL(args.metadata.authorization_endpoint);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', args.clientId);
  url.searchParams.set('redirect_uri', args.redirectUri);
  url.searchParams.set('code_challenge', args.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', args.state);
  url.searchParams.set('resource', args.resource);
  return url.toString();
}

async function exchangeToken(
  args: {
    metadata: AuthorizationServerMetadata;
    clientId: string;
    code: string;
    redirectUri: string;
    verifier: string;
    resource: string;
  },
  verbose: boolean
): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', args.clientId);
  body.set('code', args.code);
  body.set('redirect_uri', args.redirectUri);
  body.set('code_verifier', args.verifier);
  body.set('resource', args.resource);

  const token = await readJson<TokenResponse>(
    await fetch(args.metadata.token_endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }),
    'Token exchange',
    verbose
  );

  if (!token.access_token) throw new Error('Token response did not include access_token.');
  logOk('Token exchange succeeded');
  logVerbose(verbose, `access_token=${maskToken(token.access_token)}`);
  if (token.refresh_token) logVerbose(verbose, `refresh_token=${maskToken(token.refresh_token)}`);
  if (token.expires_in != null) logVerbose(verbose, `expires_in=${token.expires_in}`);
  return token;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Parse MCP tools/call structuredContent or text payload from search_threats.
 * Returns product samples for assertions after OAuth.
 */
export function parseSearchThreatsToolResult(result: unknown): {
  products: TrussProductSample[];
  total?: number;
} {
  if (!result || typeof result !== 'object') {
    throw new Error('search_threats result is missing or not an object.');
  }

  const record = result as Record<string, unknown>;
  let payload: Record<string, unknown> | null = null;

  if (record.structuredContent && typeof record.structuredContent === 'object') {
    payload = record.structuredContent as Record<string, unknown>;
  } else if (Array.isArray(record.content)) {
    const textBlock = record.content.find(
      (block) =>
        block &&
        typeof block === 'object' &&
        (block as { type?: string }).type === 'text' &&
        typeof (block as { text?: unknown }).text === 'string'
    ) as { text: string } | undefined;
    if (textBlock) {
      try {
        const parsed = JSON.parse(textBlock.text) as unknown;
        if (parsed && typeof parsed === 'object') {
          payload = parsed as Record<string, unknown>;
        }
      } catch {
        throw new Error('search_threats content text is not valid JSON.');
      }
    }
  } else if (Array.isArray(record.products)) {
    payload = record;
  }

  if (!payload) {
    throw new Error('search_threats result did not include structuredContent, text JSON, or products.');
  }

  const productsRaw = payload.products;
  if (!Array.isArray(productsRaw)) {
    throw new Error('search_threats payload is missing a products array.');
  }

  const products: TrussProductSample[] = productsRaw.map((product, index) => {
    if (!product || typeof product !== 'object') {
      throw new Error(`search_threats products[${index}] is not an object.`);
    }
    const row = product as Record<string, unknown>;
    if (row.id == null || (typeof row.id !== 'number' && typeof row.id !== 'string')) {
      throw new Error(`search_threats products[${index}] is missing id.`);
    }
    if (typeof row.title !== 'string' || !row.title.trim()) {
      throw new Error(`search_threats products[${index}] is missing title.`);
    }
    return {
      id: row.id as number | string,
      title: row.title,
      category: typeof row.category === 'string' ? row.category : undefined,
      truss_prod_id: typeof row.truss_prod_id === 'string' ? row.truss_prod_id : undefined,
    };
  });

  return {
    products,
    total: typeof payload.total === 'number' ? payload.total : undefined,
  };
}

export function assertTrussDataFromSearchThreats(result: unknown): TrussProductSample {
  const parsed = parseSearchThreatsToolResult(result);
  if (parsed.products.length < 1) {
    throw new Error(
      'search_threats returned zero products. MCP is reachable, but no Truss data was returned for category=Malware.'
    );
  }
  return parsed.products[0]!;
}

async function mcpRequest(
  mcpUrl: string,
  token: string,
  body: Record<string, unknown>,
  verbose: boolean
): Promise<JsonRpcResponse> {
  const method = String(body.method ?? 'request');
  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json',
      'mcp-protocol-version': '2025-03-26',
    },
    body: JSON.stringify(body),
  });
  return readJson<JsonRpcResponse>(response, `MCP ${method}`, verbose);
}

export async function validateMcp(mcpUrl: string, token: string, verbose: boolean): Promise<TrussProductSample> {
  const initialize = await mcpRequest(
    mcpUrl,
    token,
    {
      jsonrpc: '2.0',
      id: 10,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'truss-mcp-remote-validator',
          version: '0.0.0',
        },
      },
    },
    verbose
  );
  if (initialize.error) throw new Error(`MCP initialize failed: ${JSON.stringify(initialize.error)}`);
  logOk('MCP initialize succeeded');

  const tools = await mcpRequest(
    mcpUrl,
    token,
    {
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/list',
    },
    verbose
  );
  if (tools.error) throw new Error(`MCP tools/list failed: ${JSON.stringify(tools.error)}`);
  const toolNames = Array.isArray(tools.result?.tools)
    ? tools.result.tools.map((tool: { name?: string }) => tool.name).filter(Boolean)
    : [];
  logOk(`MCP tools/list returned ${toolNames.length} tools`);
  if (!toolNames.includes('search_threats')) {
    throw new Error(`MCP tools/list is missing search_threats. Found: ${toolNames.join(', ') || '(none)'}`);
  }

  const call = await mcpRequest(
    mcpUrl,
    token,
    {
      jsonrpc: '2.0',
      id: 12,
      method: 'tools/call',
      params: {
        name: 'search_threats',
        arguments: {
          category: 'Malware',
          days: 30,
          limit: 1,
        },
      },
    },
    verbose
  );
  if (call.error) throw new Error(`MCP tools/call failed: ${JSON.stringify(call.error)}`);

  const sample = assertTrussDataFromSearchThreats(call.result);
  logOk(
    `MCP returned Truss product data: id=${sample.id}` +
      (sample.truss_prod_id ? ` truss_prod_id=${sample.truss_prod_id}` : '') +
      ` title="${sample.title}"` +
      (sample.category ? ` category=${sample.category}` : '')
  );
  return sample;
}

function saveTokenForDebug(path: string, token: string, mcpUrl: string): void {
  writeFileSync(path, `${token}\n`, { mode: 0o600 });
  logWarn(`Access token written to ${path} (mode 0600). Delete after debugging.`);
  logInfo('Replay initialize with:');
  console.log(
    `curl -sS -i -X POST '${mcpUrl}' \\\n` +
      `  -H "Authorization: Bearer $(cat '${path}')" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -H "Accept: application/json, text/event-stream" \\\n` +
      `  -H "mcp-protocol-version: 2025-03-26" \\\n` +
      `  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}'`
  );
}

export async function runValidateRemote(options: ValidationOptions): Promise<number> {
  const mcpUrl = normalizeUrl(options.mcpUrl);

  logInfo(`Validating remote MCP OAuth server: ${mcpUrl}`);
  if (options.verbose) logInfo('Verbose mode: printing HTTP statuses and truncated bodies (tokens redacted).');
  if (options.strictClaude) logInfo('Strict Claude mode: non-zero exit if Claude checklist has WARN/FAIL.');

  if (options.tokenFilePath) {
    const token = readFileSync(options.tokenFilePath, 'utf8').trim();
    if (!token) {
      throw new Error(`Token file is empty: ${options.tokenFilePath}`);
    }
    logInfo(`Skipping browser OAuth; using access token from ${options.tokenFilePath}`);
    await validateMcp(mcpUrl, token, options.verbose);
    logOk('Remote MCP token-file validation complete (MCP accessible + Truss data returned)');
    return 0;
  }

  const redirectUri = `http://127.0.0.1:${options.redirectPort}/callback`;
  const redirectProbe = await probeMcpRedirect(mcpUrl, options.verbose);
  const { metadata: resourceMetadata } = await discoverProtectedResource(mcpUrl, options.verbose);
  const resource = canonicalizeResourceUrl(resourceMetadata.resource ?? mcpUrl);
  logVerbose(options.verbose, `Using OAuth resource parameter: ${resource}`);

  const authMetadata = await discoverAuthorizationServer(resourceMetadata, options.verbose);
  const client = await registerClient(authMetadata, redirectUri, options.verbose);
  const pkce = createPkce();
  const state = base64Url(randomBytes(24));
  const callbackPromise = waitForCallback(options.redirectPort, state);
  const url = authUrl({
    metadata: authMetadata,
    clientId: client.client_id,
    redirectUri,
    codeChallenge: pkce.challenge,
    state,
    resource,
  });

  logInfo(`Opening browser for OAuth login and consent: ${url}`);
  logInfo('Token storage: in-memory for this process only (not written to the dashboard).');
  logInfo(
    `Waiting on ${redirectUri} — steps: (1) sign in + MFA if enrolled (2) Allow access on /oauth/consent — Community auto-denies (3) browser returns here.`
  );
  if (options.openBrowser) {
    openBrowser(url);
  } else {
    console.log(url);
  }

  const { code } = await callbackPromise;
  logOk('Authorization code received');

  const token = await exchangeToken(
    {
      metadata: authMetadata,
      clientId: client.client_id,
      code,
      redirectUri,
      verifier: pkce.verifier,
      resource,
    },
    options.verbose
  );

  const payload = decodeJwtPayload(token.access_token);
  if (payload) {
    logOk(`Access token received for subject: ${String(payload.sub ?? '(missing sub)')}`);
    logInfo(
      `Token claims: iss=${String(payload.iss ?? '(missing)')} aud=${JSON.stringify(payload.aud)} ` +
        `truss_role=${String(payload.truss_role ?? '(missing truss_role)')} ` +
        `client_id=${String(payload.client_id ?? payload.azp ?? '(missing)')} ` +
        `mcp_scope=${String(payload.mcp_scope ?? '(missing mcp_scope)')}`
    );
  } else {
    logWarn('Could not decode access token payload.');
  }

  const checklist = buildClaudeCompatibilityChecklist({
    mcpUrl,
    metadataResource: resourceMetadata.resource,
    authIssuer: authMetadata.issuer,
    codeChallengeMethods: authMetadata.code_challenge_methods_supported,
    redirectStatus: redirectProbe.status,
    redirectLocation: redirectProbe.location,
    tokenPayload: payload,
  });
  printClaudeChecklist(checklist);

  if (options.saveTokenPath) {
    saveTokenForDebug(options.saveTokenPath, token.access_token, mcpUrl);
  }

  await validateMcp(mcpUrl, token.access_token, options.verbose);
  logOk('Remote MCP OAuth validation complete (MCP accessible + Truss data returned)');

  const claudeProblems = checklist.filter((item) => item.status === 'warn' || item.status === 'fail');
  if (options.strictClaude && claudeProblems.length > 0) {
    logWarn(`Strict Claude mode: ${claudeProblems.length} checklist issue(s); exiting 2.`);
    return 2;
  }

  return 0;
}

export function parseValidateRemoteOptions(argv: string[]): ValidationOptions {
  const positional = argv[3];
  const urlFlagIndex = argv.findIndex((arg) => arg === '--url');
  const urlFromFlag =
    urlFlagIndex >= 0 && argv[urlFlagIndex + 1] && !argv[urlFlagIndex + 1].startsWith('-')
      ? argv[urlFlagIndex + 1]
      : undefined;

  const mcpUrl =
    urlFromFlag ??
    (positional && !positional.startsWith('-') ? positional : undefined) ??
    defaultMcpUrlFromEnv();

  const portArgIndex = argv.findIndex((arg) => arg === '--port');
  const port =
    portArgIndex >= 0 && argv[portArgIndex + 1]
      ? Number.parseInt(argv[portArgIndex + 1], 10)
      : DEFAULT_REDIRECT_PORT;

  const saveTokenIndex = argv.findIndex((arg) => arg === '--save-token');
  const saveTokenPath =
    saveTokenIndex >= 0 && argv[saveTokenIndex + 1] && !argv[saveTokenIndex + 1].startsWith('-')
      ? argv[saveTokenIndex + 1]
      : undefined;

  const tokenFileIndex = argv.findIndex((arg) => arg === '--token-file');
  const tokenFilePath =
    tokenFileIndex >= 0 && argv[tokenFileIndex + 1] && !argv[tokenFileIndex + 1].startsWith('-')
      ? argv[tokenFileIndex + 1]
      : undefined;

  return {
    mcpUrl,
    redirectPort: Number.isFinite(port) && port > 0 ? port : DEFAULT_REDIRECT_PORT,
    openBrowser: !argv.includes('--no-open'),
    verbose: argv.includes('--verbose') || argv.includes('-v'),
    strictClaude: argv.includes('--strict-claude'),
    saveTokenPath,
    tokenFilePath,
  };
}

/**
 * `truss-mcp doctor --remote` delegates to validate-remote with the same flags.
 * Usage: truss-mcp doctor --remote [--url URL] [--strict-claude] [--verbose] …
 */
export function parseDoctorRemoteOptions(argv: string[]): ValidationOptions {
  const rest = argv.filter((arg, index) => index < 2 || (arg !== 'doctor' && arg !== '--remote'));
  return parseValidateRemoteOptions([rest[0] ?? 'node', rest[1] ?? 'truss-mcp', 'validate-remote', ...rest.slice(2)]);
}
