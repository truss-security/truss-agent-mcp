# truss-mcp CLI — terminal REPL

The `truss-mcp` binary provides interactive terminal access with two distinct REPL modes.

## Commands

| Command | Purpose |
|---------|---------|
| `truss-mcp init` | Interactive setup — API keys, LLM provider, model |
| `truss-mcp doctor` | Validate keys and API access |
| `truss-mcp search` | **Live Truss queries** — MCP tools connected |
| `truss-mcp ask` | **General Q&A** — LLM only, no Truss API access |
| `truss-mcp mcp` | stdio MCP server for Cursor / Claude Desktop |
| `truss-mcp help` | Show usage |

## search vs ask

| | **search** | **ask** |
|--|------------|---------|
| Truss MCP subprocess | Started — 7 tools | **Not started** |
| Can search products | Yes | **No** |
| Use when | "Find ransomware from last 7 days" | "What is FilterQL?" / "How do I filter by feed?" |

`ask` cannot query Truss products. If you ask for live data in `ask` mode, the assistant will tell you to type `:search`.

## Switching modes in the REPL

Start with either command; switch without exiting:

```
truss ask> Explain FilterQL AND operators
truss ask> :search
truss search> Search Truss for ransomware in the last 14 days
truss search> :ask
truss ask> exit
```

| REPL command | Action |
|--------------|--------|
| `:search` | Connect MCP tools — enable live Truss queries |
| `:ask` | Disconnect MCP tools — general assistant only |
| `exit` / `quit` / `:q` | Leave the REPL |

Each mode keeps its own conversation history when you switch back.

## Prerequisites

- Node.js 18+
- `TRUSS_API_KEY` — required for **search** mode (and `truss-mcp mcp`)
- LLM API key — `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` per `LLM_PROVIDER`

## Quick start

```bash
npm install -g .
truss-mcp init
truss-mcp doctor
truss-mcp search
```

From source: `npm run truss:search`, `npm run truss:ask`

## Environment

See [env.example](../env.example). Key variables: `LLM_PROVIDER`, `LLM_MODEL`, provider API keys.

## Related

- [getting-started.md](./getting-started.md) — MCP host setup
- [mcp-acceptance.md](./mcp-acceptance.md) — verify MCP tools in a host
