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
| `truss-mcp search` | Guided REPL with live Truss MCP tools (FilterQL, STIX, detection rules) |
| `truss-mcp mcp` | stdio MCP server for Cursor, Claude Desktop, VS Code |
| `truss-mcp init` | Interactive `.env` setup |
| `truss-mcp doctor` | Validate keys and API access |
| `truss-mcp help` | Usage summary |

## Guided search workflow

One REPL with MCP tools always connected. The assistant classifies your intent and asks before querying Truss API:

1. **Knowledge** — Truss platform, cyber security context, threat background
2. **Build filter** — draft FilterQL, validate, confirm
3. **Query** — `run` executes confirmed filter (default **7 days**)
4. **Format** — `stix` for STIX export; JSON summaries in-thread
5. **Detection rules** — `detect splunk`, `detect falcon`, `detect cortex` from search results

The assistant offers next steps explicitly: build a filter, refine it, query Truss API, export JSON/STIX, or generate SIEM/EDR hunting queries.

- Wider windows (`run 30`, `days 30`) may use more API quota
- Context-only follow-ups (IOC dedupe, reformat) use thread history without re-querying

Full REPL reference: **[guides/truss-cli.md](guides/truss-cli.md)**

## Terminal display (REPL)

`truss-mcp search` uses color-coded, ASCII-bordered output:

- **You** — your message
- **MCP** — live tool trace (`→ search_products`, `✓ 12 matches`)
- **Results** — structured product table before the assistant summary
- **Truss** — assistant reply (cyan), guided offers (yellow), FilterQL blocks (magenta)

Controls: `color` / `color on` / `color off` / `color auto` · env `TRUSS_MCP_COLOR` · standard `NO_COLOR=1`

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
| `LLM_PROVIDER` | search | `anthropic` or `openai` — set via `init` |
| `LLM_MODEL` | search | Set via `init` |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | search | Per provider |

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

**Contributors / AI agents:** see [AGENTS.md](AGENTS.md) for repo operations and conventions.

Publish: [guides/publishing.md](guides/publishing.md) · Changes: [CHANGELOG.md](CHANGELOG.md)

## Related

- [@truss-security/truss-sdk](https://www.npmjs.com/package/@truss-security/truss-sdk) — API client
- [truss-agent](https://github.com/truss-security/truss-agent) — scheduled webhook delivery
- [Truss docs](https://truss-security.github.io/truss-docs/data/sdk)

MIT
