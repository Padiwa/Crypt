// Crypte des Cendres — cache hors ligne. Change VERSION à chaque mise à jour du jeu.
const VERSION = 'crypte-v146';
const CORE = ['./', './index.html', './manifest.webmanifest', './css/game.css', './js/rythmes/rapide.js', './js/data.js','./js/progress.js','./js/mods.js','./js/items.js','./js/equip.js', './js/game.js','./js/combat.js','./js/spells.js','./js/step.js', './js/render.js','./js/rendergl.js', './js/ui.js','./js/power.js','./js/modsui.js', './js/camp.js', './js/heros.js', './js/arsenal.js', './js/forge.js', './js/collection.js', './js/save.js', './js/inv.js','./js/gearview.js','./js/dock.js','./js/recycle.js', './js/fuse.js', './js/seal.js', './js/pet.js', './js/tut.js', './js/unlock.js', './js/settings.js', './js/audio.js', './js/relais.js', './js/net.js','./js/netui.js', './js/shell.js', './js/main.js', './js/update.js', './js/nav.js', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png'];
const EXTERNAL = ['https://cdn.jsdelivr.net/npm/pixi.js@7.4.2/dist/pixi.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    // cache: 'reload' : on prend les fichiers sur le réseau, jamais une ancienne copie du cache HTTP du navigateur
    // (GitHub Pages les garde 10 minutes), sinon la nouvelle version pourrait s'installer avec d'anciens fichiers.
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
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
    // cache: 'no-cache' : le navigateur redemande toujours au serveur (réponse 304 légère si rien n'a changé).
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); } return r; })
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
