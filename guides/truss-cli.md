# truss CLI — terminal REPL with Claude

The `truss` binary provides interactive terminal access to Truss threat intelligence via Claude, without Cursor or Claude Desktop.

| Command | Purpose |
|---------|---------|
| `truss search` | Threat-intel retrieval REPL — FilterQL search, pagination, STIX |
| `truss ask` | General assistant REPL — answer freely; query Truss when needed |
| `truss help` | Show usage |

Both modes use the same `truss-agent-mcp` tools; only the system prompt differs.

## Prerequisites

- Node.js 18+
- `npm run build` completed in this repo
- **Two API keys:**
  - `TRUSS_API_KEY` — Truss product search
  - `ANTHROPIC_API_KEY` — Claude Messages API

## Quick start

```bash
cd truss-agent-mcp
npm install
npm run build

export TRUSS_API_KEY=your_truss_key
export ANTHROPIC_API_KEY=your_anthropic_key

truss search
# or: npm run truss:search
# or: truss ask
```

### Search mode

```
Truss Search — threat intelligence retrieval
Model: claude-sonnet-4-6 | Tools: 7
Type a question, or: exit | quit | :q

> malware targeting healthcare in the last 30 days
> show STIX for product id 48291
> exit
```

### Ask mode

```
Truss Ask — general assistant
Model: claude-sonnet-4-6 | Tools: 7
Type a question, or: exit | quit | :q

> What is FilterQL and when should I use source vs category?
> Now search Truss for ransomware from FeedA this week
> exit
```

## Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `TRUSS_API_KEY` | yes | — | Truss API key |
| `ANTHROPIC_API_KEY` | yes | — | Anthropic API key |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-6` | Claude model for tool use |
| `TRUSS_API_URL` | no | `https://api.truss-security.com` | Truss API base URL |
| `TRUSS_ASK_SERVER_PATH` | no | `dist/cli.js` in package | Override MCP server binary path |
| `TRUSS_MCP_MAX_LIMIT` | no | `50` | Per-request result cap |
| `TRUSS_MCP_MAX_PAGES` | no | `3` | Max pages for iterate tool |
| `TRUSS_MCP_DEBOUNCE_MS` | no | `200` | Min gap between Truss API calls |

`truss` loads `.env` from the current working directory at startup (does not overwrite variables already set in the shell).

## npm bin name conflict

`@truss-security/truss-sdk` also publishes a `truss` binary (`truss examples`). Installing both packages globally may cause a conflict — use `npx @truss-security/truss-agent-mcp` or local `npm link` carefully.

## How it works

```
You → truss search|ask REPL → Claude API (toolRunner)
                               ↓ MCP stdio
                          truss-agent-mcp → Truss API
```

- One MCP subprocess per REPL session
- Conversation history kept in memory for follow-ups
- `truss-agent-mcp` (stdio server) unchanged for Cursor/Claude Desktop

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MCP server not found` | Run `npm run build` |
| `TRUSS_API_KEY is required` | Set in shell or `.env` |
| `ANTHROPIC_API_KEY is required` | Set in shell or `.env` |
| Truss 429 rate limit | Narrow filters, lower limits, or increase `TRUSS_MCP_DEBOUNCE_MS` |
| Truss 403 | Verify API key has search access |

## Related

- [getting-started.md](./getting-started.md) — MCP host setup (Cursor, Claude Desktop)
- [truss-agent-vs-mcp.md](./truss-agent-vs-mcp.md) — scheduled agent vs interactive retrieval
- [mcp-acceptance.md](./mcp-acceptance.md) — verify MCP tools in a host
