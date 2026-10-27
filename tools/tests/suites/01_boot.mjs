// Démarrage, rendus, Camp complet, guide.
import { newPage, campView, startMission, GUIDE, sleep } from '../lib.mjs';

export const tests = [
  { name: 'le jeu démarre sur l\'accueil, sans erreur', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.ok(await p.evaluate(() => !$('intro').hidden), 'accueil visible');
    t.ok((await p.textContent('#startBtn')).includes('Combattre'), 'bouton Combattre');
    t.ok(await p.evaluate(() => getComputedStyle($('tabbar')).display !== 'none' && document.querySelectorAll('#tabbar [data-nav]').length === 5), 'barre des 5 onglets');
    t.eq(await p.evaluate(() => document.querySelector('#tabbar [aria-current="page"]').dataset.nav), 'combat', 'onglet Combat actif');
  } },
  { name: 'rendu WebGL : une mission tourne', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#test' }));
    await startMission(p); await sleep(p, 800);
    t.ok(await p.evaluate(() => G.t > 0 && !G.over), 'la partie avance');
  } },
  { name: 'tous les onglets et vues du Camp s\'affichent', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const views = [['equip'], ['arsenal', 'coffre'], ['arsenal', 'rec'], ['arsenal', 'mine'], ['arsenal', 'recy'], ['relics'], ['mods'], ['pets'],
      ['forge', 'up'], ['forge', 'affix'], ['forge', 'fuse'], ['forge', 'seals']];
    for (const [tab, sub] of views) {
      await campView(p, tab, sub);
      const n = await p.evaluate(() => $('campBody').textContent.trim().length);
      t.ok(n > 20, `vue ${tab}${sub ? ' › ' + sub : ''} vide`);
    }
    for (const r of ['w', '3', '4', '5', '6', 'ready', 'o']) {
      await p.evaluate((x) => { arsView = 'rec'; arsR = x; drawCamp(); }, r);
      t.ok(await p.evaluate(() => $('campBody').textContent.length > 50), `Recettes › ${r}`);
    }
  } },
  { name: 'le guide s\'ouvre avec ses sections clés', fn: async (b, t) => {
    const ctx = await b.newContext(); const p = await ctx.newPage(); p.errs = []; p.ctx = ctx; t.track(p);
    p.on('pageerror', (e) => p.errs.push(e.message));
    await p.route(/fonts\.googleapis|fonts\.gstatic/, (r) => r.abort());
    await p.goto(GUIDE);
    for (const id of ['debuter', 'demarrer', 'butin', 'camp-equip', 'camp-arsenal', 'camp-coffre', 'camp-relics', 'camp-fusion', 'emplacements', 'camp-forge'])
      t.ok(await p.evaluate((i) => !!document.getElementById(i), id), `section #${id}`);
    t.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'pas de défilement horizontal');
  } },
];
