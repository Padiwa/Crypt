// Coffre (Armurerie), fiche ancrée, équipement, recyclage, clavier.
import { newPage, campView, openCamp } from '../lib.mjs';

export const tests = [
  { name: 'Héros › « Ouvrir le coffre » mène à Armurerie › Coffre', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await openCamp(p); await p.click('[data-cact="gocoffre"]');
    t.eq(await p.evaluate(() => [campTab, arsView, !!document.querySelector('#invGrid')]), ['arsenal', 'coffre', true], 'vue');
  } },
  { name: 'fiche : équiper depuis le coffre', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { const it = genItem(20, 2); it.slot = 'armure'; it.base.k = 'hp'; meta.stash = [it]; meta.gear.armure = null; saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    await p.click('#invGrid [data-stash]'); await p.click('#campDock [data-cact="equip"]');
    t.ok(await p.evaluate(() => !!meta.gear.armure && meta.stash.length === 0), 'armure portée');
  } },
  { name: 'clavier : flèches dans le coffre', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 1280, h: 800 }));
    await p.evaluate(() => { for (let i = 0; i < 8; i++) meta.stash.push(genItem(20)); saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    await p.keyboard.press('ArrowRight');
    t.ok(await p.evaluate(() => !!campSel && !$('campDock').hidden), 'un objet sélectionné');
  } },
  { name: 'recyclage : sélection, essence, verrou respecté', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.stash = []; for (let i = 0; i < 4; i++) { const it = genItem(20, 0); it.r = 0; meta.stash.push(it); } meta.stash[0].lock = true; meta.essence = 0; saveMeta(); });
    await campView(p, 'arsenal', 'recy');
    await p.click('[data-cact="rcall"]'); await p.click('#campFoot [data-cact="rcask"]'); await p.click('#campFoot [data-cact="rcok"]');
    t.eq(await p.evaluate(() => [meta.stash.length, meta.stash[0].lock, meta.essence]), [1, true, 6], 'reste le verrouillé, 3 × 2 essence');
  } },
  { name: 'recycler une arme avec un double garde le double', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.built.a2 = true; meta.wlv.a2 = 1; meta.wcp.a2 = [0]; meta.wpn.archer = 'a0'; saveMeta(); });
    await campView(p, 'arsenal', 'recy');
    await p.evaluate(() => { recySel = new Set(['w:a2']); recyDo(); });
    t.eq(await p.evaluate(() => [ownedW('a2'), meta.wlv.a2, wSpares('a2')]), [true, 0, []], 'double promu');
  } },
];
