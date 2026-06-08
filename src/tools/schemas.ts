import { z } from 'zod';

export const orderBySchema = z
  .enum(['pub_date', 'downloads', 'rating', 'timestamp'])
  .optional();

export const searchInputSchema = z.object({
  filterExpression: z.string().optional().describe('FilterQL expression'),
  days: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Rolling day window; default 7. Wider windows may use more Truss API quota.'),
  startDate: z
    .string()
    .optional()
    .describe('Start date (ISO or YYYY-MM-DD). Use with endDate instead of days for explicit ranges.'),
  endDate: z
    .string()
    .optional()
    .describe('End date (ISO or YYYY-MM-DD). Long ranges may use more Truss API quota.'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(25),
  order_by: orderBySchema,
  order_direction: z.enum(['asc', 'desc']).optional(),
  include_indicators: z
    .boolean()
    .optional()
    .default(false)
    .describe('Include raw indicator values in response'),
});

export type SearchToolInput = z.infer<typeof searchInputSchema>;

/** Shared fields passed to buildProductSearchPayload helpers. */
export interface SearchFieldsInput {
  filterExpression?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  order_by?: SearchToolInput['order_by'];
  order_direction?: SearchToolInput['order_direction'];
  limit?: number;
  page?: number;
  include_indicators?: boolean;
}

export const iterateInputSchema = searchInputSchema.omit({ page: true });

export type IterateToolInput = z.infer<typeof iterateInputSchema>;

export const stixSearchInputSchema = searchInputSchema.omit({ include_indicators: true });

export type StixSearchToolInput = z.infer<typeof stixSearchInputSchema>;
