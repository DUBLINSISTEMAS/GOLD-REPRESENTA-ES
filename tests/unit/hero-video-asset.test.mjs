import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openSync, readSync, closeSync, fstatSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const VIDEO = fileURLToPath(new URL('../../public/hero-video.mp4', import.meta.url));

/** Lists the top-level MP4 boxes in file order. */
function readBoxOrder(file) {
  const fd = openSync(file, 'r');
  try {
    const size = fstatSync(fd).size;
    const header = Buffer.alloc(16);
    const boxes = [];
    for (let offset = 0; offset < size; ) {
      readSync(fd, header, 0, 16, offset);
      let boxSize = header.readUInt32BE(0);
      const type = header.toString('latin1', 4, 8);
      if (boxSize === 1) boxSize = Number(header.readBigUInt64BE(8));
      if (boxSize < 8) break;
      boxes.push(type);
      offset += boxSize;
    }
    return boxes;
  } finally {
    closeSync(fd);
  }
}

// Sem faststart o navegador só encontra o índice no fim do arquivo e a
// reprodução começa tarde ou não começa — foi o bug do vídeo do hero.
// Regenerar com `npm run video` sempre que trocar o original.
test('hero video is faststart: the moov atom comes before the media data', () => {
  const boxes = readBoxOrder(VIDEO);
  const moov = boxes.indexOf('moov');
  const mdat = boxes.indexOf('mdat');
  assert.ok(moov >= 0, 'moov atom ausente');
  assert.ok(mdat >= 0, 'mdat atom ausente');
  assert.ok(moov < mdat, `moov deveria vir antes do mdat, mas a ordem é: ${boxes.join(', ')}`);
});

test('hero video stays small enough for a background loop', () => {
  const fd = openSync(VIDEO, 'r');
  const bytes = fstatSync(fd).size;
  closeSync(fd);
  assert.ok(bytes < 2.5 * 1024 * 1024, `vídeo com ${(bytes / 1024 / 1024).toFixed(2)} MB — rode "npm run video"`);
});
