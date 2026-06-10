import type { SearchToolResult } from '../lib/format-search-results.js';
import { parseSearchToolResult } from '../lib/format-search-results.js';

export interface ToolTraceEvent {
  name: string;
  args: Record<string, unknown>;
  resultText: string;
  isError: boolean;
  durationMs: number;
}

export interface TurnDiagnostics {
  toolEvents: ToolTraceEvent[];
  searchPayload?: SearchToolResult;
}

export interface ToolTraceCallbacks {
  onToolStart?: (name: string, argsSummary: string) => void;
  onToolEnd?: (event: ToolTraceEvent) => void;
  onSpinnerLabel?: (label: string) => void;
}

const SEARCH_TOOLS = new Set([
  'search_products',
  'search_products_page',
  'iterate_products_summary',
]);

export function summarizeToolArgs(name: string, args: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof args.filterExpression === 'string' && args.filterExpression) {
    parts.push(`filter: ${args.filterExpression}`);
  }
  if (typeof args.productId === 'number') {
    parts.push(`id: ${args.productId}`);
  }
  if (typeof args.days === 'number') {
    parts.push(`days: ${args.days}`);
  }
  if (typeof args.startDate === 'string' && typeof args.endDate === 'string') {
    parts.push(`range: ${args.startDate} to ${args.endDate}`);
  }
  if (typeof args.filterExpression === 'string' && args.filterExpression === '' && parts.length === 0) {
    parts.push('(no filter)');
  }
  if (parts.length === 0 && Object.keys(args).length > 0) {
    parts.push(JSON.stringify(args));
  }
  return parts.join(' · ') || name;
}

export function summarizeToolResult(name: string, resultText: string, isError: boolean): string {
  if (isError) {
    const firstLine = resultText.split('\n')[0]?.trim();
    return firstLine || 'failed';
  }

  try {
    const data = JSON.parse(resultText) as Record<string, unknown>;
    if (SEARCH_TOOLS.has(name)) {
      const total = data.total ?? (Array.isArray(data.products) ? data.products.length : undefined);
      if (total != null) return `${total} matches`;
    }
    if (name === 'validate_filter_expression') {
      return data.valid === true ? 'valid' : 'invalid';
    }
    if (name === 'search_products_stix' || name === 'get_product_stix') {
      const count = data.objectCount ?? (data.bundle as { objects?: unknown[] } | undefined)?.objects?.length;
      if (count != null) return `${count} STIX objects`;
    }
    if (name === 'iterate_products_summary' && Array.isArray(data.products)) {
      const suffix = data.truncated ? ' (truncated)' : '';
      return `${data.products.length} products${suffix}`;
    }
  } catch {
    // fall through
  }

  const preview = resultText.replace(/\s+/g, ' ').trim();
  return preview.length > 60 ? `${preview.slice(0, 57)}…` : preview;
}

export function toolResultText(result: Record<string, unknown>): string {
  if (Array.isArray(result.content)) {
    const parts = result.content
      .filter((block) => typeof block === 'object' && block !== null && 'text' in block)
      .map((block) => String((block as { text?: string }).text ?? ''));
    if (parts.length > 0) return parts.join('\n');
  }
  return JSON.stringify(result);
}

export function buildTurnDiagnostics(events: ToolTraceEvent[]): TurnDiagnostics {
  let searchPayload: SearchToolResult | undefined;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const event = events[i];
    if (event.isError || !SEARCH_TOOLS.has(event.name)) continue;
    const parsed = parseSearchToolResult(event.resultText);
    if (parsed && parsed.products.length > 0) {
      searchPayload = parsed;
      break;
    }
  }
  return { toolEvents: events, searchPayload };
}

export async function traceToolCall(
  name: string,
  args: Record<string, unknown>,
  call: () => Promise<Record<string, unknown>>,
  callbacks?: ToolTraceCallbacks
): Promise<{ result: Record<string, unknown>; event: ToolTraceEvent }> {
  const argsSummary = summarizeToolArgs(name, args);
  callbacks?.onToolStart?.(name, argsSummary);
  callbacks?.onSpinnerLabel?.(`Running ${name}…`);

  const started = Date.now();
  const result = await call();
  const durationMs = Date.now() - started;
  const resultText = toolResultText(result);
  const isError = result.isError === true;

  const event: ToolTraceEvent = {
    name,
    args,
    resultText,
    isError,
    durationMs,
  };

  callbacks?.onToolEnd?.(event);
  callbacks?.onSpinnerLabel?.('Thinking…');

  return { result, event };
}
