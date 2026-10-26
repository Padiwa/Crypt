// Forge › Affixes : chercher par affixe, source et cible.
import { newPage, campView } from '../lib.mjs';

async function setup(p) {
  await p.evaluate(() => {
    heroCls = 'archer'; meta.essence = 900; meta.built.a1 = true; meta.wpn.archer = 'a1';
    meta.stash = [];
    const lk = genItem(60, 2); lk.aff = { crit: 2 }; lk.lock = true; lk.slot = 'armure'; lk.base.k = 'hp';
    const g = genItem(60, 1); g.aff = { crit: 3, hp: 9 }; g.slot = 'bottes'; g.base.k = 'speed';
    meta.stash.push(lk, g); saveMeta();
  });
  await campView(p, 'forge', 'affix');
  await p.click('[data-cact="afopen"][data-arg="crit"]');
}

export const tests = [
  { name: 'objet verrouillé et arme de départ : Cible seulement', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await setup(p);
    const rows = await p.evaluate(() => [...document.querySelectorAll('.afind li.open ul li')].map((li) => [li.textContent.includes('coffre') ? 'c' : 'w', !!li.querySelector('[data-cact="afuse"]'), !!li.querySelector('[data-cact="afdst"]'), li.querySelector('.li') ? 'lock' : '']));
    const locked = rows.find((r) => r[3] === 'lock');
    t.ok(locked && !locked[1] && locked[2], 'verrouillé : pas de bouton Source');
    t.ok(await p.evaluate(() => !xfSrcOk('w:a0') && xfSrcOk('w:a1')), 'arme de départ jamais source, autre arme oui');
  } },
  { name: 'transfert : arme source détruite, héros revient à l\'arme de départ', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await setup(p);
    await p.evaluate(() => { xf = { src: 'w:a1', k: 'crit', dst: 's:' + meta.stash[1].id, rep: '', pick: 'dst', op: 'up' }; drawCamp(); });
    await p.click('#campFoot [data-cact="xfok"]');
    t.eq(await p.evaluate(() => [meta.wpn.archer, ownedW('a1'), meta.stash[1].aff.crit > 3]), ['a0', false, true], 'résultat');
  } },
  { name: 'choisir la cible depuis la liste', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await setup(p);
    await p.click('.afind li.open ul li:last-child [data-cact="afdst"]');
    t.ok(await p.evaluate(() => xf.dst && !!document.querySelector('.afind .cx-pin--dst')), 'cible choisie et marquée');
  } },
];
