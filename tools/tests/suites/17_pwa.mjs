// Application installable (PWA) : le service worker installe le jeu, détecte une nouvelle VERSION, la charge, et le jeu marche hors ligne.
// Le service worker ne tourne qu'en http(s) : une copie du site est servie sur localhost par un petit serveur Node.
import fs from 'fs';
import os from 'os';
import path from 'path';
import http from 'http';
import { ROOT, sleep } from '../lib.mjs';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
function serve(dir) {
  const srv = http.createServer((q, r) => {
    let f = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
    if (f.endsWith(path.sep)) f = path.join(f, 'index.html');
    fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }); r.end(d); });
  });
  return new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv)));
}

export const tests = [
  { name: 'service worker : nouvelle version détectée et chargée malgré le cache HTTP de 10 minutes, jeu hors ligne (v131)', fn: async (b, t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crypte-pwa-'));
    for (const x of ['index.html', 'sw.js', 'manifest.webmanifest', 'css', 'js', 'icons']) fs.cpSync(path.join(ROOT, x), path.join(dir, x), { recursive: true });
    const srv = await serve(dir), url = `http://localhost:${srv.address().port}/index.html`;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(); p.errs = []; p.ctx = ctx; t.track(p);
    p.on('pageerror', (e) => p.errs.push(e.message));
    // pas de ctx.route ici : Playwright couperait le cache HTTP, que ce test doit justement garder (polices et CDN échouent seuls, sans réseau)
    try {
      await p.goto(url);
      await p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
      const v0 = await p.evaluate(() => new Promise((ok) => { const ch = new MessageChannel(); ch.port1.onmessage = (e) => ok(e.data); navigator.serviceWorker.controller.postMessage({ type: 'version' }, [ch.port2]); }));
      t.ok(/^crypte-v\d+$/.test(v0), `version installée : ${v0}`);
      // Nouvelle version publiée : sw.js et un script changent sur le serveur (le navigateur garde les anciens 10 minutes en cache HTTP).
      fs.writeFileSync(path.join(dir, 'sw.js'), fs.readFileSync(path.join(dir, 'sw.js'), 'utf8').replace(v0, 'crypte-v999'));
      fs.appendFileSync(path.join(dir, 'js', 'main.js'), '\nwindow.__NOUVEAU = 1;');
      await p.evaluate(() => UPD.check());
      await p.waitForFunction(() => UPD.ready, null, { timeout: 15000 }).catch(() => {});
      await sleep(p, 1200);
      t.ok(await p.evaluate(() => UPD.ready && !$('updBar').hidden), 'bandeau « Nouvelle version du jeu » à l\'accueil');
      // relance de l'appli : une navigation ordinaire (pas un rechargement forcé, qui redemanderait tout au serveur)
      await p.goto('about:blank'); await p.goto(url); await sleep(p, 800);
      t.ok(await p.evaluate(() => window.__NOUVEAU === 1), 'après « Mettre à jour » : le nouveau script est chargé, pas la copie du cache HTTP');
      await ctx.setOffline(true); await p.reload(); await sleep(p, 800);
      t.ok(await p.evaluate(() => typeof start === 'function' && !!document.getElementById('tabbar')), 'hors ligne : le jeu se charge depuis le cache');
    } finally { await ctx.setOffline(false).catch(() => {}); srv.close(); fs.rmSync(dir, { recursive: true, force: true }); }
  } },
];
