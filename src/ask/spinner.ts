export async function withSpinner<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!process.stdout.isTTY) {
    return fn();
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const timer = setInterval(() => {
    process.stdout.write(`\r${frames[i % frames.length]} ${label}`);
    i += 1;
  }, 80);

  try {
    return await fn();
  } finally {
    clearInterval(timer);
    process.stdout.write('\r\x1b[K');
  }
}
