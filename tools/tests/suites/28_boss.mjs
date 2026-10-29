// v147 : Boss. Fragments et clé d'antre, arrivée après le premier objectif, arène fermée, pauses (Gardiens, manche, extraction),
// Bourreau des Cendres (Sentence et esquive parfaite, Chaîne, phase d'ombre), butin (objet unique, couleurs), Chaîne du Condamné,
// écran Mission, rendus Canvas et WebGL.
import { GAME, FIX, sleep, newPage, startMission } from '../lib.mjs';

// Mission avec le Bourreau appelé ; avance jusqu'à son apparition (après le premier objectif), monstres retirés.
async function lordMission(p, o = {}) {
  await p.evaluate(() => { meta.keys = { crypte: 1 }; meta.keyOn = true; meta.biome = 0; saveMeta(); });
  await startMission(p, o);
  return p.evaluate(() => {
    paused = true; const clean = () => { G.en = G.en.filter((e) => e.lord || e.stake); G.spawns = []; G.eb = []; G.zones = []; G.lobs = []; };
    clean(); const key = G.lordKey; objDone();
    for (let i = 0; i < (LORD_IN + .5) * 60 && !G.lord; i++) { update(1 / 60); clean(); }
    window.__clean = clean; return { key, lord: !!G.lord, keys: meta.keys.crypte, st: G.lordSt };
  });
}

export const tests = [
  { name: 'fragments de clé : sur les Gardiens, un au plus par mission, seulement dans un lieu qui a son Boss ; 3 font une clé (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { level: 5 });
    const r = await p.evaluate(() => {
      paused = true; BAL.keyFrag = 1; G.en = []; G.drops = [];
      const killB = () => { spawnEnemy({ type: 'boss', x: G.P.x + 300, y: G.P.y }); kill(G.en[G.en.length - 1]); };
      killB(); killB(); const two = G.drops.filter((d) => d.kind === 'key').length;
      G.keyN = 0; G.drops = []; G.biome = 1; killB(); const givre = G.drops.filter((d) => d.kind === 'key').length; G.biome = 0;
      G.loot.keys = 4; meta.keyF = { crypte: 1 }; meta.keys = {}; missionSuccess();
      return { two, givre, keys: meta.keys.crypte, left: meta.keyF.crypte };
    });
    t.eq(r, { two: 1, givre: 0, keys: 1, left: 2 }, 'un fragment pour deux Gardiens, aucun aux Abîmes gelés, 1 + 4 fragments = 1 clé et 2 fragments');
  } },
  { name: 'clé d\'antre : le Bourreau arrive après le premier objectif, la clé est consommée, l\'arène se ferme (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const a = await lordMission(p, { level: 10 });
    t.eq(a, { key: 'bourreau', lord: true, keys: 0, st: 2 }, 'Bourreau appelé, apparu, clé consommée');
    const r = await p.evaluate(() => {
      const e = G.lord, n = G.bossN; spawnEnemy({ type: 'boss', x: G.P.x + 900, y: G.P.y }); const g = G.en.pop(); G.bossN = n;
      const bt = G.bossT, tl = G.tl; for (let i = 0; i < 120; i++) { update(1 / 60); __clean(); }
      G.P.x = G.arena.x + 2000; G.P.y = G.arena.y; update(1 / 60); const d = Math.hypot(G.P.x - G.arena.x, G.P.y - G.arena.y);
      hud(); return { hp: +(e.max / g.max).toFixed(3), bossT: G.bossT === bt, tl: G.tl === tl, inArena: d <= G.arena.r - G.P.r + 1, bar: document.getElementById('bossBar').className, name: $('bossName').textContent };
    });
    t.eq(r.hp, LORD_HP_EXPECT, 'vie : 4 fois celle d\'un Gardien au même moment');
    t.ok(r.bossT && r.tl, 'minuteur des Gardiens et manche en pause pendant le combat');
    t.ok(r.inArena, 'le héros ne sort pas du cercle de runes');
    t.ok(/lord/.test(r.bar) && r.name === 'Le Bourreau des Cendres', `barre du Boss : ${r.bar} · ${r.name}`);
  } },
  { name: 'Bourreau : Sentence, esquive parfaite (aucun dégât, Bourreau étourdi, dégâts doublés) ou coup énorme (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#n' }));
    await lordMission(p, { level: 5 });
    const r = await p.evaluate(() => {
      const e = G.lord, P = G.P; e.x = P.x + 400; e.y = P.y; e.sentT = 99; e.chainT = 99; e.timer = 99;
      const step = (n) => { for (let i = 0; i < n; i++) { update(1 / 60); __clean(); P.inv = 0; } };
      const h0 = P.hp; G.sent = { t: .05 }; P.dashAt = G.t; step(6); const perf = { dmg: h0 - P.hp, stun: e.stun > 0, x2: G.lordX > G.t, n: G.lordLog.perf };
      const hpE = e.hp; dmgEnemy(e, 100, false); const x2 = hpE - e.hp;
      G.lordX = 0; const hpE2 = e.hp; dmgEnemy(e, 100, false); const x1 = hpE2 - e.hp;
      P.hp = S.hp; e.stun = 0; P.dashAt = -99; const h1 = P.hp; G.sent = { t: .05 }; step(6);
      return { perf, x2, x1, hit: h1 - P.hp, need: S.hp * SENT_HP * (1 - S.armor / 100), hits: G.lordLog.hit };
    });
    t.eq(r.perf, { dmg: 0, stun: true, x2: true, n: 1 }, 'esquive parfaite : aucun dégât, Bourreau étourdi, dégâts doublés');
    t.ok(Math.abs(r.x2 - 2 * r.x1) < 1e-6, `dégâts doublés pendant l'étourdissement : ${r.x2} au lieu de ${r.x1}`);
    t.ok(r.hits === 1 && Math.abs(r.hit - r.need) < r.need * .05 + 1, `sans esquive : ${Math.round(r.hit)} PV perdus (attendu ${Math.round(r.need)})`);
  } },
  { name: 'Bourreau : Chaîne (le héros reste près du pieu tant qu\'il tient), phase d\'ombre à 50 % (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await lordMission(p, { level: 5 });
    const r = await p.evaluate(() => {
      const e = G.lord, P = G.P; e.sentT = 99; e.chainT = 99; lordChain(); const s = G.stake;
      P.x = s.x + 400; update(1 / 60); const held = Math.hypot(P.x - s.x, P.y - s.y) <= CHAIN_R + 1;
      dmgEnemy(s, 1e12, false); update(1 / 60); const free = !G.stake && s.dead;
      dmgEnemy(e, e.max * .6, false); for (let i = 0; i < 120; i++) { update(1 / 60); __clean(); }
      return { held, free, ph: e.ph, dk: +G.lordDk.toFixed(2), dark: +darkK().toFixed(2), alive: !e.dead };
    });
    t.eq(r, { held: true, free: true, ph: 2, dk: 1, dark: 1, alive: true }, 'tenu par la chaîne, libre une fois le pieu brisé, ombre sous 50 % de vie');
  } },
  { name: 'Bourreau vaincu : objet unique dans le coffre, relique, essence, couleurs ; un double donne de l\'essence (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await lordMission(p, { level: 10 });
    const r = await p.evaluate(() => {
      const e = G.lord, ess = meta.essence, n0 = meta.stash.length, sw0 = lookSw('rim').length, tl = G.tl;
      dmgEnemy(e, 1e15, false); const it = meta.stash[meta.stash.length - 1];
      const got = { st: G.lordSt, items: meta.stash.length - n0, uq: it.uq, r: it.r, slot: it.slot, aff: Object.keys(it.aff).sort().join(','), ess: meta.essence - ess, won: meta.lordW.bourreau,
        relic: G.drops.some((d) => d.kind === 'relic'), arena: G.arena, sw: lookSw('rim').length - sw0, bar: $('bossBar').hidden };
      update(1 / 60); got.tl = G.tl > tl;
      const ess2 = meta.essence, n2 = meta.stash.length; lordKill({ lord: 'bourreau', x: G.P.x, y: G.P.y, r: 54 }); got.dup = { items: meta.stash.length - n2, ess: meta.essence - ess2 };
      got.ovr = /Bourreau des Cendres vaincu/.test(lordOvr()); return got;
    });
    t.eq(r, { st: 3, items: 1, uq: 'condamne', r: 3, slot: 'amulette', aff: 'crit,critDmg,dotPct', ess: 100, won: 1, relic: true, arena: null, sw: 1, bar: true, tl: true, dup: { items: 0, ess: 250 }, ovr: true },
      'Chaîne du Condamné (légendaire), +100 essence, relique, une couleur de plus, manche relancée ; double : +250 essence');
  } },
  { name: 'Chaîne du Condamné : +40 % contre un ennemi qui porte 3 saignements, avec les autres bonus sous condition (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { level: 10 });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; const it = uqItem('condamne', 10); meta.gear.amulette = it; G.eq = curEq(); S = stats(G.eq);
      spawnEnemy({ type: 'brute', x: G.P.x + 300, y: G.P.y }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e9;
      const hit = () => { const h = e.hp; dmgEnemy(e, 100, false); return h - e.hp; };
      e.bldT = 3; e.bld = [{ v: 0, t: 3 }, { v: 0, t: 3 }]; const two = hit(); e.bld.push({ v: 0, t: 3 }); const three = hit();
      return { v: S.uqCond, two, three, txt: uqTxt('condamne').replace(/<[^>]+>/g, ''), pw: power(S) > 0 };
    });
    t.eq(r.v, 40, 'pouvoir porté : +40 %');
    t.ok(Math.abs(r.two - 100) < 1e-6 && Math.abs(r.three - 140) < 1e-6, `2 saignements : ${r.two} ; 3 saignements : ${r.three}`);
    t.ok(/3 saignements/.test(r.txt) && r.pw, `fiche : « ${r.txt} »`);
  } },
  { name: 'écran Mission : ligne Clé d\'antre au premier fragment, Bourreau appelé, étiquette de la carte de mission (v147)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      meta.biome = 0; meta.keyF = {}; meta.keys = {}; meta.lordW = {}; meta.keyOn = false; refreshMenus(); const hid0 = $('keySec').hidden;
      meta.keyF = { crypte: 2 }; refreshMenus(); const one = { hid: $('keySec').hidden, dis: $('keyBtn').disabled, txt: $('keyK').textContent };
      meta.keys = { crypte: 1 }; refreshMenus(); const en = !$('keyBtn').disabled; $('keyBtn').click();
      const on = { on: meta.keyOn, pr: $('keyBtn').getAttribute('aria-pressed'), card: /Bourreau/.test($('missionCard').textContent), key: G.lordKey };
      meta.biome = 1; saveMeta(); newGame(); refreshMenus(); const givre = { dis: $('keyBtn').disabled, key: G.lordKey, card: /Bourreau/.test($('missionCard').textContent) };
      return { hid0, one, en, on, givre };
    });
    t.ok(r.hid0, 'cachée tant qu\'aucun fragment n\'est tombé');
    t.ok(!r.one.hid && r.one.dis && /2 \/ 3/.test(r.one.txt), `2 fragments : « ${r.one.txt} »`);
    t.ok(r.en, 'une clé : la ligne se touche');
    t.eq(r.on, { on: true, pr: 'true', card: true, key: 'bourreau' }, 'Bourreau appelé, sur la carte de mission');
    t.eq(r.givre, { dis: true, key: null, card: false }, 'aux Abîmes gelés : pas encore de Boss');
  } },
  { name: 'Bourreau en WebGL (maquette) et en Canvas : arène, Sentence, pieu, phase d\'ombre, fragment de clé, sans erreur (v147)', fn: async (b, t) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage(); p.errs = []; p.ctx = ctx; t.track(p);
    p.on('pageerror', (e) => p.errs.push(e.message));
    await p.route(/pixi\.min\.js/, (r) => r.fulfill({ path: FIX('pixi-mock.js'), contentType: 'text/javascript' }));
    await p.route(/fonts\.googleapis|fonts\.gstatic|cdnjs/, (r) => r.abort());
    await p.goto(GAME + '#test');
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.evaluate(() => unlockAll());
    await lordMission(p, { level: 5 });
    const r = await p.evaluate(() => {
      const e = G.lord; G.sent = { t: 1 }; lordChain(); G.drops.push({ kind: 'key', x: G.P.x + 40, y: G.P.y, t: 0, age: 0, mt: 0 });
      render(); hud(); e.hp = e.max * .4; for (let i = 0; i < 100; i++) { update(1 / 60); __clean(); } e.state = 'wind'; e.ang = 0; render(); hud();
      const gl = !!PX && !/Rendu WebGL interrompu/.test(document.body.textContent);
      dropPixi('essai'); render(); hud(); return { gl, ph: e.ph, canvas: !PX };
    });
    await sleep(p, 200);
    t.eq(r, { gl: true, ph: 2, canvas: true }, 'dessiné en WebGL puis en Canvas');
  } },
];
const LORD_HP_EXPECT = 4;
