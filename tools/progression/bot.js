// Crypte des Cendres — simulateur de progression : le bot qui joue les missions (injecté dans la page du jeu).
// Il joue avec les vraies règles du jeu (update, butin, reliques, montée de niveau) ; seules ses entrées sont simulées.
window.SIM = window.SIM || {};

// Hasard reproductible : même graine, même carrière.
SIM.seed = function (s) {
  let a = s >>> 0;
  Math.random = function () { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
};

// Bonus de montée de niveau, par ordre de préférence.
SIM.PICK = {
  guerrier: ['dmg', 'aps', 'hp', 'wave', 'reach', 'leech', 'regen', 'crit', 'cdmg', 'nova', 'echo', 'spd', 'fiole'],
  archer: ['multi', 'dmg', 'aps', 'hp', 'regen', 'fan', 'pierce', 'crit', 'cdmg', 'echo', 'spd', 'fiole'],
  magicien: ['multi', 'dmg', 'splash', 'hp', 'regen', 'aps', 'fan', 'crit', 'cdmg', 'nova', 'echo', 'spd', 'fiole'],
};

// Une décision par pas de jeu : déplacement (joystick virtuel), compétence, ultime, esquive, potion.
SIM.bot = function () {
  const P = G.P, cls = G.cls, ranged = cls !== 'guerrier';
  let rx = 0, ry = 0, near = 0, near2 = 0, boss = null, nd = 1e9, ne = null, threat = 0;
  for (const e of G.en) {
    if (e.dead || e.type === 'cible') continue;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
    if (d < nd) { nd = d; ne = e; }
    if (d < 220) near++;
    if (d < 120) near2++;
    if (e.type === 'boss' && d < 520) boss = e;
    const charging = e.state === 'charge' || e.state === 'wind';
    // à distance : on ne fuit que ce qui s'approche vraiment ; au corps à corps : on évite les Gardiens et les charges
    const R = ranged ? (e.type === 'boss' ? 260 : e.type === 'brute' || charging ? 220 : 150) + e.r : (charging || (e.type === 'boss' && P.hp < S.hp * .5) ? 210 : 55) + e.r;
    if (d < R) {
      const w = (e.type === 'boss' ? 3 : e.type === 'brute' ? 2 : 1) * (charging ? 3 : 1) * (e.elite ? 1.5 : 1);
      const k = w * (R - d) / R; rx += dx / d * k; ry += dy / d * k; threat += k;
    }
  }
  for (const b of G.eb) { const dx = P.x - b.x, dy = P.y - b.y, d = Math.hypot(dx, dy) || 1; if (d < 130) { const k = 1.6 * (130 - d) / 130; rx += dx / d * k; ry += dy / d * k; threat += k; } }
  for (const z of G.zones) { const dx = P.x - z.x, dy = P.y - z.y, d = Math.hypot(dx, dy) || 1; if (d < z.r + 40) { rx += dx / d * 3; ry += dy / d * 3; threat += 3; } }
  for (const l of G.lobs) { const dx = P.x - l.tx, dy = P.y - l.ty, d = Math.hypot(dx, dy) || 1; if (d < l.r + 30) { rx += dx / d * 3; ry += dy / d * 3; threat += 3; } }
  let mx = rx, my = ry;
  // fuite en arc plutôt qu'en ligne droite : évite de finir coincé contre un mur
  if (threat > 0) { const m = Math.hypot(rx, ry) || 1; SIM.side = SIM.side || 1; mx += -ry / m * .55 * SIM.side * Math.min(1, threat); my += rx / m * .55 * SIM.side * Math.min(1, threat); if (Math.random() < .002) SIM.side = -SIM.side; }
  // corps à corps : au contact si la vie le permet
  if (!ranged && P.hp > S.hp * .4 && near2 < 8) { const tg = boss && P.hp > S.hp * .5 && !(boss.state === 'charge' || boss.state === 'wind') ? boss : ne; if (tg) { const dx = tg.x - P.x, dy = tg.y - P.y, d = Math.hypot(dx, dy) || 1; if (d > 50 + tg.r) { mx += dx / d * 1.4; my += dy / d * 1.4; } } }
  // altération : va à la source sacrée
  if ((P.psnT > 0 || P.brnT > 0) && G.wells) { let w = null, wd = 1e9; for (const s of G.wells) if (s.on) { const d = Math.hypot(s.x - P.x, s.y - P.y); if (d < wd) { wd = d; w = s; } } if (w && wd < 900) { mx += (w.x - P.x) / wd * 1.4; my += (w.y - P.y) / wd * 1.4; } }
  // calme : ramasse (réactifs et reliques d'abord), sinon se rapproche des monstres ou du centre
  if (Math.hypot(mx, my) < .2) {
    let dr = null, best = 0;
    for (const d of G.drops) { if (d.gone || d.mt > 0) continue; const q = Math.hypot(d.x - P.x, d.y - P.y); if (q > 650) continue; const v = (d.kind === 'react' || d.kind === 'relic' ? 4 : d.kind === 'item' || d.kind === 'part' || d.kind === 'mod' ? 2.5 : d.kind === 'potion' && G.potions < 3 ? 2 : 1) / (60 + q); if (v > best) { best = v; dr = d; } }
    if (dr) { const q = Math.hypot(dr.x - P.x, dr.y - P.y) || 1; mx += (dr.x - P.x) / q; my += (dr.y - P.y) / q; }
    else if (ne && nd > (ranged ? 420 : 60)) { mx += (ne.x - P.x) / nd * .7; my += (ne.y - P.y) / nd * .7; }
    else { const cx = MAP / 2 - P.x, cy = MAP / 2 - P.y, c = Math.hypot(cx, cy) || 1; if (c > 700) { mx += cx / c * .5; my += cy / c * .5; } }
  }
  // bords
  const ed = 280; if (P.x < ed) mx += (ed - P.x) / ed * 2; if (P.x > MAP - ed) mx -= (P.x - MAP + ed) / ed * 2; if (P.y < ed) my += (ed - P.y) / ed * 2; if (P.y > MAP - ed) my -= (P.y - MAP + ed) / ed * 2;
  const m = Math.hypot(mx, my);
  // à distance, rester immobile tire plus vite : on ne bouge que si ça vaut le coup
  if (m > (ranged ? .22 : .05)) {
    let ux = mx / m, uy = my / m;
    for (let k = 0; k < 10 && blocked(P.x + ux * 44, P.y + uy * 44, P.r); k++) { const a = Math.atan2(uy, ux) + (k % 2 ? 1 : -1) * (.45 + k * .3); ux = Math.cos(a); uy = Math.sin(a); }
    joy.vx = ux; joy.vy = uy;
  } else { joy.vx = 0; joy.vy = 0; }
  // actions
  if (P.novaCd <= 0 && (near >= 5 || (boss && nd < 260) || (cls === 'guerrier' && near2 >= 3) || (cls === 'magicien' && near2 >= 2))) doNova();
  if ((G.ult || 0) >= ultNeed() && (near >= 8 || boss)) doUlt();
  // Boss (v147) : l'esquive est gardée pour la Sentence et lancée dans la fenêtre de l'esquive parfaite
  const sent = typeof SENT_PERF !== 'undefined' && G.sent, keepDash = sent || (G.lord && !G.lord.dead && G.lord.sentT < 3);
  if (sent && P.dashCd <= 0 && G.sent.t <= SENT_PERF * .6) doDash();
  if (!keepDash && P.dashCd <= 0 && ((P.hp < S.hp * .5 && near2 >= 3) || G.eb.some(b => Math.hypot(b.x - P.x, b.y - P.y) < 55) || G.en.some(e => e.state === 'charge' && Math.hypot(e.x - P.x, e.y - P.y) < 130))) doDash();
  if (G.potions > 0 && P.hp < S.hp * .4) doPotion();
};

// Choisit un bonus de montée de niveau à la place du joueur.
SIM.levelUp = function () {
  const ks = [...document.querySelectorAll('#choices .choice')].map(b => b.dataset.k), pr = SIM.PICK[G.cls];
  let k = (G.P.hp < S.hp * .35 && ks.includes('heal')) ? 'heal' : pr.find(x => ks.includes(x)) || ks[0];
  $('lvlup').hidden = true; pickUp(k); paused = true; $('lvlup').hidden = true;
};

// Une mission de Survie complète : manches de 2 min, sortie ou suite selon la vie restante.
// Renvoie le bilan ; le butin est banqué par les vraies fonctions (missionSuccess / gameOver).
SIM.mission = function (o) {
  const t0 = performance.now();
  meta.mode = 'survie'; meta.start = o.level; meta.diff = o.diff; meta.torm = o.torm || 1; meta.biome = 0;
  const ess0 = meta.essence | 0, gold0 = meta.gold | 0, hf0 = meta.hfrag | 0, rel0 = meta.relOpened | 0;
  newGame(); started = true; paused = true; $('intro').hidden = true; $('over').hidden = true; $('extract').hidden = true;
  const C = { boss: 0, elite: 0 }; const k0 = window.kill;
  window.kill = function (e) { if (e.type === 'boss' && !e.noLoot) C.boss++; if (e.elite) C.elite++; return k0(e); };
  const S0 = stats(G.eq), R = { diff: o.diff, torm: o.diff === 3 ? (o.torm || 1) : 0, level: o.level, dps: Math.round(dps(S0)), hp: Math.round(S0.hp), score: Math.round(itemScore(G.eq)), died: false, rounds: 0 };
  const maxRounds = o.maxRounds || 3;
  let guard = 0;
  for (;;) {
    if (++guard > (LEVEL_T * 60 + 600) * maxRounds) break;
    SIM.bot(); update(STEP);
    if (!$('lvlup').hidden) SIM.levelUp();
    if (G.over) { R.died = true; break; }
    if (!$('extract').hidden) {
      R.rounds++;
      const ok = G.P.hp > S.hp * (o.contHp || .6) && G.potions >= 1 && R.rounds < maxRounds;
      if (ok) { contRun(); paused = true; continue; }
      missionSuccess(); break;
    }
  }
  window.kill = k0;
  R.endLevel = G.level; R.t = Math.round(G.t); R.kills = G.kills; R.boss = C.boss; R.elite = C.elite;
  R.goldRun = G.gold; R.gold = (meta.gold | 0) - gold0; R.ess = (meta.essence | 0) - ess0; R.hf = (meta.hfrag | 0) - hf0;
  R.items = [0, 0, 0]; for (const it of G.loot.items) R.items[Math.min(2, it.r)]++;
  R.relics = G.loot.relics.length; R.opened = (meta.relOpened | 0) - rel0;
  R.wpn = 0; for (const p of G.loot.parts) if (!p.hf) R.wpn++;
  R.ms = Math.round(performance.now() - t0);
  started = false; paused = true; $('over').hidden = true; $('extract').hidden = true; $('lvlup').hidden = true;
  return R;
};
