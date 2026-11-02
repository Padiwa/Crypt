// Héros › Équipement (v137) : un emplacement à la fois, objets classés par Puissance ; Mods et Familier dans l'onglet Héros.
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'Héros › Équipement : emplacement touché, objet porté, objets classés par Puissance, fiche et Équiper', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const ids = await p.evaluate(() => {
      heroCls = 'archer';
      const arm = (l, r) => { let it; do { it = genItem(l, r); } while (it.slot !== 'armure'); return it; };
      meta.gear.armure = arm(30, 1); meta.stash = [arm(60, 2), arm(10, 0), arm(45, 1)]; meta.gearBy.guerrier.armure = arm(50, 2);
      saveMeta(); return { worn: meta.gear.armure.id, stash: meta.stash.map((i) => i.id), oth: meta.gearBy.guerrier.armure.id };
    });
    await campView(p, 'equip');
    await p.click('.hslot[data-arg="armure"]');
    t.eq(await p.evaluate(() => [heroSub, gearSlot, document.querySelector('.gslot[aria-selected="true"]').dataset.arg]), ['gear', 'armure', 'armure'], 'l\'emplacement touché ouvre Héros › Équipement sur lui');
    t.ok(await p.evaluate((id) => document.querySelector('#gearDetail .gd').textContent.includes(findItem(id).name) && /Porté/.test($('gearDetail').textContent) && $('campDock').hidden, ids.worn), 'fiche de l\'objet porté dans la page, au-dessus de la liste (v153)');
    const r = await p.evaluate(() => {
      const e = curEq(), b0 = eqVal(e), rows = [...document.querySelectorAll('.gearl .gearr')], it = (x) => findItem(+x.dataset.stash);
      const v = rows.map((x) => eqVal({ ...e, armure: it(x) }));
      return { n: rows.length, sorted: v.every((x, i) => !i || x.p <= v[i - 1].p + 1e-9),
        up: rows.every((x, i) => x.classList.contains('is-up') === eqGt(v[i], b0)),
        sign: rows.every((x, i) => { const d = x.querySelector('.gearr__d'); return d.classList.contains('is-gain') ? v[i].p > b0.p : d.classList.contains('is-loss') ? v[i].p < b0.p : true; }),
        who: rows.filter((x) => x.querySelector('.cwho')).map((x) => +x.dataset.stash) };
    });
    t.eq([r.n, r.sorted, r.up, r.sign], [4, true, true, true], 'coffre et autres héros, classés par Puissance, triangle et écart justes');
    t.eq(r.who, [ids.oth], 'l\'objet du Guerrier porte sa pastille');
    // équiper l'objet du coffre qui donne le plus de Puissance
    const pick = await p.evaluate((L) => { const e = curEq(); return L.map((id) => [id, eqVal({ ...e, armure: findItem(id) }).p]).sort((a, b) => b[1] - a[1])[0][0]; }, ids.stash);
    await p.click(`.gearr[data-stash="${pick}"]`);
    t.ok(await p.evaluate(() => $('campDock').hidden && !!document.querySelector('#gearDetail [data-cact="equip"]') && /\d+ \/ 4/.test($('gearDetail').textContent) && !document.querySelector('#gearDetail [data-cmp]') && !!document.querySelector('#gearDetail [data-cact="lock"]')), 'fiche dans la page : Équiper, position dans la liste, toutes les affixes sans pages, toutes les actions (v153)');
    await p.click('#gearDetail [data-cact="equip"]');
    t.eq(await p.evaluate((x) => [meta.gear.armure.id, meta.stash.some((i) => i.id === x.worn)], ids), [pick, true], 'équipé ; l\'ancien objet retourne au coffre');
    // tri par rareté
    await p.evaluate(() => { campSel = null; drawCamp(); });
    await p.click('#campBody [data-cact="fopen"] >> nth=0'); await p.click('#pickBody [data-f="sort"][data-v="rar"]'); await p.click('#pickBody [data-f="close"]');
    t.ok(await p.evaluate(() => { const r = [...document.querySelectorAll('.gearl .gearr')].map((x) => findItem(+x.dataset.stash).r); return r.every((x, i) => !i || x <= r[i - 1]); }), 'tri par rareté');
    // arme : les armes du héros, avec rang, maîtrise et mods
    await p.evaluate(() => { meta.built.a2 = true; meta.built.a3 = true; meta.wpn.archer = 'a0'; gearSort = 'pow'; saveMeta(); drawCamp(); });
    await p.click('.gslot[data-arg="arme"]');
    t.eq(await p.evaluate(() => [...document.querySelectorAll('.gearl .gearr')].map((x) => x.dataset.wsel).sort()), ['a2', 'a3'], 'armes de l\'Archer sauf celle portée');
    t.ok(await p.evaluate(() => /maîtrise \d+ \/ 10/.test(document.querySelector('.gearl .gearr').textContent)), 'rang et maîtrise affichés');
    await p.click('.gearr[data-wsel="a2"]'); await p.click('#gearDetail [data-cact="wequip"][data-arg="a2"]');
    t.eq(await p.evaluate(() => [meta.wpn.archer, [...document.querySelectorAll('.gearl .gearr')].map((x) => x.dataset.wsel).sort()]), ['a2', ['a0', 'a3']], 'arme équipée depuis la fiche');
    // 2e anneau : l'objet va dans l'emplacement ouvert, même si le 1er anneau est vide
    const ring = await p.evaluate(() => { meta.slotU[heroCls] = { anneau2: true }; meta.gear.anneau = null; meta.gear.anneau2 = null; const it = rgItem('L7', 50); meta.stash.push(it); saveMeta(); campSel = null; drawCamp(); return it.id; });
    await p.click('.gslot[data-arg="anneau2"]'); await p.click(`.gearr[data-stash="${ring}"]`); await p.click('#gearDetail [data-cact="equip"]');
    t.eq(await p.evaluate(() => [meta.gear.anneau2 && meta.gear.anneau2.rid, meta.gear.anneau]), ['L7', null], 'anneau posé dans le 2e emplacement');
    // retour arrière : la fiche, puis la vue principale du héros
    await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
    t.eq(await p.evaluate(() => [campTab, heroSub, $('campDock').hidden]), ['equip', 'main', true], 'Échap ferme la fiche puis revient au héros');
  } },
  { name: 'Héros : onglets Équipement, Sorts, Mods, Familier, Prestige ; flèches de héros ; Collection = Reliques (v149)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.eggs = 2; saveMeta(); });
    await campView(p, 'equip');
    t.eq(await p.evaluate(() => [...document.querySelectorAll('.htabs .cx-tab')].map((x) => x.dataset.arg)), ['main', 'tal', 'mods', 'pets', 'prest', 'look'], 'six onglets (Apparence depuis la v151)');
    t.eq(await p.evaluate(() => [!document.querySelector('.htile'), !document.querySelector('#campBody .cx-back'), document.querySelector('.htabs [aria-selected="true"]').dataset.arg]), [true, true, 'main'], 'plus de tuiles ni de retour ; Équipement choisi');
    t.ok(await p.evaluate(() => !!document.querySelector('.htabs [data-arg="pets"] .cx-tab__dot')), 'Familier : un point pour les œufs à faire éclore');
    await p.click('.htabs [data-arg="mods"]');
    t.eq(await p.evaluate(() => [campTab, !!document.querySelector('#modsCamp .cx-build'), document.querySelector('#campTitle .htitle__n').textContent === CLS[heroCls].n, document.querySelector('#tabbar [data-nav="heros"]').classList.contains('is-on'), document.querySelector('.htabs [aria-selected="true"]').dataset.arg]), ['mods', true, true, true, 'mods'], 'Mods dans l\'onglet Héros');
    await p.click('.htabs [data-arg="main"]');
    t.eq(await p.evaluate(() => [campTab, heroSub]), ['equip', 'main'], 'l\'onglet Équipement ramène au héros');
    await p.click('.htabs [data-arg="pets"]');
    t.ok(await p.evaluate(() => campTab === 'pets' && !!document.querySelector('#modsCamp [data-pet="hatch"]')), 'Familier : œufs, collection et build');
    await p.click('#modsCamp [data-pet="hatch"]');
    t.eq(await p.evaluate(() => [meta.eggs, meta.pets.length, campTab]), [1, 1, 'pets'], 'éclosion depuis le héros');
    await p.keyboard.press('Escape');
    t.eq(await p.evaluate(() => [campTab, heroSub]), ['equip', 'main'], 'Échap revient au héros');
    await p.click('.htabs [data-arg="tal"]');
    t.eq(await p.evaluate(() => [heroSub, !!document.querySelector('.kitc')]), ['tal', true], 'Sorts : sorts, ultimes et talents');
    // flèches du titre : héros suivant puis précédent
    const c0 = await p.evaluate(() => heroCls);
    await p.click('#campTitle .htitle__a:last-child');
    const c1 = await p.evaluate(() => [heroCls, document.querySelector('#campTitle .htitle__n').textContent === CLS[heroCls].n, heroSub]);
    t.ok(c1[0] !== c0 && c1[1] && c1[2] === 'tal', 'flèche suivante : autre héros, même onglet');
    await p.click('#campTitle .htitle__a:first-child');
    t.eq(await p.evaluate(() => heroCls), c0, 'flèche précédente : retour au premier héros');
    await p.click('#tabbar [data-nav="coll"]');
    t.eq(await p.evaluate(() => [campTab, [...document.querySelectorAll('[data-cact="coll"]')].map((x) => x.dataset.arg), $('campTitle').textContent]), ['relics', ['relics', 'uniq', 'colors'], 'Collection'], 'Collection : Reliques, Uniques, Couleurs (v152)');
    await p.click('#tabbar [data-nav="arsenal"]');
    t.eq(await p.evaluate(() => [$('campTitle').textContent, !document.querySelector('#campBody [role="tab"]'), document.querySelector('#tabbar [data-nav="arsenal"]').textContent.trim()]), ['Coffre', true, 'Coffre'], 'Coffre seul, sans sous-onglets (v151)');
    await p.click('#tabbar [data-nav="forge"]'); await p.click('.ftabs [data-arg="rec"]');
    t.eq(await p.evaluate(() => [campTab, arsView, $('campTitle').textContent, document.querySelector('#tabbar .is-on').dataset.nav]), ['arsenal', 'rec', 'Forge', 'forge'], 'Fabriquer dans la Forge');
    await p.click('.ftabs [data-arg="recy"]');
    t.eq(await p.evaluate(() => [arsView, document.querySelector('.ftabs [aria-selected="true"]').dataset.arg]), ['recy', 'recy'], 'Recycler dans la Forge');
    await p.click('#tabbar [data-nav="arsenal"]');
    t.eq(await p.evaluate(() => arsView), 'coffre', 'l\'onglet Coffre rouvre le coffre');
    t.eq(await p.evaluate(() => { arsView = 'mine'; drawCamp(); return arsView; }), 'coffre', 'ancienne vue Armes : le coffre');
    await p.click('#tabbar [data-nav="combat"]'); await p.click('#petBtn');
    t.eq(await p.evaluate(() => [campTab, navOf(campTab)]), ['pets', 'heros'], 'bouton Familier de l\'accueil');
  } },
];
