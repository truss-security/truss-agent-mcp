import { TrussClient } from '@truss-security/truss-sdk';
import type { McpServerConfig } from './config.js';

let cached: TrussClient | null = null;

export function getTrussClient(config: McpServerConfig): TrussClient {
  if (!cached) {
    cached = new TrussClient({
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      retries: 0,
      userAgent: config.userAgent,
    });
  }
  return cached;
}

export function resetClientForTests(): void {
  cached = null;
}
