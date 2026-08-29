import './style.css';
import { siteConfig, validateConfig } from './lib/config.js';
import { initNavbar } from './modules/navbar.js';
import { initReveal } from './modules/reveal.js';
import { initHeroVideo } from './modules/hero-video.js';
import { initChatbot } from './modules/chatbot.js';
import { initContactForm } from './modules/contact-form.js';
import { initMapFacade } from './modules/map-facade.js';
import { updateYear } from './modules/year.js';

if (import.meta.env.DEV) {
  for (const warning of validateConfig(siteConfig)) console.warn(`[site-config] ${warning}`);
}

initNavbar();
initReveal();
initHeroVideo();
initChatbot(siteConfig);
initContactForm(siteConfig);
initMapFacade();
updateYear();
