// Fabrication à l'Armurerie et fusion de rang.
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'fabrication : niveau de la plus haute mission, arme neuve puis double', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      meta.gold = 9999; meta.maxL = 25; meta.parts = { L1: [1, 1, 1], a3: [2, 2, 2] }; heroCls = 'archer';
      const it = craftOne('L1'), w1 = craftOne('a3'), w2 = craftOne('a3'), none = craftOne('a3');
      return [it.lvl, it.r, Object.keys(it.aff).length, w1, w2, none, wSpares('a3'), 9999 - meta.gold, CRAFT_G[3] * 3];
    });
    t.eq(r.slice(0, 3), [97, 3, 4], 'objet légendaire au niveau 97');
    t.eq(r.slice(3, 6), ['new', 'copy', null], 'arme neuve, double, plus de fragments');
    t.eq(r[6], [0], 'un double de rang 1'); t.eq(r[7], r[8], 'or dépensé (3 fabrications légendaires)');
  } },
  { name: 'fusion d\'arme : doubles combinés jusqu\'au plus haut rang', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.eq(await p.evaluate(() => { meta.gold = 1e6; meta.built.a3 = true; meta.wlv.a3 = 0; meta.wcp.a3 = [0, 0, 0]; const d = wFuse('a3'); return [d, meta.wlv.a3, wSpares('a3'), 1e6 - meta.gold === 2 * fuseGold(3, 0, relicItemLvl()) + fuseGold(3, 1, relicItemLvl())]; }), [2, 2, [], true], 'rang 3, plus de doubles, or payé');
    t.eq(await p.evaluate(() => { meta.gold = fuseGold(3, 0, relicItemLvl()); meta.wlv.a4 = 0; meta.built.a4 = true; meta.wcp.a4 = [0, 0, 0]; const d = wFuse('a4'); return [d, meta.gold, wSpares('a4').length]; }), [1, 0, 2], 'or limité : une seule fusion');
  } },
  { name: 'fusion d\'objets : garde le meilleur, ne sacrifie ni verrouillé ni porté', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const a = rgItem('L3', 97), c = rgItem('L3', 80), l = rgItem('L3', 60); l.lock = true;
      const w = rgItem('L5', 90), w2 = rgItem('L5', 70); meta.gear.bottes = w;
      meta.gold = 1e6; meta.stash.push(a, c, l, w2); const n = fuseAll();
      return [n, a.up | 0, meta.stash.includes(c), meta.stash.includes(l), meta.gear.bottes.up | 0, meta.stash.includes(w2)];
    });
    t.eq(r, [2, 1, false, true, 1, false], 'résultat');
  } },
  { name: 'fiche : bouton de fusion quand un double existe', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.gold = 1e6; const a = rgItem('L7', 97), c = rgItem('L7', 90); meta.stash.push(a, c); saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    await p.evaluate(() => { campSel = { stash: meta.stash.find((i) => i.rid === 'L7' && i.lvl === 97).id }; drawCamp(); });
    t.ok(await p.evaluate(() => !!document.querySelector('#campDock [data-cact="fuse1"]')), 'bouton Fusionner');
    await p.click('#campDock [data-cact="fuse1"]');
    t.eq(await p.evaluate(() => meta.stash.filter((i) => i.rid === 'L7').map((i) => [i.lvl, i.up | 0])), [[97, 1]], 'fusionné');
  } },
  { name: 'butin des monstres : rang maximum plafonné, fusion payante', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const mk = (up) => { const it = genItem(20, 0); it.r = 0; it.slot = 'bottes'; it.type = 'Grèves'; it.up = up; return it; };
      const cap = BAL.mobRankMax[0] - 1, a = mk(cap), c = mk(cap); meta.stash = [a, c]; meta.gold = 1e6;
      const atCap = fuseAll(), x = mk(0), y = mk(0); meta.stash = [x, y]; meta.gold = fuseGold(0, 0, x.lvl) - 1; const poor = fuseAll(); meta.gold += 1; const ok = fuseAll();
      return [atCap, poor, ok, Math.max(...meta.stash.map((i) => i.up | 0)), meta.gold];
    });
    t.eq(r, [0, 0, 1, 1, 0], 'pas de fusion au rang max, ni sans or ; puis une fusion payée');
  } },
];
