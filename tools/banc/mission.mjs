// Crypte des Cendres — banc de mission (tools/banc) : une mission jouée par le bot du banc (tools/progression/bot.js),
// avec l'équipement de fin de carrière du bot (build « bot ») ou un équipement choisi (« raw » : objets des reliques au mieux,
// « forge » : Forge au mieux), en Survie, Défense ou Capture. Sert à mesurer l'équilibrage avant de changer une valeur du jeu.
// Mesure : morts (héros ou cryopode), manches, vagues, vie la plus basse, potions, élites et Gardiens tués, temps pour tuer un Gardien,
// part des dégâts sur la durée et de l'ultime ; en Défense avec POD_IMM=1, les dégâts que le cryopode aurait reçus vague par vague.
// Usage (depuis la racine du dépôt) :
//   node tools/banc/mission.mjs . tools/banc/etats/<héros>_etat.json tools/banc/builds/<héros><niveau>.json <bot|raw|forge> <niveau> "<d:t,…>" <parties> <sortie.jsonl> ['<réglages BAL json>'] [étiquette] [survie|defense|capture]
// Variables : POD_R (distance max au cryopode, 50 conseillé), POD_IMM=1 (cryopode immortel, dégâts par vague), FORCE_N (manches
// jouées sans sortir), POD_SRC=1 (origine des dégâts au cryopode), MAXT (secondes de jeu au plus, pour la Capture).
// Voir tools/banc/README.md.
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const [SITE, ETAT, OPT, BUILD, LVL, TIERS, K, OUT, BALJ = '{}', TAG = '', MODE = 'survie'] = process.argv.slice(2);
const { loadPlaywright } = await import(pathToFileURL(path.resolve(SITE, 'tools/tests/lib.mjs')).href);
const { chromium } = await loadPlaywright();
const b = await chromium.launch();
const etat = JSON.parse(fs.readFileSync(ETAT, 'utf8')), opt = JSON.parse(fs.readFileSync(OPT, 'utf8'));
const cls = etat.C.cls, here = path.resolve(SITE, 'tools/progression');
const tiers = TIERS.split(',').map((s) => s.split(':').map(Number));
for (const [d, t] of tiers) for (let i = 0; i < +K; i++) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(`window.BAL_OVERRIDE = ${BALJ}; window.POD_R = ${+(process.env.POD_R || 260)}; window.POD_SRC = ${process.env.POD_SRC ? '{}' : 'null'}; window.POD_IMM = ${process.env.POD_IMM ? 1 : 0}; window.FORCE_N = ${+(process.env.FORCE_N || 0)}; window.MAXT = ${+(process.env.MAXT || 0)}; window.LORD = ${process.env.LORD ? 1 : 0};`);
  await ctx.addInitScript(fs.readFileSync(path.join(here, 'bot.js'), 'utf8') + `;SIM.seed(${4242 + i * 17});`);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route(/pixi\.min\.js|fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs/, (r) => r.abort());
  await p.goto(pathToFileURL(path.resolve(SITE, 'index.html')).href);
  await p.evaluate(([c, m]) => { localStorage.clear(); localStorage.setItem('crypte-cls', c); localStorage.setItem('crypte-meta', m); }, [cls, JSON.stringify(etat.meta)]);
  await p.reload();
  await p.addScriptTag({ path: path.join(here, 'career.js') });
  const r = await p.evaluate(([cls, B, opt, L, d, t, MODE]) => {
    heroCls = cls; SIM.C = { ...(SIM.C || {}), cls, log: [] };
    if (B !== 'bot') {
      const UP = 9; meta.kit = meta.kit || {};
      for (const u of UPG) meta.up[u.k] = u.max; for (const x of TAL[cls]) meta.tal[x.k] = true;
      mastOf(cls).r = 10; meta.hslots[cls] = HSLOT_MAX; meta.slotU[cls] = { anneau2: true, dos: true };
      for (const id in MODS) { meta.mods[id] = MODS[id].max; meta.modSt[id] = modCanStar(id) ? MOD_ST_MAX : 0; }
      meta.pets = [{ uid: 901, t: 'corbeau', rk: 5, lv: 20, xp: 0 }, { uid: 902, t: 'golem', rk: 5, lv: 20, xp: 0 }, { uid: 903, t: 'follet', rk: 5, lv: 20, xp: 0 }, { uid: 904, t: 'furet', rk: 5, lv: 20, xp: 0 }];
      for (const w of WPN[cls]) { meta.built[w.id] = true; meta.wlv[w.id] = UP; mstOf(meta.wmast, w.id).r = 10; }
      const E = opt.items[B], s = opt.states[B];
      const W = E.arme, w = wdef(W.wid), ov = {}; for (const k in w.aff) if (!(k in W.aff)) ov[k] = null; Object.assign(ov, W.aff);
      meta.wpn[cls] = W.wid; meta.waff[W.wid] = ov;
      for (const k of ['armure', 'amulette', 'bottes', 'anneau', 'anneau2', 'dos']) meta.gearBy[cls][k] = E[k] ? { ...E[k], id: 70000 + Math.floor(Math.random() * 1e6) } : null;
      const setB = (kind, ids) => { const X = build(kind); X.load.fill(null); X.pol.fill(null); ids.forEach((id, i) => { X.load[i] = id; X.pol[i] = MOD_POL[id] || null; }); };
      setB('w', s.w); setB('h', s.h); meta.aura[cls] = s.au; meta.petEq = s.pet; setB('p', s.p); meta.kit[cls] = { ...s.kit };
    }
    const S0 = stats(curEq()), pw = Math.round(power(S0));
    // dégâts réellement retirés, Gardiens : apparition et mort
    let dealt = 0, over = 0, hits = 0, dDot = 0, dUlt = 0; const bossT = [];
    const d0 = window.dmgEnemy; window.dmgEnemy = function (e, dd, crit, dot) { const h = Math.max(0, e.hp); d0(e, dd, crit, dot); const x = Math.max(0, h - Math.max(0, e.hp)); dealt += x; if (dot) dDot += x; if (G.inUlt > 0) dUlt += x; over += Math.max(0, dd - x); hits++; if (e.type === 'boss' && !e.lord && e.hp <= 0 && e._t0 != null && !e._done) { e._done = 1; bossT.push(G.t - e._t0); } };
    const s0 = window.spawnEnemy; window.spawnEnemy = function (q) { s0(q); const e = G.en[G.en.length - 1]; if (e && e.type === 'boss') e._t0 = G.t; };
    // mission (Survie ou Défense) jouée par le bot ; en Défense, il revient vers le cryopode quand il s'en éloigne
    let minHp = 1, pot0 = 0, elK = 0, podMin = 1, R; const PM = []; const PR = +(window.POD_R || 260); let podD = 0, dSum = 0, dN = 0, atDeath = null; const IMM = !!window.POD_IMM, W = []; let wv = null; const wOf = () => { const k = G.wave || 0; if (!W[k]) W[k] = { w: k, t0: G.t, pod: 0, hmin: 1, el: 0, sp: 0 }; return W[k]; };
      const ph0 = window.podHurt; window.podHurt = IMM ? function (x) { if (!G.pod || G.over) return; wOf().pod += x * .6; G.pod.flash = 1; } : function (x) { const h = G.pod ? G.pod.hp : 0; ph0(x); if (G.pod) { const dd = h - G.pod.hp; podD += dd; if (window.POD_SRC) { const st = (new Error().stack || '').split('\n')[2] || ''; const m = st.match(/(\w+\.js):(\d+)/); const k = m ? m[1] + ':' + m[2] : '?'; const o = (window.POD_SRC[k] = window.POD_SRC[k] || { n: 0, d: 0, max: 0 }); o.n++; o.d += dd; o.max = Math.max(o.max, dd); } } if (G.pod && G.pod.hp <= 0 && !atDeath) atDeath = { en: G.en.length, onPod: G.en.filter((e) => e.tgtPod).length, near: G.en.filter((e) => Math.hypot(e.x - G.pod.x, e.y - G.pod.y) < 120).length, toSpawn: G.toSpawn, wave: G.wave, t: Math.round(G.t) }; };
    { const t0 = performance.now(); meta.mode = MODE; meta.start = L; meta.diff = d; meta.torm = t || 1; meta.biome = 0;
      if (window.LORD) { meta.keys = meta.keys || {}; meta.keys.crypte = 9; meta.keyOn = true; } // v147 : Boss appelé (Bourreau)
      newGame(); started = true; paused = true; $('intro').hidden = true; $('over').hidden = true; $('extract').hidden = true; pot0 = G.potions;
      const C = { boss: 0 }; const k0 = window.kill; window.kill = function (e) { if (e.type === 'boss' && !e.noLoot && !e.lord) C.boss++; if (e.elite) { elK++; if (IMM && G.wave) wOf().el++; } return k0(e); };
      R = { died: false, hero: false, pod: false, rounds: 0 }; let guard = 0;
      for (;;) {
        if (++guard > (window.MAXT ? window.MAXT * 60 : window.FORCE_N ? 60 * 1800 : (LEVEL_T * 60 + 600) * 4)) break;
        SIM.bot();
        if (G.pod) { const dx = G.pod.x - G.P.x, dy = G.pod.y - G.P.y, dd = Math.hypot(dx, dy) || 1; if (dd > PR) { const m = Math.min(1, (dd - PR) / 200); joy.vx = joy.vx * (1 - m) + dx / dd * m; joy.vy = joy.vy * (1 - m) + dy / dd * m; } podMin = Math.min(podMin, G.pod.hp / G.pod.max); }
        if (G.pod) { dSum += Math.hypot(G.pod.x - G.P.x, G.pod.y - G.P.y); dN++; } update(STEP); minHp = Math.min(minHp, G.P.hp / S.hp); { const mi = Math.floor(G.t / 60); PM[mi] = Math.min(PM[mi] == null ? 1 : PM[mi], G.P.hp / S.hp); } if (IMM && G.wave) { const o = wOf(); o.hmin = Math.min(o.hmin, G.P.hp / S.hp); o.t1 = G.t; }
        if (!$('lvlup').hidden) SIM.levelUp();
        if (G.over) { R.died = true; R.pod = !!(G.pod && G.pod.hp <= 0); R.hero = !R.pod; break; }
        if (!$('extract').hidden) { R.rounds++; const ok = window.FORCE_N ? R.rounds < window.FORCE_N : G.P.hp > S.hp * .6 && G.potions >= 1 && R.rounds < 3; if (ok) { contRun(); paused = true; continue; } missionSuccess(); break; }
      }
      window.kill = k0; R.t = Math.round(G.t); R.kills = G.kills; R.boss = C.boss; R.wave = G.wave || 0; R.endLevel = G.level; R.ms = Math.round(performance.now() - t0);
      started = false; paused = true; $('over').hidden = true; $('extract').hidden = true; $('lvlup').hidden = true; }
    window.dmgEnemy = d0; window.spawnEnemy = s0; window.podHurt = ph0;
    return { pw, podMax: G.pod ? G.pod.max : null, podD: Math.round(podD), heroPodDist: dN ? Math.round(dSum / dN) : null, atDeath, podSrc: window.POD_SRC || null, perMin: PM.map((x) => +x.toFixed(2)), hs10: +(diff().hs / (window.HS0 || 1)).toFixed(3), waves: IMM ? W.filter(Boolean).map((o) => ({ w: o.w, dur: +((o.t1 || o.t0) - o.t0).toFixed(1), pod: +(o.pod / G.pod.max).toFixed(3), hmin: +o.hmin.toFixed(3), el: o.el })) : null, died: R.died, hero: R.hero, pod: R.pod, minHp: +minHp.toFixed(3), podMin: +podMin.toFixed(3), potions: pot0 - G.potions, elites: elK, wave: R.wave, died2: R.died, rounds: R.rounds, t: R.t, kills: R.kills, boss: R.boss, elite: R.elite, dps: Math.round(dealt / Math.max(1, R.t)), over: Math.round(over / Math.max(1, R.t)), hits: Math.round(hits / Math.max(1, R.t)),
      lord: G.lordLog ? { ...G.lordLog, st: G.lordSt, left: G.lord ? +(Math.max(0, G.lord.hp) / G.lord.max).toFixed(3) : null } : null, bossTTK: bossT.length ? +(bossT.reduce((a, x) => a + x, 0) / bossT.length).toFixed(1) : null, bossN: bossT.length, dotShare: +(dDot / Math.max(1, dealt)).toFixed(3), ultShare: +(dUlt / Math.max(1, dealt)).toFixed(3), ms: R.ms };
  }, [cls, BUILD, opt, +LVL, d, t, MODE]);
  const line = { tag: TAG, mode: MODE, cls, build: BUILD, level: +LVL, d, torm: t, run: i, ...r, errs: errs.slice(0, 2) };
  console.log(JSON.stringify(line)); fs.appendFileSync(OUT, JSON.stringify(line) + '\n');
  await ctx.close();
}
await b.close();
