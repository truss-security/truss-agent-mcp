import { stdout } from 'node:process';
import {
  formatBlockFooter,
  formatBlockHeader,
  formatSearchResultsTable,
  type SearchToolResult,
} from '../lib/format-search-results.js';
import { describeColorSetting, style } from '../lib/terminal-theme.js';
import {
  summarizeToolArgs,
  summarizeToolResult,
  type ToolTraceEvent,
} from './tool-trace.js';

const OFFER_PATTERNS = [
  /would you like to build a filter for this\?/i,
  /would you like to refine or improve the filter\?/i,
  /would you like me to query truss api for this data\?/i,
  /would you like me to display the results in a particular way \(json, stix\)\?/i,
  /would you like me to build detection query rules for particular tools using these results\?/i,
];

function writeln(text = ''): void {
  console.log(text);
}

function isOfferLine(line: string): boolean {
  return OFFER_PATTERNS.some((pattern) => pattern.test(line));
}

function colorizeAssistantLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return '';
  if (isOfferLine(trimmed) || trimmed.startsWith('?')) {
    return style('offer', trimmed.startsWith('?') ? trimmed : `? ${trimmed}`);
  }
  return style('assistant', line);
}

export function formatAssistantText(text: string): string {
  if (!text.trim()) return '';

  const lines = text.split('\n');
  const output: string[] = [];
  let inFilterql = false;
  const filterqlLines: string[] = [];

  const flushFilterql = (): void => {
    if (filterqlLines.length === 0) return;
    output.push(style('filterql', filterqlLines.join('\n')));
    filterqlLines.length = 0;
  };

  for (const line of lines) {
    const fence = line.trim();
    if (fence === '```filterql') {
      flushFilterql();
      inFilterql = true;
      continue;
    }
    if (inFilterql) {
      if (fence === '```' || fence.startsWith('```')) {
        flushFilterql();
        inFilterql = false;
      } else {
        filterqlLines.push(line);
      }
      continue;
    }
    output.push(colorizeAssistantLine(line));
  }

  flushFilterql();
  return output.join('\n');
}

export function printPrompt(text: string): string {
  return style('prompt', text);
}

export function printHint(text: string): void {
  writeln();
  writeln(style('hint', text));
  writeln();
}

export function printError(text: string): void {
  writeln();
  writeln(style('error', text));
  writeln();
}

export function printHeader(text: string): void {
  writeln();
  writeln(style('header', text));
}

export function printMeta(text: string): void {
  writeln(style('meta', text));
}

export function printPlain(text: string): void {
  writeln(text);
}

export function printUserBlock(text: string): void {
  writeln();
  writeln(formatBlockHeader('You'));
  writeln(style('user', text));
  writeln(formatBlockFooter());
}

export function printToolBlock(event: ToolTraceEvent): void {
  writeln();
  writeln(formatBlockHeader(`MCP · ${event.name}`));
  const argsSummary = summarizeToolArgs(event.name, event.args);
  writeln(style('toolCall', `→ ${event.name}`));
  if (argsSummary) {
    writeln(style('meta', `  ${argsSummary}`));
  }
  const summary = summarizeToolResult(event.name, event.resultText, event.isError);
  const line = event.isError
    ? style('toolError', `✗ ${summary} · ${event.durationMs}ms`)
    : style('toolOk', `✓ ${summary} · ${event.durationMs}ms`);
  writeln(line);
  writeln(formatBlockFooter());
}

export function printToolStart(name: string, argsSummary: string): void {
  stdout.write('\r\x1b[K');
  writeln();
  writeln(formatBlockHeader(`MCP · ${name}`));
  writeln(style('toolCall', `→ ${name}`));
  if (argsSummary) {
    writeln(style('meta', `  ${argsSummary}`));
  }
}

export function printToolEnd(event: ToolTraceEvent): void {
  const summary = summarizeToolResult(event.name, event.resultText, event.isError);
  const line = event.isError
    ? style('toolError', `✗ ${summary} · ${event.durationMs}ms`)
    : style('toolOk', `✓ ${summary} · ${event.durationMs}ms`);
  writeln(line);
  writeln(formatBlockFooter());
}

export function printResultsBlock(result: SearchToolResult): void {
  writeln();
  writeln(formatBlockHeader('Results'));
  for (const line of formatSearchResultsTable(result)) {
    writeln(line);
  }
  writeln(formatBlockFooter());
}

export function printAssistantBlock(text: string): void {
  if (!text.trim()) return;
  writeln();
  writeln(formatBlockHeader('Truss'));
  writeln(formatAssistantText(text));
  writeln(formatBlockFooter());
  writeln();
}

/** @deprecated Use printAssistantBlock */
export function printAssistantResponse(text: string): void {
  printAssistantBlock(text);
}

export function printColorStatus(): void {
  writeln();
  writeln(`Color: ${describeColorSetting()}`);
  writeln();
}
