# Reference documentation

Technical reference for the Truss MCP server and public API integration.

Read in order for a full picture, or jump to the topic you need.

## Index

| # | Doc | Contents |
|---|-----|----------|
| 01 | [reference-server-architecture.md](./01-reference-server-architecture.md) | Two surfaces; local stdio process model, env, errors |
| 02 | [public-api-contract.md](./02-public-api-contract.md) | Routes, auth, rate limits (public API tier) |
| 03 | [filterql-for-llms.md](./03-filterql-for-llms.md) | FilterQL grammar, operators, workflow for host LLMs |
| 04 | [mcp-tool-catalog.md](./04-mcp-tool-catalog.md) | Local stdio seven MCP tools |
| 05 | [hosted-mcp-oauth-architecture.md](./05-hosted-mcp-oauth-architecture.md) | Hosted MCP at `api.truss-security.com/mcp`, OAuth, Growth+ gate |
| 06 | [cross-repo-oauth-checklist.md](./06-cross-repo-oauth-checklist.md) | Dependent updates outside this package (API, dashboard, public docs) |

## Remote MCP (recommended for hosts)

Doc **05** is the source of truth for Cursor, Claude Desktop, and MCP registries: `https://api.truss-security.com/mcp` with OAuth. Registry listing: [../config/mcp-registry.json](../config/mcp-registry.json).

## Local stdio (legacy / air-gap)

Docs **01–04** describe the npm `truss-mcp mcp` path: stdio server, API key auth, and the seven FilterQL tools.

## Guides

Install and usage walkthroughs: [../guides/](../guides/)

## External

- [Truss docs (GitHub)](https://github.com/truss-security/truss-docs)
- [OpenAPI (public tier)](https://github.com/truss-security/truss-docs/blob/main/openapi/trussapi.json)
