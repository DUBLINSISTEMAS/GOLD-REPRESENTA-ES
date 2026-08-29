/** Keeps the © year current even if the site is not rebuilt for a while. */
export function updateYear() {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
}
