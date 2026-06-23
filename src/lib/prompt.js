// Minimal interactive yes/no prompt for destructive actions.

import { createInterface } from 'node:readline/promises';

// Ask a y/N question on the terminal. Defaults to "no" (safe for destructive ops).
// Callers should only invoke this when process.stdin.isTTY is true.
export async function confirm(question, { defaultYes = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const suffix = defaultYes ? '[Y/n]' : '[y/N]';
    const answer = (await rl.question(`${question} ${suffix} `)).trim().toLowerCase();
    if (!answer) return defaultYes;
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}
