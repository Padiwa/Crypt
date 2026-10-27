// Rendu WebGL : retour dans l'appli (changement d'appli, écran verrouillé). Le moteur de rendu est reconstruit à neuf ;
// l'ancien ne doit ni marquer le nouveau comme perdu (écran noir puis rendu standard), ni laisser ses textures en mémoire.
// PixiJS est remplacé par la maquette fixtures/pixi-mock.js (pas de réseau en test).
import { GAME, FIX, sleep } from '../lib.mjs';

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
];
