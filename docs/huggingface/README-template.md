---
title: Truss Threat Intelligence for AI
emoji: 🛡️
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
license: mit
tags:
  - threat-intelligence
  - cybersecurity
  - mcp
  - api
  - stix
---

# Query Truss threat data from your AI assistant

[Truss](https://www.truss-security.com) aggregates security products and indicators. This Hugging Face repo is a **discovery hub** for AI developers—not a hosted MCP runtime.

## Quick links

| Resource | URL |
|----------|-----|
| MCP server (GitHub) | https://github.com/truss-security/truss-agent-mcp |
| TypeScript SDK | https://www.npmjs.com/package/@truss-security/truss-sdk |
| SDK & API docs | https://truss-security.github.io/truss-docs/data/sdk |
| Get an API key | Truss dashboard → API / Billing |

## Option A — MCP (recommended for Cursor / Claude)

Install the official MCP server and add your API key to the host config:

```json
{
  "mcpServers": {
    "truss-agent-mcp": {
      "command": "npx",
      "args": ["-y", "@truss-security/truss-agent-mcp"],
      "env": {
        "TRUSS_API_KEY": "YOUR_KEY"
      }
    }
  }
}
```

Full guide: [truss-agent-mcp guides/getting-started](https://github.com/truss-security/truss-agent-mcp/blob/main/guides/getting-started.md)

## Option B — SDK examples

```bash
npm install @truss-security/truss-sdk
export TRUSS_API_KEY=...
npx truss examples basic
```

## Option C — curl

```bash
curl -sS -X POST "https://api.truss-security.com/product/search" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KEY" \
  -d '{"filterExpression": "category = \"Malware\"", "days": 7, "limit": 10}'
```

## FilterQL cookbook (NL → query)

| Intent | FilterQL |
|--------|----------|
| Recent ransomware | `category = "Ransomware"` + `days: 14` |
| Healthcare malware | `category = "Malware" AND industry = "Healthcare"` |
| Phishing feeds | `(source = "OpenPhish" OR source = "PhishTank") AND category = "Phishing"` |

More: [filterql-cookbook.md](https://github.com/truss-security/truss-agent-mcp/blob/main/guides/filterql-cookbook.md)

## How it works

1. Your AI host translates the question into **FilterQL**.
2. The MCP server validates and calls `POST /product/search`.
3. You get citation-friendly product summaries (or STIX via dedicated tools).

Public API keys do not include Truss-hosted “smart search” endpoints in v1—your model builds the filter.

## Coming soon (planned)

Not available yet; see the [API roadmap](https://github.com/truss-security/truss-agent-mcp/blob/main/docs/06-api-roadmap.md):

- **API quota visibility** — remaining usage for your key (truss-api / API Gateway work)
- **Contributor product POST** — submit products with contributor-tier keys
- **Smart and similarity search** — NL and vector search on eligible customer keys
- **Product GET by id** — native Truss JSON for a single product (in addition to STIX)

## Publishing checklist

- [ ] Create HF repo from this template
- [ ] Set README from this file
- [ ] Link GitHub repo and npm package in HF metadata
- [ ] Optional: add a `notebooks/truss_api_python.ipynb` for `requests` examples

Source of truth for this template: `truss-agent-mcp/docs/huggingface/README-template.md`
