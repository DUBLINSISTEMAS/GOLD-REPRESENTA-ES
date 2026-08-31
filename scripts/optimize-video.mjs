/**
 * Generates public/hero-video.mp4 and its poster from the original in
 * assets-src/originals. Run with `npm run video` after replacing the original.
 *
 * Three things matter here and all three were wrong before:
 * - `+faststart` moves the moov atom to the front. Without it the browser only
 *   finds the index at the end of the file and playback starts late or not at all.
 * - The track is muted in the page, so the audio stream is dropped.
 * - The poster is the video's own first frame. A different image would flash
 *   and then be replaced the moment playback starts.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const INPUT = 'assets-src/originals/hero-video.mp4';
const OUTPUT = 'public/hero-video.mp4';
const POSTER = 'public/img/hero-poster-1024.webp';
const POSTER_WIDTH = 1024;
const POSTER_QUALITY = 70;

/** Visually transparent for a dark background loop sitting under an overlay. */
const CRF = '26';
/** Keyframe every 2s at 24fps: seeking back to the loop start stays instant. */
const KEYFRAME_INTERVAL = '48';

const mb = (file) => `${(statSync(file).size / 1024 / 1024).toFixed(2)} MB`;

execFileSync(
  ffmpegPath,
  [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', INPUT,
    '-an',
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-pix_fmt', 'yuv420p',
    '-preset', 'slow',
    '-crf', CRF,
    '-g', KEYFRAME_INTERVAL,
    '-movflags', '+faststart',
    OUTPUT,
  ],
  { stdio: 'inherit' },
);

// Frame extraído do vídeo já otimizado: é exatamente o que o visitante vê primeiro.
const firstFrame = execFileSync(
  ffmpegPath,
  ['-hide_banner', '-loglevel', 'error', '-i', OUTPUT, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'],
  { maxBuffer: 64 * 1024 * 1024 },
);
await sharp(firstFrame).resize({ width: POSTER_WIDTH }).webp({ quality: POSTER_QUALITY }).toFile(POSTER);

console.log(`${INPUT} (${mb(INPUT)}) -> ${OUTPUT} (${mb(OUTPUT)}) + ${POSTER} (${mb(POSTER)})`);
