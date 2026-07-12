export function printHelp(): void {
  console.log(`truss-mcp — Truss threat intelligence + LLM assistant

Commands
  truss-mcp search     Guided Truss search REPL (MCP tools always on)
  truss-mcp mcp        stdio MCP server (Cursor / Claude Desktop)
  truss-mcp init       Interactive setup
  truss-mcp doctor     Validate keys and API access
  truss-mcp validate-remote <url>
                       Validate a remote MCP OAuth server
  truss-mcp help       This help

Guided workflow
  Knowledge → build filter → confirm → run → STIX / detection rules
  The assistant asks before querying Truss API or exporting results.

REPL commands (run run 30 days filter confirm stix detect color help clear status exit)
  Color-coded output: You / MCP / Results / Truss blocks (color off to disable)
  Wider windows (days 30, run 30) may use more API quota

Docs: README.md · guides/truss-cli.md · guides/getting-started.md
`);
}
