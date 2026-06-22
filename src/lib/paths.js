// Filesystem layout. Everything the tool persists at runtime lives under the
// data dir, which defaults to ~/.42wp and can be
// overridden with FORTYTWO_HOME. Bundled templates live inside the package and
// are resolved relative to this module via import.meta.url.

import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)); // .../src/lib

export function dataDir() {
  return process.env.FORTYTWO_HOME || path.join(os.homedir(), '.42wp');
}

export function projectsDir() {
  return path.join(dataDir(), 'projects');
}

export function projectDir(name) {
  return path.join(projectsDir(), name);
}

export function globalComposePath() {
  return path.join(dataDir(), 'docker-compose.global.yml');
}

export function templatesDir() {
  return path.join(here, '..', 'templates');
}

export function templatePath(name) {
  return path.join(templatesDir(), name);
}
