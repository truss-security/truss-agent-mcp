import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  FILTER_COMPARISON_OPERATORS,
  FILTER_LOGICAL_OPERATORS,
  FILTER_QL_ATTRIBUTES,
  parseExpressionToAst,
  validateExpressionSyntax,
} from '@truss-security/truss-sdk';
import { z } from 'zod';
import type { McpServerConfig } from '../config.js';
import { getTrussClient } from '../client.js';
import { debounceApiCall } from '../lib/debounce.js';
import { formatTrussError } from '../lib/errors.js';
import {
  buildProductSearchPayload,
  type ApiSearchFilter,
} from '../lib/build-product-search-payload.js';
import { summarizeProducts } from '../lib/summarize-product.js';
import {
  iterateInputSchema,
  searchInputSchema,
  stixSearchInputSchema,
  type IterateToolInput,
  type SearchFieldsInput,
  type SearchToolInput,
  type StixSearchToolInput,
} from './schemas.js';

function textResult(data: unknown): { content: { type: 'text'; text: string }[] } {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function toolError(message: string): { content: { type: 'text'; text: string }[]; isError: true } {
  return {
    content: [{ type: 'text' as const, text: message }],
    isError: true,
  };
}

function clampLimit(limit: number | undefined, maxLimit: number): number {
  const requested = limit ?? 25;
  return Math.min(Math.max(1, requested), maxLimit);
}

function toApiSearchFilter(input: SearchFieldsInput): ApiSearchFilter {
  return {
    filterExpression: input.filterExpression,
    startDate: input.startDate,
    endDate: input.endDate,
    days: input.days,
    order_by: input.order_by,
    order_direction: input.order_direction,
  };
}

async function withApi<T>(config: McpServerConfig, fn: () => Promise<T>): Promise<T> {
  await debounceApiCall(config.debounceMs);
  return fn();
}

export function registerTrussTools(server: McpServer, config: McpServerConfig): void {
  const client = getTrussClient(config);

  server.registerTool(
    'list_filter_attributes',
    {
      title: 'List FilterQL attributes',
      description:
        'Returns allowed FilterQL attribute names and supported comparison/logical operators.',
      inputSchema: z.object({}),
    },
    async () => {
      return textResult({
        attributes: [...FILTER_QL_ATTRIBUTES],
        comparisonOperators: [...FILTER_COMPARISON_OPERATORS],
        logicalOperators: [...FILTER_LOGICAL_OPERATORS],
      });
    }
  );

  server.registerTool(
    'validate_filter_expression',
    {
      title: 'Validate FilterQL',
      description: 'Check FilterQL syntax before calling search_products.',
      inputSchema: z.object({
        filterExpression: z.string().describe('FilterQL expression to validate'),
      }),
    },
    async ({ filterExpression }: { filterExpression: string }) => {
      const trimmed = filterExpression.trim();
      if (!trimmed) {
        return textResult({ valid: false, error: 'filterExpression is empty' });
      }
      const { ast, error } = parseExpressionToAst(trimmed);
      if (ast) {
        return textResult({ valid: true });
      }
      return textResult({
        valid: validateExpressionSyntax(trimmed),
        error: error ?? 'Invalid FilterQL expression',
      });
    }
  );

  const runSearch = async (input: SearchToolInput) => {
    try {
      const limit = clampLimit(input.limit, config.maxLimit);
      const page = input.page ?? 1;
      const payload = buildProductSearchPayload(toApiSearchFilter(input), page, limit);
      const response = await withApi(config, () => client.search.products(payload));
      return textResult({
        products: summarizeProducts(response.products, input.include_indicators ?? false),
        total: response.total,
        page: response.page,
        limit: response.limit,
        hasMore: response.hasMore,
      });
    } catch (error) {
      return toolError(formatTrussError(error));
    }
  };

  server.registerTool(
    'search_products',
    {
      title: 'Search Truss products',
      description:
        'Search threat intelligence products using FilterQL (filterExpression) and optional date window.',
      inputSchema: searchInputSchema,
    },
    runSearch
  );

  server.registerTool(
    'search_products_page',
    {
      title: 'Search Truss products (paginated)',
      description: 'Same as search_products; use when hasMore is true and you need the next page.',
      inputSchema: searchInputSchema,
    },
    runSearch
  );

  server.registerTool(
    'iterate_products_summary',
    {
      title: 'Iterate Truss products (capped pages)',
      description:
        'Fetches multiple pages of product summaries up to TRUSS_MCP_MAX_PAGES. Use narrow filters.',
      inputSchema: iterateInputSchema,
    },
    async (input: IterateToolInput) => {
      try {
        const limit = clampLimit(input.limit, config.maxLimit);
        const baseFilter = toApiSearchFilter(input);
        const all: ReturnType<typeof summarizeProducts> = [];
        let pagesFetched = 0;
        let hasMore = true;
        let page = 1;

        while (pagesFetched < config.maxPages && hasMore) {
          const payload = buildProductSearchPayload(baseFilter, page, limit);
          const response = await withApi(config, () => client.search.products(payload));
          all.push(
            ...summarizeProducts(response.products, input.include_indicators ?? false)
          );
          pagesFetched += 1;
          hasMore = response.hasMore;
          page += 1;
        }

        return textResult({
          products: all,
          pagesFetched,
          truncated: hasMore,
        });
      } catch (error) {
        return toolError(formatTrussError(error));
      }
    }
  );

  server.registerTool(
    'search_products_stix',
    {
      title: 'Search Truss products (STIX)',
      description: 'Returns a STIX 2.x bundle for products matching the FilterQL filter.',
      inputSchema: stixSearchInputSchema,
    },
    async (input: StixSearchToolInput) => {
      try {
        const limit = clampLimit(input.limit, config.maxLimit);
        const page = input.page ?? 1;
        const payload = buildProductSearchPayload(toApiSearchFilter(input), page, limit);
        const stix = await withApi(config, () => client.search.productsStix(payload));
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(stix, null, 2) }],
        };
      } catch (error) {
        return toolError(formatTrussError(error));
      }
    }
  );

  server.registerTool(
    'get_product_stix',
    {
      title: 'Get product STIX bundle',
      description: 'Fetch a STIX 2.x bundle for a single product by numeric id.',
      inputSchema: z.object({
        productId: z.number().int().positive().describe('Truss product numeric id'),
      }),
    },
    async ({ productId }: { productId: number }) => {
      try {
        const stix = await withApi(config, () => client.search.productStix(productId));
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(stix, null, 2) }],
        };
      } catch (error) {
        return toolError(formatTrussError(error));
      }
    }
  );
}
