# truss-mcp CLI — terminal REPL with Claude

The `truss-mcp` binary provides interactive terminal access to Truss threat intelligence via Claude, without Cursor or Claude Desktop.

| Command | Purpose |
|---------|---------|
| `truss-mcp init` | Create `.env` from template |
| `truss-mcp doctor` | Validate keys and API access |
| `truss-mcp search` | Threat-intel retrieval REPL |
| `truss-mcp ask` | General assistant REPL |
| `truss-mcp mcp` | Run stdio MCP server (same binary — use in Cursor / Claude Desktop) |
| `truss-mcp help` | Show usage |

## Prerequisites

- Node.js 18+
- `npm run build` completed (from source) or global npm install
- **Two API keys** for search/ask: `TRUSS_API_KEY`, `ANTHROPIC_API_KEY`

## Quick start

```bash
npm install -g @truss-security/truss-agent-mcp
truss-mcp init
# edit .env
truss-mcp doctor
truss-mcp search
```

From source (use npm scripts — local install does not put `truss-mcp` on PATH):

```bash
npm install && npm run build
npm run truss:init
npm run truss:doctor
npm run truss:search
```

Or `npm install -g .` to get the `truss-mcp` command globally.

## Environment

Loaded from `~/.config/truss/env`, `~/.truss/.env`, then `./.env` (shell env always wins).

| Variable | Required | Default |
|----------|----------|---------|
| `TRUSS_API_KEY` | yes | — |
| `ANTHROPIC_API_KEY` | search/ask | — |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` |
| `TRUSS_MCP_SERVER_PATH` | no | auto-resolve `dist/truss-cli.js` |

See [env.example](../env.example).

## npm bin conflict

`@truss-security/truss-sdk` publishes a `truss` binary. This package uses **`truss-mcp`** to avoid global install conflicts.

## Related

- [getting-started.md](./getting-started.md) — MCP host setup
- [mcp-acceptance.md](./mcp-acceptance.md) — verify MCP tools in a host
