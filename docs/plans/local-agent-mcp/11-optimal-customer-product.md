# Optimal customer product — Truss intel in their systems

**Status:** North star for *how customers should get Truss into production*. Not an implementation spec.  
**Audience:** Truss engineering  
**Supersedes (for customer-product questions):** [10-customer-path](./10-customer-path.md) and operator UX in [../../07-unified-agent-delivery-architecture.md](../../07-unified-agent-delivery-architecture.md).  
**Does not replace:** public API boundary, “no destination secrets in Truss cloud,” or Server MCP as the investigation catalog.

Prior docs are **current thinking**, not the destination:


| Prior doc                                                  | What to keep                                                                    | What this plan drops                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [01](./01-what-is-agent-mcp.md)                            | Server MCP ≠ Agent; do not re-implement search                                  | Treating “clone this repo + `serve`” as *the* product                           |
| [docs/07](../../07-unified-agent-delivery-architecture.md) | Env-ref secrets, `serve`, destination *kinds* (chat / SIEM / EDR / SOAR / NGFW) | Keep local search tools; Truss owns 20+ vendor SDKs before customers can ingest |
| [10](./10-customer-path.md)                                | Headless `serve` exists                                                         | Git clone + Node toolchain as the default install                               |


---

## 1. What we want Truss to be

Truss is a **core source of threat intelligence**. Customers should be able to **ask questions of that data** and then have **an agent actually wire it into their world**: Discord, Slack, Splunk, Sentinel, EDR, NGFW EDLs, SOAR — including the boring setup, not only the query.

That is two jobs:

1. **Query** — structured intel (search, IOC lookup, STIX). Already Server MCP + REST + dashboard.
2. **Act / integrate** — stand up delivery and keep it running. This is the gap. Today we ask a human to clone a repo, edit JSON, and run a process. The intended experience is: **an AI does that work**.

SOC buyers will not live in this Git repo.

---

## 2. Design constraints (keep)

These stay true even if packaging and UX change:

- Truss cloud does **not** store Discord webhooks, HEC tokens, EDR API keys, or NGFW credentials, and does **not** POST to customer infra from `https://api.truss-security.com/mcp`.
- Enrichment stays on public routes (`/product/search`, STIX). No admin-route tools.
- Production delivery must run **without an LLM in the loop** (schedulers do not need a model).
- IOC-safe defaults; indicators opt-in.

The mistake in earlier plans was collapsing “AI needs tools” with “the customer’s daily driver is this npm package.”

---

## 3. Optimal shape: three ways to consume, one intel core

Customers do not all want a daemon. Offer **modes**, in this order of preference for *their* outcome:

```
                    ┌─────────────────────────────────────┐
                    │  Truss core (dashboard + REST +     │
                    │  Server MCP + later TAXII/STIX feed)│
                    └─────────────────────────────────────┘
                         │              │              │
                         ▼              ▼              ▼
                   A. They pull    B. Local runtime   C. AI control plane
                   (no Truss       (secrets +         (any agent that
                    software)       schedule)          speaks MCP)
```

### A — They pull (default for “across our SIEM/EDR/OpenCTI”)

Ship intel the way SOCs already ingest vendors: **TAXII 2.1 / STIX collections** and a stable REST/JSON feed, plus a short “paste this into Splunk/Sentinel/OpenCTI” guide.

- Secrets: Truss API key lives in **their** SIEM/TIP, not in a Truss agent.
- No `git clone`. No Node toolchain on the SOC host.
- AI’s job (dashboard or their existing assistant): generate the connector snippet, TAXII URL, saved-search, EDL object — not maintain a Falcon SDK in this repo.

This is how Recorded Future / Mandiant / MISP-shaped products usually land. Truss should not skip it because we like agents.

### B — Local runtime (when they want *us* to push, or they have no native pull)

A **packaged collector** on a machine they control: Discord/Slack webhooks, Splunk HEC, “publish an EDL list for the firewall to poll,” jobs and schedules.

- Install: **Docker image** (or later signed `rpm`/`deb`/`msi`). Not a GitHub clone. `docker compose up` + `.env`.
- Runtime: `truss-mcp serve` (same idea as today). LLM optional.
- Config: env-ref JSON as now (`webhookUrlEnv`, not inline URLs).
- AI’s job: **write** that compose file, `.env` template, and jobs — then they paste secrets locally and start the container.

This is the honest descendant of docs/07 `serve` and doc 10, with production packaging.

### C — AI control plane (setup and change, not 24/7)

Any agent that can call MCP should be able to **query Truss** and **change delivery** (create a Discord job, test a connection, run now).

- **Query tools** live on **Server MCP** (hosted). One catalog.
- **Act tools** live only where secrets exist: the **local runtime** exposing MCP (stdio or local HTTP), *or* a future dashboard agent that emits secret-free config and never sees webhook values.
- Hosts are whatever MCP client they already use (desktop assistants, Copilot, an internal SOC bot, `truss-mcp search`). None of these is required for A or B.

AI **sets up and runs** in the sense: it authors config, validates env names, starts/reloads the collector, and can fire `run_job_now`. It does not have to sit in the path of every hourly Discord post.

---

## 4. Where the AI actually runs


| Place                                  | Role                                                                                                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Truss dashboard agent** (build this) | Guided “connect my environment.” Asks Discord vs Splunk vs TAXII. Emits compose, `.env` template, TAXII instructions, MCP snippets. Never asks them to paste webhooks *into Truss*. |
| **Customer’s existing AI**             | Connects to Server MCP (OAuth) to investigate. If they also run the local runtime, attach it as a second MCP server to let the same chat configure jobs.                            |
| **Local runtime**                      | Executes. May expose MCP for C. Runs `serve` with no model.                                                                                                                         |


`truss-mcp search` (REPL with an LLM) can stay as a **technician tool**. It is not how a SOC deploys.

---

## 5. What Truss should build vs what AI should generate

**Truss owns (product, tested, metered):**

- Intel APIs: search, IOC, STIX, **TAXII** (new)
- Server MCP (investigation)
- Dashboard + a setup agent that outputs secret-free artifacts
- Local runtime: scheduler, env-ref config, doctor, a **small** adapter set that is painful to DIY
- Packaging: container (then OS packages)

**First adapters Truss should actually maintain** (high leverage, dumb HTTP):

- Chat: Discord, Slack, Teams webhooks
- SIEM: Splunk HEC (and maybe one Sentinel ingest path)
- NGFW: **pull-mode EDL** (host a list; firewall polls) — matches how EDLs work and avoids 5 NGFW SDKs on day one

**AI + docs generate (do not staff 26 vendor SDKs first):**

- Splunk TA / Sentinel data connector / OpenCTI connector pointing at TAXII or REST
- Cortex XSOAR / Tines / Torq stories that `GET` Truss or receive a webhook *they* host
- Falcon / MDE / PAN-OS API snippets when the customer already has those consoles

docs/07’s matrix is a **catalog of destinations we care about**, not a promise that this repo contains every SDK. Native vendor adapters (Falcon IOC API, Panorama XML, …) are **later**, when a customer cannot pull and will pay for push.

---

## 6. Default customer journeys

Journey write-ups live under [`docs/plans/customer-journeys/`](../customer-journeys/). This section is the index.

| Journey | Canonical prompt | Doc |
|---------|------------------|-----|
| Hourly Splunk (HEC) — **SIEM MVP** | “Pipe new Truss products into Splunk every hour.” | [02-splunk-job](../customer-journeys/02-splunk-job.md) |
| Discord malware channel | “Create a Discord channel that posts new malware” | [01-discord-channel](../customer-journeys/01-discord-channel.md) |

### Splunk — hourly HEC job

Same branching as Discord: ask what already schedules HTTP (**Splunk scripted input / SOAR** first, then Zapier). If nothing: **Docker** collector. No git clone; no Truss-hosted HEC in this MVP. **[02-splunk-job](../customer-journeys/02-splunk-job.md)**.

### Later — they pull (Sentinel / OpenCTI / TAXII)

1. Issue a Truss feed credential (API key or TAXII user) for this customer.
2. Return the TAXII (or REST) URL, collection id, and connector fields for their SIEM.
3. Create the TAXII/threat-intel connector **in Sentinel** (or OpenCTI). No Truss process on-box.

**Can their AI do that?** Yes for (1) and (2) once Truss exposes **user-scoped setup tools** on Server MCP / the dashboard agent. (3) is Microsoft’s (or Splunk’s) control plane — Truss should not call Azure. The same chat can still *finish* (3) if that host is also attached to Azure/Sentinel tools (Copilot, Azure MCP, `az`). Two servers, one prompt.

A generic chat box does **not** know about Truss. The sentence only works in a host that already has Truss tools (and the user signed in).

**Where they type**


| Place                                                            | How it knows Truss                                                                                                                                                             | Typical customer                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| **Truss dashboard chat** (build this)                            | Pre-wired. They are logged into Truss. No MCP config.                                                                                                                          | Default. “Connect my environment” lives here. |
| **Their existing assistant** (Claude, Copilot, internal SOC bot) | One-time: add Server MCP `https://api.truss-security.com/mcp` and complete OAuth. The host then lists Truss tools; the model sees descriptions like `provision_my_intel_feed`. | They already live in that assistant.          |
| **ChatGPT / Claude with no Truss connection**                    | It doesn’t. Training data ≠ their account. It can only guess public docs.                                                                                                      | Not this journey.                             |


Step (3) is the same idea for Microsoft: the host must also have Azure/Sentinel tools, *or* they paste. Truss OAuth does not grant Azure.

**Once, not every prompt:** connect Truss (dashboard session or MCP + OAuth). After that, “Put Truss malware intel into my Sentinel workspace” is a normal chat turn. The model does not magically discover Truss from the word “Truss.”

```
Customer: “Put Truss malware intel into my Sentinel workspace.”

Host
  ├─ Truss Server MCP (OAuth as the Truss user)
  │    provision_my_intel_feed / get_my_taxii_collection
  │    → URL, collection, username; password or key shown once
  │
  └─ Azure / Sentinel tools (OAuth as the Azure user)   [optional]
       create Threat Intelligence TAXII connector
       → workspace, server URL, collection, credentials from step 1
```


| Step | AI alone (today)                      | AI with Truss setup tools                                              | AI with Truss **and** Sentinel/Azure tools                  |
| ---- | ------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1    | Link to dashboard; human clicks       | Tool issues **their** Truss feed credential (not a destination secret) | Same                                                        |
| 2    | Hallucination risk without a live URL | Tool returns real URL + Sentinel field map                             | Same                                                        |
| 3    | Written runbook / ARM they apply      | Same (Truss cannot write Azure)                                        | Tool creates the connector; human approves the Azure action |


`POST /api-key/create` stays **admin**. Do not expose that as a public MCP tool. The hosted tool is “issue **my** feed credential” behind the same Growth+ OAuth as investigation — equivalent to the dashboard API-key page, not the admin key API.

Truss still never stores a Sentinel shared key or workspace secret. Azure credentials stay in Microsoft. If the host has no Azure tools, the AI stops after (2) and they paste — still better than a Git clone.

Splunk MVP is HEC, not TAXII: [02-splunk-job](../customer-journeys/02-splunk-job.md). OpenCTI still wants a pollable collection (TAXII or a REST connector they host).

**Gap vs shipped Server MCP** (`truss-api` `documentation/architecture/mcp.md`): `/mcp` is investigation plus one setup recipe — `lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`, and `get_discord_delivery_setup` (Zapier-only Discord pack; no webhook args, no Discord POST). OAuth or `x-api-key`, no LLM. Dashboard **Auto** chat hosts that same catalog in-process (logged-in session). Make/n8n/Tines and Splunk recipes are not shipped. Dashboard Threat/Knowledge/Both modes remain smart search + doc RAG. STIX v1 is request/response REST+MCP, not TAXII collections (called out as a later effort in STIX architecture). `POST /api-key/create` is admin-only. Connecting an assistant to `https://api.truss-security.com/mcp` still lets them *query* Truss and emit a Zapier Discord recipe, not stand up a SIEM feed.


| Need for this journey                                                           | Shipped? | Work                                                                                       |
| ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| MCP URL + OAuth so *their* assistant can call Truss                             | Yes      | None for the door                                                                          |
| Dashboard chat that is this setup agent                                         | Yes      | Auto mode hosts Server MCP catalog; Threat/Knowledge/Both remain RAG                       |
| TAXII 2.1 collections Sentinel/OpenCTI can poll                                 | No       | New API surface; STIX mapper can feed it                                                   |
| User-scoped `provision_my_intel_feed` / `get_my_taxii_collection` on Server MCP | No       | New tools; not admin `POST /api-key/create`                                                |
| Humans can copy an API key from `/api-key`                                      | Yes      | Covers a *REST* poll script, not Sentinel’s TAXII connector                                |
| Truss calls Azure to create the connector                                       | Must not | Customer’s Azure tools or paste                                                            |


Thinner alternative if TAXII slips: setup agent emits a Logic App / Splunk TA / OpenCTI HTTP connector that calls existing `POST /product/search/stix` with their key. Still new Truss+docs work; Sentinel’s native TAXII tile still will not light up.

### Discord — malware channel

Ask what can already fire HTTP on a timer (start with a **Zapier** recipe). If nothing: Truss-hosted Discord job **or** a Docker collector (`serve` in the image). No git clone; `run-job` is test-once. **[01-discord-channel](../customer-journeys/01-discord-channel.md)**.

### “I want the firewall to drop Truss bad IPs”

1. Prefer **EDL pull**: collector (or Truss-hosted *indicator list URL* if we ever ship a secret-free public list — separate security review) publishes IP/domain/URL text; PAN/Forti **polls**.
2. Setup agent prints the EDL object steps in *their* NGFW UI.
3. Push-to-Panorama API is a later adapter, not the first path.

### Dual MCP (query + local act)

Optional overlay, not the default install: Server MCP for investigation, local `truss-mcp mcp` for `run_job_now`. Same `.env` as [01](../customer-journeys/01-discord-channel.md).

---

## 7. Secrets and the dashboard agent

The dashboard agent can store **secret-free** bundles (connection names, FilterQL, `webhookUrlEnv: "DISCORD_WEBHOOK_ALERTS"`). That is [08](./08-cloud-served-agent-config.md), pulled forward as part of *setup*, not a far-future extra.

It must not:

- Accept a webhook URL into Truss
- Add `push_to_discord` on hosted Server MCP
- Pretend hosted MCP can “set up their SIEM” without either TAXII (they pull) or a local runtime (they push)

Customer pastes values only into `.env`, Docker secrets, or their SIEM’s credential store.

---

## 8. What this repo becomes

**Truss Agent** = the **local runtime** (B) + **act MCP tools** (C) + **artifact templates** the dashboard agent emits.

It is not:

- The investigation MCP (Server MCP / `truss-api`)
- A Git-first install for SOC
- A second FilterQL search catalog

Existing `run-job` / `serve` / Discord / `run_job_now` are the **kernel** of B and C. Keep them. Change the **default path** around them (container + dashboard setup agent + TAXII).

---

## 9. Phased path from today (optimal, not docs/07’s adapter waterfall)


| Phase  | Customer can…                                   | We build                                                                                                                                                          |
| ------ | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0** | Discord digest on a box they control            | What we have: env-ref JSON, `run-job`, `serve`, `run_job_now`. Package a **Docker image**. Fix example filenames. Stop telling customers to clone for production. |
| **P1** | Get Truss into a SIEM without our daemon        | TAXII or equivalent pull + dashboard “connect Splunk/Sentinel/OpenCTI” copy. Setup agent can be a scripted wizard before it is an LLM.                            |
| **P2** | AI-assisted setup                               | Dashboard (or `truss-mcp init` that is destination-aware) emits compose + `.env` template + job from a questionnaire. LLM optional.                               |
| **P3** | Their AI configures jobs                        | Act tools on local runtime only: list/upsert connection & job, `run_job_now`, test. Server MCP stays query.                                                       |
| **P4** | Slack/Teams; Splunk HEC push; EDL pull-mode     | Small adapter set. Still not 26 SDKs.                                                                                                                             |
| **P5** | Vendor-native push (Falcon, Panorama, XSOAR, …) | docs/07 matrix as a backlog, one adapter when a customer needs it.                                                                                                |


Do **not** wait on sunset of local search tools to ship P0–P1. Do **not** grow those search tools. Sunset when Server MCP + TAXII cover investigation and pull.

---

## 10. Success criteria

A design-partner SOC can:

1. Ask Truss a question in the **dashboard or any MCP host**.
2. Get new malware into **Discord within an hour** via a container and `.env`, no Git.
3. Get IOCs into **their SIEM** via pull (TAXII) without running our process.
4. Later, ask **their** AI to add a job or run one now, if they attached the local runtime.

If we only achieve (2) via `git clone`, we have built an internal tool, not a customer product.