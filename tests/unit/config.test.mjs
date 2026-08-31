import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig, validateConfig } from '../../src/lib/config.js';

test('siteConfig exposes the fields the page binds to', () => {
  for (const key of ['whatsappNumber', 'email', 'phoneDisplay', 'city', 'instagramUrl', 'instagramHandle', 'specialistName', 'siteUrl']) {
    assert.ok(key in siteConfig, `missing ${key}`);
  }
});

test('formAction falls back to a GET to wa.me while formEndpoint is empty', () => {
  assert.equal(siteConfig.formEndpoint, '');
  assert.match(siteConfig.formAction, /^https:\/\/wa\.me\/\d{12,13}$/);
  assert.equal(siteConfig.formMethod, 'GET');
});

test('whatsappNumber is the real number, not a placeholder', () => {
  assert.equal(siteConfig.whatsappNumber, '5586998152406');
  assert.equal(siteConfig.phoneDisplay, '+55 (86) 99815-2406');
});

test('validateConfig warns about a placeholder WhatsApp number', () => {
  const warnings = validateConfig({ ...siteConfig, whatsappNumber: '5511999999999' });
  assert.ok(warnings.some((w) => /whatsappNumber/.test(w)));
});

test('validateConfig returns no warnings for the current config', () => {
  assert.deepEqual(validateConfig(siteConfig), []);
});
