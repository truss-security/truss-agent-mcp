export const DETECTION_RULE_GUIDE = `Detection query rule generation (from Truss search results in conversation):

Supported platforms:
- Palo Alto Networks Cortex XDR (XQL)
- CrowdStrike Falcon (Event Search / FQL-style hunting queries)
- Splunk (SPL)
- Microsoft Sentinel (KQL)
- Sigma (generic YAML rule format)

Input requirements:
- Use IOCs, tags, and context from prior Truss search results already in the conversation thread.
- Never invent IOCs, hashes, domains, or IPs not present in prior results or user-pasted content.
- If IOC values are missing, tell the user to re-run the search with include_indicators: true, or paste the IOC list — do not fabricate values.

Output format:
- Label each platform's query in a separate fenced code block with the platform tag: cortex, falcon, splunk, sentinel, sigma.
- Include a brief comment explaining what the query hunts for and which IOCs/fields it uses.
- Clearly separate Truss FilterQL from platform query languages — FilterQL uses =, !=, LIKE on Truss attributes; platform queries use their native syntax.

When the user asks for detection rules without specifying a platform, ask which tool they use or offer the list above.`;
