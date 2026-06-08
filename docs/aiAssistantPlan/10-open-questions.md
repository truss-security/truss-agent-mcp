# Open questions — resolve before implementation plan

Decisions to close when moving from conceptualization to an executable implementation plan.

## Orchestrator and routing

1. **Max orchestrator tool turns** — 1 vs 2 vs 3 before hard stop?
2. **New `route` enum values** — Add `filter_only`, `ioc`, `dashboard` or overload `threat`/`knowledge`?
3. **Blended queries** — Always parallel knowledge+threat when orchestrator selects both, or sequential with time budget?
4. **Tier-2 classifier** — Ship rules+orchestrator only first, or embed light model in Phase 2?

## Claude and keys

5. **Key rotation** — Single long-lived assistant key or per-environment keys (test/prod) under one Console project?
6. **Model default** — Stay on `claude-sonnet-4-20250514` or use Haiku for orchestrator routing only?
7. **Metadata support** — Confirm Anthropic `metadata` field availability for `session_id` / `agent_id` on target API version.

## IOC agent

8. **Normalization** — Reuse which exact functions from product ingest / indicator services?
9. **Partial IOC match** — Support subdomain/wildcard or exact only?
10. **Response when no match** — Suggest vector fallback via `threatSearch` automatically?

## FilterQL agent

11. **Filter-only default** — Should `filterQl` ever trigger product search without explicit user ask?
12. **Apply UX** — Show raw FilterQL string in assistant panel always?

## Dashboard card agent

13. **Target view** — Always `currentView` or let user pick tab?
14. **Chart selection** — LLM-only or rules + LLM (e.g. "list" → `productList`)?
15. **Filter dependency** — Require active filter on dashboard or allow agent to propose filter+card together?

## API and deploy

16. **Branch strategy** — Merge `e/new-ai` to main before work or continue feature branch?
17. **SEARCH_SERVER_URL** — Single orchestrator host confirmed for test and prod?
18. **Backward compatibility** — Minimum SDK version for dashboard after `agents` field ships?

## Product and UX

19. **Mode selector** — Keep Threat/Knowledge/Both/Auto forever or hide when orchestrator is trusted?
20. **truss-agent-mcp relationship** — Document cross-link only, or eventual shared tool schemas?

## Security and abuse

21. **Rate limits** — Per-user assistant query limits separate from `/search/smart`?
22. **Prompt injection** — Additional guardrails on orchestrator system prompt beyond existing security tests?

## Testing

23. **Golden question ownership** — Single repo for fixtures (`truss-api` tests vs shared doc in `truss-intelligence`)?
24. **CI without doc ingest** — Skip knowledge tests vs dockerized mini-corpus?

---

Record decisions in this file or a sibling `DECISIONS.md` when the implementation plan is approved.
