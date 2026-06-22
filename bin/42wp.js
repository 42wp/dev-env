#!/usr/bin/env node

import { run } from '../src/cli.js';
import { error } from '../src/lib/log.js';

run(process.argv.slice(2)).catch((err) => {
  // Top-level safety net: anything that bubbles up here is unexpected.
  error(err && err.message ? err.message : String(err));
  process.exitCode = 1;
});
