import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import jsQR from 'jsqr';
import sharp from 'sharp';
import { siteConfig } from '../../src/lib/config.js';

const file = (name) => fileURLToPath(new URL(`../../assets-src/qr/${name}`, import.meta.url));

async function decode(name) {
  const { data, info } = await sharp(file(name)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}

// Os QR impressos ficam no balcão: se o Place ID mudar e ninguém rodar
// `npm run qr`, o cartaz passa a apontar para o perfil errado sem aviso.
for (const name of ['qr-avaliacao.png', 'cartaz-avaliacao.png']) {
  test(`${name} encodes the current review URL`, async () => {
    assert.equal(await decode(name), siteConfig.googleReviewUrl);
  });
}

test('the review URL points at the configured Google place', () => {
  assert.match(siteConfig.googleReviewUrl, /^https:\/\/search\.google\.com\/local\/writereview\?placeid=/);
  assert.ok(siteConfig.googleReviewUrl.endsWith(siteConfig.googlePlaceId));
});
