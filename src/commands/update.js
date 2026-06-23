// `42wp update <project> [--wp <tag>]` — update an existing project to a newer
// WordPress image. Regenerates the project's Dockerfile with the resolved tag,
// re-pulls the base image, rebuilds & recreates the container, then runs
// `wp core update-db` to migrate the database schema to the new core.

import fs from 'node:fs/promises';
import path from 'node:path';

import { normalizeName, validateName, dbName, containerName } from '../lib/naming.js';
import { projectDir } from '../lib/paths.js';
import { renderTemplate } from '../lib/render.js';
import { compose, dockerExec, dockerExecCapture } from '../lib/docker.js';
import { pollUntil } from '../lib/wait.js';
import { step, success, error } from '../lib/log.js';
import { t } from '../lib/i18n.js';
import { resolveWpTag, wpImage } from '../lib/config.js';
import { ensureDockerRunning, checkGlobalLayer } from './global.js';

export async function update(rawName, opts = {}) {
  if (!rawName) {
    error(t('update.needName'));
    process.exitCode = 1;
    return;
  }

  const name = normalizeName(rawName);
  validateName(name);
  const db = dbName(name);
  const container = containerName(db);
  const envDir = projectDir(name);

  // The project must already exist (created by `start`).
  try {
    await fs.access(path.join(envDir, 'docker-compose.yml'));
  } catch {
    error(t('update.notFound', { name, dir: envDir }));
    process.exitCode = 1;
    return;
  }

  if (!(await ensureDockerRunning())) return;
  await checkGlobalLayer();

  const wpTag = resolveWpTag(opts.wp);
  const image = wpImage(wpTag);

  // Rewrite the Dockerfile with the new tag.
  step(t('update.rebuilding', { name, image }));
  const dockerfile = await renderTemplate('project.Dockerfile', { WP_TAG: wpTag });
  await fs.writeFile(path.join(envDir, 'Dockerfile'), dockerfile, 'utf8');

  // `--pull` forces a re-fetch of the base image even when the tag (e.g.
  // php8.4-apache) is unchanged but has moved upstream; then recreate.
  await compose(['build', '--pull'], { cwd: envDir });
  await compose(['up', '-d'], { cwd: envDir });

  // Wait for WP-CLI to respond in the recreated container.
  step(t('start.waitingWp'));
  await pollUntil(
    async () => {
      const { code } = await dockerExecCapture(container, ['wp', 'core', 'version', '--allow-root']);
      return code === 0;
    },
    { label: 'WordPress', timeout: 90000 },
  );

  // Migrate the database schema to match the new core.
  step(t('update.updatingDb'));
  await dockerExec(container, ['wp', 'core', 'update-db', '--allow-root']);

  const { stdout: version } = await dockerExecCapture(container, [
    'wp',
    'core',
    'version',
    '--allow-root',
  ]);
  success(t('update.done', { name, version: version || wpTag }));
}
