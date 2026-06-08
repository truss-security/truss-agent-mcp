# Agent catalog — one agent per solution type

Each row is a **downstream agent** the orchestrator can invoke. The orchestrator itself is not in this table — it only routes and merges.

## Summary table

| Agent ID | User intent (examples) | Wraps / builds on | Claude for synthesis? |
|----------|------------------------|-------------------|------------------------|
| `knowledge` | "What is Truss?", "How does FilterQL work?" | `knowledgeSearchService`, `knowledgeResponseService` | Yes |
| `threatSearch` | "Latest ransomware threats", "APT campaigns in healthcare" | `searchService.smartSearch` | Yes (long queries + optional answer) |
| `iocLookup` | "Find products with hash …", "Is 1.2.3.4 malicious?" | **New:** exact `indicator_values` lookup | Optional (format summary) |
| `filterQl` | "Create a filter for malware in EU last week" | `parseQueryToFilter` → full FilterQL/AST | Yes |
| `productRetrieval` | "List products matching …", "Get product IDs for …" | `searchProducts`, `getProducts` | Optional |
| `dashboardCard` | "Add a bar chart of threats by category" | **New:** chart spec from `ViewCard` types | Yes |

## knowledge

**When to use:** Platform FAQ, Truss product concepts, glossary, API usage, contributor program — anything answered from **internal docs** (`truss-intelligence` → `document_chunks`).

**Must not use for:** Threat catalog questions answerable from product embeddings.

**Input (conceptual):**

```json
{ "query": "string", "limit": 8, "similarity_threshold": 0.2, "generate_response": true }
```

**Output:** `KnowledgeSearchResponse` — `chunks`, `ai_response` with `knowledge_citation` | `prose`, `suggested_actions`.

**Existing today:** Yes, as knowledge leg of `assistantOrchestrationService`.

---

## threatSearch

**When to use:** Threat intelligence discovery, semantic search, hybrid filter+vector queries, narrative summaries over products.

**Input (conceptual):**

```json
{
  "query": "string",
  "limit": 10,
  "use_vector_search": true,
  "similarity_threshold": 0.3,
  "generate_response": true,
  "max_results_for_response": 3
}
```

**Output:** `SmartSearchResponse` — `products`, `parsed_filters`, `ai_response`.

**Existing today:** Yes, as threat leg.

---

## iocLookup

**When to use:** User supplies or asks about a specific IOC (hash, domain, IP, URL, etc.).

**Gap today:** Short smart-search path uses **vector similarity only**, not exact indicator table match.

**Planned behavior:**

1. Normalize IOC value (reuse indicator normalization from product ingest)
2. Query `indicator_values` (+ type) → `product_indicator_values` → products
3. Return product list with match metadata (indicator type, value, product id)
4. Optional Claude summary referencing result indices

**Output (conceptual):** `IocLookupResponse` — `matches[]`, `products[]`, optional `ai_response`.

---

## filterQl

**When to use:** User wants a **filter definition** without necessarily browsing products first.

**Gap today:** Filters only emerge as side effect of long smart-search path; dashboard Apply maps 4 attributes only.

**Planned behavior:**

1. `parseQueryToFilter` on query
2. Return full `filterAst` / `filterExpression`, `dateRange`, suggested name/description
3. Skip vector search unless orchestrator also invokes `threatSearch` or `productRetrieval`

**Output (conceptual):** `FilterQlPayload` — `filterAst`, `filterExpression`, `dateRange`, `confidence`.

---

## productRetrieval

**When to use:** Structured product fetch — by FilterQL, date range, or explicit IDs — with minimal narrative.

**Planned behavior:**

1. Use filter from `filterQl` agent or inline filter parse
2. `searchProducts` / `getProducts`
3. `generate_response: false` unless user asks for summary

**Output:** `SearchProductsResponse` or product array.

---

## dashboardCard

**When to use:** User asks to visualize data on the dashboard ("show me a pie chart of …", "add a list card for …").

**Gap today:** Cards added manually via `useViewStore.addCard`; no NL path.

**Planned behavior:**

1. Claude proposes `ViewCard`-compatible JSON
2. Allowed `ChartType`: `productList`, `pie`, `bar`, `line`, `heatmap`, `treemap`, `geomap`, `list`, `trendGauge`, `network`, `productSimilarity`, `numberCard`
3. Optional link to filter from `filterQl` agent output

**Output (conceptual):** `DashboardCardSuggestion` — `card: Omit<ViewCard, 'id'>`, `rationale`.

**Dashboard action:** `suggested_actions` entry `add_dashboard_card` → `useViewStore.addCard()`.

---

## Orchestrator tool naming (conceptual)

| Tool name | Agent |
|-----------|-------|
| `run_knowledge_agent` | knowledge |
| `run_threat_search_agent` | threatSearch |
| `run_ioc_lookup_agent` | iocLookup |
| `run_filter_ql_agent` | filterQl |
| `run_product_retrieval_agent` | productRetrieval |
| `run_dashboard_card_agent` | dashboardCard |

Exact names and schemas are specified in a future implementation plan / OpenAPI update.

## Multi-agent combinations

| User question pattern | Typical agents |
|----------------------|----------------|
| "What is Truss security exchange?" | knowledge |
| "Recent ransomware in manufacturing" | threatSearch (maybe filterQl) |
| "What is FilterQL and show me ransomware this week" | knowledge + threatSearch |
| "Lookup sha256:abc…" | iocLookup |
| "Filter for openphish + last 7 days" | filterQl |
| "Add a bar chart of malware by source for that filter" | filterQl + dashboardCard |

Orchestrator should prefer **minimal** set; parallel only when both answers are required.
