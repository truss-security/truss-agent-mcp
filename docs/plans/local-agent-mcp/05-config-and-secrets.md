# Phase 2 — Config and secrets

**Status:** Planning — contract for delivery foundation; no live `config/` swap yet  
**Phase:** 2 ([04-migration-phases](./04-migration-phases))  
**Depends on:** [01-what-is-agent-mcp](./01-what-is-agent-mcp), [02-identity-freeze](./02-identity-freeze)

Agent MCP holds **customer destination secrets** on the machine that runs `serve` / later stdio tools. Truss cloud never stores them. JSON on disk stores **env var names**, never webhook URLs or tokens.

This is the security upgrade versus today’s dashboard / truss-agent export, which embeds `webhookUrl` (and sometimes `discordWebhookUrl` on jobs) in JSON.

## Bundle

Same three files the dashboard already exports, plus `.env`. Path overrides stay compatible with truss-agent and dashboard `.env.example`.

| Artifact | Role | Secrets? |
|----------|------|----------|
| `.env` (see load order below) | `TRUSS_API_KEY`, destination webhooks | Yes |
| `config/agent.json` | Display name | No |
| `config/connections.json` | Named chat destinations, env **refs**, optional query template | No |
| `config/jobs.json` | Schedule, format, `connectionName`, filter/window | No |

| Variable | Default |
|----------|---------|
| `JOBS_FILE` | `config/jobs.json` |
| `CONNECTIONS_FILE` | `config/connections.json` |
| `AGENT_CONFIG_FILE` | `config/agent.json` |

Env load order is existing MCP behavior ([`src/lib/load-dotenv.ts`](../../../src/lib/load-dotenv.ts)):

1. Shell environment (always wins)
2. `~/.config/truss/env`
3. `~/.truss/.env`
4. `./.env` (overrides user files, not shell)

`serve` needs `TRUSS_API_KEY` for **internal pull** ([06](./06-how-intel-is-pulled)). Interactive Server MCP in Cursor stays OAuth ([03](./03-dual-server-host)). Do not make `serve` an OAuth client in Phase 2 — refresh tokens and headless cron do not mix well.

## Env-ref pattern

Each connection field that would have been a secret becomes `*Env`: the **name** of the variable.

**connections.json (target):**

```json
{
  "connections": [
    {
      "name": "discord-alerts",
      "type": "discord",
      "description": "Threat intel channel",
      "enabled": true,
      "webhookUrlEnv": "DISCORD_WEBHOOK_ALERTS",
      "query": {
        "filter": {
          "filterExpression": "category = \"Malware\""
        },
        "windowDays": 1
      }
    }
  ]
}
```

**`.env` (not committed):**

```bash
TRUSS_API_KEY=...
DISCORD_WEBHOOK_ALERTS=https://discord.com/api/webhooks/...
```

Resolution: `process.env[connection.webhookUrlEnv]`. Missing or empty → **fail closed** for that connection (do not POST; log that the env name is unset, never the value).

Phase 2 types: `discord`, `slack`, `ms-teams`. All use `webhookUrlEnv`. Do not add `hecUrlEnv` / SIEM types here ([04](./04-migration-phases) phase 5).

Optional `category: "chat"` may be stored for later registries; not required to run chat.

## Jobs

```json
{
  "formatVersion": 2,
  "jobs": [
    {
      "name": "discord-malware-hourly",
      "connectionName": "discord-alerts",
      "schedule": 60,
      "outputFormat": "metadata",
      "enabled": true,
      "includeIndicators": false,
      "filter": {
        "filterExpression": "category = \"Malware\""
      },
      "windowMinutes": 60
    }
  ]
}
```

| Field | Phase 2 rule |
|-------|----------------|
| `connectionName` | **Required.** No job-level `discordWebhookUrl`. |
| `schedule` | Positive int = interval minutes; string = 5-field cron |
| `enabled` | Job gate **and** `connection.enabled` must both be true to run (dashboard already round-trips job `enabled`; honor it) |
| `outputFormat` | `ioc` \| `metadata` \| `report` (same as dashboard) |
| `includeIndicators` | Default `false`. `ioc` format should set `true` or the job fails closed / no-ops with a clear log |
| `filter` | Preferred source of truth for the pull ([06](./06-how-intel-is-pulled)) |
| `windowDays` / `windowMinutes` | Delivery window; not the investigation default of 7 days |

`agent.json`: `{ "agentName": "…" }` only.

Committed examples (when we add them in implementation) must be secret-free: `webhookUrlEnv` names, placeholder `.env.example` lines, no real URLs.

## What customers have today

Dashboard export and current truss-agent (the connections/jobs product, **not** the older convict/Splunk tree in some local checkouts) use:

- `webhookUrl` inline on each connection (validated HTTPS URL)
- Jobs: `connectionName` **or** legacy `discordWebhookUrl`
- `formatVersion` 1→2 migration already exists on the dashboard (`summary`/`report` label shuffle)

That JSON is **not** safe to commit and is **not** the Agent MCP on-disk format.

## This iteration: hand-written config

Do **not** ship `truss-mcp migrate-agent-config`. Operators copy the example JSON and fill `.env` themselves:

1. Copy `config/connections.example.json` → `config/connections.json` (and jobs/agent examples).
2. Set `webhookUrlEnv` to an env var **name** you choose (e.g. `DISCORD_WEBHOOK_ALERTS`).
3. Put the webhook **value** only in `.env` under that name.
4. `truss-mcp doctor` checks that the named vars are set (not their values).

Automated rewrite of dashboard zips (inline `webhookUrl` → env) is deferred. Dashboard export should eventually emit env-ref JSON + an `.env` template ([08](./08-cloud-served-agent-config.md)).

## Masking and logging

- Extend `maskSecret()` for webhook path tokens (Discord URLs embed a secret in the path).
- Logs and (later) MCP tool output may say env **set** / **unset**, never the value.
- Tool arguments (phase 3) accept connection/job **names** and env **variable names** only.

## Doctor / init (Phase 2 slice)

`truss-mcp doctor` (local, not `--remote`) gains:

- JSON schema check for the three config files
- For each enabled connection: referenced env var is set (boolean only)
- `TRUSS_API_KEY` set if any enabled job exists

`init` can wait until we swap live docs; do not rewrite `env.example` in the package root until implementation, then add commented destination patterns only.

## Out of scope here

- `truss-mcp migrate-agent-config` (this iteration: hand-written `.env` + JSON)
- MCP upsert/list connection tools (phase 3)
- SIEM/EDR env-ref fields (phase 5)
- Changing dashboard export (cross-repo; later it should emit `webhookUrlEnv` + `.env` template)
- Cloud-hosted bundles / Server MCP discovery — [08-cloud-served-agent-config](./08-cloud-served-agent-config.md)
- Rewriting live README / `guides/truss-agent-vs-mcp.md`
