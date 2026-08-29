import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLeadMessage, buildContactMessage } from '../../src/lib/messages.js';

test('buildLeadMessage includes interest, amount and the specialist name', () => {
  const message = buildLeadMessage({ interesse: 'Imóvel', valor: 'R$ 250.000', specialist: 'Anderson' });
  assert.match(message, /Olá, Anderson!/);
  assert.match(message, /\*Imóvel\*/);
  assert.match(message, /\*R\$ 250\.000\*/);
});

test('buildLeadMessage falls back to a neutral greeting without a specialist', () => {
  const message = buildLeadMessage({ interesse: 'Veículo', valor: '80 mil' });
  assert.match(message, /^Olá!/);
  assert.doesNotMatch(message, /undefined/);
});

test('buildLeadMessage trims and collapses whitespace in user input', () => {
  const message = buildLeadMessage({ interesse: 'Imóvel', valor: '  200   mil  ' });
  assert.match(message, /\*200 mil\*/);
});

test('buildContactMessage formats the contact form as a WhatsApp message', () => {
  const message = buildContactMessage({ name: 'Maria Silva', email: 'maria@exemplo.com', message: 'Quero simular.' });
  assert.match(message, /Maria Silva/);
  assert.match(message, /maria@exemplo\.com/);
  assert.match(message, /Quero simular\./);
});
