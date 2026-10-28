// Reliques : contenu, ouverture, éclatante, forgée, file regroupée ; gestion (v140) : tableau par rareté, cases à cocher, nombre saisi, raffinage en nombre.
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
  { name: 'gestion (v140) : tableau par rareté, cases à cocher, nombre saisi, raffinage en nombre', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { os: [6, 2], an: [3, 1], sa: [0, 2], F_L3: [1, 0] }; meta.relicQ = [{ id: 'an', rad: false }]; meta.essence = 120; saveMeta(); });
    await campView(p, 'relics');
    const sum = await p.evaluate(() => [...document.querySelectorAll('.rsum__r:not(.rsum__h)')].map((r) => [...r.children].map((c) => c.textContent.trim()).join('|')));
    t.eq(sum, ['Ossuaire|7|✦ 2|0 / 9', 'Ancestrale|3|✦ 1|1 / 4', 'Sanguine|0|✦ 2|0 / 2', 'Abyssale|0|✦ 0|0 / 0', 'Total|10|✦ 5|1 / 15'], 'simples, éclatantes et équipées par rareté (forgées comprises)');
    // case à cocher : toutes les éclatantes Ossuaire, puis aucune
    const chk = '.rchk[data-arg^="os|1|"]';
    t.eq(await p.evaluate((s) => document.querySelector(s).getAttribute('aria-checked'), chk), 'false', 'case vide');
    await p.click(chk);
    t.eq(await p.evaluate((s) => [relicQN('os', true), document.querySelector(s).getAttribute('aria-checked')], chk), [2, 'true'], 'cochée : les 2 éclatantes équipées');
    await p.click(chk); t.eq(await p.evaluate(() => relicQN('os', true)), 0, 'décochée : retirées');
    // nombre saisi : 4 simples Ossuaire ; trop grand = toutes ; la case passe à moitié
    await p.fill('input[data-rnum="os|0"]', '4'); await p.press('input[data-rnum="os|0"]', 'Enter');
    t.eq(await p.evaluate(() => [relicQN('os', false), document.querySelector('.rchk[data-arg^="os|0|"]').getAttribute('aria-checked'), document.querySelector('input[data-rnum="os|0"]').value]), [4, 'mixed', '4'], 'saisie : 4 équipées, case à moitié');
    await p.fill('input[data-rnum="os|0"]', '99'); await p.press('input[data-rnum="os|0"]', 'Enter');
    t.eq(await p.evaluate(() => relicQN('os', false)), 6, 'saisie trop grande : toutes');
    await p.click('[data-cact="rqset"][data-arg="os|0|5"]'); t.eq(await p.evaluate(() => relicQN('os', false)), 5, '− : une de moins');
    // les nouvelles rejoignent leur groupe dans la file
    t.eq(await p.evaluate(() => relGroups().map((g) => g.id + (g.rad ? '✦' : '') + g.n)), ['an1', 'os5'], 'file regroupée, ordre gardé');
    // raffinage en nombre : 2 Ossuaire simples ; la libre d'abord, puis une équipée reste équipée en éclatante
    await p.fill('input[data-rref="os"]', '2'); await p.press('input[data-rref="os"]', 'Enter');
    await p.click('[data-cact="refine"][data-arg="os|2"]');
    t.eq(await p.evaluate(() => [meta.relics.os, meta.essence, relicQN('os', false), relicQN('os', true), meta.relicQ.length]), [[4, 4], 20, 4, 1, 6], 'raffinées : 1 libre, 1 équipée devenue éclatante, essence dépensée');
    t.ok(await p.evaluate(() => document.querySelector('[data-cact="refine"][data-arg^="an|"]').disabled && /pas assez d'essence/.test(document.querySelector('#rc1').textContent)), 'plus assez d\'essence : bouton éteint et dit pourquoi');
    // actions générales
    await p.click('[data-cact="rqrad"]'); t.eq(await p.evaluate(() => ['os', 'an', 'sa'].map((id) => relicQN(id, true))), [4, 1, 2], 'Équiper les éclatantes');
    await p.click('[data-cact="rqnone"]'); t.eq(await p.evaluate(() => meta.relicQ.length), 0, 'Tout retirer');
    await p.click('[data-cact="rqsimple"]'); t.eq(await p.evaluate(() => [relicQN('os', false), relicQN('an', false), relicQN('F_L3', false), relicQN('os', true)]), [4, 3, 1, 0], 'Équiper les simples, forgées comprises');
    t.ok(await p.evaluate(() => /Forgée · /.test(document.querySelector('#rc0').textContent) && !!document.querySelector('#rc0 input[data-rnum="F_L3|0"]')), 'relique forgée dans la carte de sa rareté');
  } },
];
