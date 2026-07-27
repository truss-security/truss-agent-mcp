# Public API contract (local stdio MCP tier)

This document describes what the **local stdio** server in this package is allowed to call via `@truss-security/truss-sdk`. Hosted MCP at `https://api.truss-security.com/mcp` is a separate surface (see [05](./05-hosted-mcp-oauth-architecture.md)).

## Authentication

- Header: `x-api-key`
- Configure via environment: `TRUSS_API_KEY` (never pass the key in MCP tool arguments)
- Base URL: `TRUSS_API_URL` (default `https://api.truss-security.com`; use `https://api-test.truss-security.com` for test)

## Allowed routes (customer keys)

| Method | Path | Local stdio MCP tools |
|--------|------|------------------------|
| POST | `/product/search` | `search_products`, `search_products_page`, `iterate_products_summary` |
| POST | `/product/search/stix` | `search_products_stix` |
| GET | `/product/{id}/stix` | `get_product_stix` |

Hosted MCP additionally exposes product JSON via `get_product` on the remote surface; that is not part of the local stdio tool set.

## Not used by local stdio v1

These require `accessType: admin` on the API key today and are **not** exposed as local stdio MCP tools:

- `/search/smart`, `/search/vector`, `/search/global`, `/search/similar/{id}`
- `GET /product/{id}` (native JSON) on the **stdio** path
- `POST /product` and other writes
- Analytics, batch admin, `POST /pg-query`

**Planned expansions** for the local stdio surface (quota visibility, contributor POST, customer-tier smart/similar search) are not yet available here.

The public [OpenAPI spec](https://github.com/truss-security/truss-docs/blob/main/openapi/trussapi.json) documents only the customer-tier search and STIX routes.

## Request body (product search)

Whitelisted JSON fields (aligned with dashboard and truss-agent):

| Field | Notes |
|-------|--------|
| `filterExpression` | FilterQL string |
| `startDate`, `endDate` | ISO date or epoch; when `startDate` is set, do not send `days` |
| `days` | Rolling window when no explicit start date |
| `page`, `limit` | Pagination; max `limit` 250 when filtering |
| `order_by`, `order_direction` | `pub_date`, `downloads`, `rating`, `timestamp` |

## Rate limits

Enforced by **API Gateway usage plans** (429 from gateway). Typical customer plans are on the order of ~10 req/s with daily quotas (see Truss API operator docs). The MCP server:

- Sets SDK `retries: 0` and surfaces 429 clearly
- Caps per-tool `limit` via `TRUSS_MCP_MAX_LIMIT` (default 50)
- Caps iteration via `TRUSS_MCP_MAX_PAGES` (default 3)

## User agent

The server sets `userAgent: truss-mcp/<version>` on the SDK client for support attribution.

## Legacy `/agent-data`

Named server-side agent configs via `POST /agent-data` are **not** exposed as MCP tools. Use inline `filterExpression` (same as dashboard export and truss-agent v2 connections).

---

**Prev:** [01 — Server architecture](./01-reference-server-architecture.md) · **Next:** [03 — FilterQL for LLMs](./03-filterql-for-llms.md) · [Docs index](./README.md)
