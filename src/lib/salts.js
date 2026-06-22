// WordPress secret keys/salts. Mirrors the original `curl api.wordpress.org/.../salt/`,
// but with a local fallback so `start` still works offline (the original would have
// written an empty salts block in that case).

import crypto from 'node:crypto';

const SALT_URL = 'https://api.wordpress.org/secret-key/1.1/salt/';

const KEYS = [
  'AUTH_KEY',
  'SECURE_AUTH_KEY',
  'LOGGED_IN_KEY',
  'NONCE_KEY',
  'AUTH_SALT',
  'SECURE_AUTH_SALT',
  'LOGGED_IN_SALT',
  'NONCE_SALT',
];

// Printable ASCII excluding ' and \ so the value is safe inside a single-quoted PHP string.
const CHARSET = (() => {
  let s = '';
  for (let c = 33; c <= 126; c++) {
    if (c === 39 /* ' */ || c === 92 /* \ */) continue;
    s += String.fromCharCode(c);
  }
  return s;
})();

function randomSalt(length = 64) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += CHARSET[bytes[i] % CHARSET.length];
  return out;
}

export function generateSaltsLocally() {
  return KEYS.map((key) => `define( '${key}', '${randomSalt()}' );`).join('\n');
}

// Returns { salts, fromFallback }. Tries api.wordpress.org first (5s timeout),
// then falls back to locally generated salts.
export async function fetchSalts() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(SALT_URL, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text.includes('define(')) return { salts: text, fromFallback: false };
    }
  } catch {
    // network error / abort -> fall through to local generation
  }
  return { salts: generateSaltsLocally(), fromFallback: true };
}
