import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { faqItems } from '../../src/lib/faq.js';

const indexHtml = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

test('FAQ has at least 3 items with non-empty question and answer', () => {
  assert.ok(faqItems.length >= 3);
  for (const { question, answer } of faqItems) {
    assert.ok(question.trim().length > 0);
    assert.ok(answer.trim().length > 0);
  }
});

// O Google exige que o texto do FAQPage schema seja idêntico ao texto visível.
// O schema é gerado de src/lib/faq.js (vite.config.js); o HTML é escrito à mão em index.html.
// Este teste falha se um dos dois for editado sem o outro.
test('every FAQ question and answer from faq.js appears verbatim in index.html', () => {
  for (const { question, answer } of faqItems) {
    assert.ok(
      indexHtml.includes(`<summary>${question}</summary>`),
      `pergunta fora de sincronia com index.html: "${question}"`,
    );
    assert.ok(
      indexHtml.includes(`<p>${answer}</p>`),
      `resposta fora de sincronia com index.html para: "${question}"`,
    );
  }
});

test('index.html has exactly one FAQ item per entry in faq.js', () => {
  const count = (indexHtml.match(/<details class="faq-item/g) ?? []).length;
  assert.equal(count, faqItems.length);
});
