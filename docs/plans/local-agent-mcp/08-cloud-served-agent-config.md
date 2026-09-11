# Future — Cloud-served agent config

**Status:** Future update — not in phases 1–6  
**Depends on:** [01-what-is-agent-mcp](./01-what-is-agent-mcp.md), [05-config-and-secrets](./05-config-and-secrets.md), [03-dual-server-host](./03-dual-server-host.md)

Truss can store **your** Agent connector/job definitions on the API and let Server MCP **discover** them. Secrets and destination POST still run only on the laptop.

This does **not** put Discord/SIEM credentials in Truss cloud. It does **not** add `push_to_discord` to hosted `/mcp`.

---

## Why

Operators will want one place to edit filters and destinations (dashboard), then run the same bundle on a SOC host without copying JSON by hand. Claude should be able to ask “what connectors do I have?” using the same OAuth identity as investigation — without Truss ever seeing the webhook.

Local files + `.env` remain the Phase 2 source of truth. Cloud catalog is an optional control plane **after** env-ref configs are real in dashboard export (no inline `webhookUrl`).

---

## Split (unchanged)

| On Truss API / dashboard | Stay on the laptop (`.env` / host env) |
|--------------------------|----------------------------------------|
| Connection **names** and types (`discord`, later SIEM types) | Webhook URLs, HEC tokens, SIEM/EDR keys |
| `webhookUrlEnv: "DISCORD_WEBHOOK_ALERTS"` (the **name** only) | The value of that variable |
| Job schedule, FilterQL, window, `outputFormat`, enabled | Ability to POST to Discord |
| Agent display name; which profiles belong to this user | |

Env **names** are a contract (“this job needs `DISCORD_WEBHOOK_ALERTS` locally”), not secrets. Env **values** never sync to Truss.

If the API stored `webhookUrl`, Truss would become a vault of customer destinations — the same failure as hosting Agent push on `/mcp`.

---

## Server MCP: discover only

Hosted `/mcp` stays investigation-first. A **narrow** extra surface, same OAuth (or API key) user as today’s Server MCP, returns **only that user’s** secret-free rows:

| Tool (illustrative) | Returns |
|---------------------|---------|
| `list_my_agent_profiles` | Profile ids / names the caller owns |
| `get_my_agent_bundle` | `agent` + connections + jobs; `*Env` names only |
| `get_my_agent_env_template` | Commented `.env` lines (`# DISCORD_WEBHOOK_ALERTS=`), never values |

Eligibility can match MCP today (Growth+; Community denied).

Claude with **only** Server MCP can list connectors and see which env vars are required. It **cannot** post to Discord. That requires local Agent MCP / `serve`, where `.env` exists.

**Do not** add destination push tools on Server MCP even if the cloud knows the connection name. No webhook on the server, and storing one to make push work would break the split.

**Writes:** prefer the **dashboard** as editor. `upsert_my_agent_bundle` from Claude is possible later but easy to get wrong (overwrites, injected jobs). Start **read / discover** only.

---

## Local Agent: pull, then bind secrets

```
Dashboard (edit)  →  Truss API (secret-free bundle, per user)
                         │
                         │  OAuth or API key
                         ▼
                   truss-mcp sync  /  serve --pull
                         │
                         ├─ cache connections.json + jobs.json
                         ├─ .env still local; fail closed if a *Env name is unset
                         └─ run-job / serve / (phase 3) MCP push tools
```

Runtime stays local:

1. Pull **your** bundle.
2. Resolve `webhookUrlEnv` from process env.
3. Search Truss (API key) and POST to the destination from this machine.

`truss-mcp doctor` already fits: “bundle says `DISCORD_WEBHOOK_ALERTS` — is it set?” without calling Discord.

Optional dashboard UX: show “required env: `DISCORD_WEBHOOK_ALERTS`” and never a paste box for the webhook (or a local-only helper).

---

## Two-server host (same as [03](./03-dual-server-host.md))

```
Cursor / Claude
  ├─ Server MCP     search intel + “what are MY agent configs?”
  └─ Agent MCP      “push using discord-alerts” / serve
                    secrets only in local env
```

Example: Server MCP `get_my_agent_bundle` → model sees job `discord-malware-hourly` → Agent MCP `run_job_now` (phase 3) with the **name**. The webhook never crosses Truss or the chat transcript.

---

## What already exists (do not confuse)

| Today | Relation to this doc |
|-------|----------------------|
| Dashboard connections/jobs **export zip** | Editor + file bundle; still often embeds `webhookUrl` |
| `POST /agent-data` (`integration_configs` + saved filter by `configName`) | Narrow **named filter** lookup, not the full env-ref connector plane |
| Local `config/*.json` + `.env` ([05](./05-config-and-secrets.md)) | Phase 2 source of truth |

Treat `/agent-data` as **legacy** unless you explicitly replace it with a per-user **bundle** API that uses the env-ref schema. Do not teach Agent MCP to call `/agent-data` as a substitute for this design.

---

## Prerequisites (before building this)

1. Local env-ref schema is the only on-disk format ([05](./05-config-and-secrets.md)).
2. Dashboard export emits `webhookUrlEnv` + `.env` **template**, not live webhook URLs.
3. Phase 3 local push tools exist so Claude can act on **names** after discovery.
4. New API + Supabase tables (or a redesigned successor to `integration_configs`) owned with dashboard migrations — not ad hoc in this npm package.

Cross-repo: **truss-api** (bundle REST + optional Server MCP tools), **truss-dashboard** (editor, consent, schema), **truss-docs** (public story), this repo (`sync` / `--pull` / doctor).

---

## Rules (so the split does not collapse)

1. Cloud JSON is the **env-ref** schema only. Do not persist today’s inline `webhookUrl` into Postgres.
2. Discovery ≠ delivery. No destination execution in Lambda.
3. Server MCP tools are **your** configs only (caller identity).
4. Secrets never appear in MCP tool arguments, logs, or API responses.

---

## Out of scope here

- Implementing API routes, MCP tools, or `truss-mcp sync`
- Changing hosted investigation catalog (`lookup_ioc`, `search_threats`, …)
- Phases 1–6 in [04](./04-migration-phases.md) (this is after those)
