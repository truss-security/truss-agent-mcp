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

const CONFIRMATION_MARKERS = [
  /confirmed\s+filter/i,
  /ready\s+to\s+search/i,
  /filter\s+ready/i,
  /here(?:'s| is)\s+your\s+confirmed/i,
];

const CONFIRMATION_INPUT =
  /^(?:\d{1,2}|yes|y|confirm|comprehensive|simple|ok|okay|run)$/i;

export function isFilterConfirmation(userText: string): boolean {
  return CONFIRMATION_INPUT.test(userText.trim());
}

export function isConfirmedFilterResponse(assistantText: string): boolean {
  return CONFIRMATION_MARKERS.some((pattern) => pattern.test(assistantText));
}

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

function extractCodeBlocks(text: string): string[] {
  return [...text.matchAll(/```(?:\w+)?\n?([\s\S]*?)```/g)].map((m) =>
    normalizeFilterExpression(m[1].trim())
  );
}

function extractFromConfirmedSection(text: string): string | undefined {
  const sections = text.split(/(?=^#{1,3}\s|^\*\*Confirmed|\*\*Ready to search)/im);
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    if (!CONFIRMATION_MARKERS.some((p) => p.test(section))) continue;
    const blocks = extractCodeBlocks(section);
    for (let j = blocks.length - 1; j >= 0; j--) {
      if (blocks[j] && looksLikeFilterQl(blocks[j])) {
        return blocks[j];
      }
    }
  }
  return undefined;
}

function extractLastFilterBlock(text: string): string | undefined {
  const blocks = extractCodeBlocks(text);
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i] && looksLikeFilterQl(blocks[i])) {
      return blocks[i];
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

export interface ExtractFilterOptions {
  preferConfirmed?: boolean;
  allowDraft?: boolean;
}

export function extractFilterFromText(
  text: string,
  options: ExtractFilterOptions = {}
): string | undefined {
  const { preferConfirmed = false, allowDraft = true } = options;

  if (preferConfirmed || isConfirmedFilterResponse(text)) {
    const confirmed = extractFromConfirmedSection(text);
    if (confirmed) return confirmed;
    if (isConfirmedFilterResponse(text)) {
      return extractLastFilterBlock(text);
    }
    if (!allowDraft) return undefined;
  }

  return allowDraft ? extractLastFilterBlock(text) : undefined;
}
