# Getting started

## Install

```bash
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp
npm install && npm run build
npm install -g .          # optional — truss-mcp on PATH
truss-mcp init
truss-mcp doctor
```

Not published to npm yet. After publish: `npm install -g @truss-security/truss-agent-mcp`.

From source without global install: `npm run truss:init`, `npm run truss:search`.

## Two ways to use truss-mcp

**MCP host** (Cursor, Claude Desktop) — `truss-mcp mcp`  
Host LLM calls Truss tools. Only `TRUSS_API_KEY` needed.

**Terminal REPL** — `truss-mcp search`  
Built-in LLM (Anthropic or OpenAI). See [truss-cli.md](./truss-cli.md).

## MCP host setup

| Client | Guide |
|--------|-------|
| Cursor | [client-setup-cursor.md](./client-setup-cursor.md) |
| Claude Desktop | [client-setup-claude-desktop.md](./client-setup-claude-desktop.md) |

Example config ([config/cursor.mcp.json](../config/cursor.mcp.json)):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": { "TRUSS_API_KEY": "YOUR_KEY" }
    }
  }
}
```

## First query

**In an MCP host:**

> Search Truss for ransomware in healthcare from the last 7 days.

**In the terminal:**

```bash
truss-mcp search
```

```
truss search> Find ransomware reports affecting healthcare
```

## Next steps

- [truss-cli.md](./truss-cli.md) — REPL modes, `run`, date windows
- [filterql-cookbook.md](./filterql-cookbook.md) — FilterQL examples
- [mcp-acceptance.md](./mcp-acceptance.md) — verify all seven tools
- [docs/README.md](../docs/README.md) — API and tool reference
