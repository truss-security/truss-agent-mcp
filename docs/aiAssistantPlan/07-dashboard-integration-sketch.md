# Dashboard integration sketch — AiAssistant.tsx

**Status:** Conceptual UI mapping for a future implementation plan. No UI code in this doc set.

## Entry (unchanged)

`truss-dashboard/src/components/AiAssistant.tsx` continues to call:

```typescript
searchService.assistantQuery({ query, mode, threat, knowledge })
```

Mode selector remains: Auto, Threat Data, Knowledge Base, Both.

## Response rendering map

| Response source | Current UI | Future UI |
|-----------------|------------|-----------|
| `knowledge.ai_response` | Violet "About Truss" block | Same |
| `knowledge.chunks` | Citations in answer JSON | Optional: `KnowledgeChunkCard` list |
| `threat.ai_response` | Primary threat summary | Same |
| `threat.products` | `SearchResultCard` list | Same |
| `threat.parsed_filters` | Apply button (4 attrs) | Full FilterQL from `agents.filterQl` or `threat` |
| `agents.iocLookup` | — | IOC hit header + product cards |
| `agents.productRetrieval` | — | Product list (minimal narrative) |
| `agents.dashboardCard` | — | Preview card + **Add to dashboard** |
| `meta.agents_invoked` | — | Optional debug/subtitle for support |

## Suggested actions wiring

### apply_filter

From knowledge or filterQl agent:

1. Parse `suggested_actions` or `agents.filterQl.data`
2. `setFilterAst` / `setFilterExpression` via `useFullFilterStore`
3. `setDateRange` if date range present
4. Toast confirmation (existing pattern)

### view_document

From knowledge citations:

- Future: open doc path in Resources or external viewer
- Today: display `source_path` in citation block only

### add_dashboard_card

From `dashboardCard` agent:

```typescript
useViewStore.getState().addCard(suggested.card);
toast.success('Card added to current view');
```

Requires user to have an active view (`currentView` / `selectedViewId`).

## Context pass-through (future request field)

Optional enhancement to `assistantQuery`:

```typescript
context: {
  activeFilterExpression: useFullFilterStore.getState().filterExpression,
  // date range from useDateRangeStore
}
```

Helps dashboardCard agent propose charts aligned with active filter.

## Phased UI rollout (reference)

| Phase | UI change |
|-------|-----------|
| A | No visible change; optional `meta` debug line |
| B | FilterQL preview from `filterQl` agent; full attribute Apply |
| C | IOC lookup results section |
| D | Dashboard card suggestion + Add button |
| E | Render `suggested_actions` buttons for all action types |

## Files likely touched (implementation reference)

| File | Change |
|------|--------|
| `AiAssistant.tsx` | Render new agent blocks; action handlers |
| `searchService.ts` | Pass `context`, `sessionId` when added |
| `useViewStore.ts` | Consumed by add_dashboard_card |
| `KnowledgeChunkCard.tsx` | Optional chunk list |
| `package.json` | SDK pin to `e/new-ai` |

## Out of scope for dashboard

- Client-side orchestrator or Claude calls
- Replacing mode selector with agent picker (mode stays as user override)
