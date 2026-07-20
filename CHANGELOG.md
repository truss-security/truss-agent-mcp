# Changelog

## Unreleased

### Added

- **Remote-first MCP docs and configs** — Cursor/Claude samples use `https://api.truss-security.com/mcp` (OAuth); stdio configs moved to `*.stdio.json`
- **`truss-mcp doctor --remote`** — registry OAuth gate (delegates to `validate-remote`, default prod URL)
- **`config/mcp-registry.json`** — machine-readable remote MCP listing for registries
- **Remote CLI search** — `TRUSS_MCP_OAUTH_TOKEN_FILE` connects `truss-mcp search` to hosted MCP via Streamable HTTP
- **Docs 05/06** — hosted OAuth architecture (canonical API URL) and cross-repo checklist
- **Unified search REPL** — single guided workflow with MCP tools always connected
- **Intent classification** — knowledge, filter build/refine, query, format (JSON/STIX), detection rules, context-only
- **Guided offer prompts** — assistant asks before building filters, querying API, exporting STIX, or generating detection rules
- **Detection rule generation** — prompt-driven Splunk, Falcon, Cortex, Sentinel, and Sigma queries from search results
- **REPL commands** — `stix`, `detect <platform>` for STIX export and SIEM/EDR hunting queries
- **`workflow-state.ts`** and **`classify-workflow-intent.ts`** — session state and hybrid intent routing
- **Color-coded REPL output** — semantic terminal colors via `picocolors` (`terminal-theme.ts`, `repl-output.ts`)
- **Live MCP tool trace** — per-tool blocks with timing and result summaries (`tool-trace.ts`)
- **Structured search results table** — ASCII table before assistant summary (`format-search-results.ts`)
- **REPL command** — `color` / `color on` / `color off` / `color auto`; env `TRUSS_MCP_COLOR`

### Changed

- **Hosted MCP URL** — document `api.truss-security.com/mcp` (not `www.truss-security.com/mcp`)
- **Local stdio** — labeled legacy / air-gap for hosts; remote OAuth is recommended
- **Removed `truss-mcp ask`** and `:ask` / `:search` REPL mode switching — use `truss-mcp search` only
- **Merged ask coaching into search** — FilterQL building, validation, and knowledge answers in one mode
- **Updated MCP host instructions** — same guided workflow for Cursor / Claude Desktop hosts
- **Single conversation history** — no per-mode state split

### Removed

- `truss-mcp ask` CLI command and `truss:ask` npm script
- `:search` and `:ask` REPL commands; `search:` and `ask:` force prefixes

## 1.1.0

### Added

- **`truss-mcp` CLI** — single binary with subcommands: `search`, `ask`, `mcp`, `init`, `doctor`, `version`, `help`
- **Multi-provider LLM support** for `search` / `ask`:
  - `LLM_PROVIDER=anthropic|openai` (default: `anthropic`)
  - `LLM_MODEL` — model id; legacy `ANTHROPIC_MODEL` still honored when provider is Anthropic
  - Priced model catalog in `truss-mcp init`, sorted cheapest-first (input $/1M tokens)
  - Anthropic: Claude Haiku 4.5, Sonnet 4.6, Opus 4.6
  - OpenAI: GPT-4o mini, o4-mini, GPT-4o, o3
- **Interactive `truss-mcp init`** — wizard always prompts for LLM provider and model (priced list); prompts for API keys when missing (hidden input)
- **`truss-mcp doctor`** — validates keys, MCP server binary, Truss API, and LLM API reachability
- **Doctor `.env` inspection** — reports whether keys have real values in `.env` with masked previews (e.g. `sk-…5gAA (108 chars)`); never prints full secrets
- User env file support: `~/.config/truss/env`, `~/.truss/.env`, then `./.env` (shell env always wins)
- REPL spinner (`Thinking...`) and mode-specific prompts (`truss search>`, `truss ask>`)
- `TRUSS_MCP_SERVER_PATH` env var (`TRUSS_ASK_SERVER_PATH` kept as deprecated alias)
- npm `files` expanded: `guides/`, `config/`, `CHANGELOG.md`
- npm scripts for local dev: `truss:init`, `truss:doctor`, `truss:search`, `truss:ask`, `truss:mcp`
- `openai` SDK dependency for OpenAI provider support

### Changed

- **Truss-first prompts** — Truss FilterQL and product search before external/OSINT; full per-field guide with `=`, `!=`, `LIKE` on all 11 attributes
- **`run` REPL command** — from ask mode, switches to search and executes the last confirmed FilterQL automatically
- **Search → ask handoff** — coaching questions in search mode prompt `:ask` and port the question when you switch
- **Prompting UX roadmap** — composable instruction blocks, response format templates, MCP host vs REPL prompt split
- **7-day default search window** — `run`, prompts, and MCP tools default to `days: 7` (was 30 in run helper)
- **Filter confirm gate** — draft vs confirmed filters; `confirm` before `run` executes
- **REPL commands** — `help`, `filter`, `confirm`, `days`, `days 30`, `run 30`, `clear`, `status`; `!` / `search:` / `ask:` force prefixes
- **API quota hints** — disclosed when using windows wider than 7 days (`days 30`, `run 30`, long date ranges)
- **Richer MCP tool descriptions** — validate-first, pagination, STIX, and quota guidance
- **Removed GitHub Actions workflows** — no automated CI, integration, or release runs in the repo; publish manually per `guides/publishing.md`
- **Context-only follow-ups** — search prompts honor "do not query again"; IOC dedupe/format uses thread context without MCP tool calls
- **Documentation refresh** — README, guides, and reference docs updated for current REPL and MCP behavior
- **`search` vs `ask` are now functionally distinct**: `search` connects Truss MCP tools; `ask` is LLM-only and cannot query products
- **REPL mode switching** — `:search` and `:ask` switch modes without exiting (MCP subprocess started/stopped accordingly)
- **Single binary only** — removed `truss-agent-mcp` npm bin; MCP hosts use `truss-mcp mcp` (or `npx -y @truss-security/truss-agent-mcp mcp`)
- CLI binary renamed from `truss` to `truss-mcp` to avoid conflict with `@truss-security/truss-sdk`'s `truss` bin
- MCP server protocol name and SDK `userAgent` updated to `truss-mcp/<version>`
- `search_products_stix` MCP tool returns `{ bundle, objectCount, pagination? }` instead of raw SDK wrapper
- Improved MCP server path resolution and error messages for npm installs vs dev checkouts (`dist/truss-cli.js`)
- `env.example` updated with `LLM_PROVIDER`, `LLM_MODEL`, `OPENAI_API_KEY`
- README and guides document local install (`npm install -g .`) until package is published to npm
- `truss-mcp version` reads version correctly from global installs

### Fixed

- Integration test for `productsStix()` response shape (`bundle` nested under SDK wrapper)
- Smoke test no longer hangs when project `.env` is present during test runs
- `readPackageVersion()` walks up to package root (fixes `0.0.0` on global install)

## 1.0.0

- Initial release: stdio MCP server with 7 FilterQL/STIX tools
- `truss search` / `truss ask` terminal REPL with Claude API integration
