# Getting started

## Prerequisites

- Node.js 18+
- A Truss API key with access to product search (from the Truss dashboard)

## Install

> Package is **not published to npm yet**. Install from the repo:

```bash
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp
npm install
npm run build
npm install -g .    # optional — truss-mcp on PATH
```

After npm publish: `npm install -g @truss-security/truss-agent-mcp` or `npx -y @truss-security/truss-agent-mcp mcp`.

## First-time setup

**Global install:**

```bash
truss-mcp init    # interactive — prompts for API keys
truss-mcp doctor
```

**From source** (local `npm install` does not add `truss-mcp` to your shell PATH):

```bash
npm run truss:init
npm run truss:doctor
```

Or install globally from the repo: `npm install -g .` then use `truss-mcp` as above.

Edit `.env` — set `TRUSS_API_KEY` (and `ANTHROPIC_API_KEY` for the terminal CLI).

Env files are loaded from `~/.config/truss/env`, `~/.truss/.env`, then `./.env` (shell variables always win).

## Commands (single binary)

| Command | Purpose |
|---------|---------|
| `truss-mcp mcp` | stdio MCP server for Cursor, Claude Desktop, etc. |
| `truss-mcp search` / `ask` | Terminal REPL with Claude |
| `truss-mcp init` / `doctor` | Setup and validation |

CLI guide: [truss-cli.md](./truss-cli.md)

## Configure your MCP host

- [Cursor](./client-setup-cursor.md)
- [Claude Desktop](./client-setup-claude-desktop.md)

## Try a query

In an MCP host, ask:

> Search Truss for ransomware affecting healthcare in the last 30 days.

From the terminal CLI:

```bash
truss-mcp search
```

## Next steps

- [FilterQL cookbook](./filterql-cookbook.md)
- [truss-agent vs MCP](./truss-agent-vs-mcp.md)
- [MCP acceptance checklist](./mcp-acceptance.md)
- [Documentation index](../docs/README.md)
- [Truss API roadmap](../docs/06-api-roadmap.md) — planned quota, contributor POST, smart search, and product GET (not yet shipped)
