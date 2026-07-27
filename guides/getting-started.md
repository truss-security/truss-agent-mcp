# Getting started

## Install

```bash
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp
npm install && npm run build
npm install -g .          # optional — truss-mcp on PATH
truss-mcp doctor --remote --strict-oauth  # hosted OAuth path (Cursor / Claude)
truss-mcp init                            # LLM keys + OAuth token path for search
```

Not published to npm yet. After publish: `npm install -g @truss-security/truss-agent-mcp`.

From source without global install: `npm run truss:init`, `npm run truss:search`.

## Two surfaces

**Remote MCP (recommended — Cursor, Claude, and `truss-mcp search`)** — connect to `https://api.truss-security.com/mcp` with OAuth. Growth+ plan. Dashboard `/oauth/consent` (Community auto-denied). Five hosted tools. See [client-setup-cursor.md](./client-setup-cursor.md).

**Local stdio (legacy / air-gap)** — `truss-mcp mcp` with `TRUSS_API_KEY` and `TRUSS_MCP_TRANSPORT=stdio`. FilterQL-oriented seven tools over REST.

**Terminal REPL** — `truss-mcp search` is an embedded host: same five hosted tools by default (OAuth token), then LLM coaching and post-processing. See [truss-cli.md](./truss-cli.md).

## MCP host setup

| Client | Guide |
|--------|-------|
| Cursor | [client-setup-cursor.md](./client-setup-cursor.md) |
| Claude Desktop | [client-setup-claude-desktop.md](./client-setup-claude-desktop.md) |

Recommended config ([config/cursor.mcp.json](../config/cursor.mcp.json)):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "url": "https://api.truss-security.com/mcp"
    }
  }
}
```

## First query

**In an MCP host (remote):**

> Search Truss for ransomware in healthcare from the last 7 days.

**In the terminal:**

```bash
truss-mcp doctor --remote --save-token /tmp/truss-mcp-token
# set TRUSS_MCP_OAUTH_TOKEN_FILE in .env (+ LLM via init)
truss-mcp search
```

```
truss search> Find ransomware reports affecting healthcare
```

## Next steps

- [truss-cli.md](./truss-cli.md) — REPL, remote token search, legacy stdio
- [mcp-acceptance.md](./mcp-acceptance.md) — verify hosted five tools
- [filterql-cookbook.md](./filterql-cookbook.md) — FilterQL examples (legacy stdio)
- [docs/05-hosted-mcp-oauth-architecture.md](../docs/05-hosted-mcp-oauth-architecture.md) — hosted OAuth
- [docs/README.md](../docs/README.md) — API and tool reference
