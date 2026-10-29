// v146 : horloge de mission (vie et dégâts des monstres en continu, sans retour au « Continuer »), Gardiens +10 % chacun,
// élites qui montent au fil de la mission, cryopode qui suit le Tourment et flaques moitié moins fortes sur lui,
// bonus sous condition additionnés et plafonnés à +300 %, Projectiles et Transpercement sur l'arme seulement.
import { newPage, startMission } from '../lib.mjs';

const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

export const tests = [
  { name: 'Survie : +15 % de vie et +10 % de dégâts par manche, en continu, sans retour au « Continuer » (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { level: 10 });
    const r = await p.evaluate(() => {
      // LEVEL_T : durée d'une manche (2 min dans le jeu, plus courte en test)
      paused = true; const v = () => diff(), T = LEVEL_T; G.level = 10; G.tl = 0; const a = v(); G.tl = T / 2; const h = v(); G.tl = T * .999; const e1 = v();
      G.level = 11; G.tl = 0; const s2 = v(); G.tl = T; const e2 = v();
      return { half: h.hs / a.hs, end1: e1.hs / a.hs, jump: s2.hs / e1.hs, two: e2.hs / a.hs, dm: e2.ds / a.ds, lv: G.level, lv0: G.lv0 };
    });
    t.ok(near(r.half, Math.sqrt(1.15)) && near(r.end1, Math.pow(1.15, .999)), `vie : ×${r.half.toFixed(4)} à mi-manche, ×${r.end1.toFixed(4)} en fin de manche`);
    t.ok(near(r.jump, Math.pow(1.15, .001)), `au « Continuer », pas de saut ni de retour : ×${r.jump.toFixed(6)}`);
    t.ok(near(r.two, 1.15 * 1.15) && near(r.dm, 1.1 * 1.1), `après 2 manches : vie ×${r.two.toFixed(4)}, dégâts ×${r.dm.toFixed(4)}`);
    t.eq(r.lv0, 10, 'base de l\'horloge : le niveau de départ');
  } },
  { name: 'Défense : chaque vague plus forte que la précédente ; cryopode qui suit le Tourment (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { mode: 'defense', level: 30, diff: 3, torm: 10 });
    const r = await p.evaluate(() => {
      paused = true; const hs = []; for (let w = 1; w <= 12; w++) { G.wave = w; G.level = 30 + Math.floor((w - 1) / 3); hs.push(diff().hs); }
      return { up: hs.every((x, i) => !i || x > hs[i - 1]), r3: hs[3] / hs[0], pod: G.pod.max, dm: dif().dm };
    });
    t.ok(r.up, 'la vie monte à chaque vague, sans retour aux vagues 6 et 11');
    t.ok(near(r.r3, 1.15), `3 vagues = une manche : vie ×${r.r3.toFixed(4)}`);
    t.ok(near(r.pod, 1200 * (1 + .5 * 29) * 3.2), `cryopode : ${Math.round(r.pod)} PV, soit 1 200 × (1 + 0,5 par niveau) × ${r.dm} en Tourment X`);
  } },
  { name: 'Défense : les flaques font moitié moins de dégâts au cryopode (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#n' }));
    await startMission(p, { mode: 'defense', level: 5 });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; G.spawns = []; G.lobs = []; G.eb = []; G.bossT = 1e9; G.waveState = 'break'; G.waveT = 1e9;
      G.P.x = G.pod.x + 400; G.P.y = G.pod.y; const dt = 1 / 60;
      G.zones = [{ id: ++G.zid, x: G.pod.x, y: G.pod.y, r: 40, life: 3, max: 3, kind: 'poison', dps: 100 }];
      const h0 = G.pod.hp; update(dt); const dp = h0 - G.pod.hp;
      G.zones = [{ id: ++G.zid, x: G.pod.x, y: G.pod.y, r: 40, life: 3, max: 3, kind: 'pyro', dps: 100 }];
      const h1 = G.pod.hp; update(dt); const dy = h1 - G.pod.hp;
      return { dp, dy, dt };
    });
    t.ok(near(r.dp, 100 * 1.2 * r.dt * .5 * .6, 1e-3), `flaque toxique : ${r.dp.toFixed(3)} par image (×0,5)`);
    t.ok(near(r.dy, 100 * 2 * r.dt * .5 * .6, 1e-3), `flammes : ${r.dy.toFixed(3)} par image (×0,5)`);
  } },
  { name: 'Gardiens : +10 % par Gardien déjà venu, même vie moyenne qu\'en v145 sur 6 min (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { level: 10 });
    const r = await p.evaluate(() => {
      paused = true; const hp = (n) => { G.bossN = n; spawnEnemy({ type: 'boss', x: G.P.x + 300, y: G.P.y }); const e = G.en[G.en.length - 1]; G.en.pop(); return e.max; };
      const v = [0, 1, 2, 3, 4, 5].map(hp);
      // Gardiens d'une mission type de 6 min (BOSS_T et l'intervalle sont plus courts en test)
      const N = (Math.floor((360 - BOSS_T) / bossIv()) + 1) * dif().cnt, ns = [...Array(N).keys()];
      const mul = ns.map((n) => { G.bossN = n; return bossHpMul(); }), m = (a) => a.reduce((x, y) => x + y, 0) / a.length;
      return { rise: v[1] / v[0], last: v[5] / v[0], mean: m(mul), old: m(ns.map((n) => 1 + .25 * n)), N };
    });
    t.ok(near(r.rise, 1.1) && near(r.last, 1.5), `chaque Gardien +10 % : ×${r.rise.toFixed(3)}, le 6e ×${r.last.toFixed(3)}`);
    t.ok(near(r.mean, r.old), `vie moyenne des ${r.N} Gardiens d'une mission type : ×${r.mean.toFixed(3)}, comme en v145 (×${r.old.toFixed(3)})`);
    const q = await p.evaluate(() => { // Brèche : Gardiens par paires
      G.breche = true; const c = Math.max(2, dif().cnt + (dif().cnt % 2)), N = (Math.floor((360 - BOSS_T) / bossIv()) + 1) * c, ns = [...Array(N).keys()];
      const m = (a) => a.reduce((x, y) => x + y, 0) / a.length, v = m(ns.map((n) => { G.bossN = n; return bossHpMul(); })), old = m(ns.map((n) => 1 + .25 * n)); G.breche = false;
      return { v, old };
    });
    t.ok(near(q.v, q.old), `Brèche (paires) : même vie moyenne, ×${q.v.toFixed(3)}`);
  } },
  { name: 'début de partie : les types de monstres arrivent toujours avec le temps et le niveau de manche (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { level: 1 });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; G.spawns = []; G.bossT = 1e9; G.pillars = []; const rnd = Math.random, got = [];
      for (const tt of [10, 50]) { G.t = tt; G.tl = Math.min(LEVEL_T * .9, tt); G.level = 1; G.spawnT = 0; Math.random = () => .95; const n0 = G.en.length; spawner(1 / 60); Math.random = rnd; got.push(G.en.slice(n0).map((e) => e.type)[0] || null); G.en.length = 0; }
      return got;
    });
    t.eq(r, ['ghoul', 'poison'], 'niveau 1 : pas d\'empoisonneur à 10 s, il arrive après 40 s');
  } },
  { name: 'élites : +2 points de chance par manche, plafond 35 % (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { level: 10 });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; G.spawns = []; G.bossT = 1e9; G.pillars = []; const rnd = Math.random;
      const el = (tl, x) => { G.level = 10; G.tl = tl; Math.random = () => x; const n0 = G.en.length; spawnPack('ghoul', 1); Math.random = rnd; const e = G.en[n0]; G.en.length = n0; return !!(e && e.elite); };
      const out = { s0: el(0, .03), s1: el(120, .03), s1b: el(120, .046) };
      G.level = 30; G.tl = 120; Math.random = () => .349; const n0 = G.en.length; spawnPack('ghoul', 1); out.capLo = !!(G.en[n0] && G.en[n0].elite); G.en.length = n0;
      Math.random = () => .351; spawnPack('ghoul', 1); out.capHi = !!(G.en[n0] && G.en[n0].elite); G.en.length = n0; Math.random = rnd;
      return out;
    });
    t.eq([r.s0, r.s1, r.s1b], [false, true, false], 'Normal : 2,5 % au départ, 4,5 % après une manche');
    t.eq([r.capLo, r.capHi], [true, false], 'au plus 35 %');
  } },
  { name: 'bonus sous condition additionnés, total plafonné à +300 % (dégâts et Puissance) (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { cls: 'guerrier' });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; G.spawns = []; G.bossT = 1e9; G.inUlt = 0;
      spawnEnemy({ type: 'ghoul', x: G.P.x + 300, y: G.P.y }); const e = G.en[G.en.length - 1]; e.spd = 0;
      Object.assign(S, { lowDmg: 0, execute: 100, bossDmg: 0, cold: 0, hex: 0, cata: 0, ccDmg: 0, abHunt: 0, abSoul: 0, abExec: 0 });
      const hit = () => { e.max = 1e9; e.hp = 1e8; const h = e.hp; dmgEnemy(e, 100, false); return Math.round(h - e.hp); };
      e.curse = 5; const sum = hit(); S.execute = 1000; const cap = hit(); e.curse = 0; S.execute = 0; const none = hit();
      const x = { ...S }; const pw = (o) => power(Object.assign({ ...x }, o));
      const p0 = pw({ execute: 0, bossDmg: 0, lowDmg: 0 }), pBig = pw({ execute: 1e5, bossDmg: 1e5, lowDmg: 1e5 }), pBig2 = pw({ execute: 2e5, bossDmg: 2e5, lowDmg: 2e5 });
      return { sum, cap, none, pRatio: pBig / p0, pSame: pBig === pBig2 };
    });
    t.eq([r.none, r.sum, r.cap], [100, 215, 400], 'Exécution +100 % et maudit +15 % : ×2,15 (et non ×2,3) ; au plus ×4');
    t.ok(r.pSame && r.pRatio <= 4 + 1e-9, `Puissance : même plafond (×${r.pRatio.toFixed(2)} au plus)`);
  } },
  { name: 'Projectiles et Transpercement : sur une arme seulement (statistiques, butin, transfert, fiche) (v146)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { localStorage.setItem('crypte-cls', 'archer'); });
    await p.reload();
    const r = await p.evaluate(() => {
      const out = {}; const base = stats(curEq());
      const it = rgItem('L1', 20); it.aff.multi = 3; it.aff.pierce = 2; meta.gear.armure = it;
      const st = stats(curEq()); out.stat = [st.multi - base.multi, st.pierce - base.pierce];
      const wid = meta.wpn.archer || WPN.archer[0].id, w = weaponItem('archer', wid);
      let n = 0; for (let i = 0; i < 4000; i++) { const g = genItem(40, 2); if ('multi' in g.aff || 'pierce' in g.aff) n++; } out.drop = n;
      meta.stash.push(it);
      const src = 's:' + it.id, dstA = 'g:armure';
      const it2 = rgItem('L2', 20); meta.gear.armure = it2;
      const no = xfState({ src, dst: dstA, k: 'multi' }); out.toArmor = [no && no.ok, !!(no && /arme/.test(no.msg))];
      const wk = 'w:' + wid, yes = xfState({ src, dst: wk, k: 'multi', rep: Object.keys(w.aff)[0] }); out.toWeapon = !!(yes && yes.ok !== false);
      out.card = affLi('multi', 'x', 'archer', it); out.cardW = affLi('multi', 'x', 'archer', w);
      return out;
    });
    t.eq(r.stat, [0, 0], 'hors arme : sans effet dans les statistiques');
    t.eq(r.drop, 0, 'le butin des monstres ne les tire plus');
    t.eq(r.toArmor, [false, true], 'transfert vers une armure refusé, avec un message');
    t.ok(r.toWeapon, 'transfert vers une arme possible');
    t.ok(/sans effet/.test(r.card) && /sur une arme seulement/.test(r.card), 'fiche : barrée, « sans effet · sur une arme seulement »');
    t.ok(!/sans effet/.test(r.cardW), 'sur l\'arme : compte normalement');
  } },
];
