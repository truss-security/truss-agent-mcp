export function printHelp(): void {
  console.log(`truss-mcp — Truss threat intelligence + LLM assistant

Commands
  truss-mcp search     Guided Truss search REPL (MCP tools always on)
  truss-mcp mcp        Local stdio MCP server (legacy / air-gap)
  truss-mcp init       Interactive setup
  truss-mcp doctor     Validate local keys and REST access
  truss-mcp doctor --remote [--strict-claude] [--url URL]
                       Hosted OAuth doctor (same as validate-remote; registry gate)
  truss-mcp validate-remote [url]
                       OAuth + MCP doctor (default URL: api.truss-security.com/mcp)
                       Options: --verbose  --strict-claude  --save-token PATH
                                --token-file PATH  --no-open  --port 9876  --url URL
  truss-mcp help       This help

Guided workflow
  Knowledge → build filter → confirm → run → STIX / detection rules
  The assistant asks before querying Truss API or exporting results.

Remote search (OAuth parity with Cursor)
  truss-mcp validate-remote --save-token /tmp/truss-mcp-token
  TRUSS_MCP_OAUTH_TOKEN_FILE=/tmp/truss-mcp-token truss-mcp search

REPL commands (run run 30 days filter confirm stix detect color help clear status exit)
  Color-coded output: You / MCP / Results / Truss blocks (color off to disable)
  Wider windows (days 30, run 30) may use more API quota

Docs: README.md · guides/truss-cli.md · docs/05-hosted-mcp-oauth-architecture.md
`);
}
