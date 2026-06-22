import { test } from 'node:test';
import assert from 'node:assert/strict';

import { setLocale, t } from '../src/lib/i18n.js';

test('explicit override selects the locale', () => {
  assert.equal(setLocale('pt'), 'pt');
  assert.equal(setLocale('pt_BR'), 'pt');
  assert.equal(setLocale('en-US'), 'en');
});

test('t returns localized strings', () => {
  setLocale('en');
  assert.equal(t('docker.notRunning'), 'Docker is not running.');
  setLocale('pt');
  assert.equal(t('docker.notRunning'), 'Docker não está rodando.');
});

test('t interpolates params', () => {
  setLocale('en');
  assert.equal(t('start.creatingDb', { db: 'demo' }), 'Creating database: demo');
});

test('unknown key degrades to the key itself', () => {
  setLocale('en');
  assert.equal(t('no.such.key'), 'no.such.key');
});
