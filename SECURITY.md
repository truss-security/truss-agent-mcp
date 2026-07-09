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

- **Truss API key** (`TRUSS_API_KEY`) must be set in the MCP host environment or local `.env` file. Never pass API keys in MCP tool arguments or commit them to version control.
- **LLM API keys** (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`) are only required for `truss-mcp search` CLI mode. MCP-only mode (`truss-mcp mcp`) needs only the Truss key.
- The `truss-mcp doctor` command reports masked key previews (first/last characters only) and never prints full secrets.

## Data flow

| Mode | Data sent externally |
| ---- | -------------------- |
| `truss-mcp mcp` | Queries go to Truss API (`api.truss-security.com`) via your API key. The host LLM handles inference locally. |
| `truss-mcp search` | User prompts and Truss search results are sent to your configured LLM provider (Anthropic or OpenAI) in addition to Truss API calls. |

Product summaries returned by MCP tools omit raw IOC values by default. Full indicators are returned only when `include_indicators: true` is set on a tool call.

## Public API boundary

This MCP server uses only the public Truss API tier:

- `POST /product/search`
- `POST /product/search/stix`
- `GET /product/{id}/stix`

Admin routes, analytics, and internal search endpoints are not accessible through this package.
