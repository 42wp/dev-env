import { test } from 'node:test';
import assert from 'node:assert/strict';

import { render, renderTemplate } from '../src/lib/render.js';

test('render substitutes placeholders', () => {
  const out = render('host={{DOMAIN}} db={{DB_NAME}}', {
    DOMAIN: 'x.localhost',
    DB_NAME: 'x',
  });
  assert.equal(out, 'host=x.localhost db=x');
});

test('render replaces every occurrence', () => {
  assert.equal(render('{{A}}-{{A}}', { A: '1' }), '1-1');
});

test('render throws on a missing variable', () => {
  assert.throws(() => render('{{MISSING}}', {}), /Missing template variable: MISSING/);
});

test('Dockerfile template renders the WordPress image tag', async () => {
  const out = await renderTemplate('project.Dockerfile', { WP_TAG: 'php8.4-apache' });
  assert.match(out, /^FROM wordpress:php8.4-apache$/m);
  assert.ok(!out.includes('{{'), 'no placeholders left');
});
