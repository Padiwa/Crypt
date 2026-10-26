// Crypte des Cendres — simulateur de progression : la carrière d'un joueur, du premier lancement à la fin du jeu.
// Entre deux missions, le « joueur » passe au Camp et fait ce que le Parcours conseille, avec les vraies fonctions du jeu :
// fusion, fabrication, meilleur équipement, recyclage, Bonus de la Forge, talents, prestige, emplacements, mods, familier, reliques.
window.SIM = window.SIM || {};

// Paliers de difficulté dans l'ordre : Normal, Difficile, Cauchemar, Tourment I à X.
SIM.TIERS = [{ d: 0, t: 1, n: 'Normal' }, { d: 1, t: 1, n: 'Difficile' }, { d: 2, t: 1, n: 'Cauchemar' },
  ...Array.from({ length: 10 }, (_, i) => ({ d: 3, t: i + 1, n: 'Tourment ' + ROM[i] }))];
// Niveau à atteindre sur un palier avant de passer au suivant (le niveau est gardé au changement de palier).
SIM.CAP = [20, 20, 25, 30, 30, 30, 30, 30, 35, 35, 40, 45, 50];

SIM.newCareer = function (cls, o = {}) {
  heroCls = cls;
  SIM.C = { cls, tier: 0, level: 1, n: 0, hours: 0, fails: 0, log: [], miles: {}, policy: o.policy || 'parcours', caps: o.caps || SIM.CAP, overhead: o.overhead || 45 };
};

const SIMW = () => WPN[heroCls].filter(w => ownedW(w.id));
const SIMscore = (e) => itemScore(e || curEq());

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
  // Fusion des doubles, puis fabrication de tout ce qui est prêt (armes de sa classe et objets ; pas les armes des autres classes)
  if (U('fuse')) fuseAll();
  for (let g = 0; g < 40 && U('craft'); g++) {
    const id = craftIds().find(id => { const b = bpdef(id), pc = meta.parts[id]; return pc && pc.every(x => x > 0) && meta.gold >= b.craft && (b.kind !== 'arme' || b.cls === heroCls); });
    if (!id) break; const r = craftOne(id); if (!r) break; log.push('craft ' + id);
    SIM.mile('craft' + bpdef(id).r);
  }
  if (U('fuse')) fuseAll();
  // Arme : la meilleure possédée
  { const base = curEq(); let best = curWid(), bs = -1; for (const w of SIMW()) { const s = SIMscore({ ...base, arme: weaponItem(heroCls, w.id) }); if (s > bs) { bs = s; best = w.id; } } meta.wpn[heroCls] = best; }
  // Emplacements : débloquer dès que possible
  for (const u of SLOT_U) if (U('slots') && !slotOpen(u.k) && (!u.need || slotOpen(u.need)) && (meta.hfrag | 0) >= u.hf && meta.gold >= u.gold) { meta.hfrag -= u.hf; meta.gold -= u.gold; meta.slotU[u.k] = true; meta.gear[u.k] = null; SIM.mile('slot_' + u.k); }
  // Équiper le meilleur
  { const plan = bestPlan(curEq(), meta.stash); for (const sl in plan) { const it = plan[sl]; meta.stash = meta.stash.filter(i => i !== it); const old = meta.gear[sl]; if (old) meta.stash.push(old); meta.gear[sl] = it; } }
  fuseAll();
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

// Mods : monte les rangs des mods utiles puis remplit les builds arme et héros par ordre de préférence.
SIM.MODPREF = ['ferocite', 'cadence', 'oeil', 'boucherie', 'dedoublement', 'orage', 'vitalite', 'souffle', 'egide', 'intensite', 'flux', 'etendue', 'survivant', 'diamant', 'allonge', 'sangsue', 'deflagration', 'pas', 'dernier', 'alchimiste', 'braise', 'givre', 'persist', 'fantome', 'antidote', 'rapace'];
SIM.mods = function () {
  const own = SIM.MODPREF.filter(id => meta.mods[id] != null && modOk(id, heroCls));
  for (let g = 0; g < 30; g++) { const id = own.find(id => meta.mods[id] < MODS[id].max && meta.essence >= fuseCost(id, meta.mods[id]) + 30); if (!id) break; meta.essence -= fuseCost(id, meta.mods[id]); meta.mods[id]++; }
  for (const id of own) { const m = MODS[id], st = modSt(id), c = starCost(id, st); if (modCanStar(id) && meta.mods[id] >= m.max && st < MOD_ST_MAX && (meta.modCp[id] | 0) >= c.cp && meta.essence >= c.ess + 30) { meta.modCp[id] -= c.cp; meta.essence -= c.ess; meta.modSt[id] = st + 1; } }
  for (const kind of (typeof isUnl !== 'function' || isUnl('hmods') ? ['w', 'h'] : ['w'])) { const b = build(kind, heroCls); b.load.fill(null); for (const id of own) { if ((modKind(id) === 'w') !== (kind === 'w')) continue; const bs = bBest(b, id, meta.mods[id]); if (bs.i >= 0 && bUsed(b) + bs.d <= bCap(b)) b.load[bs.i] = id; } }
  const au = ['ferveur', 'presence', 'cupidite'].find(a => meta.mods[a] != null); if (au) meta.aura[heroCls] = au;
};

SIM.mile = function (k) { const C = SIM.C; if (C.miles[k]) return; C.miles[k] = { n: C.n, h: Math.round(C.hours * 100) / 100 }; };

// Jalons constatés après chaque mission.
SIM.checkMiles = function (R) {
  const C = SIM.C;
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
    if (C.level >= C.caps[C.tier] && C.tier < SIM.TIERS.length - 1 && (unlockCheck(true), open(nt))) C.tier++;
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
    bank: { gold: meta.gold | 0, ess: meta.essence | 0, hfrag: meta.hfrag | 0, maxL: maxL(), relStock: Object.fromEntries(Object.entries(meta.relics).map(([k, a]) => [k, (a[0] | 0) + (a[1] | 0)])), frags: fragTotal(), stash: meta.stash.length },
    gear: Object.fromEntries(Object.entries(eq).map(([k, it]) => [k, it ? [it.r, it.up | 0, it.lvl | 0] : null])),
    up: Object.values(meta.up).reduce((a, b) => a + (b | 0), 0), prest: prOf().lv, pet: petEq() ? [petEq().t, petEq().rk, petEq().lv] : null,
    mods: allMods(heroCls).length, crafted: lg.filter(x => x.startsWith('craft')).length, ms: R.ms };
  SIM.next(R);
  C.log.push(row);
  return row;
};

SIM.state = function () { return { meta: JSON.parse(JSON.stringify(meta)), C: { ...SIM.C, log: [] }, uid }; };
SIM.restore = function (s) { meta = Object.assign(meta, s.meta); SIM.C = { ...s.C, log: [] }; uid = s.uid; heroCls = s.C.cls; saveMeta(); };
