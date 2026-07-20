# MCP acceptance checklist

Verify Truss MCP after install or release. **Primary path:** hosted OAuth (same as Cursor / Claude Desktop). Legacy stdio is secondary.

## Prerequisites

- Node.js 18+
- **Growth, Scale, or Enterprise** Truss account (Community cannot consent)
- Host or CLI configured for remote MCP

## Remote OAuth (recommended)

### Host config

Use the remote URL (no API key in host config):

```json
{
  "mcpServers": {
    "truss-mcp": {
      "url": "https://api.truss-security.com/mcp"
    }
  }
}
```

See [client-setup-cursor.md](./client-setup-cursor.md) or [client-setup-claude-desktop.md](./client-setup-claude-desktop.md).

### Doctor / registry gate

```bash
truss-mcp doctor --remote --strict-claude
# or:
truss-mcp validate-remote https://api.truss-security.com/mcp --strict-claude
```

### Consent expectations

1. Sign in on the Truss dashboard (complete MFA if enrolled).
2. Growth+: **Allow access** on `/oauth/consent`.
3. Community: consent is **auto-denied** (`access_denied`) so the client does not hang.

### Hosted tools (pass criteria)

| Ask the host | Expected tool |
|--------------|---------------|
| Look up this IOC in Truss | `lookup_ioc` |
| Search recent ransomware / named threat | `search_threats` |
| Product detail for id N | `get_product` |
| STIX for product id N | `get_product_stix` |
| Export search as STIX | `search_stix` |

Pass when:

- All **five** hosted tools are listed
- Live call returns Truss data (or a clear empty-result message)
- Community OAuth returns `access_denied` without hanging the client

### Terminal REPL (embedded host)

```bash
truss-mcp doctor --remote --save-token /tmp/truss-mcp-token
# set TRUSS_MCP_OAUTH_TOKEN_FILE=/tmp/truss-mcp-token in .env (+ LLM keys via init)
truss-mcp search
```

Confirm the session reports **remote** transport and five tools. LLM-only follow-ups (detection rules, IOC dedupe) work without extra MCP calls.

---

## Legacy stdio (air-gap)

Only when remote OAuth is unavailable.

### Prerequisites

- Valid `TRUSS_API_KEY`
- `TRUSS_MCP_TRANSPORT=stdio`

### Startup

```bash
npm run build
TRUSS_API_KEY=your_key npm start
# or: TRUSS_MCP_TRANSPORT=stdio truss-mcp mcp
```

Process waits on stdio (no immediate exit).

### Tool prompts (seven FilterQL tools)

| Ask the host | Expected tool |
|--------------|---------------|
| List Truss FilterQL attributes | `list_filter_attributes` |
| Validate: `category = "Malware"` | `validate_filter_expression` |
| Search malware last 7 days | `search_products` with `days: 7` |
| Next page of that search | `search_products_page` |
| Multiple pages of ransomware | `iterate_products_summary` |
| Export matches as STIX | `search_products_stix` |
| STIX for product id 12345 | `get_product_stix` |

### Pass criteria (stdio)

- All seven tools listed in the host
- Search returns `{ products, total, page, limit, hasMore }`
- IOCs only when `include_indicators: true`
- Invalid FilterQL → clear validation error
- Bad/missing API key → clear startup error

### Troubleshooting (stdio)

| Issue | Fix |
|-------|-----|
| 429 rate limit | Narrow filter, lower `limit`, raise `TRUSS_MCP_DEBOUNCE_MS` |
| 403 | Verify key tier in Truss dashboard |
| Server exits | Set `TRUSS_API_KEY` in host `env`, not tool args |

Security red-team tests: [truss-testing/mcpAgentTesting](https://github.com/truss-security/truss-testing/tree/main/mcpAgentTesting)
