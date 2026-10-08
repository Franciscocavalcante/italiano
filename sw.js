/* Service worker: guarda todo o app no aparelho para funcionar sem internet.
   Gerado por build.mjs: a lista de arquivos e a versão são preenchidas automaticamente. */
const VERSION = '7bc236215f3e';
const CACHE = `italiano-${VERSION}`;
const FILES = [
 "./",
 "./assets/boot.js",
 "./assets/chunk-2c6b8rzg.js",
 "./css/app.css",
 "./icons/apple-touch-icon.png",
 "./icons/icon-192.png",
 "./icons/icon-512-maskable.png",
 "./icons/icon-512.png",
 "./index.html",
 "./manifest.webmanifest"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('italiano-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // config.js (dados da conta online) vem da internet primeiro; sem internet usa a última cópia guardada
  if (url.pathname.endsWith('/config.js')) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true })).then((hit) => hit || new Response('', { headers: { 'Content-Type': 'text/javascript' } }))),
    );
    return;
  }
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        if (req.mode === 'navigate') {
          const index = await cache.match('./index.html');
          if (index) return index;
        }
        throw err;
      }
    }),
  );
});
