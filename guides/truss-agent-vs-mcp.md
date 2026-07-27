# truss-agent vs truss-agent-mcp

They solve different problems. Prefer **hosted MCP** for interactive retrieval.

## truss-agent (scheduled distribution)

- **Runs continuously** with cron or interval schedules
- **Pulls** products matching saved filters
- **Pushes** formatted output to Discord, Slack, or Microsoft Teams webhooks
- **No LLM** in the loop
- Best for: SOC alerting, daily digests, channel notifications

Repo: [truss-security/truss-agent](https://github.com/truss-security/truss-agent)

## truss-agent-mcp (interactive retrieval + CLI host)

- **Hosted MCP (primary):** Cursor, Claude Desktop, and registries connect to `https://api.truss-security.com/mcp` with OAuth (Growth+; dashboard consent). Five tools: `lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`.
- **`truss-mcp search`:** embedded host using those same five tools, plus your LLM for coaching and post-processing (detection rules, IOC cleanup, knowledge answers).
- **Local stdio (legacy / air-gap):** seven FilterQL tools over REST with `TRUSS_API_KEY`.
- Best for: ad-hoc investigation in Cursor/Claude, terminal research, partner MCP integrations

Repo: [truss-security/truss-agent-mcp](https://github.com/truss-security/truss-agent-mcp) (this repo)

## Using both

1. Use **MCP** (host or `truss-mcp search`) to explore what you care about.
2. Copy a durable filter into a **truss-agent** connection or dashboard agent job for scheduled delivery.

## Shared behavior

- Hosted path: OAuth + API metering on `/mcp` (Truss API service).
- Legacy stdio: same `POST /product/search` payload rules as other REST clients (see `src/lib/build-product-search-payload.ts`).

## Not covered by either

- Ingesting CTI from arbitrary URLs into Truss (separate ingest tooling)
- Admin-only vector/smart search on customer keys → not available via public MCP
