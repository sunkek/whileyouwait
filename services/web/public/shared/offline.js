// Registers the service worker (/sw.js) that keeps the catalog and every game
// playable without a network connection.
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
