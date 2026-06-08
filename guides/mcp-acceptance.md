# MCP acceptance checklist

Verify truss-mcp after install or release.

## Prerequisites

- Node.js 18+
- Valid `TRUSS_API_KEY`
- Host configured per [client-setup-cursor.md](./client-setup-cursor.md) or [client-setup-claude-desktop.md](./client-setup-claude-desktop.md)

## Startup

```bash
npm run build
TRUSS_API_KEY=your_key npm start
```

Process waits on stdio (no immediate exit).

## Tool prompts

| Ask the host | Expected tool |
|--------------|---------------|
| List Truss FilterQL attributes | `list_filter_attributes` |
| Validate: `category = "Malware"` | `validate_filter_expression` |
| Search malware last 7 days | `search_products` with `days: 7` |
| Next page of that search | `search_products_page` |
| Multiple pages of ransomware | `iterate_products_summary` |
| Export matches as STIX | `search_products_stix` |
| STIX for product id 12345 | `get_product_stix` |

## Pass criteria

- All seven tools listed in the host
- Search returns `{ products, total, page, limit, hasMore }`
- IOCs only when `include_indicators: true`
- Invalid FilterQL → clear validation error
- Bad/missing API key → clear startup error

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 429 rate limit | Narrow filter, lower `limit`, raise `TRUSS_MCP_DEBOUNCE_MS` |
| 403 | Verify key tier in Truss dashboard |
| Server exits | Set `TRUSS_API_KEY` in host `env`, not tool args |

Security red-team tests: [truss-testing/mcpAgentTesting](https://github.com/truss-security/truss-testing/tree/main/mcpAgentTesting)
