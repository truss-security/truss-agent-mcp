# Dual-server host setup (target)

**Status:** Planning — do not replace `config/*.json` yet  
**Depends on:** [01-what-is-agent-mcp](./01-what-is-agent-mcp), [02-identity-freeze](./02-identity-freeze)

The MCP host (Cursor, Claude Desktop, custom agent) should attach **two** servers. One product per process.

```
MCP host
    │
    ├─► truss          Server MCP     investigation
    │                  https://api.truss-security.com/mcp
    │                  OAuth (or x-api-key)
    │
    └─► truss-agent    Agent MCP      local destinations
                       command: truss-mcp mcp
                       Discord / SIEM / … secrets in local env
```

Today’s samples are **one** server named `truss-mcp` pointing at either the hosted URL **or** local stdio search. That naming collapses two products. Leave those files; this doc is the replacement picture.

## Investigation vs Agent

| | **truss** (Server MCP) | **truss-agent** (this package) |
|--|------------------------|--------------------------------|
| Transport | Remote Streamable HTTP | Local stdio |
| Auth | OAuth or `x-api-key` | Destination secrets in env; Truss API key only for later *internal* job pull |
| Tools (target) | `lookup_ioc`, `search_threats`, `get_product`, STIX | connections, jobs, push — **not** a search catalog |
| Who owns it | truss-api | this repo |

If the host only needs intel, it only needs Server MCP. Agent MCP is for customers who will push into **their** systems.

Stdio-only host + investigation (no Agent): bridge to the hosted URL (`mcp-remote` or equivalent). Do not tell those users to run `truss-mcp mcp` as a search proxy.

## Cursor (target)

Not applied to [`config/cursor.mcp.json`](../../../config/cursor.mcp.json) until a later phase.

```json
{
  "mcpServers": {
    "truss": {
      "url": "https://api.truss-security.com/mcp"
    },
    "truss-agent": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": {
        "DISCORD_WEBHOOK_ALERTS": "${DISCORD_WEBHOOK_ALERTS}"
      }
    }
  }
}
```

Notes:

- Server MCP has **no** API key in config when using OAuth. User completes dashboard consent.
- Agent `env` holds **destination** refs (and later `TRUSS_API_KEY` only if `serve` / job pull runs in this process). Do not put Truss keys in tool arguments.
- Until Agent tools exist, `truss-agent` in this shape would still expose today’s search tools. That is why `config/` is not updated in Phase 1.

## Claude Desktop (target)

Claude often needs a command-based entry. Investigation stays a **bridge to Server MCP**, not this package’s search implementation:

```json
{
  "mcpServers": {
    "truss": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.truss-security.com/mcp"
      ]
    },
    "truss-agent": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": {
        "DISCORD_WEBHOOK_ALERTS": "YOUR_WEBHOOK"
      }
    }
  }
}
```

API-key automation against Server MCP uses `x-api-key` on the **hosted** URL (as public truss-docs already describe), not a second FilterQL server in this repo.

## Operator workflow (target)

1. Ask **truss** (Server MCP) to search / look up an IOC / fetch STIX.
2. Review results in the host (IOC-safe unless they asked otherwise).
3. Ask **truss-agent** to push to a named connection or to save a job.
4. Headless delivery later: `truss-mcp serve` on the same machine/config — no LLM.

Do not instruct the model to call Agent search tools to “explore Truss.” That path is deprecated in this plan.

## REPL (`truss-mcp search`)

Target: default to **remote Server MCP** tools (already supported via OAuth token file). Local stdio search in the REPL is the same duplicate catalog; sunset with the fetch tools.

Phase 1 does not change REPL defaults.

## Dashboard / public docs (later, other repos)

When we swap live copy:

- “Connect Truss MCP” / OAuth consent = **Server MCP**
- “Install Truss Agent” = this package, local, dual-server snippet above
- Do not name the hosted URL “Agent MCP”
