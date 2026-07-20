# Cross-repo OAuth MCP checklist

Dependent work **outside** this package so product truth stays consistent. Track as separate PRs.

## truss-api

- [ ] Confirm OAuth dual-auth (`mcpAuthorize` / protected-resource handlers) is on git `main` matching prod
- [ ] Keep `POST /mcp` + `/.well-known/oauth-protected-resource` as the public contract
- [ ] Tighten Bearer-path metering if usage-plan bypass remains open
- [ ] Keep Community denied for MCP (API key + OAuth)

## truss-dashboard

- [ ] Agent MCP tab: show **remote OAuth URL** config first (`https://api.truss-security.com/mcp`)
- [ ] Demote stdio + `TRUSS_API_KEY` samples to “legacy / air-gap”
- [x] `/oauth/consent` Growth+ gate (`planRank >= growth`)
- [x] Community (ineligible) consent **auto-denies** and redirects client with OAuth error (no hang)

## truss-docs

- [ ] Public AI / MCP pages: remote-first OAuth path
- [ ] Correct any `www.truss-security.com/mcp` or marketing-site `/mcp` URLs

## truss-intelligence

- [ ] Update `business-intelligence/products/truss-mcp-guide.md` for hosted OAuth + Growth+ gate
- [ ] Update `business-intelligence/use-cases/mcp-integration.md` similarly
- [ ] Re-ingest corpus after doc changes so dashboard RAG matches

## This package (done when remote-first lands)

- [x] Docs 05 + README: canonical `api.truss-security.com/mcp`
- [x] Remote Cursor/Claude sample configs
- [x] `validate-remote` / `doctor --remote` as registry gate
- [x] `config/mcp-registry.json` for registry listings
- [x] Optional CLI remote session via token file

## Verify before registry publish

```bash
truss-mcp validate-remote https://api.truss-security.com/mcp --strict-claude
# equivalent:
truss-mcp doctor --remote --strict-claude
```

---

**Prev:** [05 — Hosted MCP OAuth](./05-hosted-mcp-oauth-architecture.md) · [Docs index](./README.md)
