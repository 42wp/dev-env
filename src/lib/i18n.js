// Tiny i18n layer. Ships English + Portuguese; locale is resolved once, from
// (in priority order) an explicit override, the FORTYTWO_LANG env var, then the
// usual locale env vars (LC_ALL / LC_MESSAGES / LANG / LANGUAGE). Anything that
// looks like Portuguese ("pt", "pt_BR", "pt-PT", ...) selects Portuguese;
// everything else falls back to English.

import en from '../locales/en.js';
import pt from '../locales/pt.js';

const CATALOGS = { en, pt };
const DEFAULT_LOCALE = 'en';

let current = null;

function normalize(tag) {
  if (!tag) return null;
  const lower = String(tag).toLowerCase();
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('en')) return 'en';
  return null;
}

function detectLocale(override) {
  const candidates = [
    override,
    process.env.FORTYTWO_LANG,
    process.env.LC_ALL,
    process.env.LC_MESSAGES,
    process.env.LANG,
    process.env.LANGUAGE,
  ];
  for (const candidate of candidates) {
    const locale = normalize(candidate);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

// Call once at startup (CLI passes the parsed --lang value, if any).
export function setLocale(override) {
  current = detectLocale(override);
  return current;
}

export function getLocale() {
  if (!current) current = detectLocale();
  return current;
}

function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\$\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

// Translate a key. Falls back to English, then to the raw key, so a missing
// translation degrades gracefully instead of throwing.
export function t(key, params) {
  const locale = getLocale();
  const message =
    CATALOGS[locale]?.[key] ?? CATALOGS[DEFAULT_LOCALE]?.[key] ?? key;
  return interpolate(message, params);
}
