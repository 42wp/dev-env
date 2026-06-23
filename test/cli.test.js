import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseOpts } from '../src/cli.js';

test('parseOpts: positionals only', () => {
  assert.deepEqual(parseOpts(['myproj']), { opts: {}, positionals: ['myproj'] });
});

test('parseOpts: value flags (space and = forms)', () => {
  assert.deepEqual(parseOpts(['myproj', '--wp', 'latest']), {
    opts: { wp: 'latest' },
    positionals: ['myproj'],
  });
  assert.deepEqual(parseOpts(['--user=joao', '--pass=s3cr3t', 'site']), {
    opts: { user: 'joao', pass: 's3cr3t' },
    positionals: ['site'],
  });
});

test('parseOpts: boolean flag (--vip) does not consume the project name', () => {
  assert.deepEqual(parseOpts(['--vip', 'site']), {
    opts: { vip: true },
    positionals: ['site'],
  });
  assert.deepEqual(parseOpts(['site', '--vip']), {
    opts: { vip: true },
    positionals: ['site'],
  });
});

test('parseOpts: --vip=url keeps the string value', () => {
  const { opts } = parseOpts(['site', '--vip=https://example.com/repo']);
  assert.equal(opts.vip, 'https://example.com/repo');
});

test('parseOpts: combined flags', () => {
  assert.deepEqual(parseOpts(['site', '--wp', 'php8.4-apache', '--user', 'bob', '--vip']), {
    opts: { wp: 'php8.4-apache', user: 'bob', vip: true },
    positionals: ['site'],
  });
});
