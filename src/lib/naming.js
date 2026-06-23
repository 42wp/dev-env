// Project-name handling, ported 1:1 from 42script.sh, plus a validation guard.
//
//   bash: PROJECT_NAME="${PROJECT_NAME%.*}"   -> strip a trailing ".suffix"
//   bash: DB_NAME=$(... | tr '-' '_')         -> hyphens become underscores
//   bash: DOMAIN="${PROJECT_NAME}.localhost"

import { t } from './i18n.js';

// Remove the shortest trailing ".something", e.g. "jovempan.localhost" -> "jovempan".
export function normalizeName(raw) {
  return String(raw ?? '').replace(/\.[^.]*$/, '');
}

// MySQL database name and container suffix.
export function dbName(name) {
  return name.replace(/-/g, '_');
}

export function domain(name) {
  return `${name}.localhost`;
}

export function containerName(db) {
  return `wp_${db}`;
}

// Traefik router rule for a project. Subdomain multisite needs a wildcard host so
// that sub-site hosts (<sub>.<domain>) route to the same container; otherwise an
// exact Host() match is enough. Returned with literal backticks for the label;
// the compose template wraps it in single quotes so the backslashes survive YAML.
export function routerRule(dom, { subdomains = false } = {}) {
  if (!subdomains) return `Host(\`${dom}\`)`;
  const esc = dom.replace(/\./g, '\\.');
  return `HostRegexp(\`^([a-z0-9-]+\\.)?${esc}$\`)`;
}

// Guard against shell/SQL/container-name injection in the original's interpolated
// `CREATE DATABASE` and container names. Accepts simple slug characters only.
export function validateName(name) {
  if (!name || !/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error(t('name.invalid', { name }));
  }
  return name;
}
