import { buildContactMessage } from '../lib/messages.js';
import { buildWhatsAppUrl } from '../lib/whatsapp.js';

const STATUS_TEXT = {
  sending: 'Enviando…',
  success: 'Mensagem enviada! Em breve entraremos em contato.',
  error: 'Não foi possível enviar agora. Tente pelo WhatsApp ou envie um e-mail.',
  whatsapp: 'Abrimos o WhatsApp com a sua mensagem. Se não abriu, toque no botão abaixo.',
};

/**
 * With `formEndpoint` configured, POSTs the form as JSON (Formspree-compatible).
 * Without it, hands the message to WhatsApp — inside the click, so no popup blocker.
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

    if (config.formEndpoint) {
      await submitToEndpoint({ form, status, endpoint: config.formEndpoint, data });
    } else {
      submitViaWhatsApp({ form, status, config, data });
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
    setStatus(status, STATUS_TEXT.error, 'error');
    status.appendChild(createLink(`mailto:${config.email}`, 'Enviar por e-mail'));
    return;
  }

  window.open(url, '_blank', 'noopener');
  setStatus(status, STATUS_TEXT.whatsapp, 'success');
  status.appendChild(createLink(url, 'Abrir WhatsApp'));
}

function createLink(href, label) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.className = 'btn btn-outline-dark form-status-link';
  link.textContent = label;
  return link;
}

function setStatus(element, text, kind = '') {
  element.textContent = text;
  element.className = kind ? `form-status is-${kind}` : 'form-status';
}
