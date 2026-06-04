let lastCallAt = 0;

export function resetDebounceForTests(): void {
  lastCallAt = 0;
}

export async function debounceApiCall(debounceMs: number): Promise<void> {
  if (debounceMs <= 0) return;
  const now = Date.now();
  const elapsed = now - lastCallAt;
  if (elapsed < debounceMs) {
    await new Promise((resolve) => setTimeout(resolve, debounceMs - elapsed));
  }
  lastCallAt = Date.now();
}
