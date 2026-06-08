# truss-agent-mcp

Truss threat intelligence via **[Model Context Protocol](https://modelcontextprotocol.io)** and a terminal assistant — one binary: **`truss-mcp`**.

Query Truss products with **FilterQL** (`=`, `!=`, `LIKE`) and STIX export. Public API tier: `POST /product/search` and STIX routes.

> **Not on npm yet.** Install from this repo (`npm install -g .`). After publish: `npm install -g @truss-security/truss-agent-mcp`.

## Quick start

```bash
cd truss-agent-mcp
npm install && npm run build
npm install -g .
truss-mcp init
truss-mcp doctor
truss-mcp search    # live Truss queries
```

Node.js 18+. Binary name **`truss-mcp`** avoids conflict with `@truss-security/truss-sdk`'s `truss` command.

## What you can run

| Command | What it does |
|---------|----------------|
| `truss-mcp search` | REPL with live Truss MCP tools |
| `truss-mcp ask` | REPL for FilterQL coaching (no live queries) |
| `truss-mcp mcp` | stdio MCP server for Cursor, Claude Desktop, VS Code |
| `truss-mcp init` | Interactive `.env` setup |
| `truss-mcp doctor` | Validate keys and API access |
| `truss-mcp help` | Usage summary |

## search vs ask

| | search | ask |
|--|--------|-----|
| Truss API | Yes (7 MCP tools) | No |
| Best for | Run filters, STIX, IOC follow-ups | Build and confirm FilterQL first |

**Typical flow:** coach a filter in **ask** → type **`run`** to execute (default **7 days**) → stay in **search** for follow-ups on results.

- Coaching questions in search → prompts **`:ask`** (question carries over)
- After confirming a filter in ask → **`run`** or **`:search`**
- Wider windows (`run 30`, `days 30`) may use more API quota

Full REPL reference: **[guides/truss-cli.md](guides/truss-cli.md)**

## MCP host (Cursor / Claude)

Only `TRUSS_API_KEY` required — the host provides the LLM.

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

Before publish, use `npx -y @truss-security/truss-agent-mcp mcp` or a local `node dist/truss-cli.js mcp` path. See [guides/getting-started.md](guides/getting-started.md).

## Configuration

Env load order (shell vars win): `~/.config/truss/env` → `~/.truss/.env` → `./.env`

| Variable | Required for | Notes |
|----------|--------------|-------|
| `TRUSS_API_KEY` | search, mcp | From Truss dashboard |
| `LLM_PROVIDER` | search, ask | `anthropic` or `openai` — set via `init` |
| `LLM_MODEL` | search, ask | Set via `init` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | search, ask | Per provider |

Full list: [env.example](env.example)

## Documentation

**Guides** — install, REPL, MCP clients, FilterQL examples

- [Getting started](guides/getting-started.md)
- [Terminal REPL](guides/truss-cli.md)
- [FilterQL cookbook](guides/filterql-cookbook.md)
- [Cursor setup](guides/client-setup-cursor.md) · [Claude Desktop](guides/client-setup-claude-desktop.md)

**Reference** — API contract, tools, architecture

- [docs/README.md](docs/README.md)

## Development

```bash
npm install && npm run build
npm test
npm run truss:search    # from source without global install
```

Publish: [guides/publishing.md](guides/publishing.md) · Changes: [CHANGELOG.md](CHANGELOG.md)

## Related

- [@truss-security/truss-sdk](https://www.npmjs.com/package/@truss-security/truss-sdk) — API client
- [truss-agent](https://github.com/truss-security/truss-agent) — scheduled webhook delivery
- [Truss docs](https://truss-security.github.io/truss-docs/data/sdk)

MIT
