# truss-agent-mcp

Official [Model Context Protocol](https://modelcontextprotocol.io) server for querying Truss threat intelligence — plus a **`truss` terminal CLI** powered by Claude.

Uses the public Truss API tier: `POST /product/search` and STIX routes with **FilterQL**.

## Two ways to use it

| Surface | Command | Best for |
|---------|---------|----------|
| **Terminal CLI** | `truss search` / `truss ask` | Natural-language queries from your shell |
| **MCP server** | `truss-agent-mcp` | Cursor, Claude Desktop, VS Code, other MCP hosts |

Both paths call the same Truss API tools. The CLI adds Claude on top; MCP hosts use their own LLM.

## Install

```bash
npm install -g @truss-security/truss-agent-mcp
# or from source:
git clone https://github.com/truss-security/truss-agent-mcp.git
cd truss-agent-mcp && npm install && npm run build
```

Requires Node.js 18+.

## truss CLI — quick start

Set keys in your shell or copy `env.example` to `.env`:

```bash
TRUSS_API_KEY=your_truss_key
ANTHROPIC_API_KEY=your_anthropic_key
```

```bash
truss help      # usage
truss search    # threat-intel retrieval REPL
truss ask       # general assistant REPL
```

From source without a global install:

```bash
npm run truss:search
npm run truss:ask
```

**Note:** `@truss-security/truss-sdk` also ships a `truss` binary (`truss examples`). Installing both packages globally may cause a bin name conflict.

---

## Examples

### `truss search` — find threat intelligence

Use when you want to **pull data**: search products, paginate, export STIX. Claude translates your question to FilterQL and calls Truss tools.

```bash
truss search
```

```
Truss Search — threat intelligence retrieval
Model: claude-sonnet-4-6 | Tools: 7
Type a question, or: exit | quit | :q

> Search for malware reports from the last 7 days

[Claude validates FilterQL, runs search_products, returns product ids, titles, categories]

> Narrow that to ransomware only

[Follow-up uses conversation context — refines filter and searches again]

> Export the top 5 matches as STIX

[Claude calls search_products_stix with a narrow filter]

> Get STIX bundle for product id 48291

[Claude calls get_product_stix for a single product]

> exit
```

**Good prompts for `truss search`:**

- "Malware targeting healthcare in the last 30 days"
- "Products from source FeedA published this week"
- "Show me 10 recent phishing reports, newest first"
- "Validate this filter: `category = \"Ransomware\" AND industry = \"Healthcare\"`"

### `truss ask` — general questions + Truss when needed

Use when you want to **learn, explain, or explore** — Claude answers freely and only hits Truss when you need live data.

```bash
truss ask
```

```
Truss Ask — general assistant
Model: claude-sonnet-4-6 | Tools: 7
Type a question, or: exit | quit | :q

> What is FilterQL and which fields can I filter on?

[Claude explains FilterQL; may call list_filter_attributes]

> When should I use source vs category in a filter?

[Conceptual answer — no search unless needed]

> OK, search Truss for ransomware from FeedA in the last 14 days

[Claude runs a search because you asked for live data]

> exit
```

**Good prompts for `truss ask`:**

- "How do I build a FilterQL query for multiple categories?"
- "What's the difference between search_products and search_products_stix?"
- "Search Truss for APT activity related to energy sector this month"

### MCP server — use in Cursor or Claude Desktop

For AI-assisted workflows inside an editor or chat app, run the MCP server (stdio). Only `TRUSS_API_KEY` is required — the host provides the LLM.

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "truss-agent-mcp": {
      "command": "npx",
      "args": ["-y", "@truss-security/truss-agent-mcp"],
      "env": {
        "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY",
        "TRUSS_API_URL": "https://api.truss-security.com"
      }
    }
  }
}
```

**Example prompts in the host:**

- "List Truss FilterQL attributes"
- "Search Truss for malware from the last 7 days"
- "Get STIX for product id 12345"

See [config/cursor.mcp.json](./config/cursor.mcp.json) and [guides/getting-started.md](./guides/getting-started.md).

---

## Environment variables

| Variable | CLI | MCP server | Default |
|----------|-----|------------|---------|
| `TRUSS_API_KEY` | required | required | — |
| `ANTHROPIC_API_KEY` | required | — | — |
| `ANTHROPIC_MODEL` | optional | — | `claude-sonnet-4-6` |
| `TRUSS_API_URL` | optional | optional | `https://api.truss-security.com` |
| `TRUSS_MCP_MAX_LIMIT` | optional | optional | `50` |
| `TRUSS_MCP_MAX_PAGES` | optional | optional | `3` |

Full list: [env.example](./env.example). CLI guide: [guides/truss-cli.md](./guides/truss-cli.md).

## Documentation

| | |
|--|--|
| [docs/](./docs/) | Architecture, API contract, tool catalog |
| [guides/](./guides/) | Getting started, client setup, FilterQL cookbook |
| [guides/truss-cli.md](./guides/truss-cli.md) | Terminal REPL reference |

## Development

```bash
npm install
npm run build
TRUSS_API_KEY=... npm run dev          # MCP server (stdio)
TRUSS_API_KEY=... ANTHROPIC_API_KEY=... npm run truss:search
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
