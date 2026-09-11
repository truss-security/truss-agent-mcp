import type { ProductSummary } from '../../lib/summarize-product.js';

const DESCRIPTION_MAX = 4096;
const TITLE_MAX = 256;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function formatDiscordMetadata(
  products: ProductSummary[],
  agentName: string
): { embeds: { title: string; description: string; color: number }[] } {
  const lines = products.slice(0, 10).map((product) => {
    const title = truncate(product.title?.trim() || 'Untitled', 120);
    const category = product.category?.trim() || 'n/a';
    const id = product.id != null ? String(product.id) : '?';
    return `• **${title}** (${category}) · id ${id}`;
  });
  const extra =
    products.length > 10 ? `\n…and ${products.length - 10} more` : '';
  const description = truncate(lines.join('\n') + extra || 'No product titles', DESCRIPTION_MAX);

  return {
    embeds: [
      {
        title: truncate(`${agentName}: ${products.length} product(s)`, TITLE_MAX),
        description,
        color: 0x1f6feb,
      },
    ],
  };
}
