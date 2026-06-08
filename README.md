# truss-agent-mcp

Official [Model Context Protocol](https://modelcontextprotocol.io) server for querying Truss threat intelligence — all via the **`truss-mcp`** binary.

Uses the public Truss API tier: `POST /product/search` and STIX routes with **FilterQL**.

## Install

> **Not on npm yet.** Until `@truss-security/truss-agent-mcp` is published, install from this repo (below). After publish: `npm install -g @truss-security/truss-agent-mcp`.

**From this repo (works today):**

```bash
cd truss-agent-mcp
npm install
npm run build
npm install -g .          # puts truss-mcp on your PATH
truss-mcp init
truss-mcp doctor
```

Without global install, use npm scripts: `npm run truss:init`, `npm run truss:search`, etc.

| Method | Command |
|--------|---------|
| **Global (local)** | `npm install -g .` (from repo root, after `npm run build`) |
| **Global (npm)** | `npm install -g @truss-security/truss-agent-mcp` *(after publish)* |
| **One-shot MCP** | `npx -y @truss-security/truss-agent-mcp mcp` *(after publish)* |
| **One-shot CLI** | `npx -y @truss-security/truss-agent-mcp search` *(after publish)* |

Requires Node.js 18+. Single binary: **`truss-mcp`** (avoids conflict with `@truss-security/truss-sdk`'s `truss` bin).

## Commands

| Command | Purpose |
|---------|---------|
| `truss-mcp mcp` | stdio MCP server (Cursor, Claude Desktop, VS Code) |
| `truss-mcp search` | Threat-intel REPL with Claude |
| `truss-mcp ask` | General assistant REPL with Claude |
| `truss-mcp init` | Create `.env` from template |
| `truss-mcp doctor` | Validate keys and API access |
| `truss-mcp version` | Print version |
| `truss-mcp help` | Show usage |

## First-time setup

**After global install** (`npm install -g .` from repo, or from npm after publish):

```bash
truss-mcp init          # prompts for TRUSS_API_KEY and ANTHROPIC_API_KEY
truss-mcp doctor
```

**From a cloned repo** (local `npm install` does not put `truss-mcp` on your PATH):

```bash
npm install && npm run build
npm run truss:init
npm run truss:doctor
```

To use `truss-mcp` on your PATH from source: `npm install -g .` or `npm link`.

Env files are loaded from (shell variables always win):

1. `~/.config/truss/env` or `~/.truss/.env` (user)
2. `./.env` in the current directory (project)

---

## Examples

### `truss-mcp search`

```bash
truss-mcp search
```

```
Truss Search — threat intelligence retrieval
Model: claude-sonnet-4-6 | Tools: 7

truss search> Search for malware reports from the last 7 days
truss search> exit
```

### `truss-mcp ask`

```bash
truss-mcp ask
```

### MCP host — Cursor or Claude Desktop

Only `TRUSS_API_KEY` required — the host provides the LLM.

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "npx",
      "args": ["-y", "@truss-security/truss-agent-mcp", "mcp"],
      "env": {
        "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY",
        "TRUSS_API_URL": "https://api.truss-security.com"
      }
    }
  }
}
```

Global install:

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": { "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY" }
    }
  }
}
```

See [config/cursor.mcp.json](./config/cursor.mcp.json) and [guides/getting-started.md](./guides/getting-started.md).

---

## Environment variables

| Variable | CLI | MCP (`mcp`) | Default |
|----------|-----|-------------|---------|
| `TRUSS_API_KEY` | required | required | — |
| `LLM_PROVIDER` | optional | — | `anthropic` |
| `LLM_MODEL` | optional | — | cheapest model for provider |
| `ANTHROPIC_API_KEY` | when provider=anthropic | — | — |
| `OPENAI_API_KEY` | when provider=openai | — | — |
| `TRUSS_API_URL` | optional | optional | `https://api.truss-security.com` |
| `TRUSS_MCP_SERVER_PATH` | optional | — | auto `dist/truss-cli.js` |
| `TRUSS_MCP_MAX_LIMIT` | optional | optional | `50` |
| `TRUSS_MCP_MAX_PAGES` | optional | optional | `3` |

Full list: [env.example](./env.example). CLI guide: [guides/truss-cli.md](./guides/truss-cli.md).

## Documentation

| | |
|--|--|
| [docs/](./docs/) | Architecture, API contract, tool catalog |
| [guides/](./guides/) | Getting started, client setup, FilterQL cookbook |
| [guides/truss-cli.md](./guides/truss-cli.md) | Terminal CLI reference |
| [CHANGELOG.md](./CHANGELOG.md) | Release notes |

## Development

```bash
npm install
npm run build
npm run truss:init
npm run truss:doctor
TRUSS_API_KEY=... npm run dev              # truss-mcp mcp (stdio)
TRUSS_API_KEY=... ANTHROPIC_API_KEY=... npm run truss:search
npm test
```

## Publish

```bash
npm test
npm publish --access public
```

Tag `v1.x.x` to trigger the [release workflow](./.github/workflows/release.yml) (requires `NPM_TOKEN` secret).

## Related projects

- [@truss-security/truss-sdk](https://www.npmjs.com/package/@truss-security/truss-sdk) — TypeScript API client
- [truss-agent](https://github.com/truss-security/truss-agent) — Scheduled pull → chat webhooks
- [Truss docs](https://truss-security.github.io/truss-docs/data/sdk)

## License

MIT
