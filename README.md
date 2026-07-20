# truss-agent-mcp

Truss threat intelligence via **[Model Context Protocol](https://modelcontextprotocol.io)** and a terminal assistant — one binary: **`truss-mcp`**.

## Two surfaces

| Surface | Use for | Auth |
|---------|---------|------|
| **Remote (recommended)** | Cursor, Claude Desktop, MCP registries | OAuth → [`https://api.truss-security.com/mcp`](https://api.truss-security.com/mcp) |
| **Local stdio (legacy)** | Air-gap / BYO-key / FilterQL REPL tools | `TRUSS_API_KEY` → REST |

Hosted MCP (OAuth, Growth+ gate, five tools) is owned by **truss-api**. This package ships configs, `validate-remote` / `doctor --remote`, CLI search, and optional local stdio.

> **Not on npm yet.** Install from this repo (`npm install -g .`). After publish: `npm install -g @truss-security/truss-agent-mcp`.

## Quick start

```bash
cd truss-agent-mcp
npm install && npm run build
npm install -g .
truss-mcp doctor --remote   # OAuth path Cursor/Claude use
truss-mcp init              # for CLI search / legacy stdio
truss-mcp search
```

Node.js 18+. Binary name **`truss-mcp`** avoids conflict with `@truss-security/truss-sdk`'s `truss` command.

## What you can run

| Command | What it does |
|---------|----------------|
| `truss-mcp search` | Guided REPL with live MCP tools (local stdio or remote OAuth token) |
| `truss-mcp mcp` | Local stdio MCP server (legacy / air-gap) |
| `truss-mcp init` | Interactive `.env` setup |
| `truss-mcp doctor` | Validate keys and API access; `--remote` runs hosted OAuth doctor |
| `truss-mcp validate-remote <url>` | OAuth + MCP doctor (discovery, DCR, PKCE, tools) |
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

## MCP host (Cursor / Claude) — remote OAuth (recommended)

No API key in host config. Growth+ Truss account; browser OAuth consent.

```json
{
  "mcpServers": {
    "truss-mcp": {
      "url": "https://api.truss-security.com/mcp"
    }
  }
}
```

Samples: [config/cursor.mcp.json](config/cursor.mcp.json) · [config/claude_desktop_config.json](config/claude_desktop_config.json) · [guides/client-setup-cursor.md](guides/client-setup-cursor.md).

### Legacy stdio (air-gap)

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

See [config/cursor.mcp.stdio.json](config/cursor.mcp.stdio.json) and [guides/getting-started.md](guides/getting-started.md).

## Remote MCP OAuth validation (registry gate)

Use as the OAuth + MCP doctor before registry publish or release. After OAuth it **requires** `search_threats` to return at least one Truss product (`id` + `title`). The access token stays **in memory for that process only** unless you pass `--save-token`.

```bash
truss-mcp doctor --remote --strict-claude
# or:
truss-mcp validate-remote https://api.truss-security.com/mcp --strict-claude
# test env:
truss-mcp validate-remote https://api-test.truss-security.com/mcp --strict-claude
```

After token exchange it prints a **Claude connector compatibility checklist** (resource URI, redirects, PKCE S256, issuer match, audience vs MCP resource, `truss_role`), then proves MCP access with real Truss data.

Options:

```bash
truss-mcp validate-remote https://api.truss-security.com/mcp --verbose
truss-mcp validate-remote https://api.truss-security.com/mcp --strict-claude
truss-mcp validate-remote https://api.truss-security.com/mcp --save-token /tmp/truss-mcp-token
truss-mcp validate-remote https://api.truss-security.com/mcp --token-file /tmp/truss-mcp-token
truss-mcp validate-remote https://api.truss-security.com/mcp --port 9877
truss-mcp validate-remote https://api.truss-security.com/mcp --no-open
```

- `--verbose` — HTTP statuses, key headers, truncated bodies (tokens redacted)
- `--strict-claude` — exit `2` if the Claude checklist has WARN/FAIL (even when Truss MCP calls succeed)
- `--save-token PATH` — write the access token for local replay (mode `0600`; delete after debugging)
- `--token-file PATH` — skip browser OAuth; reuse a saved token to re-check MCP access + Truss data

Optional automated test (no browser; uses a saved token):

```bash
TRUSS_RUN_MCP_OAUTH=1 \
TRUSS_MCP_URL=https://api-test.truss-security.com/mcp \
TRUSS_MCP_OAUTH_TOKEN="$(cat /tmp/truss-mcp-token)" \
npm test -- tests/validate-remote-oauth.integration.test.ts
```

Registry metadata: [config/mcp-registry.json](config/mcp-registry.json) · Architecture: [docs/05-hosted-mcp-oauth-architecture.md](docs/05-hosted-mcp-oauth-architecture.md)

## Configuration

Env load order (shell vars win): `~/.config/truss/env` → `~/.truss/.env` → `./.env`

| Variable | Required for | Notes |
|----------|--------------|-------|
| `TRUSS_API_KEY` | local `mcp`, default `search` | From Truss dashboard |
| `TRUSS_MCP_URL` | remote `search` / doctor | Default `https://api.truss-security.com/mcp` |
| `TRUSS_MCP_OAUTH_TOKEN_FILE` | remote `search` | Bearer token from `validate-remote --save-token` |
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

**Reference** — API contract, tools, architecture ([docs/README.md](docs/README.md) — docs 01–05)

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
