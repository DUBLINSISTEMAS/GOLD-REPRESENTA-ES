const collapseWhitespace = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

/** Message the chatbot hands to WhatsApp once the lead picked an interest and an amount. */
export function buildLeadMessage({ interesse, valor, specialist }) {
  const greeting = specialist ? `Olá, ${collapseWhitespace(specialist)}!` : 'Olá!';
  return (
    `${greeting} Falei com o assistente virtual do site. ` +
    `Tenho interesse em uma carta de crédito para *${collapseWhitespace(interesse)}* ` +
    `no valor aproximado de *${collapseWhitespace(valor)}*. Pode me ajudar?`
  );
}

/** Contact-form fallback: the same fields, formatted as a WhatsApp message. */
export function buildContactMessage({ name, email, message }) {
  return [
    'Olá! Vim pelo site da Gold Representações.',
    `*Nome:* ${collapseWhitespace(name)}`,
    `*E-mail:* ${collapseWhitespace(email)}`,
    `*Mensagem:* ${collapseWhitespace(message)}`,
  ].join('\n');
}
