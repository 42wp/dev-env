// Template rendering for the files `start` generates, plus a helper to make sure
// the global compose file exists in the data dir before the global layer comes up.

import fs from 'node:fs/promises';
import { globalComposePath, templatePath } from './paths.js';

// Replace {{VAR}} placeholders. Throws if a placeholder has no matching var, so a
// typo fails loudly instead of writing a half-rendered file.
export function render(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(vars, key)) {
      throw new Error(`Missing template variable: ${key}`);
    }
    return vars[key];
  });
}

export async function readTemplate(name) {
  return fs.readFile(templatePath(name), 'utf8');
}

export async function renderTemplate(name, vars) {
  return render(await readTemplate(name), vars);
}

// Write the bundled global compose into the data dir if it isn't there yet.
// Never overwrites an existing file, so a user's edits (and their mysql-data
// binding) are preserved.
export async function ensureGlobalCompose() {
  const dest = globalComposePath();
  try {
    await fs.access(dest);
    return dest; // already present
  } catch {
    const contents = await readTemplate('docker-compose.global.yml');
    await fs.writeFile(dest, contents, 'utf8');
    return dest;
  }
}
