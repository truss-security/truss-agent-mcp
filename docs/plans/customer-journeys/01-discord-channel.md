# Journey — Discord channel for new malware

**Status:** Chat MVP — assistant discovers their scheduler; Truss does not assume a CLI  
**North star:** [../local-agent-mcp/11-optimal-customer-product.md](../local-agent-mcp/11-optimal-customer-product.md)  
**Related:** [../local-agent-mcp/07-chat-and-serve.md](../local-agent-mcp/07-chat-and-serve.md) · Server MCP in **truss-api** `documentation/architecture/mcp.md`

This is the first **destination** journey. Incoming Discord webhooks are one JSON POST. The customer prompt is a **scheduled post**, not “leave `truss-mcp run-job` running.” `run-job` is a **test once** action only.

SIEM is [02-splunk-job](./02-splunk-job.md). Slack/Teams copy this branching later.

---

## Customer prompt (canonical)

> Create a Discord channel that posts new malware.

Other phrasings: “Post Truss malware to Discord,” “Hourly malware digest in our intel channel.” Do **not** require webhook, FilterQL, Docker, Zapier, MCP, or API key.

The assistant **narrows the intel**, then **asks what can already fire HTTP on a timer**. “Scheduled webhooks” here means a scheduler that calls Truss (or Discord) on a cadence — Zapier/Make/n8n/Tines, not an inbound URL they expose.

Creating the Discord **channel** is still Discord’s UI. Truss wires **posts into a channel they choose**.

---

## Where they type

A generic chat box does not know Truss. They must already be in a host with Truss tools:

| Place | How it knows Truss |
|-------|-------------------|
| Truss dashboard setup/chat (not shipped as this workflow) | Logged-in session |
| Their assistant (Claude, Copilot, SOC bot) | One-time: `https://api.truss-security.com/mcp` + OAuth |
| `truss-mcp search` | Token file or API key; technician tool |

Dashboard **AI Assistant** (`/assistant/query`) is smart search, not this journey.

---

## Intended conversation

1. Customer states the prompt above.
2. Assistant uses `search_threats` / `get_product` / `search_stix` / `lookup_ioc` and **asks** until the job is specific (`category = "Malware"`, hourly, metadata vs IOCs, which channel).
3. Assistant freezes FilterQL + window + format (default `metadata`).
4. Assistant asks: **Do you already have something that can run a scheduled HTTP job?** (Zapier, Make, n8n, Tines, Torq, GitHub Actions, Power Automate, etc.)
5. Branch (below). Discord webhook is always created **in Discord** (channel → Integrations → Webhooks). That URL is the secret.

No LLM on the hourly tick once the scheduler is in place. Empty Truss search → no Discord POST.

---

## Branching: who runs the clock

```
Narrow FilterQL
    │
    ├─ They already have a scheduler (Zapier / n8n / Tines / …)
    │     → Blessed Truss recipe for that tool. Secrets stay there.
    │
    └─ They do not
          ├─ Truss-hosted Discord job (paste webhook in dashboard; we post)
          └─ Docker collector (image includes serve; restart policy = schedule)
```

Do **not** offer: git clone, `npm install`, babysitting `run-job` in a terminal.

### A — They already have a scheduler (prefer this)

Truss does not run the clock and does not store the Discord webhook.

- Start with **one** first-party recipe (**Zapier**). HTTP on a schedule → `POST /product/search` (or STIX) with `x-api-key` → Discord Incoming Webhook module.
- Ship that recipe as a setup artifact (Server MCP tool or a short canonical doc the agent must use). A connected LLM can narrate Zapier’s UI; it will **invent** Truss URLs, headers, and FilterQL without a blessed pack.
- Later: informational packs for Make, n8n, Tines — or the model adapts the Zapier pack while keeping the same Truss request shape.

They paste `TRUSS_API_KEY` and the Discord webhook into **Zapier** (or equivalent), not into Truss.

### B — No scheduler: Truss hosts the hook

Dashboard (not Server MCP `push_to_discord`): they paste an allowlisted `https://discord.com/api/webhooks/…` URL. Truss encrypts it, runs the hourly search, POSTs embeds. Confirm with a one-shot test post they see in-channel. Easy rotate/delete.

This **is** storing a destination secret. Acceptable for **chat** MVP; do not casually do the same for Splunk HEC. Mitigations: KMS, never log the token, allowlist Discord hosts (SSRF), deletion on churn.

Investigation `/mcp` stays query-only. The job runner is a dashboard/API scheduler using public search routes.

### C — No scheduler, webhook stays on-prem: Docker

A **container** whose process **is** the scheduler (`truss-mcp serve` + `restart: unless-stopped`). They still need Docker (or Compose/K8s). The agent must say that.

- `.env` on the host: `TRUSS_API_KEY`, `DISCORD_WEBHOOK_ALERTS`
- Config: env **names** only (`webhookUrlEnv`)
- `run-job` inside the image = **test once**, not the product

No git clone. No Node toolchain on the SOC laptop as the install story.

---

## What they still do internally

| Always | Discord: create/use a channel, create incoming webhook, copy URL. |
|--------|---------------------------------------------------------------------|
| Path A | Paste Truss API key + webhook into Zapier (or their tool). Turn the Zap on. |
| Path B | Paste webhook into Truss dashboard (encrypted). Approve Truss posting. |
| Path C | Paste webhook + API key into Docker `.env`. Run the compose/stack. |

---

## Additional development

### Already shipped (kernel)

| Piece | Where | Notes |
|-------|--------|--------|
| Five investigation tools + OAuth | `truss-api` `/mcp` | Narrowing Q&A |
| Discord adapter + `metadata` formatter | this repo | For path C (and formatting reference) |
| Env-ref jobs + `serve` / `run-job` / `doctor` | this repo | Path C runtime; `run-job` = test |
| `run_job_now` | local stdio only | Test by **job name**; [09](../local-agent-mcp/09-run-job-now.md) |

### Must add — Server MCP (`truss-api`)

| Work | Why |
|------|-----|
| Instructions for this prompt | Clarify intel → ask scheduler → branch; do not dump 50 products or tell them to clone |
| `get_discord_delivery_setup` (illustrative) | Returns **Zapier (v1)** steps + exact Truss HTTP (URL, header, FilterQL, cadence) + Discord webhook click-path. Optional stubs: “Truss-hosted” vs “Docker compose” |
| Later packs | Make / n8n / Tines as extra artifacts, not a new investigation catalog |

Do **not**: `push_to_discord` on hosted `/mcp`, or take webhook URLs as **tool arguments** (dashboard form for path B only).

### Must add — dashboard / API (path B)

| Work | Why |
|------|-----|
| Encrypted webhook store + allowlist | Chat-only vault |
| Hourly job runner | Public `POST /product/search` → Discord POST; no LLM |
| Test post + rotate/delete | They confirm the channel |

### Must add — this repo (path C)

| Work | Why |
|------|-----|
| Docker image with `serve` | The scheduler; not a Git repo |
| Compose example (secret-free) | `restart: unless-stopped`, env file mount |
| Example JSON names | `jobs.example.json` / `connections.example.json` |

### Optional

| Work | Why |
|------|-----|
| Dashboard chat as this agent | Type the prompt in Truss without attaching MCP |
| More scheduler recipes | After Zapier is green |

### Do not add for this MVP

- Git-clone / `npm install -g .` as a customer path
- `run-job` as the way to run **every hour**
- Slack/Teams (same branches, later)
- Discord Bot gateway (incoming webhook is enough)
- Growing local FilterQL search tools
- Hosting Splunk HEC “because we hosted Discord”

---

## Suggested build order

1. Server MCP instructions + **Zapier** blessed recipe (path A). Prove the prompt with no Truss daemon.
2. More informational recipes (Make, n8n, Tines).
3. **Docker** image for `serve` (path C) for on-prem.
4. **Truss-hosted** Discord jobs (path B) when we accept chat webhooks in the dashboard.
5. Slack/Teams as copies of this branching.

---

## Success

A Growth+ user says the canonical prompt in an assistant that already has Server MCP (or later dashboard chat). They narrow malware with the model. They are asked how they schedule HTTP today.

- If Zapier (or later: n8n/…): they turn on a Truss-authored Zap and see posts in Discord. No clone, no `truss-mcp`.
- If nothing: they either paste a webhook into Truss and get hourly posts, **or** run a documented Docker stack with `.env`.

They did not write FilterQL by hand. They were not told to download this repo.

---

## Out of scope

Splunk HEC: [02-splunk-job](./02-splunk-job.md) (do not assume hosted HEC tokens just because path B exists for Discord). TAXII/Sentinel: [11](../local-agent-mcp/11-optimal-customer-product.md).
