# Reference server architecture

## Two surfaces

| Surface | When to use | Auth |
|---------|-------------|------|
| **Remote (recommended)** | Cursor, Claude Desktop, MCP registries | OAuth → `https://api.truss-security.com/mcp` |
| **Local stdio (legacy / air-gap)** | Offline, BYO-key, FilterQL-oriented tools | `TRUSS_API_KEY` → REST |

Remote architecture, OAuth, and hosted tools: [05 — Hosted MCP OAuth](./05-hosted-mcp-oauth-architecture.md).

This document describes the **local stdio** process model shipped in this package.

## Process model (local stdio)

```
MCP host (Cursor / Claude Desktop)
    │ stdio
    ▼
truss-agent-mcp (Node ≥18, ESM)
    │ @truss-security/truss-sdk
    ▼
Truss API REST (API Gateway + Lambda)
```

## Entry points

| File | Role |
|------|------|
| `src/truss-cli.ts` | CLI bin `truss-mcp` (`mcp`, `search`, `validate-remote`, …) |
| `src/server.ts` | Builds `McpServer`, registers tools, connects stdio transport |
| `src/remote/validate-remote.ts` | OAuth + hosted MCP doctor |

## Configuration (local stdio / CLI)

Loaded from environment at startup (see `env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `TRUSS_API_KEY` | — | Required for local stdio and default CLI search |
| `TRUSS_API_URL` | `https://api.truss-security.com` | REST API base |
| `TRUSS_MCP_URL` | `https://api.truss-security.com/mcp` | Hosted MCP URL (remote CLI / doctor) |
| `TRUSS_MCP_OAUTH_TOKEN_FILE` | — | Bearer token file for remote CLI search |
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

- API key only in server env (MCP host config `env` block) for local stdio
- Prefer remote OAuth for interactive hosts so keys never sit in `mcp.json`
- Never log `getConfig().apiKey` or full OAuth tokens
- Tool responses avoid raw IOC values by default

## Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol
- `@truss-security/truss-sdk` — HTTP + FilterQL validation
- `zod` — tool input schemas

---

**Next:** [02 — Public API contract](./02-public-api-contract.md) · [Docs index](./README.md)
