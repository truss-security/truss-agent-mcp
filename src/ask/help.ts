export function printHelp(): void {
  console.log(`Truss MCP CLI — threat intelligence + LLM assistant

Usage:
  truss-mcp help          Show this help
  truss-mcp version       Print version
  truss-mcp init          Interactive setup — API keys, LLM provider, model
  truss-mcp doctor        Validate keys, server binary, and API access
  truss-mcp search        REPL for live Truss queries (MCP tools)
  truss-mcp ask           REPL for FilterQL coaching (no live Truss queries)
  truss-mcp mcp           Run stdio MCP server (for Cursor / Claude Desktop)

Truss-first
  Answers prioritize Truss FilterQL (=, !=, LIKE) and Truss product search.
  External/OSINT is mentioned only after the Truss path or when you ask for it.

search vs ask
  search  Live Truss MCP tools — run FilterQL against Truss products and STIX.
          Coaching questions (build a filter, explain syntax) → type :ask (question carries over).
  ask     Truss FilterQL coaching only — no live queries. Type run to execute (default 7 days).

Inside search or ask REPL:
  :search   Switch to search mode (enables Truss MCP tools)
  :ask      Switch to ask mode (FilterQL coaching only)
  run       Switch to search and run the last confirmed FilterQL (default 7 days)
  run 30    Execute with a 30-day window (may use more API quota)
  days 30   Set rolling window without running (may use more API quota)
  filter    Show draft/confirmed filters and current window
  confirm   Lock draft filter for run
  help      Show REPL commands
  clear     Reset conversation for current mode
  status    Show mode, model, and pending state
  exit      Leave the REPL (also: quit, :q)

API quota
  Default searches use a 7-day window. days 30, run 30, and long date ranges may
  consume additional Truss API quota — plan accordingly.

Examples:
  truss-mcp init
  truss-mcp doctor
  truss-mcp search
  truss-mcp ask

MCP hosts (Cursor, Claude Desktop):
  command: truss-mcp
  args:    mcp

Environment (also loaded from ~/.config/truss/env and ./.env):
  TRUSS_API_KEY          Required for search mode and truss-mcp mcp
  LLM_PROVIDER           anthropic | openai (default: anthropic)
  LLM_MODEL              Model id — run truss-mcp init to pick from priced list
  ANTHROPIC_API_KEY      Required when LLM_PROVIDER=anthropic
  OPENAI_API_KEY         Required when LLM_PROVIDER=openai
  TRUSS_API_URL          Optional — default: https://api.truss-security.com
  TRUSS_MCP_SERVER_PATH  Optional — path to MCP server binary

Note: @truss-security/truss-sdk publishes a separate "truss" binary.
This package uses "truss-mcp" to avoid global install conflicts.
`);
}
