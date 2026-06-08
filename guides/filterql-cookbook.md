# FilterQL cookbook

Truss product search via FilterQL. Pair filters with `days` or `startDate`/`endDate` on the search tool (default **7 days**).

| Intent | FilterQL |
|--------|----------|
| Recent ransomware | `category = "Ransomware"` |
| Exclude a feed | `category = "Phishing" AND source != "Unwanted"` |
| Healthcare malware | `category = "Malware" AND industry = "Healthcare"` |
| Two phishing sources | `(source = "OpenPhish" OR source = "PhishTank") AND category = "Phishing"` |
| Title keyword | `title LIKE "%lockbit%"` |
| Named threat | `tags = "Sandworm"` |
| With aliases | `(tags = "Sandworm" OR tags = "APT44" OR tags = "Voodoo Bear")` |
| Region | `region = "Europe"` |
| Exclude category | `category != "Phishing"` |
| URL pattern | `reference LIKE "%.gov%"` |

## Named threats

1. Start with `tags = "PrimaryName"`
2. Ask about aliases before expanding
3. Add `OR` clauses only after confirmation

In the terminal REPL: build in **ask**, confirm, then **`run`**.

## Validation

Call `validate_filter_expression` before `search_products` when the model authored the filter.

Reference: [../docs/03-filterql-for-llms.md](../docs/03-filterql-for-llms.md)
