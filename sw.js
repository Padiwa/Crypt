// Crypte des Cendres — cache hors ligne. Change VERSION à chaque mise à jour du jeu.
const VERSION = 'crypte-v39';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
const EXTERNAL = ['https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    // La bibliothèque PixiJS et les polices sont mises en cache si le réseau les sert ; sinon le jeu passe au rendu standard.
    await Promise.all(EXTERNAL.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Page du jeu : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', cp)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Le reste (icônes, PixiJS, polices) : cache d'abord, puis réseau, et on garde une copie.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque') && (url.origin === location.origin || /jsdelivr|fonts\.(googleapis|gstatic)/.test(url.host))) {
      const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp));
    }
    return r;
  }).catch(() => hit)));
});
