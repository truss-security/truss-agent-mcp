import { maskWebhookUrl } from '../secret-refs.js';

export async function postDiscordWebhook(
  webhookUrl: string,
  body: unknown,
  fetchImpl: typeof fetch = fetch
): Promise<void> {
  const response = await fetchImpl(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed (HTTP ${response.status})`);
  }
}

export function discordWebhookErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/https?:\/\/\S+/g, (url) => maskWebhookUrl(url));
  }
  return String(error);
}
