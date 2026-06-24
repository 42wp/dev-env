// Run the demo-content seeder (demo-seed.php) against a running container by
// piping it to `wp eval-file -`. Shared by `start --demo-content` and `seed`.

import { runWithInput } from './docker.js';
import { readTemplate } from './render.js';

export async function runSeeder(container, count) {
  const seeder = await readTemplate('demo-seed.php');
  await runWithInput(
    'docker',
    ['exec', '-i', container, 'wp', 'eval-file', '-', String(count), '--allow-root'],
    seeder,
  );
}
