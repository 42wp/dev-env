import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateSaltsLocally } from '../src/lib/salts.js';

test('generateSaltsLocally produces 8 define() lines', () => {
  const lines = generateSaltsLocally().split('\n');
  assert.equal(lines.length, 8);
  for (const line of lines) {
    assert.match(line, /^define\( '[A-Z_]+', '.{64}' \);$/);
  }
});

test('generated salts are safe inside single-quoted PHP strings', () => {
  const salts = generateSaltsLocally();
  // No single quotes or backslashes that would break the PHP string.
  const values = [...salts.matchAll(/'([^']*)', '(.+)' \);/g)].map((m) => m[2]);
  assert.equal(values.length, 8);
  for (const v of values) {
    assert.ok(!v.includes("'"), 'no single quote');
    assert.ok(!v.includes('\\'), 'no backslash');
  }
});

test('keys are the 8 WordPress constants', () => {
  const keys = [...generateSaltsLocally().matchAll(/define\( '([A-Z_]+)'/g)].map((m) => m[1]);
  assert.deepEqual(keys, [
    'AUTH_KEY',
    'SECURE_AUTH_KEY',
    'LOGGED_IN_KEY',
    'NONCE_KEY',
    'AUTH_SALT',
    'SECURE_AUTH_SALT',
    'LOGGED_IN_SALT',
    'NONCE_SALT',
  ]);
});
