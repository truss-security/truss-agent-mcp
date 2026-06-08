# Current state — AI Assistant (test + e/new-ai)

Snapshot of how the assistant works **before** multi-agent orchestrator work. Sources: `truss-dashboard` `test`, `truss-api` `origin/e/new-ai`.

## User-facing entry

- **Component:** `truss-dashboard/src/components/AiAssistant.tsx`
- **Mount:** Global right panel in `App.tsx`
- **Submit:** `searchService.assistantQuery({ query, mode, threat, knowledge })`

### Mode selector (user override)

| Mode | Label | Effect |
|------|-------|--------|
| `auto` | Auto | Server picks route |
| `threat` | Threat Data | Threat leg only |
| `knowledge` | Knowledge Base | Knowledge leg only |
| `both` | Both | Both legs in parallel |

## Request path

```
AiAssistant
  → searchService.assistantQuery()
  → BFF POST /api/truss/assistant/query
  → truss-api Lambda assistantQuery (proxy)
  → Express search server POST /assistant/query
  → assistantOrchestrationService.query()
```

## Server routing today (`assistantOrchestrationService`)

**Not LLM-based.** Regex classifier on `e/new-ai`:

- `THREAT_SIGNALS` — ransomware, malware, apt, ioc, cve-, etc.
- `KNOWLEDGE_SIGNALS` — truss, filterql, glossary, smart search, etc.
- `platformQuestion` — openers like "what is", "how does", when no threat signal

Routes: `threat` | `knowledge` | `both`

User `mode` bypasses classifier when not `auto`.

### Threat leg

Wraps existing **`searchService.smartSearch`**:

- **≤15 words:** vector keyword path (`searchByKeyword`: text + title + indicator embeddings)
- **>15 words:** Claude `parseQueryToFilter` → FilterQL product search + hybrid vector (parallel)
- Optional Claude **`generateAIResponse`** → JSON `{ summary, content[] }` with `threat_summaries` | `detailed_product_results`

Returns `SmartSearchResponse`: `products`, `parsed_filters`, `ai_response`.

### Knowledge leg

**`knowledgeSearchService`** on `document_chunks` (ingested from `truss-intelligence`):

- E5 query embedding → pgvector similarity
- Optional **`generateKnowledgeResponse`** → JSON with `knowledge_citation`, `prose`, `suggested_actions`

Returns `KnowledgeSearchResponse`: `chunks`, `ai_response`.

## LLM configuration today

On `e/new-ai` search server:

| Setting | Default |
|---------|---------|
| Provider | Anthropic Messages API |
| Model | `LLM_CHAT_MODEL` or `claude-sonnet-4-20250514` |
| Key | `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` |
| Temperature | 0.2 |
| Max tokens | 2048 |

**Shared key** — not assistant-specific. Dashboard BFF does **not** call Claude for assistant answers.

## Embeddings

| Backend | Model | Used for |
|---------|-------|----------|
| Local (default on `e/new-ai`) | `Xenova/e5-base-v2` | Product + document chunk vectors |

## Dashboard rendering

| Response region | UI |
|-----------------|-----|
| `knowledge.ai_response` | Violet "About Truss" block + citations |
| `threat.ai_response` | Primary threat summary + content cards |
| `threat.products` | Search result cards → `ProductCardModal` |
| `threat.parsed_filters` | **Apply** → `useFullFilterStore` (category, industry, region, source + dates only) |

`KnowledgeChunkCard.tsx` exists but is **not** used in the main list UI.

## External query injection

`ProductCardModal` → "Send to Search" → `useAIAssistantStore.setPendingSearchQuery` → same `runSearch` path.

## Integration gaps (current)

1. **`truss-sdk-internal` pin:** dashboard `package.json` may point at `main` while code expects `e/new-ai` types (`assistant()`, knowledge types).
2. **Local `truss-api` checkout** may not include `e/new-ai` routes unless on that branch.
3. **No IOC exact lookup**, **no filter-only leg**, **no dashboard card agent**.
4. **Orphan dashboard files:** `aiService.ts` (OpenAI BFF), `aiFilterService`, `aiResponseService` — not wired to `AiAssistant`.

## Prior art in-repo

- `truss-api/documentation/plans/ai-orchestration.md` (`e/new-ai`) — staged routing tiers, unified envelope, fan-out policy
- `truss-api/documentation/architecture/vector-search-and-ai.md` — smart search + embeddings
