# truss-agent-mcp documentation

Reference documentation for the Truss MCP server and public API integration tier.

| Document | Description |
|----------|-------------|
| [01-vision.md](./01-vision.md) | Product positioning: truss-agent vs truss-agent-mcp vs CTI parser MCP |
| [02-public-api-contract.md](./02-public-api-contract.md) | Routes, auth, rate limits, public vs admin endpoints |
| [03-filterql-for-llms.md](./03-filterql-for-llms.md) | FilterQL grammar and NL→FilterQL guidance for host LLMs |
| [04-mcp-tool-catalog.md](./04-mcp-tool-catalog.md) | MCP tool names, parameters, and server instructions |
| [05-reference-server-architecture.md](./05-reference-server-architecture.md) | stdio transport, env, errors, response shaping |
| [06-api-roadmap.md](./06-api-roadmap.md) | Planned Truss API, SDK, and MCP capabilities (not yet shipped) |

## Guides (task-oriented)

See [../guides/](../guides/) for install and client setup walkthroughs.

## External references

- [Truss SDK docs](https://truss-security.github.io/truss-docs/data/sdk)
- [Truss API guide](https://truss-security.github.io/truss-docs/data/api)
- [OpenAPI (public tier)](https://github.com/truss-security/truss-docs/blob/main/openapi/trussapi.json)
- npm: `@truss-security/truss-sdk`, `@truss-security/truss-agent-mcp`
