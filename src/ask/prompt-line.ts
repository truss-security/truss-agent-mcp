import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

export function isInteractive(): boolean {
  return Boolean(stdin.isTTY);
}

export async function promptLine(question: string): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(question);
    return answer.trim();
  } finally {
    rl.close();
  }
}

/** Reads a line without echoing characters (TTY only). Falls back to visible prompt. */
export async function promptSecret(label: string): Promise<string> {
  if (!stdin.isTTY) {
    return promptLine(`${label}: `);
  }

  stdout.write(`${label} (input hidden): `);

  return new Promise((resolve, reject) => {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let value = '';

    const cleanup = (): void => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('data', onData);
    };

    const onData = (chunk: string): void => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          cleanup();
          stdout.write('\n');
          resolve(value.trim());
          return;
        }
        if (ch === '\u0003') {
          cleanup();
          stdout.write('\n');
          reject(new Error('Cancelled'));
          return;
        }
        if (ch === '\u007f' || ch === '\b') {
          value = value.slice(0, -1);
          continue;
        }
        value += ch;
      }
    };

    stdin.on('data', onData);
  });
}
