// `42wp wp <project> <args...>` — port of wp_cli_proxy from 42script.sh.
// Proxies a WP-CLI command into the project's running container.

import { normalizeName, validateName, dbName, containerName } from '../lib/naming.js';
import { containerIsRunning, dockerExec } from '../lib/docker.js';
import { error } from '../lib/log.js';
import { t } from '../lib/i18n.js';

export async function wp(rawName, args) {
  if (!rawName) {
    error(t('wp.needArgs'));
    process.exitCode = 1;
    return;
  }

  const name = normalizeName(rawName);
  validateName(name);
  const container = containerName(dbName(name));

  if (!(await containerIsRunning(container))) {
    error(t('wp.notRunning', { container }));
    process.exitCode = 1;
    return;
  }

  // Original always appends --allow-root.
  await dockerExec(container, ['wp', ...args, '--allow-root'], { interactive: true });
}
