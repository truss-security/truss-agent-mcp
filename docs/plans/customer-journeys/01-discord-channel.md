# Journey — Discord channel for new malware

**Status:** Chat MVP — Path A step 1 on Server MCP; dashboard Auto chat is an MCP host of the same catalog  
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
| Truss dashboard chat (Auto) | Logged-in session; same Server MCP catalog as `/mcp` |
| Their assistant (Claude, Copilot, SOC bot) | One-time: `https://api.truss-security.com/mcp` + OAuth |
| `truss-mcp search` | Token file or API key; technician tool |

Dashboard **AI Assistant** Auto mode hosts the same Server MCP tools (in-process). Threat Data / Knowledge Base / Both still use smart search and doc RAG. `/assistant/query` is the chat entry; it does not speak MCP JSON-RPC.

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

- Start with blessed recipes for **Zapier, Make, n8n, and Tines**. HTTP on a schedule → `POST /product/search` with `x-api-key` → Discord Incoming Webhook. Pass `scheduler` on `get_discord_delivery_setup`.
- A connected LLM will invent Truss URLs without that pack. Torq, GitHub Actions, and Power Automate are not packed; reuse the same Truss HTTP if asked.

They paste `TRUSS_API_KEY` and the Discord webhook into **Zapier** (or equivalent), not into Truss.

### B — No scheduler: Truss hosts the hook

Dashboard (not Server MCP `push_to_discord`): they paste an allowlisted `https://discord.com/api/webhooks/…` URL. Truss encrypts it, runs the hourly search, POSTs embeds. Confirm with a one-shot test post they see in-channel. Easy rotate/delete.

This **is** storing a destination secret. Acceptable for **chat** MVP; do not casually do the same for Splunk HEC. Mitigations: KMS, never log the token, allowlist Discord hosts (SSRF), deletion on churn.

Investigation `/mcp` stays query-only. The job runner is a dashboard/API scheduler using public search routes.

### C — No scheduler, webhook stays on-prem: Docker

A **container** whose process **is** the scheduler. They still need Docker (or Compose/K8s). The agent must say that.

Contract (this repo):

| Piece | Value |
|-------|--------|
| Dockerfile | Repo root. Multi-stage Node 20. Non-root user `truss`. No secrets in the image. |
| Entrypoint | `node dist/truss-cli.js` |
| Default command | `serve` (long-running interval). Compose `restart: unless-stopped` and `init: true` (SIGTERM stops the process). |
| One-shot test | `docker compose run --rm discord run-job discord-malware-hourly` |
| Compose | `deploy/discord/compose.yaml`. Local tag `truss-agent:local` via `build`. |
| Mount | `./config` → `/app/config` (read-only): `connections.json`, `jobs.json`, optional `agent.json` |
| Env file | `deploy/discord/.env` from `env.example`: `TRUSS_API_KEY`, `DISCORD_WEBHOOK_ALERTS` |
| Examples | `config/connections.example.json`, `config/jobs.example.json`, `config/agent.example.json` (also baked at `/usr/local/share/truss/examples/`) |
| Job in the example | `discord-malware-hourly`: `category = "Malware"`, metadata, every 60 minutes, window 60 minutes, `webhookUrlEnv` = `DISCORD_WEBHOOK_ALERTS` |

Empty Truss search logs `not posting` and does not POST. JSON stores env **names** only.

Kubernetes CronJob (later, same image): command `run-job discord-malware-hourly`, schedule outside the container. The Compose path stays the long-running `serve` process.

`build` in this repo’s compose file is for engineering checkouts. The customer recipe is `image: ghcr.io/truss-security/truss-agent:1.1.0`. Hosted `get_discord_delivery_setup` accepts `scheduler=docker` and returns that compose file, JSON, and `.env` template. No webhook argument.

No git clone as the customer install story. No Node toolchain on the SOC laptop.

---

## What they still do internally

| Always | Discord: create/use a channel, create incoming webhook, copy URL. |
|--------|---------------------------------------------------------------------|
| Path A | Paste Truss API key + webhook into Zapier (or their tool). Turn the Zap on. |
| Path B | Paste webhook into Truss dashboard (encrypted). Approve Truss posting. |
| Path C | Copy example JSON into `deploy/discord/config/`. Paste webhook + API key into `deploy/discord/.env`. `docker compose up -d`. |

---

## Additional development

### Already shipped (kernel)

| Piece | Where | Notes |
|-------|--------|--------|
| Five investigation tools + OAuth | `truss-api` `/mcp` | Narrowing Q&A |
| Discord adapter + `metadata` formatter | this repo | For path C (and formatting reference) |
| Env-ref jobs + `serve` / `run-job` / `doctor` | this repo | Path C runtime; `run-job` = test |
| `run_job_now` | local stdio only | Test by **job name**; [09](../local-agent-mcp/09-run-job-now.md) |

### Server MCP (`truss-api`)

| Work | Why |
|------|-----|
| Instructions for this prompt | Clarify intel → ask scheduler → branch; do not dump 50 products or tell them to clone. **Done** on hosted `/mcp`. |
| `get_discord_delivery_setup` | **Done** — Zapier, Make, n8n, Tines; `scheduler` + FilterQL + interval; no webhook args |
| Later packs | Torq, GitHub Actions, Power Automate — reuse the same Truss HTTP |

Do **not**: `push_to_discord` on hosted `/mcp`, or take webhook URLs as **tool arguments** (dashboard form for path B only).

### Must add — dashboard / API (path B)

| Work | Why |
|------|-----|
| Encrypted webhook store + allowlist | Chat-only vault |
| Hourly job runner | Public `POST /product/search` → Discord POST; no LLM |
| Test post + rotate/delete | They confirm the channel |

### This repo (path C) — in tree, not published

| Work | Where |
|------|--------|
| Docker image with `serve` | `Dockerfile` (local tag `truss-agent:local`) |
| Compose example (secret-free) | `deploy/discord/compose.yaml` + `env.example` |
| Example JSON names | `config/jobs.example.json`, `config/connections.example.json`, `config/agent.example.json` |

Hosted `get_discord_delivery_setup` with `scheduler=docker` returns this compose file, JSON, and env template. It still takes no webhook argument.

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

1. ~~Server MCP instructions + **Zapier** blessed recipe (path A).~~ **Done** in **truss-api**: `get_discord_delivery_setup` + server instructions.
2. ~~Dashboard chat as MCP host.~~ **Done**: Auto mode on `/assistant/query` uses the same catalog (search server + dashboard).
3. ~~More informational recipes (Make, n8n, Tines).~~ **Done**: `get_discord_delivery_setup` `scheduler` = `make` \| `n8n` \| `tines` (same Truss HTTP as Zapier).
4. ~~**Docker** image for `serve` (path C) for on-prem.~~ **In tree and published:** `ghcr.io/truss-security/truss-agent:1.1.0`. Hosted `scheduler=docker` returns the customer files.
5. **Truss-hosted** Discord jobs (path B) when we accept chat webhooks in the dashboard.
6. Slack/Teams as copies of this branching.

---

## Success

A Growth+ user says the canonical prompt in dashboard Auto chat or in an assistant that already has Server MCP. They narrow malware with the model. They are asked how they schedule HTTP today.

- If Zapier, Make, n8n, or Tines: they turn on the Truss-authored recipe and see posts in Discord. No clone, no `truss-mcp`.
- If nothing: they either paste a webhook into Truss and get hourly posts, **or** run a documented Docker stack with `.env`.

They did not write FilterQL by hand. They were not told to download this repo.

---

## Out of scope

Splunk HEC: [02-splunk-job](./02-splunk-job.md) (do not assume hosted HEC tokens just because path B exists for Discord). TAXII/Sentinel: [11](../local-agent-mcp/11-optimal-customer-product.md).
