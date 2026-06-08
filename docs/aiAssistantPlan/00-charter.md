# Charter — AI Assistant multi-agent conceptualization

## Purpose

Produce a **shared conceptual model** for transforming the Truss dashboard AI Assistant from a two-leg regex router into a **central orchestrator + specialized agents** system, with Claude usage isolated under a **dedicated API key** for Console tracking.

## What this package is

- Architecture and intent documentation
- Current-state inventory and gap analysis
- Conceptual API/UI contracts (sketches, not specs)
- A suggested future implementation sequence
- Open questions for the next planning round

## What this package is not

- Implementation code in `truss-api`, `truss-dashboard`, or `truss-sdk-internal`
- Deployed infrastructure or environment changes
- A committed delivery timeline or sprint breakdown
- True MCP protocol servers (stdio/HTTP) per agent — see [02-target-architecture.md](./02-target-architecture.md)

## Design choices locked for conceptualization

| Choice | Decision |
|--------|----------|
| MCP style | **MCP-inspired**: orchestrator + tool-calling agents as **in-process services** in `truss-api` |
| Build baseline | **`e/new-ai`** API + **`test`** dashboard (not main-branch smart-search-only) |
| LLM provider (chat) | **Anthropic Claude** on search server (`callLLMChat` on `e/new-ai`) |
| Embeddings (retrieval) | **Local E5** (`Xenova/e5-base-v2`) — unchanged; not Claude |
| Console tracking | **Dedicated** `ASSISTANT_ANTHROPIC_API_KEY` for all assistant-orchestrated Claude calls |

## Success criteria for this documentation phase

1. Any engineer can read [01-current-state.md](./01-current-state.md) and explain the live request path end-to-end.
2. [03-agent-catalog.md](./03-agent-catalog.md) maps each user question type to exactly one downstream agent.
3. [05-claude-key-and-observability.md](./05-claude-key-and-observability.md) defines how billing isolation works without ambiguity.
4. [09-future-implementation-phases.md](./09-future-implementation-phases.md) gives a credible first slice for a follow-on build plan.
5. [10-open-questions.md](./10-open-questions.md) lists decisions that must be resolved before coding starts.

## Out of scope (entire initiative, not just this doc set)

- Replacing vector retrieval with Claude embeddings
- Client-side orchestration or browser-held API keys
- Merging dashboard assistant with [truss-agent-mcp](../04-mcp-tool-catalog.md) public MCP tools (related but separate products)
