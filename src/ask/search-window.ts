import { DEFAULT_SEARCH_DAYS } from '../instructions.js';

export { DEFAULT_SEARCH_DAYS };

export interface SearchWindow {
  days?: number;
  startDate?: string;
  endDate?: string;
}

export const QUOTA_WINDOW_HINT =
  'Wider date windows may use additional Truss API quota. Default is 7 days; narrow your filter or window if quota matters.';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoDate(value: string): Date | undefined {
  if (!ISO_DATE.test(value)) return undefined;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function daysBetween(start: string, end: string): number | undefined {
  const startDate = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  if (!startDate || !endDate) return undefined;
  const diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return undefined;
  return Math.ceil(diff / (24 * 60 * 60 * 1000)) + 1;
}

export function defaultSearchWindow(): SearchWindow {
  return { days: DEFAULT_SEARCH_DAYS };
}

export function formatSearchWindow(window: SearchWindow): string {
  if (window.startDate && window.endDate) {
    return `${window.startDate} to ${window.endDate}`;
  }
  if (window.days != null) {
    return `last ${window.days} day${window.days === 1 ? '' : 's'}`;
  }
  return `last ${DEFAULT_SEARCH_DAYS} days`;
}

export function parseSearchWindowArg(arg: string): SearchWindow | undefined {
  const trimmed = arg.trim();
  if (!trimmed) return undefined;

  const daysOnly = /^\d+$/.exec(trimmed);
  if (daysOnly) {
    const days = Number.parseInt(daysOnly[0], 10);
    return days > 0 ? { days } : undefined;
  }

  const startMatch = /start:\s*(\d{4}-\d{2}-\d{2})/i.exec(trimmed);
  const endMatch = /end:\s*(\d{4}-\d{2}-\d{2})/i.exec(trimmed);
  if (startMatch && endMatch) {
    return { startDate: startMatch[1], endDate: endMatch[1] };
  }

  return undefined;
}

export function extractSearchWindowFromText(text: string): SearchWindow | undefined {
  const lower = text.toLowerCase();

  const rangeMatch =
    /from\s+(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})/i.exec(text) ??
    /(\d{4}-\d{2}-\d{2})\s*(?:to|through|-)\s*(\d{4}-\d{2}-\d{2})/i.exec(text);
  if (rangeMatch) {
    return { startDate: rangeMatch[1], endDate: rangeMatch[2] };
  }

  const rollingMatch =
    /(?:last|past|previous)\s+(\d+)\s+days?/i.exec(lower) ??
    /(\d+)\s*-?\s*day(?:s)?\s+window/i.exec(lower);
  if (rollingMatch) {
    const days = Number.parseInt(rollingMatch[1], 10);
    if (days > 0) return { days };
  }

  return undefined;
}

export function isExtendedSearchWindow(window: SearchWindow): boolean {
  if (window.days != null && window.days > DEFAULT_SEARCH_DAYS) {
    return true;
  }
  if (window.startDate && window.endDate) {
    const span = daysBetween(window.startDate, window.endDate);
    if (span != null && span > DEFAULT_SEARCH_DAYS) {
      return true;
    }
  }
  return false;
}

export function mergeSearchWindow(base: SearchWindow, override?: SearchWindow): SearchWindow {
  if (!override) return { ...base };
  return {
    days: override.days ?? base.days,
    startDate: override.startDate ?? base.startDate,
    endDate: override.endDate ?? base.endDate,
  };
}
