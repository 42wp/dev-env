// Configurable defaults.
//
// The WordPress image tag is everything after `wordpress:` in the Dockerfile's
// FROM line. The default is `php8.4-apache` — the newest WordPress while keeping
// PHP pinned at 8.4 + Apache. Override per project with `--wp <tag>`, or globally
// with FORTYTWO_WP_TAG. Examples of valid tags: `php8.4-apache`, `latest`,
// `6.9-php8.5-apache`.

export const DEFAULT_WP_TAG = 'php8.4-apache';

// Resolve the effective tag: explicit flag wins, then env var, then default.
export function resolveWpTag(override) {
  return override || process.env.FORTYTWO_WP_TAG || DEFAULT_WP_TAG;
}

// Full image reference for display/logging.
export function wpImage(tag) {
  return `wordpress:${tag}`;
}
