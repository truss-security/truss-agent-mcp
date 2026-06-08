# Getting started

## Prerequisites

- Node.js 18+
- A Truss API key with access to product search (from the Truss dashboard)
- An MCP-capable host (Cursor, Claude Desktop, VS Code, etc.)

## Install

From npm (after publish):

```bash
npx -y @truss-security/truss-agent-mcp
```

From source:

```bash
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp
npm install
npm run build
node dist/cli.js
```

## Environment

Copy `env.example` to `.env` or set variables in your MCP host config:

```bash
TRUSS_API_KEY=your_key_here
TRUSS_API_URL=https://api.truss-security.com
```

Optional caps:

```bash
TRUSS_MCP_MAX_LIMIT=50
TRUSS_MCP_MAX_PAGES=3
```

## Configure your MCP host

- [Cursor](./client-setup-cursor.md)
- [Claude Desktop](./client-setup-claude-desktop.md)

## Try a query

Ask your assistant:

> Search Truss for ransomware affecting healthcare in the last 30 days.

The host should call `validate_filter_expression` then `search_products` with something like:

```
category = "Ransomware" AND industry = "Healthcare"
```

and `days: 30`.

## Next steps

- [FilterQL cookbook](./filterql-cookbook.md)
- [truss-agent vs MCP](./truss-agent-vs-mcp.md)
- [MCP acceptance checklist](./mcp-acceptance.md)
- [Documentation index](../docs/README.md)
- [Truss API roadmap](../docs/06-api-roadmap.md) — planned quota, contributor POST, smart search, and product GET (not yet shipped)
