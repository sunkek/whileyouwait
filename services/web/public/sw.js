// Offline support. Pages and assets come from the network first, so a deploy
// shows up on the next load; the cached copy answers only when the network
// fails or stalls, as on a metro or in a queue. Install caches the catalog and
// every game, so a game opened for the first time without signal still loads.
// Analytics (/a/) is never cached: offline visits simply go unrecorded.
const CACHE = 'wyw-1';
// Every game's files, filled in by the Dockerfile when the image is built.
const GAMES = [/* GAMES */];
const PRECACHE = ['/', '/404.html', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png',
  '/shared/game.css', '/shared/config.js', '/shared/track.js', '/shared/offline.js', '/shared/daily.js', ...GAMES];
// How long a slow network gets before a cached copy is used instead.
const PATIENCE = 3000;
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === location.origin;
  if (own ? url.pathname.startsWith('/a/') : !FONT_HOSTS.includes(url.host)) return;
  e.respondWith(networkFirst(req, !own));
});

async function networkFirst(req, font) {
  const cache = await caches.open(CACHE);
  const net = fetch(req).then(res => {
    // The font stylesheet loads without CORS, so its response is opaque; keep it anyway.
    if (res.ok || (font && res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  });
  net.catch(() => {});
  const first = await Promise.race([net.catch(() => null), new Promise(r => setTimeout(r, PATIENCE, null))]);
  if (first) return first;
  return (await cache.match(req, { ignoreSearch: true })) || net;
}
