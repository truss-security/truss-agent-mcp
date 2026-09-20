# Journey — hourly Splunk job (HEC)

**Status:** SIEM MVP — assistant discovers their scheduler; no TAXII; no babysitting a CLI  
**North star:** [../local-agent-mcp/11-optimal-customer-product.md](../local-agent-mcp/11-optimal-customer-product.md)  
**Related:** [01-discord-channel](./01-discord-channel.md) (same branching) · [../../07-unified-agent-delivery-architecture.md](../../07-unified-agent-delivery-architecture.md) §6.2 `splunk-hec` · Server MCP in **truss-api** `documentation/architecture/mcp.md`

First SIEM to productize. HEC is one JSON POST (same family as Discord webhooks). Sentinel’s native tile wants TAXII (we do not have it). The prompt is a **scheduled ingest**, not “leave `truss-mcp run-job` running.” `run-job` is **test once** only.

Unlike Discord, **do not** offer Truss-hosted HEC tokens in this MVP (writing into their SIEM is a larger blast radius than a chat channel).

---

## Customer prompt (canonical)

> Pipe new Truss products into Splunk every hour.

Other phrasings: “Get last 7 days of Truss malware into Splunk,” “Send Truss intel to our Splunk index.” Do **not** require HEC, FilterQL, Docker, Zapier, MCP, or API key.

The assistant **narrows the intel**, then **asks what can already fire HTTP on a timer** (and whether Splunk can be that timer). Creating the HEC token is still Splunk’s UI.

---

## Where they type

A generic chat box does not know Truss. They must already be in a host with Truss tools:

| Place | How it knows Truss |
|-------|-------------------|
| Truss dashboard setup/chat (not shipped as this workflow) | Logged-in session |
| Their assistant (Claude, Copilot, SOC bot) | One-time: `https://api.truss-security.com/mcp` + OAuth |
| `truss-mcp search` | Token file or API key; technician tool |

Dashboard **AI Assistant** (`/assistant/query`) is smart search, not this journey. It can help **narrow FilterQL**; it cannot emit a HEC recipe until we add delivery tools/mode.

---

## Intended conversation

1. Customer states the prompt above.
2. Assistant uses `search_threats` / `get_product` / `search_stix` / `lookup_ioc` and **asks** until the job is specific (malware vs ransomware, last hour each hour, metadata vs IOCs / `includeIndicators`).
3. Assistant freezes FilterQL + window + format.
4. Assistant asks: **What already runs on a schedule?** Splunk itself (scripted input, Heavy Forwarder, SOAR), Zapier, Make, n8n, Tines, Torq, GitHub Actions, etc.
5. Branch (below). HEC URL + token are always created **in Splunk** (Settings → Data inputs → HTTP Event Collector). Those are the secrets.

No LLM on the hourly tick. Empty Truss search → no HEC POST.

---

## Branching: who runs the clock

```
Narrow FilterQL
    │
    ├─ Splunk can poll or they have SOAR/HF
    │     → Splunk-native recipe (scripted input / their playbook → HEC). Secrets in Splunk.
    │
    ├─ They have Zapier / n8n / Tines / …
    │     → Blessed scheduler recipe → HEC. Secrets in that tool.
    │
    └─ They do not (or will not put a Truss key in Splunk/Zapier)
          └─ Docker collector (image includes serve + splunk-hec; restart = schedule)
```

Do **not** offer: git clone, `npm install`, babysitting `run-job`, or “paste HEC into Truss and we will POST.”

### A — Splunk (or SOAR) is already the scheduler (prefer this)

They already operate Splunk. Truss does not run the clock and does not store HEC.

- Blessed **Splunk-native** pack: create HEC + index `truss` (click-path), example SPL, and a **scripted input** (or HF cron) that `POST`s ` /product/search` (or `/stix`) with `x-api-key` on the hour, then writes to HEC **or** indexes the JSON directly.
- If they have Tines/Torq/Splunk SOAR: same Truss HTTP, last hop HEC or their existing Splunk action.
- If their assistant also has Splunk tools, creating the HEC can be *their* Splunk MCP — optional, not MVP.

`TRUSS_API_KEY` lives in Splunk (or SOAR), not in Truss.

### B — External scheduler (Zapier first)

Same idea as [01](./01-discord-channel.md) path A, last hop is HEC not Discord.

- Start with **one** recipe (**Zapier**): schedule → Truss HTTP → Splunk HEC.
- Ship as a setup artifact. LLM will invent Truss/HEC shapes without it.
- Then informational packs: Make, n8n, Tines (same build-order slot as Discord).

Secrets stay in Zapier (or equivalent).

### C — Docker (local default if they have no scheduler they will use)

A **container** whose process **is** the scheduler (`truss-mcp serve` + `splunk-hec` + `restart: unless-stopped`). They still need Docker (or Compose/K8s). The agent must say that.

- `.env`: `TRUSS_API_KEY`, `SPLUNK_HEC_URL`, `SPLUNK_HEC_TOKEN`
- Config: env **names** only (`hecUrlEnv`, `hecTokenEnv`)
- `run-job` inside the image = **test once**, not the product

No git clone. No “Python poller in a tmux session.”

### Not in this MVP — Truss-hosted HEC

Discord may store a chat webhook in the dashboard. **Splunk HEC tokens stay out of Truss cloud** unless a later security review says otherwise. Server MCP must not `push_to_splunk`.

---

## What they still do internally

| Always | Splunk: create HEC token + index (e.g. `truss`). |
|--------|--------------------------------------------------|
| Path A | Put Truss API key in Splunk/SOAR; enable the scripted input or playbook. |
| Path B | Paste Truss API key + HEC URL/token into Zapier (or their tool). Turn it on. |
| Path C | Paste API key + HEC into Docker `.env`. Run the compose/stack. |

---

## Additional development

### Already enough for the Q&A

| Piece | Where | Notes |
|-------|--------|--------|
| Five investigation tools + OAuth | `truss-api` `/mcp` | Narrowing |
| Human API key page | `truss-dashboard` `/api-key` | Path A/B/C auth to Truss |
| Discord `serve` / env-ref pattern | this repo | Copy for HEC (path C) |

`/mcp` has **no** Truss LLM. Today’s instructions do not describe this job.

### Must add — Server MCP (`truss-api`)

| Work | Why |
|------|-----|
| Instructions for this prompt | Clarify intel → ask scheduler → branch; no clone, no hosted HEC |
| `get_splunk_hec_setup` (illustrative) | Blessed **Splunk scripted-input** pack + **Zapier** pack + exact Truss HTTP (URL, header, FilterQL, cadence) + HEC click-path + example SPL + Docker compose stub |
| Optional `include_indicators` / IOC extract | Opt-in IOCs |
| Later packs | Make / n8n / Tines |

Do **not**: `push_to_splunk`, store HEC on hosted MCP, expose admin `POST /api-key/create`.

### Must add — this repo (path C)

| Work | Why |
|------|-----|
| `splunk-hec` adapter | POST JSON; `hecUrlEnv` / `hecTokenEnv`; fail closed; mask tokens |
| Docker image with `serve` | The scheduler |
| Compose example (secret-free) | `restart: unless-stopped` |
| `doctor` | HEC env-ref presence |

### Optional

| Work | Why |
|------|-----|
| Dashboard chat as this agent | Type the prompt in Truss |
| Splunk TA wrapping the scripted input | After the raw script works |

### Do not add for this MVP

- Git-clone / `npm install -g .` as a customer path
- `run-job` as the way to run **every hour**
- Truss-hosted HEC POST
- TAXII / Sentinel / OpenCTI (other journeys)
- Splunk SDK as v1 (HEC + scripted input first)

---

## Suggested build order

1. Server MCP instructions + **Splunk-native** recipe (path A) and **Zapier** recipe (path B). Prove the prompt with no Truss daemon. This is `get_splunk_hec_setup` (and instructions).
2. **Dashboard chat** that calls `get_splunk_hec_setup` — so they can type the prompt **in Truss** (logged-in session) without adding MCP to their own assistant. Same tool as (1); this is the host, not a second recipe.
3. More informational recipes (Make, n8n, Tines).
4. **Docker** image with `serve` + `splunk-hec` (path C).
5. TAXII / Sentinel / OpenCTI as **other** journeys, not a rewrite of this one.

---

## Success

A Growth+ user says the canonical prompt in an assistant that already has Server MCP (or later dashboard chat). They narrow the filter with the model. They are asked how they schedule HTTP (including Splunk itself).

- If Splunk/SOAR or Zapier: they enable a Truss-authored recipe and see events in `index=truss`. No clone, no babysitting `truss-mcp`.
- If nothing they will use: they run the documented Docker stack with HEC in `.env`.

They did not write FilterQL by hand. They were not told to download this repo. Truss never stored their HEC token.

---

## Out of scope

Discord: [01-discord-channel](./01-discord-channel.md) (hosted chat webhook is a Discord exception). TAXII/Sentinel: [11](../local-agent-mcp/11-optimal-customer-product.md).
