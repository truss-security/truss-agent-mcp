# Journey — hourly Splunk job (HEC)

**Status:** MVP SIEM journey (no TAXII)  
**North star:** [../local-agent-mcp/11-optimal-customer-product.md](../local-agent-mcp/11-optimal-customer-product.md)  
**Related:** [../../07-unified-agent-delivery-architecture.md](../../07-unified-agent-delivery-architecture.md) §6.2 `splunk-hec` · Server MCP in **truss-api** `documentation/architecture/mcp.md`

This is the first SIEM we should productize. Sentinel’s native tile wants TAXII (we do not have it). OpenCTI wants a pollable collection. Splunk HTTP Event Collector is one JSON POST — same family as Discord webhooks.

---

## Customer prompt (canonical)

> Pipe new Truss products into Splunk every hour.

Other phrasings of the same intent: “Get last 7 days of Truss malware into Splunk,” “Send Truss intel to our Splunk index.” Do **not** require them to say HEC, FilterQL, Docker, MCP, or API key.

The assistant **queries and narrows** (category, IOC types, window, malware vs ransomware, regions) using Server MCP search tools, then does **everything except secrets that live inside their Splunk**.

---

## Where they type

A generic chat box does not know Truss. They must already be in a host with Truss tools:

| Place | How it knows Truss |
|-------|-------------------|
| Truss dashboard setup/chat (not shipped as this workflow) | Logged-in session |
| Their assistant (Claude, Copilot, SOC bot) | One-time: `https://api.truss-security.com/mcp` + OAuth |
| `truss-mcp search` | Token file or API key; technician tool |

Dashboard **AI Assistant** (`/assistant/query`) is smart search, not this journey. Dashboard **MCP Agent** is `truss-mcp search` against the five investigation tools only.

---

## Intended conversation

1. Customer states the prompt above.
2. Assistant uses `search_threats` / `get_product` / `search_stix` / `lookup_ioc` to sample data and **ask** until the job is specific (e.g. malware, last hour each hour, IP/domain/hash, IOC-safe vs `includeIndicators`).
3. Assistant freezes FilterQL + window + format (metadata vs IOC).
4. Assistant emits **secret-free** artifacts: HEC setup steps in Splunk, `.env` template with empty `SPLUNK_HEC_URL` / `SPLUNK_HEC_TOKEN`, poller or `serve` job JSON, example SPL (`index=truss …`).
5. Customer creates the HEC token in Splunk and pastes URL + token locally (or into Splunk’s own store). Never back into Truss chat as a tool argument Truss would persist.
6. Hourly run starts: cron poller **or** `truss-mcp serve` / container. No LLM on the hourly tick.

Stop condition: Truss has not received a HEC URL or token. If they have Splunk admin MCP/`splunk` on the **same** host, creating the HEC can be their Splunk tools — optional, not MVP.

---

## What they still do internally

- Splunk: Settings → Data inputs → HTTP Event Collector → new token, pick/create index (e.g. `truss`).
- Paste `SPLUNK_HEC_URL` and `SPLUNK_HEC_TOKEN` into `.env`, Docker secrets, or a Splunk scripted input.
- Approve running the poller / container / cron on a host they control.

---

## Additional development

### Already enough for the Q&A

| Piece | Where | Notes |
|-------|--------|--------|
| Five investigation tools + OAuth | `truss-api` `/mcp` | `lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix` |
| Human API key page | `truss-dashboard` `/api-key` | For REST poller auth to Truss |
| Discord `serve` / env-ref jobs | this repo | Pattern to copy for HEC, not Splunk itself |

`/mcp` has **no** Truss LLM. The host model does the narrowing. Today’s server `instructions` only say “query products” — they do not describe this job.

### Must add — Server MCP (`truss-api`)

| Work | Why |
|------|-----|
| Instructions (and tool text) for “hourly Splunk feed” | So the canonical prompt is handled on purpose: clarify → freeze FilterQL → emit setup, not dump 50 products |
| `get_splunk_hec_setup` (name illustrative) | Returns a **blessed** poller, `.env` template, example SPL, and the agreed FilterQL/window. Without this, models invent broken curl |
| Optional `include_indicators` (or IOC extract) on search | “Narrow to relevant IOCs” should be opt-in, consistent with MCP IOC-safe defaults |

Do **not**: `push_to_splunk`, accept HEC URL/token as stored hosted-MCP state, or expose admin `POST /api-key/create`.

### Must add — this repo (`truss-agent-mcp`) for a real hourly product

| Work | Why |
|------|-----|
| `splunk-hec` adapter | POST JSON to HEC; `hecUrlEnv` + `hecTokenEnv`; fail closed; mask tokens in logs |
| Job + `serve` / `run-job` | Same pipeline as Discord; `schedule: 60`; `outputFormat` metadata or ioc |
| `doctor` | Env-ref presence for HEC names |
| Blessed poller checked in (MVP-thin) | If `serve`+HEC slips, a single Python/curl poller + cron still demos the journey |
| Docker later | Production install; not required to prove HEC once |

Hosted `/mcp` **cannot** run every hour on their network. Hourly is cron, Splunk scripted input, or this collector.

### Optional — dashboard

| Work | Why |
|------|-----|
| Setup-agent mode (not only smart search) | So they can type the prompt **in Truss** without attaching MCP themselves |
| Secret-free bundle store | FilterQL + `hecUrlEnv` names only ([08](../local-agent-mcp/08-cloud-served-agent-config.md)) |

### Do not add for this MVP

- TAXII 2.1 collections
- Sentinel TAXII connector / Azure APIs
- OpenCTI product work
- Splunk SDK / modular input TA as v1 (HEC first; TA can wrap the poller later)
- Creating HEC via Splunk REST unless the **customer’s** host already has Splunk tools

---

## Suggested build order

1. **Instructions + `get_splunk_hec_setup`** on Server MCP + a poller in this repo that uses existing `POST /product/search` (or `/stix`) → HEC. Human cron. Proves the prompt.
2. **`splunk-hec` on `serve`** so hourly is a Truss process, not a loose script.
3. Dashboard chat that calls the same setup tool.
4. TAXII / Sentinel / OpenCTI as **other** journeys, not a rewrite of this one.

---

## Success

A Growth+ user, in an assistant already connected to Server MCP (or later dashboard setup chat), says the canonical prompt, narrows to a filter with the model, creates a HEC in Splunk, pastes two env vars, and **within an hour** sees Truss products in `index=truss` (or their index). They did not write FilterQL by hand or clone this repo.

---

## Out of scope (other docs)

TAXII pull into Sentinel/OpenCTI remains the long-term “no Truss process on-box” SIEM path in [11](../local-agent-mcp/11-optimal-customer-product.md). This journey is **push to HEC** because we do not have TAXII yet.
