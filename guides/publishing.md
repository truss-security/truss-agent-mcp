# Publishing

## npm

1. Ensure you are logged in: `npm login`
2. Bump version in `package.json`
3. Verify build, tests, and stdio startup:

```bash
npm test
npm run smoke
```

4. Publish:

```bash
npm publish --access public
```

Package name: `@truss-security/truss-agent-mcp`

## GitHub release

After publishing to npm, create a GitHub release manually (or with `gh release create`) and link to [CHANGELOG.md](../CHANGELOG.md).

```bash
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG.md
```

## userAgent and rate limits

The server sets `userAgent: truss-mcp/<version>` on every SDK request. SDK retries are disabled (`retries: 0`); the MCP layer debounces calls via `TRUSS_MCP_DEBOUNCE_MS` and documents 429 handling in [../docs/02-public-api-contract.md](../docs/02-public-api-contract.md).

## Integration tests

Live API tests are opt-in. They exercise `POST /product/search`, `POST /product/search/stix`, and `GET /product/{id}/stix` against a real Truss API key.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `TRUSS_RUN_INTEGRATION` | yes | — | Set to `1` to enable live tests |
| `TRUSS_API_KEY` | yes | — | API key with product search access |
| `TRUSS_API_URL` | no | `https://api.truss-security.com` | Use `https://api-test.truss-security.com` for test |

```bash
export TRUSS_API_KEY=your_key_here
export TRUSS_API_URL=https://api-test.truss-security.com
export TRUSS_RUN_INTEGRATION=1
npm test
```

Without `TRUSS_RUN_INTEGRATION=1`, integration cases are skipped and only unit tests run.

### truss-mcp CLI live turn test

Requires both Truss and Anthropic keys:

```bash
export TRUSS_RUN_INTEGRATION=1
export TRUSS_API_KEY=...
export ANTHROPIC_API_KEY=...
npm test
```

Runs `tests/ask-integration.test.ts` (single Claude + MCP turn).
