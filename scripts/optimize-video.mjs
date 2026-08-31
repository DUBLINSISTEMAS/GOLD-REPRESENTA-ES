/**
 * Generates public/hero-video.mp4 from the original in assets-src/originals.
 * Run with `npm run video` after replacing the original.
 *
 * Two things matter here and both were wrong in the original file:
 * - `+faststart` moves the moov atom to the front. Without it the browser only
 *   finds the index at the end of the file and playback starts late or not at all.
 * - The track is muted in the page, so the audio stream is dropped.
 */
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';

const INPUT = 'assets-src/originals/hero-video.mp4';
const OUTPUT = 'public/hero-video.mp4';

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

console.log(`${INPUT} (${mb(INPUT)}) -> ${OUTPUT} (${mb(OUTPUT)})`);
