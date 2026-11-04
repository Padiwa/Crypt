// Crypte des Cendres — simulateur de progression : la carrière d'un joueur, du premier lancement à la fin du jeu.
// Entre deux missions, le « joueur » passe au Camp et fait ce que le Parcours conseille, avec les vraies fonctions du jeu :
// fusion, fabrication, meilleur équipement, recyclage, Bonus de la Forge, talents, prestige, emplacements, mods, familier, reliques ;
// avec --xf 1, aussi Forge › Affixes (transfert d'affixe depuis le butin vers l'équipement porté, SIM.affixPass).
window.SIM = window.SIM || {};

// Paliers de difficulté dans l'ordre : Normal, Difficile, Cauchemar, Tourment I à X.
SIM.TIERS = [{ d: 0, t: 1, n: 'Normal' }, { d: 1, t: 1, n: 'Difficile' }, { d: 2, t: 1, n: 'Cauchemar' },
  ...Array.from({ length: typeof TORM_TOP === 'number' ? TORM_TOP : 10 }, (_, i) => ({ d: 3, t: i + 1, n: 'Tourment ' + ROM[i] }))]; // v155 : jusqu'au XV
// Niveau à atteindre sur un palier avant de passer au suivant (le niveau est gardé au changement de palier).
SIM.CAP = [20, 20, 25, 30, 30, 30, 30, 30, 35, 35, 40, 45, 50]; // au-delà du Tourment X (v155) : niveau 50, voir capOf
const capOf = (C, t) => C.caps[t] != null ? C.caps[t] : 50;

SIM.newCareer = function (cls, o = {}) {
  heroCls = cls;
  SIM.C = { cls, tier: 0, level: 1, n: 0, hours: 0, fails: 0, log: [], miles: {}, policy: o.policy || 'parcours', caps: o.caps || SIM.CAP, overhead: o.overhead || 45, xf: !!o.xf };
};

const SIMW = () => WPN[heroCls].filter(w => ownedW(w.id));
const SIMscore = (e) => itemScore(e || curEq());

// ---------- Forge › Affixes (option --xf 1) ----------
// Le joueur prend une affixe sur un objet qu'il allait recycler (SIM.recyDrop : objets de monstres Commun à Rare, moins bons que l'équipement
// porté, ni verrouillés ni de relique) ou sur une arme qu'aucun héros ne porte (plus faible que la sienne pour sa classe) et la transfère sur un objet porté (arme comprise), avec les vraies règles du jeu (xfState, xfDo :
// ajout, remplacement par plus fort, fusion de valeurs, remplacement d'une autre affixe quand l'objet est plein).
// Un transfert doit faire monter la Puissance d'au moins SIM.xfMin sans faire baisser la survie ; le joueur y consacre au plus SIM.xfBud
// de son essence par passage au Camp, une fois réservé le prochain rang de chaque mod porté (les mods passent avant), et SIM.xfMax transferts. Pour chaque affixe, seule la source la plus forte est essayée.
SIM.xfMax = 4; SIM.xfMin = .005; SIM.xfBud = .25;
// Build visé (demande de l'auteur) : dégâts critiques, dégâts, chances de critique jusqu'au plafond du jeu (75 %), et dégâts des statuts
// quand les mods du build posent des statuts ; pour l'Archer, projectiles et transpercement ; après une mort, vie, réduction et régénération. Ces affixes passent avant les autres (même pour un gain de Puissance plus petit, sans perte)
// et ne sont jamais remplacées.
SIM.XF_ST_MODS = ['psnCh', 'bldCh', 'burnPct', 'hemo', 'peste', 'soif', 'embr', 'stDur', 'contag', 'cata', 'intSt'];
SIM.xfPref = function () { const P = new Set(['critDmg', 'dmgPct']); if (stats(curEq()).crit < 75) P.add('crit');
  if (heroCls === 'archer') { P.add('multi'); P.add('pierce'); } // Archer : projectiles et transpercement (sur l'arme seulement, règle du jeu)
  if (SIM.C.lastDied) for (const k of ['hp', 'armor', 'regen']) P.add(k); // mort à la mission précédente : la survie d'abord
  const ks = ['w', 'h'].flatMap(t => { try { return build(t).load.filter(Boolean); } catch (e) { return []; } }).map(id => MODS[id] && MODS[id].k);
  if (ks.some(k => SIM.XF_ST_MODS.includes(k))) P.add('dotPct'); return P; };
SIM.recyDrop = function () { const eq = curEq(), cur = SIMscore(eq);
  return meta.stash.filter(it => !it.lock && !it.rid && !it.uq && it.r <= 2 && (() => { const k = tgtKey(eq, it); return !k || SIMscore({ ...eq, [k]: it }) <= cur; })()); };
SIM.affixPass = function (log) {
  if (!SIM.C.xf) return;
  const evalWith = (dst, o) => { // Puissance et survie si le transfert o était fait (essai sur une copie, rien n'est gardé)
    const st = xfState(o), v = st.nv;
    if (dst[0] === 'w') { const wid = dst.slice(2), old = meta.waff[wid], cp = { ...(old || {}) }; if (st.mode === 'rep') cp[o.rep] = null; cp[o.k] = v; meta.waff[wid] = cp;
      try { return eqVal(curEq()); } finally { if (old === undefined) delete meta.waff[wid]; else meta.waff[wid] = old; } }
    const sl = dst.slice(2), d = meta.gear[sl], c = { ...d, aff: { ...d.aff } }; if (st.mode === 'rep') delete c.aff[o.rep]; c.aff[o.k] = v;
    return eqVal({ ...curEq(), [sl]: c });
  };
  // L'essence va d'abord aux mods (comme SIM.mods) : on réserve le prochain rang de chaque mod porté de l'arme et du héros qui n'est pas au maximum.
  const wornM = ['w', 'h'].flatMap(t => { try { return build(t, heroCls).load.filter(Boolean); } catch (e) { return []; } });
  const reserve = wornM.reduce((a, id) => a + (MODS[id] && meta.mods[id] < MODS[id].max ? fuseCost(id, meta.mods[id]) + 30 : 0), 0);
  let bud = Math.min(meta.essence * SIM.xfBud, meta.essence - reserve); if (bud <= 0) return;
  for (let n = 0; n < SIM.xfMax; n++) {
    const b = eqVal(curEq()), bestSrc = {};
    // sources : les objets à recycler, et les armes qu'aucun héros ne porte (ni de départ, ni verrouillées ; de sa classe, seulement plus faibles que la sienne)
    const cur = SIMscore(curEq()), worn = new Set(Object.keys(CLS).map(c => curWid(c)));
    const wSrc = Object.keys(CLS).flatMap(c => WPN[c].filter(w => ownedW(w.id) && !worn.has(w.id) && !w.start).map(w => weaponItem(c, w.id))).filter(it => !it.lock && xfSrcOk('w:' + it.wid) && (it.cls !== heroCls || SIMscore({ ...curEq(), arme: it }) < cur));
    const srcs = [...SIM.recyDrop().map(s => ['s:' + s.id, s]), ...wSrc.map(w => ['w:' + w.wid, w])];
    for (const [key, s] of srcs) for (const k in s.aff) { if (!AFF[k] || AFF[k].aby) continue; const ve = NOSCALE[k] ? s.aff[k] : s.aff[k] * upMul(s.up); if (!bestSrc[k] || ve > bestSrc[k].ve) bestSrc[k] = { s, ve, key }; }
    const dsts = [...GEAR_KEYS().filter(k => meta.gear[k]).map(k => 'g:' + k), 'w:' + curWid()];
    let best = null; const pref = SIM.xfPref();
    for (const dst of dsts) { const d = xfGet(dst); if (!d) continue; const full = Object.keys(d.aff).length >= xfCap(d);
      for (const k in bestSrc) { const src = bestSrc[k].key; if (src === dst) continue;
        const opts = d.aff[k] != null ? [{ op: 'up' }, { op: 'fuse' }] : !full ? [{}] : Object.keys(d.aff).filter(r => AFF[r] && !AFF[r].aby).filter(r => !pref.has(r)).map(rep => ({ rep }));
        for (const x of opts) { const o = { src, k, dst, rep: x.rep || '', op: x.op }; const st = xfState(o); if (!st || !st.ok) continue;
          const cost = st.cost || xfCost(bestSrc[k].s); if (cost > bud || cost > meta.essence) continue;
          const v = evalWith(dst, o), g = b.p ? v.p / b.p - 1 : 0, t = pref.has(k) ? 1 : 0; if (g < (t ? 0 : SIM.xfMin) || (t && g <= 0 && v.v <= b.v) || v.v < b.v - 1e-9) continue;
          if (!best || t > best.t || (t === best.t && g > best.g)) best = { o, g, t, cost, mode: st.mode }; } } }
    if (!best) break;
    const e0 = meta.essence; xf = { ...best.o }; xfDo(); xf = { src: '', k: '', dst: '', rep: '' };
    if (meta.essence === e0) break; // refusé par le jeu
    bud -= e0 - meta.essence; log.push('xf ' + best.o.k + ' ' + best.o.dst + ' ' + best.mode + (best.o.rep ? ' -' + best.o.rep : '') + ' +' + (best.g * 100).toFixed(1) + ' %'); SIM.mile('xf');
  }
};

// ---------- Camp : ce que fait le joueur entre deux missions ----------
SIM.camp = function () {
  const C = SIM.C, log = [];
  // le joueur n'utilise que ce que le Camp a débloqué (js/unlock.js)
  unlockCheck(true); const U = (k) => typeof isUnl !== 'function' || isUnl(k);
  // Familier : faire éclore, fusionner les doubles, équiper le plus fort
  if (U('pets')) while (meta.eggs > 0) petAct('hatch');
  for (let g = 0; g < 20; g++) { const p = meta.pets.find(x => x.rk < PET_RK && meta.essence >= PET_FUSE(x.rk) && meta.pets.some(y => y !== x && y.t === x.t && y.rk === x.rk)); if (!p) break; petAct('fuse', p.uid); }
  if (meta.pets.length) { const pref = ['follet', 'corbeau', 'golem', 'furet']; const b = [...meta.pets].sort((a, c) => (c.rk * 100 + c.lv) - (a.rk * 100 + a.lv) || pref.indexOf(a.t) - pref.indexOf(c.t))[0]; meta.petEq = b.uid; }
  // Bonus de la Forge d'abord (conseil du Parcours), dans la limite de l'or
  if (U('bonus')) { const ord = ['str', 'vig', 'cel', 'alc', 'luc', 'for', 'cat', 'rea']; for (let g = 0; g < 60; g++) { const c = UPG.filter(u => lv(u.k) < u.max).sort((a, b) => upCost(a) - upCost(b) || ord.indexOf(a.k) - ord.indexOf(b.k))[0]; if (!c || meta.gold < upCost(c)) break; meta.gold -= upCost(c); meta.up[c.k] = lv(c.k) + 1; } }
  // Fabrication de tout ce qui est prêt, le plus rare d'abord (armes de sa classe et objets ; pas les armes des autres classes), puis fusion des doubles.
  // La fabrication passe avant la fusion : depuis que la fusion coûte de l'or (v106), « Tout fusionner » d'abord ne laissait plus de quoi fabriquer.
  for (let g = 0; g < 40 && U('craft'); g++) {
    const id = craftIds().filter(id => { const b = bpdef(id), pc = meta.parts[id]; return pc && pc.every(x => x > 0) && meta.gold >= b.craft && (b.kind !== 'arme' || b.cls === heroCls); }).sort((a, b) => bpdef(b).r - bpdef(a).r)[0];
    if (!id) break; const r = craftOne(id); if (!r) break; log.push('craft ' + id);
    SIM.mile('craft' + bpdef(id).r);
  }
  // Avant « Tout fusionner », qui dépense tout l'or : emplacements à débloquer, talents, et le prestige avec la moitié de l'or au plus.
  for (const u of SLOT_U) if (U('slots') && !slotOpen(u.k) && (!u.need || slotOpen(u.need)) && (meta.hfrag | 0) >= u.hf && meta.gold >= u.gold) { meta.hfrag -= u.hf; meta.gold -= u.gold; (meta.slotU[heroCls] || (meta.slotU[heroCls] = {}))[u.k] = true; meta.gear[u.k] = null; SIM.mile('slot_' + u.k); }
  if (U('bonus')) for (const t of TAL[heroCls]) if (!meta.tal[t.k] && meta.gold >= t.cost + 200) { meta.gold -= t.cost; meta.tal[t.k] = true; }
  { let bud = meta.gold * .5; for (let g = 0; g < 50; g++) { const o = prOf(), c = prCost(o.lv); if (!(prOpen() || o.lv) || bud < c.gold || meta.essence < c.ess + 50) break; bud -= c.gold; meta.gold -= c.gold; meta.essence -= c.ess; o.lv++; } }
  if (U('fuse')) fuseAll();
  // Arme : la meilleure possédée
  { const base = curEq(); let best = curWid(), bs = -1; for (const w of SIMW()) { const s = SIMscore({ ...base, arme: weaponItem(heroCls, w.id) }); if (s > bs) { bs = s; best = w.id; } } meta.wpn[heroCls] = best; }
  // Équiper le meilleur
  { const plan = bestPlan(curEq(), meta.stash); for (const sl in plan) { const it = plan[sl]; meta.stash = meta.stash.filter(i => i !== it); const old = meta.gear[sl]; if (old) meta.stash.push(old); meta.gear[sl] = it; } }
  if (U('fuse')) fuseAll();
  if (U('affix')) SIM.affixPass(log);
  // Recyclage : les objets de monstres (Commun à Rare) moins bons que l'équipement porté et sans double à fusionner ; on garde les objets des reliques
  if (U('recy')) {
    const eq = curEq(), cur = SIMscore(eq), keys = {};
    for (const it of [...meta.stash, ...Object.values(meta.gear).filter(Boolean)]) { const k = mKey(it) + '#' + (it.up | 0); keys[k] = (keys[k] || 0) + 1; }
    const drop = meta.stash.filter(it => !it.lock && !it.rid && it.r <= 2 && (() => { const k = tgtKey(eq, it); return !k || SIMscore({ ...eq, [k]: it }) <= cur; })());
    const keepDup = new Set(); // un exemplaire de chaque modèle à double possible reste pour la fusion, si pas trop vieux
    let e = 0; for (const it of drop) { e += recyEss(it); } meta.stash = meta.stash.filter(it => !drop.includes(it)); meta.essence += e;
    // armes de la classe moins bonnes que la meilleure, sans rang : on les garde (doubles futurs) — rien à faire
  }
  // Or : talents, Bonus de la Forge (le moins cher d'abord, dans l'ordre du Parcours), prestige
  if (U('bonus')) for (const t of TAL[heroCls]) if (!meta.tal[t.k] && meta.gold >= t.cost + 200) { meta.gold -= t.cost; meta.tal[t.k] = true; }
  const ord = ['str', 'vig', 'cel', 'alc', 'luc', 'for', 'cat', 'rea'];
  for (let g = 0; g < 60 && U('bonus'); g++) { const c = UPG.filter(u => lv(u.k) < u.max).sort((a, b) => upCost(a) - upCost(b) || ord.indexOf(a.k) - ord.indexOf(b.k))[0]; if (!c || meta.gold < upCost(c)) break; meta.gold -= upCost(c); meta.up[c.k] = lv(c.k) + 1; }
  if (prOpen()) SIM.mile('forge_max');
  for (let g = 0; g < 50; g++) { const o = prOf(), c = prCost(o.lv); if (!(prOpen() || o.lv) || meta.gold < c.gold || meta.essence < c.ess + 50) break; meta.gold -= c.gold; meta.essence -= c.ess; o.lv++; }
  { const o = prOf(), plan = ['dmg', 'hp', 'dmg', 'aps', 'hp', 'crit', 'cdmg', 'armor']; let i = 0; while (prFree() > 0 && i < 400) { const q = PREST.find(x => x.k === plan[i % plan.length]); if (!(q.max && prPt(q.k) >= q.max)) o.pts[q.k] = prPt(q.k) + 1; i++; } }
  // Mods : rangs avec l'essence (ceux portés d'abord), puis builds refaits au mieux
  if (U('mods')) SIM.mods();
  // Reliques : tout équiper, la plus rare d'abord
  if (U('relics')) { const q = []; const ids = Object.keys(meta.relics).sort((a, b) => RELICS[b].t - RELICS[a].t); for (const id of ids) { const a = meta.relics[id]; for (let i = 0; i < (a[1] | 0); i++) q.push({ id, rad: true }); for (let i = 0; i < (a[0] | 0); i++) q.push({ id, rad: false }); } meta.relicQ = q.slice(0, 300); }
  saveMeta();
  return log;
};

// Mods : monte les rangs des mods portés (puis des autres), puis refait les builds.
// v141 : build d'arme rempli au mieux de la Puissance (le mod qui la fait le plus monter, case après case, dans la capacité) ;
// v142 : build de héros rempli de même, au mieux de Puissance × racine de la survie (les mods de défense passent par les capacités) ; v143 : familier aussi.
SIM.MODPREF = ['venin', 'entaille', 'braise', 'givre', 'orage', 'oeil', 'boucherie', 'rafale', 'virulence', 'contagion', 'coup', 'entrave', 'peste', 'embrasement', 'hemorragie', 'cryogenie', 'surtension', 'catalyse', 'diamant', 'deflagration', 'soif',
  'etendue', 'intensite', 'flux', 'persist', 'impregnation', 'commotion', 'garde', 'fantome', 'elan', 'peau', 'paselem', 'riposte', 'alchimiste', 'econome', 'elixfer', 'elixrage', 'ame', 'prolong', 'remanence', 'fleau',
  'pcrocs', 'pviv', 'pcara', 'plien', 'pbec', 'pnuee', 'plum', 'ppur', 'pprov', 'pepine', 'pflair', 'ppoche', 'ppartage', 'pecho', 'pinst', 'pmarque', 'pseisme', 'pflamme'];
SIM.fillW = function (own, kind = 'w') {
  const b = build(kind, heroCls); b.load.fill(null);
  if (kind === 'p' && !petEq()) return;
  const pw = kind === 'w' ? () => power(stats(curEq())) : () => { const x = stats(curEq()); return power(x) * Math.sqrt(survOf(x)); };
  for (let g = 0; g < b.slots; g++) {
    const base = pw(); let best = null, bv = base * (1 + 1e-4);
    for (const id of own) { if (modKind(id) !== kind || b.load.includes(id)) continue; const bs = bBest(b, id, meta.mods[id]); if (bs.i < 0 || bUsed(b) + bs.d > bCap(b)) continue;
      b.load[bs.i] = id; const v = pw(); b.load[bs.i] = null; if (v > bv) { bv = v; best = [bs.i, id]; } }
    if (!best) break; b.load[best[0]] = best[1];
  }
};
SIM.mods = function () {
  const own = SIM.MODPREF.filter(id => MODS[id] && meta.mods[id] != null && modOk(id, heroCls));
  // v143 : l'essence va d'abord aux mods de l'arme et du héros, comme en v142 (portés puis les autres) ; les mods du familier équipé
  // ne montent de rang qu'une fois ceux de l'arme et du héros au maximum, et n'ont des étoiles qu'au-delà de 2 000 essence (sinon ils prenaient l'essence des mods d'arme)
  const pet = () => petEq() ? build('p').load.filter(Boolean) : [];
  const worn = () => { const L = [...build('w', heroCls).load, ...build('h', heroCls).load].filter(Boolean); return [...L, ...own.filter(id => !L.includes(id) && modKind(id) !== 'p'), ...(L.every(id => meta.mods[id] >= MODS[id].max) ? pet() : [])]; };
  for (let g = 0; g < 30; g++) { const id = worn().find(id => meta.mods[id] < MODS[id].max && meta.essence >= fuseCost(id, meta.mods[id]) + 30); if (!id) break; meta.essence -= fuseCost(id, meta.mods[id]); meta.mods[id]++; }
  for (const id of own) { const m = MODS[id], st = modSt(id), c = starCost(id, st); if (modKind(id) === 'p' && (!pet().includes(id) || meta.essence < 2000)) continue;
    if (modCanStar(id) && meta.mods[id] >= m.max && st < MOD_ST_MAX && (meta.modCp[id] | 0) >= c.cp && meta.essence >= c.ess + 30) { meta.modCp[id] -= c.cp; meta.essence -= c.ess; meta.modSt[id] = st + 1; } }
  SIM.fillW(own);
  const au = ['terreur', 'presence', 'cupidite'].find(a => MODS[a] && meta.mods[a] != null); if (au) meta.aura[heroCls] = au;
  if (typeof isUnl !== 'function' || isUnl('hmods')) SIM.fillW(own, 'h');
  // v143 : build du familier équipé, au mieux de Puissance × racine de la survie (soin du follet, attirance du golem comptés)
  if (typeof isUnl !== 'function' || isUnl('pets')) SIM.fillW(own, 'p');
};

SIM.mile = function (k) { const C = SIM.C; if (C.miles[k]) return; C.miles[k] = { n: C.n, h: Math.round(C.hours * 100) / 100 }; };

// Jalons constatés après chaque mission.
SIM.checkMiles = function (R) {
  const C = SIM.C; C.lastDied = !!R.died;
  if (!R.died) { SIM.mile('win'); const T = SIM.TIERS[C.tier]; SIM.mile('win_' + T.n); }
  if (['armure', 'amulette', 'bottes', 'anneau'].every(k => meta.gear[k])) SIM.mile('slots4');
  for (const L of [5, 10, 20, 30, 40, 50]) if (maxL() >= L) SIM.mile('L' + L);
  if (anyRank()) SIM.mile('rank2');
  for (let r = 3; r <= 6; r++) if (ownedRar(r)) SIM.mile('own' + r);
  if (meta.relOpened > 0) SIM.mile('relic1');
};

// Choix du prochain palier et niveau (politique « Parcours ») : on monte d'un niveau après une sortie réussie d'au moins
// deux manches ; au plafond du palier, on passe au palier suivant. Une mort fait redescendre de 3 niveaux ; deux morts
// de suite font redescendre d'un palier en gardant le niveau (le niveau compte pour la rareté des reliques).
SIM.next = function (R) {
  const C = SIM.C;
  if (R.died) { C.fails++; if (C.fails >= 2 && C.tier > 0) { C.tier--; C.fails = 0; } else C.level = Math.max(1, C.level - 3); return; }
  C.fails = 0;
  if (R.rounds >= 2) {
    const nt = SIM.TIERS[C.tier + 1], open = (t) => typeof diffOk !== 'function' || (t.d < 3 ? diffOk(t.d) : diffOk(3) && t.t <= tormMax());
    if (C.level >= capOf(C, C.tier) && C.tier < SIM.TIERS.length - 1 && (unlockCheck(true), open(nt))) C.tier++;
    else C.level = Math.min(LV_MAX, C.level + 1);
  }
};

// Joue une mission puis passe au Camp. Renvoie la ligne de journal.
SIM.step = function () {
  const C = SIM.C, T = SIM.TIERS[C.tier];
  const R = SIM.mission({ level: C.level, diff: T.d, torm: T.t, maxRounds: 3 });
  C.n++; C.hours += (R.t + C.overhead) / 3600;
  SIM.checkMiles(R);
  const lg = SIM.camp();
  const eq = curEq(), St = stats(eq);
  const row = { n: C.n, h: Math.round(C.hours * 1000) / 1000, tier: C.tier, tn: T.n, L: R.level, endL: R.endLevel, died: R.died ? 1 : 0, rounds: R.rounds, t: R.t, kills: R.kills, boss: R.boss, elite: R.elite,
    gold: R.gold, ess: R.ess, hf: R.hf, relics: R.relics, opened: R.opened, items: R.items, wpn: R.wpn,
    dps0: R.dps, hp0: R.hp, score: Math.round(SIMscore(eq)), dps: Math.round(dps(St)), hp: Math.round(St.hp),
    bank: { gold: meta.gold | 0, ess: meta.essence | 0, hfrag: meta.hfrag | 0, maxL: maxL(), relStock: Object.fromEntries(Object.entries(meta.relics).map(([k, a]) => [k, (a[0] | 0) + (a[1] | 0)])), frags: fragTotal(), stash: meta.stash.length, keyF: (meta.keyF && meta.keyF.crypte) | 0, keys: (meta.keys && meta.keys.crypte) | 0 },
    gear: Object.fromEntries(Object.entries(eq).map(([k, it]) => [k, it ? [it.r, it.up | 0, it.lvl | 0] : null])),
    up: Object.values(meta.up).reduce((a, b) => a + (b | 0), 0), prest: prOf().lv, pet: petEq() ? [petEq().t, petEq().rk, petEq().lv] : null,
    mods: allMods(heroCls).length, crafted: lg.filter(x => x.startsWith('craft')).length, xf: lg.filter(x => x.startsWith('xf')).length, xfl: lg.filter(x => x.startsWith('xf')), ms: R.ms };
  SIM.next(R);
  C.log.push(row);
  return row;
};

SIM.state = function () { return { meta: JSON.parse(JSON.stringify(meta)), C: { ...SIM.C, log: [] }, uid }; };
SIM.restore = function (s) { meta = Object.assign(meta, s.meta); SIM.C = { ...s.C, log: [] }; uid = s.uid; heroCls = s.C.cls; saveMeta(); };
