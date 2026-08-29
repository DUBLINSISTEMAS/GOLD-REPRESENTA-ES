const DESKTOP_QUERY = '(min-width: 992px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const IDLE_TIMEOUT_MS = 2000;

/**
 * Attaches the hero video only on desktop, when the user has not asked for
 * reduced motion or data saving, and only after the page is idle — so the
 * 4 MB file never competes with the first paint. Everyone else keeps the poster.
 */
export function initHeroVideo() {
  const video = document.querySelector('.hero-bg-video[data-src]');
  if (!video) return;

  const saveData = navigator.connection?.saveData === true;
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
  const isDesktop = window.matchMedia(DESKTOP_QUERY).matches;
  if (saveData || reducedMotion || !isDesktop) return;

  const attach = () => {
    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();
    video.play().catch(() => {
      /* Autoplay bloqueado: o poster continua visível. */
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(attach, { timeout: IDLE_TIMEOUT_MS });
  } else {
    window.setTimeout(attach, IDLE_TIMEOUT_MS / 2);
  }
}
