import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhone, isPlaceholderNumber, buildWhatsAppUrl, formatPhoneBR } from '../../src/lib/whatsapp.js';

test('formatPhoneBR formats mobile and landline numbers', () => {
  assert.equal(formatPhoneBR('5599987654321'), '+55 (99) 98765-4321');
  assert.equal(formatPhoneBR('559936211234'), '+55 (99) 3621-1234');
  assert.equal(formatPhoneBR('351912345678'), '+351912345678');
  assert.equal(formatPhoneBR(''), '');
});

test('normalizePhone strips everything but digits', () => {
  assert.equal(normalizePhone('+55 (99) 98765-4321'), '5599987654321');
});

test('isPlaceholderNumber flags the template number and repeated digits', () => {
  assert.equal(isPlaceholderNumber('5511999999999'), true);
  assert.equal(isPlaceholderNumber('5599000000000'), true);
  assert.equal(isPlaceholderNumber('5599987654321'), false);
});

test('buildWhatsAppUrl encodes the message and normalizes the number', () => {
  const url = buildWhatsAppUrl('+55 (99) 98765-4321', 'Olá, vim pelo site!');
  assert.equal(url, 'https://wa.me/5599987654321?text=Ol%C3%A1%2C%20vim%20pelo%20site!');
});

test('buildWhatsAppUrl without a message omits the query string', () => {
  assert.equal(buildWhatsAppUrl('5599987654321'), 'https://wa.me/5599987654321');
});

test('buildWhatsAppUrl rejects numbers that are too short', () => {
  assert.throws(() => buildWhatsAppUrl('12345', 'oi'), /inválido/);
});
