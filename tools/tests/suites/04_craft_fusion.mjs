// Fabrication à l'Armurerie et fusion de rang.
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'fabrication : niveau de la plus haute mission, arme neuve puis double', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      meta.gold = 9999; meta.maxL = 25; meta.parts = { L1: [1, 1, 1], a3: [2, 2, 2] }; heroCls = 'archer';
      const it = craftOne('L1'), w1 = craftOne('a3'), w2 = craftOne('a3'), none = craftOne('a3');
      return [it.lvl, it.r, Object.keys(it.aff).length, w1, w2, none, wSpares('a3'), meta.gold];
    });
    t.eq(r.slice(0, 3), [97, 3, 4], 'objet légendaire au niveau 97');
    t.eq(r.slice(3, 6), ['new', 'copy', null], 'arme neuve, double, plus de fragments');
    t.eq(r[6], [0], 'un double de rang 1'); t.eq(r[7], 9999 - 300 * 3, 'or dépensé');
  } },
  { name: 'fusion d\'arme : doubles combinés jusqu\'au plus haut rang', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.eq(await p.evaluate(() => { meta.built.a3 = true; meta.wlv.a3 = 0; meta.wcp.a3 = [0, 0, 0]; const d = wFuse('a3'); return [d, meta.wlv.a3, wSpares('a3')]; }), [2, 2, []], 'rang 3, plus de doubles');
  } },
  { name: 'fusion d\'objets : garde le meilleur, ne sacrifie ni verrouillé ni porté', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const a = rgItem('L3', 97), c = rgItem('L3', 80), l = rgItem('L3', 60); l.lock = true;
      const w = rgItem('L5', 90), w2 = rgItem('L5', 70); meta.gear.bottes = w;
      meta.stash.push(a, c, l, w2); const n = fuseAll();
      return [n, a.up | 0, meta.stash.includes(c), meta.stash.includes(l), meta.gear.bottes.up | 0, meta.stash.includes(w2)];
    });
    t.eq(r, [2, 1, false, true, 1, false], 'résultat');
  } },
  { name: 'fiche : bouton de fusion quand un double existe', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { const a = rgItem('L7', 97), c = rgItem('L7', 90); meta.stash.push(a, c); saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    await p.evaluate(() => { campSel = { stash: meta.stash.find((i) => i.rid === 'L7' && i.lvl === 97).id }; drawCamp(); });
    t.ok(await p.evaluate(() => !!document.querySelector('#campDock [data-cact="fuse1"]')), 'bouton Fusionner');
    await p.click('#campDock [data-cact="fuse1"]');
    t.eq(await p.evaluate(() => meta.stash.filter((i) => i.rid === 'L7').map((i) => [i.lvl, i.up | 0])), [[97, 1]], 'fusionné');
  } },
];
