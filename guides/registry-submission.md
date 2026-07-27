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
| Publisher private key | AWS Secrets Manager `<your-secret-id>` |

Do **not** list `https://truss-security.com/mcp` as the MCP remote URL (HTML marketing page).

`server.json` `description` must be **≤ 100 characters** (official registry validation).

## Channel status

| Channel | Status | Notes |
|---------|--------|--------|
| Official MCP Registry | **Published** (v1.1.0, 2026-07-27) | `com.truss-security/truss-mcp` → `https://api.truss-security.com/mcp` |
| cursor.directory | Ready after repo is public | Repo-root `.mcp.json` on default branch |
| Cursor Marketplace | Pending | Needs `.cursor-plugin/plugin.json` + root `mcp.json` |
| Secondary (mcp.so, PulseMCP, Smithery, awesome lists) | After Cursor | |

## Before making the repo public

- [ ] `.env` remains gitignored; never `git add -f .env` or commit real keys
- [ ] No private/404 sister-repo links in user-facing guides
- [ ] `server.json` and `.mcp.json` are on `main`
- [ ] CI gitleaks job is green on the merge PR
- [ ] Registry gate still passes: `truss-mcp doctor --remote --strict-oauth`

## Official registry publish

```bash
# Login (DNS) — private key from Secrets Manager; never commit key.pem
aws secretsmanager get-secret-value \
  --secret-id "<your-secret-id>" \
  --query SecretString --output text > /tmp/mcp-registry-key.pem
chmod 600 /tmp/mcp-registry-key.pem
PRIVATE_KEY="$(openssl pkey -in /tmp/mcp-registry-key.pem -noout -text | grep -A3 "priv:" | tail -n +2 | tr -d ' :\n')"
mcp-publisher login dns --domain truss-security.com --private-key "${PRIVATE_KEY}"
rm /tmp/mcp-registry-key.pem

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

Add `.cursor-plugin/plugin.json`, root `mcp.json` (same remote URL), optional logo, then submit at https://cursor.com/marketplace/publish.

## Internal metadata

`config/mcp-registry.json` holds extra Truss-specific fields (tools, eligibility, legacy stdio). Official schema lives in root `server.json`.
