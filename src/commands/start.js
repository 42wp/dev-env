// `42wp start <project>` — port of start_project from 42script.sh.
// Creates the DB, generates wp-config.php / Dockerfile / docker-compose.yml,
// builds & starts the project containers, then runs a silent WordPress install.

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  normalizeName,
  validateName,
  dbName,
  domain,
  containerName,
  routerRule,
} from '../lib/naming.js';
import { projectDir } from '../lib/paths.js';
import { renderTemplate, render, readTemplate } from '../lib/render.js';
import { fetchSalts } from '../lib/salts.js';
import { run, compose, dockerExec, dockerExecCapture } from '../lib/docker.js';
import { pollUntil } from '../lib/wait.js';
import { step, success, plain, error, colors } from '../lib/log.js';
import { t } from '../lib/i18n.js';
import {
  resolveWpTag,
  wpImage,
  multisiteConfig,
  DEFAULT_ADMIN_USER,
  DEFAULT_ADMIN_PASS,
  VIP_MU_PLUGINS_REPO,
} from '../lib/config.js';
import { ensureDockerRunning, checkGlobalLayer } from './global.js';

const ADMIN_EMAIL = 'dev@42wp.localhost';

// Clone (or update) the VIP mu-plugins into <envDir>/mu-plugins; it gets mounted
// into the container at wp-content/mu-plugins. Shallow + single-branch — the
// prebuilt repo is large and we only need the working tree.
async function ensureVipMuPlugins(envDir) {
  const muDir = path.join(envDir, 'mu-plugins');
  try {
    await fs.access(path.join(muDir, '.git'));
    step(t('start.vipUpdating'));
    await run('git', ['-C', muDir, 'pull', '--ff-only']);
  } catch {
    step(t('start.vipCloning', { repo: VIP_MU_PLUGINS_REPO }));
    await run('git', ['clone', '--depth', '1', '--single-branch', VIP_MU_PLUGINS_REPO, muDir]);
  }
}

export async function start(rawName, opts = {}) {
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
  const adminUser = opts.user || DEFAULT_ADMIN_USER;
  const adminPass = opts.pass || DEFAULT_ADMIN_PASS;
  // --subdomains implies multisite; without it, --multisite is subdirectory mode.
  const subdomains = !!opts.subdomains;
  const multisite = !!opts.multisite || subdomains;

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

  // 2. Ephemeral wp-config.php. The multisite constants are added later (step 7b),
  //    AFTER the network tables exist — defining MULTISITE before they're created
  //    would break wp-cli's bootstrap. For now write it without them.
  step(t('start.genConfig'));
  const { salts, fromFallback } = await fetchSalts();
  if (fromFallback) step(t('start.saltsFallback'));
  const wpConfigPath = path.join(envDir, 'wp-config.php');
  const wpConfigTemplate = await readTemplate('wp-config.php');
  const writeWpConfig = (multisiteBlock) =>
    fs.writeFile(
      wpConfigPath,
      render(wpConfigTemplate, { DB_NAME: db, WP_SALTS: salts, MULTISITE_CONFIG: multisiteBlock }),
      'utf8',
    );
  await writeWpConfig('');

  // 3. Dockerfile (FROM the resolved WordPress image tag).
  const wpTag = resolveWpTag(opts.wp);
  step(t('start.genDockerfile', { image: wpImage(wpTag) }));
  const dockerfile = await renderTemplate('project.Dockerfile', { WP_TAG: wpTag });
  await fs.writeFile(path.join(envDir, 'Dockerfile'), dockerfile, 'utf8');

  // 4. Project docker-compose.yml. Extra bind mounts: VIP mu-plugins (--vip) and a
  //    multisite .htaccess (wp-cli won't write network rewrite rules itself).
  step(t('start.genCompose'));
  const extraVolumeLines = [];
  if (opts.vip) extraVolumeLines.push('      - ./mu-plugins:/var/www/html/wp-content/mu-plugins');
  if (multisite) extraVolumeLines.push('      - ./.htaccess:/var/www/html/.htaccess');
  const extraVolumes = extraVolumeLines.length ? `\n${extraVolumeLines.join('\n')}` : '';
  const projectCompose = await renderTemplate('project.docker-compose.yml', {
    DB_NAME: db,
    DOMAIN: dom,
    REPO_DIR: repoDir,
    EXTRA_VOLUMES: extraVolumes,
    // docker compose treats $ as interpolation, so a literal $ (the regex anchor)
    // must be written as $$.
    ROUTER_RULE: routerRule(dom, { subdomains }).split('$').join('$$'),
  });
  await fs.writeFile(path.join(envDir, 'docker-compose.yml'), projectCompose, 'utf8');

  // 4b. Multisite needs custom rewrite rules; provide them via a mounted .htaccess
  //     (written before `up` so the bind-mount source exists).
  if (multisite) {
    const htTemplate = subdomains ? 'htaccess.multisite-subdomain' : 'htaccess.multisite-subdir';
    await fs.writeFile(path.join(envDir, '.htaccess'), await readTemplate(htTemplate), 'utf8');
  }

  // 4c. WordPress VIP: clone the mu-plugins before bringing the container up so the
  //     mount source exists.
  if (opts.vip) await ensureVipMuPlugins(envDir);

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

  // 7. Silent install of the base single site.
  step(t('start.installing'));
  await dockerExec(container, [
    'wp',
    'core',
    'install',
    `--url=http://${dom}`,
    `--title=Dev: ${dom}`,
    `--admin_user=${adminUser}`,
    `--admin_password=${adminPass}`,
    `--admin_email=${ADMIN_EMAIL}`,
    '--skip-email',
    '--skip-plugins',
    '--skip-themes',
    '--allow-root',
  ]);

  // 7b. Multisite: create the network tables while WP is still single-site
  //     (--skip-config: we manage wp-config ourselves), then enable the MULTISITE
  //     constants. Order matters — the constants must come AFTER the tables exist.
  if (multisite) {
    step(t('start.enablingMultisite'));
    const conv = await dockerExecCapture(container, [
      'wp',
      'core',
      'multisite-convert',
      '--skip-config',
      ...(subdomains ? ['--subdomains'] : []),
      `--title=Dev: ${dom}`,
      '--allow-root',
    ]);
    // Tolerate an already-converted network so re-running `start` is idempotent.
    if (conv.code !== 0 && !/already/i.test(`${conv.stdout}\n${conv.stderr}`)) {
      throw new Error(conv.stderr || conv.stdout || 'wp core multisite-convert failed');
    }
    await writeWpConfig(multisiteConfig(dom, { subdomains }));
  }

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
  plain(colors.green(t('start.user', { user: adminUser })));
  plain(colors.green(t('start.pass', { pass: adminPass })));
  if (multisite) {
    const mode = subdomains ? 'subdomain' : 'subdirectory';
    plain(colors.green(t('start.multisite', { mode, url })));
  }
}
