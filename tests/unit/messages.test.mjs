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

test('buildContactMessage formats name, interest and message for WhatsApp', () => {
  const message = buildContactMessage({ name: 'Maria Silva', interesse: 'Crédito rural', message: 'Quero simular.' });
  assert.match(message, /\*Nome:\* Maria Silva/);
  assert.match(message, /\*Interesse:\* Crédito rural/);
  assert.match(message, /\*Mensagem:\* Quero simular\./);
});

test('buildContactMessage omits the message line when it is empty', () => {
  const message = buildContactMessage({ name: 'João', interesse: 'Imóvel', message: '   ' });
  assert.match(message, /\*Interesse:\* Imóvel/);
  assert.doesNotMatch(message, /\*Mensagem:\*/);
});
