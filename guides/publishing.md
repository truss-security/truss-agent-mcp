# Publishing

## Pre-publish checklist

```bash
npm test
npm run smoke
truss-mcp doctor --remote --strict-oauth
# or:
truss-mcp validate-remote https://api.truss-security.com/mcp --strict-oauth
```

`doctor --remote` / `validate-remote --strict-oauth` is the **registry compatibility gate** (OAuth discovery, DCR, PKCE, OAuth checklist, live Truss data). Do not publish a registry listing that fails this check.

## npm

```bash
npm test
npm run smoke
npm publish --access public
```

Package: `@truss-security/truss-agent-mcp`

Official registry: [../server.json](../server.json) · Submission guide: [registry-submission.md](./registry-submission.md) · Internal metadata: [../config/mcp-registry.json](../config/mcp-registry.json)

## GitHub release

```bash
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG.md
```

## Integration tests (local)

| Variable | Purpose |
|----------|---------|
| `TRUSS_RUN_INTEGRATION=1` | Enable live REST API tests |
| `TRUSS_API_KEY` | Required for REST integration |
| `TRUSS_API_URL` | Optional — `https://api-test.truss-security.com` for test |
| `TRUSS_RUN_MCP_OAUTH=1` | Enable live hosted MCP OAuth data tests |
| `TRUSS_MCP_OAUTH_TOKEN` | Bearer token from `validate-remote --save-token` |
| `TRUSS_MCP_URL` | Optional — default test MCP URL |

```bash
export TRUSS_RUN_INTEGRATION=1 TRUSS_API_KEY=...
npm test
```

Without `TRUSS_RUN_INTEGRATION`, REST integration cases are skipped.

CLI live turn test (`ask-integration.test.ts`) also needs `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

Optional hosted MCP OAuth data test (no browser; uses a saved token):

```bash
TRUSS_RUN_MCP_OAUTH=1 \
TRUSS_MCP_URL=https://api-test.truss-security.com/mcp \
TRUSS_MCP_OAUTH_TOKEN="$(cat /tmp/truss-mcp-token)" \
npm test -- tests/validate-remote-oauth.integration.test.ts
```

## SDK notes

- `userAgent: truss-mcp/<version>` on all SDK requests
- Debounce: `TRUSS_MCP_DEBOUNCE_MS` (default 200ms)
- 429 handling: [../docs/02-public-api-contract.md](../docs/02-public-api-contract.md)
