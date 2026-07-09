---
name: truss-agent-mcp
description: Develop, test, and release the Truss MCP server and truss-mcp CLI. Use when working in truss-agent-mcp, adding MCP tools, changing FilterQL behavior, fixing truss-mcp commands, running tests, or preparing a public/npm release.
---

# truss-agent-mcp

## Start here

1. Read [AGENTS.md](../../AGENTS.md) — canonical repo operations.
2. Identify mode: **MCP** (`src/server.ts`, `src/tools/`) vs **CLI** (`src/ask/`).

## Common tasks

### Add or change an MCP tool

1. Add Zod schema in `src/tools/schemas.ts`.
2. Register handler in `src/tools/register-tools.ts`.
3. Update host instructions in `src/instructions.ts` if behavior affects the LLM.
4. Document in `docs/04-mcp-tool-catalog.md`.
5. Add tests under `tests/` if logic is non-trivial.
6. `npm run build && npm test`.

### Fix MCP host connectivity

- Sample configs: `config/cursor.mcp.json`, `config/claude_desktop_config.json`.
- Guides: `guides/client-setup-cursor.md`, `guides/client-setup-claude-desktop.md`.
- Verify: `TRUSS_API_KEY` in host `env` block; `truss-mcp doctor`.

### Run tests

```bash
npm ci && npm run build && npm test
```

Optional live API: `TRUSS_RUN_INTEGRATION=1 TRUSS_API_KEY=<test-key> npm test`

### Pre-public / security check

- Gitleaks: no secrets in tree or history.
- No internal docs (`aiAssistantPlan`, private endpoints).
- `npm audit --audit-level=high` passes.
- CI workflows in `.github/workflows/`.

### Release

See `guides/publishing.md`. Tag `v*` → `release.yml` publishes npm package.

## Reference map

| Area | Path |
|------|------|
| MCP server | `src/server.ts` |
| Local architecture | `docs/01-reference-server-architecture.md` |
| Hosted MCP (proposal) | `docs/05-hosted-mcp-oauth-architecture.md` |
| Tools | `src/tools/register-tools.ts` |
| API client | `src/client.ts`, `src/config.ts` |
| CLI REPL | `src/ask/repl.ts` |
| FilterQL validation | `src/lib/validate-filter-expression.ts` |
| Product shaping | `src/lib/summarize-product.ts` |

## Anti-patterns

- Adding smart/vector search tools without public API support.
- Logging or returning full `TRUSS_API_KEY`.
- Restoring removed internal planning docs.
- Committing without user request.
