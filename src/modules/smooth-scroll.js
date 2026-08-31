import Lenis from 'lenis';

/**
 * Rolagem com inércia suave (Lenis) + âncoras animadas compensando a navbar fixa.
 * Não ativa com movimento reduzido (fica o scroll-behavior nativo do base.css)
 * nem no toque (o Lenis mantém o scroll nativo do celular por padrão).
 */
export function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lenis = new Lenis({ autoRaf: true });
  const navHeight =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 0;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    // Skip-link fica no pulo instantâneo nativo: quem navega por teclado não espera animação.
    if (!link || link.classList.contains('skip-link')) return;
    const target = document.querySelector(link.hash);
    if (!target) return;

    event.preventDefault();
    history.pushState(null, '', link.hash);
    lenis.scrollTo(target, { offset: -navHeight, duration: 1.2 });
    // Mantém a ordem de tabulação coerente com o destino da rolagem.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}
