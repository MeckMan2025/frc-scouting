/* Service worker: keeps the whole app on the device so it opens, and reloads,
   with no internet at all. build.py stamps __VERSION__ from the built files,
   so a new build is a new cache and old copies are dropped. */
const VERSION = '__VERSION__';
const CACHE = 'frc-scouting-' + VERSION;
const SHELL = ['./', 'index.html', 'FRC-Scouting.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Our own files come from the cache first, and are refreshed quietly in the
// background when there is internet, so the next open has the latest build.
// Anything else (The Blue Alliance) goes straight to the network as before.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(refresh); return hit; }
      const fresh = await refresh;
      if (fresh) return fresh;
      // Offline and not cached under this exact URL: a page request still gets the app.
      if (req.mode === 'navigate') return (await cache.match('FRC-Scouting.html')) || Response.error();
      return Response.error();
    })
  );
});
