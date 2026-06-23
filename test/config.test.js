import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_WP_TAG, resolveWpTag, wpImage } from '../src/lib/config.js';

test('default tag is php8.4-apache (newest WP, PHP >= 8.4)', () => {
  assert.equal(DEFAULT_WP_TAG, 'php8.4-apache');
});

test('resolveWpTag precedence: flag > env > default', () => {
  const saved = process.env.FORTYTWO_WP_TAG;
  try {
    delete process.env.FORTYTWO_WP_TAG;
    assert.equal(resolveWpTag(), 'php8.4-apache');
    assert.equal(resolveWpTag('latest'), 'latest');

    process.env.FORTYTWO_WP_TAG = '6.9-php8.5-apache';
    assert.equal(resolveWpTag(), '6.9-php8.5-apache'); // env beats default
    assert.equal(resolveWpTag('latest'), 'latest'); // flag beats env
  } finally {
    if (saved === undefined) delete process.env.FORTYTWO_WP_TAG;
    else process.env.FORTYTWO_WP_TAG = saved;
  }
});

test('wpImage builds the full reference', () => {
  assert.equal(wpImage('php8.4-apache'), 'wordpress:php8.4-apache');
});
