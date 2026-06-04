# FilterQL cookbook

Natural-language intent → FilterQL examples for host LLMs. Always pair with an appropriate `days` or date range.

| User intent | FilterQL | Notes |
|-------------|----------|-------|
| Recent ransomware | `category = "Ransomware"` | `days: 14` |
| Healthcare-targeting malware | `category = "Malware" AND industry = "Healthcare"` | |
| Phishing from two sources | `(source = "OpenPhish" OR source = "PhishTank") AND category = "Phishing"` | |
| Title mentions LockBit | `title LIKE "%lockbit%"` | `LIKE` is case-sensitive per API |
| High-signal tags | `tags = "ransomware"` | Adjust tag value to your taxonomy |
| European region focus | `region = "Europe"` | |
| Specific feed only | `source = "Your Source Name"` | Use exact source strings from dashboard |
| Multiple categories | `(category = "Malware" OR category = "Ransomware")` | |
| Exclude a source | `category = "Phishing" AND source != "Unwanted"` | `!=` supported |
| Validator present | `validators = "some-validator"` | When metadata exists |

## Pagination patterns

- First page: `search_products` with `limit: 25`
- More results: `search_products_page` with `page: 2` when `hasMore` is true
- Bulk export: `iterate_products_summary` (respects `TRUSS_MCP_MAX_PAGES`)

## STIX export

Use `search_products_stix` with the same `filterExpression` and dates when the downstream tool expects STIX 2.x bundles.

## Validation

Before calling search tools, run:

```
validate_filter_expression({ filterExpression: "..." })
```

See [../docs/03-filterql-for-llms.md](../docs/03-filterql-for-llms.md).
