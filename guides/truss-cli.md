# Terminal REPL (`truss-mcp search` / `ask`)

Interactive assistant with two modes. One binary, switch modes without exiting.

## Commands

| Command | Purpose |
|---------|---------|
| `truss-mcp init` | API keys, LLM provider, model |
| `truss-mcp doctor` | Validate configuration |
| `truss-mcp search` | Live Truss queries (MCP tools on) |
| `truss-mcp ask` | FilterQL coaching (no Truss API) |
| `truss-mcp mcp` | stdio server for MCP hosts |
| `truss-mcp help` | Usage |

**Prerequisites:** `TRUSS_API_KEY` for search; LLM key per `LLM_PROVIDER` for search and ask.

## search vs ask

| | search | ask |
|--|--------|-----|
| MCP tools | 7 Truss tools | None |
| Queries products | Yes | No — use `run` after confirming a filter |
| Use when | Live retrieval, STIX, IOC follow-ups | Build filters, explain syntax, alias research |

Both modes are Truss-first: FilterQL on `tags`, `category`, `source`, and nine other attributes. External/OSINT only after the Truss path.

## Typical workflow

```
truss search> Make a filter for Sandworm
# → prompts :ask; your question carries over

truss search> :ask
truss ask> 2                    # confirm comprehensive aliases
truss ask> run                  # live search, default 7 days

truss search> Don't query again — dedupe the IOCs from your last reply
# → uses conversation context only, no API call
```

## REPL commands

| Input | Action |
|-------|--------|
| `:search` | Enable MCP tools |
| `:ask` | Coaching mode; disconnect MCP tools |
| `run` | Execute confirmed filter (default 7 days) |
| `run 30` | Execute with 30-day window |
| `run start:2026-06-01 end:2026-06-08` | Execute with explicit range |
| `days` | Show current date window |
| `days 30` | Set rolling window (does not run search) |
| `filter` | Show draft / confirmed filter and window |
| `confirm` | Lock draft filter for `run` |
| `help` | Command list |
| `clear` | Reset conversation and filters (current mode) |
| `status` | Mode, model, pending state |
| `exit` / `quit` / `:q` | Leave REPL |

**Force prefixes:** `search: …` or `!…` bypass ask handoff; `ask: …` forces ask routing.

Each mode keeps its own conversation history.

## Filters and date windows

1. In **ask**, the assistant drafts FilterQL and asks you to confirm (often options 1/2).
2. Type **`confirm`** or reply with your choice → filter is locked.
3. Type **`run`** → switches to search and executes.

- **Default window:** last 7 days
- **Custom:** `days 30` then `run`, or `run 30`, or mention "last 30 days" when confirming
- **Quota:** windows wider than 7 days may use more Truss API quota

FilterQL examples: [filterql-cookbook.md](./filterql-cookbook.md)

## Follow-ups without re-querying

In **search**, ask to extract, dedupe, group, or reformat IOCs from prior results. If you say **do not query Truss again**, the assistant uses thread context only — no MCP tool calls.

For a **new** search that needs full IOC values, the model should use `include_indicators: true` on `search_products`.

## Environment

See [env.example](../env.example). Set via `truss-mcp init` or edit `.env`.

Load order: `~/.config/truss/env` → `~/.truss/.env` → `./.env` (shell overrides).

## See also

- [getting-started.md](./getting-started.md) — MCP host setup
- [filterql-cookbook.md](./filterql-cookbook.md) — intent → FilterQL
- [mcp-acceptance.md](./mcp-acceptance.md) — verify tools in a host
