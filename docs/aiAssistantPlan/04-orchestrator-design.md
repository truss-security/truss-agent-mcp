# Orchestrator design — central manager agent

## Role

The **orchestrator** is the only agent that reads the raw user question and decides **which downstream agents to run**. It does not answer Truss-specific facts from parametric memory — it delegates to knowledge/threat/data agents.

## Placement

```
POST /assistant/query
  → assistantOrchestrationService (thin facade)
  → orchestratorAgent.run(request)
  → AgentRegistry.dispatch(toolCalls)
```

Proposed module layout (implementation reference only):

```
truss-api/src/data/assistant/
  orchestratorAgent.ts
  agentRegistry.ts
  types.ts
  agents/
    knowledgeAgent.ts
    threatSearchAgent.ts
    ...
```

## Input

Extends current `AssistantQueryRequest`:

| Field | Purpose |
|-------|---------|
| `query` | User question (required) |
| `mode` | `auto` \| `threat` \| `knowledge` \| `both` |
| `threat` | Options passed to threatSearch agent |
| `knowledge` | Options passed to knowledge agent |
| `sessionId` | Optional; for Claude metadata and logs |

## Routing logic

### User override (`mode !== auto`)

| mode | Agents invoked |
|------|----------------|
| `threat` | threatSearch |
| `knowledge` | knowledge |
| `both` | knowledge + threatSearch (parallel) |

Set `meta.routed_by = 'user'`. **Skip** orchestrator LLM call.

### Auto mode (`mode === auto`)

1. Build tool list from `AgentRegistry` (descriptions + input schemas)
2. Call **`callAssistantLLMWithTools`** with system prompt:
   - Classify intent
   - Select minimal agents
   - Do not answer from model knowledge for Truss facts
   - Output tool calls only (no free-text answer in routing turn)
3. Execute tool calls (parallel when safe)
4. Set `meta.routed_by = 'orchestrator'`, `meta.agents_invoked = [...]`

### Fallback

If orchestrator LLM errors, times out, or returns no tools:

1. Run existing **regex classifier** (`classifyAssistantQuery` in today's `assistantOrchestrationService`)
2. Set `meta.routed_by = 'rules'`, `meta.degraded = true`

Preserves behavior during rollout and incidents.

## Claude tool loop (conceptual)

```
messages = [system, user: query]
loop (max N turns):
  response = anthropic.messages.create(tools=registry.tools, ...)
  if stop_reason == tool_use:
    for each tool_use:
      result = registry.execute(tool_name, tool_input)
      append tool_result to messages
  else:
    break
merge agent results → AssistantQueryResponse
```

**Max turns:** cap at 2–3 to control latency (route + optional refinement only; agents do the heavy work).

## System prompt guidelines (draft)

- You route Truss Security dashboard assistant queries.
- Available tools correspond to specialized agents; call only what is needed.
- For Truss product/platform questions, prefer `run_knowledge_agent`.
- For threat intelligence, IOCs, campaigns, CVEs, prefer threat/ioc/product agents.
- For filter or dashboard visualization requests, use filterQl and/or dashboardCard agents.
- Never fabricate product IDs, IOC matches, or doc citations.
- You may invoke multiple tools when the question clearly requires blended answers.

## AgentRegistry

Responsibilities:

| Concern | Owner |
|---------|-------|
| Tool JSON schemas for Claude | Registry |
| `execute(name, input) → AgentResult` | Registry → agent module |
| Capability flags (knowledge index present?) | Registry / orchestrator pre-check |
| Timeouts per agent | Registry |

## Merge policy

Populate **backward-compatible** top-level fields from agent results:

| Agent | Maps to |
|-------|---------|
| knowledge | `response.knowledge`, contributes to `route` |
| threatSearch | `response.threat`, contributes to `route` |
| filterQl | `response.agents.filterQl`; may also populate `threat.parsed_filters` if threat leg skipped |
| iocLookup, productRetrieval, dashboardCard | `response.agents.*` only until dashboard UI extended |

`route` derivation:

- knowledge only → `knowledge`
- threat only → `threat`
- both → `both`
- filterQl / ioc / card only → new route values TBD in implementation plan (`filter_only`, `ioc`, `dashboard`, etc.)

## Observability

Per request log:

- `sessionId`
- `mode`, `route`, `routed_by`
- `agents_invoked[]`
- Per-agent `durationMs`, success/failure
- Token usage from orchestrator + agent LLM calls (no API key in logs)

See [05-claude-key-and-observability.md](./05-claude-key-and-observability.md).

## Testing concept (future)

Golden questions per agent + routing expectations (from `document-golden-questions.md` + threat/IOC/filter/card cases). Assert `meta.agents_invoked` and `routed_by` in `sdk-assistant` tests.
