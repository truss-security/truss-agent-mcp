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

Install from this repo first (`npm install -g .`), then see [../config/claude_desktop_config.stdio.json](../config/claude_desktop_config.stdio.json):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": {
        "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY",
        "TRUSS_API_URL": "https://api.truss-security.com"
      }
    }
  }
}
```

After the package is published to npm, you may use `npx -y @truss-security/truss-agent-mcp mcp` instead.

## Verify

Ask Claude to list Truss MCP tools or run a small hosted `search_threats` query. For stdio legacy, use `search_products` with a narrow FilterQL expression.
