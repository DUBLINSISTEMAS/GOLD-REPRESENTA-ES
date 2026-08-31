const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SLOW_CONNECTIONS = new Set(['slow-2g', '2g', '3g']);
const IDLE_TIMEOUT_MS = 1500;

/**
 * Attaches the hero video on every screen size — phones included — once the page
 * is idle, so it never competes with the first paint. Only a slow connection,
 * Save-Data or a reduced-motion preference keeps the poster instead. The poster
 * is the video's own first frame, so the swap is invisible either way.
 */
export function initHeroVideo() {
  const video = document.querySelector('.hero-bg-video[data-src]');
  if (!video) return;

  const connection = navigator.connection;
  const saveData = connection?.saveData === true;
  const slowConnection = SLOW_CONNECTIONS.has(connection?.effectiveType);
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  if (saveData || slowConnection || reducedMotion) return;

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
