import type { ProductSummary } from './summarize-product.js';
import { style, type ThemeRole } from './terminal-theme.js';

export interface SearchToolResult {
  products: ProductSummary[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  pagesFetched?: number;
  truncated?: boolean;
  filterExpression?: string;
  windowLabel?: string;
}

const SEARCH_TOOL_NAMES = new Set([
  'search_products',
  'search_products_page',
  'iterate_products_summary',
  'search_threats',
  'lookup_ioc',
]);

const MAX_DISPLAY_ROWS = 15;
const BLOCK_WIDTH = 60;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function pad(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text.padEnd(width);
}

export function parseSearchToolResult(resultText: string): SearchToolResult | undefined {
  try {
    const data = JSON.parse(resultText) as Record<string, unknown>;
    if (!Array.isArray(data.products)) return undefined;
    return {
      products: data.products as ProductSummary[],
      total: typeof data.total === 'number' ? data.total : undefined,
      page: typeof data.page === 'number' ? data.page : undefined,
      limit: typeof data.limit === 'number' ? data.limit : undefined,
      hasMore: data.hasMore === true,
      pagesFetched: typeof data.pagesFetched === 'number' ? data.pagesFetched : undefined,
      truncated: data.truncated === true,
    };
  } catch {
    return undefined;
  }
}

export function isSearchToolName(name: string): boolean {
  return SEARCH_TOOL_NAMES.has(name);
}

export function formatPubDate(value: string | undefined): string {
  if (!value) return '—';
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function formatSearchResultsTable(
  result: SearchToolResult,
  colorize: (role: ThemeRole, text: string) => string = style
): string[] {
  const lines: string[] = [];
  const total = result.total ?? result.products.length;
  const showing = Math.min(result.products.length, MAX_DISPLAY_ROWS);

  if (result.filterExpression) {
    lines.push(colorize('meta', `Filter:  ${result.filterExpression}`));
  }
  if (result.windowLabel) {
    lines.push(colorize('meta', `Window:  ${result.windowLabel}`));
  }
  lines.push(colorize('header', `Matches: ${total} (showing ${showing})`));
  lines.push('');

  const header = `${pad('#', 3)} ${pad('ID', 6)} ${pad('Title', 30)} ${pad('Source', 10)} Pub date`;
  lines.push(colorize('header', header));

  result.products.slice(0, MAX_DISPLAY_ROWS).forEach((product, index) => {
    const row = [
      pad(colorize('meta', String(index + 1)), 3),
      pad(colorize('id', String(product.id ?? '—')), 6),
      pad(truncate(product.title ?? '—', 30), 30),
      pad(truncate(product.source ?? '—', 10), 10),
      formatPubDate(product.pub_date),
    ].join(' ');
    lines.push(row);
  });

  if (result.hasMore || result.truncated || result.products.length > MAX_DISPLAY_ROWS) {
    lines.push('');
    lines.push(colorize('hint', 'More results available — refine filter or paginate.'));
  }

  return lines;
}

export function blockWidth(): number {
  const cols = process.stdout.columns;
  if (!cols || cols < 40) return BLOCK_WIDTH;
  return Math.min(cols, 80);
}

export function formatBlockHeader(label: string): string {
  const width = blockWidth();
  const title = `--- ${label} `;
  const dashes = Math.max(1, width - title.length);
  return `${title}${'-'.repeat(dashes)}`;
}

export function formatBlockFooter(): string {
  return '-'.repeat(blockWidth());
}
