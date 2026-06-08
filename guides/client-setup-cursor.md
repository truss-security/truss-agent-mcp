# Cursor MCP setup

## 1. Get an API key

Create or copy an API key from the Truss dashboard (Billing / API settings).

## 2. Add the MCP server

Open **Cursor Settings → MCP** (or edit `.cursor/mcp.json` in your project).

Use the example in [../config/cursor.mcp.json](../config/cursor.mcp.json):

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

After global install:

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "truss-mcp",
      "args": ["mcp"],
      "env": { "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY" }
    }
  }
}
```

For local development from a cloned repo:

```json
{
  "mcpServers": {
    "truss-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/truss-agent-mcp/dist/truss-cli.js", "mcp"],
      "env": { "TRUSS_API_KEY": "YOUR_TRUSS_API_KEY" }
    }
  }
}
```

## 3. Reload MCP

Restart MCP or reload the window. Confirm `truss-mcp` appears with tools listed in [../docs/04-mcp-tool-catalog.md](../docs/04-mcp-tool-catalog.md).

## 4. Security

- Do not commit real API keys to git
- Prefer project-local `mcp.json` with env from your shell or secrets manager where supported
