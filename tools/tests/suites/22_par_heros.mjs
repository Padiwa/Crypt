// v139 : cumul des bonus à la montée de niveau ; emplacements Anneau 2 et Dos par héros ; build de mods propre à chaque familier ;
// cases et alignements des mods déjà propres à chaque héros (et à chaque arme).
import { newPage, campView, startMission } from '../lib.mjs';

// Montre la montée de niveau avec ces bonus seulement (dans cet ordre au hasard).
const lvlWith = (p, keys) => p.evaluate((ks) => { const keep = RUP.filter((u) => ks.includes(u.k)), orig = RUP.slice(); RUP.length = 0; RUP.push(...keep); G.pend = 1; showLevelUp(); RUP.length = 0; RUP.push(...orig);
  return Object.fromEntries([...document.querySelectorAll('#choices .choice')].filter((c) => ks.includes(c.dataset.k)).map((c) => [c.dataset.k, (c.querySelector('.choice__cum') || {}).textContent || null]).sort((x, y) => (x[0] < y[0] ? -1 : 1))); }, keys);

export const tests = [
  { name: 'montée de niveau : chaque bonus montre ce qu\'il donne déjà et ce qu\'il donnera (v139)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p);
    await p.evaluate(() => { G.run.dmg = 2; G.run.multi = 1; G.potions = 1; });
    let r = await lvlWith(p, ['dmg', 'aps', 'multi']);
    t.eq(r, { aps: 'Cumul 0 % → +10 %', dmg: 'Cumul +24 % → +36 %', multi: 'Cumul +1 → +2' }, 'rang 2 → 3, nouveau bonus, projectiles');
    await p.evaluate(() => { $('lvlup').hidden = true; G.pend = 0; G.run.cdr = 1; });
    r = await lvlWith(p, ['fiole', 'cdr', 'regen']);
    t.eq(r, { cdr: 'Cumul −8 % → −16 %', fiole: `Potions 1 → 2 sur ${await p.evaluate(() => potMax())}`, regen: 'Cumul 0 % → +1,5 %' }, 'potions, recharge, régénération');
    // plafond : critique à 72 %, Précision le fait atteindre 75 %
    await p.evaluate(() => { $('lvlup').hidden = true; G.pend = 0; G.run.crit = 0; const st = window.stats; window.stats = (e) => { const s = st(e); s.crit = Math.min(75, 72 + 5 * (G.run.crit || 0)); return s; }; window.__st = st; });
    r = await lvlWith(p, ['crit']);
    await p.evaluate(() => { window.stats = window.__st; });
    t.eq(r.crit, 'Cumul 0 % → +5 % · plafond 75 % atteint', 'plafond signalé');
    t.ok(await p.evaluate(() => [...document.querySelectorAll('#choices .choice')].every((c) => c.classList.contains('has-cum') === !['heal', 'purse'].includes(c.dataset.k))), 'ligne Cumul sur chaque bonus à rangs, pas sur Soin et Bourse');
    await p.waitForTimeout(400); await p.click('#choices .choice[data-k="crit"]');
    t.eq(await p.evaluate(() => G.run.crit), 1, 'le choix s\'applique, le rang testé n\'est pas resté');
  } },
  { name: 'Anneau 2 et Dos : chaque héros débloque les siens ; une ancienne sauvegarde les garde pour tous (v139)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.gold = 20000; meta.hfrag = 60; saveMeta(); });
    await campView(p, 'equip', 'gear:anneau2');
    t.ok(await p.evaluate(() => /pour l'Archer ; chaque héros débloque les siens/.test($('campBody').textContent)), 'texte : emplacement de l\'Archer');
    await p.click('[data-cact="slotopen"][data-arg="anneau2"]');
    t.eq(await p.evaluate(() => [slotOpen('anneau2'), slotOpen('anneau2', 'guerrier'), slotOpen('anneau2', 'magicien'), meta.hfrag]), [true, false, false, 48], 'ouvert pour l\'Archer seulement');
    // le Guerrier : emplacement fermé, à débloquer à son tour
    await p.evaluate(() => { heroCls = 'guerrier'; localStorage.setItem('crypte-cls', 'guerrier'); drawCamp(); });
    await campView(p, 'equip', 'gear:anneau2');
    t.ok(await p.evaluate(() => !!document.querySelector('[data-cact="slotopen"][data-arg="anneau2"]:not([disabled])') && /Emplacements du Guerrier/.test($('campBody').textContent)), 'le Guerrier a son propre déblocage');
    t.eq(await p.evaluate(() => [GEAR_KEYS().includes('anneau2'), tgtKey(curEq(), rgItem('L7', 50)) === 'anneau']), [false, true], 'un anneau va dans le 1er anneau du Guerrier');
    await p.click('[data-cact="slotopen"][data-arg="anneau2"]');
    t.eq(await p.evaluate(() => [slotOpen('anneau2', 'guerrier'), meta.hfrag]), [true, 36], 'puis ouvert pour le Guerrier, même prix');
    // ancienne sauvegarde : {anneau2, dos} communs → ouverts pour chaque héros
    await p.evaluate(() => { meta.slotU = { anneau2: true, dos: true }; saveMeta(); });
    await p.reload();
    t.eq(await p.evaluate(() => Object.keys(CLS).map((c) => GEAR_KEYS(c).length)), [6, 6, 6], 'migration : rien de perdu');
    t.ok(await p.evaluate(() => slotAny('dos') && isUnl('slots')), 'Parcours et déblocages : n\'importe quel héros compte');
  } },
  { name: 'familiers : un build de mods par familier, gardé à la fusion ; ancien build commun recopié (v139)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.pets = [{ uid: 1, t: 'corbeau', rk: 1, lv: 4, xp: 0 }, { uid: 2, t: 'golem', rk: 1, lv: 1, xp: 0 }, { uid: 3, t: 'corbeau', rk: 1, lv: 1, xp: 0 }]; meta.petEq = 1;
      meta.mods.pcrocs = 0; meta.mods.pviv = 0; meta.mods.pcara = 0; meta.pload = { pet: ['pcrocs', null, null, null] }; meta.ppol = { pet: ['b', null, null, null] }; meta.palign = { pet: 1 }; saveMeta(); });
    await p.reload();
    t.eq(await p.evaluate(() => [1, 2, 3].map((u) => (meta.pload[u] || [])[0] + '/' + (meta.ppol[u] || [])[0] + '/' + meta.palign[u]).concat('pet' in meta.pload)), ['pcrocs/b/1', 'pcrocs/b/1', 'pcrocs/b/1', false], 'migration : chaque familier garde le build');
    await campView(p, 'pets');
    t.ok(await p.evaluate(() => /Build du Corbeau de cendre/.test($('campBody').textContent)), 'titre : le build du familier équipé');
    await p.evaluate(() => { petBuild().load[1] = 'pviv'; meta.petEq = 2; petBuild().load.fill(null); petBuild().load[0] = 'pcara'; saveMeta(); drawCamp(); });
    t.eq(await p.evaluate(() => [petBuild().load.slice(0, 2), petStats().pHp > 0, petStats().pDmg]), [['pcara', null], true, 0], 'le golem a son build');
    await p.evaluate(() => { meta.petEq = 1; drawCamp(); });
    t.eq(await p.evaluate(() => [petBuild().load.slice(0, 2), petStats().pDmg > 0 && petStats().pAps > 0]), [['pcrocs', 'pviv'], true], 'le corbeau retrouve le sien');
    // fusion : on fusionne le corbeau 3 (non équipé) ; le 1 (équipé) disparaît, le 3 prend son build et devient équipé
    await p.evaluate(() => { meta.essence = 1000; petAct('fuse', '3'); });
    t.eq(await p.evaluate(() => [meta.petEq, meta.pets.map((x) => x.uid).join(), petBuild().load.slice(0, 2), '1' in meta.pload]), [3, '2,3', ['pcrocs', 'pviv'], false], 'fusion : build de l\'équipé gardé');
    // sans familier : pas de build à remplir
    await p.evaluate(() => { meta.petEq = null; drawCamp(); });
    t.eq(await p.evaluate(() => [!!document.querySelector('#modsCamp .cx-build'), !!document.querySelector('#modsCamp [data-pet="coll"]')]), [false, true], 'sans familier : collection, pas de build');
  } },
  { name: 'mods : cases, polarités et alignements propres à chaque héros ; build d\'arme propre à chaque arme (v139)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'archer'; meta.hslots.archer = 5; build('h').pol[0] = 'b'; meta.align.archer = 2; build('w').pol[1] = 'r';
      const A = [build('h').slots, build('h').pol[0], build('w').pol[1], bAlignCost(build('h'))];
      heroCls = 'guerrier'; const W = [build('h').slots, build('h').pol[0], build('w').pol[1], bAlignCost(build('h')), build('w').key];
      heroCls = 'archer'; return { A, W };
    });
    t.eq(r, { A: [5, 'b', 'r', 800], W: [3, null, null, 200, 'g0'] }, 'Archer et Guerrier indépendants');
  } },
];
