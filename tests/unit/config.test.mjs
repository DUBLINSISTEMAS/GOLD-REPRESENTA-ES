import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig, validateConfig } from '../../src/lib/config.js';

test('siteConfig exposes the fields the page binds to', () => {
  for (const key of ['whatsappNumber', 'email', 'phoneDisplay', 'city', 'instagramUrl', 'instagramHandle', 'specialistName', 'siteUrl']) {
    assert.ok(key in siteConfig, `missing ${key}`);
  }
});

test('formAction falls back to mailto (text/plain) while formEndpoint is empty', () => {
  assert.equal(siteConfig.formEndpoint, '');
  assert.match(siteConfig.formAction, /^mailto:contato@/);
  assert.equal(siteConfig.formEnctype, 'text/plain');
});

test('validateConfig warns about a placeholder WhatsApp number', () => {
  const warnings = validateConfig({ ...siteConfig, whatsappNumber: '5511999999999' });
  assert.ok(warnings.some((w) => /whatsappNumber/.test(w)));
});

test('validateConfig warns about an empty form endpoint (WhatsApp fallback will be used)', () => {
  const warnings = validateConfig({ ...siteConfig, whatsappNumber: '5599987654321', formEndpoint: '' });
  assert.ok(warnings.some((w) => /formEndpoint/.test(w)));
});

test('validateConfig returns no warnings for a complete config', () => {
  const warnings = validateConfig({
    ...siteConfig,
    whatsappNumber: '5599987654321',
    formEndpoint: 'https://formspree.io/f/abc123',
  });
  assert.deepEqual(warnings, []);
});
