const MIN_DIGITS = 10;
const MAX_DIGITS = 15;
const BR_PHONE = /^55(\d{2})(\d{4,5})(\d{4})$/;
const REPEATED_DIGIT = /^(\d)\1+$/;

/** Keeps only the digits of a phone number ("+55 (99) 9…" → "5599…"). */
export function normalizePhone(raw) {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * True for numbers that are obviously not real: empty, all the same digit,
 * or a local part made of a single repeated digit (e.g. the template's
 * 55 11 99999-9999).
 */
export function isPlaceholderNumber(raw) {
  const digits = normalizePhone(raw);
  if (!digits) return true;
  const local = digits.replace(/^55\d{2}/, '');
  return REPEATED_DIGIT.test(digits) || REPEATED_DIGIT.test(local);
}

/** "5599987654321" → "+55 (99) 98765-4321". Non-Brazilian numbers get a plain "+" prefix. */
export function formatPhoneBR(raw) {
  const digits = normalizePhone(raw);
  const match = digits.match(BR_PHONE);
  if (!match) return digits ? `+${digits}` : '';
  return `+55 (${match[1]}) ${match[2]}-${match[3]}`;
}

/** Builds a wa.me deep link; throws on a number that cannot be a phone number. */
export function buildWhatsAppUrl(number, message) {
  const digits = normalizePhone(number);
  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    throw new Error(`Número de WhatsApp inválido: "${number}"`);
  }
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
