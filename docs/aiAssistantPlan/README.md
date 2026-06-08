# AI Assistant — Multi-Agent Conceptualization

Documentation-only package for evolving the Truss dashboard **AI Assistant** into an **MCP-inspired multi-agent system** with a central orchestrator and specialized downstream agents.

**This directory does not implement anything.** It captures the initial conceptualization and reference material needed before a separate implementation plan is written and executed.

## Audience

- Engineers planning work in `truss-api`, `truss-dashboard`, and `truss-sdk-internal`
- Product and architecture reviewers deciding scope and sequencing
- Anyone wiring Claude Console billing and observability for the assistant stack

## Build baseline

Conceptualization assumes the in-flight stack on:

| Repo | Branch | Notes |
|------|--------|-------|
| [truss-dashboard](https://github.com/truss-security/truss-dashboard) | `test` | `AiAssistant.tsx` → `assistantQuery()` |
| [truss-api](https://github.com/truss-security/truss-api) | `e/new-ai` | `/assistant/query`, `/knowledge/search`, Claude, document RAG |
| [truss-sdk-internal](https://github.com/truss-security/truss-sdk-internal) | `e/new-ai` | `AssistantQueryRequest/Response`, knowledge types |

## Document index

| # | Document | Purpose |
|---|----------|---------|
| 00 | [00-charter.md](./00-charter.md) | Scope of this doc set; what is and is not being built here |
| 01 | [01-current-state.md](./01-current-state.md) | How the assistant works today (test + `e/new-ai`) |
| 02 | [02-target-architecture.md](./02-target-architecture.md) | MCP-inspired orchestrator + agent topology |
| 03 | [03-agent-catalog.md](./03-agent-catalog.md) | One agent per user solution type |
| 04 | [04-orchestrator-design.md](./04-orchestrator-design.md) | Central manager: routing, tool use, fallbacks |
| 05 | [05-claude-key-and-observability.md](./05-claude-key-and-observability.md) | Dedicated `ASSISTANT_ANTHROPIC_API_KEY` and Console tracking |
| 06 | [06-api-contract-sketch.md](./06-api-contract-sketch.md) | Conceptual SDK/API envelope extensions |
| 07 | [07-dashboard-integration-sketch.md](./07-dashboard-integration-sketch.md) | How `AiAssistant` would consume agent outputs |
| 08 | [08-gap-analysis.md](./08-gap-analysis.md) | User goals vs current capabilities |
| 09 | [09-future-implementation-phases.md](./09-future-implementation-phases.md) | Suggested build sequence (for a later plan) |
| 10 | [10-open-questions.md](./10-open-questions.md) | Decisions deferred to implementation planning |

## Relationship to truss-agent-mcp

[truss-agent-mcp](../04-mcp-tool-catalog.md) today exposes **public-tier FilterQL tools** to external MCP hosts (Cursor, Claude Desktop). The dashboard AI Assistant is a **different surface**: server-side orchestration on admin/search routes (`/assistant/query`, smart search, knowledge RAG).

This conceptualization is **MCP-inspired** (tool-calling agents, registry) but **in-process** inside `truss-api` — not separate MCP server processes. See [02-target-architecture.md](./02-target-architecture.md).

## Related external docs

- `truss-api` `e/new-ai`: `documentation/plans/ai-orchestration.md`
- `truss-api`: `documentation/architecture/vector-search-and-ai.md`
- `truss-intelligence`: internal doc corpus for knowledge RAG ingest

## Next step after this package

Use these documents as input to a formal **implementation plan** (tickets, PRs, env rollout). No code changes are implied by this folder alone.
