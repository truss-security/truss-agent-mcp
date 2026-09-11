# Phase 2 — How intel is pulled

**Status:** Planning  
**Phase:** 2 ([04-migration-phases](./04-migration-phases))  
**Depends on:** [01-what-is-agent-mcp](./01-what-is-agent-mcp), [05-config-and-secrets](./05-config-and-secrets)

`serve` must fetch Truss products without an LLM and **without** putting investigation tools on Agent MCP. Pull is an internal library call. `tools/list` on this package stays frozen (existing search tools are deprecated inventory, not the delivery path).

## Two pull paths (do not mix)

| Path | Who calls Truss | What the model sees |
|------|-----------------|---------------------|
| **Interactive** | Host → **Server MCP** | `lookup_ioc`, `search_threats`, `get_product`, STIX |
| **Headless delivery** | `truss-mcp serve` / `run-job` → **SDK REST** | Nothing. No chat. Log lines only. |

Phase 3 may add “push these product ids” (host already got them from Server MCP) and optionally a delivery-only `push_search_to_connection`. That still is not a browse catalog. **Not Phase 2.**

Do **not** have `serve` speak MCP to `https://api.truss-security.com/mcp`. OAuth access tokens expire; cron needs a long-lived `TRUSS_API_KEY`. REST via `@truss-security/truss-sdk` is the same public search the key already allows.

```
truss-mcp serve
    │  read jobs.json + connections.json
    │  resolve webhookUrlEnv (fail closed)
    │  on tick:
    ▼
TrussClient  POST /product/search   (API key)
    │
    ▼
formatter → Discord/Slack/Teams webhook
```

## Public API boundary

Customer-key routes only, same as today’s stdio client:

| Method | Path | Phase 2 use |
|--------|------|-------------|
| POST | `/product/search` | Job pull (required) |
| POST | `/product/search/stix` | Not required for chat metadata/report |
| GET | `/product/{id}/stix` | Not required for Phase 2 |

Do not call `/search/smart`, `/search/vector`, native `GET /product/{id}`, writes, `pg-query`, `/agent-data`. Named filters live in local JSON ([05](./05-config-and-secrets)), not server-side agent-data.

Reuse [`buildProductSearchPayload`](../../../src/lib/build-product-search-payload.ts) (already ported from truss-agent). Keep FilterQL `=`, `!=`, `LIKE`, `AND`, `OR`. Prefer `filterExpression`; still accept legacy array fields on imported jobs (`category: ["Malware"]`, …).

SDK: `retries: 0` (same as MCP client — surface 429, do not stampede). Debounce / serial queue between pages and between jobs ([07](./07-chat-and-serve)).

User-Agent: `truss-mcp/<version>` (already set). Fine to keep; delivery is still this binary.

## Filter and window (delivery, not investigation)

On each tick:

1. If `job.filter` is set → use it.
2. Else if connection `query.filter` is set → use that template.
3. Else → skip job (log: no filter). Do not “search everything.”

Window (maps to `days` / `startDate`+`endDate` on the payload):

1. `job.windowMinutes` or `job.windowDays` if set (explicit window wins — needed for one-off `run-job` tests).
2. Else interval schedule (`schedule` is a positive number of minutes) → window = that interval (dedupe overlap on `serve`).
3. Else connection `query.windowMinutes` / `windowDays`.
4. Else **24 hours** for delivery jobs.

Do **not** default delivery to 7 days. That default is for interactive Server MCP quota, not for a cron that runs every hour.

## Pagination, empty results, IOCs

- Page with existing caps (`TRUSS_MCP_MAX_LIMIT`, `TRUSS_MCP_MAX_PAGES`) or serve-specific env if we need a higher delivery ceiling — decide at implementation; default conservative to protect quota.
- Empty product list → **no webhook POST** (log and return).
- Summaries stay IOC-safe unless `includeIndicators: true` on the job. Chat `metadata` / `report` should not dump indicator maps by default.
- `outputFormat: ioc` without `includeIndicators: true` → fail closed for that run.

## What must not happen

- Registering `search_products` (or Server MCP clones) as the way `serve` works
- Exposing pull results as an MCP investigation tool in Phase 2
- Using the host LLM inside `serve`
- Pulling on every `doctor` run (doctor only checks config + env **presence**)

## Phase 3 preview (do not implement now)

- `push_products_to_connection` — ids or an explicit payload the host already has from Server MCP
- `push_search_to_connection` — if added, FilterQL in → push out; response is delivery status, not a product table for browsing

Until then, the only pull is inside `serve` / `run-job`.
