# Migration phases

**Status:** Roadmap. Phase 1 docs done. Phase 2 **docs** done ([05](./05-config-and-secrets)–[07](./07-chat-and-serve)); implementation not started.  
**Product definition:** [01-what-is-agent-mcp](./01-what-is-agent-mcp)

Do **not** execute [docs/07](../../07-unified-agent-delivery-architecture.md) as written. That plan keeps the seven local search tools. 01 wins: those tools are a duplicate Server MCP and will be sunset, not extended.

## Order

```
1 Identity freeze        docs done
2 Delivery foundation    docs done; next is code (chat + serve + env-ref secrets)
3 Agent MCP tools        connections / jobs / push (host uses Server MCP to investigate)
4 Sunset search          remove fetch tools; REPL remote-only
5 Widen destinations     SIEM → EDR → SOAR → NGFW
6 Catalog cleanup        live README, guides, config, registry, dashboard, truss-docs
later Cloud config       secret-free bundles on API; Server MCP discover-only ([08](./08-cloud-served-agent-config.md))
```

Add Agent **value** before deleting search so the package is never “doctor only.” Swap **live docs** after the identity is true in code (phase 6, with earlier drafts staying here).

## Phase 1 — Identity freeze

**Docs only.** [02](./02-identity-freeze), [AGENTS.md](./AGENTS.md), [03](./03-dual-server-host).

- Freeze: no new investigation tools
- Live README / `docs/01–07` / `config/` untouched
- Dual-server picture recorded, not applied to sample configs

## Phase 2 — Delivery foundation

**Docs:** [05-config-and-secrets](./05-config-and-secrets) · [06-how-intel-is-pulled](./06-how-intel-is-pulled) · [07-chat-and-serve](./07-chat-and-serve)

Absorb **truss-agent** chat path into this package:

- Config bundle: `.env` holds secrets; `connections.json` / `jobs.json` hold env **names** only
- Discord / Slack / Teams adapters (parity, not the full SIEM matrix)
- `truss-mcp serve` + `run-job` — scheduler, no LLM
- Hand-written `config/*.json` + `.env` (no dashboard-zip migrator in this iteration)

Internal pull for jobs: SDK/REST (public routes only), not a new MCP search catalog. First code: Discord vertical slice in [07](./07-chat-and-serve).

## Phase 3 — Agent control plane

Local stdio tools (names illustrative):

- Connections: list / get / upsert / enable / test
- Jobs: list / get / upsert / enable / run-now / reload
- Delivery: push to a **named** connection (product ids or last-known payload)

Host investigates via **Server MCP**. Optional `push_search_to_connection` is delivery-only (FilterQL in → push out), not a browse-results tool.

Still do not add `lookup_ioc` / `search_threats` clones here.

## Phase 4 — Sunset local search

- Default `truss-mcp search` to hosted Server MCP tools only
- Remove fetch tools from Agent `tools/list` (`search_products*`, iterate, STIX get/search)
- Keep non-fetch FilterQL helpers only if they still earn their keep
- Deprecation window: one minor with warnings, then removal — not “legacy forever”
- Investigation on stdio-only hosts: bridge to `https://api.truss-security.com/mcp`

## Phase 5 — Widen destinations

After chat + control plane work: SIEM, then EDR, SOAR, NGFW. Adapter list and EDL semantics can stay in docs/07 until copied into this folder.

## Phase 6 — Catalog cleanup

Now it is honest to replace live docs:

- Root README, AGENTS.md, package description
- `docs/01–07` and guides (`truss-agent-vs-mcp.md` becomes “unified local agent”)
- `config/` dual-server samples; stdio sample is Agent, not search
- `server.json` / Smithery: stop listing this package as hosted investigation MCP
- truss-docs + dashboard: Server MCP vs install Agent
- Deprecate **truss-agent** as a second daemon

## Later — Cloud-served agent config

**Docs:** [08-cloud-served-agent-config](./08-cloud-served-agent-config.md)

Not part of phases 1–6. After env-ref dashboard export and local `serve` are real: Truss API stores **your** secret-free connections/jobs; Server MCP can list/get them; local Agent still binds `.env` and pushes. No destination secrets and no Discord POST on hosted `/mcp`.

## Cross-repo (not Phase 1–2 docs)

| Repo | When | What |
|------|------|------|
| truss-api | unchanged for the split | Server MCP stays query-only |
| truss-agent | phases 2–6 | port, then deprecate |
| truss-docs | phase 6 | separate Server vs Agent pages |
| truss-dashboard | phase 6 | hosted URL is not “Agent MCP” |

No push APIs on hosted `/mcp`. That would put customer destination secrets in Truss cloud.

## Explicitly out of scope until implementation / later phases

- Coding adapters or `serve` until we start the Discord slice
- Deleting `src/tools/` search handlers
- Rewriting public README
- Registry republish
- MCP connection/job tools (phase 3)
