import { TrussApiError, TrussNetworkError, TrussTimeoutError } from '@truss-security/truss-sdk';

export function formatTrussError(error: unknown): string {
  if (error instanceof TrussApiError) {
    const status = error.status != null ? ` (HTTP ${error.status})` : '';
    if (error.status === 429) {
      return `Truss API rate limit exceeded${status}. Wait and retry with a smaller limit or fewer tool calls.`;
    }
    return `Truss API error${status}: ${error.message}`;
  }
  if (error instanceof TrussTimeoutError) {
    return `Truss API request timed out: ${error.message}`;
  }
  if (error instanceof TrussNetworkError) {
    return `Truss API network error: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
