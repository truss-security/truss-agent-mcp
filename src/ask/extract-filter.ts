export { extractFilterFromText, isFilterConfirmation, isConfirmedFilterResponse } from './filter-confirm.js';

import type { SearchWindow } from './search-window.js';
import { DEFAULT_SEARCH_DAYS, defaultSearchWindow, formatSearchWindow } from './search-window.js';
import type { McpTransportMode } from './config.js';

export function buildRunSearchQuery(
  filterExpression: string,
  window: SearchWindow = defaultSearchWindow(),
  transport: McpTransportMode = 'stdio'
): string {
  const windowLabel = formatSearchWindow(window);
  let windowArgs = `Use days: ${window.days ?? DEFAULT_SEARCH_DAYS}.`;
  if (window.startDate && window.endDate) {
    windowArgs = `Use startDate: "${window.startDate}" and endDate: "${window.endDate}" (do not use days).`;
  }

  if (transport === 'remote') {
    return (
      `Run a Truss search now using this confirmed intent exactly:\n` +
      `${filterExpression}\n` +
      `Window: ${windowLabel}. ${windowArgs} ` +
      `Call search_threats (or lookup_ioc if this is a single IOC value). ` +
      `Summarize matching products by id and title.`
    );
  }

  return (
    `Run a Truss product search now using this filterExpression exactly:\n` +
    `${filterExpression}\n` +
    `Window: ${windowLabel}. ${windowArgs} ` +
    `Call validate_filter_expression first, then search_products. ` +
    `Summarize matching products by id and title.`
  );
}
