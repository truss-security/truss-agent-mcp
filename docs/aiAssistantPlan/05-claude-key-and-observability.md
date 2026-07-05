# Dedicated Claude API key and observability

## Goal

All Claude calls made **on behalf of the dashboard AI Assistant** use a **single dedicated API key** so usage appears as a distinct project/workload in **Claude Console**, separate from other Truss Anthropic usage (parsers, experiments, etc.).

## Environment variables (search server / truss-api)

```bash
# Required for assistant orchestration and agent synthesis
ASSISTANT_ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional overrides (assistant scope only)
ASSISTANT_LLM_CHAT_MODEL=claude-sonnet-4-20250514
ASSISTANT_LLM_MAX_TOKENS=2048
```

### Separation from general Anthropic usage

| Variable | Used by |
|----------|---------|
| `ASSISTANT_ANTHROPIC_API_KEY` | Orchestrator + agents invoked via `/assistant/query` tree |
| `ANTHROPIC_API_KEY` | Non-assistant paths (if any remain on same server) |

**Rule:** Code paths under `src/data/assistant/` and agent-invoked `*ResponseService` / `aiFilterService` must call **`callAssistantLLM`** / **`callAssistantLLMWithTools`**, not the generic `callLLMChat` with the shared key.

## Proposed API surface (conceptual)

```typescript
function getAssistantAnthropicApiKey(): string;
// throws if ASSISTANT_ANTHROPIC_API_KEY missing on assistant paths

function callAssistantLLM(prompt, options?): Promise<LLMChatResult>;
// uses ASSISTANT_* env + assistant key only

function callAssistantLLMWithTools(messages, tools, options?): Promise<LLMChatResult>;
// orchestrator tool loop only
```

## Request metadata (Console drill-down)

When Anthropic Messages API supports `metadata` on requests, attach consistent fields on **every** assistant-scoped call:

| Field | Example | Purpose |
|-------|---------|---------|
| `user_id` | `truss-dashboard-assistant` | Fixed product identifier |
| `session_id` | UUID per user submit | Group multi-agent calls in one Q&A |
| `agent_id` | `orchestrator`, `knowledge`, `threatSearch`, … | Sub-trace per agent |

Same API key, finer grouping in Console.

## What uses Claude today (e/new-ai baseline)

| Call site | Purpose |
|-----------|---------|
| `aiFilterService.parseQueryToFilter` | NL → filter JSON (long smart search) |
| `aiResponseService.generateAIResponse` | Threat answer JSON over products |
| `knowledgeResponseService.generateKnowledgeResponse` | Doc-grounded answer JSON |

**After multi-agent work:** these run only when invoked **through** the corresponding agent, using the assistant key.

## What does not use Claude

| Component | Technology |
|-----------|------------|
| Product vector search | E5 + pgvector |
| Document chunk retrieval | E5 + pgvector |
| Regex routing fallback | No LLM |
| Dashboard BFF | Proxies Truss API only; no Claude |

## Dashboard / BFF

- **No** `ASSISTANT_ANTHROPIC_API_KEY` in Vercel dashboard env for assistant answers.
- Optional `api/openai/chat.js` OpenAI BFF is **out of scope** for this assistant stack.

## Operational checklist (when implemented)

1. Create Anthropic project/key labeled e.g. `truss-dashboard-assistant`
2. Set `ASSISTANT_ANTHROPIC_API_KEY` on test/prod search server secrets
3. Submit golden questions; verify Console shows traffic only on that key
4. Alert on assistant key rate limits separately from other keys
5. Never log key material; log `model`, `agent_id`, `session_id`, token counts

## Cost controls (conceptual)

- Orchestrator: cap tool-loop turns
- Avoid always running knowledge + threat in parallel unless orchestrator selects both
- `generate_response: false` for productRetrieval when user wants list only
- Filter-only path skips vector search entirely
