// Reliques : contenu, ouverture, éclatante, forgée, file regroupée.
import { newPage, campView } from '../lib.mjs';

const click = (p, cact, arg) => p.evaluate(([a, g]) => campClick({ dataset: { cact: a, arg: g }, disabled: false }), [cact, arg]);

export const tests = [
  { name: 'contenu : armes du héros + objets de la rareté, givre exclu hors Abîmes', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => { heroCls = 'archer'; return [relPool(0), relPool(2).some((id) => RGEAR[id] && RGEAR[id].bio), relPool(3).filter((id) => RGEAR[id] && RGEAR[id].slot === 'dos').length]; });
    t.eq(r[0].length, 10, 'Ossuaire : 10 objets'); t.ok(r[0].includes('a3') && r[0].includes('a4'), 'armes légendaires de l\'Archer');
    t.ok(!r[1], 'pas de givre hors Abîmes'); t.eq(r[2], 2, 'Abyssale : 2 dos');
  } },
  { name: 'ouverture : 1 fragment (intacte), 2 (éclatante), forgée = objet visé', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => { meta.relics = { os: [1, 1], F_L3: [1, 0] }; const a = grantRelic('os', false), c = grantRelic('os', true), f = grantRelic('F_L3', false); return [a.got.length, c.got.length, f.got.map((x) => x.bid), meta.relics.os]; });
    t.eq(r[0], 1, 'intacte'); t.eq(r[1], 2, 'éclatante'); t.eq(r[2], ['L3'], 'forgée'); t.eq(r[3], [0, 0], 'reliques consommées');
  } },
  { name: 'fusion : 3 reliques d\'un type donnent une relique forgée de ce type', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { an: [3, 0] }; meta.relicQ = []; meta.essence = 100; saveMeta(); });
    await campView(p, 'relics');
    await click(p, 'rftgt', '1|N2'); await click(p, 'rfuse', '1');
    t.eq(await p.evaluate(() => [meta.relics.an, meta.relics.F_N2, meta.essence]), [[0, 0], [1, 0], 60], 'résultat');
  } },
  { name: 'file d\'ouverture regroupée par type, déplacement par groupe', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { os: [5, 2], an: [3, 0] }; meta.relicQ = []; saveMeta(); });
    await campView(p, 'relics');
    await click(p, 'rqall');
    t.eq(await p.evaluate(() => document.querySelectorAll('.rq li').length), 3, 'trois lignes');
    t.eq(await p.evaluate(() => meta.relicQ.length), 10, 'dix reliques équipées');
    const first = await p.evaluate(() => relGroups()[0].id + relGroups()[0].rad);
    await p.evaluate(() => { const g = relGroups()[1]; campClick({ dataset: { cact: 'rgmv', arg: g.id + '|' + (g.rad ? 1 : 0) + '|-1' }, disabled: false }); });
    t.ok(await p.evaluate((f) => relGroups()[1].id + relGroups()[1].rad === f, first), 'groupe remonté');
    await click(p, 'rqdel', 'an|0'); t.eq(await p.evaluate(() => meta.relicQ.length), 9, 'retirer une');
  } },
];
