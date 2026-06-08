export { extractFilterFromText, isFilterConfirmation, isConfirmedFilterResponse } from './filter-confirm.js';

import type { SearchWindow } from './search-window.js';
import { DEFAULT_SEARCH_DAYS, defaultSearchWindow, formatSearchWindow } from './search-window.js';

export function buildRunSearchQuery(
  filterExpression: string,
  window: SearchWindow = defaultSearchWindow()
): string {
  const windowLabel = formatSearchWindow(window);
  let windowArgs = `Use days: ${window.days ?? DEFAULT_SEARCH_DAYS}.`;
  if (window.startDate && window.endDate) {
    windowArgs = `Use startDate: "${window.startDate}" and endDate: "${window.endDate}" (do not use days).`;
  }

  return (
    `Run a Truss product search now using this filterExpression exactly:\n` +
    `${filterExpression}\n` +
    `Window: ${windowLabel}. ${windowArgs} ` +
    `Call validate_filter_expression first, then search_products. ` +
    `Summarize matching products by id and title.`
  );
}
