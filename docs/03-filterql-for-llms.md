# FilterQL for LLM hosts

Host models should translate user intent into **FilterQL** before calling `search_products`. Use `validate_filter_expression` to catch syntax errors without spending API quota.

## Attributes

| Attribute | Typical use |
|-----------|-------------|
| `category` | Malware, Ransomware, Phishing, … |
| `source` | Feed or publisher name |
| `type` | Product type |
| `title` | Title substring (`LIKE`) |
| `author` | Author names |
| `industry` | Target industry (e.g. Healthcare) |
| `region` | Geographic region |
| `tags` | Tag values |
| `reference` | Reference URLs or labels |
| `indicators` | IOC-related filter |
| `validators` | Validator metadata |

## Operators

- Comparison: `=`, `!=`, `LIKE`
- Logic: `AND` (tighter binding), `OR`
- Literals: double-quoted strings; escape `"` and `\` inside literals

## Examples

```
category = "Ransomware"
```

```
category = "Malware" AND industry = "Healthcare"
```

```
(source = "OpenPhish" OR source = "PhishTank") AND category = "Phishing"
```

```
title LIKE "%lockbit%"
```

## Date windows

Pass separately in tool args (not inside FilterQL):

- `days: 7` — rolling last 7 days
- `startDate` / `endDate` — explicit range (prefer when user says “since January”)

When `startDate` is provided, the server omits `days` so the API does not override the window.

## Workflow for the host LLM

1. Call `list_filter_attributes` if unsure of field names.
2. Draft `filterExpression` from the user question.
3. Call `validate_filter_expression` — fix errors if invalid.
4. Call `search_products` with `limit` ≤ 25 unless the user needs more.
5. Cite results using `id` and `title` from the response.

## Common mistakes

- Using single quotes for strings (use double quotes)
- Inventing attributes not in the list
- Putting dates inside FilterQL (use tool date fields)
- Requesting hundreds of rows in one tool call (paginate or use `iterate_products_summary` with caps)

More examples: [../guides/filterql-cookbook.md](../guides/filterql-cookbook.md).
