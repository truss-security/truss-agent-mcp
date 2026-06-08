export function printHelp(): void {
  console.log(`Truss MCP CLI — threat intelligence + LLM assistant

Usage:
  truss-mcp help          Show this help
  truss-mcp version       Print version
  truss-mcp init          Interactive setup — API keys, LLM provider, model
  truss-mcp doctor        Validate keys, server binary, and API access
  truss-mcp search        REPL for live Truss queries (MCP tools)
  truss-mcp ask           REPL for general Q&A (no live Truss queries)
  truss-mcp mcp           Run stdio MCP server (for Cursor / Claude Desktop)

search vs ask
  search  Connects to Truss MCP tools — search products, STIX, FilterQL validation.
          Use for: "find ransomware reports from the last 7 days"
  ask     LLM only — explains FilterQL, CTI concepts, how to refine questions.
          Cannot query Truss. Use for: "what fields can I filter on?"
          To search live data, type :search inside the REPL (or start with truss-mcp search).

Inside search or ask REPL:
  :search   Switch to search mode (enables Truss MCP tools)
  :ask      Switch to ask mode (disables Truss MCP tools)
  exit      Leave the REPL (also: quit, :q)

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
