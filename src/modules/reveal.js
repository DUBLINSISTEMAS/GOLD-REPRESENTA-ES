const REVEAL_SELECTOR = '.reveal, .reveal-left, .reveal-right';
const REVEAL_CLASSES = ['reveal', 'reveal-left', 'reveal-right'];
const ACTIVE_CLASS = 'active';
/** Elementos que entram juntos na viewport aparecem em cascata. */
const STAGGER_MS = 100;
const STAGGER_MAX_MS = 500;

/** Reveals elements once they enter the viewport. Falls back to "show everything". */
export function initReveal() {
  const elements = document.querySelectorAll(REVEAL_SELECTOR);
  if (elements.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add(ACTIVE_CLASS));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let staggerIndex = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        activate(entry.target, Math.min(staggerIndex * STAGGER_MS, STAGGER_MAX_MS));
        staggerIndex += 1;
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  elements.forEach((element) => observer.observe(element));
}

/**
 * Ativa o reveal com o atraso da cascata e, ao fim da transição, remove as
 * classes de reveal: o elemento volta às suas próprias transições (hover dos
 * cards fica ágil de novo, sem herdar os 0.8s da entrada).
 */
function activate(element, delayMs) {
  element.style.transitionDelay = `${delayMs}ms`;
  element.classList.add(ACTIVE_CLASS);
  element.addEventListener(
    'transitionend',
    () => {
      element.style.transitionDelay = '';
      element.classList.remove(...REVEAL_CLASSES, ACTIVE_CLASS);
    },
    { once: true },
  );
}
