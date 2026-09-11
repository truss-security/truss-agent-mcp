# Phase 2 — Chat adapters and `serve`

**Status:** Planning — first Agent **value**; still no MCP connection/job tools  
**Phase:** 2 ([04-migration-phases](./04-migration-phases))  
**Depends on:** [05-config-and-secrets](./05-config-and-secrets), [06-how-intel-is-pulled](./06-how-intel-is-pulled)

Ship a local daemon that pulls via REST and pushes to Discord / Slack / Teams. That is enough to stop needing a second process (`truss-agent`) for chat. Control-plane MCP tools wait for phase 3. SIEM/EDR/SOAR/NGFW wait for phase 5.

## In scope

| Piece | Behavior |
|-------|----------|
| Adapters | `discord`, `slack`, `ms-teams` — incoming webhook POST |
| Formats | `metadata` (default chat), `report`, `ioc` (opt-in indicators) |
| `truss-mcp serve` | Load bundle, schedule jobs, serial pull+push, no LLM |
| `truss-mcp run-job <name>` | One-shot (test without waiting for cron) |
| `truss-mcp doctor` | Schema + env-ref presence + API key if jobs enabled |

## Out of scope (explicit)

- MCP tools: `list_connections`, `upsert_job`, `push_products_to_connection`, … (phase 3)
- Splunk HEC / other SIEM (phase 5). Ignore unused Splunk SDK in old agent checkouts; docs/07 already says HEC-first later.
- Email / SMTP from the convict-era agent
- File watch / SIGHUP reload — Phase 2 can restart `serve` to pick up JSON; `reload_delivery_config` is phase 3
- Rewriting root README, `config/cursor.mcp.json`, or deleting search tools
- Dual-daemon forever: Phase 2 is **parity for chat**; tell operators to run `truss-mcp serve` once it exists. Formal truss-agent deprecation copy is phase 6.
- `truss-mcp migrate-agent-config` / rewriting dashboard zips — this iteration is hand-written `.env` + JSON ([05](./05-config-and-secrets.md))

## Adapters

Port chat formatters from the connections/jobs truss-agent (dashboard types: `discord` | `slack` | `ms-teams`). Switch `webhookUrl` → resolved `webhookUrlEnv`.

| typeId | POST | Payload sketch |
|--------|------|----------------|
| `discord` | webhook URL | Embeds / content; cap length |
| `slack` | webhook URL | Incoming-webhook JSON |
| `ms-teams` | webhook URL | Adaptive Card or simple MessageCard — match existing agent formatter |

Each module:

- `healthcheck` — HTTP to the webhook or a no-op POST policy that does not spam the channel (implementation: HEAD/GET if the vendor allows; otherwise skip live ping in doctor and only check env presence)
- `pushProducts(connection, secrets, products, format)`
- Fail closed on non-2xx; mask URLs in errors

Capability for chat: `push_products` (and `ioc` via format). No `push_edl`.

## `truss-mcp serve`

1. `loadAllEnv`; load connections + jobs; resolve env refs (skip/disable connections that fail).
2. Register each job where `job.enabled !== false` **and** named connection exists **and** `connection.enabled`.
3. Interval: `setInterval` / equivalent from numeric `schedule` (minutes). Cron: 5-field expression (`node-cron` or existing agent helper).
4. On tick: resolve filter/window ([06](./06-how-intel-is-pulled)) → `POST /product/search` (paginate, debounce, **serial** jobs by default) → format → `pushProducts`.
5. Empty list → no POST.
6. Process stays in the foreground (Docker/systemd wrap later). SIGINT exits cleanly.

Optional `TRUSS_AGENT_PARALLEL_JOBS` (or `TRUSS_MCP_PARALLEL_JOBS`) — default off.

```
serve  →  jobs.json  →  REST search  →  formatter  →  webhook
              ↑
        connections.json + .env refs
```

## `run-job`

Same path as a tick, once. Needed so Phase 2 is testable without phase 3 MCP `run_job_now`.

## Proposed layout (implementation, not this PR)

```
src/delivery/
  connections/     # registry + discord/slack/ms-teams
  jobs/            # load/save Zod schemas (env-ref, not dashboard webhookUrl)
  formatters/      # ioc | metadata | report
  query-manager.ts # schedule + serial queue
  secret-refs.ts
src/truss-cli.ts   # serve, run-job
```

Do not put this under `src/tools/` yet. Tools stay frozen.

Example JSON belongs next to `env.example` **when coding**, not in live `config/cursor.mcp.json`. Prefer `config/connections.example.json` (secret-free) at implementation time.

## Vertical slice (first code after these docs)

**Status:** Discord slice implemented in `src/delivery/` (`run-job`, `serve`). Slack/Teams still later in Phase 2. Config is hand-written (examples + `.env`); no migrator.

Do not implement the whole matrix in one PR. First merge that proves Phase 2:

1. Zod bundle with `webhookUrlEnv` (reject `webhookUrl` on the new schema)
2. Discord adapter + `metadata` formatter
3. Internal search via existing `TrussClient` + `buildProductSearchPayload`
4. `run-job` then `serve` with one interval job
5. Tests: schema, env fail-closed, empty search does not POST (mock)

Slack/Teams can follow in the same phase once Discord is green.

## Operator workflow (Phase 2)

1. Copy `config/*.example.json` to `config/agent.json`, `connections.json`, `jobs.json`.
2. Put webhook and `TRUSS_API_KEY` in `.env`; set `webhookUrlEnv` in connections JSON to that env **name**.
3. `truss-mcp doctor`
4. `truss-mcp run-job discord-malware-hourly`
5. `truss-mcp serve`

Interactive “ask Cursor to search, then push” waits for **Server MCP + phase 3 tools**. Until then, analysts still search in Server MCP (or today’s stdio search) and copy a filter into `jobs.json` by hand — same as today’s two-repo dance, but one binary for the scheduled half.

## Relationship to docs/07

[`docs/07-unified-agent-delivery-architecture.md`](../../07-unified-agent-delivery-architecture.md) §4–§7 and chat rows in §6.1 are the detailed adapter notes. Differences that **this folder** wins:

- Do not keep or grow the seven local search tools as the delivery mechanism
- Phase 2 is chat + `serve` only, not the SIEM/EDR/NGFW matrix
- This iteration does **not** auto-migrate dashboard `webhookUrl` into `.env` — hand-written env-ref JSON only
- MCP connection/job tools are Phase 3, not bundled with the first `serve`
