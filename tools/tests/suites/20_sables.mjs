// Nécropole des Sables (v136) : déblocage, monstres du lieu, momies qui se relèvent, sables mouvants, tempête, malédiction, objets et reliques.
import { newPage, startMission, openMission, sleep } from '../lib.mjs';

// Mission dans la Nécropole, arrêtée (paused) pour faire avancer le jeu pas à pas avec update(dt).
async function sablesRun(b, t) {
  const p = t.track(await newPage(b));
  await p.evaluate(() => { meta.biome = 2; saveMeta(); });
  await startMission(p, { level: 25 });
  await p.evaluate(() => { paused = true; G.en = []; G.spawns = []; G.spawnT = 99; G.bossT = 999; G.stormIn = 999; });
  return p;
}

export const tests = [
  { name: 'déblocage : carte verrouillée jusqu\'à une mission de niveau 25, puis choisie depuis l\'écran Mission', fn: async (b, t) => {
    const p = t.track(await newPage(b, { locked: true }));
    await p.evaluate(() => { meta.maxL = 24; meta.unl.givre = 1; saveMeta(); refreshMenus(); });
    await openMission(p);
    const card = () => p.evaluate(() => { const c = document.querySelector('[data-bio="2"]'); return { lock: c.getAttribute('aria-disabled') === 'true', txt: c.textContent, wide: c.getBoundingClientRect().width > document.querySelector('[data-bio="0"]').getBoundingClientRect().width * 1.5 }; });
    let c = await card();
    t.ok(c.lock && /Nécropole des Sables/.test(c.txt) && /niveau 25/.test(c.txt), 'verrouillée, avec la condition : ' + c.txt);
    t.ok(c.wide, 'la 3e carte prend toute la largeur');
    await p.evaluate(() => document.querySelector('[data-bio="2"]').click()); // aria-disabled : Playwright refuse le clic
    t.eq(await p.evaluate(() => [meta.biome | 0, /Nécropole des Sables : réussis une mission de niveau 25/.test($('toast').textContent)]), [0, true], 'toucher la carte verrouillée dit comment l\'ouvrir, sans la choisir');
    await p.evaluate(() => { meta.maxL = 25; unlockCheck(false); missionDraw(); });
    c = await card();
    t.ok(!c.lock && /Vie ×1,6 · butin \+60 %/.test(c.txt), 'ouverte : ' + c.txt);
    await p.click('[data-bio="2"]');
    t.eq(await p.evaluate(() => [meta.biome, isUnl('sables'), /☀ Nécropole des Sables/.test($('missionCard').textContent)]), [2, true, true], 'choisie, affichée sur la carte de mission de l\'accueil');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'monstres du lieu : nuées de scarabées et momies (pas de chauves-souris), réglages du biome', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const tally = (bio) => { G.biome = bio; const s = new Set(); for (let i = 0; i < 3000; i++) s.add(chooseType(200, 25)[0]); return [...s].sort(); };
      newGame(); const out = { b2: tally(2), b0: tally(0), b1: tally(1) }; G.biome = 2;
      out.B = [biome().hp, biome().dm, biome().loot];
      out.swarm = Math.max(...Array.from({ length: 300 }, () => { const c = chooseType(200, 25); return c[0] === 'scarab' ? c[1] : 0; }));
      return out;
    });
    t.ok(r.b2.includes('scarab') && r.b2.includes('mummy') && !r.b2.includes('bat') && !r.b2.includes('givrin'), 'Nécropole : ' + r.b2);
    t.ok(!r.b0.includes('scarab') && !r.b0.includes('mummy') && !r.b1.includes('mummy'), 'pas de monstres des sables ailleurs');
    t.eq(r.B, [1.6, 1.4, 1.6], 'vie ×1,6, dégâts ×1,4, butin ×1,6');
    t.ok(r.swarm >= 6, 'les scarabées viennent en nuées (jusqu\'à ' + r.swarm + ')');
  } },
  { name: 'momie : la première mort la fait tomber sans butin, elle se relève une fois (relevée : butin, compte comme tuée)', fn: async (b, t) => {
    const p = await sablesRun(b, t);
    const a = await p.evaluate(() => {
      spawnEnemy({ type: 'mummy', x: G.P.x + 200, y: G.P.y }); const m = G.en[G.en.length - 1];
      const k0 = G.kills, d0 = G.drops.length; dmgEnemy(m, 1e9, false); update(.02);
      return { kills: G.kills - k0, drops: G.drops.length - d0, rise: G.spawns.filter((s) => s.rise && s.type === 'mummyR').length, en: G.en.filter((e) => e.type === 'mummy').length };
    });
    t.eq(a, { kills: 0, drops: 0, rise: 1, en: 0 }, 'tombée : ni butin ni compte, relèvement prévu');
    const r = await p.evaluate(() => { for (let i = 0; i < 25; i++) update(.1); const m = G.en.find((e) => e.type === 'mummyR');
      if (!m) return null; const hpRatio = m.max / (ETYPE.mummy.hp * diff().hs), k0 = G.kills, d0 = G.drops.length; dmgEnemy(m, 1e9, false);
      return { hpRatio: +hpRatio.toFixed(2), kills: G.kills - k0, xp: G.drops.slice(d0).some((d) => d.kind === 'xp'), again: G.spawns.some((s) => s.rise) }; });
    t.ok(r && r.hpRatio > .45 && r.hpRatio < .6, 'relevée avec environ la moitié de la vie : ' + JSON.stringify(r));
    t.ok(r.kills === 1 && r.xp && !r.again, 'la 2e mort compte, donne de l\'expérience, pas de 3e vie');
    await p.evaluate(() => { render(); });
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'sables mouvants : le héros avance à 60 %, les monstres à 65 %, les scarabées et les Gardiens ne s\'enlisent pas', fn: async (b, t) => {
    const p = await sablesRun(b, t);
    const r = await p.evaluate(() => {
      const q = G.sands[0]; window.inputVec = () => ({ x: 1, y: 0, m: 1 });
      const step = (x, y) => { G.P.x = x; G.P.y = y; G.P.dashT = 0; const x0 = G.P.x; update(.05); return G.P.x - x0; };
      const out = { n: G.sands.length, inQ: step(q.x - 20, q.y), free: step(MAP / 2, MAP / 2 - 160) };
      G.P.x = q.x; G.P.y = q.y; out.chip = (update(0), hud(), !$('stQ').hidden);
      const walk = (type, x, y) => { G.en = []; spawnEnemy({ type, x, y }); const e = G.en[0]; e.state = 'walk'; e.timer = 9; const x0 = e.x, y0 = e.y; update(.05); return Math.hypot(e.x - x0, e.y - y0) / (e.spd * .05); };
      // un point dégagé (ni pilier ni sable) près du sable mouvant, pour comparer
      const free = () => { for (let d = q.r + 120; d < 900; d += 40) for (let a = 0; a < 6.28; a += .3) { const x = q.x + Math.cos(a) * d, y = q.y + Math.sin(a) * d; if (x > 200 && x < MAP - 200 && y > 200 && y < MAP - 200 && !blocked(x, y, 60) && !inSand({ x, y }) && !blocked(x + 120, y, 50) && !inSand({ x: x + 120, y })) return { x, y }; } return null; };
      const f = free(); G.P.x = f.x; G.P.y = f.y;
      out.ghoulIn = walk('ghoul', q.x, q.y); out.ghoulOut = walk('ghoul', f.x + 120, f.y); out.scarab = walk('scarab', q.x, q.y); out.boss = walk('boss', q.x, q.y);
      return out;
    });
    t.eq(r.n, 9, '9 sables mouvants sur la carte');
    t.ok(Math.abs(r.inQ / r.free - .6) < .02, `héros : ${r.inQ.toFixed(2)} contre ${r.free.toFixed(2)}`);
    t.ok(r.chip, 'pastille « Enlisé »');
    t.ok(Math.abs(r.ghoulIn / r.ghoulOut - .65) < .03, `goule : ${r.ghoulIn.toFixed(2)} contre ${r.ghoulOut.toFixed(2)}`);
    t.ok(r.scarab > 1, 'scarabée à pleine vitesse dans le sable (' + r.scarab.toFixed(2) + ')');
    t.ok(Math.abs(r.boss - .7) < .03, 'Gardien à son allure ordinaire (' + r.boss.toFixed(2) + ')');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'tempête de sable : annoncée 5 s avant, 6 s (15 s en jeu normal) de vue réduite, puis revient', fn: async (b, t) => {
    const p = await sablesRun(b, t);
    const r = await p.evaluate(() => {
      const o = {}; G.stormIn = 4; update(0); hud(); o.warn = !$('stT').hidden && /Tempête dans 4 s/.test($('stT').textContent);
      G.stormIn = .01; update(.05); o.on = G.storm > 0 && G.storm <= STORM_LEN; for (let i = 0; i < 25; i++) update(.1);
      o.k = stormK(); hud(); o.chip = /Tempête · \d+ s/.test($('stT').textContent); render();
      o.wind = G.parts.filter((x) => x.w).length;
      for (let i = 0; i < 40; i++) update(.1); o.off = G.storm === 0 && stormK() === 0 && G.stormIn > STORM_IV * .8 && G.stormIn < STORM_IV * 1.2;
      return o;
    });
    t.eq(r, { warn: true, on: true, k: 1, chip: true, wind: r.wind, off: true }, 'cycle de la tempête');
    t.ok(r.wind > 40, 'sable porté par le vent : ' + r.wind + ' grains');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'malédiction : maudit à l\'impact, +15 % de dégâts subis (+ dégâts contre maudits), contagion à la mort', fn: async (b, t) => {
    const p = await sablesRun(b, t);
    const r = await p.evaluate(() => {
      spawnEnemy({ type: 'mummyR', x: G.P.x + 300, y: G.P.y }); spawnEnemy({ type: 'mummyR', x: G.P.x + 340, y: G.P.y }); const [e, o] = G.en;
      S.curse = 100; onHit(e, 1); const cursed = e.curse > 4;
      e.hp = e.max = 1e6; const h0 = e.hp; dmgEnemy(e, 100, false); const base = h0 - e.hp;
      S.hex = 20; const h1 = e.hp; dmgEnemy(e, 100, false); const withHex = h1 - e.hp;
      S.doom = 100; o.hp = o.max = 1e6; o.curse = 0; e.hp = 1; dmgEnemy(e, 10, false);
      return { cursed, base: Math.round(base), withHex: Math.round(withHex), spread: o.curse > 0, hurt: o.hp < o.max };
    });
    t.eq(r, { cursed: true, base: 115, withHex: 135, spread: true, hurt: true }, 'malédiction');
    await p.evaluate(() => { render(); });
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'objets : affixes de malédiction et objets des sables seulement dans la Nécropole ; reliques Sanguine et Abyssale', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      newGame(); const roll = (bio) => { G.biome = bio; return Array.from({ length: 400 }, () => genItem(100, 2)); };
      const s = roll(2), z = roll(0), g = roll(1), has = (L, ks) => L.some((it) => ks.some((k) => it.aff[k] != null));
      const names = Object.values(BASES_BIO[2]).flat();
      const o = { sCurse: has(s, ['curse', 'hex', 'doom']), sFrost: has(s, ['frz', 'cold', 'shard']), zCurse: has(z, ['curse', 'hex', 'doom']), gCurse: has(g, ['curse', 'hex', 'doom']),
        sBio: s.every((it) => it.bio === 2 && names.includes(it.type)) };
      const pool = (bio, t) => { G.biome = bio; return relPool(t).filter((id) => RGEAR[id] && RGEAR[id].bio); };
      o.pools = [pool(0, 2), pool(1, 2), pool(2, 2), pool(2, 3)];
      const it = rgItem('S11', 100); o.s11 = [it.bio, it.aff.curse > 0, it.aff.hex > 0, it.aff.doom > 0];
      o.label = AFF.curse.t(8) + ' | ' + AFF_NAME.doom;
      return o;
    });
    t.eq([r.sCurse, r.sFrost, r.zCurse, r.gCurse, r.sBio], [true, false, false, false, true], 'affixes et noms d\'objets selon le biome');
    t.eq(r.pools, [[], ['S9', 'S10'], ['S11', 'S12'], ['B13', 'B14']], 'objets de biome dans les reliques');
    t.eq(r.s11, [2, true, true, true], 'Linceul du Roi-Momie');
    t.ok(/maudire/.test(r.label) && /contagieuse/.test(r.label), r.label);
  } },
];
