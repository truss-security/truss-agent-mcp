# Gap analysis — user goals vs current vs target

Maps the six solution types discussed for the AI Assistant to **current** (`e/new-ai` + test dashboard) and **target** (multi-agent orchestrator).

## Summary matrix

| User goal | Current (e/new-ai) | Target (multi-agent) | Primary agent |
|-----------|-------------------|----------------------|---------------|
| IOC questions | Partial — vector only on short path | Exact lookup + optional summary | `iocLookup` |
| FAQ about Truss | Partial — knowledge RAG leg | Same, orchestrator-routed | `knowledge` |
| FilterQL creation | Partial — side effect of long smart search; 4-attr Apply | Dedicated leg + full AST | `filterQl` |
| Product retrieval | Via smart search products | Direct search when narrative not needed | `productRetrieval` |
| Smart Search | Yes — threat leg | Yes — `threatSearch` agent | `threatSearch` |
| Dashboard card creation | No | Suggested card + Add action | `dashboardCard` |

## IOC questions

**Current:** Queries ≤15 words hit vector `searchByKeyword` (includes `searchByIndicators` embedding path, not exact DB match). "Send to Search" from product modal reuses assistant query.

**Gaps:**

- No exact match on `indicator_values.normalized_value`
- No IOC-specific answer schema
- Orchestrator regex may route IOC strings to `threat` not `iocLookup`

**Target:** `iocLookup` agent with normalized indicator query → linked products.

## FAQ about Truss

**Current:** Knowledge leg over `document_chunks`; requires ingest of `truss-intelligence`. Mode Knowledge or Auto with knowledge signals.

**Gaps:**

- `suggested_actions` not rendered in UI
- `KnowledgeChunkCard` unused
- External FAQ link on Resources page still separate

**Target:** Orchestrator routes platform questions to `knowledge`; wire actions and optional chunk list.

## FilterQL creation

**Current:** Long queries → `parseQueryToFilter` inside smart search → `parsed_filters` on threat response. Dashboard maps category, industry, region, source + dates only.

**Gaps:**

- Short queries get no filters
- author, tags, indicators dropped on Apply
- No "show FilterQL string" UX
- No filter-only path without product search

**Target:** `filterQl` agent returns full AST/expression; dashboard Apply uses complete filter.

## Product retrieval

**Current:** Products returned as part of `SmartSearchResponse`; modal enrichment via `getProducts`.

**Gaps:**

- Always tied to smart search narrative path when `generate_response: true`
- No "fetch by ID" intent

**Target:** `productRetrieval` for structured lists; optional skip of Claude summary.

## Smart Search retrieval

**Current:** Core of threat leg — embeddings, hybrid search, Claude answers.

**Gaps:**

- User cannot see search method in UI
- Same endpoint for all threat-like questions regardless of sub-intent

**Target:** Explicit `threatSearch` agent in `meta.agents_invoked`; orchestrator may combine with filterQl.

## Dashboard card creation

**Current:** Manual via `ViewsActionBar` / `useViewStore.addCard`. Chart types: `productList`, `pie`, `bar`, `line`, `heatmap`, `treemap`, `geomap`, `list`, `trendGauge`, `network`, `productSimilarity`, `numberCard`.

**Gaps:**

- No NL → chart type inference
- No link from assistant to view editor

**Target:** `dashboardCard` agent + `add_dashboard_card` suggested action.

## Cross-cutting gaps

| Area | Gap |
|------|-----|
| Routing | Regex only; no Claude orchestrator |
| Claude billing | Shared `ANTHROPIC_API_KEY`, not assistant-dedicated |
| SDK alignment | Dashboard may pin SDK main vs `e/new-ai` |
| API deploy | Local api checkout may lack `e/new-ai` |
| Observability | No `agents_invoked` / session tracing |
| Latency | Blind `both` doubles work |

## Non-goals (remain gaps by design)

- Merging knowledge answers from product embeddings
- Client-side agent orchestration
- Public MCP tool parity with truss-agent-mcp for dashboard assistant
