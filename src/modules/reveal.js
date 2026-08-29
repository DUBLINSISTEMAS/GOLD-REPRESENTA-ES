const REVEAL_SELECTOR = '.reveal, .reveal-left, .reveal-right';
const ACTIVE_CLASS = 'active';

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
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(ACTIVE_CLASS);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  );

  elements.forEach((element) => observer.observe(element));
}
