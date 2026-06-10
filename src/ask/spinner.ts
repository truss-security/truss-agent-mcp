import { stdout } from 'node:process';

export interface SpinnerHandle {
  setLabel: (label: string) => void;
}

export async function withSpinner<T>(
  label: string,
  fn: (handle: SpinnerHandle) => Promise<T>
): Promise<T> {
  if (!stdout.isTTY) {
    return fn({ setLabel: () => {} });
  }

  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let currentLabel = label;
  let i = 0;

  const render = (): void => {
    stdout.write(`\r${frames[i % frames.length]} ${currentLabel}`);
    i += 1;
  };

  render();
  const timer = setInterval(render, 80);

  const handle: SpinnerHandle = {
    setLabel: (next: string) => {
      currentLabel = next;
    },
  };

  try {
    return await fn(handle);
  } finally {
    clearInterval(timer);
    stdout.write('\r\x1b[K');
  }
}
