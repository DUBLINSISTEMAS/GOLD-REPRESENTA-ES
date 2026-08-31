/**
 * Generates the review QR code and a print-ready card for the counter.
 * Run with `npm run qr`. Output goes to assets-src/qr (not deployed).
 *
 * The URL is never typed here: it comes from the Place ID in src/lib/config.js,
 * so the code and the site can never point at different profiles.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { siteConfig } from '../src/lib/config.js';

const OUT = 'assets-src/qr';
const LOGO = 'assets-src/originals/logo.png';

/** A5 a 150 dpi: imprime bem em folha inteira ou colado num display de balcão. */
const CARD = { width: 1240, height: 1748 };
const QR_SIZE = 720;
const LOGO_WIDTH = 300;

const NAVY = '#0a192f';
const GOLD = '#d4af37';
const WHITE = '#ffffff';

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);

await mkdir(OUT, { recursive: true });

// Correção de erro alta (H): o código continua legível mesmo sujo, amassado ou
// impresso em baixa qualidade — é para ficar num balcão.
const qrPng = await QRCode.toBuffer(siteConfig.googleReviewUrl, {
  errorCorrectionLevel: 'H',
  margin: 2,
  width: QR_SIZE,
  color: { dark: NAVY, light: WHITE },
});
await writeFile(`${OUT}/qr-avaliacao.png`, qrPng);

const logo = await sharp(LOGO).resize({ width: LOGO_WIDTH }).png().toBuffer();

const qrBoxSize = QR_SIZE + 80;
const qrBoxX = (CARD.width - qrBoxSize) / 2;
const qrBoxY = 700;

const background = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}">
  <rect width="100%" height="100%" fill="${NAVY}"/>
  <rect x="0" y="0" width="100%" height="14" fill="${GOLD}"/>
  <rect x="0" y="${CARD.height - 14}" width="100%" height="14" fill="${GOLD}"/>
  <text x="50%" y="470" text-anchor="middle" fill="${WHITE}"
        font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="bold">Gostou do</text>
  <text x="50%" y="558" text-anchor="middle" fill="${GOLD}"
        font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="bold">atendimento?</text>
  <text x="50%" y="640" text-anchor="middle" fill="${WHITE}" opacity="0.85"
        font-family="Segoe UI, Arial, sans-serif" font-size="40">Avalie a Gold no Google — leva 30 segundos</text>
  <rect x="${qrBoxX}" y="${qrBoxY}" width="${qrBoxSize}" height="${qrBoxSize}" rx="28" fill="${WHITE}"/>
  <text x="50%" y="1590" text-anchor="middle" fill="${WHITE}"
        font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="bold">Aponte a câmera do celular</text>
  <text x="50%" y="1660" text-anchor="middle" fill="${GOLD}"
        font-family="Segoe UI, Arial, sans-serif" font-size="34">${escapeXml(siteConfig.siteUrl.replace('https://', ''))}</text>
</svg>`);

await sharp(background)
  .composite([
    { input: logo, top: 150, left: Math.round((CARD.width - LOGO_WIDTH) / 2) },
    { input: qrPng, top: qrBoxY + 40, left: Math.round((CARD.width - QR_SIZE) / 2) },
  ])
  .png()
  .toFile(`${OUT}/cartaz-avaliacao.png`);

console.log(`URL codificada: ${siteConfig.googleReviewUrl}`);
console.log(`${OUT}/qr-avaliacao.png (QR puro) e ${OUT}/cartaz-avaliacao.png (A5, pronto para imprimir)`);
