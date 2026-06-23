// `42wp rm <project> [--yes]` — remove a site from the dev env.
//
// Removes the project's containers + locally-built image, drops its database, and
// deletes the generated project dir (~/.42wp/projects/<name>/, including any cloned
// VIP mu-plugins). It does NOT touch your repository: wp-content is a bind mount of
// your working directory, which `docker compose down` leaves untouched.

import fs from 'node:fs/promises';
import path from 'node:path';

import { normalizeName, validateName, dbName } from '../lib/naming.js';
import { projectDir } from '../lib/paths.js';
import { compose, dockerExec, containerIsRunning } from '../lib/docker.js';
import { confirm } from '../lib/prompt.js';
import { step, success, plain, error } from '../lib/log.js';
import { t } from '../lib/i18n.js';
import { ensureDockerRunning } from './global.js';

export async function rm(rawName, opts = {}) {
  if (!rawName) {
    error(t('rm.needName'));
    process.exitCode = 1;
    return;
  }

  const name = normalizeName(rawName);
  validateName(name);
  const db = dbName(name);
  const envDir = projectDir(name);

  // Must be a known project.
  try {
    await fs.access(envDir);
  } catch {
    error(t('rm.notFound', { name, dir: envDir }));
    process.exitCode = 1;
    return;
  }

  // Confirm unless --yes/--force. In a non-interactive shell we refuse rather
  // than guess.
  const skip = opts.yes || opts.force;
  if (!skip) {
    if (!process.stdin.isTTY) {
      error(t('rm.needYes'));
      process.exitCode = 1;
      return;
    }
    const ok = await confirm(t('rm.confirm', { name }));
    if (!ok) {
      plain(t('rm.cancelled'));
      return;
    }
  }

  if (!(await ensureDockerRunning())) return;

  // 1. Stop & remove containers + the image built for this project.
  step(t('rm.removingContainers', { name }));
  await compose(['down', '--rmi', 'local', '--remove-orphans'], { cwd: envDir });

  // 2. Drop the database (only possible while the global MySQL is up).
  if (await containerIsRunning('42wp_mysql')) {
    step(t('rm.droppingDb', { db }));
    await dockerExec('42wp_mysql', [
      'mysql',
      '-uroot',
      '-proot',
      '-e',
      `DROP DATABASE IF EXISTS \`${db}\`;`,
    ]);
  } else {
    step(t('rm.mysqlDown', { db }));
  }

  // 3. Delete the generated project dir (config, Dockerfile, compose, cloned
  // mu-plugins). The repo bind-mounted as wp-content is never inside here.
  step(t('rm.removingData', { dir: envDir }));
  await fs.rm(envDir, { recursive: true, force: true });

  success(t('rm.done', { name }));
}
