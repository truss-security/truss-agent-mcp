# Phase 3 slice — `run_job_now`

**Status:** Implemented on local stdio (`truss-mcp mcp`)  
**Depends on:** [07-chat-and-serve](./07-chat-and-serve.md)

Same Discord one-shot as `truss-mcp run-job`, exposed as an MCP tool so Cursor/Claude can trigger it. No Slack/Teams. No upsert tools. No new search catalog.

## Tool

| Tool | Args | Behavior |
|------|------|----------|
| `run_job_now` | `jobName` (string only) | Load `config/jobs.json`, run that job once (search + Discord). Never accept webhook URLs or tokens. |

Returns JSON: `ok`, `jobName`, `pushed`, `productCount`, `skipReason`, `error`, `logs`. Empty search → `pushed: false`, not an exception. Does not write to stdout (stdio MCP).

## Host setup

Stdio server already runs `loadAllEnv()`, so project `.env` is used when the host cwd is this repo. Host `env` still wins.

Cursor (do not replace `config/cursor.mcp.stdio.json` yet — add dest env in the host UI or a local override):

```json
{
  "mcpServers": {
    "truss-agent": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": {
        "TRUSS_API_KEY": "YOUR_KEY",
        "DISCORD_WEBHOOK_ALERTS": "YOUR_WEBHOOK"
      }
    }
  }
}
```

Prefer two servers when investigating: hosted `truss` + this `truss-agent` ([03](./03-dual-server-host.md)).

## Ask the host

“Run the local job `discord-malware-hourly`” → `run_job_now` with that name.

Rebuild (`npm run build`) and restart MCP in Cursor after pulling this tool.
