// Terminal output helpers — same look as 42script.sh's echo_step / echo_error.
// Colors are emitted only when stdout is a TTY and NO_COLOR is unset.

import { t } from './i18n.js';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

const CODES = {
  green: '\x1b[0;32m',
  blue: '\x1b[0;34m',
  yellow: '\x1b[1;33m',
  red: '\x1b[0;31m',
  reset: '\x1b[0m',
};

function paint(code, text) {
  return useColor ? `${code}${text}${CODES.reset}` : text;
}

// "==> message" in blue arrow + green text (mirrors echo_step).
export function step(message) {
  const arrow = paint(CODES.blue, '==>');
  console.log(`${arrow} ${paint(CODES.green, message)}`);
}

// "Error: message" in red (mirrors echo_error), printed to stderr.
export function error(message) {
  console.error(paint(CODES.red, `${t('err.prefix')}: ${message}`));
}

export function plain(message = '') {
  console.log(message);
}

export function success(message) {
  console.log(`\n🚀 ${paint(CODES.green, message)}`);
}

export const colors = {
  green: (s) => paint(CODES.green, s),
  blue: (s) => paint(CODES.blue, s),
  yellow: (s) => paint(CODES.yellow, s),
  red: (s) => paint(CODES.red, s),
};
