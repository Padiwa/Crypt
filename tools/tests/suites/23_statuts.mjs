// v141 : statuts (poison, saignement, étourdir, immobiliser, avec feu, givre et éclair), mods d'arme qui les posent ou les transforment,
// conversion des anciens mods d'arme, affixes à thème, coopération (l'hôte tient les statuts).
import { newPage, startMission, campView } from '../lib.mjs';

// Mission arrêtée, sans ennemis ; le héros n'attaque pas. __mk crée un ennemi immortel, __set force des statistiques (gardées à chaque image), __run avance la boucle.
async function arena(p, cls = 'archer') {
  await startMission(p, { cls });
  await p.evaluate(() => {
    paused = true; G.en = []; G.spawns = []; G.bossT = 1e9; G.ult = 1e9;
    const Z = { psnCh: 0, bldCh: 0, chill: 0, shock: 0, stunCh: 0, rootCh: 0, burn: 0, curse: 0, frz: 0, contag: 0, stDur: 0, critSt: 0, cdSt: 0, embr: 0, peste: 0, hemo: 0, cryo: 0, surt: 0, cata: 0, diam: 0, defl: 0, soif: 0, dotPct: 0, thorns: 0, ccDmg: 0, skillDur: 0, execute: 0, lowDmg: 0, bossDmg: 0, cold: 0 };
    window.__ov = {};
    window.__set = (o) => { window.__ov = { ...Z, ...o }; Object.assign(S, __ov); };
    window.__mk = (type = 'ghoul', dx = 260, dy = 0) => { spawnEnemy({ type, x: G.P.x + dx, y: G.P.y + dy }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e9; return e; };
    window.__run = (n) => { for (let i = 0; i < n; i++) { Object.assign(S, __ov); G.P.fire = 1e9; update(1 / 60); } };
    __set({});
  });
}

export const tests = [
  { name: 'poison : couches (10 au plus), 15 % des dégâts du coup par seconde et par couche, 4 s relancées ; Peste les répand (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p);
    const r = await p.evaluate(() => {
      __set({ psnCh: 100 }); const e = __mk(), o = __mk('ghoul', 300, 40); e.spd = o.spd = 0;
      for (let i = 0; i < 12; i++) onHit(e, 100, false);
      const st = [e.psnN, +e.psnS.toFixed(2), +e.psnT.toFixed(2), o.psnN | 0];
      const h0 = e.hp; __run(60); const d1 = h0 - e.hp;
      __run(200); const after = [e.psnT > 0, e.psnN];
      __set({ psnCh: 100, peste: 4 }); for (let i = 0; i < 10; i++) onHit(e, 100, false);
      return { st, d1, after, peste: [o.psnN, !!(e.pstT > 0)] };
    });
    t.eq(r.st, [10, 15, 4, 0], '10 couches de 15, 4 s, pas de contagion sans le mod');
    t.ok(Math.abs(r.d1 - 150) <= 3, `1 s de poison à 10 couches : ${r.d1} (≈ 150)`);
    t.eq(r.after, [false, 0], 'le poison s\'arrête après 4 s sans coup');
    t.eq(r.peste, [4, true], 'Peste : 4 couches passent au voisin à 10 couches');
  } },
  { name: 'saignement : 3 à la fois, le plus faible remplacé ; Hémorragie et Soif du fer (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p, 'guerrier');
    const r = await p.evaluate(() => {
      __set({ bldCh: 100 }); const e = __mk(); e.spd = 0;
      onHit(e, 100, false); onHit(e, 200, false); onHit(e, 300, false); onHit(e, 600, false);
      const vs = e.bld.map((x) => Math.round(x.v)).sort((a, b) => a - b);
      const h0 = e.hp; __run(200); const tot = Math.round(h0 - e.hp);
      // Hémorragie : un critique saigne toujours, +50 % ; Soif du fer : 6 % des dégâts du saignement rendus en vie
      __set({ hemo: 50, soif: 6 }); G.P.hp = 1; onHit(e, 100, true);
      return { vs, tot, hemo: [e.bld.length, Math.round(e.bld[0].v)], heal: Math.round(G.P.hp - 1) };
    });
    t.eq(r.vs, [40, 60, 120], '3 saignements, celui de 100 remplacé (60 % du coup sur 3 s)');
    t.ok(Math.abs(r.tot - 660) <= 6, `total ${r.tot} ≈ 60 % de 200 + 300 + 600`);
    t.eq(r.hemo, [1, 30], 'critique : saignement de 100 × 60 % / 3 s × 1,5');
    t.eq(r.heal, 5, 'soin : 6 % de 90');
  } },
  { name: 'étourdir et immobiliser : arrêt, immunité après, Gardiens moins longtemps ; le tireur immobilisé tire encore (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p);
    const r = await p.evaluate(() => {
      const e = __mk('ghoul', 300, 0), x0 = e.x;
      const ok1 = stunE(e, STUN_T); __run(20); const still = Math.abs(e.x - x0) < 1;
      const again = stunE(e, STUN_T); __run(30); const moved = Math.abs(e.x - x0) > 5;
      __run(80); const ok2 = stunE(e, STUN_T);
      const boss = __mk('boss', -300, 0); stunE(boss, STUN_T); rootE(boss, 1.5); const bs = [+boss.stun.toFixed(2), +boss.root.toFixed(2)];
      G.en = []; const a = __mk('archer', 0, 300), y0 = a.y; rootE(a, 1.5); a.timer = .05; const s2 = __mk('archer', 0, -300); stunE(s2, STUN_T); s2.timer = .05; __run(30);
      return { ok1, still, again, moved, ok2, boss: bs, arch: [Math.abs(a.y - y0) < 1, a.timer > 1, s2.timer === .05] };
    });
    t.eq([r.ok1, r.still, r.again, r.moved, r.ok2], [true, true, false, true, true], 'étourdi 0,6 s, immunité 1,5 s, puis de nouveau');
    t.eq(r.boss, [.2, .75], 'Gardien : ÷ 3 et ÷ 2');
    t.eq(r.arch, [true, true, true], 'immobilisé : ne bouge pas, mais sa minuterie de tir tourne (il tire) ; étourdi : elle est arrêtée');
  } },
  { name: 'givre et Cryogénie, Surtension, Contagion, Embrasement (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p, 'magicien');
    const r = await p.evaluate(() => {
      __set({ chill: 100, cryo: .8 }); const e = __mk(), boss = __mk('boss', -300, 0);
      onHit(e, 10, false); const f1 = e.frz > 0; onHit(e, 10, false); const f2 = +e.frz.toFixed(2);
      onHit(boss, 10, false); const s0 = boss.slow; onHit(boss, 10, false);
      const cryo = [f1, f2, !(boss.frz > 0), +(boss.slow - s0).toFixed(2)];
      // Surtension : l'éclair touche 3 + 2 ennemis et les étourdit
      __set({ surt: .3 }); G.en = []; const src = __mk('ghoul', 0, 200); const ts = []; for (let i = 0; i < 6; i++) ts.push(__mk('ghoul', -100 + i * 40, 260));
      chain(src, 10); const surt = [ts.filter((x) => x.stun > 0).length, +Math.max(...ts.map((x) => x.stun || 0)).toFixed(2)];
      // Contagion à coup sûr : le poison posé touche aussi le voisin
      G.en = []; __set({ psnCh: 100, contag: 100 }); const c1 = __mk(), c2 = __mk('ghoul', 300, 30), c3 = __mk('ghoul', 600, 0); onHit(c1, 100, false);
      const cont = [c1.psnN, c2.psnN | 0, c3.psnN | 0];
      // Embrasement : un ennemi qui meurt en brûlant enflamme ses voisins
      G.en = []; __set({ embr: 120 }); const k = __mk(), n1 = __mk('ghoul', 330, 0), n2 = __mk('ghoul', 500, 0); k.burnT = 2; k.burnDps = 50; k.hp = 1; dmgEnemy(k, 10, false);
      return { cryo, surt, cont, embr: [n1.burnT > 0, n1.burnDps, n2.burnT > 0] };
    });
    t.eq(r.cryo, [false, .8, true, 1], 'gel au 2e coup ; Gardien : jamais gelé, ralenti 1 s de plus');
    t.eq(r.surt, [5, .3], 'Surtension : 5 cibles, 0,3 s');
    t.eq(r.cont, [1, 1, 0], 'Contagion : l\'ennemi le plus proche (120 px)');
    t.eq(r.embr, [true, 50, false], 'Embrasement : 120 px, même brûlure');
  } },
  { name: 'dégâts conditionnels : Œil du chasseur, Boucherie, Catalyse, Brise-garde ; Pointe de diamant et Déflagration (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p);
    const r = await p.evaluate(() => {
      const out = {}, hits = []; const f = dmgEnemy; window.dmgEnemy = (en, d, crit, dot) => { if (!dot) hits.push([Math.round(d), !!crit]); return f(en, d, crit, dot); };
      const e = __mk(); const rnd = Math.random; Math.random = () => 0; // tirages favorables
      __set({ critSt: 10, cdSt: 50 }); S.crit = 0; S.critDmg = 200;
      hitE(e, 100, false); out.noSt = hits.pop();
      e.psnT = 2; e.psnN = 1; e.psnS = 0; hitE(e, 100, false); out.st = hits.pop();
      Math.random = rnd;
      window.dmgEnemy = f; const lost = () => { const h = e.hp; dmgEnemy(e, 100, false); return Math.round(h - e.hp); };
      __set({ cata: 30 }); e.psnT = 2; e.burnT = 0; out.cata1 = lost(); e.burnT = 2; e.burnDps = 0; out.cata2 = lost();
      __set({ ccDmg: 20 }); e.psnT = 0; e.burnT = 0; e.root = 1; out.cc = lost(); e.root = 0;
      // Pointe de diamant : après le premier ennemi transpercé, les statuts sont posés à coup sûr
      __set({ psnCh: 1, diam: 1 }); const a = __mk('ghoul', 0, 0); a.psnT = 0; onHit(a, 50, false, { f: 1 }); out.diam = a.psnN;
      // Déflagration : l'explosion pose les statuts (chance × 100 %)
      __set({ psnCh: 60, defl: 100 }); G.en = []; const ex = []; for (let i = 0; i < 30; i++) ex.push(__mk('ghoul', 400 + (i % 6) * 6, (i / 6 | 0) * 6));
      explode({ x: G.P.x + 412, y: G.P.y + 12, d: 100 }, null); out.defl = ex.filter((x) => x.psnN > 0).length;
      __set({ psnCh: 60 }); for (const x of ex) { x.psnN = 0; x.psnT = 0; } explode({ x: G.P.x + 412, y: G.P.y + 12, d: 100 }, null); out.noDefl = ex.filter((x) => x.psnN > 0).length;
      return out;
    });
    t.eq(r.noSt, [100, false], 'sans statut sur l\'ennemi : pas de bonus');
    t.eq(r.st, [250, true], 'ennemi empoisonné : critique (×2), +50 % de dégâts critiques');
    t.eq([r.cata1, r.cata2], [100, 130], 'Catalyse : à partir de 2 statuts différents');
    t.eq(r.cc, 120, 'Brise-garde : ennemi immobilisé');
    t.eq(r.diam, 1, 'Pointe de diamant : poison posé à coup sûr');
    t.ok(r.defl >= 10 && r.defl <= 28 && r.noDefl === 0, `Déflagration : ${r.defl} sur 30 empoisonnés (≈ 18), 0 sans le mod`);
  } },
  { name: 'mods d\'arme : valeurs par rang, étoiles, plafonds, et dans le jeu (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'archer'; meta.mods.venin = 4; meta.mods.peste = 2; meta.modSt = { venin: 5 }; const bw = build('w'); bw.load.fill(null); bw.load[0] = 'venin';
      const s1 = stats(curEq()); bw.load[0] = 'peste'; const s = { psnCh: s1.psnCh, peste: stats(curEq()).peste };
      return { v: [modVal('venin', 4, 0), +modVal('venin', 4, 5).toFixed(1)], s: [s.psnCh, s.peste], deflMax: MODS.deflagration.max, gone: ['ferocite', 'cadence', 'allonge', 'dedoublement', 'sangsue'].filter((k) => MODS[k]) };
    });
    t.eq(r.v, [40, 64], 'Venin au rang 4 : 8 × 5 = 40 %, 64 % avec 5 étoiles');
    t.eq(r.s, [60, 5], 'plafond de 60 % ; Peste rang 3 : 5 couches');
    t.eq([r.deflMax, r.gone], [2, []], 'Déflagration : rangs 0 à 2 (3 valeurs) ; anciens mods retirés');
  } },
  { name: 'conversion des anciens mods d\'arme : renommés, remboursés, message (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      const m = JSON.parse(localStorage.getItem('crypte-meta')); delete m.modV;
      m.mods = { ferocite: 4, cadence: 0, dedoublement: 2, sangsue: 1, deflagration: 4, givre: 1 }; m.modSt = { ferocite: 5 }; m.modCp = { ferocite: 2 };
      m.wload = { a0: ['ferocite', 'dedoublement', 'givre', null] }; m.essence = 0;
      localStorage.setItem('crypte-meta', JSON.stringify(m));
    });
    await p.reload();
    const r = await p.evaluate(() => ({ mods: meta.mods, ld: meta.wload.a0, note: meta.modNote, ess: meta.essence, v: meta.modV }));
    t.eq([r.mods.ferocite, r.mods.cadence, r.mods.dedoublement, r.mods.rafale, r.mods.soif, r.mods.deflagration, r.mods.givre], [undefined, undefined, undefined, 2, 1, 2, 1], 'Écho → Rafale, Sangsue → Soif du fer, Déflagration ramenée au rang 3');
    t.eq(r.ld, [null, 'rafale', 'givre', null], 'build : la case de Férocité devient libre');
    t.eq([r.note.conv, r.note.ref, r.v, r.note.ven, r.mods.venin], [4, 2, 4, 1, 0], 'message : convertis et remboursés ; Venin offert (sauvegarde ensuite passée en v144)');
    t.ok(r.ess > 900, `essence rendue : ${r.ess}`);
    await campView(p, 'mods');
    t.ok(await p.evaluate(() => /Mods d'arme revus/.test($('campBody').textContent)), 'carte du message dans Héros › Mods');
    await p.click('[data-act="modnote"]');
    t.eq(await p.evaluate(() => [meta.modNote === undefined, /Mods d'arme revus/.test($('campBody').textContent)]), [true, false], '« Compris » la retire');
  } },
  { name: 'affixes : thème de l\'emplacement favorisé, anciennes affixes plus tirées, nouvelles affixes comptées (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const n = {}, old = new Set(Object.keys(AFF).filter((k) => AFF[k].old));
      let tot = 0, oldN = 0;
      for (let i = 0; i < 1500; i++) { const it = genItem(40, 2); for (const k in it.aff) { if (old.has(k)) oldN++; if (it.slot !== 'anneau') continue; n[k] = (n[k] || 0) + 1; tot++; } }
      const th = AFF_THEME.anneau.reduce((a, k) => a + (n[k] || 0), 0);
      const s = stats({ armure: { base: { k: 'hp', v: 0 }, up: 0, aff: { thorns: 20, dotPct: 30, ccDmg: 15 } } });
      return { share: th / tot, oldN, s: [s.thorns, s.dotPct, s.ccDmg] };
    });
    t.ok(r.share > .35, `anneau : ${Math.round(r.share * 100)} % d'affixes de son thème`);
    t.eq(r.oldN, 0, 'aucune ancienne affixe sur un objet neuf');
    t.eq(r.s, [20, 30, 15], 'Épines, Dégâts des statuts, Brise-garde dans les statistiques');
  } },
  { name: 'coopération : l\'invité envoie ses statuts, l\'hôte les tient et les montre (v141)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p);
    const r = await p.evaluate(() => {
      __set({ psnCh: 100, stunCh: 100 }); const e = __mk(); e.id = e.id || 77;
      NET.guest = true; NET.sa = []; onHit(e, 100, false); const sa = NET.sa.splice(0); NET.guest = false;
      const h = __mk(); h.id = 991; G.started = true;
      const peer = { slot: 1, cls: 'guerrier', state: 'open' };
      netRecvHost(peer, { t: 'g', p: heroPack(G.P), sh: [], h: [], st: [], sa: [[991, 1, 20, 4, 3], [991, 3, 0, .6, 1]], rel: false });
      return { sa: sa.map((x) => x.slice(1, 2)), host: [h.psnN, h.psnS, +h.stun.toFixed(2)], v: NET_V };
    });
    t.eq(r.sa, [[1], [3]], 'invité : poison et étourdissement envoyés');
    t.eq(r.host, [3, 20, .6], 'hôte : 3 couches de 20, étourdi 0,6 s');
    t.ok(r.v >= 11, `version du réseau ${r.v} (11 depuis la v141, 12 depuis la v142)`);
  } },
];
