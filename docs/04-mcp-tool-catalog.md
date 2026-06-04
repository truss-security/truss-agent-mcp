# MCP tool catalog

Server name: `truss-agent-mcp`  
Transport: stdio

## Server instructions (embedded)

The following text is provided to MCP hosts as server instructions:

```
You have access to Truss threat intelligence product search via FilterQL.

Rules:
1. Translate the user's question into a FilterQL filterExpression before searching.
2. Call validate_filter_expression before search_products when you generated the expression.
3. Use list_filter_attributes when unsure which fields exist.
4. Default limit to 25 or less unless the user needs more; respect rate limits.
5. Cite products by numeric id and title. Do not expose TRUSS_API_KEY in tool args.
6. Admin-only Truss routes (smart search, vector search, native product JSON) are not available.
```

## Tools

### `list_filter_attributes`

Returns allowed FilterQL attribute names and supported operators.

**Input:** none

---

### `validate_filter_expression`

**Input:**

| Field | Type | Required |
|-------|------|----------|
| `filterExpression` | string | yes |

**Output:** `{ valid: boolean, error?: string }`

---

### `search_products`

Primary search.

**Input:**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `filterExpression` | string | no | |
| `days` | number | no | |
| `startDate` | string | no | |
| `endDate` | string | no | |
| `page` | number | no | 1 |
| `limit` | number | no | 25 (capped by env) |
| `order_by` | enum | no | |
| `order_direction` | `asc` \| `desc` | no | |
| `include_indicators` | boolean | no | false |

**Output:** `{ products, total, page, limit, hasMore }` with trimmed product summaries unless `include_indicators` is true.

---

### `search_products_page`

Same parameters as `search_products`; intended for explicit pagination when `hasMore` is true.

---

### `iterate_products_summary`

Streams multiple pages up to `TRUSS_MCP_MAX_PAGES`.

**Input:** same filter/date fields as `search_products`; optional `limit` per page.

**Output:** `{ products, pagesFetched, truncated }`

---

### `search_products_stix`

**Input:** same filter/date/pagination as `search_products`.

**Output:** STIX bundle JSON text (may be large; use narrow filters).

---

### `get_product_stix`

**Input:**

| Field | Type | Required |
|-------|------|----------|
| `productId` | number | yes |

**Output:** STIX bundle for one product.

## Response shaping

Default product summary fields: `id`, `truss_prod_id`, `title`, `category`, `source`, `type`, `pub_date`, `indicator_type_counts`. Full `indicators` map only when `include_indicators: true`.

## Planned tools (not in v1)

These depend on [truss-api](https://github.com/truss-security/truss-api) and SDK releases. See [06-api-roadmap.md](./06-api-roadmap.md).

| Planned tool | Depends on |
|--------------|------------|
| `get_api_quota` | API quota / usage visibility (AWS usage-plan operations) |
| `create_product` | Contributor (or tiered) `POST /product` |
| `search_products_smart` | Customer access to `/search/smart` |
| `search_products_vector` | Customer access to `/search/vector` |
| `search_products_global` | Customer access to `/search/global` |
| `find_similar_products` | Customer access to `/search/similar/{id}` |
| `get_product` | Customer access to `GET /product/{id}` (native JSON) |
