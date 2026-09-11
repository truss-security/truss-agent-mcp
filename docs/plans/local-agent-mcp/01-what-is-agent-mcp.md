# What is Truss Agent MCP?

**Status:** Planning — why this repo exists, and what it is not  
**Audience:** Truss engineering  
**This document:** product split and rationale only. Implementation belongs in later docs in this folder.

Truss should ship **two MCP products**, not two copies of the same one.

| Product | Where it runs | Job |
|---------|---------------|-----|
| **Truss Server MCP** | Truss API: `https://api.truss-security.com/mcp` | Structured threat-intel investigation |
| **Truss Agent MCP** | Customer machine (this repo) | Local actions that need customer secrets and internal systems |

Agent MCP must **know about** Server MCP (how to query Truss, which tools exist, how auth works). It must **not re-implement** Server MCP.

---

## 1. Truss Server MCP (not this repo)

Owned by **truss-api**. Public story lives in **truss-docs**.

- Endpoint: `POST /mcp` (Streamable HTTP, JSON response mode)
- Auth: OAuth 2.1 (recommended) or `x-api-key`
- Eligibility: Growth+ (Community denied)
- Tools: `lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`
- Backing: in-process public product search / STIX — the same capabilities as the public REST API
- Metering: Truss-side quotas on `tools/call`

Server MCP is the **canonical investigation surface**. Cursor, Claude, registries, and partner agents should connect here. It does not hold Discord webhooks, SIEM tokens, or any other customer destination credentials. It does not push into customer infrastructure.

This package may document how to *call* that endpoint (configs, `validate-remote`, doctor). It does not host it.

---

## 2. Truss Agent MCP (this repo)

A **local** MCP server (and related CLI) that runs where the customer already keeps internal credentials.

Users will want an agent that can take Truss intel and do something with it **on their side of the network**:

- Post a digest to a Discord / Slack / Teams channel (webhook stays on their laptop or SOC host)
- Push IOCs into a local or VPC SIEM
- Upload indicators to EDR, open a SOAR case, update an NGFW EDL
- Run those flows on a schedule without an analyst in the loop

Those secrets cannot live in Truss cloud. That is the only durable reason for a second MCP process.

Agent MCP is therefore:

1. An **MCP client** of Server MCP (or, if needed, of public REST) for *pulling* intel
2. An **MCP server** of local tools for *connections, jobs, and push*
3. Optionally a long-running **scheduler** (`serve`) using the same local config and env

It is not “Truss search, but stdio.”

---

## 3. Why a local copy of Server MCP does not belong here

This repo today also ships a **local stdio query MCP** (`truss-mcp mcp`): seven FilterQL/STIX tools over `@truss-security/truss-sdk` and `TRUSS_API_KEY`. Docs call that “legacy / air-gap.” That framing is misleading.

```
Host  ──stdio──►  truss-mcp mcp  ──REST + API key──►  Truss API
Host  ──HTTP───►  api.truss-security.com/mcp  ──OAuth or API key──►  same data
```

Both paths require network access to Truss and a credential. Local stdio does not cache a corpus, does not work offline, and does not avoid keys. “Air-gap” here only means “the MCP host speaks stdio to a process on the laptop,” not “Truss data stays on-prem.”

Keeping that surface as a product costs:

- Two investigation catalogs, two instruction sets, two test suites
- Incomplete overlap (hosted has `lookup_ioc` and `get_product`; local has FilterQL helpers)
- Confused identity: README and registry configs already tell hosts to use the **hosted** URL, while this package still ships a parallel query server

Objections that look like reasons to keep it do not hold:

| Claim | Why it fails |
|-------|----------------|
| Offline / air-gap | Search still calls `POST /product/search`. No local Truss corpus. |
| Avoid OAuth | Hosted `/mcp` already accepts `x-api-key`. |
| Stdio-only MCP hosts | A generic bridge (`mcp-remote`) can point stdio at the hosted URL. Truss does not need its own query server for transport. |
| CLI REPL needs local tools | `truss-mcp search` can already sit on hosted tools via a saved OAuth token. |
| Richer FilterQL helpers | Valid as **local client helpers** (validate grammar, list attributes). Not a reason to re-implement search and STIX. |

**Decision:** Server MCP is the only investigation tool surface. Do not maintain a second search/STIX MCP in this repo. If a host cannot speak remote MCP, the answer is “bridge to `https://api.truss-security.com/mcp`,” not “install a Truss query server that still uses your API key.”

Existing `truss-mcp mcp` query tools may linger only as a short deprecation path for configs already in the wild — not as a peer product.

---

## 4. What belongs in Agent MCP

Things that **must** run on the customer machine because Truss must not hold the secret or the network path:

- Named **connections** to chat, SIEM, EDR, SOAR, NGFW (and similar)
- Secrets in **host env / `.env` only**; config JSON stores env *names*, never raw tokens
- **Jobs and schedules** that pull from Truss and push to those connections
- MCP tools to list/upsert/enable connections and jobs, healthcheck, run-now, and ad-hoc push
- A daemon (`truss-mcp serve`) that executes schedules without an LLM in the loop
- Doctor / init that validates **destination** env refs as well as Truss access
- Optional local helpers that never fetch products (FilterQL validate/list against SDK grammar)

Pulling intel still requires a Truss credential (OAuth token or API key). That is expected. The point of locality is the **egress** credential and the **internal** system, not the Truss query itself.

---

## 5. What does not belong in Agent MCP

- A second catalog of investigation tools that duplicate Server MCP (`search_threats`, `lookup_ioc`, product JSON, STIX search/get)
- Hosting, metering, or OAuth consent for `/mcp` (truss-api + dashboard)
- Customer webhook URLs or SIEM/EDR tokens in Truss cloud, tool arguments, logs, or committed JSON
- Admin Truss routes (`/search/smart`, `/search/vector`, writes, `pg-query`, …)
- Partner/registry listings that present **this package** as the Truss investigation MCP (those point at Server MCP)
- Treating “legacy stdio search” as the recommended Cursor/Claude setup

Agent MCP may **call** Server MCP. It should not **be** Server MCP.

---

## 6. Intended host setup

```
MCP host (Cursor / Claude / custom agent)
    │
    ├─► Truss Server MCP     investigation (OAuth or API key)
    │     https://api.truss-security.com/mcp
    │
    └─► Truss Agent MCP      local destinations (this package, stdio)
          Discord / SIEM / EDR / SOAR / NGFW
          secrets in local env
```

Operators explore in Server MCP, then ask Agent MCP to push or to persist a job. One local process holds their Discord/SIEM configuration. Truss never proxies those credentials.

---

## 7. Current repo vs this definition

Today this package is a **hybrid**: client/doctor for Server MCP **plus** a duplicate local query MCP. Destination push still lives in **truss-agent**. That mix is why the repo feels like “two things.”

Target: this repo **is** Agent MCP. Server MCP stays in truss-api. Interactive retrieval is not this package’s product. Local delivery is.

---

## Related

- Plan index: [README.md](./README.md)
- [AGENTS.md](./AGENTS.md) — freeze rules for new work
- [02-identity-freeze](./02-identity-freeze) · [03-dual-server-host](./03-dual-server-host) · [04-migration-phases](./04-migration-phases)
- Phase 2: [05-config-and-secrets](./05-config-and-secrets.md) · [06-how-intel-is-pulled](./06-how-intel-is-pulled.md) · [07-chat-and-serve](./07-chat-and-serve.md)
- Future: [08-cloud-served-agent-config](./08-cloud-served-agent-config.md)
- Server MCP (API): `truss-api/documentation/architecture/mcp.md`
- Server MCP (public): `truss-docs/docs/data/mcp.md`
- Destination matrix (older plan, still useful for *what* to push): [../../07-unified-agent-delivery-architecture.md](../../07-unified-agent-delivery-architecture.md)
