# Getting started

## Install

```bash
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp
npm install && npm run build
npm install -g .          # optional — truss-mcp on PATH
truss-mcp doctor --remote # hosted OAuth path (Cursor / Claude)
truss-mcp init            # for CLI search / legacy stdio
```

Not published to npm yet. After publish: `npm install -g @truss-security/truss-agent-mcp`.

From source without global install: `npm run truss:init`, `npm run truss:search`.

## Two surfaces

**Remote MCP (recommended for Cursor / Claude)** — connect to `https://api.truss-security.com/mcp` with OAuth. Growth+ plan. No API key in host config. See [client-setup-cursor.md](./client-setup-cursor.md).

**Local stdio (legacy / air-gap)** — `truss-mcp mcp` with `TRUSS_API_KEY`. FilterQL-oriented seven tools over REST.

**Terminal REPL** — `truss-mcp search` (local stdio by default, or remote with a saved OAuth token). See [truss-cli.md](./truss-cli.md).

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
truss-mcp search
```

```
truss search> Find ransomware reports affecting healthcare
```

## Next steps

- [truss-cli.md](./truss-cli.md) — REPL modes, `run`, date windows, remote token search
- [filterql-cookbook.md](./filterql-cookbook.md) — FilterQL examples (local stdio)
- [mcp-acceptance.md](./mcp-acceptance.md) — verify tools
- [docs/05-hosted-mcp-oauth-architecture.md](../docs/05-hosted-mcp-oauth-architecture.md) — hosted OAuth
- [docs/README.md](../docs/README.md) — API and tool reference
