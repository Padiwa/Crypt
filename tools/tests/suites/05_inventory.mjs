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
  { name: 'recycler une arme la retire avec tous ses doubles (v125)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.built.a2 = true; meta.wlv.a2 = 1; meta.wcp.a2 = [0, 0]; meta.wpn.archer = 'a0'; meta.essence = 0; saveMeta(); });
    await campView(p, 'arsenal', 'recy');
    t.eq(await p.evaluate(() => (document.querySelector('[data-arg="w:a2"] .cx-cell__n') || {}).textContent), '×3', 'la case montre ×3 (l\'arme et ses 2 doubles)');
    await p.click('[data-arg="w:a2"]');
    t.ok(await p.evaluate(() => /Recycler · 1/.test($('campFoot').textContent)), 'pied : « Recycler · 1 » (l\'arme choisie)');
    await p.click('#campFoot [data-cact="rcask"]');
    t.ok(await p.evaluate(() => /1 objet \(3 exemplaires avec les doubles\)/.test($('campFoot').textContent)), 'confirmation : 1 objet (3 exemplaires)');
    await p.click('#campFoot [data-cact="rcok"]');
    // Arc long du Corbeau (rare) : 60 essence × 2 au rang 2, puis 60 par double au rang 1
    t.eq(await p.evaluate(() => [ownedW('a2'), meta.wcp.a2 || null, meta.essence, !!document.querySelector('[data-arg="w:a2"]')]), [false, null, 240, false], 'arme et doubles partis, 240 essence, plus dans la liste');
  } },
  { name: 'arme verrouillée ou portée : seuls ses doubles se recyclent, l\'arme reste (v126)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.stash = []; meta.essence = 0;
      meta.built.a2 = true; meta.wlv.a2 = 1; meta.wcp.a2 = [0, 1]; meta.wlock = { a2: true };   // verrouillée, 2 doubles
      meta.built.a3 = true; meta.wlv.a3 = 0; meta.wcp.a3 = [0]; meta.wpn.archer = 'a3';          // portée, 1 double
      meta.built.a7 = true; meta.wlv.a7 = 0; meta.wlock.a7 = true;                                 // verrouillée, sans double
      saveMeta();
    });
    await campView(p, 'arsenal', 'recy');
    const cells = () => p.evaluate(() => [...document.querySelectorAll('#invGrid .cx-cell')].map((c) => [c.dataset.arg, (c.querySelector('.cx-cell__n') || {}).textContent || '', !!c.querySelector('.cx-cell__lock'), c.getAttribute('aria-disabled') === 'true']).sort());
    t.eq(await cells(), [['d:a2', '×2', true, false], ['d:a3', '×1', true, false], ['w:a7', '', true, true]], 'cases « doubles » au cadenas, arme verrouillée sans double grisée');
    await p.click('[data-cact="rcall"]'); await p.click('#campFoot [data-cact="rcask"]');
    t.ok(await p.evaluate(() => /2 objets \(3 exemplaires avec les doubles\)/.test($('campFoot').textContent)), 'confirmation : 2 objets, 3 exemplaires');
    await p.click('#campFoot [data-cact="rcok"]');
    // a2 rare : doubles aux rangs 1 et 2 → 60 + 120 ; a3 légendaire : double au rang 1 → 80
    t.eq(await p.evaluate(() => [ownedW('a2'), meta.wlv.a2, wSpares('a2'), ownedW('a3'), meta.wpn.archer, wSpares('a3'), meta.essence]), [true, 1, [], true, 'a3', [], 260], 'armes gardées à leur rang, doubles partis, 260 essence');
    t.eq(await cells(), [['w:a2', '', true, true], ['w:a7', '', true, true]], 'restent les armes verrouillées, grisées, sans double');
    // la fiche d'une arme verrouillée avec des doubles propose « Recycler les doubles »
    await p.evaluate(() => { meta.wcp.a2 = [0, 0]; saveMeta(); campTab = 'arsenal'; arsView = 'coffre'; campSel = { wpn: 'a2' }; dockMore = true; drawCamp(); });
    t.ok(await p.evaluate(() => [...document.querySelectorAll('#campDock [data-cact="gorecy1"]')].some((x) => x.dataset.arg === 'd:a2' && !x.disabled && /Recycler les doubles · 2/.test(x.textContent))), 'fiche : « Recycler les doubles · 2 »');
    t.eq(p.errs, [], 'aucune erreur');
  } },
];
