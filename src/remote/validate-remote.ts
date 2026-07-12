import { createHash, randomBytes } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn } from 'node:child_process';

type ProtectedResourceMetadata = {
  resource?: string;
  authorization_servers?: string[];
};

type AuthorizationServerMetadata = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri?: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
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

type ValidationOptions = {
  mcpUrl: string;
  redirectPort: number;
  openBrowser: boolean;
};

type JsonRpcResponse = {
  result?: any;
  error?: any;
};

const DEFAULT_REDIRECT_PORT = 9876;

function logOk(message: string): void {
  console.log(`✓ ${message}`);
}

function logInfo(message: string): void {
  console.log(`→ ${message}`);
}

function logWarn(message: string): void {
  console.warn(`! ${message}`);
}

function normalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = '';
  return url.toString().replace(/\/$/, '');
}

function defaultProtectedResourceUrl(mcpUrl: string): string {
  const url = new URL(mcpUrl);
  return `${url.origin}/.well-known/oauth-protected-resource`;
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

async function readJson<T>(response: Response, label: string): Promise<T> {
  const text = await response.text();
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

async function discoverProtectedResource(mcpUrl: string): Promise<ProtectedResourceMetadata> {
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

  if (response.status !== 401) {
    logWarn(`Unauthenticated MCP request returned ${response.status}; expected 401.`);
  }

  const authenticate = wwwAuthenticate(response);
  if (response.headers.get('x-amzn-remapped-www-authenticate') && !response.headers.get('www-authenticate')) {
    logWarn('WWW-Authenticate was remapped to x-amzn-remapped-www-authenticate by API Gateway.');
  }

  const metadataUrl = resourceMetadataFromAuthenticate(authenticate) ?? defaultProtectedResourceUrl(mcpUrl);
  const metadata = await readJson<ProtectedResourceMetadata>(
    await fetch(metadataUrl),
    'Protected resource metadata'
  );
  logOk(`Protected resource metadata discovered: ${metadataUrl}`);
  return metadata;
}

async function discoverAuthorizationServer(metadata: ProtectedResourceMetadata): Promise<AuthorizationServerMetadata> {
  const [authServerUrl] = metadata.authorization_servers ?? [];
  if (!authServerUrl) {
    throw new Error('Protected resource metadata does not include authorization_servers.');
  }

  const authMetadata = await readJson<AuthorizationServerMetadata>(
    await fetch(authServerUrl),
    'Authorization server metadata'
  );

  if (!authMetadata.registration_endpoint) {
    throw new Error('Authorization server metadata is missing registration_endpoint; DCR is unavailable.');
  }

  logOk(`Authorization server metadata discovered: ${authServerUrl}`);
  logOk(`Dynamic Client Registration available: ${authMetadata.registration_endpoint}`);
  return authMetadata;
}

async function registerClient(
  metadata: AuthorizationServerMetadata,
  redirectUri: string
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

  const client = await readJson<ClientRegistrationResponse>(response, 'Dynamic client registration');
  logOk(`Dynamic client registration succeeded: ${client.client_id}`);
  return client;
}

function waitForCallback(port: number, expectedState: string): Promise<{ code: string; state: string }> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('Timed out waiting for OAuth callback.'));
    }, 180_000);

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      try {
        const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
        if (url.pathname !== '/callback') {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }

        const error = url.searchParams.get('error');
        if (error) {
          throw new Error(`OAuth error: ${error} ${url.searchParams.get('error_description') ?? ''}`.trim());
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
        res.end('Truss MCP OAuth validation succeeded. You can close this browser tab.');
        clearTimeout(timeout);
        server.close();
        resolve({ code, state });
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('content-type', 'text/plain');
        res.end(err instanceof Error ? err.message : 'OAuth callback failed.');
        clearTimeout(timeout);
        server.close();
        reject(err);
      }
    });

    server.listen(port, '127.0.0.1');
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
  url.searchParams.set('scope', 'openid profile email');
  return url.toString();
}

async function exchangeToken(args: {
  metadata: AuthorizationServerMetadata;
  clientId: string;
  code: string;
  redirectUri: string;
  verifier: string;
  resource: string;
}): Promise<TokenResponse> {
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
    'Token exchange'
  );

  if (!token.access_token) throw new Error('Token response did not include access_token.');
  logOk('Token exchange succeeded');
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

async function mcpRequest(mcpUrl: string, token: string, body: Record<string, unknown>): Promise<JsonRpcResponse> {
  return readJson<JsonRpcResponse>(
    await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
        'mcp-protocol-version': '2025-03-26',
      },
      body: JSON.stringify(body),
    }),
    `MCP ${String(body.method ?? 'request')}`
  );
}

async function validateMcp(mcpUrl: string, token: string): Promise<void> {
  const initialize = await mcpRequest(mcpUrl, token, {
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
  });
  if (initialize.error) throw new Error(`MCP initialize failed: ${JSON.stringify(initialize.error)}`);
  logOk('MCP initialize succeeded');

  const tools = await mcpRequest(mcpUrl, token, {
    jsonrpc: '2.0',
    id: 11,
    method: 'tools/list',
  });
  if (tools.error) throw new Error(`MCP tools/list failed: ${JSON.stringify(tools.error)}`);
  const toolCount = Array.isArray(tools.result?.tools) ? tools.result.tools.length : 0;
  logOk(`MCP tools/list returned ${toolCount} tools`);

  const call = await mcpRequest(mcpUrl, token, {
    jsonrpc: '2.0',
    id: 12,
    method: 'tools/call',
    params: {
      name: 'search_threats',
      arguments: {
        category: 'Malware',
        limit: 1,
      },
    },
  });
  if (call.error) throw new Error(`MCP tools/call failed: ${JSON.stringify(call.error)}`);
  logOk('MCP search_threats tool call succeeded');
}

export async function runValidateRemote(options: ValidationOptions): Promise<number> {
  const mcpUrl = normalizeUrl(options.mcpUrl);
  const redirectUri = `http://127.0.0.1:${options.redirectPort}/callback`;

  logInfo(`Validating remote MCP OAuth server: ${mcpUrl}`);
  const resourceMetadata = await discoverProtectedResource(mcpUrl);
  const resource = resourceMetadata.resource ?? mcpUrl;
  const authMetadata = await discoverAuthorizationServer(resourceMetadata);
  const client = await registerClient(authMetadata, redirectUri);
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
  if (options.openBrowser) {
    openBrowser(url);
  } else {
    console.log(url);
  }

  const { code } = await callbackPromise;
  logOk('Authorization code received');

  const token = await exchangeToken({
    metadata: authMetadata,
    clientId: client.client_id,
    code,
    redirectUri,
    verifier: pkce.verifier,
    resource,
  });

  const payload = decodeJwtPayload(token.access_token);
  if (payload) {
    logOk(`Access token received for subject: ${String(payload.sub ?? '(missing sub)')}`);
    logInfo(`Token claims: aud=${JSON.stringify(payload.aud)} role=${String(payload.role ?? '(missing role)')} mcp_scope=${String(payload.mcp_scope ?? '(missing mcp_scope)')}`);
  } else {
    logWarn('Could not decode access token payload.');
  }

  await validateMcp(mcpUrl, token.access_token);
  logOk('Remote MCP OAuth validation complete');
  return 0;
}

export function parseValidateRemoteOptions(argv: string[]): ValidationOptions {
  const mcpUrl = argv[3];
  if (!mcpUrl) {
    throw new Error('Usage: truss-mcp validate-remote <https://.../mcp> [--no-open] [--port 9876]');
  }

  const portArgIndex = argv.findIndex((arg) => arg === '--port');
  const port =
    portArgIndex >= 0 && argv[portArgIndex + 1]
      ? Number.parseInt(argv[portArgIndex + 1], 10)
      : DEFAULT_REDIRECT_PORT;

  return {
    mcpUrl,
    redirectPort: Number.isFinite(port) && port > 0 ? port : DEFAULT_REDIRECT_PORT,
    openBrowser: !argv.includes('--no-open'),
  };
}

