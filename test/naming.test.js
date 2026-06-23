import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeName,
  dbName,
  domain,
  containerName,
  validateName,
  routerRule,
} from '../src/lib/naming.js';

test('normalizeName strips a single trailing suffix', () => {
  assert.equal(normalizeName('jovempan.localhost'), 'jovempan');
  assert.equal(normalizeName('foo.bar.baz'), 'foo.bar');
  assert.equal(normalizeName('plain'), 'plain');
});

test('dbName turns hyphens into underscores', () => {
  assert.equal(dbName('grande-premio'), 'grande_premio');
  assert.equal(dbName('jovempan'), 'jovempan');
});

test('domain and containerName', () => {
  assert.equal(domain('jovempan'), 'jovempan.localhost');
  assert.equal(containerName('grande_premio'), 'wp_grande_premio');
});

test('validateName accepts slugs and rejects unsafe input', () => {
  assert.equal(validateName('grande-premio'), 'grande-premio');
  assert.equal(validateName('jovem_pan2'), 'jovem_pan2');
  for (const bad of ['', 'a b', 'foo;bar', '../etc', 'name`cmd`', 'na.me']) {
    assert.throws(() => validateName(bad), /Invalid|inválido/);
  }
});

test('routerRule: exact host by default, wildcard for subdomain multisite', () => {
  assert.equal(routerRule('demo.localhost'), 'Host(`demo.localhost`)');
  assert.equal(
    routerRule('demo.localhost', { subdomains: true }),
    'HostRegexp(`^([a-z0-9-]+\\.)?demo\\.localhost$`)',
  );
});
