/** Loads the Google Maps iframe only after an explicit click (privacy + ~600 KB saved). */
export function initMapFacade() {
  const facade = document.getElementById('map-facade');
  const button = document.getElementById('map-load');
  if (!facade || !button) return;

  button.addEventListener(
    'click',
    () => {
      const iframe = document.createElement('iframe');
      iframe.src = button.dataset.mapSrc;
      iframe.title = 'Mapa com a localização da Gold Representações';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      facade.replaceChildren(iframe);
      facade.classList.add('is-loaded');
    },
    { once: true },
  );
}
