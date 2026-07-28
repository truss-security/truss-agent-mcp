# MCP registry submission

Tracker for publishing Truss MCP to public registries. **Primary path:** remote OAuth at `https://api.truss-security.com/mcp` (Growth+). Advertise the **five hosted tools** only.

Registry gate (must stay green before submit):

```bash
truss-mcp doctor --remote --strict-oauth
```

## Identity

| Field | Value |
|-------|--------|
| Official registry name | `com.truss-security/truss-mcp` |
| MCP URL (clients) | `https://api.truss-security.com/mcp` |
| Marketing / docs page | `https://truss-security.com/mcp` |
| Namespace proof | DNS TXT on apex `truss-security.com` (`v=MCPv1; k=ed25519; …`) |
| Publisher private key | AWS Secrets Manager (never commit `key.pem`) |

Do **not** list `https://truss-security.com/mcp` as the MCP remote URL (HTML marketing page).

`server.json` `description` must be **≤ 100 characters** (official registry validation).

## Channel status

| Channel | Status | Notes |
|---------|--------|--------|
| Official MCP Registry | **Published** (v1.1.0, 2026-07-27) | `com.truss-security/truss-mcp` → `https://api.truss-security.com/mcp` |
| GitHub repo | **Public** (2026-07-27) | https://github.com/truss-security/truss-agent-mcp |
| cursor.directory | **Submitted** (pending verify) | https://cursor.directory/plugins/truss-mcp — remote URL correct |
| Cursor Marketplace | Packaging on `main` | `.cursor-plugin/plugin.json`, `mcp.json`, `assets/logo.png` — submit/review at cursor.com/marketplace/publish |
| Secondary (mcp.so, PulseMCP, Smithery, awesome lists) | After Cursor | |

## Before making the repo public

- [x] `.env` remains gitignored; never `git add -f .env` or commit real keys
- [x] No private/404 sister-repo links in user-facing guides
- [x] `server.json` and `.mcp.json` are on `main`
- [x] History scrubbed (internal docs, private repo names, personal emails)
- [x] Repo visibility set to **public**
- [ ] Registry gate still passes: `truss-mcp doctor --remote --strict-oauth`
- [x] Docs and guides match remote-first product truth (no stale `ask` / `npx` before npm publish)

## Official registry publish

```bash
# Login (DNS) — load publisher private key from your secrets store; never commit key.pem
# Example (AWS): aws secretsmanager get-secret-value --secret-id <your-secret-id> ...
PRIVATE_KEY="$(openssl pkey -in /tmp/mcp-registry-key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')"
mcp-publisher login dns --domain truss-security.com --private-key "${PRIVATE_KEY}"
rm -f /tmp/mcp-registry-key.pem

cd /path/to/truss-agent-mcp
mcp-publisher publish

curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=com.truss-security/truss-mcp"
```

## cursor.directory

1. Ensure `.mcp.json` is on the default branch and the GitHub repo is **public**.
2. Submit at https://cursor.directory/plugins/new with  
   `https://github.com/truss-security/truss-agent-mcp`
3. Wait for safety scan.

## Cursor Marketplace (next)

Repo now has `.cursor-plugin/plugin.json`, root `mcp.json` (same remote URL), and `assets/logo.png`. Submit at https://cursor.com/marketplace/publish after those land on `main`.

**Logotype URL for the publisher form** (once pushed):

`https://raw.githubusercontent.com/truss-security/truss-agent-mcp/main/assets/logo.png`

## Internal metadata

`config/mcp-registry.json` holds extra Truss-specific fields (tools, eligibility, legacy stdio). Official schema lives in root `server.json`.
