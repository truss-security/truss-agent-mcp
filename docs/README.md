# Reference documentation

Technical reference for the Truss MCP server and public API integration.

Read in order for a full picture, or jump to the topic you need.

## Index

| # | Doc | Contents |
|---|-----|----------|
| 01 | [reference-server-architecture.md](./01-reference-server-architecture.md) | Local MCP process model, stdio transport, env, errors |
| 02 | [public-api-contract.md](./02-public-api-contract.md) | Routes, auth, rate limits (public API tier) |
| 03 | [filterql-for-llms.md](./03-filterql-for-llms.md) | FilterQL grammar, operators, workflow for host LLMs |
| 04 | [mcp-tool-catalog.md](./04-mcp-tool-catalog.md) | Seven MCP tools, parameters, response shape |
| 05 | [hosted-mcp-oauth-architecture.md](./05-hosted-mcp-oauth-architecture.md) | Hosted MCP at `www.truss-security.com/mcp`, OAuth, subscription tiers (proposal) |

## Local MCP (shipped today)

Docs **01–04** describe the npm `truss-mcp` package: stdio server, API key auth, and the seven tools.

## Hosted MCP (proposed)

Doc **05** describes the remote MCP endpoint on Supabase — OAuth, tier gating, and partner integrations (Panther, Sumo, etc.).

## Guides

Install and usage walkthroughs: [../guides/](../guides/)

## External

- [Truss SDK](https://truss-security.github.io/truss-docs/data/sdk)
- [Truss API](https://truss-security.github.io/truss-docs/data/api)
- [OpenAPI (public tier)](https://github.com/truss-security/truss-docs/blob/main/openapi/trussapi.json)
