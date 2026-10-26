// Crypte des Cendres — cache hors ligne. Change VERSION à chaque mise à jour du jeu.
const VERSION = 'crypte-v90';
const CORE = ['./', './index.html', './manifest.webmanifest', './css/game.css', './js/data.js', './js/game.js', './js/render.js', './js/ui.js', './js/camp.js', './js/inv.js', './js/seal.js', './js/pet.js', './js/settings.js', './js/audio.js', './js/net.js', './js/main.js', './js/update.js', './js/nav.js', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
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
  // Page et scripts du jeu : réseau d'abord (pour recevoir les mises à jour), cache si hors ligne.
  if (req.mode === 'navigate' || (url.origin === location.origin && /\.(js|css|html)$/.test(url.pathname))) {
    // Chaque page garde sa propre copie (le guide ne remplace plus le jeu dans le cache).
    e.respondWith(fetch(req).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || (req.mode === 'navigate' && !/\/aide\//.test(url.pathname) ? caches.match('./index.html') : h))));
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

// L'appli demande le numéro de version pour l'afficher dans les réglages.
self.addEventListener('message', e => { if (e.data && e.data.type === 'version' && e.ports && e.ports[0]) e.ports[0].postMessage(VERSION); });
