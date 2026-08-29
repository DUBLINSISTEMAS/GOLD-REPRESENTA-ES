import { buildLeadMessage } from '../lib/messages.js';
import { buildWhatsAppUrl } from '../lib/whatsapp.js';

const BOT_DELAY_MS = 700;
const STEP = { INTEREST: 'interest', AMOUNT: 'amount', DONE: 'done' };

const INTERESTS = [
  { label: 'Comprar imóvel', value: 'Imóvel' },
  { label: 'Comprar veículo', value: 'Veículo' },
  { label: 'Investir', value: 'Investimento' },
];

const AMOUNTS = ['Até R$ 50 mil', 'R$ 50 a 150 mil', 'R$ 150 a 300 mil', 'Acima de R$ 300 mil'];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Two-question guided flow (interest → amount) that ends with a link the
 * visitor clicks to open WhatsApp with the lead already written.
 */
export function initChatbot(config) {
  const elements = {
    toggle: document.getElementById('chatbot-toggle'),
    container: document.getElementById('chatbot-container'),
    close: document.getElementById('chatbot-close'),
    messages: document.getElementById('chatbot-messages'),
    form: document.getElementById('chatbot-form'),
    input: document.getElementById('chatbot-input-field'),
    send: document.getElementById('chatbot-send-btn'),
    badge: document.querySelector('.chatbot-badge'),
  };
  if (Object.values(elements).some((element) => !element)) return;

  const state = { step: STEP.INTEREST, lead: { interesse: '', valor: '' }, started: false };
  const ui = createChatUi(elements);

  const setOpen = (open) => {
    elements.container.classList.toggle('active', open);
    elements.container.setAttribute('aria-hidden', String(!open));
    elements.toggle.setAttribute('aria-expanded', String(open));
    if (!open) {
      elements.toggle.focus();
      return;
    }
    elements.badge.hidden = true;
    elements.messages.focus();
    if (!state.started) {
      state.started = true;
      askInterest();
    }
  };

  async function askInterest() {
    state.step = STEP.INTEREST;
    ui.addBot('Olá! Sou o assistente virtual da Gold Representações. Em duas perguntas eu te levo ao especialista certo.');
    await wait(BOT_DELAY_MS);
    ui.addBot(
      'Qual é o seu objetivo hoje?',
      INTERESTS.map((option) => ({ label: option.label, onSelect: () => pickInterest(option) })),
    );
  }

  async function pickInterest(option) {
    ui.clearOptions();
    ui.addUser(option.label);
    state.lead.interesse = option.value;
    state.step = STEP.AMOUNT;
    await wait(BOT_DELAY_MS);
    ui.addBot(
      `Ótimo! Qual o valor aproximado da carta de crédito para ${option.value.toLowerCase()}? Escolha uma faixa ou digite.`,
      AMOUNTS.map((amount) => ({ label: amount, onSelect: () => pickAmount(amount) })),
    );
    ui.setInputEnabled(true);
  }

  async function pickAmount(valor) {
    if (!valor) return;
    ui.clearOptions();
    ui.setInputEnabled(false);
    ui.addUser(valor);
    state.lead.valor = valor;
    state.step = STEP.DONE;
    await wait(BOT_DELAY_MS);

    const message = buildLeadMessage({ ...state.lead, specialist: config.specialistName });
    try {
      const url = buildWhatsAppUrl(config.whatsappNumber, message);
      ui.addBot(
        `Perfeito! ${config.specialistName} continua a conversa com você pelo WhatsApp, sem compromisso. Toque no botão para abrir o app com a sua simulação já preenchida.`,
      );
      ui.addLink('Abrir WhatsApp', url);
    } catch (error) {
      // Misconfigured number: fall back to e-mail instead of failing silently.
      console.error('[chatbot] WhatsApp indisponível:', error);
      ui.addBot(`Perfeito! Para continuar, fale com ${config.specialistName} por e-mail com a sua simulação.`);
      ui.addLink('Enviar e-mail', `mailto:${config.email}?subject=${encodeURIComponent('Simulação de carta de crédito')}&body=${encodeURIComponent(message)}`);
    }
    await wait(BOT_DELAY_MS);
    ui.addBot('Quer simular outra coisa?', [{ label: 'Recomeçar', onSelect: restart }]);
  }

  function restart() {
    elements.messages.replaceChildren();
    state.lead = { interesse: '', valor: '' };
    askInterest();
  }

  elements.toggle.addEventListener('click', () => setOpen(!elements.container.classList.contains('active')));
  elements.close.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.container.classList.contains('active')) setOpen(false);
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.step !== STEP.AMOUNT) return;
    const value = elements.input.value.trim();
    elements.input.value = '';
    pickAmount(value);
  });
}

function createChatUi({ messages, input, send }) {
  const scrollToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const addMessage = (role, text) => {
    const bubble = document.createElement('div');
    bubble.className = `chat-msg ${role}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    scrollToBottom();
    return bubble;
  };

  return {
    addUser: (text) => addMessage('user', text),

    addBot(text, options) {
      const bubble = addMessage('bot', text);
      if (!options?.length) return bubble;
      const list = document.createElement('div');
      list.className = 'chat-options';
      for (const option of options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-opt-btn';
        button.textContent = option.label;
        button.addEventListener('click', option.onSelect);
        list.appendChild(button);
      }
      bubble.appendChild(list);
      list.querySelector('button')?.focus({ preventScroll: true });
      scrollToBottom();
      return bubble;
    },

    addLink(label, href) {
      const link = document.createElement('a');
      link.className = 'btn btn-primary chat-wa-link';
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = label;
      messages.appendChild(link);
      link.focus({ preventScroll: true });
      scrollToBottom();
    },

    clearOptions() {
      messages.querySelectorAll('.chat-options').forEach((list) => list.remove());
    },

    setInputEnabled(enabled) {
      input.disabled = !enabled;
      send.disabled = !enabled;
      if (enabled) input.focus({ preventScroll: true });
    },
  };
}
