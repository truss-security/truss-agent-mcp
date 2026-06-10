import type { SearchWindow } from './search-window.js';
import { defaultSearchWindow } from './search-window.js';

export type WorkflowOffer =
  | 'build_filter'
  | 'refine_filter'
  | 'query_api'
  | 'format_output'
  | 'detection_rules';

export interface WorkflowState {
  lastOffer?: WorkflowOffer;
  draftFilter?: string;
  confirmedFilter?: string;
  searchWindow: SearchWindow;
  hasQueryResults: boolean;
  lastFilterExpression?: string;
}

export function createWorkflowState(): WorkflowState {
  return {
    searchWindow: defaultSearchWindow(),
    hasQueryResults: false,
  };
}

const OFFER_PATTERNS: { offer: WorkflowOffer; pattern: RegExp }[] = [
  {
    offer: 'build_filter',
    pattern: /would you like to build a filter for this\?/i,
  },
  {
    offer: 'refine_filter',
    pattern: /would you like to refine or improve the filter\?/i,
  },
  {
    offer: 'query_api',
    pattern: /would you like me to query truss api for this data\?/i,
  },
  {
    offer: 'format_output',
    pattern: /would you like me to display the results in a particular way \(json, stix\)\?/i,
  },
  {
    offer: 'detection_rules',
    pattern:
      /would you like me to build detection query rules for particular tools using these results\?/i,
  },
];

export function detectLastOffer(assistantText: string): WorkflowOffer | undefined {
  for (const { offer, pattern } of OFFER_PATTERNS) {
    if (pattern.test(assistantText)) return offer;
  }
  return undefined;
}

export function updateWorkflowFromAssistant(
  state: WorkflowState,
  assistantText: string
): WorkflowState {
  const lastOffer = detectLastOffer(assistantText);
  const hasQueryResults =
    state.hasQueryResults ||
    /\bResults:\s*\d+\s+matches?\b/i.test(assistantText) ||
    /\b\d+\s+matches?\b/i.test(assistantText);

  const filterMatch = /Filter:\s*(.+)/i.exec(assistantText);
  const lastFilterExpression = filterMatch?.[1]?.trim() ?? state.lastFilterExpression;

  return {
    ...state,
    lastOffer: lastOffer ?? state.lastOffer,
    hasQueryResults,
    lastFilterExpression,
  };
}

export function setDraftFilter(state: WorkflowState, filter: string): WorkflowState {
  return { ...state, draftFilter: filter };
}

export function setConfirmedFilter(state: WorkflowState, filter: string): WorkflowState {
  return { ...state, confirmedFilter: filter, draftFilter: filter };
}

export function clearFilters(state: WorkflowState): WorkflowState {
  return {
    ...state,
    draftFilter: undefined,
    confirmedFilter: undefined,
    lastFilterExpression: undefined,
    hasQueryResults: false,
    lastOffer: undefined,
  };
}

export function formatWorkflowStatus(state: WorkflowState): string[] {
  const lines = ['Workflow state:'];
  lines.push(`  Last offer: ${state.lastOffer ?? '(none)'}`);
  lines.push(`  Has query results: ${state.hasQueryResults ? 'yes' : 'no'}`);
  lines.push(`  Draft filter: ${state.draftFilter ?? '(none)'}`);
  lines.push(`  Confirmed filter: ${state.confirmedFilter ?? '(none)'}`);
  lines.push(`  Last filter expression: ${state.lastFilterExpression ?? '(none)'}`);
  return lines;
}
