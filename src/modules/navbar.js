const SCROLL_THRESHOLD = 50;
const OPEN_CLASS = 'is-open';

/** Solid navbar after scrolling + accessible mobile menu (Esc, click outside, aria-expanded). */
export function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.querySelector('.mobile-menu-btn');
  const menu = document.getElementById('menu-principal');
  if (!navbar) return;

  initScrollState(navbar);
  if (toggle && menu) initMobileMenu({ navbar, toggle, menu });
}

function initScrollState(navbar) {
  let ticking = false;
  const update = () => {
    navbar.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}

function initMobileMenu({ navbar, toggle, menu }) {
  const isOpen = () => menu.classList.contains(OPEN_CLASS);

  const setOpen = (open) => {
    menu.classList.toggle(OPEN_CLASS, open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !navbar.contains(event.target)) setOpen(false);
  });
}
