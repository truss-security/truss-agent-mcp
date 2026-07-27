export function printHelp(): void {
  console.log(`truss-mcp — Truss threat intelligence + LLM assistant

Commands
  truss-mcp search     Guided Truss search REPL (hosted MCP by default)
  truss-mcp mcp        Local stdio MCP server (legacy / air-gap)
  truss-mcp init       Interactive setup (OAuth token path + LLM)
  truss-mcp doctor     Validate local keys and REST (legacy)
  truss-mcp doctor --remote [--strict-oauth] [--url URL]
                       Hosted OAuth doctor (same as validate-remote; registry gate)
  truss-mcp validate-remote [url]
                       OAuth + MCP doctor (default URL: api.truss-security.com/mcp)
                       Options: --verbose  --strict-oauth  --save-token PATH
                                --token-file PATH  --no-open  --port 9876  --url URL
  truss-mcp help       This help

Guided workflow
  Knowledge → shape search → confirm → run → STIX / detection rules (LLM extras)
  Same five hosted tools as Cursor, Claude Desktop, and other OAuth MCP hosts.

Remote search (default — OAuth parity with Cursor)
  truss-mcp doctor --remote --save-token /tmp/truss-mcp-token
  # set TRUSS_MCP_OAUTH_TOKEN_FILE=/tmp/truss-mcp-token in .env
  truss-mcp search

Legacy stdio
  TRUSS_MCP_TRANSPORT=stdio TRUSS_API_KEY=… truss-mcp search

REPL commands (run run 30 days filter confirm stix detect color help clear status exit)
  Color-coded output: You / MCP / Results / Truss blocks (color off to disable)
  Wider windows (days 30, run 30) may use more API quota

Docs: README.md · guides/truss-cli.md · docs/05-hosted-mcp-oauth-architecture.md
`);
}
