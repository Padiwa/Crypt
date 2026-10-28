// Rendu WebGL : retour dans l'appli (changement d'appli, écran verrouillé). Le moteur de rendu est reconstruit à neuf ;
// l'ancien ne doit ni marquer le nouveau comme perdu (écran noir puis rendu standard), ni laisser ses textures en mémoire.
// PixiJS est remplacé par la maquette fixtures/pixi-mock.js (pas de réseau en test).
// Économie d'énergie (v134) : images dessinées par seconde selon l'écran, réglage « Économie de batterie ».
import { GAME, FIX, sleep, newPage, startMission } from '../lib.mjs';

async function glPage(b) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); p.errs = []; p.ctx = ctx;
  p.on('pageerror', (e) => p.errs.push(e.message));
  await p.route(/pixi\.min\.js/, (r) => r.fulfill({ path: FIX('pixi-mock.js'), contentType: 'text/javascript' }));
  await p.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, (r) => r.abort());
  await p.goto(GAME + '#test');
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.evaluate(() => unlockAll());
  return p;
}
const away = (p) => p.evaluate(() => {
  const set = (v) => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); };
  set('hidden'); set('visible');
});

export const tests = [
  { name: 'retour dans l\'appli : le rendu WebGL repart sans écran noir ni fuite de textures (v133)', fn: async (b, t) => {
    const p = t.track(await glPage(b));
    t.ok(await p.evaluate(() => !!PX && !NOGL), 'rendu WebGL (maquette) en service');
    await p.click('#startBtn'); await sleep(p, 600);
    const s0 = await p.evaluate(() => ({ tex: Object.keys(PIXI.utils.TextureCache).length, live: PIXI.__live }));
    for (let i = 0; i < 4; i++) { await away(p); await sleep(p, 120); }
    await p.evaluate(() => { closeBag(); }); await sleep(p, 300);
    const s1 = await p.evaluate(() => ({ px: !!PX, lost: !!(PX && PX.lost), tex: Object.keys(PIXI.utils.TextureCache).length, live: PIXI.__live, rnd: PIXI.__renderers, f: PIXI.__frames }));
    t.ok(s1.px && !s1.lost, `le nouveau moteur n'est pas marqué perdu (${JSON.stringify(s1)})`);
    t.eq([s1.tex, s1.rnd], [s0.tex, 1], 'textures et moteurs : autant qu\'au départ');
    t.ok(s1.live <= s0.live + 40, `objets de la scène libérés (${s0.live} puis ${s1.live})`);
    const f0 = s1.f; await sleep(p, 300);
    t.ok(await p.evaluate((f0) => PIXI.__frames > f0 && !/Rendu WebGL interrompu/.test(document.body.textContent), f0), 'le jeu continue de dessiner, sans bascule vers le rendu standard');
  } },
  { name: 'batterie : rien n\'est dessiné derrière l\'accueil, le Camp et l\'écran de fin ; 5 images par seconde en pause (v134)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { window.__n = 0; const r = window.render; window.render = () => { __n++; r(); }; });
    const rate = async (ms = 1000) => { await p.evaluate(() => { __n = 0; }); await sleep(p, ms); return p.evaluate((ms) => Math.round(__n * 1000 / ms), ms); };
    t.eq(await rate(), 0, 'accueil : aucune image');
    await p.click('#tabbar [data-nav="arsenal"]'); t.eq(await rate(), 0, 'Camp : aucune image');
    await p.click('#tabbar [data-nav="combat"]');
    await startMission(p); const play = await rate();
    t.ok(play >= 25, `mission : le jeu tourne normalement (${play} images par seconde)`);
    await p.evaluate(() => openBag()); const pz = await rate(1500);
    t.ok(pz >= 2 && pz <= 7, `pause : environ 5 images par seconde (${pz})`);
    await p.evaluate(() => { closeBag(); missionSuccess(); }); await sleep(p, 300);
    t.eq(await rate(), 0, 'écran de fin : aucune image');
    await p.click('#againBtn'); const again = await rate();
    t.ok(again >= 25, `Rejouer : le jeu repart (${again})`);
  } },
  { name: 'batterie : réglage « Économie de batterie » : 30 images par seconde et image en résolution 1× (v134)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { window.__n = 0; const r = window.render; window.render = () => { __n++; r(); }; });
    await p.click('#setBtn'); await p.click('#settings [data-set="eco"]');
    t.ok(await p.evaluate(() => SET.eco === true && JSON.parse(localStorage.getItem('crypte-set') || '{}').eco !== false), 'réglage activé');
    await p.evaluate(() => closeSettings());
    await startMission(p); await p.evaluate(() => { __n = 0; }); await sleep(p, 1500);
    const n = await p.evaluate(() => Math.round(__n / 1.5));
    t.ok(n >= 20 && n <= 34, `mission : environ 30 images par seconde (${n})`);
    t.eq(await p.evaluate(() => [dpr, cv.width === Math.round(innerWidth)]), [1, true], 'résolution 1×');
  } },
  { name: 'Nécropole des Sables en WebGL (maquette) : sables mouvants, obélisques, tempête, momies, malédiction, sans erreur (v136)', fn: async (b, t) => {
    const p = t.track(await glPage(b));
    await p.evaluate(() => { meta.biome = 2; meta.start = 25; saveMeta(); });
    await p.click('#startBtn'); await sleep(p, 500);
    const r = await p.evaluate(() => {
      const q = G.sands[0]; G.P.x = q.x; G.P.y = q.y; G.storm = STORM_LEN / 2;
      spawnEnemy({ type: 'scarab', x: G.P.x + 120, y: G.P.y }); spawnEnemy({ type: 'mummy', x: G.P.x - 120, y: G.P.y }); spawnEnemy({ type: 'mummyR', x: G.P.x, y: G.P.y + 120 });
      G.en[G.en.length - 1].curse = 3; G.spawns.push({ type: 'mummyR', x: G.P.x + 60, y: G.P.y - 80, t: 1, split: 1, rise: 1 });
      return { sand: PX.L.sand.children.length, n: G.sands.length, tile: PX.L.floor.texture === PX.T.tiles[2] };
    });
    await sleep(p, 400);
    const v = await p.evaluate(() => ({ px: !!PX, veil: PX.veil.visible, a: +PX.veil.alpha.toFixed(2), noFallback: !/Rendu WebGL interrompu/.test(document.body.textContent) }));
    t.eq(r, { sand: r.n, n: 9, tile: true }, 'sables mouvants dessinés, sol des sables');
    t.eq(v, { px: true, veil: true, a: .38, noFallback: true }, 'voile de la tempête, rendu WebGL toujours en service');
    // v137 : l'obscurité de la tempête et le voile couvrent tout l'écran, au zoom le plus bas comme au plus haut
    for (const zm of [.7, 1.4]) {
      const c = await p.evaluate((zm) => { SET.zoom = zm; G.storm = STORM_LEN / 2; render(); const W = innerWidth, H = innerHeight, d = PX.darkS, v = PX.veil;
        const box = (o) => [o.position.x - o.width / 2, o.position.y - o.height / 2, o.position.x + o.width / 2, o.position.y + o.height / 2];
        const [x0, y0, x1, y1] = box(d); return { dark: d.visible && x0 <= 0 && y0 <= 0 && x1 >= W && y1 >= H && d.alpha === 1 && PX.dark.alpha === 0, veil: v.visible && v.position.x <= 0 && v.position.y <= 0 && v.width >= W && v.height >= H }; }, zm);
      t.eq(c, { dark: true, veil: true }, `zoom ${zm} : obscurité et voile sur tout l'écran`);
    }
    t.eq(p.errs, [], 'aucune erreur');
  } },
];
