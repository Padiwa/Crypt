// Forge › Affixes et fusion, transfert d'affixe : chercher par affixe, cible d'abord (liste déroulante), source et cible, bouton ⇄.
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
  { name: 'chercher par affixe : tous les objets et armes de l\'affixe, sans « et x autres »', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.stash = [];
      for (let i = 0; i < 14; i++) { const it = genItem(40, 1); it.aff = { crit: 1 + i }; it.slot = 'bottes'; meta.stash.push(it); }
      for (const id of ['a1', 'a2', 'a3', 'g2', 'm2']) meta.built[id] = true; saveMeta();
    });
    await campView(p, 'forge', 'affix');
    await p.click('[data-cact="afopen"][data-arg="crit"]');
    const r = await p.evaluate(() => { const lis = [...document.querySelectorAll('.afind li.open ul li')]; return [lis.length, /autres, plus faibles/.test($('campBody').textContent), lis.filter((li) => /arme/.test(li.textContent)).length]; });
    t.ok(r[0] >= 17 && !r[1], `toute la liste (${r[0]} lignes), pas de « et x autres »`);
    t.ok(r[2] >= 3, `les armes qui portent l\'affixe sont toutes là (${r[2]})`);
  } },
  { name: 'cible d\'abord : liste déroulante des affixes (fusion, ajout), objets qui la portent, fusion puis ajout (v127)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 390 }));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.essence = 5000; meta.stash = [];
      const mk = (r, slot, aff, lock) => { const it = genItem(40, r); Object.assign(it, { r, slot, aff, up: 0, lock: !!lock }); meta.stash.push(it); return it; };
      const T = mk(3, 'bottes', { crit: 4, hp: 120, speed: 5 }), A = mk(2, 'armure', { crit: 6 }), B = mk(1, 'anneau', { crit: 2, dmgPct: 8 }), L = mk(3, 'amulette', { crit: 5, speed: 3 }, true);
      saveMeta(); window.__ids = [T.id, A.id, B.id, L.id];
    });
    const [T, A, B, L] = await p.evaluate(() => __ids);
    await campView(p, 'forge', 'affix');
    t.eq(await p.evaluate(() => xf.pick), 'dst', 'premier choix : la cible');
    await p.click(`#invGrid [data-arg="s:${T}"]`);
    t.eq(await p.evaluate(() => [xf.dst, xf.pick]), ['s:' + T, 'src'], 'cible choisie, la source suit');
    const groups = await p.evaluate(() => [...document.querySelectorAll('#xfAff optgroup')].map((g) => [g.label, [...g.querySelectorAll('option')].map((o) => o.value)]));
    t.eq(groups.map((g) => g[0]), ['Déjà sur la cible · fusion', 'Nouvelle affixe · ajout'], 'deux groupes : fusion et ajout');
    t.ok(groups[0][1].includes('crit') && !groups[0][1].includes('dmgPct') && groups[1][1].includes('dmgPct'), 'critique en fusion, dégâts en ajout');
    await p.selectOption('#xfAff', 'crit');
    const rows = await p.evaluate(() => [...document.querySelectorAll('.xfc')].map((x) => [x.dataset.arg, x.disabled, x.querySelector('.xfc__sub').textContent.split(' · ').pop()]));
    t.eq(rows.filter((r) => r[0][0] === 's'), [['s:' + A, false, 'fusion → +8 %'], ['s:' + B, false, 'fusion → +5 %']], 'les objets qui portent l\'affixe, du plus fort au plus faible, sans l\'objet verrouillé (v133)');
    t.ok(!groups.some((g) => g[1].includes('speed')), 'une affixe portée seulement par un objet verrouillé n\'est pas proposée (v133)');
    await p.click(`.xfc[data-arg="s:${A}"]`);
    t.ok(await p.evaluate(() => /Fusionner/.test($('campFoot').textContent) && /sera détruit/.test($('campFoot').textContent)), 'pied : Fusionner, la source sera détruite');
    await p.click('#campFoot [data-cact="xfok"]');
    t.eq(await p.evaluate((T) => { const it = meta.stash.find((i) => i.id === T); return [it.aff.crit, it.fz.crit, meta.stash.length, xf.dst]; }, T), [8, 1, 3, 's:' + T], 'fusion : 6 + 4 × 0,5 = 8, la source est partie, la cible reste choisie');
    await p.selectOption('#xfAff', 'dmgPct');
    await p.click(`.xfc[data-arg="s:${B}"]`);
    t.ok(await p.evaluate(() => /Transférer/.test($('campFoot').textContent)), 'nouvelle affixe : Transférer');
    await p.click('#campFoot [data-cact="xfok"]');
    t.eq(await p.evaluate((T) => JSON.stringify(meta.stash.find((i) => i.id === T).aff), T), '{"crit":8,"hp":120,"speed":5,"dmgPct":8}', 'ajout : dégâts +8 % sur la cible');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'bouton ⇄ : intervertir source et cible, refusé quand la cible est verrouillée (v128)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 320 }));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.essence = 5000; meta.stash = [];
      const mk = (r, slot, aff, lock) => { const it = genItem(40, r); Object.assign(it, { r, slot, aff, up: 0, lock: !!lock }); meta.stash.push(it); return it; };
      const A = mk(3, 'bottes', { crit: 4, hp: 120 }), B = mk(2, 'armure', { crit: 6, regen: 2 }), L = mk(2, 'gants', { dmgPct: 5 }, true);
      saveMeta(); window.__ids = [A.id, B.id, L.id];
    });
    const [A, B, L] = await p.evaluate(() => __ids);
    await campView(p, 'forge', 'affix');
    t.ok(await p.evaluate(() => document.querySelector('[data-cact="xfswap"]').disabled), 'rien de choisi : ⇄ désactivé');
    await p.click(`#invGrid [data-arg="s:${A}"]`);
    await p.click('[data-cact="xfswap"]');
    t.eq(await p.evaluate(() => [xf.src, xf.dst, xf.pick]), ['s:' + A, '', 'dst'], 'la cible choisie par erreur devient la source');
    await p.click(`#invGrid [data-arg="s:${B}"]`);
    await p.click('[data-cact="xfk"][data-arg="crit"]');
    await p.click('[data-cact="xfswap"]');
    t.eq(await p.evaluate(() => [xf.src, xf.dst, xf.k]), ['s:' + B, 's:' + A, 'crit'], 'les deux rôles échangés, l\'affixe gardée (la nouvelle source la porte)');
    await p.evaluate((L) => { xf = { src: '', k: '', dst: 's:' + L, rep: '', pick: 'src' }; drawCamp(); }, L);
    t.ok(await p.evaluate(() => { const x = document.querySelector('[data-cact="xfswap"]'); return x.disabled && /verrouillée/.test(x.title); }), 'cible verrouillée : ⇄ désactivé, la raison en info-bulle');
    const r = await p.evaluate(() => { const R = document.querySelector('#campBody .cx-roles').getBoundingClientRect(); return [...document.querySelectorAll('#campBody .cx-roles > *')].every((e) => { const q = e.getBoundingClientRect(); return q.left >= R.left - .5 && q.right <= R.right + .5; }); });
    t.ok(r, '320 px : Source, ⇄ et Cible tiennent sur la ligne');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'objets portés dans la grille : ceux du héros d\'abord, ceux des autres marqués ; transfert depuis l\'objet d\'un autre héros, fusion d\'un objet porté (v129)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.gold = 4e6; meta.essence = 5000; meta.stash = [];
      const mk = (slot, aff, name) => { const it = genItem(40, 2); Object.assign(it, { slot, r: 2, aff, name, type: name, up: 0, lock: false }); return it; };
      meta.gearBy.archer.armure = mk('armure', { hp: 90, crit: 3 }, 'Cuirasse');
      meta.gearBy.guerrier.armure = mk('armure', { dmgPct: 12, regen: 2 }, 'Haubert');
      meta.stash.push(mk('armure', { hp: 60 }, 'Cuirasse'), mk('anneau', { crit: 4 }, 'Anneau'));
      saveMeta(); window.__h = meta.gearBy.guerrier.armure.id;
    });
    const H = await p.evaluate(() => __h);
    await campView(p, 'forge', 'affix');
    const cells = await p.evaluate(() => [...document.querySelectorAll('#invGrid .cx-cell')].map((c) => [c.dataset.arg, (c.querySelector('.cwho') || {}).textContent || '']));
    t.eq(cells.at(0), ['g:armure', 'A'], 'l\'armure portée par l\'Archer en tête de la grille');
    t.ok(cells.some((c) => c[0] === 'o:' + H && c[1] === 'G'), 'l\'armure du Guerrier est là, marquée G');
    t.ok(await p.evaluate(() => [...document.querySelectorAll('[data-cact="sfilter"]')].map((x) => x.dataset.arg).join() === 'all,porte,arme,armure,amulette,bottes,anneau'), 'onglets Tout, Portés, Arme, Armure…');
    t.ok(await p.evaluate(() => { const g = document.querySelector('#invGrid'), f = document.querySelector('.afind'); return !!g && !!f && (g.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) > 0; }), 'la grille vient avant « Chercher par affixe »');
    await p.click('#invGrid [data-arg="g:armure"]');
    await p.selectOption('#xfAff', 'dmgPct');
    t.ok(await p.evaluate((H) => /porté par le Guerrier/.test(document.querySelector(`.xfc[data-arg="o:${H}"]`).textContent), H), 'source possible : « porté par le Guerrier »');
    await p.click(`.xfc[data-arg="o:${H}"]`); await p.click('#campFoot [data-cact="xfok"]');
    t.eq(await p.evaluate(() => [meta.gearBy.archer.armure.aff.dmgPct, meta.gearBy.guerrier.armure]), [12, null], 'dégâts +12 % sur l\'armure portée, le Guerrier n\'a plus d\'armure');
    await p.click('[data-cact="fsub"][data-arg="fuse"]');
    await p.click('#invGrid [data-arg="g:armure"]');
    t.ok(await p.evaluate(() => fzc && fzc.a === meta.gearBy.archer.armure.id && !!fzc.b), 'fusion : l\'armure portée choisie comme cible, le double du coffre en source');
    t.eq(p.errs, [], 'aucune erreur');
  } },
];
