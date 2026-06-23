// Configurable defaults.
//
// The WordPress image tag is everything after `wordpress:` in the Dockerfile's
// FROM line. The default is `php8.4-apache` — the newest WordPress while keeping
// PHP pinned at 8.4 + Apache. Override per project with `--wp <tag>`, or globally
// with FORTYTWO_WP_TAG. Examples of valid tags: `php8.4-apache`, `latest`,
// `6.9-php8.5-apache`.

export const DEFAULT_WP_TAG = 'php8.4-apache';

// Default admin credentials for the silent install (override with --user / --pass).
export const DEFAULT_ADMIN_USER = 'admin';
export const DEFAULT_ADMIN_PASS = 'password';

// WordPress VIP: the prebuilt mu-plugins, cloned into the project and mounted at
// wp-content/mu-plugins when `start --vip` is used.
export const VIP_MU_PLUGINS_REPO = 'https://github.com/Automattic/vip-go-mu-plugins-built';

// Resolve the effective tag: explicit flag wins, then env var, then default.
export function resolveWpTag(override) {
  return override || process.env.FORTYTWO_WP_TAG || DEFAULT_WP_TAG;
}

// Full image reference for display/logging.
export function wpImage(tag) {
  return `wordpress:${tag}`;
}

// The multisite constants block injected into wp-config.php (the {{MULTISITE_CONFIG}}
// placeholder). Must only be written AFTER the network tables exist — see the
// two-phase flow in commands/start.js.
export function multisiteConfig(dom, { subdomains = false } = {}) {
  return [
    '/* Multisite */',
    "define( 'WP_ALLOW_MULTISITE', true );",
    "define( 'MULTISITE', true );",
    `define( 'SUBDOMAIN_INSTALL', ${subdomains ? 'true' : 'false'} );`,
    `define( 'DOMAIN_CURRENT_SITE', '${dom}' );`,
    "define( 'PATH_CURRENT_SITE', '/' );",
    "define( 'SITE_ID_CURRENT_SITE', 1 );",
    "define( 'BLOG_ID_CURRENT_SITE', 1 );",
  ].join('\n');
}
