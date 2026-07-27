# Cross-repo OAuth MCP checklist

Dependent work **outside** this package so product truth stays consistent. Track as separate PRs in the owning services (no private clone URLs here).

## Truss API service

- [ ] Confirm OAuth dual-auth (protected-resource handlers) is on production `main`
- [ ] Keep `POST /mcp` + `/.well-known/oauth-protected-resource` as the public contract
- [ ] Tighten Bearer-path metering if usage-plan bypass remains open
- [ ] Keep Community denied for MCP (API key + OAuth)

## Truss dashboard

- [x] Agent MCP tab: show **remote OAuth URL** config first (`https://api.truss-security.com/mcp`)
- [x] Demote stdio + `TRUSS_API_KEY` samples to “legacy / air-gap”
- [x] `/oauth/consent` Growth+ gate (`planRank >= growth`)
- [x] Community (ineligible) consent **auto-denies** and redirects client with OAuth error (no hang)

## Public docs site

- [ ] Public AI / MCP pages: remote-first OAuth path
- [ ] Correct any `www.truss-security.com/mcp` or marketing-site `/mcp` URLs listed as the MCP endpoint

## In-app product narrative

- [ ] Update MCP product / use-case docs for hosted OAuth + Growth+ gate
- [ ] Re-ingest assistant corpus after doc changes so dashboard answers match

## This package (done when remote-first lands)

- [x] Docs 05 + README: canonical `api.truss-security.com/mcp`
- [x] Remote Cursor/Claude sample configs
- [x] `validate-remote` / `doctor --remote` as registry gate
- [x] `config/mcp-registry.json` for registry listings
- [x] Optional CLI remote session via token file
- [x] Official `server.json` (`com.truss-security/truss-mcp`) + `.mcp.json` + [registry submission guide](../guides/registry-submission.md)

## Verify before registry publish

```bash
truss-mcp validate-remote https://api.truss-security.com/mcp --strict-oauth
# equivalent:
truss-mcp doctor --remote --strict-oauth
```

Publish steps: [guides/registry-submission.md](../guides/registry-submission.md).

---

**Prev:** [05 — Hosted MCP OAuth](./05-hosted-mcp-oauth-architecture.md) · [Docs index](./README.md)
