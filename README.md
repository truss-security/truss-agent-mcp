# truss-agent-mcp

Official [Model Context Protocol](https://modelcontextprotocol.io) server for querying Truss threat intelligence from AI assistants (Cursor, Claude Desktop, VS Code, and other MCP hosts).

Uses the public Truss API tier: `POST /product/search` and STIX routes with **FilterQL**. Your host LLM translates questions into filters; this server validates and executes searches.

## Install

```bash
npx -y @truss-security/truss-agent-mcp
```

Requires Node.js 18+ and `TRUSS_API_KEY`.

## Quick MCP config

See [config/cursor.mcp.json](./config/cursor.mcp.json) or [config/claude_desktop_config.json](./config/claude_desktop_config.json).

## Documentation

| | |
|--|--|
| [docs/](./docs/) | Architecture, API contract, tool catalog |
| [docs/06-api-roadmap.md](./docs/06-api-roadmap.md) | Planned API, SDK, and MCP capabilities |
| [guides/](./guides/) | Getting started, client setup, FilterQL cookbook |
| [docs/huggingface/](./docs/huggingface/) | Hugging Face hub README template |

## Development

```bash
npm install
npm run build
TRUSS_API_KEY=... npm run dev
npm test
```

## Publish

```bash
npm run build
npm publish --access public
```

## Related projects

- [@truss-security/truss-sdk](https://www.npmjs.com/package/@truss-security/truss-sdk) — TypeScript API client
- [truss-agent](https://github.com/truss-security/truss-agent) — Scheduled pull → chat webhooks
- [Truss docs](https://truss-security.github.io/truss-docs/data/sdk)

## License

MIT
