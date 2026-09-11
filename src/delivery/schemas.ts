import { z } from 'zod';

const FILTERQL_MAX_EXPRESSION_LENGTH = 4_096;

const envVarName = z
  .string()
  .min(1)
  .regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'env var name must be a valid identifier');

export const apiSearchFilterSchema = z.object({
  filterExpression: z.string().max(FILTERQL_MAX_EXPRESSION_LENGTH).optional(),
  days: z.number().int().nonnegative().optional(),
  order_by: z.enum(['pub_date', 'downloads', 'rating', 'timestamp']).optional(),
  order_direction: z.enum(['asc', 'desc']).optional(),
  startDate: z.union([z.number(), z.string()]).optional(),
  endDate: z.union([z.number(), z.string()]).optional(),
  category: z.array(z.string()).optional(),
  source: z.array(z.string()).optional(),
  author: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  reference: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  indicators: z.array(z.string()).optional(),
});

export type ApiSearchFilter = z.infer<typeof apiSearchFilterSchema>;

export const connectionQuerySchema = z
  .object({
    configName: z.string().optional(),
    filter: apiSearchFilterSchema.optional(),
    windowDays: z.number().int().positive().optional(),
    windowMinutes: z.number().int().positive().optional(),
  })
  .strict();

export const discordConnectionSchema = z
  .object({
    name: z.string().min(1),
    type: z.literal('discord'),
    category: z.literal('chat').optional(),
    description: z.string().optional(),
    enabled: z.boolean().default(false),
    webhookUrlEnv: envVarName,
    query: connectionQuerySchema.optional(),
  })
  .strict();

export type DiscordConnection = z.infer<typeof discordConnectionSchema>;

export const connectionsFileSchema = z
  .object({
    connections: z.array(discordConnectionSchema),
  })
  .strict();

export type ConnectionsFile = z.infer<typeof connectionsFileSchema>;

export const agentConfigSchema = z
  .object({
    agentName: z.string().min(1),
  })
  .strict();

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export const outputFormatSchema = z.enum(['ioc', 'metadata', 'report']);

export type OutputFormat = z.infer<typeof outputFormatSchema>;

export const jobScheduleSchema = z.union([z.string().min(1).max(512), z.number().int().positive()]);

export const deliveryJobSchema = z
  .object({
    name: z.string().min(1),
    enabled: z.boolean().optional().default(true),
    connectionName: z.string().min(1),
    configName: z.string().optional(),
    schedule: jobScheduleSchema,
    outputFormat: outputFormatSchema,
    includeIndicators: z.boolean().optional().default(false),
    filter: apiSearchFilterSchema.optional(),
    windowDays: z.number().int().positive().optional(),
    windowMinutes: z.number().int().positive().optional(),
  })
  .strict();

export type DeliveryJob = z.infer<typeof deliveryJobSchema>;

export const jobsFileSchema = z
  .object({
    formatVersion: z.number().optional(),
    jobs: z.array(deliveryJobSchema),
  })
  .strict();

export type JobsFile = z.infer<typeof jobsFileSchema>;
