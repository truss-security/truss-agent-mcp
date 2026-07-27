# Claude Desktop MCP setup

## Config file location

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Recommended: remote OAuth

Requires **Growth+**. Claude opens a browser for Truss OAuth consent — no `TRUSS_API_KEY` in the config.

See [../config/claude_desktop_config.json](../config/claude_desktop_config.json):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "url": "https://api.truss-security.com/mcp"
    }
  }
}
```

Fully quit and reopen Claude Desktop. Approve consent when prompted. Hosted tools: `lookup_ioc`, `search_threats`, `get_product`, `get_product_stix`, `search_stix`.

Preflight:

```bash
truss-mcp doctor --remote --strict-oauth
```

## Legacy: local stdio (air-gap)

See [../config/claude_desktop_config.stdio.json](../config/claude_desktop_config.stdio.json):

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

After global install, use `"command": "truss-mcp"` and `"args": ["mcp"]`.

## Verify

Ask Claude to list Truss MCP tools or run a small hosted `search_threats` query. For stdio legacy, use `search_products` with a narrow FilterQL expression.
