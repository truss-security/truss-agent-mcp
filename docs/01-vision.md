# Vision: Truss AI data access

## One search engine

`POST /product/search` with **FilterQL** (`filterExpression`) is the core engine behind the Truss dashboard, saved reports, [truss-agent](https://github.com/truss-security/truss-agent) jobs, STIX exports, and third-party integrations. The MCP server exposes that same contract to AI assistants on demand.

## Three complementary surfaces

| Surface | Repo | Trigger | Primary output |
|---------|------|---------|----------------|
| **truss-agent** | truss-agent | Cron / interval | Webhooks (Discord, Slack, Teams) |
| **truss-mcp** | truss-agent-mcp (this repo) | MCP host or `truss-mcp search` REPL | JSON / STIX in chat or terminal |
| **CTI Parser MCP** | truss-ai-parsingbot | `extract_cti(url)` | Structured CTI from a URL (ingestion, not DB search) |

## Design choice: public API tier only

Customer API keys (`community`, `search`, `user`) may call:

- `POST /product/search`
- `POST /product/search/stix`
- `GET /product/{id}/stix`

They **cannot** call admin-only routes such as `/search/smart`, `/search/vector`, or native `GET /product/{id}` JSON. See [02-public-api-contract.md](./02-public-api-contract.md).

**Natural language → data:** the host LLM (Cursor, Claude, etc.) turns the user’s question into FilterQL. MCP tools validate and execute searches—Truss does not run OpenAI on the customer key for smart search in this model.

## Who this is for

- Security engineers wiring Truss into AI-assisted investigation workflows
- Builders who want citation-friendly product summaries in chat
- Teams already using FilterQL on the dashboard and want the same queries in MCP

## Who should use truss-agent instead

- Unattended alerting to chat channels on a schedule
- No LLM in the loop; push formatted IOC/metadata/report bundles to webhooks

See [../guides/truss-agent-vs-mcp.md](../guides/truss-agent-vs-mcp.md).

## Roadmap (planned, not shipped)

v1 intentionally uses **FilterQL + STIX** on the public tier. Planned Truss API and MCP follow-ons include **quota visibility**, **contributor product POST**, **smart/similar search** for eligible keys, and **native product GET by id**. Details and future tool names: [06-api-roadmap.md](./06-api-roadmap.md).
