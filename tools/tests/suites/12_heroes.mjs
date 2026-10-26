// Équipement par héros, coffre avec les objets portés, équipements enregistrés.
import { newPage, campView } from '../lib.mjs';

// Un objet de reliques prêt à porter (niveau 50).
export const tests = [
  { name: 'chaque héros a son équipement', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'archer'; meta.gear.armure = rgItem('L1', 50); heroCls = 'guerrier'; const g0 = meta.gear.armure; meta.gear.armure = rgItem('L2', 50);
      heroCls = 'archer'; const a = meta.gear.armure.rid; heroCls = 'guerrier'; const g = meta.gear.armure.rid; saveMeta();
      const saved = JSON.parse(localStorage.getItem('crypte-meta'));
      return [g0, a, g, 'gear' in saved, Object.keys(saved.gearBy).sort()];
    });
    t.eq(r, [null, 'L1', 'L2', false, ['archer', 'guerrier', 'magicien']], 'armures séparées, sauvegarde par héros');
  } },
  { name: 'ancienne sauvegarde : l\'équipement va au dernier héros joué', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { const m = JSON.parse(localStorage.getItem('crypte-meta')); delete m.gearBy; m.gear = { armure: rgItem('L1', 40), amulette: null, bottes: null, anneau: null }; localStorage.setItem('crypte-meta', JSON.stringify(m)); localStorage.setItem('crypte-cls', 'magicien'); });
    await p.reload();
    t.eq(await p.evaluate(() => [meta.gearBy.magicien.armure && meta.gearBy.magicien.armure.rid, meta.gearBy.archer.armure || null]), ['L1', null], 'au Magicien');
  } },
  { name: 'coffre : objets portés visibles avec le héros, filtre Portés', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 1280, h: 800 }));
    await p.evaluate(() => { heroCls = 'archer'; meta.gearBy.guerrier.bottes = rgItem('L5', 50); meta.gearBy.archer.anneau = rgItem('L7', 50); meta.stash = [rgItem('L3', 50)]; saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    const r = await p.evaluate(() => [document.querySelectorAll('#invGrid .cell').length, [...document.querySelectorAll('#invGrid .cwho')].map((e) => e.textContent).sort().join('')]);
    t.eq(r, [6, 'AAGGM'], '3 objets + l\'arme portée de chaque héros, avec la pastille du héros');
    await p.click('[data-cact="sfilter"][data-arg="porte"]');
    t.eq(await p.evaluate(() => document.querySelectorAll('#invGrid .cell').length), 5, 'Portés : anneau, bottes et les 3 armes portées');
    await p.click('[data-cact="sfilter"][data-arg="all"]');
    await p.click('#invGrid .cell:has(.cwho)');
  } },
  { name: 'équiper un objet porté par un autre héros le lui retire', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.gearBy.guerrier.bottes = rgItem('L5', 50); meta.gearBy.archer.bottes = null; saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    await p.evaluate(() => { campSel = { oth: 'guerrier|bottes' }; drawCamp(); });
    t.ok(await p.evaluate(() => /Porté par le Guerrier/.test($('campDock').textContent)), 'fiche : porté par le Guerrier');
    await p.click('#campDock [data-cact="equipoth"]');
    t.eq(await p.evaluate(() => [meta.gearBy.archer.bottes && meta.gearBy.archer.bottes.rid, meta.gearBy.guerrier.bottes]), ['L5', null], 'passé à l\'Archer');
  } },
  { name: 'recyclage : rien de porté, même par un autre héros', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.gearBy.guerrier.bottes = rgItem('L5', 50); meta.stash = [rgItem('L3', 50)]; saveMeta(); });
    t.eq(await p.evaluate(() => recyAll().map((i) => i.rid || i.wid)), ['L3'], 'seulement le coffre');
  } },
  { name: 'équipements enregistrés : enregistrer, changer, porter, objets manquants', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.gear.armure = rgItem('L1', 50); meta.gear.anneau = rgItem('L7', 50); saveMeta(); });
    await campView(p, 'equip');
    await p.click('[data-cact="setsave"]');
    t.eq(await p.evaluate(() => setsOf('archer').length), 1, 'enregistré');
    await p.fill('[data-setname="0"]', 'Boss'); await p.press('[data-setname="0"]', 'Tab');
    // on change d'équipement : l'armure part au coffre, l'anneau chez le Guerrier
    await p.evaluate(() => { const a = meta.gear.armure, n = meta.gear.anneau; meta.stash.push(a); meta.gear.armure = null; meta.gear.anneau = null; meta.gearBy.guerrier.anneau = n; drawCamp(); });
    await p.click('[data-cact="setwear"][data-arg="0"]');
    t.eq(await p.evaluate(() => [setsOf('archer')[0].n, meta.gear.armure && meta.gear.armure.rid, meta.gear.anneau && meta.gear.anneau.rid, meta.gearBy.guerrier.anneau, meta.stash.length]), ['Boss', 'L1', 'L7', null, 0], 'tout est revenu');
    await p.evaluate(() => { meta.stash = meta.stash.filter((i) => i !== meta.gear.armure); meta.gear.armure = null; drawCamp(); });
    await p.evaluate(() => { const s = setsOf('archer')[0]; s.g.bottes = 999999; drawCamp(); });
    await p.click('[data-cact="setwear"][data-arg="0"]');
    t.ok(await p.evaluate(() => /introuvable/.test(document.getElementById('toast').textContent)), 'objet manquant signalé');
  } },
  { name: 'Armurerie › Par héros : ce que porte chaque héros, objet repris sur le héros joué', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.gear.armure = rgItem('L1', 50); meta.gearBy.guerrier.bottes = rgItem('L2', 50); meta.gearBy.guerrier.bottes.slot = 'bottes'; saveMeta(); });
    await campView(p, 'equip');
    await p.click('[data-cact="goheros"]');
    t.eq(await p.evaluate(() => [arsView, [...document.querySelectorAll('.hgear h3')].map((h) => h.textContent.slice(1).split(' · ')[0])]), ['heros', ['Archer', 'Guerrier', 'Magicien']], 'trois héros, le héros joué en premier');
    t.ok(await p.evaluate(() => /Rien de porté/.test(document.querySelectorAll('.hgear')[2].textContent)), 'héros sans équipement : conseil');
    await p.evaluate(() => document.querySelectorAll('.hgear')[1].querySelector('button[data-stash]').click());
    t.ok(await p.evaluate(() => !$('campDock').hidden && /Porté par le Guerrier/.test($('campDock').textContent) && !!document.querySelector('#campDock [data-cact="equipoth"]')), 'fiche : porté par le Guerrier, « Équiper sur Archer »');
    await p.click('#campDock [data-cact="equipoth"]');
    t.eq(await p.evaluate(() => [!!meta.gearBy.archer.bottes, !!meta.gearBy.guerrier.bottes, /1 objet/.test(document.querySelectorAll('.hgear')[0].querySelector('h3').textContent)]), [true, false, false], 'objet passé à l\'Archer');
  } },
  { name: 'Équiper le meilleur prend aussi la meilleure arme possédée du héros', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.wpn.archer = 'a0'; meta.built.a2 = true; meta.built.g2 = true; saveMeta(); });
    await campView(p, 'equip');
    t.ok(await p.evaluate(() => /Équiper le meilleur · 1/.test($('campFoot').textContent)), 'le bouton compte l\'arme');
    await p.click('#campFoot [data-cact="bestall"]');
    t.eq(await p.evaluate(() => [meta.wpn.archer, meta.wpn.guerrier || 'g0', /Arc long du Corbeau/.test($('toast').textContent)]), ['a2', 'g0', true], 'Arc long du Corbeau équipé, les autres héros inchangés');
    t.ok(await p.evaluate(() => !/Équiper le meilleur/.test($('campFoot').textContent)), 'plus rien de mieux');
  } },
  { name: 'couleurs du héros : 3 couleurs par classe, aperçu, rendu en mission, retour aux couleurs d\'origine', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await campView(p, 'equip');
    t.ok(await p.evaluate(() => !!document.querySelector('#lookSec [aria-pressed="true"][data-arg="' + heroCls + '"]')), 'section ouverte sur le héros joué');
    await p.click('#lookSec [data-cact="lookcls"][data-arg="guerrier"]');
    await p.click('#lookSec [data-cact="look"][data-arg="0|#1f4a6b"]');
    await p.click('#lookSec [data-cact="look"][data-arg="1|#f0cf4a"]');
    await p.click('#lookSec [data-cact="look"][data-arg="2|#0b0b0d"]');
    t.eq(await p.evaluate(() => [meta.look.guerrier, meta.look.archer || null, [...document.querySelectorAll('#lookSec .lsw[aria-checked="true"]')].map((e) => e.dataset.arg)]),
      [['#1f4a6b', '#f0cf4a', '#0b0b0d'], null, ['0|#1f4a6b', '1|#f0cf4a', '2|#0b0b0d']], 'Guerrier modifié, Archer inchangé, choix cochés');
    // aperçu : la cape choisie est peinte au centre du canevas
    t.ok(await p.evaluate(() => { const c = $('lookPrev'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x1f) < 3 && Math.abs(d[i + 1] - 0x4a) < 3 && Math.abs(d[i + 2] - 0x6b) < 3) n++; return n > 500; }), 'aperçu à la couleur de la cape');
    // couleur libre (sélecteur du système)
    await p.evaluate(() => { const i = document.querySelector('#lookSec input[data-look="1"]'); i.value = '#12ab34'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
    t.eq(await p.evaluate(() => [meta.look.guerrier[1], document.querySelectorAll('#lookSec .lsw--free.is-on').length]), ['#12ab34', 1], 'couleur libre gardée');
    // gardé après rechargement, et utilisé pour dessiner le héros en mission
    await p.reload(); await p.evaluate(() => unlockAll());
    t.eq(await p.evaluate(() => meta.look.guerrier), ['#1f4a6b', '#12ab34', '#0b0b0d'], 'couleurs gardées dans la sauvegarde');
    const seen = await p.evaluate(() => { heroCls = 'guerrier'; G.cls = 'guerrier'; const real = ctx, out = new Set();
      ctx = new Proxy(real, { set(o, k, v) { if (k === 'fillStyle' || k === 'strokeStyle') out.add(String(v)); o[k] = v; return true; }, get(o, k) { const v = o[k]; return typeof v === 'function' ? v.bind(o) : v; } });
      try { drawPlayer(G.P); } finally { ctx = real; } return ['#1f4a6b', '#12ab34', '#0b0b0d'].map((c) => out.has(c)); });
    t.eq(seen, [true, true, true], 'le héros est dessiné à ses couleurs');
    await campView(p, 'equip'); await p.click('#lookSec [data-cact="lookcls"][data-arg="guerrier"]');
    await p.click('#lookSec [data-cact="lookreset"]');
    t.eq(await p.evaluate(() => [meta.look.guerrier || null, myLook('guerrier'), $('lookSec').querySelector('[data-cact="lookreset"]').disabled]), [null, ['#5b2a26', '#d9a48a', '#2a1210'], true], 'couleurs d\'origine');
  } },
];
