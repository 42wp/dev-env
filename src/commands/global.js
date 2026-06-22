// `42wp global start|stop` and the shared global-layer bootstrap used by `start`.
// The global layer is Traefik + MySQL + phpMyAdmin + Mailpit on the 42wp_network.

import {
  dockerIsRunning,
  composeCapture,
  compose,
  dockerExecCapture,
} from '../lib/docker.js';
import { ensureGlobalCompose } from '../lib/render.js';
import { globalComposePath } from '../lib/paths.js';
import { pollUntil } from '../lib/wait.js';
import { step, error } from '../lib/log.js';
import { t } from '../lib/i18n.js';

// Exit early with a clear message if the Docker daemon isn't reachable.
export async function ensureDockerRunning() {
  if (!(await dockerIsRunning())) {
    error(t('docker.notRunning'));
    process.exitCode = 1;
    return false;
  }
  return true;
}

async function mysqlReady() {
  const { code } = await dockerExecCapture('42wp_mysql', [
    'mysqladmin',
    'ping',
    '-uroot',
    '-proot',
    '--silent',
  ]);
  return code === 0;
}

// Bring the global layer up if it isn't already running, then wait for MySQL.
// Replaces the bash `check_global_layer` (which used a fixed `sleep 10`).
export async function checkGlobalLayer() {
  const file = await ensureGlobalCompose();
  const { stdout } = await composeCapture(['-f', file, 'ps', '-q']);
  if (stdout.length === 0) {
    step(t('global.starting'));
    await compose(['-f', file, 'up', '-d']);
    step(t('global.waitingMysql'));
    await pollUntil(mysqlReady, { label: 'MySQL', timeout: 90000 });
  }
}

export async function startGlobal() {
  if (!(await ensureDockerRunning())) return;
  const file = await ensureGlobalCompose();
  step(t('global.starting'));
  await compose(['-f', file, 'up', '-d']);
}

export async function stopGlobal() {
  if (!(await ensureDockerRunning())) return;
  const file = globalComposePath();
  step(t('global.stopping'));
  await compose(['-f', file, 'down']);
}
