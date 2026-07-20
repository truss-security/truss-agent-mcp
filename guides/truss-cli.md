# Terminal REPL (`truss-mcp search`)

Interactive assistant that acts like an embedded Cursor/Claude host: connects to **hosted MCP** (five tools), then uses your LLM for coaching and post-processing. The assistant asks before querying Truss.

## Commands

| Command | Purpose |
|---------|---------|
| `truss-mcp init` | OAuth token path / legacy key, LLM provider, model |
| `truss-mcp doctor` | Validate local keys / REST (legacy) |
| `truss-mcp doctor --remote` | Hosted OAuth doctor (registry gate) |
| `truss-mcp validate-remote [url]` | Same as doctor --remote |
| `truss-mcp search` | Guided Truss search REPL (MCP tools on) |
| `truss-mcp mcp` | Local stdio server (legacy / air-gap) |
| `truss-mcp help` | Usage |

**Prerequisites (remote OAuth — default):** Growth+ account, LLM key, and a Bearer token file:

```bash
truss-mcp doctor --remote --save-token /tmp/truss-mcp-token
# set TRUSS_MCP_OAUTH_TOKEN_FILE=/tmp/truss-mcp-token in .env
truss-mcp search
```

**Prerequisites (legacy stdio):** `TRUSS_MCP_TRANSPORT=stdio`, `TRUSS_API_KEY`, and LLM key per `LLM_PROVIDER`.

Optional: `TRUSS_MCP_URL` (default `https://api.truss-security.com/mcp`), `TRUSS_MCP_TRANSPORT=remote|stdio`.

Remote search uses the **hosted** five-tool catalog (`lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`). Local stdio uses the seven FilterQL tools.

## Guided workflow

The assistant classifies each turn and offers next steps:

| Intent | Behavior |
|--------|----------|
| Knowledge | Answer Truss/cyber context without API calls; offer to build a search |
| Search build/refine | Draft intent (remote) or FilterQL (stdio); offer refine and query |
| Query execute | `run` or explicit consent → Truss MCP tools |
| Format output | JSON summary or `stix` for STIX bundle |
| Detection rules | `detect <platform>` — Splunk, Falcon, Cortex, Sentinel, Sigma (LLM only) |
| Context-only | Process prior results (IOC dedupe, reformat) without re-querying |

Truss-first: use hosted tools (or FilterQL on stdio). External/OSINT only after the Truss path.

## Typical workflow

```
truss search> What is Sandworm?
# → knowledge answer; offers to build a filter

truss search> yes
# → drafts FilterQL, validates, offers refine + query

truss search> confirm
truss search> run                  # live search, default 7 days

truss search> stix                 # STIX export
truss search> detect splunk        # Splunk SPL from IOCs in results

truss search> Don't query again — dedupe the IOCs from your last reply
# → uses conversation context only, no API call
```

## REPL commands

| Input | Action |
|-------|--------|
| `run` | Execute confirmed filter (default 7 days) |
| `run 30` | Execute with 30-day window |
| `run start:2026-06-01 end:2026-06-08` | Execute with explicit range |
| `days` | Show current date window |
| `days 30` | Set rolling window (does not run search) |
| `filter` | Show draft / confirmed filter and window |
| `confirm` | Lock draft filter for `run` |
| `stix` | Export results or confirmed filter as STIX |
| `detect <platform>` | Generate detection queries (e.g. `detect falcon`) |
| `color` | Show color setting (`color on`, `color off`, `color auto`) |
| `help` | Command list |
| `clear` | Reset conversation and filters |
| `status` | Model, tools, workflow state |
| `exit` / `quit` / `:q` | Leave REPL |

**Force prefix:** `!…` forces query execution intent on the next message.

One conversation history for the entire session.

## Terminal display

Each turn is split into ASCII-bordered sections with semantic colors (TTY only):

| Section | Content |
|---------|---------|
| `--- You ---` | Your message |
| `--- MCP · tool ---` | Live tool trace: `→ search_products`, args, `✓ 12 matches · 847ms` |
| `--- Results ---` | Structured product table (before assistant prose) |
| `--- Truss ---` | Assistant reply; offers in yellow, FilterQL in magenta |

Disable colors: `color off`, `NO_COLOR=1`, or `TRUSS_MCP_COLOR=never` in `.env`.

## Filters and date windows

1. Ask a knowledge or filter-building question; the assistant drafts FilterQL and asks you to confirm (often options 1/2).
2. Type **`confirm`** or reply with your choice → filter is locked.
3. Type **`run`** → executes against Truss API.

- **Default window:** last 7 days
- **Custom:** `days 30` then `run`, or `run 30`, or mention "last 30 days" when confirming
- **Quota:** windows wider than 7 days may use more Truss API quota

FilterQL examples: [filterql-cookbook.md](./filterql-cookbook.md)

## Follow-ups without re-querying

Ask to extract, dedupe, group, or reformat IOCs from prior results. If you say **do not query Truss again**, the assistant uses thread context only — no MCP tool calls.

For a **new** search that needs full IOC values, the model should use `include_indicators: true` on `search_products`.

## Environment

See [env.example](../env.example). Set via `truss-mcp init` or edit `.env`.

Load order: `~/.config/truss/env` → `~/.truss/.env` → `./.env` (shell overrides).

## See also

- [getting-started.md](./getting-started.md) — MCP host setup
- [filterql-cookbook.md](./filterql-cookbook.md) — intent → FilterQL
- [mcp-acceptance.md](./mcp-acceptance.md) — verify tools in a host
