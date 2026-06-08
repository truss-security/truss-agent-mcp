# Public API contract (MCP tier)

This document describes what **truss-agent-mcp** is allowed to call. Authoritative server rules live in the Truss API authorizer (`endpointAccess` by `accessType` tag on the API key).

## Authentication

- Header: `x-api-key`
- Configure via environment: `TRUSS_API_KEY` (never pass the key in MCP tool arguments)
- Base URL: `TRUSS_API_URL` (default `https://api.truss-security.com`; use `https://api-test.truss-security.com` for test)

## Allowed routes (customer keys)

| Method | Path | MCP tools |
|--------|------|-----------|
| POST | `/product/search` | `search_products`, `search_products_page`, `iterate_products_summary` |
| POST | `/product/search/stix` | `search_products_stix` |
| GET | `/product/{id}/stix` | `get_product_stix` |

## Not used by truss-agent-mcp v1

These require `accessType: admin` on the API key today and are **not** exposed as MCP tools in v1:

- `/search/smart`, `/search/vector`, `/search/global`, `/search/similar/{id}`
- `GET /product/{id}` (native JSON)
- `POST /product` and other writes
- Analytics, batch admin, `POST /pg-query`

**Planned expansions** (quota visibility, contributor POST, customer-tier smart/similar search, product GET by id) are described in [06-api-roadmap.md](./06-api-roadmap.md)—not yet available.

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
