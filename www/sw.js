/* Service worker: la app completa funciona sin internet */
const V = 'expresamini-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'css/style.css', 'js/util.js', 'js/data.js', 'js/store.js', 'js/games.js', 'js/admin.js', 'js/app.js', 'assets/logo.png', 'assets/icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => { if (e.request.method === 'GET' && new URL(e.request.url).origin === location.origin) e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))); });
