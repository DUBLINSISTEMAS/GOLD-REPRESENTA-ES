/** Cria um link externo seguro (nova aba, sem acesso ao window de origem). */
export function createExternalLink(href, label, className) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.className = className;
  link.textContent = label;
  return link;
}
