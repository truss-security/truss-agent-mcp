/**
 * Ported from truss-agent/src/adapters/input/build-product-search-payload.ts
 * Keep in sync when FilterQL or date-window rules change in truss-agent.
 */

export const LEGACY_ARRAY_FILTER_KEYS = [
  'category',
  'source',
  'author',
  'industry',
  'region',
  'reference',
  'tags',
  'indicators',
] as const;

export type LegacyArrayFilterKey = (typeof LEGACY_ARRAY_FILTER_KEYS)[number];

export interface ApiSearchFilter {
  filterExpression?: string;
  startDate?: string | number;
  endDate?: string | number;
  days?: number;
  order_by?: 'pub_date' | 'downloads' | 'rating' | 'timestamp';
  order_direction?: 'asc' | 'desc';
  category?: string[];
  source?: string[];
  author?: string[];
  industry?: string[];
  region?: string[];
  reference?: string[];
  tags?: string[];
  indicators?: string[];
}

function escapeFilterQlLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function comparisonsForAttribute(attr: string, values: string[]): string {
  const parts = values.map((v) => `${attr} = "${escapeFilterQlLiteral(v)}"`);
  if (parts.length === 1) return parts[0];
  return `(${parts.join(' OR ')})`;
}

export function legacyArraysToFilterExpression(filter: ApiSearchFilter): string | undefined {
  const clauses: string[] = [];
  for (const key of LEGACY_ARRAY_FILTER_KEYS) {
    const arr = filter[key];
    if (Array.isArray(arr) && arr.length > 0) {
      const trimmed = arr.map((s) => String(s).trim()).filter(Boolean);
      if (trimmed.length > 0) clauses.push(comparisonsForAttribute(key, trimmed));
    }
  }
  if (clauses.length === 0) return undefined;
  return clauses.join(' AND ');
}

export interface ProductSearchPayload {
  filterExpression?: string;
  startDate?: string | number;
  endDate?: string | number;
  days?: number;
  page: number;
  limit: number;
  order_by?: 'pub_date' | 'downloads' | 'rating' | 'timestamp';
  order_direction?: 'asc' | 'desc';
}

export function buildProductSearchPayload(
  filter: ApiSearchFilter,
  page: number,
  limit: number
): ProductSearchPayload {
  const trimmedExpr = filter.filterExpression?.trim();
  const fromExpr = trimmedExpr ? trimmedExpr : undefined;
  const fromArrays = fromExpr ? undefined : legacyArraysToFilterExpression(filter);

  const payload: ProductSearchPayload = {
    page,
    limit,
  };

  if (fromExpr) {
    payload.filterExpression = fromExpr;
  } else if (fromArrays) {
    payload.filterExpression = fromArrays;
  }

  if (filter.startDate != null) {
    payload.startDate = filter.startDate;
  }
  if (filter.endDate != null) {
    payload.endDate = filter.endDate;
  }
  if (filter.days != null && filter.startDate == null) {
    payload.days = filter.days;
  }

  if (filter.order_by != null) {
    payload.order_by = filter.order_by;
  }
  if (filter.order_direction != null) {
    payload.order_direction = filter.order_direction;
  }

  return payload;
}
