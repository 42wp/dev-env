// Readiness polling — replaces the original's fixed `sleep 10` / `sleep 5`.
// Repeatedly runs an async check until it returns truthy or the timeout elapses.

import { t } from './i18n.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// check: async () => boolean. Resolves when check() is truthy; rejects on timeout.
export async function pollUntil(check, { timeout = 60000, interval = 1500, label = '' } = {}) {
  const deadline = Date.now() + timeout;
  // First attempt immediately, then poll on the interval.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let ok = false;
    try {
      ok = await check();
    } catch {
      ok = false;
    }
    if (ok) return;
    if (Date.now() >= deadline) {
      throw new Error(t('wait.timeout', { label, seconds: Math.round(timeout / 1000) }));
    }
    await sleep(interval);
  }
}
