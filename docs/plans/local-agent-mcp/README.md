# Local Agent MCP — plan

Target identity for **this repo**, written here so we do not rewrite shipped README, guides, or `docs/01–07` until the code matches.

**Live product docs stay as they are.** They still describe today’s hybrid (hosted-MCP client + local FilterQL search). This folder is the source of truth for where we are going.

| Doc | Role |
|-----|------|
| [01-what-is-agent-mcp](./01-what-is-agent-mcp) | Why: Server MCP vs Agent MCP; what belongs here |
| [AGENTS.md](./AGENTS.md) | How agents should work during the migration (freeze overrides shipped docs) |
| [02-identity-freeze](./02-identity-freeze) | Phase 1: freeze rules, what not to add, what not to rewrite yet |
| [03-dual-server-host](./03-dual-server-host) | Intended Cursor/Claude setup: two MCP servers |
| [04-migration-phases](./04-migration-phases) | Phases 1–6 |
| [05-config-and-secrets](./05-config-and-secrets) | Phase 2: env refs, bundle, migrate from dashboard/agent JSON |
| [06-how-intel-is-pulled](./06-how-intel-is-pulled) | Phase 2: internal SDK/REST; not a search catalog |
| [07-chat-and-serve](./07-chat-and-serve.md) | Phase 2: Discord/Slack/Teams, `serve`, `run-job` |
| [08-cloud-served-agent-config](./08-cloud-served-agent-config.md) | Future: API stores secret-free bundles; Server MCP discovers *your* configs |
| [09-run-job-now](./09-run-job-now.md) | Phase 3 slice: MCP `run_job_now` (Discord, job name only) |

Older destination matrix (SIEM/EDR/…): [../../07-unified-agent-delivery-architecture.md](../../07-unified-agent-delivery-architecture.md). Useful for phase 5. Do **not** follow it where it keeps the seven local search tools — [01](./01-what-is-agent-mcp) wins.
