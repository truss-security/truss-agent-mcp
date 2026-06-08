# Publishing

## npm

```bash
npm test
npm run smoke
npm publish --access public
```

Package: `@truss-security/truss-agent-mcp`

## GitHub release

```bash
git tag v1.1.0
git push origin v1.1.0
gh release create v1.1.0 --title "v1.1.0" --notes-file CHANGELOG.md
```

## Integration tests (local)

| Variable | Purpose |
|----------|---------|
| `TRUSS_RUN_INTEGRATION=1` | Enable live API tests |
| `TRUSS_API_KEY` | Required |
| `TRUSS_API_URL` | Optional — `https://api-test.truss-security.com` for test |

```bash
export TRUSS_RUN_INTEGRATION=1 TRUSS_API_KEY=...
npm test
```

Without `TRUSS_RUN_INTEGRATION`, integration cases are skipped.

CLI live turn test (`ask-integration.test.ts`) also needs `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

## SDK notes

- `userAgent: truss-mcp/<version>` on all SDK requests
- Debounce: `TRUSS_MCP_DEBOUNCE_MS` (default 200ms)
- 429 handling: [../docs/02-public-api-contract.md](../docs/02-public-api-contract.md)
