# FilterQL for LLM hosts

Host models should translate user intent into **Truss FilterQL** before calling `search_products`. Stay **Truss-first**: frame answers as Truss product search; mention external/OSINT only after the Truss path or when the user asks.

Use `validate_filter_expression` to catch syntax errors without spending API quota.

## Operators

| Operator | Use |
|----------|-----|
| `=` | Exact match — category, source, tags, type, industry, region, author, validators |
| `!=` | Exclude — e.g. `source != "Unwanted"` |
| `LIKE` | Substring with `%` — primarily `title`; selective `reference` URL patterns |
| `AND` | Narrow (binds tighter than OR) |
| `OR` | Broaden — use parentheses |

Only these operators exist. No `IN`, `CONTAINS`, colon syntax, or regex.

## Attributes

| Attribute | Truss data | Operators | Guidance |
|-----------|------------|-----------|----------|
| `tags` | Threat actors, malware, campaigns | `=`, `!=`, `OR` | Primary field for named threats |
| `category` | Malware, Ransomware, Phishing, … | `=`, `!=` | Product category bucket |
| `type` | Product type | `=`, `!=` | Exact Truss type string |
| `source` | Feed or publisher | `=`, `!=` | Exact feed name |
| `industry` | Target sector | `=`, `!=`, `OR` | e.g. Healthcare |
| `region` | Geography | `=`, `!=`, `OR` | e.g. Europe |
| `author` | Report authors | `=`, `!=`, `LIKE` sparingly | |
| `title` | Report headlines | `LIKE` only for keywords | Never `title = "OneWord"` |
| `reference` | Citation URLs | `=`, `LIKE` for URL patterns | Not for threat-name keyword search |
| `indicators` | IOC-related | `=`, `LIKE` | When user asks about IOCs |
| `validators` | Validator metadata | `=`, `!=` | When user names a validator |

Call `list_filter_attributes` to return the canonical list from the SDK.

## Examples

```
category = "Ransomware"
```

```
category = "Malware" AND industry = "Healthcare"
```

```
source != "Unwanted" AND category = "Phishing"
```

```
(source = "OpenPhish" OR source = "PhishTank") AND category = "Phishing"
```

```
title LIKE "%lockbit%"
```

```
tags = "Sandworm"
```

```
(tags = "Sandworm" OR tags = "APT44" OR tags = "Voodoo Bear")
```

## Date windows

Pass separately in tool args (not inside FilterQL):

- `days: 7` — rolling last 7 days (**default**; lowest quota use)
- `days: 30` or longer ranges — only when the user requests; may use additional Truss API quota
- `startDate` / `endDate` — explicit range (e.g. `startDate: "2026-06-01"`, `endDate: "2026-06-08"`)

In the Truss MCP REPL, use `run` after confirming a filter (default 7 days), or `run 30` / `days 30` for custom rolling windows.

## Workflow

1. Reframe the question as a Truss product search.
2. Call `list_filter_attributes` if unsure of field names.
3. Draft `filterExpression` using `=`, `!=`, or `LIKE`.
4. Call `validate_filter_expression`.
5. Call `search_products` with `limit` ≤ 25 unless the user needs more.
6. Cite results using Truss `id` and `title`.
7. For follow-ups on prior results (extract/dedupe/group IOCs, reformat summaries) or when the user says not to query Truss again — use conversation context only; do not call MCP tools.

Use `include_indicators: true` on `search_products` when a **new** search must return full IOC values.

## Common mistakes

- Non-Truss syntax: `tag:Sandworm`, `tags IN (...)`, single quotes
- `title = "Sandworm"` — use `title LIKE "%sandworm%"` only as optional broadening
- `reference = "Sandworm"` — reference holds URLs
- Dates inside FilterQL — use tool date fields
- External search before Truss — cover Truss FilterQL first

More: [../guides/filterql-cookbook.md](../guides/filterql-cookbook.md).
