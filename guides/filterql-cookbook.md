# FilterQL cookbook

Truss-first: every row below is a **Truss product search** via FilterQL. Pair with `days` or `startDate`/`endDate` on the search tool.

| User intent | FilterQL | Operators used |
|-------------|----------|----------------|
| Recent ransomware | `category = "Ransomware"` | `=` |
| Exclude a feed | `category = "Phishing" AND source != "Unwanted"` | `=`, `!=` |
| Healthcare malware | `category = "Malware" AND industry = "Healthcare"` | `=`, `AND` |
| Phishing from two sources | `(source = "OpenPhish" OR source = "PhishTank") AND category = "Phishing"` | `=`, `OR`, `AND` |
| Title mentions LockBit | `title LIKE "%lockbit%"` | `LIKE` |
| Named threat (Sandworm) | `tags = "Sandworm"` | `=` — ask about aliases before OR-expanding |
| Named threat + aliases | `(tags = "Sandworm" OR tags = "APT44" OR tags = "Voodoo Bear")` | `=`, `OR` |
| European focus | `region = "Europe"` | `=` |
| Not phishing | `category != "Phishing"` | `!=` |
| Reference from domain | `reference LIKE "%.gov%"` | `LIKE` on URL field |

## Named threats

1. Start: `tags = "PrimaryName"`
2. Ask user about aliases
3. Expand with `OR` only after confirmation

## External search

Cover the Truss filter first. If the user needs global/OSINT beyond Truss products, say so explicitly after proposing the Truss query.

## Validation

```
validate_filter_expression({ filterExpression: "..." })
```

See [../docs/03-filterql-for-llms.md](../docs/03-filterql-for-llms.md).
