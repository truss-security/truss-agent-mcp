const SEARCH_VERBS =
  /\b(search|find|list|show|get|query|fetch|retrieve|run|look\s*up|pull\s+up)\b/i;

const SEARCH_CONTEXT_EXEMPT =
  /\b(explain\s+why|0\s+results?|no\s+matches?|refine\s+this\s+search|why\s+(?:did|does)\s+this|no\s+products?)\b/i;

const ASK_INTENT_PATTERNS = [
  /\b(make|build|create|write|draft|design)\b.*\b(filter|filterql|query)\b/i,
  /\b(filter|filterql)\b.*\b(for|about|on)\b/i,
  /\b(explain|how\s+(?:do|does|to|should)|what\s+(?:is|are)|why\s+(?:not|doesn't|don't)|tell\s+me\s+about)\b/i,
  /\b(alias(?:es)?|known\s+names?|also\s+known\s+as|other\s+names?)\b/i,
  /\b(help\s+me\s+(?:understand|build|write)|coaching|without\s+searching)\b/i,
  /\b(which\s+field|what\s+operator|syntax|field\s+guide|rejected\s+approach)\b/i,
  /\b(expand|broaden|narrow)\b.*\bfilter\b/i,
  /\bshould\s+i\s+use\b/i,
];

export function shouldSuggestAskMode(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (SEARCH_CONTEXT_EXEMPT.test(trimmed)) return false;
  if (SEARCH_VERBS.test(trimmed)) return false;
  return ASK_INTENT_PATTERNS.some((pattern) => pattern.test(trimmed));
}
