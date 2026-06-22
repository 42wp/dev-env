// `42wp start <project>` — port of start_project from 42script.sh.
// Creates the DB, generates wp-config.php / Dockerfile / docker-compose.yml,
// builds & starts the project containers, then runs a silent WordPress install.

import fs from 'node:fs/promises';
import path from 'node:path';

import { normalizeName, validateName, dbName, domain, containerName } from '../lib/naming.js';
import { projectDir } from '../lib/paths.js';
import { renderTemplate, render, readTemplate } from '../lib/render.js';
import { fetchSalts } from '../lib/salts.js';
import { compose, dockerExec, dockerExecCapture } from '../lib/docker.js';
import { pollUntil } from '../lib/wait.js';
import { step, success, plain, error, colors } from '../lib/log.js';
import { t } from '../lib/i18n.js';
import { ensureDockerRunning, checkGlobalLayer } from './global.js';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password';
const ADMIN_EMAIL = 'dev@42wp.localhost';

export async function start(rawName) {
  if (!rawName) {
    error(t('start.needName'));
    process.exitCode = 1;
    return;
  }

  // The repo the user is sitting in becomes the container's wp-content.
  const repoDir = process.cwd();

  const name = normalizeName(rawName);
  validateName(name);

  const dom = domain(name);
  const db = dbName(name);
  const container = containerName(db);
  const envDir = projectDir(name);

  if (!(await ensureDockerRunning())) return;
  await checkGlobalLayer();

  step(t('start.preparing', { domain: dom }));
  await fs.mkdir(envDir, { recursive: true });

  // 1. Database on the global MySQL.
  step(t('start.creatingDb', { db }));
  await dockerExec('42wp_mysql', [
    'mysql',
    '-uroot',
    '-proot',
    '-e',
    `CREATE DATABASE IF NOT EXISTS \`${db}\`;`,
  ]);

  // 2. Ephemeral wp-config.php (with real or locally-generated salts).
  step(t('start.genConfig'));
  const { salts, fromFallback } = await fetchSalts();
  if (fromFallback) step(t('start.saltsFallback'));
  const wpConfig = render(await readTemplate('wp-config.php'), {
    DB_NAME: db,
    WP_SALTS: salts,
  });
  await fs.writeFile(path.join(envDir, 'wp-config.php'), wpConfig, 'utf8');

  // 3. Dockerfile.
  step(t('start.genDockerfile'));
  await fs.writeFile(path.join(envDir, 'Dockerfile'), await readTemplate('project.Dockerfile'), 'utf8');

  // 4. Project docker-compose.yml.
  step(t('start.genCompose'));
  const projectCompose = await renderTemplate('project.docker-compose.yml', {
    DB_NAME: db,
    DOMAIN: dom,
    REPO_DIR: repoDir,
  });
  await fs.writeFile(path.join(envDir, 'docker-compose.yml'), projectCompose, 'utf8');

  // 5. Build & start project containers.
  step(t('start.upping'));
  await compose(['up', '-d', '--build'], { cwd: envDir });

  // 6. Wait for WP-CLI to answer inside the container (replaces `sleep 5`).
  step(t('start.waitingWp'));
  await pollUntil(
    async () => {
      const { code } = await dockerExecCapture(container, ['wp', 'core', 'version', '--allow-root']);
      return code === 0;
    },
    { label: 'WordPress', timeout: 90000 },
  );

  // 7. Silent install.
  step(t('start.installing'));
  await dockerExec(container, [
    'wp',
    'core',
    'install',
    `--url=http://${dom}`,
    `--title=Dev: ${dom}`,
    `--admin_user=${ADMIN_USER}`,
    `--admin_password=${ADMIN_PASS}`,
    `--admin_email=${ADMIN_EMAIL}`,
    '--skip-email',
    '--skip-plugins',
    '--skip-themes',
    '--allow-root',
  ]);

  // 8. Pretty permalinks.
  step(t('start.permalinks'));
  await dockerExec(container, [
    'wp',
    'rewrite',
    'structure',
    '/%postname%/',
    '--hard',
    '--allow-root',
  ]);

  const url = `http://${dom}`;
  success(t('start.success'));
  plain(colors.green(t('start.url', { url })));
  plain(colors.green(t('start.admin', { url })));
  plain(colors.green(t('start.user', { user: ADMIN_USER })));
  plain(colors.green(t('start.pass', { pass: ADMIN_PASS })));
}
