/** Redact a secret for logs — never prints the full value. */
export function maskSecret(value: string): string {
  const v = value.trim();
  if (!v) return 'empty';
  if (v.length <= 8) return `${v.length} chars`;
  return `${v.slice(0, 3)}…${v.slice(-4)} (${v.length} chars)`;
}
