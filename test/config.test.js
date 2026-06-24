import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_WP_TAG,
  resolveWpTag,
  wpImage,
  multisiteConfig,
  resolveDemoCount,
  DEFAULT_DEMO_COUNT,
} from '../src/lib/config.js';

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

test('multisiteConfig: subdirectory vs subdomain constants', () => {
  const sub = multisiteConfig('demo.localhost');
  assert.match(sub, /define\( 'MULTISITE', true \);/);
  assert.match(sub, /define\( 'SUBDOMAIN_INSTALL', false \);/);
  assert.match(sub, /define\( 'DOMAIN_CURRENT_SITE', 'demo\.localhost' \);/);

  const sd = multisiteConfig('demo.localhost', { subdomains: true });
  assert.match(sd, /define\( 'SUBDOMAIN_INSTALL', true \);/);
});

test('resolveDemoCount: off / default / custom', () => {
  assert.equal(resolveDemoCount(undefined), null); // not requested
  assert.equal(resolveDemoCount(false), null);
  assert.equal(resolveDemoCount(true), DEFAULT_DEMO_COUNT); // bare --demo-content
  assert.equal(resolveDemoCount('50'), 50); // --demo-content=50
  assert.equal(resolveDemoCount('0'), DEFAULT_DEMO_COUNT); // invalid -> default
  assert.equal(resolveDemoCount('abc'), DEFAULT_DEMO_COUNT);
});
