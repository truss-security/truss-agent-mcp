export function printHelp(): void {
  console.log(`Truss CLI — Claude + Truss threat intelligence

Usage:
  truss                 Show this help
  truss help            Show this help
  truss search          Interactive Truss threat-intel search REPL
  truss ask             Interactive general assistant REPL

Examples:
  truss search
  truss ask

Environment:
  TRUSS_API_KEY         Required — Truss API key
  ANTHROPIC_API_KEY     Required — Anthropic API key
  ANTHROPIC_MODEL       Optional — default: claude-sonnet-4-6
  TRUSS_API_URL         Optional — default: https://api.truss-security.com
  TRUSS_ASK_SERVER_PATH Optional — path to truss-agent-mcp server binary
  TRUSS_MCP_MAX_LIMIT   Optional — default: 50
  TRUSS_MCP_MAX_PAGES   Optional — default: 3
  TRUSS_MCP_DEBOUNCE_MS Optional — default: 200

Note: @truss-security/truss-sdk also publishes a "truss" binary.
Installing both packages globally may cause a bin name conflict.
`);
}
