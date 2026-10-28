// v142 : mods de héros refaits (sort, esquive, potion, ultime) et auras (Terreur remplace Ferveur) ; conversion des anciens mods de héros.
import { newPage, startMission, campView } from '../lib.mjs';

// Mission arrêtée, sans ennemis, le héros n'attaque pas. __set force des statistiques (gardées à chaque image), __mk crée un ennemi.
// hash '#n' : héros mortel (pour mesurer les dégâts reçus).
async function arena(p, cls = 'archer') {
  await startMission(p, { cls });
  await p.evaluate(() => {
    paused = true; G.en = []; G.spawns = []; G.bossT = 1e9;
    const Z = { psnCh: 0, bldCh: 0, chill: 0, shock: 0, stunCh: 0, rootCh: 0, burn: 0, curse: 0, frz: 0, contag: 0, stDur: 0, critSt: 0, cdSt: 0, dotPct: 0, thorns: 0, ccDmg: 0, cata: 0, crit: 0, cold: 0, execute: 0, lowDmg: 0, bossDmg: 0, lowArmor: 0, armor: 0,
      flux: 0, intSt: 0, impr: 0, comm: 0, gardA: 0, elan: 0, peau: 0, pasEl: 0, ripo: 0, econ: 0, exFer: 0, exRage: 0, buffDur: 0, rema: 0, flea: 0, terr: 0 };
    window.__set = (o) => { window.__ov = { ...Z, ...o }; Object.assign(S, __ov); };
    window.__mk = (type = 'ghoul', dx = 260, dy = 0) => { spawnEnemy({ type, x: G.P.x + dx, y: G.P.y + dy }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e9; e.spd = 0; return e; };
    window.__run = (n) => { for (let i = 0; i < n; i++) { Object.assign(S, __ov); G.P.fire = 1e9; update(1 / 60); } };
    __set({});
  });
}

export const tests = [
  { name: 'conversion des anciens mods de héros : remboursés, ramenés au nouveau maximum, Ferveur devient Terreur (v142)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      const m = JSON.parse(localStorage.getItem('crypte-meta')); m.modV = 1; delete m.modNote; m.essence = 0;
      m.mods = { venin: 0, vitalite: 4, egide: 1, souffle: 2, intensite: 3, etendue: 5, persist: 1, ferveur: 3, presence: 3 }; m.modSt = { vitalite: 2 }; m.modCp = { vitalite: 1 };
      m.hload = { archer: ['vitalite', 'intensite', 'etendue', 'souffle', null, null] }; m.aura = { archer: 'ferveur', guerrier: 'presence' };
      m.sets = { archer: [{ n: 'A', hm: ['egide', 'persist', null], au: 'ferveur' }] };
      localStorage.setItem('crypte-meta', JSON.stringify(m));
    });
    await p.reload();
    const r = await p.evaluate(() => ({ mods: meta.mods, h: meta.hload.archer.slice(0, 4), au: meta.aura, set: meta.sets.archer[0], note: meta.modNote, ess: meta.essence, v: meta.modV }));
    t.eq([r.mods.vitalite, r.mods.egide, r.mods.souffle, r.mods.intensite, r.mods.etendue, r.mods.persist, r.mods.terreur, r.mods.presence, r.mods.ferveur], [undefined, undefined, undefined, 2, 4, 1, 2, 2, undefined], 'mods remboursés, rangs ramenés au maximum, Ferveur → Terreur');
    t.eq([r.h, r.au.archer, r.au.guerrier], [[null, 'intensite', 'etendue', null], 'terreur', 'presence'], 'build du héros et auras');
    t.eq([r.set.hm.slice(0, 2), r.set.au], [[null, 'persist'], 'terreur'], 'équipement enregistré converti');
    t.eq([r.note.conv, r.note.ref, r.note.h, r.v], [5, 3, 1, 2], 'message : 5 gardés ou renommés, 3 remboursés');
    // Vitalité rang 4, 2 étoiles, 1 copie : 10 × (1+2+4+8) + 50 × (1+2) + 8 ; Égide 10 ; Second souffle 10 + 20 ; Intensité rang 3 → 2 : 40 ; Étendue 5 → 4 : 20 × 16 ; Ferveur 3 → 2 : 30 × 4 ; Présence 3 → 2 : 30 × 4
    t.eq(r.ess, 150 + 150 + 8 + 10 + 30 + 40 + 320 + 120 + 120, 'essence rendue');
    await campView(p, 'mods');
    t.ok(await p.evaluate(() => /Mods revus/.test($('campBody').textContent) && /capacités/.test($('campBody').textContent)), 'carte du message');
  } },
  { name: 'sort : Flux, Intensité, Imprégnation (plafonds gardés), Commotion, Garde arcanique (v142)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p, 'magicien');
    const r = await p.evaluate(() => {
      const out = {}, P = G.P;
      // Flux : 0,6 s par ennemi abattu par le sort, 2 s au plus par lancer
      __set({ flux: .6 }); for (let i = 0; i < 6; i++) { const e = __mk('ghoul', 60 + i * 5, 0); e.hp = e.max = 1; } P.novaCd = 0; doNova(); out.flux = +(skCd(SPELLS.magicien.s[0]) - P.novaCd).toFixed(2);
      G.en = []; P.novaCd = 0;
      // Intensité : +40 % contre un ennemi qui porte un statut
      __set({ intSt: 40 }); const e = __mk('ghoul', 80, 0); const h0 = e.hp; spellHit(e, 100, false); const a = Math.round(h0 - e.hp); e.psnT = 2; e.psnN = 1; e.psnS = 0; const h1 = e.hp; spellHit(e, 100, false); out.int = [a, Math.round(h1 - e.hp)];
      // Imprégnation ×2,5 : 30 % devient 60 % (plafond), seulement pour le sort
      const rnd = Math.random; __set({ psnCh: 30, impr: 2.5 }); e.psnT = 0; e.psnN = 0;
      Math.random = () => .59; spellHit(e, 10, false); const s1 = e.psnN; e.psnT = 0; e.psnN = 0;
      Math.random = () => .61; spellHit(e, 10, false); const s2 = e.psnN; e.psnT = 0; e.psnN = 0;
      Math.random = () => .59; hitE(e, 10, false); const s3 = e.psnN; Math.random = rnd; out.impr = [s1, s2, s3];
      // Commotion : le sort étourdit
      __set({ comm: .6 }); const c = __mk('ghoul', -80, 0); spellHit(c, 1, false); out.comm = +c.stun.toFixed(2);
      // Garde arcanique : bouclier de 16 % pendant 4 s, total plafonné à 50 % de la vie
      G.en = []; __set({ gardA: 16 }); P.shield = 0; P.novaCd = 0; doNova(); const g1 = Math.round(P.shield / S.hp * 100);
      P.shield = S.hp * .45; P.novaCd = 0; doNova(); const g2 = Math.round(P.shield / S.hp * 100);
      P.shield = S.hp * .16; P.gaS = S.hp * .16; P.gaT = .05; __run(10); out.garde = [g1, g2, Math.round(P.shield)];
      return out;
    });
    t.eq(r.flux, 2, 'Flux : 6 ennemis abattus, 2 s retirées (plafond)');
    t.eq(r.int, [100, 140], 'Intensité : +40 % contre un ennemi empoisonné');
    t.eq(r.impr, [1, 0, 0], 'Imprégnation : chance du sort × 2,5 plafonnée à 60 % ; pas sur une attaque');
    t.eq(r.comm, .6, 'Commotion : étourdi 0,6 s');
    t.eq(r.garde, [16, 50, 0], 'Garde arcanique : 16 %, plafond 50 %, retiré après 4 s');
  } },
  { name: 'esquive : Élan, Seconde peau, Pas élémentaire, Riposte ; potion : Économe, Élixir de fer, Élixir de rage (v142)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#n' }));
    await arena(p, 'guerrier');
    const r = await p.evaluate(() => {
      const out = {}, P = G.P;
      __set({ elan: 40, peau: 50, pasEl: 100, ripo: .7, psnCh: 50 });
      const e = __mk('ghoul', 30, 0); P.dashCd = 0; doDash(); out.flags = [+P.elanT.toFixed(1), +P.peauT.toFixed(1), P.ripoN];
      // Pas élémentaire : l'esquive traverse l'ennemi et pose ses statuts (chance × 100 %)
      const rnd = Math.random; Math.random = () => .4; P.x = e.x; P.y = e.y; __run(1); Math.random = rnd; out.pas = e.psnN > 0;
      // Seconde peau : −50 % pendant 1,5 s ; puis plus
      P.inv = 0; P.dashT = 0; P.hp = S.hp; let hp = P.hp; hurt(100); out.peau = Math.round(hp - P.hp); P.peauT = 0; P.inv = 0; hp = P.hp; hurt(100); out.sans = Math.round(hp - P.hp);
      // Riposte : le coup suivant étourdit
      const f = __mk('ghoul', -60, 0); hitE(f, 1, false); out.ripo = [+f.stun.toFixed(2), P.ripoN];
      // potion
      __set({ econ: 50, exFer: 30, exRage: 8.5 }); G.potions = 2; G.ult = 0; P.hp = 1; Math.random = () => .3; doPotion(); const keep = G.potions; Math.random = () => .9; P.hp = 1; doPotion(); Math.random = rnd;
      out.pot = [keep, G.potions, +P.ferT.toFixed(1), Math.round(G.ult)];
      P.inv = 0; P.hp = S.hp; hp = P.hp; hurt(100); out.fer = Math.round(hp - P.hp);
      return out;
    });
    t.eq(r.flags, [2, 1.5, 1], 'esquive : Élan 2 s, Seconde peau 1,5 s, Riposte prête');
    t.ok(r.pas, 'Pas élémentaire : poison posé en traversant');
    t.eq([r.peau, r.sans], [50, 100], 'Seconde peau : moitié des dégâts');
    t.eq(r.ripo, [.7, 0], 'Riposte : étourdit 0,7 s, une fois');
    t.eq(r.pot, [2, 1, 4, 16], 'Économe : potion gardée ; Élixir de fer 4 s ; Élixir de rage +8 deux fois');
    t.eq(r.fer, 70, 'Élixir de fer : −30 %');
  } },
  { name: 'ultime : Âme ardente, Prolongement, Rémanence, Fléau ; aura Terreur (v142)', fn: async (b, t) => {
    const p = t.track(await newPage(b, { hash: '#n' }));
    await arena(p, 'archer');
    const r = await p.evaluate(() => {
      const out = {}, P = G.P;
      __set({ fury: 15 }); out.need = ultNeed();
      // Œil du faucon : 6 s × 1,3 ; Rémanence : 35 % de la jauge revient
      G.kit = { s: 0, u: 1 }; __set({ buffDur: 30, rema: 35 }); const nd = ultNeed(); G.ult = nd; doUlt(); out.ult = [+P.hawkT.toFixed(1), Math.round(G.ult / nd * 100)];
      // Fléau : statuts de l'ultime × 2
      const rnd = Math.random; __set({ psnCh: 20, flea: 2 }); const e = __mk('ghoul', 100, 0); Math.random = () => .39; G.inUlt = 1; spellHit(e, 10, false); G.inUlt = 0; const u = e.psnN; e.psnN = 0; e.psnT = 0; spellHit(e, 10, false); Math.random = rnd; out.flea = [u, e.psnN];
      // Terreur : contact d'un ennemi proche −15 %
      __set({ terr: 15 }); G.en = []; const g = __mk('ghoul', 0, 0); g.dmg = 100; g.hitCd = 0; P.inv = 0; P.hp = S.hp; const hp = P.hp; __run(1); out.terr = Math.round(hp - P.hp);
      return out;
    });
    t.eq(r.need, 34, 'Âme ardente : jauge de 40 → 34');
    t.eq(r.ult, [7.8, 35], 'Prolongement : 7,8 s ; Rémanence : 35 % de la jauge revient');
    t.eq(r.flea, [1, 0], 'Fléau : chance doublée pour l\'ultime seulement');
    t.eq(r.terr, 85, 'Terreur : 15 % de dégâts en moins au contact');
  } },
  { name: 'mods de héros : valeurs, rangs, étoiles, Puissance et fiche (v142)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const ids = Object.keys(MODS).filter((id) => modKind(id) === 'h'), au = Object.keys(MODS).filter((id) => modKind(id) === 'a');
      heroCls = 'magicien'; meta.mods.intensite = 2; meta.mods.impregnation = 2; meta.mods.elixrage = 1; const bh = build('h'); bh.load.fill(null); bh.load[0] = 'intensite';
      const p0 = power(stats(curEq())); bh.load[1] = 'impregnation'; meta.mods.venin = 4; build('w').load[0] = 'venin'; const p1 = power(stats(curEq()));
      return { n: ids.length, au, gone: ['vitalite', 'egide', 'pas', 'souffle', 'rapace', 'dernier', 'survivant', 'antidote', 'ferveur'].filter((k) => MODS[k]), v: [modVal('intensite', 2, 0), modVal('impregnation', 2, 0), modVal('elixrage', 1, 0), modVal('commotion', 0, 0)],
        star: ['impregnation', 'remanence', 'fleau', 'garde'].map(modCanStar), more: p1 > p0, rows: statRows(stats(curEq())).includes('Sort contre un statut') };
    });
    t.eq([r.n, r.au], [20, ['presence', 'terreur', 'cupidite']], '20 mods de héros, 3 auras');
    t.eq(r.gone, [], 'anciens mods de survie retirés');
    t.eq(r.v, [60, 2.5, 8.5, .4], 'valeurs : Intensité 60 %, Imprégnation × 2,5, Élixir de rage 8 (affiché entier), Commotion 0,4 s');
    t.eq(r.star, [false, false, false, true], 'Imprégnation, Rémanence et Fléau ne se surchargent pas');
    t.ok(r.more && r.rows, 'Puissance et fiche comptent les nouveaux mods');
  } },
];
