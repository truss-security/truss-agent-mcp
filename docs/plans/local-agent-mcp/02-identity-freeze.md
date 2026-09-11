# Phase 1 — Identity freeze

**Status:** In effect (planning docs only; no code, no live-doc rewrite)  
**Depends on:** [01-what-is-agent-mcp](./01-what-is-agent-mcp)

Stop treating this repo as a second Server MCP. Do not rewrite the public story until the code is actually Agent MCP.

## Why freeze before code

Today the package is useful for the **wrong** reason: local FilterQL search + doctor for hosted `/mcp`. If we retitle README to “local destinations only” while `truss-mcp mcp` is still seven search tools, we lie to users. If we keep adding search tools, we never leave the hybrid.

Phase 1 is therefore **writing and a no-growth rule**, not a refactor.

## Shipped vs target (leave shipped alone)

| Surface | Today (leave in place) | Target (this folder) |
|---------|------------------------|----------------------|
| README, guides, `docs/01–07` | Hybrid: remote Server MCP “recommended” + local stdio search | Agent MCP; investigation is Server MCP |
| Root `AGENTS.md` | Edit the seven search tools; remote-first host | [AGENTS.md](./AGENTS.md) in this folder |
| `config/cursor.mcp.json` | Single server: hosted URL, name `truss-mcp` | Two servers ([03](./03-dual-server-host)) |
| `config/cursor.mcp.stdio.json` | Local search via `TRUSS_API_KEY` | Local **Agent** (connections/jobs), not search |
| `server.json` / Smithery | This repo listed as hosted investigation MCP | Server MCP listing is not this product |
| `src/tools/` | Seven FilterQL/STIX tools | Frozen; sunset in a later phase |
| `truss-agent` (other repo) | Chat webhooks + cron | Absorb later; not this phase |

## Freeze rules

### No new investigation MCP

Do not add tools that fetch or browse Truss products from this server, including clones of Server MCP (`lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`) and extensions of the local set (`search_products_page` variants, iterate, “smarter” search).

Existing search tools **stay until the sunset phase** so current stdio configs keep working. They are not a peer product. Do not document them as recommended in *new* writing.

Allowed later (not this phase): FilterQL **helpers that do not fetch** (`list_filter_attributes`, `validate_filter_expression`).

### No live-doc swap yet

Do not replace or “fix” to the new identity:

- Root `README.md`, root `AGENTS.md`
- `docs/01`–`docs/07`, `docs/README.md`
- `guides/*` (including `truss-agent-vs-mcp.md`)
- `config/*.json`, `server.json`, `.mcp.json`, `config/mcp-registry.json`
- Package `description` in `package.json`

New material goes here. We swap live docs when a later phase lands real Agent behavior.

### No registry identity growth

Do not add listings, badges, or copy that present `@truss-security/truss-agent-mcp` as the Truss investigation MCP. The hosted URL `https://api.truss-security.com/mcp` is **Server MCP** (truss-api). A future Agent listing, if any, is a **local** server.

`validate-remote` / `doctor --remote` may stay in this CLI as “can we see Server MCP.” They are not the product.

### No destination secrets in Truss

Do not design hosted `/mcp` tools that store webhooks, HEC tokens, or SIEM keys. Push is customer egress from the Agent process.

## Dual-server picture (operators)

New writing should assume:

1. Host connects to **Server MCP** for intel (OAuth or API key).
2. Host connects to **Agent MCP** (this package, stdio) for destinations — once those tools exist.
3. Stdio-only hosts that need **investigation** use a generic bridge to the hosted URL, not a Truss-specific search server.

Details and sample JSON: [03-dual-server-host](./03-dual-server-host).

## What Phase 1 does *not* include

- Porting `truss-agent`, `serve`, adapters, connection/job tools
- Removing `search_products` from `src/tools/`
- Changing Cursor/Claude sample configs in `config/`
- Public truss-docs / dashboard copy (cross-repo later)

## Done when

- [x] Why doc ([01](./01-what-is-agent-mcp))
- [x] Target AGENTS.md in this folder
- [x] This freeze
- [x] Dual-server host doc
- [x] Phase map ([04](./04-migration-phases))
- [x] Live docs and code untouched
