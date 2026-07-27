# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |

## Reporting a vulnerability

If you discover a security issue in `truss-agent-mcp`, please report it responsibly:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email **security@truss-security.com** with a description of the issue, steps to reproduce, and impact assessment.
3. We aim to acknowledge reports within 2 business days.

## Credential handling

- **Remote OAuth (recommended for Cursor / Claude):** no API key in host config. Browser consent; Growth+ only. Prefer this path so keys never sit in `mcp.json`.
- **Truss API key** (`TRUSS_API_KEY`) for local stdio (`truss-mcp mcp`) or default CLI search. Never pass API keys in MCP tool arguments or commit them to version control.
- **OAuth tokens** from `validate-remote --save-token` are for local debugging only (mode `0600`); delete after use. Never commit token files.
- **LLM API keys** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) are only required for `truss-mcp search` CLI mode.
- The `truss-mcp doctor` command reports masked key previews (first/last characters only) and never prints full secrets.

## Data flow

| Mode | Data sent externally |
| ---- | -------------------- |
| Host → `https://api.truss-security.com/mcp` | OAuth Bearer to hosted MCP (Truss API). Host LLM stays local to the client. |
| `truss-mcp mcp` (stdio) | Queries go to Truss REST (`api.truss-security.com`) via your API key. |
| `truss-mcp search` | User prompts and Truss results go to your LLM provider plus Truss (stdio or remote MCP). |

Product summaries returned by MCP tools omit raw IOC values by default. Full indicators are returned only when `include_indicators: true` is set on a tool call.

## Public API boundary

This MCP server uses only the public Truss API tier:

- `POST /product/search`
- `POST /product/search/stix`
- `GET /product/{id}/stix`

Admin routes, analytics, and internal search endpoints are not accessible through this package.
