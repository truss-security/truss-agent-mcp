import type Anthropic from '@anthropic-ai/sdk';

type ContentBlock = Anthropic.Beta.BetaContentBlock;

export function extractTextFromContent(content: ContentBlock[]): string {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === 'text' && block.text) {
      parts.push(block.text);
    }
  }
  return parts.join('\n').trim();
}

export function printAssistantResponse(content: ContentBlock[]): void {
  const text = extractTextFromContent(content);
  if (text) {
    console.log(`\n${text}\n`);
  }
}
