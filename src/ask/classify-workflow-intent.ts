import type { WorkflowOffer, WorkflowState } from './workflow-state.js';

export type WorkflowIntent =
  | 'knowledge'
  | 'filter_build'
  | 'filter_refine'
  | 'query_execute'
  | 'format_output'
  | 'detection_rules'
  | 'context_only'
  | 'confirm_filter';

const SEARCH_VERBS =
  /\b(search|find|list|show|get|query|fetch|retrieve|run|look\s*up|pull\s+up)\b/i;

const SEARCH_CONTEXT_EXEMPT =
  /\b(explain\s+why|0\s+results?|no\s+matches?|refine\s+this\s+search|why\s+(?:did|does)\s+this|no\s+products?|(?:don'?t|do\s+not)\s+(?:query|hit|call|use)\s+(?:truss|the\s+api)|without\s+(?:searching|querying)\s+again|(?:from|using)\s+(?:previous|prior|these)\s+results?|these\s+returned|returned\s+products?|what\s+you\s+(?:just\s+)?gave|extract\s+(?:all\s+)?iocs?|dedupe|deduplicat|group(?:ed)?\s+and\s+dedup)\b/i;

const FILTER_BUILD_PATTERNS = [
  /\b(make|build|create|write|draft|design)\b.*\b(filter|filterql|query)\b/i,
  /\b(filter|filterql)\b.*\b(for|about|on)\b/i,
  /\bhelp\s+me\s+(?:understand|build|write)\b.*\bfilter\b/i,
];

const FILTER_REFINE_PATTERNS = [
  /\b(refine|improve|narrow|broaden|expand|tweak|adjust|fix|update)\b.*\bfilter\b/i,
  /\bfilter\b.*\b(refine|improve|narrow|broaden|expand|tweak|adjust|fix|update)\b/i,
  /\bmake\s+(?:it|the\s+filter)\s+(?:broader|narrower|more\s+specific)\b/i,
];

const KNOWLEDGE_PATTERNS = [
  /\b(explain|how\s+(?:do|does|to|should)|what\s+(?:is|are)|why\s+(?:not|doesn't|don't)|tell\s+me\s+about)\b/i,
  /\b(alias(?:es)?|known\s+names?|also\s+known\s+as|other\s+names?)\b/i,
  /\b(which\s+field|what\s+operator|syntax|field\s+guide|rejected\s+approach)\b/i,
  /\bshould\s+i\s+use\b/i,
  /\bwhat\s+is\s+(?:truss|filterql)\b/i,
];

const FORMAT_PATTERNS = [
  /\b(?:as\s+)?stix\b/i,
  /\bstix\s+bundle\b/i,
  /\b(?:as\s+)?json\b/i,
  /\bformat\b.*\b(?:json|stix)\b/i,
  /\bdisplay\b.*\b(?:json|stix)\b/i,
];

const DETECTION_PATTERNS = [
  /\bdetect(?:ion)?\s+(?:rule|query|queries)\b/i,
  /\b(?:cortex|falcon|splunk|sentinel|qradar|sigma)\b/i,
  /\bhunting\s+query\b/i,
  /\bsiem\b/i,
  /\bedr\b/i,
];

const CONFIRM_PATTERNS = [
  /^(?:confirm|yes|y|ok|okay|1|2|option\s+[12]|simple|comprehensive)$/i,
  /\bconfirm(?:ed|ing)?\s+(?:filter|this)\b/i,
  /\b(?:yes|yeah|yep),?\s*(?:query|run|search|go\s+ahead)\b/i,
];

const AFFIRMATIVE = /^(?:yes|y|yeah|yep|ok|okay|sure|please|go\s+ahead|do\s+it)$/i;

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function intentFromLastOffer(
  text: string,
  lastOffer: WorkflowOffer | undefined
): WorkflowIntent | undefined {
  if (!lastOffer || !AFFIRMATIVE.test(text.trim())) return undefined;

  switch (lastOffer) {
    case 'build_filter':
      return 'filter_build';
    case 'refine_filter':
      return 'filter_refine';
    case 'query_api':
      return 'query_execute';
    case 'format_output':
      return 'format_output';
    case 'detection_rules':
      return 'detection_rules';
    default:
      return undefined;
  }
}

export function classifyWorkflowIntent(
  text: string,
  state: Pick<
    WorkflowState,
    'lastOffer' | 'draftFilter' | 'confirmedFilter' | 'hasQueryResults'
  >
): WorkflowIntent {
  const trimmed = text.trim();
  if (!trimmed) return 'knowledge';

  const offerIntent = intentFromLastOffer(trimmed, state.lastOffer);
  if (offerIntent) return offerIntent;

  if (CONFIRM_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return 'confirm_filter';
  }

  if (SEARCH_CONTEXT_EXEMPT.test(trimmed)) {
    return 'context_only';
  }

  if (matchesAny(trimmed, DETECTION_PATTERNS)) {
    return 'detection_rules';
  }

  if (matchesAny(trimmed, FORMAT_PATTERNS)) {
    return 'format_output';
  }

  if (matchesAny(trimmed, FILTER_REFINE_PATTERNS) && (state.draftFilter || state.confirmedFilter)) {
    return 'filter_refine';
  }

  if (matchesAny(trimmed, FILTER_BUILD_PATTERNS)) {
    return 'filter_build';
  }

  if (SEARCH_VERBS.test(trimmed)) {
    return 'query_execute';
  }

  if (matchesAny(trimmed, KNOWLEDGE_PATTERNS)) {
    return 'knowledge';
  }

  if (state.draftFilter || state.confirmedFilter) {
    return 'filter_refine';
  }

  return 'knowledge';
}

export function buildIntentHint(intent: WorkflowIntent): string {
  return `[intent: ${intent}]`;
}
