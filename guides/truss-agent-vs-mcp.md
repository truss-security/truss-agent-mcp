# truss-agent vs truss-agent-mcp

Both use the Truss public API and FilterQL. They solve different problems.

## truss-agent (scheduled distribution)

- **Runs continuously** with cron or interval schedules
- **Pulls** products matching saved filters
- **Pushes** formatted output to Discord, Slack, or Microsoft Teams webhooks
- **No LLM** in the loop
- Best for: SOC alerting, daily digests, channel notifications

Repo: [truss-security/truss-agent](https://github.com/truss-security/truss-agent)

## truss-agent-mcp (interactive retrieval)

- **Runs on demand** when an AI host invokes a tool
- **Returns** JSON summaries or STIX to the conversation
- **Requires** the host LLM to build FilterQL (with validation tools)
- Best for: ad-hoc investigation, research in Cursor/Claude, building custom agents

Repo: [truss-security/truss-agent-mcp](https://github.com/truss-security/truss-agent-mcp) (this repo)

## Using both

1. Use **MCP** to explore filters and validate what you care about.
2. Copy the `filterExpression` into a **truss-agent** connection or dashboard agent job for scheduled delivery.

## Shared behavior

- Same `POST /product/search` payload rules (see `src/lib/build-product-search-payload.ts`; keep in sync with truss-agent’s homonymous module).
- Same API key header and usage-plan rate limits.

## Not covered by either

- Ingesting CTI from arbitrary URLs → CTI Parser MCP in truss-ai-parsingbot
- Admin-only vector/smart search on customer keys → not available in truss-agent-mcp v1
