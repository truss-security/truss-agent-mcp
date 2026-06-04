import type { SearchProductResponse } from '@truss-security/truss-sdk';

export interface ProductSummary {
  id?: number;
  truss_prod_id?: string;
  title?: string;
  category?: string;
  source?: string;
  type?: string;
  pub_date?: string;
  indicator_type_counts?: Record<string, number>;
  indicators?: Record<string, string[]>;
}

function serializeDate(value: Date | string | undefined): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function indicatorTypeCounts(
  indicators: Record<string, string[]> | undefined
): Record<string, number> | undefined {
  if (!indicators || typeof indicators !== 'object') return undefined;
  const counts: Record<string, number> = {};
  for (const [type, values] of Object.entries(indicators)) {
    if (Array.isArray(values)) counts[type] = values.length;
  }
  return Object.keys(counts).length > 0 ? counts : undefined;
}

export function summarizeProduct(
  product: SearchProductResponse,
  includeIndicators: boolean
): ProductSummary {
  const summary: ProductSummary = {
    id: product.id,
    truss_prod_id: product.truss_prod_id,
    title: product.title,
    category: product.category,
    source: product.source,
    type: product.type,
    pub_date: serializeDate(product.pub_date as Date | string | undefined),
    indicator_type_counts: indicatorTypeCounts(product.indicators),
  };

  if (includeIndicators && product.indicators) {
    summary.indicators = product.indicators;
  }

  return summary;
}

export function summarizeProducts(
  products: SearchProductResponse[],
  includeIndicators: boolean
): ProductSummary[] {
  return products.map((p) => summarizeProduct(p, includeIndicators));
}
