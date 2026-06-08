export function printHelp(): void {
  console.log(`truss-mcp — Truss threat intelligence + LLM assistant

Commands
  truss-mcp search     Live Truss queries (MCP tools)
  truss-mcp ask        FilterQL coaching (no live queries)
  truss-mcp mcp        stdio MCP server (Cursor / Claude Desktop)
  truss-mcp init       Interactive setup
  truss-mcp doctor     Validate keys and API access
  truss-mcp help       This help

search vs ask
  search   Run FilterQL, STIX, IOC follow-ups on prior results
  ask      Build filters — then type run to execute (default 7 days)

REPL commands (:search :ask run run 30 days filter confirm help clear status exit)
  Coaching in search → :ask (question carries over)
  After filter confirm in ask → run
  Wider windows (days 30, run 30) may use more API quota

Docs: README.md · guides/truss-cli.md · guides/getting-started.md
`);
}
