/**
 * Single source of truth for everything that identifies the business.
 *
 * The values are injected into index.html at build time (see vite.config.js,
 * tokens like {{whatsappUrl}}) and used by the chatbot / contact form at runtime.
 * This file must stay plain ESM: it runs in Node (Vite config, tests) and in the browser.
 *
 * TODO antes de publicar: preencher whatsappNumber, conferir email/siteUrl,
 * addressLine e — se a Gold representa uma administradora — administradora.
 */
import { buildWhatsAppUrl, formatPhoneBR, isPlaceholderNumber, normalizePhone } from './whatsapp.js';

const base = {
  siteName: 'Gold Representações',
  /** Sem barra no final. Usado em canonical, Open Graph e sitemap. */
  siteUrl: 'https://goldrepresentacoes.com.br',
  /** DDI + DDD + número, só dígitos. 5511999999999 é PLACEHOLDER. */
  whatsappNumber: '5511999999999',
  email: 'contato@goldrepresentacoes.com.br',
  city: 'Pedreiras',
  state: 'MA',
  /** Rua, número e bairro. Vazio = mostra só cidade/UF. */
  addressLine: '',
  mapsQuery: 'Pedreiras, MA',
  instagramHandle: 'gold_representacoes2026',
  instagramUrl: 'https://www.instagram.com/gold_representacoes2026/',
  /** Nome de quem assume a conversa no WhatsApp. */
  specialistName: 'Anderson',
  /** Ex.: 'Multimarcas Consórcios'. Vazio = a nota sobre a administradora não aparece. */
  administradora: '',
  /**
   * Endpoint que recebe o formulário via POST (ex.: 'https://formspree.io/f/xxxxxxxx').
   * Vazio = o formulário abre o WhatsApp com a mensagem preenchida.
   */
  formEndpoint: '',
  defaultWhatsappMessage:
    'Olá, vim pelo site e quero falar com um especialista sobre cartas de crédito.',
};

function derive(config) {
  const digits = normalizePhone(config.whatsappNumber);
  const location = [config.addressLine, `${config.city} - ${config.state}`].filter(Boolean).join(', ');
  return {
    phoneDisplay: formatPhoneBR(digits),
    phoneE164: digits ? `+${digits}` : '',
    whatsappUrl: buildWhatsAppUrl(digits, config.defaultWhatsappMessage),
    /** Sem JS o navegador usa o action nativo: endpoint configurado ou, na falta dele, o cliente de e-mail. */
    formAction: config.formEndpoint || `mailto:${config.email}?subject=${encodeURIComponent('Contato pelo site')}`,
    formEnctype: config.formEndpoint ? 'application/x-www-form-urlencoded' : 'text/plain',
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.mapsQuery)}`,
    mapsEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(config.mapsQuery)}&z=15&output=embed`,
    locationDisplay: location,
    administradoraNote: config.administradora
      ? `Contemplações realizadas por meio da administradora ${config.administradora}, autorizada pelo Banco Central do Brasil.`
      : '',
    currentYear: String(new Date().getFullYear()),
  };
}

export const siteConfig = Object.freeze({ ...base, ...derive(base) });

/** Returns human-readable warnings for values that still need attention before going live. */
export function validateConfig(config) {
  const warnings = [];
  if (isPlaceholderNumber(config.whatsappNumber)) {
    warnings.push(
      'whatsappNumber ainda é um placeholder — substitua pelo WhatsApp real (DDI+DDD+número, só dígitos) em src/lib/config.js.',
    );
  }
  if (!config.formEndpoint) {
    warnings.push(
      'formEndpoint vazio — o formulário de contato vai abrir o WhatsApp (fallback). Configure um endpoint (ex.: Formspree) para receber por e-mail.',
    );
  }
  if (!config.siteUrl) {
    warnings.push('siteUrl vazio — canonical, Open Graph e sitemap ficarão incompletos.');
  }
  return warnings;
}
