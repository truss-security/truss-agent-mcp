# Publishing

## npm

1. Ensure you are logged in: `npm login`
2. Bump version in `package.json`
3. Build and publish:

```bash
npm run build
npm test
npm publish --access public
```

Package name: `@truss-security/truss-agent-mcp`

## GitHub release

Tag `v<version>` and attach release notes linking to [docs/04-mcp-tool-catalog.md](../docs/04-mcp-tool-catalog.md).

## userAgent and rate limits

The server sets `userAgent: truss-agent-mcp/<version>` on every SDK request. SDK retries are disabled (`retries: 0`); the MCP layer debounces calls via `TRUSS_MCP_DEBOUNCE_MS` and documents 429 handling in [../docs/02-public-api-contract.md](../docs/02-public-api-contract.md).

## Integration tests

```bash
export TRUSS_API_KEY=...
export TRUSS_API_URL=https://api-test.truss-security.com
export TRUSS_RUN_INTEGRATION=1
npm test
```
