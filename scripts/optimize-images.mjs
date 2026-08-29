/**
 * Generates the optimized web assets in public/img from the originals in
 * assets-src/originals. Run with `npm run images` after changing an original.
 *
 * Outputs are WebP (lossy for photos, alpha-preserving for logos) at the sizes
 * the layout actually renders (1x / 2x), plus favicons, the OG image and the
 * cropped Instagram grid used by the phone mockup.
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'assets-src/originals';
const OUT = 'public/img';

const PHOTO_QUALITY = 78;
const LOGO_QUALITY = 85;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_LOGO_WIDTH = 420;

/** Instagram screenshot: rows of the post grid, below the tab bar, above the bottom nav. */
const INSTAGRAM_GRID_CROP = { left: 0, top: 532, width: 508, height: 280 };

const resizeJobs = [
  { file: 'logo_brilhante.png', name: 'logo', widths: [180, 360], quality: LOGO_QUALITY },
  { file: 'logo.png', name: 'logo-footer', widths: [200, 400], quality: LOGO_QUALITY },
  { file: 'reception.png', name: 'reception', widths: [640, 1280], quality: PHOTO_QUALITY },
  { file: 'hero_bg.jpg', name: 'hero-poster', widths: [1024], quality: 70 },
  ...Array.from({ length: 12 }, (_, i) => ({
    file: `clientes/cliente_${i + 1}.png`,
    name: `clientes/cliente_${i + 1}`,
    widths: [320, 640],
    quality: PHOTO_QUALITY,
  })),
];

const faviconSizes = [32, 180, 192, 512];

async function writeResized({ file, name, widths, quality }) {
  const input = path.join(SRC, file);
  await mkdir(path.dirname(path.join(OUT, name)), { recursive: true });
  const results = [];
  for (const width of widths) {
    const output = path.join(OUT, `${name}-${width}.webp`);
    const info = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 6 })
      .toFile(output);
    results.push(`${output} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
  }
  return results;
}

async function writeFavicons() {
  const input = path.join(SRC, 'logo_brilhante.png');
  const results = [];
  for (const size of faviconSizes) {
    const output = path.join('public', size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`);
    const info = await sharp(input).resize(size, size).png({ compressionLevel: 9 }).toFile(output);
    results.push(`${output} ${(info.size / 1024).toFixed(0)} KB`);
  }
  return results;
}

async function writeOgImage() {
  const background = await sharp(path.join(SRC, 'hero_bg.jpg'))
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
    .toBuffer();
  const logo = await sharp(path.join(SRC, 'logo_brilhante.png'))
    .resize({ width: OG_LOGO_WIDTH })
    .toBuffer();
  const output = path.join('public', 'og-image.jpg');
  const info = await sharp(background)
    .composite([{ input: logo, gravity: 'centre' }])
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(output);
  return [`${output} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`];
}

async function writeInstagramGrid() {
  const output = path.join(OUT, 'instagram-grid.webp');
  const info = await sharp(path.join(SRC, 'front.png'))
    .extract(INSTAGRAM_GRID_CROP)
    .webp({ quality: 80 })
    .toFile(output);
  return [`${output} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`];
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const groups = await Promise.all([
    ...resizeJobs.map(writeResized),
    writeFavicons(),
    writeOgImage(),
    writeInstagramGrid(),
  ]);
  for (const line of groups.flat()) console.log(line);
}

main().catch((error) => {
  console.error('[optimize-images] failed:', error.message);
  process.exit(1);
});
