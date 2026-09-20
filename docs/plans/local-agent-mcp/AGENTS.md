# Agent operations — Truss Agent MCP (target)

**This file is the migration guide, not the shipped product guide.**

Until live docs are replaced: root [`AGENTS.md`](../../../AGENTS.md), [`README.md`](../../../README.md), and [`docs/`](../../) still describe **current code**. When those conflict with this folder, **this folder wins for new work**.

Read [01-what-is-agent-mcp](./01-what-is-agent-mcp) first.

## What this repo is becoming

| Product | Owner | Job |
|---------|--------|-----|
| **Truss Server MCP** | truss-api `https://api.truss-security.com/mcp` | Investigation (`lookup_ioc`, `search_threats`, `get_product`, STIX) |
| **Truss Agent MCP** | this package, local stdio | Destinations: Discord/SIEM/EDR/SOAR/NGFW, jobs, local secrets |

This package must **know about** Server MCP. It must **not re-implement** it.

## Freeze (in effect now)

Do **not**:

- Add investigation tools (`search_products*`, `lookup_ioc`, `get_product`, STIX search/get, pagination/iterate clones, smart/vector search)
- Expand [`docs/04-mcp-tool-catalog.md`](../../04-mcp-tool-catalog.md) as if local search were the product
- Rewrite root README, root AGENTS.md, `docs/01–07`, `guides/`, `config/*.json`, or `server.json` yet
- Point registries or Smithery at this package as the Truss investigation MCP (that URL is Server MCP)
- Put destination secrets in tool args, logs, committed JSON, or Truss cloud
- Add MCP tools that call admin API routes

Do:

- Put new planning docs in this folder
- Leave existing local search tools in place until the sunset phase (do not grow them)
- Prefer dual-server host setup in new writing: Server MCP + Agent MCP ([03](./03-dual-server-host))

## Two sources of truth

| Question | Answer |
|----------|--------|
| How does shipped `truss-mcp` work today? | Root AGENTS.md, docs 01–07, guides |
| What should I implement or document next? | This folder |
| May I add another FilterQL/search tool? | **No** |
| May I rewrite the public README to say we are Agent-only? | **Not yet** (code still ships search) |

## Architecture (target)

```
MCP host
  ├─ Server MCP  →  https://api.truss-security.com/mcp   (OAuth or API key)
  └─ Agent MCP   →  local stdio (this package)           (destination env secrets)
```

- **Interactive pull:** host calls Server MCP. Agent tools take product ids, connection/job names, or FilterQL **for jobs** — not a second search catalog.
- **Headless pull (`serve`, later):** internal SDK/REST (or HTTP to Server MCP) inside the job runner. Not `tools/list` investigation tools.
- **Optional helpers:** `validate_filter_expression` / `list_filter_attributes` may stay; they do not fetch products.

## Security

Unchanged from the public repo, plus destination rules:

- Never commit `.env`, API keys, webhooks, HEC tokens, or OAuth tokens
- `TRUSS_API_KEY` and destination secrets: host env / `.env` only — never tool arguments or error payloads
- `maskSecret()` for any preview; never log full secrets
- Do not add internal Truss endpoints, staging URLs, or unreleased API plans to public docs
- Report vulns per [SECURITY.md](../../../SECURITY.md)

## Public API boundary (internal pull only)

When Agent later pulls intel for a job, customer-key routes only:

`POST /product/search`, `POST /product/search/stix`, `GET /product/{id}/stix`

No `/search/smart`, `/search/vector`, native `GET /product/{id}` JSON, writes, `pg-query`.

## Development workflow

```bash
npm ci
npm run build
npm test
```

Same CI expectations as root AGENTS.md. Commit only when asked.

## Change discipline (during freeze)

- **Minimize scope.** Phases 1–2 in this folder are docs only until someone starts the Discord/`serve` slice.
- Do not update `docs/04`, `src/instructions.ts`, and search schemas “together” for new investigation tools — those tools are frozen.
- Later Agent tools (connections/jobs/push) will need schemas, register-tools, instructions, tests, and **new** catalog text in this plan (then live docs when we swap).

## Do not restore

Same as root AGENTS.md (`docs/aiAssistantPlan/`, legacy vision docs, huggingface templates).

## Related

- [02-identity-freeze](./02-identity-freeze) — freeze detail
- [03-dual-server-host](./03-dual-server-host) — host configs (target)
- [04-migration-phases](./04-migration-phases) — phase map
- Phase 2: [05-config-and-secrets](./05-config-and-secrets.md) · [06-how-intel-is-pulled](./06-how-intel-is-pulled.md) · [07-chat-and-serve](./07-chat-and-serve.md)
- Phase 3: [09-run-job-now](./09-run-job-now.md)
- Customer install (no Cursor): [10-customer-path](./10-customer-path.md) (CLI kernel; product UX in 11)
- North star: [11-optimal-customer-product](./11-optimal-customer-product.md)
- Discord journey: [../customer-journeys/01-discord-channel.md](../customer-journeys/01-discord-channel.md)
- Splunk journey: [../customer-journeys/02-splunk-job.md](../customer-journeys/02-splunk-job.md)
- Future: [08-cloud-served-agent-config](./08-cloud-served-agent-config.md)
