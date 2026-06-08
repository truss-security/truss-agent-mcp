export function printHelp(): void {
  console.log(`Truss MCP CLI — Claude + Truss threat intelligence

Usage:
  truss-mcp                 Show this help
  truss-mcp help          Show this help
  truss-mcp version       Print version
  truss-mcp init          Interactive setup — create .env and prompt for API keys
  truss-mcp doctor        Validate keys, server binary, and API access
  truss-mcp search        Interactive threat-intel search REPL
  truss-mcp ask           Interactive general assistant REPL
  truss-mcp mcp           Run stdio MCP server (for advanced use)

Examples:
  truss-mcp init
  truss-mcp doctor
  truss-mcp search
  truss-mcp ask

MCP hosts (Cursor, Claude Desktop):
  command: truss-mcp
  args:    mcp
  or:      npx -y @truss-security/truss-agent-mcp mcp

Environment (also loaded from ~/.config/truss/env and ./.env):
  TRUSS_API_KEY          Required — Truss API key
  LLM_PROVIDER           anthropic | openai (default: anthropic)
  LLM_MODEL              Model id — run truss-mcp init to pick from priced list
  ANTHROPIC_API_KEY      Required when LLM_PROVIDER=anthropic
  OPENAI_API_KEY         Required when LLM_PROVIDER=openai
  TRUSS_API_URL          Optional — default: https://api.truss-security.com
  TRUSS_MCP_SERVER_PATH  Optional — path to MCP server binary
  TRUSS_ASK_SERVER_PATH  Deprecated alias for TRUSS_MCP_SERVER_PATH
  TRUSS_MCP_MAX_LIMIT    Optional — default: 50
  TRUSS_MCP_MAX_PAGES    Optional — default: 3
  TRUSS_MCP_DEBOUNCE_MS  Optional — default: 200

Note: @truss-security/truss-sdk publishes a separate "truss" binary.
This package uses "truss-mcp" to avoid global install conflicts.
`);
}
