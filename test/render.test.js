import { test } from 'node:test';
import assert from 'node:assert/strict';

import { render, renderTemplate, readTemplate } from '../src/lib/render.js';

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

test('multisite .htaccess templates strip the site prefix (no redirect loop)', async () => {
  // The prefix-capturing rule is what makes /br/wp-admin/ resolve instead of looping.
  const subdir = await readTemplate('htaccess.multisite-subdir');
  assert.ok(subdir.includes('^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]'));

  const subdomain = await readTemplate('htaccess.multisite-subdomain');
  assert.ok(subdomain.includes('^(wp-(content|admin|includes).*) $1 [L]'));
});

test('demo seeder template covers the required dataset', async () => {
  const seed = await readTemplate('demo-seed.php');
  // The taxonomy is provided by the project (42-framework); the seeder must NOT register it.
  assert.ok(!seed.includes('register_taxonomy'), 'does not register taxonomies');
  assert.ok(seed.includes('picsum.photos'), 'downloads picsum images');
  assert.ok(seed.includes('media_sideload_image'), 'sideloads images');
  assert.ok(seed.includes("wp_set_object_terms( $post_id, $pick( $tag_ids, 2, 5 ), 'post_tag' )"), '2-5 tags');
  assert.ok(seed.includes("$pick( $author_ids, 1, 3 ), '42wp_author'"), '1-3 authors');
  assert.ok(seed.includes('set_post_thumbnail'), 'featured image');
  assert.ok(seed.includes('$now - wp_rand'), 'past dates only');
});
