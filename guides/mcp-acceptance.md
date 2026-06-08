# MCP acceptance checklist

Use this checklist to verify truss-agent-mcp end-to-end after install or release.

## Prerequisites

- Node.js 18+
- Valid `TRUSS_API_KEY` with product search access
- MCP host configured per [client-setup-cursor.md](./client-setup-cursor.md) or [client-setup-claude-desktop.md](./client-setup-claude-desktop.md)

## Server startup

From source:

```bash
npm install
npm run build
TRUSS_API_KEY=your_key npm start
```

The process should start without errors and wait on stdio (no immediate exit).

## Tool verification in MCP host

Run these prompts in Cursor or Claude Desktop and confirm the expected tool is invoked:

| Prompt | Expected tool |
|--------|---------------|
| "List Truss FilterQL attributes" | `list_filter_attributes` |
| "Validate this filter: category = Malware" | `validate_filter_expression` |
| "Search Truss for malware from the last 7 days" | `search_products` with `days: 7` |
| "Get the next page of that search" | `search_products_page` |
| "Summarize multiple pages of ransomware reports" | `iterate_products_summary` |
| "Export matching products as STIX" | `search_products_stix` |
| "Get STIX bundle for Truss product id 12345" | `get_product_stix` |

## Success criteria

- All seven tools appear in the host's MCP tool list
- Search tools return `{ products, total, page, limit, hasMore }` with trimmed summaries (no raw IOCs unless requested)
- STIX tools return valid STIX 2.x bundle JSON
- Invalid FilterQL returns a clear validation error
- Missing or invalid API key fails at server startup with a clear message

## Troubleshooting

- **429 rate limit:** Reduce `limit`, narrow filters, or increase `TRUSS_MCP_DEBOUNCE_MS`
- **403 forbidden:** Key may lack search access; verify key tier in Truss dashboard
- **Server exits immediately:** Check `TRUSS_API_KEY` is set in the MCP host `env` block, not in tool arguments
