const WIDE_SCREEN_QUERY = '(min-width: 768px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IDLE_TIMEOUT_MS = 1500;

/**
 * Attaches the hero video on wide screens, when the visitor has not asked for
 * reduced motion or data saving, and only after the page is idle — so it never
 * competes with the first paint. Phones keep the poster (64 KB).
 */
export function initHeroVideo() {
  const video = document.querySelector('.hero-bg-video[data-src]');
  if (!video) return;

  const saveData = navigator.connection?.saveData === true;
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  const isWideScreen = window.matchMedia(WIDE_SCREEN_QUERY).matches;
  if (saveData || reducedMotion || !isWideScreen) return;

  const attach = () => {
    // Set as a property too: the autoplay policy reads the property, not the attribute.
    video.muted = true;
    video.preload = 'auto';
    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();
    keepPlaying(video);
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(attach, { timeout: IDLE_TIMEOUT_MS });
  } else {
    window.setTimeout(attach, IDLE_TIMEOUT_MS / 2);
  }
}

/**
 * A single play() call is not enough: it can be refused before the first frame is
 * decodable, and returning to the tab leaves the video paused. Retry on every
 * signal that can unblock playback. The poster stays visible until it does.
 */
function keepPlaying(video) {
  const gestures = new AbortController();

  const tryPlay = () => {
    if (!video.paused) return;
    // A real gesture always lifts the autoplay restriction, so drop those
    // listeners as soon as the video is actually running.
    video.play().then(() => gestures.abort()).catch(() => {});
  };

  video.addEventListener('canplay', tryPlay);
  video.addEventListener('error', () => {
    console.error('[hero-video] não foi possível carregar o vídeo:', video.error?.message ?? '');
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay();
  });
  for (const type of ['pointerdown', 'keydown']) {
    document.addEventListener(type, tryPlay, { passive: true, signal: gestures.signal });
  }

  tryPlay();
}
