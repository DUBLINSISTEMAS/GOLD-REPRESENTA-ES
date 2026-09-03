import './style.css';
import { siteConfig, validateConfig } from './lib/config.js';
import { initNavbar } from './modules/navbar.js';
import { initSmoothScroll } from './modules/smooth-scroll.js';
import { initReveal } from './modules/reveal.js';
import { initHeroVideo } from './modules/hero-video.js';
import { initChatbot } from './modules/chatbot.js';
import { initContactForm } from './modules/contact-form.js';
import { updateYear } from './modules/year.js';
import { initCookieBanner } from './modules/cookie-banner.js';

if (import.meta.env.DEV) {
  for (const warning of validateConfig(siteConfig)) console.warn(`[site-config] ${warning}`);
}

initNavbar();
initSmoothScroll();
initReveal();
initHeroVideo();
initChatbot(siteConfig);
initContactForm(siteConfig);
updateYear();
initCookieBanner();
