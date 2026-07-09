# Reference server architecture

## Process model

```
MCP host (Cursor / Claude Desktop)
    │ stdio
    ▼
truss-agent-mcp (Node ≥18, ESM)
    │ @truss-security/truss-sdk
    ▼
Truss API (API Gateway + Lambda)
```

## Entry points

| File | Role |
|------|------|
| `src/truss-cli.ts` | CLI bin `truss-mcp` (`mcp`, `search`, `ask`, …) |
| `src/server.ts` | Builds `McpServer`, registers tools, connects stdio transport |

## Configuration

Loaded from environment at startup (see `env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `TRUSS_API_KEY` | — | Required |
| `TRUSS_API_URL` | `https://api.truss-security.com` | API base |
| `TRUSS_MCP_MAX_LIMIT` | `50` | Per-request limit cap |
| `TRUSS_MCP_MAX_PAGES` | `3` | Max pages for iterate tool |
| `TRUSS_MCP_DEBOUNCE_MS` | `200` | Min gap between API calls in one session |

## SDK client

- `TrussClient` with `retries: 0` (avoid double retry with host tool loops)
- `userAgent: truss-mcp/<package version>`
- Errors: `TrussApiError`, `TrussTimeoutError`, `TrussNetworkError` mapped to tool error text

## Payload builder

`src/lib/build-product-search-payload.ts` is ported from [truss-agent](https://github.com/truss-security/truss-agent) `build-product-search-payload.ts`. Keep in sync when FilterQL or date rules change.

## Debouncing

A simple in-process timestamp gate reduces burst tool calls from enthusiastic LLM loops. It does not replace API Gateway throttling.

## Security

- API key only in server env (MCP host config `env` block)
- Never log `getConfig().apiKey`
- Tool responses avoid raw IOC values by default

## Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol
- `@truss-security/truss-sdk` — HTTP + FilterQL validation
- `zod` — tool input schemas

---

**Next:** [02 — Public API contract](./02-public-api-contract.md) · [Docs index](./README.md)
