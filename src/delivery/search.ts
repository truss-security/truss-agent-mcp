import type { McpServerConfig } from '../config.js';
import { getTrussClient } from '../client.js';
import {
  buildProductSearchPayload,
  type ApiSearchFilter,
} from '../lib/build-product-search-payload.js';
import { debounceApiCall } from '../lib/debounce.js';
import { summarizeProducts, type ProductSummary } from '../lib/summarize-product.js';

export async function searchProductsForDelivery(opts: {
  config: McpServerConfig;
  filter: ApiSearchFilter;
  windowMinutes: number;
  includeIndicators: boolean;
  now?: Date;
}): Promise<ProductSummary[]> {
  const client = getTrussClient(opts.config);
  const end = opts.now ?? new Date();
  const start = new Date(end.getTime() - opts.windowMinutes * 60 * 1000);

  const filterWithWindow: ApiSearchFilter = {
    ...opts.filter,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
  delete filterWithWindow.days;

  const collected: ProductSummary[] = [];
  let page = 1;
  let hasMore = true;
  let pagesFetched = 0;

  while (pagesFetched < opts.config.maxPages && hasMore) {
    await debounceApiCall(opts.config.debounceMs);
    const payload = buildProductSearchPayload(filterWithWindow, page, opts.config.maxLimit);
    const response = await client.search.products(payload);
    collected.push(...summarizeProducts(response.products, opts.includeIndicators));
    hasMore = Boolean(response.hasMore);
    page += 1;
    pagesFetched += 1;
  }

  return collected;
}
