// v144 : défauts trouvés par l'audit de cohérence des documents (plafonds du gel et de la malédiction, explosions d'un sort,
// armes aux anciennes affixes changées par le joueur, copies des mods sans étoile, sceau Cri de ralliement, potions au maximum).
import { newPage, startMission } from '../lib.mjs';

export const tests = [
  { name: 'plafonds du gel (40 %) et de la malédiction (60 %) gardés avec Imprégnation (v144)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { cls: 'magicien' });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; G.spawns = []; G.bossT = 1e9; const rnd = Math.random, out = {};
      spawnEnemy({ type: 'ghoul', x: G.P.x + 80, y: G.P.y }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e9; e.spd = 0;
      Object.assign(S, { frz: 40, curse: 60, impr: 2.5, psnCh: 0, bldCh: 0, chill: 0, shock: 0, stunCh: 0, rootCh: 0, contag: 0, comm: 0, intSt: 0 });
      Math.random = () => .41; spellHit(e, 10, false); out.frz41 = e.frz > 0; e.frz = 0; Math.random = () => .39; spellHit(e, 10, false); out.frz39 = e.frz > 0;
      e.frz = 0; e.curse = 0; S.frz = 0; Math.random = () => .61; spellHit(e, 10, false); out.cur61 = e.curse > 0; Math.random = () => .59; spellHit(e, 10, false); out.cur59 = e.curse > 0;
      Math.random = rnd; return out;
    });
    t.eq([r.frz39, r.frz41, r.cur59, r.cur61], [true, false, true, false], 'gel 40 % et malédiction 60 % au plus, même multipliés');
  } },
  { name: 'Intensité et Commotion comptent aussi les explosions d\'un sort (Transfert) (v144)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { cls: 'magicien' });
    const r = await p.evaluate(() => {
      paused = true; G.en = []; G.spawns = []; G.bossT = 1e9;
      const mk = (dx) => { spawnEnemy({ type: 'ghoul', x: G.P.x + dx, y: G.P.y }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e9; e.spd = 0; return e; };
      const a = mk(40), c = mk(-40); a.psnT = 3; a.psnN = 1; a.psnS = 0;
      Object.assign(S, { intSt: 40, comm: .5, psnCh: 0, bldCh: 0, chill: 0, shock: 0, stunCh: 0, rootCh: 0, contag: 0, burn: 0, curse: 0, frz: 0, defl: 0, skillRad: 0, splash: 0, cata: 0, ccDmg: 0, execute: 0, lowDmg: 0, bossDmg: 0, cold: 0 });
      const ha = a.hp, hc = c.hp; G.inSp = 1; explode({ x: G.P.x, y: G.P.y, d: 100 }, null, true); G.inSp = 0;
      const out = { a: Math.round(ha - a.hp), c: Math.round(hc - c.hp), stun: +a.stun.toFixed(1) };
      a.stun = 0; a.stunI = 0; const h2 = a.hp; explode({ x: G.P.x, y: G.P.y, d: 100 }, null, true); out.atk = [Math.round(h2 - a.hp), a.stun > 0];
      return out;
    });
    t.eq([r.a, r.c, r.stun], [140, 100, .5], 'sort : +40 % contre l\'ennemi empoisonné, étourdi 0,5 s');
    t.eq(r.atk, [100, false], 'hors sort (explosion d\'attaque ou de talent) : rien');
  } },
  { name: 'arme dont le joueur avait changé une ancienne affixe : pas d\'affixe en plus (v144)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const w = Object.values(WPN).flat().find((x) => x.remap && Object.keys(x.remap).length), [k, n] = Object.entries(w.remap)[0], c = wclsOfD(w.id);
      meta.built[w.id] = true; meta.waff = meta.waff || {};
      const base = Object.keys(weaponItem(c, w.id).aff);
      meta.waff[w.id] = { [k]: 77 }; const up = weaponItem(c, w.id).aff;
      meta.waff[w.id] = { [k]: null, crit: 5 }; const rep = weaponItem(c, w.id).aff;
      return { k, n, base: base.includes(n) && !base.includes(k), up: [up[k], n in up, Object.keys(up).length === base.length], rep: [k in rep, n in rep, rep.crit] };
    });
    t.ok(r.base, `modèle : ${r.n} à la place de ${r.k}`);
    t.eq(r.up, [77, false, true], 'ancienne affixe améliorée : elle reste, seule, même nombre d\'affixes');
    t.eq(r.rep, [false, false, 5], 'ancienne affixe remplacée : ni elle ni la nouvelle');
  } },
  { name: 'Cri de ralliement : l\'ultime se recharge 20 % plus vite, comme Fureur (v144)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { cls: 'guerrier' });
    const r = await p.evaluate(() => {
      paused = true; const out = {}; S.fury = 0; S.seals = {}; out.base = ultNeed();
      S.seals = { cri: 1 }; out.cri = ultNeed(); S.fury = 45; out.max = ultNeed(); S.fury = 0;
      G.ultQ = 0; G.inUlt = 0; spawnEnemy({ type: 'ghoul', x: G.P.x + 60, y: G.P.y }); const e = G.en[G.en.length - 1]; e.hp = 1; dmgEnemy(e, 10, false);
      out.kill = +(G.ultQ || 0).toFixed(2); G.ult = 0; ultCharge(1); out.sec = +(G.ult || 0).toFixed(2); return out;
    });
    t.eq([r.base, r.cri, r.max], [40, 32, 20], '40 points, 32 avec le sceau, jamais moins de 20 (avec Fureur)');
    t.eq(r.kill, .5, 'un ennemi abattu donne toujours 0,5 point (plus de bonus sur les abattus)');
    t.ok(r.sec >= 1, `charge de base : ${r.sec} point par seconde`);
  } },
  { name: 'potions : jamais plus que le maximum, au départ comme au ramassage (v144)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.up.alc = 3; const it = rgItem('L1', 10); it.seal = 'gourde'; meta.gear.armure = it; saveMeta(); });
    await startMission(p);
    const r = await p.evaluate(() => {
      paused = true; const out = { start: G.potions, max: potMax() }; G.en = []; G.spawns = []; G.bossT = 1e9;
      const drop = () => { G.drops.push({ kind: 'potion', x: G.P.x, y: G.P.y, t: 0, age: 0, mt: 0 }); update(1 / 60); };
      const n0 = G.drops.length; drop(); out.full = [G.potions, G.drops.filter((d) => d.kind === 'potion').length]; out.n0 = n0;
      G.potions = 3; drop(); out.low = [G.potions, G.drops.filter((d) => d.kind === 'potion').length];
      return out;
    });
    t.eq([r.start, r.max], [6, 6], 'Alchimie 3 + Gourde : 6 potions au départ, pas 7');
    t.eq(r.full, [6, 0], 'au maximum : la potion disparaît, le compte ne bouge pas');
    t.eq(r.low, [4, 0], 'sous le maximum : ramassée, +1');
  } },
  { name: 'copies d\'un mod sans étoile rendues en essence (v144)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      const m = JSON.parse(localStorage.getItem('crypte-meta')); m.modV = 3; m.essence = 0;
      m.mods = { venin: 0, diamant: 0, remanence: 1, pcrocs: 2 }; m.modCp = { diamant: 3, remanence: 1, pcrocs: 4 };
      localStorage.setItem('crypte-meta', JSON.stringify(m));
    });
    await p.reload();
    const r = await p.evaluate(() => ({ cp: [meta.modCp.diamant, meta.modCp.remanence, meta.modCp.pcrocs], ess: meta.essence, v: meta.modV }));
    // Pointe de diamant (Or) 3 × 24, Rémanence (Or) 1 × 24 ; Crocs se surcharge : copies gardées
    t.eq([r.cp, r.ess, r.v], [[undefined, undefined, 4], 96, 4], 'copies rendues, Crocs intact');
  } },
];
