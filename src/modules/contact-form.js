import { buildContactMessage } from '../lib/messages.js';
import { buildWhatsAppUrl } from '../lib/whatsapp.js';
import { createExternalLink } from './dom-utils.js';

const FETCH_TIMEOUT_MS = 10_000;

const STATUS_TEXT = {
  sending: 'Enviando…',
  success: 'Mensagem enviada! Em breve entraremos em contato.',
  error: 'Não foi possível enviar agora. Chame a gente direto no WhatsApp pelo botão verde.',
  unavailable: 'O envio está indisponível no momento. Chame a gente pelo Instagram:',
  whatsapp: 'Abrimos o WhatsApp com a sua mensagem. Se não abriu, toque no botão abaixo.',
};

/**
 * The endpoint comes from the form's data-endpoint attribute (filled from config at
 * build time). With one, the form is POSTed as JSON (Formspree-compatible); without
 * it, the message is handed to WhatsApp — inside the click, so no popup blocker.
 * Without JavaScript the browser falls back to the form's native action
 * (the endpoint, or a GET to wa.me that opens the chat without the fields).
 */
export function initContactForm(config) {
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    if (data._gotcha) return; // honeypot: bots fill hidden fields

    const endpoint = form.dataset.endpoint?.trim();
    if (endpoint) {
      await submitToEndpoint({ form, status, endpoint, data });
    } else {
      submitViaWhatsApp({ status, config, data });
    }
  });
}

async function submitToEndpoint({ form, status, endpoint, data }) {
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  setStatus(status, STATUS_TEXT.sending);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    form.reset();
    setStatus(status, STATUS_TEXT.success, 'success');
  } catch (error) {
    console.error('[contact-form] envio falhou:', error);
    setStatus(status, STATUS_TEXT.error, 'error');
  } finally {
    button.disabled = false;
  }
}

function submitViaWhatsApp({ status, config, data }) {
  let url;
  try {
    url = buildWhatsAppUrl(config.whatsappNumber, buildContactMessage(data));
  } catch (error) {
    // Misconfigured number: never leave the visitor without a way to reach us.
    console.error('[contact-form] WhatsApp indisponível:', error);
    setStatus(status, STATUS_TEXT.unavailable, 'error');
    status.appendChild(createExternalLink(config.instagramUrl, 'Chamar no Instagram', 'btn btn-outline-dark'));
    return;
  }

  window.open(url, '_blank', 'noopener');
  setStatus(status, STATUS_TEXT.whatsapp, 'success');
  status.appendChild(createExternalLink(url, 'Abrir WhatsApp', 'btn btn-outline-dark'));
}

function setStatus(element, text, kind = '') {
  element.textContent = text;
  element.className = kind ? `form-status is-${kind}` : 'form-status';
}
