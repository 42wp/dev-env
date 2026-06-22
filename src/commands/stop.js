// `42wp stop <project>` — port of stop_project from 42script.sh.

import fs from 'node:fs/promises';

import { normalizeName, validateName } from '../lib/naming.js';
import { projectDir } from '../lib/paths.js';
import { compose } from '../lib/docker.js';
import { step, error } from '../lib/log.js';
import { t } from '../lib/i18n.js';

export async function stop(rawName) {
  if (!rawName) {
    error(t('stop.needName'));
    process.exitCode = 1;
    return;
  }

  const name = normalizeName(rawName);
  validateName(name);
  const envDir = projectDir(name);

  try {
    await fs.access(envDir);
  } catch {
    error(t('stop.notFound', { name, dir: envDir }));
    process.exitCode = 1;
    return;
  }

  step(t('stop.stopping', { name }));
  await compose(['down'], { cwd: envDir });
}
