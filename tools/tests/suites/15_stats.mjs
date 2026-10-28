// Statistiques (v123) : critiques des ultimes, vol de vie réservé au Guerrier, affixes sans effet signalées, durée des ralentissements.
import { newPage, startMission, campView } from '../lib.mjs';

// En mission, boucle de jeu arrêtée : un ennemi immortel à côté du héros, les coups reçus par dmgEnemy notés dans window.__hits.
async function bench(p) {
  await p.evaluate(() => {
    paused = true; G.en = [];
    spawnEnemy({ type: 'ghoul', x: G.P.x + 40, y: G.P.y }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e12;
    window.__e = e; window.__hits = [];
    const f = dmgEnemy; window.dmgEnemy = (en, d, crit, dot) => { if (en === e) __hits.push([d, !!crit]); return f(en, d, crit, dot); };
  });
}

export const tests = [
  { name: 'ultimes : les critiques de la Pluie d\'acier et des météores font leurs dégâts critiques', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { cls: 'archer' });
    await bench(p);
    const r = await p.evaluate(() => {
      const P = G.P, m = 1 + (S.ultPct || 0) / 100, out = {};
      S.critDmg = 300;
      // Pluie d'acier : une salve, critique sûr puis critique impossible
      S.crit = 100; __hits = []; P.rain = 3; P.rainT = 0; ultTick(.01); out.rainCrit = __hits[0];
      S.crit = 0; __hits = []; P.rainT = 0; ultTick(.01); out.rainNo = __hits[0]; P.rain = 0;
      // Météores : un météore sur l'ennemi
      S.crit = 100; __hits = []; P.meteors = 1; P.meteorT = 0; ultTick(.01); out.metCrit = __hits[0];
      out.rainBase = S.nova * .7 * m; out.metBase = S.nova * 3 * m;
      return out;
    });
    t.ok(r.rainCrit && r.rainCrit[1] && Math.abs(r.rainCrit[0] - r.rainBase * 3) < 1e-6, `flèche critique ×3 (${r.rainCrit && r.rainCrit[0]} pour ${r.rainBase * 3})`);
    t.ok(r.rainNo && !r.rainNo[1] && Math.abs(r.rainNo[0] - r.rainBase) < 1e-6, 'flèche sans critique : dégâts normaux');
    t.ok(r.metCrit && r.metCrit[1] && Math.abs(r.metCrit[0] - r.metBase * 3) < 1e-6, 'météore critique ×3');
  } },
  { name: 'vol de vie : ne tombe que pour le Guerrier, remplacé sur les objets des reliques, ignoré dans les statistiques', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const roll = (c) => { heroCls = c; let n = 0; for (let i = 0; i < 600; i++) if ('leech' in genItem(60, 2).aff) n++; return n; };
      const out = { archer: roll('archer'), magicien: roll('magicien'), guerrier: roll('guerrier') };
      // objets des reliques qui portent le vol de vie : remplacé pour l'Archer et le Magicien, gardé pour le Guerrier
      const ids = Object.keys(RGEAR).filter((id) => RGEAR[id].aff.includes('leech'));
      out.ids = ids.length;
      out.rg = {};
      for (const c of ['archer', 'magicien', 'guerrier']) { heroCls = c; out.rg[c] = ids.map((id) => { const it = rgItem(id, 50); return ['leech' in it.aff, Object.keys(it.aff).length - (RGEAR[id].pw ? 1 : 0) === RGEAR[id].aff.length]; }); }
      heroCls = 'archer'; const s2 = rgItem('S2', 50); out.sub = rgAff(RGEAR.S2).filter((k) => !RGEAR.S2.aff.includes(k));
      // statistiques : un anneau à vol de vie porté par l'Archer ne compte pas, par le Guerrier si
      heroCls = 'guerrier'; const ring = rgItem('L7', 50); out.ringLeech = ring.aff.leech;
      out.sG = stats({ anneau: ring }).leech; heroCls = 'archer'; out.sA = stats({ anneau: ring }).leech;
      out.bow = 'leech' in wdef('a11').aff;
      return out;
    });
    t.eq([r.archer, r.magicien], [0, 0], 'aucun vol de vie sur 600 objets d\'Archer ou de Magicien');
    t.ok(r.guerrier > 0, `le Guerrier en trouve (${r.guerrier} sur 600)`);
    t.ok(r.ids >= 5, `${r.ids} objets des reliques ont le vol de vie`);
    t.ok(r.rg.archer.every(([l, n]) => !l && n) && r.rg.magicien.every(([l, n]) => !l && n), 'Archer et Magicien : remplacé, même nombre d\'affixes');
    t.ok(r.rg.guerrier.every(([l]) => l), 'Guerrier : gardé');
    t.eq(r.sub.length, 1, 'une affixe de remplacement sur la Cuirasse de la Veuve rouge');
    t.ok(r.ringLeech > 0 && r.sG > 0 && r.sA === 0, `vol de vie compté pour le Guerrier (${r.sG}), pas pour l'Archer (${r.sA})`);
    t.eq(r.bow, false, 'l\'Arc de la Veuve rouge n\'a plus de vol de vie');
  } },
  { name: 'fiche : une affixe d\'une autre classe est barrée et marquée « sans effet »', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'guerrier'; const it = rgItem('S2', 50); heroCls = 'archer'; meta.stash = [it]; meta.gear.armure = null; saveMeta(); window.__id = it.id; });
    await campView(p, 'arsenal', 'coffre');
    // fiche d'un objet du coffre : comparaison paginée (4 affixes par page), le vol de vie est la 5e
    await p.evaluate(() => { campSel = { stash: __id }; cmpPage = 0; drawCamp(); });
    const offRows = () => p.evaluate(() => [...$('campDock').querySelectorAll('.cx-cmp__row.is-off .k')].map((k) => [k.textContent, k.dataset.off, getComputedStyle(k, '::after').content]));
    let rows = await offRows();
    if (!rows.length) { await p.click('#campDock [data-cmp="1"]'); rows = await offRows(); }
    t.eq(rows, [['Vol de vie', 'Guerrier seulement', '"sans effet · Guerrier seulement"']], 'comparaison : ligne grisée « sans effet · Guerrier seulement »');
    t.ok(await p.evaluate(() => !/perte/.test($('campDock').textContent)), 'une affixe sans effet ne compte pas comme une perte');
    // objet porté : la liste des affixes le montre barré
    await p.evaluate(() => { meta.gear.armure = meta.stash.pop(); saveMeta(); campTab = 'equip'; campSel = { slot: 'armure' }; drawCamp(); });
    const li = await p.evaluate(() => { const l = [...document.querySelectorAll('#campDock li.affoff')]; return l.map((x) => [/rendus en vie/.test(x.querySelector('s').textContent), x.querySelector('.affoff__tag').textContent]); });
    t.eq(li, [[true, 'sans effet · Guerrier seulement']], 'objet porté : vol de vie barré');
    // le Guerrier voit la même affixe normalement
    await p.evaluate(() => { heroCls = 'guerrier'; meta.gear.armure = meta.gearBy.archer.armure; drawCamp(); });
    t.eq(await p.evaluate(() => document.querySelectorAll('#campDock li.affoff,#campDock .cx-cmp__row.is-off').length), 0, 'rien de barré pour le Guerrier');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'durée des compétences : allonge tous les ralentissements, sans raccourcir un plus long', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { cls: 'magicien' });
    await bench(p);
    const r = await p.evaluate(() => {
      const e = __e, out = {};
      S.skillDur = 50; S.chill = 100; S.frz = 0; S.shock = 0;
      e.slow = 0; onHit(e, 1); out.chill = e.slow;                       // 2 s × 1,5
      e.slow = 10; onHit(e, 1); out.keep = e.slow;                       // un ralentissement plus long est gardé
      e.slow = 0; explode({ x: e.x, y: e.y, d: 1 }, null, true); out.frost = e.slow; // explosion glacée 2,5 s × 1,5
      S.skillDur = 0; e.slow = 0; onHit(e, 1); out.base = e.slow;
      return out;
    });
    t.eq(r, { chill: 3, keep: 10, frost: 3.75, base: 2 }, 'ralentissement à l\'impact et explosion glacée allongés de 50 %');
  } },
  { name: 'Puissance (v137) : critiques, dégâts de compétence, portées, recharge et ultime comptent, chacun pour son héros', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const ring = (aff) => ({ id: 9e6, slot: 'anneau', r: 0, lvl: 1, base: { k: 'dmgPct', v: 0 }, aff }), gain = (c, aff) => { heroCls = c; const e = curEq(); return power(stats({ ...e, anneau: ring(aff) })) / power(stats(e)) - 1; };
      return { crit: gain('archer', { crit: 10 }), critDmg: gain('archer', { crit: 20, critDmg: 50 }) > gain('archer', { crit: 20 }), nova: gain('magicien', { novaPct: 30 }), skillRad: gain('magicien', { skillRad: 30 }),
        reach: gain('guerrier', { reach: 30 }), splash: gain('magicien', { splash: 30 }), cdr: gain('magicien', { cdr: 10 }), ult: gain('archer', { ultPct: 20 }), fury: gain('archer', { fury: 10 }),
        aps: gain('archer', { apsPct: 20 }), hp: gain('archer', { hp: 500 }), reachArcher: gain('archer', { reach: 30 }),
        parts: (() => { heroCls = 'magicien'; const W = powerOf(stats(curEq())); return Math.abs(W.atk + W.skill + W.ult + W.pulse + W.pet - W.p) < 1e-6 && W.atk > 0 && W.skill > 0 && W.ult > 0; })() };
    });
    for (const k of ['crit', 'nova', 'skillRad', 'reach', 'splash', 'cdr', 'ult', 'fury', 'aps']) t.ok(r[k] > 0, `${k} augmente la Puissance (${(r[k] * 100).toFixed(1)} %)`);
    t.ok(r.critDmg, 'les dégâts critiques comptent');
    t.eq([r.hp, r.reachArcher], [0, 0], 'la vie ne compte pas dans la Puissance ; la portée de frappe ne compte pas pour l\'Archer');
    t.ok(r.parts, 'Puissance = attaques + sort + ultime (+ familier)');
  } },
  { name: 'Équiper le meilleur (v137) : l\'objet qui augmente la Puissance, la survie seulement pour départager ; la fiche affiche la même Puissance', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'archer'; meta.gear.armure = null; const mk = (id, aff, hp) => ({ id, slot: 'armure', r: 1, lvl: 50, base: { k: 'hp', v: hp }, aff });
      const tank = mk(9001, { hp: 900, armor: 7 }, 400), dmg = mk(9002, { dmgPct: 15 }, 100), tank2 = mk(9003, { hp: 300 }, 300);
      meta.stash = [tank, dmg, tank2]; saveMeta();
      const plan = bestPlan(curEq(), meta.stash, false), first = plan.armure && plan.armure.id;
      meta.stash = [tank, tank2]; const plan2 = bestPlan(curEq(), meta.stash, false), second = plan2.armure && plan2.armure.id;
      meta.stash = [tank, dmg, tank2]; return { first, second, upDmg: better(dmg), upTank: better(tank) };
    });
    t.eq(r, { first: 9002, second: 9001, upDmg: true, upTank: true }, 'dégâts d\'abord ; entre deux armures sans dégâts, la plus solide');
    await campView(p, 'equip');
    const k = await p.evaluate(() => { const shown = +[...document.querySelectorAll('.cx-keystats div')].find((d) => /Puissance/.test(d.textContent)).querySelector('b').textContent.replace(/\s/g, ''); return [shown, Math.round(power(stats(curEq())))]; });
    t.eq(k[0], k[1], 'fiche du héros : Puissance');
    await p.click('[data-cact="bestall"]');
    t.eq(await p.evaluate(() => meta.gear.armure && meta.gear.armure.id), 9002, 'le bouton équipe l\'armure de dégâts');
    t.eq(p.errs, [], 'aucune erreur');
  } },
];
