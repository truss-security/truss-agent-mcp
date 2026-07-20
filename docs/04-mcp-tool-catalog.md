# MCP tool catalog

Server: `truss-mcp mcp` (local stdio) · Transport: stdio · Tools: **7**

> **Registries / Cursor / Claude (recommended):** use the **hosted** five-tool surface at `https://api.truss-security.com/mcp` — see [05 — Hosted MCP OAuth](./05-hosted-mcp-oauth-architecture.md). This catalog describes the **legacy local stdio** tools only.

## Behavior (embedded in server instructions)

- Translate user intent to **FilterQL** before searching
- **Default `days: 7`** — widen only when requested (quota)
- Call **`validate_filter_expression`** before `search_products` when you authored the filter
- Call **`list_filter_attributes`** when unsure of fields
- **`include_indicators: true`** when a new search needs full IOC values
- **Context-only follow-ups:** if the user asks to process prior results or says not to query again, use conversation context — no tool calls
- Cite products by numeric **id** and **title**
- Admin routes (smart/vector search, native product GET) are **not** available

## Tools

### `list_filter_attributes`

Returns FilterQL attribute names and supported operators. No input.

### `validate_filter_expression`

| Input | Type |
|-------|------|
| `filterExpression` | string (required) |

Returns `{ valid, error? }`.

### `search_products`

Primary search.

| Input | Type | Default |
|-------|------|---------|
| `filterExpression` | string | — |
| `days` | number | 7 recommended |
| `startDate` / `endDate` | string | — |
| `page` | number | 1 |
| `limit` | number | 25 (capped by env) |
| `order_by` | enum | — |
| `order_direction` | asc \| desc | — |
| `include_indicators` | boolean | false |

Returns `{ products, total, page, limit, hasMore }`.

### `search_products_page`

Same as `search_products`. Use when `hasMore: true`.

### `iterate_products_summary`

Multi-page fetch up to `TRUSS_MCP_MAX_PAGES`. Narrow filters only.

### `search_products_stix`

Filter/date/pagination as `search_products`. Returns STIX 2.x bundle.

### `get_product_stix`

| Input | Type |
|-------|------|
| `productId` | number (required) |

STIX bundle for one product.

## Response shape

Default summary: `id`, `truss_prod_id`, `title`, `category`, `source`, `type`, `pub_date`, `indicator_type_counts`.

Full `indicators` map only when `include_indicators: true`.

## Planned (not in v1)

Future tools may cover quota visibility, contributor POST, smart/vector search, and native product GET — not available in v1.

---

**Prev:** [03 — FilterQL for LLMs](./03-filterql-for-llms.md) · **Next:** [05 — Hosted MCP (proposal)](./05-hosted-mcp-oauth-architecture.md) · [Docs index](./README.md)
