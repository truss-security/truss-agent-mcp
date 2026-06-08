# Claude Desktop MCP setup

## Config file location

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Example

See [../config/claude_desktop_config.json](../config/claude_desktop_config.json):

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

## Restart Claude Desktop

Fully quit and reopen the app so stdio MCP servers restart.

## Verify

In a new chat, ask Claude to list Truss MCP tools or run a small `search_products` query with a narrow filter.
