// v155 : paliers au-delà du Tourment X (XI à XV) : difficulté, ouverture un par un, affixes Sublimes (tirage, transfert, fusion, filtre),
// première victoire (coffre, couleurs, titre), objet unique renforcé des Boss et fragments de clé plus fréquents.
import { newPage, startMission, campView } from '../lib.mjs';

export const tests = [
  { name: 'paliers XI à XV : vie et dégâts × BAL.tormX par rapport au X, ouverture un par un (même « tout débloqué »)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const at = (tt) => { meta.diff = 3; meta.torm = tt; const D = dif(); return [D.n, +D.hp.toFixed(2), +D.dm.toFixed(2), +D.aq.toFixed(2)]; };
      const rows = [10, 11, 13, 15].map(at);
      meta.bestTorm = 0; const m0 = tormMax(); meta.bestTorm = 10; const m10 = tormMax(); meta.bestTorm = 15; const m15 = tormMax();
      return { rows, tops: [TORM_TOP, m0, m10, m15], k: BAL.tormX };
    });
    t.eq(r.rows, [['Tourment X', 6, 3.2, .5], ['Tourment XI', 7.5, 4, .55], ['Tourment XIII', 12, 6.4, .65], ['Tourment XV', 18, 9.6, .75]], 'XI ×1,25, XIII ×2, XV ×3 ; qualité des affixes +5 % par palier');
    t.eq(r.tops, [15, 10, 11, 15], 'tout débloqué : I à X ; XI après le X, puis un par un jusqu\'au XV');
  } },
  { name: 'affixes Sublimes : tirées au-delà du X seulement, marquées, gardées par le transfert et la fusion, filtre « Avec une affixe Sublime »', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.bestTorm = 14; saveMeta(); });
    await startMission(p, { diff: 3, torm: 15 });
    const r = await p.evaluate(() => {
      const save = BAL.subCh; BAL.subCh = [1, 1, 1, 1, 1];
      let it; do { it = genItem(40, 2); } while (!Object.keys(it.aff).some((k) => !NOSCALE[k]));
      const marked = Object.keys(it.aff).filter((k) => !NOSCALE[k] && !(AFF[k] && AFF[k].aby)).every((k) => isSub(it, k));
      BAL.subCh = [0, 0, 0, 0, 0]; const none = genItem(40, 2); BAL.subCh = save;
      return { marked, none: subN(none) };
    });
    t.eq([r.marked, r.none], [true, 0], 'chance 100 % : toutes les affixes Sublimes ; chance 0 : aucune');
    // au Camp : transfert (la marque suit la valeur) et fusion de rang
    await p.reload();
    const q = await p.evaluate(() => {
      const mk = (aff, sub) => { let it; do { it = genItem(30, 2); } while (it.slot !== 'armure'); it.aff = aff; if (sub) it.sub = sub; meta.stash.push(it); return it; };
      const src = mk({ crit: 12 }, { crit: 1 }), dst = mk({ hp: 50 });
      meta.essence = 5000; xf = { src: 's:' + src.id, k: 'crit', dst: 's:' + dst.id, rep: '' }; xfDo();
      const after = [dst.aff.crit, isSub(dst, 'crit'), meta.stash.includes(src)];
      const a = mk({ crit: 5 }), bb = mk({ crit: 9 }, { crit: 1 }); fzApply(a, bb, { base: 'a', k: { crit: 'b' } });
      saveMeta(); return { after, fuse: [a.aff.crit, isSub(a, 'crit')] };
    });
    t.eq(q.after, [12, true, false], 'transfert : valeur et marque Sublime passent sur la cible, la source est détruite');
    t.eq(q.fuse, [9, true], 'fusion de rang : l\'affixe gardée garde sa marque');
    await campView(p, 'arsenal', 'coffre');
    await p.click('#campBody [data-cact="fopen"] >> nth=1');
    t.ok(await p.evaluate(() => !!document.querySelector('#pickBody [data-f="o"][data-v="sub"]')), 'filtre « Avec une affixe Sublime » proposé');
    await p.click('#pickBody [data-f="o"][data-v="sub"]');
    t.ok(await p.evaluate(() => { const L = invList('equip').filter((i) => !i.wid); return L.length > 0 && L.every((i) => subN(i) > 0); }), 'le filtre ne garde que les objets avec une affixe Sublime');
  } },
  { name: 'première victoire d\'un palier au-delà du X : relique Abyssale, essence, fragment de clé, couleurs et titre, une seule fois', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      meta.diff = 3; meta.torm = 12; meta.bestTorm = 11; meta.essence = 0; meta.relics.ab = [0, 0]; meta.keyF = {}; meta.keys = {}; meta.tormW = {};
      tutWin(); const once = [meta.relics.ab[0], meta.essence, (meta.keyF.crypte | 0) + 3 * (meta.keys.crypte | 0), !!meta.tormW[12], meta.bestTorm, myTT()];
      tutWin(); const twice = [meta.relics.ab[0], meta.essence];
      return { once, twice, sw: lookSw('rim').includes(TORM_SW[12].rim), badge: ttBadge(myTT()), self: who(0).tt };
    });
    t.eq(r.once, [1, 1000, 1, true, 12, 12], 'Tourment XII : relique Abyssale, 1 000 essence, un fragment de clé, couleurs, titre XII');
    t.eq(r.twice, [1, 1000], 'une seule fois par palier');
    t.ok(r.sw && /XII/.test(r.badge) && r.self === 12, 'couleurs dans les nuanciers ; titre « XII » en coopération');
    await campView(p, 'colors');
    t.ok(await p.evaluate(() => [...document.querySelectorAll('.lcol')].some((c) => /Tourment XII/.test(c.textContent) && !c.classList.contains('is-lock'))), 'Collection › Couleurs : celles du Tourment XII gagnées');
  } },
  { name: 'Boss au-delà du X : pouvoir de l\'objet unique + BAL.lordUqStep par palier, compté dans les statistiques ; fragments de clé plus fréquents', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      meta.diff = 3; meta.torm = 13; const bonus = lordUqBonus(), ch = keyFragCh();
      const it = uqItem('condamne', 50); it.uqv = UQ.condamne.v + bonus; meta.gear.amulette = it;
      const s = stats(curEq());
      meta.torm = 10; const ch10 = keyFragCh(), b10 = lordUqBonus();
      return { bonus, cond: s.uqCond, txt: /70 %/.test(uqTxt('condamne', uqVal(it))), ch, ch10, b10 };
    });
    t.eq([r.bonus, r.cond, r.txt], [30, 70, true], 'Tourment XIII : +30 points, la Chaîne du Condamné passe à +70 %');
    t.eq([r.ch, r.ch10, r.b10], [.2, .1, 0], 'fragments de clé : 20 % au-delà du X, 10 % jusqu\'au X');
  } },
];
