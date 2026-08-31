/**
 * Single source of truth for everything that identifies the business.
 *
 * The values are injected into index.html at build time (see vite.config.js,
 * tokens like {{whatsappUrl}}) and used by the chatbot / contact form at runtime.
 * This file must stay plain ESM: it runs in Node (Vite config, tests) and in the browser.
 *
 * TODO antes de publicar: conferir siteUrl e addressLine.
 */
import { buildWhatsAppUrl, formatPhoneBR, isPlaceholderNumber, normalizePhone } from './whatsapp.js';

const base = {
  siteName: 'Gold Representações',
  /** Sem barra no final. Usado em canonical, Open Graph e sitemap. */
  siteUrl: 'https://goldrepresentacoes.site',
  /** DDI + DDD + número, só dígitos. */
  whatsappNumber: '5586998152406',
  /** Ainda não existe e-mail comercial. Vazio = nenhum canal de e-mail aparece no site. */
  email: '',
  city: 'Pedreiras',
  state: 'MA',
  /** Rua, número e bairro. Vazio = mostra só cidade/UF. */
  addressLine: 'R. Maneco Rêgo',
  instagramHandle: 'gold_representacoes2026',
  instagramUrl: 'https://www.instagram.com/gold_representacoes2026/',
  /**
   * Place ID do Perfil da Empresa no Google. É o identificador permanente do
   * lugar — dele saem o link do mapa e o link de avaliação (ver derive()).
   * Links share.google são temporários e não servem aqui.
   */
  googlePlaceId: 'ChIJWXyXGAAnigcRS70tVO5qOMY',
  /** Coordenadas do escritório, conforme o próprio Perfil da Empresa. */
  latitude: -4.5717343,
  longitude: -44.6007211,
  /**
   * Código da verificação por meta tag do Google Search Console (só o valor de
   * "content", sem a tag). Vazio = nenhuma meta é injetada. Verificar por DNS TXT
   * é melhor (cobre www e apex de uma vez) e dispensa este campo.
   */
  googleSiteVerification: '',
  /** Nome de quem assume a conversa no WhatsApp. */
  specialistName: 'Anderson',
  /** Administradora parceira. Vazio = a nota na seção de contemplados não aparece. */
  administradora: 'Multimarcas Consórcios',
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
    /** Sem JS o navegador usa o action nativo: endpoint configurado ou, na falta dele, o chat do WhatsApp (GET). */
    formAction: config.formEndpoint || `https://wa.me/${digits}`,
    formMethod: config.formEndpoint ? 'POST' : 'GET',
    formEnctype: 'application/x-www-form-urlencoded',
    /** Formato oficial de Maps URLs: permanente e abre o app no celular. */
    googleProfileUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.siteName)}&query_place_id=${config.googlePlaceId}`,
    /** Formulário de avaliação do Google, para pedir avaliação a clientes reais. */
    googleReviewUrl: `https://search.google.com/local/writereview?placeid=${config.googlePlaceId}`,
    locationDisplay: location,
    administradoraNote: config.administradora
      ? `Contemplações realizadas por meio da ${config.administradora}, administradora parceira da Gold.`
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
  if (!config.siteUrl) {
    warnings.push('siteUrl vazio — canonical, Open Graph e sitemap ficarão incompletos.');
  }
  return warnings;
}
