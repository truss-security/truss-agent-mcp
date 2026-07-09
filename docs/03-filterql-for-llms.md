# FilterQL for LLM hosts

Translate user intent into **Truss FilterQL**, then call `search_products`. Stay Truss-first; mention external/OSINT only after the Truss path.

Validate first: `validate_filter_expression` — saves API quota on typos.

## Operators

| Operator | Use |
|----------|-----|
| `=` | Exact match |
| `!=` | Exclude |
| `LIKE` | Substring with `%` — mainly `title`, selective `reference` |
| `AND` / `OR` | Narrow / broaden (parenthesize OR groups) |

No `IN`, `CONTAINS`, colon syntax, or regex.

## Attributes

`category`, `region`, `industry`, `source`, `author`, `tags`, `reference`, `indicators`, `title`, `type`, `validators`

| Field | Guidance |
|-------|----------|
| `tags` | Primary for named threats (actors, malware) |
| `title` | `LIKE` for keywords — never `title = "OneWord"` |
| `reference` | URLs only — not threat-name search |
| `indicators` | IOC-related filters per Truss taxonomy |

Call `list_filter_attributes` for the canonical SDK list.

## Date windows

Pass as tool args, not inside FilterQL:

- **`days: 7`** — default; lowest quota
- **`days: 30`** or long ranges — user-requested only; more quota
- **`startDate` / `endDate`** — explicit range

REPL: `run` after filter confirm, or `run 30` / `days 30`.

## Workflow

1. Reframe as a Truss product search
2. Draft `filterExpression` (`=`, `!=`, `LIKE`)
3. `validate_filter_expression` → `search_products` (limit ≤ 25)
4. Cite `id` and `title`
5. **Follow-ups** on prior results (dedupe IOCs, reformat) or "don't query again" → conversation only, no tools
6. Full IOC values on a **new** search → `include_indicators: true`

## Common mistakes

- `tag:Sandworm`, `tags IN (...)`, single quotes
- `title = "Sandworm"` or `reference = "Sandworm"` for threat names
- Dates inside FilterQL

Examples: [../guides/filterql-cookbook.md](../guides/filterql-cookbook.md)

---

**Prev:** [02 — Public API contract](./02-public-api-contract.md) · **Next:** [04 — MCP tool catalog](./04-mcp-tool-catalog.md) · [Docs index](./README.md)
