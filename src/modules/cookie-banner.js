const STORAGE_KEY = 'gold-privacy-notice';
const ACCEPTED = 'accepted';
const BODY_CLASS = 'has-privacy-notice';
const HEIGHT_VAR = '--notice-height';
const LEAVE_FALLBACK_MS = 400;

function readChoice() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveChoice() {
  try {
    window.localStorage.setItem(STORAGE_KEY, ACCEPTED);
  } catch {
    // Armazenamento bloqueado (modo privado, política do navegador): o aviso
    // simplesmente volta na próxima visita.
  }
}

/**
 * Aviso de cookies/privacidade (LGPD). O site não usa rastreadores; o único
 * dado gravado é a própria escolha do visitante, em localStorage, para o
 * aviso não reaparecer a cada visita. Enquanto a barra está na tela, os
 * botões flutuantes sobem pela altura dela (variável CSS --notice-height).
 */
export function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const accept = document.getElementById('cookie-accept');
  if (!banner || !accept) return;
  if (readChoice() === ACCEPTED) return;

  const root = document.documentElement;
  const syncHeight = () => root.style.setProperty(HEIGHT_VAR, `${banner.offsetHeight}px`);

  banner.hidden = false;
  document.body.classList.add(BODY_CLASS);
  syncHeight();
  window.addEventListener('resize', syncHeight);

  const dismiss = () => {
    if (banner.hidden) return;
    banner.hidden = true;
    window.removeEventListener('resize', syncHeight);
  };

  accept.addEventListener('click', () => {
    saveChoice();
    document.body.classList.remove(BODY_CLASS);
    root.style.setProperty(HEIGHT_VAR, '0px');
    banner.classList.add('is-leaving');
    banner.addEventListener('transitionend', dismiss, { once: true });
    // Garantia caso o navegador não dispare transitionend (reduced motion).
    setTimeout(dismiss, LEAVE_FALLBACK_MS);
  });
}
