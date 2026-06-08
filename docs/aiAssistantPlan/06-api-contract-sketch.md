# API contract sketch — unified assistant envelope

**Status:** Conceptual. Not a committed OpenAPI/SDK release. Use when writing the implementation plan.

## Entry point (unchanged)

```
POST /assistant/query
```

Proxied: Browser → BFF `/api/truss` → Lambda → Express search server.

## Request body

Extends `AssistantQueryRequest` (`truss-sdk-internal` `e/new-ai`):

```typescript
interface AssistantQueryRequest {
  query: string;
  mode?: 'auto' | 'threat' | 'knowledge' | 'both';
  threat?: SmartSearchOptions;
  knowledge?: KnowledgeSearchOptions;
  // Future:
  sessionId?: string;
  context?: {
    activeFilterExpression?: string;
    activeDateRange?: { from: string; to: string };
    viewId?: string;
  };
}
```

`context` is optional future pass-through so `dashboardCard` and `filterQl` agents can align with the user's current dashboard state.

## Response body (extended)

```typescript
interface AssistantQueryResponse {
  query: string;
  mode: AssistantQueryMode;
  route: AssistantQueryRoute; // may gain new values: filter_only, ioc, dashboard, ...

  // Backward compatible (populated from agent results)
  threat?: SmartSearchResponse;
  knowledge?: KnowledgeSearchResponse;
  errors?: {
    threat?: { error: string; message?: string };
    knowledge?: { error: string; message?: string };
  };

  // New: per-agent results
  agents?: {
    knowledge?: AgentResult<KnowledgeSearchResponse>;
    threatSearch?: AgentResult<SmartSearchResponse>;
    iocLookup?: AgentResult<IocLookupResponse>;
    filterQl?: AgentResult<FilterQlPayload>;
    productRetrieval?: AgentResult<SearchProductsResponse>;
    dashboardCard?: AgentResult<DashboardCardSuggestion>;
  };

  meta?: {
    routed_by: 'user' | 'rules' | 'orchestrator';
    orchestrator_model?: string;
    agents_invoked: string[];
    duration_ms: number;
    legs: { threat: boolean; knowledge: boolean };
    degraded?: boolean;
    session_id?: string;
  };
}

interface AgentResult<T> {
  agentId: string;
  success: boolean;
  data?: T;
  error?: string;
  durationMs: number;
}
```

## New payload types (sketch)

```typescript
interface FilterQlPayload {
  filterAst?: FilterAstNode;
  filterExpression: string;
  dateRange?: { from: string; to: string };
  name?: string;
  description?: string;
  confidence?: number;
}

interface IocLookupResponse {
  query_ioc: string;
  normalized_value: string;
  indicator_type?: string;
  products: SearchProductResponse[];
  total: number;
}

interface DashboardCardSuggestion {
  card: Omit<ViewCard, 'id'>;
  rationale?: string;
}
```

## Suggested actions (knowledge + future)

Extend knowledge `suggested_actions` and add cross-agent actions:

```typescript
type SuggestedAction =
  | { type: 'apply_filter'; filters: ParsedSearchFilters; label?: string }
  | { type: 'view_document'; source_path: string; document_id?: number }
  | { type: 'add_dashboard_card'; card: Omit<ViewCard, 'id'>; label?: string };
```

## SDK packaging

- Types live in `truss-sdk-internal` `e/new-ai` branch
- `InternalSearchService.assistant()` parses structured `ai_response.answer` JSON (existing pattern)
- Dashboard pins `package.json` to matching SDK ref before release

## Stable sub-routes (retain)

Do not remove direct endpoints; orchestration calls services internally:

| Route | Purpose |
|-------|---------|
| `POST /search/smart` | Threat leg implementation |
| `POST /knowledge/search` | Knowledge leg implementation |

SDK tests and direct API consumers keep working.

## Versioning note

First implementation can ship `agents` + extended `meta` as additive fields. Dashboard migrates incrementally by reading top-level `threat`/`knowledge` first, then new blocks.
