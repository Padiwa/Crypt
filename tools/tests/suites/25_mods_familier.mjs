// v143 : mods de familier (Instinct, Marque du corbeau, Séisme, Flamme protectrice ; Écho élémentaire pose tous les statuts de l'arme).
import { newPage, startMission } from '../lib.mjs';

// Mission arrêtée, sans ennemis, le héros n'attaque pas. __set force des statistiques, __mk crée un ennemi immobile, __pet équipe un familier
// (rang 1, niveau 1) dont les statistiques de mods sont forcées. hash '#n' : héros mortel.
async function arena(p, cls = 'archer') {
  await startMission(p, { cls });
  await p.evaluate(() => {
    paused = true; G.en = []; G.spawns = []; G.bossT = 1e9;
    const Z = { psnCh: 0, bldCh: 0, chill: 0, shock: 0, stunCh: 0, rootCh: 0, burn: 0, curse: 0, frz: 0, contag: 0, stDur: 0, critSt: 0, cdSt: 0, dotPct: 0, thorns: 0, ccDmg: 0, cata: 0, crit: 0, cold: 0, execute: 0, lowDmg: 0, bossDmg: 0, lowArmor: 0, armor: 0,
      flux: 0, intSt: 0, impr: 0, comm: 0, gardA: 0, elan: 0, peau: 0, pasEl: 0, ripo: 0, econ: 0, exFer: 0, exRage: 0, buffDur: 0, rema: 0, flea: 0, terr: 0, regen: 0, abWard: 0, abSoul: 0, abExec: 0 };
    window.__set = (o) => { window.__ov = { ...Z, ...o }; Object.assign(S, __ov); };
    window.__mk = (type = 'ghoul', dx = 260, dy = 0) => { spawnEnemy({ type, x: G.P.x + dx, y: G.P.y + dy }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e9; e.spd = 0; return e; };
    window.__run = (n) => { for (let i = 0; i < n; i++) { Object.assign(S, __ov); G.P.fire = 1e9; update(1 / 60); } };
    window.__pet = (t, o = {}) => { meta.pets = [{ uid: 9, t, rk: 1, lv: 1, xp: 0 }]; meta.petEq = 9; petBuild().load.fill(null); petInit(); Object.assign(G.petS, o); return G.pet; };
    __set({});
  });
}

export const tests = [
  { name: 'conversion : Écho élémentaire, Purification et Poches profondes à rang unique, rangs et étoiles remboursés (v143)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      const m = JSON.parse(localStorage.getItem('crypte-meta')); m.modV = 2; delete m.modNote; m.essence = 0;
      m.mods = { venin: 0, pecho: 1, ppur: 0, ppoche: 1, pcrocs: 3 }; m.modSt = { pecho: 2, pcrocs: 1 }; m.modCp = { ppur: 2, pcrocs: 4 };
      localStorage.setItem('crypte-meta', JSON.stringify(m));
    });
    await p.reload();
    const r = await p.evaluate(() => ({ mods: [meta.mods.pecho, meta.mods.ppur, meta.mods.ppoche, meta.mods.pcrocs], st: [meta.modSt.pecho, meta.modSt.pcrocs], cp: [meta.modCp.ppur, meta.modCp.pcrocs],
      ess: meta.essence, note: meta.modNote, v: meta.modV, star: ['pecho', 'ppur', 'ppoche', 'pcrocs'].map(modCanStar), max: ['pecho', 'ppur', 'ppoche'].map((k) => MODS[k].max), txt: modNoteTxt() }));
    t.eq([r.mods, r.st, r.cp], [[0, 0, 0, 3], [undefined, 1], [undefined, 4]], 'rangs à 0, étoiles et copies retirées ; Crocs intact');
    // Écho : rang 1 (30) + 2 étoiles (150 + 300) ; Purification : 2 copies (2 × 24) ; Poches profondes : rang 1 (30)
    t.eq(r.ess, 30 + 450 + 48 + 30, 'essence rendue');
    t.eq([r.note.p, r.v, r.star, r.max], [3, 4, [false, false, false, true], [0, 0, 0]], 'message, sauvegarde ensuite en v144, sans étoile, rang unique');
    t.ok(/Mods revus/.test(r.txt) && /3 mods de familier à rang unique/.test(r.txt), r.txt);
  } },
  { name: 'Instinct : à l\'esquive, le familier agit tout de suite, une fois par délai (v143)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#n' }));
    await arena(p, 'guerrier');
    const r = await p.evaluate(() => {
      const out = {}, P = G.P;
      // corbeau : pique aussitôt ; une 2e esquive pendant le délai ne fait rien
      let Q = __pet('corbeau', { pInst: 2 }); Q.cd = 1; P.dashCd = 0; doDash(); out.corb = [Q.cd, +Q.inst.toFixed(2)]; Q.cd = 1; P.dashCd = 0; P.dashT = 0; doDash(); out.again = Q.cd;
      // golem : l'attirance commence
      Q = __pet('golem', { pInst: 2 }); Q.tcd = 6; P.dashCd = 0; P.dashT = 0; doDash(); __run(1); out.golem = Q.taunt > 3;
      // follet : 4 s de soin d'un coup (4 % de la vie au rang 1, niveau 1)
      Q = __pet('follet', { pInst: 2 }); P.hp = S.hp * .5; const h = P.hp; P.dashCd = 0; P.dashT = 0; doDash(); out.follet = +((P.hp - h) / S.hp * 100).toFixed(1);
      // furet : le butin proche vient à toi
      Q = __pet('furet', { pInst: 2 }); G.drops = [{ kind: 'gold', amt: 1, x: P.x + 300, y: P.y, t: 0, age: 0, mt: 0 }, { kind: 'gold', amt: 1, x: P.x + 500, y: P.y, t: 0, age: 0, mt: 0 }];
      P.dashCd = 0; P.dashT = 0; doDash(); out.furet = G.drops.map((d) => d.mt > 0);
      // sans Instinct : rien
      Q = __pet('corbeau'); Q.cd = 1; P.dashCd = 0; P.dashT = 0; doDash(); out.sans = Q.cd;
      out.cd = [0, 1, 2].map((rk) => petInstCd(modVal('pinst', rk, 0))).concat(petInstCd(modVal('pinst', 2, 5)));
      return out;
    });
    t.eq(r.corb, [0, 5], 'corbeau : pique aussitôt, délai 5 s (rang 1)');
    t.eq(r.again, 1, 'pas deux fois pendant le délai');
    t.ok(r.golem, 'golem : attire aussitôt');
    t.eq(r.follet, 4, 'follet : 4 % de vie rendus');
    t.eq(r.furet, [true, false], 'furet : le butin à moins de 360 px vient');
    t.eq(r.sans, 1, 'sans Instinct, l\'esquive ne fait pas agir le familier');
    t.eq(r.cd, [6, 5, 4, 2.5], 'délai 6, 5, 4 s ; 2,5 s au moins avec les étoiles');
  } },
  { name: 'Marque du corbeau et Écho élémentaire : +20 % de tes dégâts sur la cible piquée, statuts de l\'arme à 50 % (v143)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p, 'archer');
    const r = await p.evaluate(() => {
      const out = {}, rnd = Math.random;
      const Q = __pet('corbeau', { pMark: 20, pEcho: 1 }); const e = __mk('ghoul', 80, 0);
      __set({ psnCh: 60 }); Math.random = () => .29; Q.cd = 0; __run(1); Math.random = rnd; out.mark = [+e.mark.toFixed(1), e.markV, e.psnN];
      Q.cd = 99; let h = e.hp; hitE(e, 100, false); out.hit = Math.round(h - e.hp);
      e.psnT = 0; e.psnN = 0; Math.random = () => .31; Q.cd = 0; __run(1); Math.random = rnd; out.echo = e.psnN;
      Q.cd = 99; __set({}); __run(190); h = e.hp; hitE(e, 100, false); out.after = [e.mark > 0, Math.round(h - e.hp)];
      // une marque sur un golem : sans effet (mod réservé au corbeau)
      meta.mods.pmarque = 2; __pet('golem'); petBuild().load[0] = 'pmarque'; out.golem = petStats().pMark;
      meta.pets = [{ uid: 9, t: 'corbeau', rk: 1, lv: 1, xp: 0 }]; out.corb = petStats().pMark;
      return out;
    });
    t.eq(r.mark, [3, 20, 1], 'cible piquée : marquée 3 s, poison posé (chance 60 % × 0,5)');
    t.eq(r.hit, 120, 'tes dégâts +20 % sur la cible marquée');
    t.eq(r.echo, 0, 'Écho : au-delà de 30 %, pas de poison');
    t.eq(r.after, [false, 100], 'marque finie après 3 s');
    t.eq([r.golem, r.corb], [0, 20], 'Marque du corbeau : seulement avec le corbeau ; rang 2 = 20 %');
  } },
  { name: 'Séisme et Flamme protectrice (v143)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#n' }));
    await arena(p, 'guerrier');
    const r = await p.evaluate(() => {
      const out = {}, P = G.P;
      // Séisme : fin de l'attirance, les ennemis à moins de 120 px sont étourdis (Gardien : 3 fois moins)
      let Q = __pet('golem', { pSeis: .9 }); const a = __mk('ghoul', 0, 0), c = __mk('ghoul', 0, 0), g = __mk('boss', 0, 0);
      a.x = Q.x + 80; a.y = Q.y; c.x = Q.x + 400; c.y = Q.y; g.x = Q.x - 60; g.y = Q.y; Q.taunt = .01; Q.tcd = 9; __run(1);
      out.seis = [+a.stun.toFixed(1), c.stun > 0, +g.stun.toFixed(1)];
      // Flamme protectrice : sous 30 % de vie, bouclier de 15 %, puis 20 s d'attente
      G.en = []; G.eb = []; Q = __pet('follet', { pFlame: 15 }); P.shield = 0; P.hp = S.hp * .25; __run(1); const s1 = Math.round(P.shield / S.hp * 100);
      P.shield = 0; __run(60); const s2 = P.shield; Q.fp = 0; P.hp = S.hp * .5; __run(1); const s3 = P.shield; out.flame = [s1, s2, s3, Q.fp > 0];
      return out;
    });
    t.eq(r.seis, [.9, false, .3], 'Séisme : 0,9 s, pas au-delà de 120 px, Gardien 0,3 s');
    t.eq(r.flame, [15, 0, 0, false], 'Flamme protectrice : 15 %, une fois toutes les 20 s, seulement sous 30 % de vie');
  } },
  { name: 'mods de familier : 18 mods, valeurs, Puissance et survie (v143)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const ids = Object.keys(MODS).filter((id) => modKind(id) === 'p');
      meta.pets = [{ uid: 9, t: 'corbeau', rk: 3, lv: 10, xp: 0 }]; meta.petEq = 9; const pb = petBuild(); pb.load.fill(null);
      const p0 = power(stats(curEq())); meta.mods.pmarque = 0; pb.load[0] = 'pmarque'; const p1 = power(stats(curEq()));
      meta.mods.pinst = 0; pb.load[1] = 'pinst'; const p2 = power(stats(curEq()));
      meta.pets = [{ uid: 9, t: 'follet', rk: 3, lv: 10, xp: 0 }]; pb.load.fill(null); const s0 = survOf(stats(curEq())); meta.mods.pflamme = 2; pb.load[0] = 'pflamme'; const s1 = survOf(stats(curEq()));
      meta.pets = [{ uid: 9, t: 'golem', rk: 3, lv: 10, xp: 0 }]; pb.load.fill(null); const g0 = survOf(stats(curEq())); meta.mods.pseisme = 2; pb.load[0] = 'pseisme'; const g1 = survOf(stats(curEq()));
      return { n: ids.length, v: [modVal('pmarque', 0, 0), modVal('pmarque', 2, 0), modVal('pseisme', 1, 0), modVal('pflamme', 1, 0), modVal('pmarque', 2, 5)], pw: [p1 > p0, p2 > p1], sv: [s1 > s0, g1 > g0],
        pt: ['pinst', 'pmarque', 'pseisme', 'pflamme'].map((k) => MODS[k].pt || '-'), echo: /50 %/.test(MODS.pecho.t(1)) };
    });
    t.eq(r.n, 18, '18 mods de familier');
    t.eq(r.v, [10, 20, .9, 15, 32], 'valeurs : Marque 10 à 20 % (32 % à 5 étoiles), Séisme 0,9 s et Flamme 15 % au rang 1');
    t.eq(r.pt, ['-', 'corbeau', 'golem', 'follet'], 'familier de chaque mod');
    t.ok(r.pw[0] && r.pw[1], 'Puissance : Marque et Instinct comptés');
    t.ok(r.sv[0] && r.sv[1], 'survie : Flamme protectrice et Séisme comptés');
    t.ok(r.echo, 'Écho élémentaire : texte des statuts à 50 %');
  } },
];
