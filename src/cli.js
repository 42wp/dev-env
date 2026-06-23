// Argument parsing and command dispatch — mirrors the `case "$1"` block in 42script.sh.
// A leading --lang / --lang=<locale> overrides the UI language; it's consumed before
// dispatch so it never leaks into WP-CLI arguments passed through `42wp wp`.

import { setLocale, t } from './lib/i18n.js';
import { plain, error } from './lib/log.js';
import { start } from './commands/start.js';
import { stop } from './commands/stop.js';
import { wp } from './commands/wp.js';
import { update } from './commands/update.js';
import { startGlobal, stopGlobal } from './commands/global.js';

function extractLang(argv) {
  let lang;
  while (argv.length && argv[0].startsWith('--lang')) {
    const flag = argv.shift();
    if (flag.includes('=')) lang = flag.slice(flag.indexOf('=') + 1);
    else lang = argv.shift(); // value is the next token
  }
  return lang;
}

// Flags that take a value (--wp tag, --user bob, --pass secret). Anything else
// (e.g. --vip) is a boolean. The `--key=value` form works for all of them.
const VALUE_FLAGS = new Set(['wp', 'user', 'pass']);

// Pull options out of an arg list, leaving positionals behind. Used by `start`
// and `update`; NOT by `wp`, whose args pass through verbatim to WP-CLI.
export function parseOpts(args) {
  const opts = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq !== -1) {
        opts[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        if (VALUE_FLAGS.has(key)) opts[key] = args[++i];
        else opts[key] = true; // boolean flag
      }
    } else {
      positionals.push(a);
    }
  }
  return { opts, positionals };
}

function printUsage() {
  plain(t('usage.line'));
  plain('');
  plain(t('usage.commands'));
  plain(t('usage.start'));
  plain(t('usage.update'));
  plain(t('usage.stop'));
  plain(t('usage.wp'));
  plain(t('usage.globalStart'));
  plain(t('usage.globalStop'));
}

export async function run(rawArgs) {
  const argv = [...rawArgs];
  const lang = extractLang(argv);
  setLocale(lang);

  const command = argv[0];

  switch (command) {
    case 'start': {
      const { opts, positionals } = parseOpts(argv.slice(1));
      await start(positionals[0], opts);
      break;
    }

    case 'update': {
      const { opts, positionals } = parseOpts(argv.slice(1));
      await update(positionals[0], opts);
      break;
    }

    case 'stop':
      await stop(argv[1]);
      break;

    case 'wp':
      await wp(argv[1], argv.slice(2));
      break;

    case 'global':
      if (argv[1] === 'start') await startGlobal();
      else if (argv[1] === 'stop') await stopGlobal();
      else {
        error(t('global.invalid'));
        process.exitCode = 1;
      }
      break;

    default:
      printUsage();
      process.exitCode = 1;
  }
}
