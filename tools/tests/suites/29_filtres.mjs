// v151 : filtre commun « Trier et filtrer » (Coffre, Héros › Équipement, Forge › Fusion, Affixes, Recycler) : affixes (toutes ou au moins une),
// rareté, porté par, afficher seulement, tri par valeur des affixes ; le filtre reste le même d'un onglet à l'autre ; pastilles et « Effacer ».
import { newPage, campView } from '../lib.mjs';

// Trois armures sans arme ni objet porté : une avec Critique et Vitesse, une avec Critique seul, une avec Vitesse seule.
const setup = () => {
  const arm = (r, aff) => { let it; do { it = genItem(30, r); } while (it.slot !== 'armure'); it.r = r; it.aff = aff; return it; };
  heroCls = 'archer'; meta.gear.armure = null;
  meta.stash = [arm(2, { crit: 8, apsPct: 10 }), arm(1, { crit: 3 }), arm(3, { apsPct: 25 })];
  saveMeta(); return meta.stash.map((i) => i.id);
};
const ids = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s)].map((x) => +x.dataset.stash), sel);

export const tests = [
  { name: 'Coffre : filtre par affixes (toutes, au moins une), rareté, tri par valeur des affixes, pastilles et Effacer', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const [both, crit, vit] = await p.evaluate(setup);
    await campView(p, 'arsenal', 'coffre');
    await p.click('#campBody [data-cact="fopen"] >> nth=1');
    t.ok(await p.evaluate(() => ['crit', 'apsPct'].every((k) => !!document.querySelector(`#pickBody [data-f="a"][data-v="${k}"]`))), 'les affixes de tes objets sont proposées');
    await p.click('#pickBody [data-f="a"][data-v="crit"]'); await p.click('#pickBody [data-f="a"][data-v="apsPct"]');
    t.eq(await ids(p, '#invGrid [data-stash]'), [both], 'Toutes : l\'objet qui a les deux affixes');
    t.ok(await p.evaluate(() => /Voir 1 objet\b/.test($('pickBody').textContent)), 'le bouton du panneau compte les objets affichés');
    await p.click('#pickBody [data-f="am"][data-v="any"]');
    t.eq((await ids(p, '#invGrid [data-stash]')).sort(), [both, crit, vit].sort(), 'Au moins une : les trois');
    await p.click('#pickBody [data-f="sort"][data-v="aff"]');
    t.eq(await ids(p, '#invGrid [data-stash]'), [vit, both, crit], 'tri par valeur des affixes cherchées (25, 18, 3)');
    await p.click('#pickBody [data-f="r"][data-v="1"]');
    t.eq(await ids(p, '#invGrid [data-stash]'), [crit], 'rareté Magique');
    await p.click('#pickBody [data-f="close"]');
    t.eq(await p.evaluate(() => [...document.querySelectorAll('#campBody .fchip')].map((x) => x.textContent.trim())), ['Chances de critique', 'Vitesse d\'attaque', 'Magique'], 'pastilles des filtres actifs');
    await p.click('#campBody [data-cact="fdel"][data-arg="r:1"]');
    t.eq((await ids(p, '#invGrid [data-stash]')).length, 3, 'la pastille Magique retire ce filtre');
    await p.click('#campBody [data-cact="freset"]');
    t.eq(await p.evaluate(() => [filtN(), !document.querySelector('#campBody .fchip'), !document.querySelector('#campBody [data-cact="freset"]')]), [0, true, true], 'Effacer retire tous les filtres');
  } },
  { name: 'le filtre reste le même d\'un onglet à l\'autre : Coffre, Héros › Équipement, Forge › Recycler et Affixes', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const [both, crit, vit] = await p.evaluate(setup);
    await campView(p, 'arsenal', 'coffre');
    await p.click('#campBody [data-cact="fopen"] >> nth=1'); await p.click('#pickBody [data-f="a"][data-v="crit"]'); await p.click('#pickBody [data-f="close"]');
    t.eq((await ids(p, '#invGrid [data-stash]')).sort(), [both, crit].sort(), 'Coffre : Critique');
    await campView(p, 'equip', 'gear:armure');
    t.eq((await ids(p, '.gearl .gearr')).sort(), [both, crit].sort(), 'Héros › Équipement › Armure : même filtre');
    t.ok(await p.evaluate(() => !!document.querySelector('#campBody .fchip[data-arg="a:crit"]')), 'la pastille suit');
    await p.click('#tabbar [data-nav="forge"]'); await p.click('.ftabs [data-arg="recy"]');
    t.eq(await p.evaluate(() => recyList().map((i) => i.id).sort()), [both, crit].sort(), 'Recycler : les deux objets filtrés');
    await p.click('.ftabs [data-arg="affix"]');
    t.eq(await p.evaluate(() => invList('affix').filter((i) => !i.wid).map((i) => i.id).sort()), [both, crit].sort(), 'Forge › Affixes : même filtre');
    await p.click('#campBody [data-cact="fdel"][data-arg="a:crit"]');
    t.eq(await p.evaluate(() => invList('affix').filter((i) => !i.wid).length), 3, 'retiré depuis la Forge : partout');
  } },
];
