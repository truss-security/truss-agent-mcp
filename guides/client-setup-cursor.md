# Cursor MCP setup

## Recommended: remote OAuth

Requires a **Growth, Scale, or Enterprise** Truss account. No API key in Cursor config — the host opens a browser for OAuth consent.

Open **Cursor Settings → MCP** (or edit `.cursor/mcp.json`). Use [../config/cursor.mcp.json](../config/cursor.mcp.json):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "url": "https://api.truss-security.com/mcp"
    }
  }
}
```

Test environment: `"url": "https://api-test.truss-security.com/mcp"`.

Reload MCP / the window, approve consent in the browser, then confirm tools appear (`lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`).

Verify from a terminal:

```bash
truss-mcp doctor --remote --strict-claude
```

Architecture: [../docs/05-hosted-mcp-oauth-architecture.md](../docs/05-hosted-mcp-oauth-architecture.md).

## Legacy: local stdio (air-gap)

Only when you cannot use remote OAuth. See [../config/cursor.mcp.stdio.json](../config/cursor.mcp.stdio.json):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "npx",
      "args": ["-y", "@truss-security/truss-agent-mcp", "mcp"],
      "env": {
        "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY",
        "TRUSS_API_URL": "https://api.truss-security.com"
      }
    }
  }
}
```

After global install: `"command": "truss-mcp"`, `"args": ["mcp"]`.

Local clone: `"command": "node"`, `"args": ["/absolute/path/to/truss-agent-mcp/dist/truss-cli.js", "mcp"]`.

Stdio tools differ from hosted (FilterQL-oriented seven-tool set) — see [../docs/04-mcp-tool-catalog.md](../docs/04-mcp-tool-catalog.md).

## Security

- Prefer remote OAuth so API keys never sit in `mcp.json`
- Do not commit real API keys or OAuth tokens to git
