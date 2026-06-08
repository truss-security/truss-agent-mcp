const FILTER_ATTRIBUTES = [
  'category',
  'region',
  'industry',
  'source',
  'author',
  'tags',
  'reference',
  'indicators',
  'title',
  'type',
  'validators',
] as const;

const FILTER_PATTERN = new RegExp(
  `\\b(?:${FILTER_ATTRIBUTES.join('|')})\\s*(?:=|!=|LIKE)`,
  'i'
);

function normalizeFilterExpression(raw: string): string {
  return raw
    .replace(/^filter:\s*/i, '')
    .replace(/\bdays:\s*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeFilterQl(text: string): boolean {
  return FILTER_PATTERN.test(text);
}

export function extractFilterFromText(text: string): string | undefined {
  const codeBlocks = [...text.matchAll(/```(?:\w+)?\n?([\s\S]*?)```/g)].map((m) =>
    normalizeFilterExpression(m[1].trim())
  );

  for (let i = codeBlocks.length - 1; i >= 0; i--) {
    const block = codeBlocks[i];
    if (block && looksLikeFilterQl(block)) {
      return block;
    }
  }

  const lines = text
    .split('\n')
    .map((line) => normalizeFilterExpression(line.trim()))
    .filter((line) => line.length > 0);

  for (let i = lines.length - 1; i >= 0; i--) {
    if (looksLikeFilterQl(lines[i])) {
      return lines[i];
    }
  }

  return undefined;
}

export function buildRunSearchQuery(filterExpression: string, days = 30): string {
  return (
    `Run a Truss product search now using this filterExpression exactly:\n` +
    `${filterExpression}\n` +
    `Use days: ${days}. Call validate_filter_expression first, then search_products. ` +
    `Summarize matching products by id and title.`
  );
}
