// `42wp seed <project> [<count>] [--demo-content=<n>]` — generate demo content in
// an already-running project, without recreating the container. Always creates the
// requested number of posts (default 200).

import { normalizeName, validateName, dbName, containerName } from '../lib/naming.js';
import { containerIsRunning } from '../lib/docker.js';
import { runSeeder } from '../lib/seeder.js';
import { resolveDemoCount, DEFAULT_DEMO_COUNT } from '../lib/config.js';
import { step, error } from '../lib/log.js';
import { t } from '../lib/i18n.js';
import { ensureDockerRunning } from './global.js';

export async function seed(rawName, opts = {}, countArg) {
  if (!rawName) {
    error(t('seed.needName'));
    process.exitCode = 1;
    return;
  }

  const name = normalizeName(rawName);
  validateName(name);
  const container = containerName(dbName(name));

  if (!(await ensureDockerRunning())) return;

  if (!(await containerIsRunning(container))) {
    error(t('seed.notRunning', { name }));
    process.exitCode = 1;
    return;
  }

  // Count from a positional arg or --demo-content=<n>; default 200.
  const count = resolveDemoCount(countArg ?? opts['demo-content']) || DEFAULT_DEMO_COUNT;

  step(t('start.demoGenerating', { count }));
  try {
    await runSeeder(container, count);
  } catch {
    error(t('seed.failed'));
    process.exitCode = 1;
  }
}
