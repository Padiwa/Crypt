// Sorts et ultimes (v132) : 3 de chaque par héros, choisis dans Héros › Talents, ouverts par la maîtrise du héros (rangs 3 et 6).
// Chaque sort est lancé en mission sur des ennemis immortels, la boucle de jeu avancée image par image ; les statistiques doivent compter.
import { newPage, startMission, campView } from '../lib.mjs';

// Prépare une mission : maîtrise au rang 10, choix du kit, boucle arrêtée, 6 ennemis immortels autour du héros, coups notés dans __hits.
async function arena(p, cls, s, u) {
  await p.evaluate(([c, s, u]) => { meta.mast[c] = { r: 10, xp: 0 }; meta.kit = { [c]: { s, u } }; saveMeta(); }, [cls, s, u]);
  await startMission(p, { cls });
  await p.evaluate(() => {
    paused = true; G.en = []; G.spawns = []; G.bossT = 1e9; G.ult = 1e9; window.__en = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; spawnEnemy({ type: 'ghoul', x: G.P.x + Math.cos(a) * 110, y: G.P.y + Math.sin(a) * 110 }); const e = G.en[G.en.length - 1]; e.hp = e.max = 1e12; e.spd = 0; __en.push(e); }
    window.__hits = []; const f = dmgEnemy; window.dmgEnemy = (en, d, crit, dot) => { if (__en.includes(en) && !dot) __hits.push([d, !!crit]); return f(en, d, crit, dot); };
    window.__run = (n) => { for (let i = 0; i < n; i++) { G.en = G.en.filter((e) => __en.includes(e)); update(1 / 60); } };
  });
}

const KITS = { archer: [['volee', 'chasseur', 'recul'], ['pluie', 'faucon', 'tempete']], guerrier: [['tourbillon', 'bond', 'cri'], ['titan', 'rempart', 'berserk']], magicien: [['nova', 'eclair', 'transfert'], ['meteores', 'blizzard', 'surcharge']] };

export const tests = [
  { name: 'choix du sort et de l\'ultime : 2e au rang 3 de maîtrise, 3e au rang 6, gardé par héros (v132)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { heroCls = 'archer'; meta.mast.archer = { r: 2, xp: 0 }; saveMeta(); });
    await campView(p, 'equip', 'tal');
    t.eq(await p.evaluate(() => [...document.querySelectorAll('#campBody .kitc')].map((x) => x.disabled)), [false, true, true, false, true, true], 'rang 2 : seuls les sorts d\'origine');
    await p.evaluate(() => { meta.mast.archer.r = 3; drawCamp(); });
    t.eq(await p.evaluate(() => [...document.querySelectorAll('#campBody .kitc')].map((x) => x.disabled)), [false, false, true, false, false, true], 'rang 3 : le 2e de chaque');
    await p.click('#campBody .kitc[data-arg="s|1"]'); await p.click('#campBody .kitc[data-arg="u|1"]');
    t.eq(await p.evaluate(() => [kitOf('archer'), kitS('archer').n, kitU('archer').n, kitOf('guerrier')]), [{ s: 1, u: 1 }, 'Tir du chasseur', 'Œil du faucon', { s: 0, u: 0 }], 'choix gardé pour l\'Archer seulement');
    t.ok(await p.evaluate(() => document.querySelector('#campBody .kitc[data-arg="s|1"]').classList.contains('is-on')), 'carte choisie mise en avant');
    await p.evaluate(() => { meta.kit.archer.s = 2; }); // un choix encore verrouillé revient au sort d'origine
    t.eq(await p.evaluate(() => kitOf('archer').s), 0, 'choix verrouillé : sort d\'origine');
  } },
  ...Object.entries(KITS).map(([cls, [ss, us]]) => ({ name: `${cls} : les 3 sorts et les 3 ultimes se lancent et font effet (v132)`, fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p, cls, 0, 0);
    for (let i = 0; i < 3; i++) {
      const r = await p.evaluate(([i, k]) => {
        G.kit = { s: i, u: 0 }; G.P.novaCd = 0; G.P.x = G.P.x; __hits = []; const P = G.P;
        for (const e of __en) { e.x = P.x + (e.x - P.x) * 0 + Math.cos(__en.indexOf(e)) * 110; e.y = P.y + Math.sin(__en.indexOf(e)) * 110; e.kx = e.ky = 0; e.slow = 0; }
        doNova(); const cd = P.novaMax; __run(90);
        return { k: SPELLS[G.cls].s[i].k === k, hits: __hits.length, cri: P.criT > 0 || null, cd, base: SPELLS[G.cls].s[i].cd * (1 - S.cdr / 100) };
      }, [i, ss[i]]);
      t.ok(r.k, `${ss[i]} : bon sort`);
      t.ok(r.hits > 0 || r.cri, `${ss[i]} : touche les ennemis ou renforce le héros (${r.hits} coups)`);
      t.ok(Math.abs(r.cd - r.base) < 1e-6, `${ss[i]} : recharge ${r.cd} pour ${r.base}`);
    }
    for (let i = 0; i < 3; i++) {
      const r = await p.evaluate(([i]) => {
        const P = G.P; for (const k of ['hawkT', 'berT', 'surT', 'criT', 'wallT', 'stormT', 'blizT', 'rain', 'meteors']) P[k] = 0; refreshStats();
        G.kit = { s: 0, u: i }; G.ult = 1e9; __hits = []; const aps0 = S.aps, dmg0 = S.dmg; P.shield = 0;
        doUlt(); const buff = { aps: S.aps / aps0, dmg: S.dmg / dmg0, shield: P.shield, hawk: P.hawkT, ber: P.berT, sur: P.surT, wall: P.wallT };
        __run(150); return { buff, hits: __hits.length };
      }, [i]);
      const ok = r.hits > 0 || r.buff.aps > 1.5 || r.buff.shield > 0;
      t.ok(ok, `${us[i]} : touche ou renforce (${r.hits} coups, ${JSON.stringify(r.buff)})`);
    }
  } })),
  { name: 'les statistiques comptent : dégâts et portée des compétences, durée, recharge, dégâts de l\'ultime, critiques (v132)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await arena(p, 'archer', 1, 2);
    const r = await p.evaluate(() => {
      const P = G.P, out = {};
      // Tir du chasseur : 160 % des dégâts de compétence, critique = × dégâts critiques
      S.crit = 0; __hits = []; P.novaCd = 0; doNova(); __run(30); out.ch = __hits[0] && __hits[0][0] / S.nova;
      S.crit = 100; S.critDmg = 250; __hits = []; P.novaCd = 0; doNova(); __run(30); out.chCrit = __hits[0] && [__hits[0][0] / S.nova, __hits[0][1]];
      // Recharge : × (1 − réduction de recharge)
      S.cdr = 40; P.novaCd = 0; doNova(); out.cd = P.novaMax;
      // Tempête de carreaux : 30 % × (1 + dégâts de l'ultime)
      S.crit = 0; S.ultPct = 50; G.shots = []; __hits = []; G.ult = 1e9; doUlt(); __run(40); out.storm = __hits[0] && __hits[0][0] / S.nova;
      return out;
    });
    t.ok(Math.abs(r.ch - 1.6) < 1e-6, `Tir du chasseur : 160 % (${r.ch})`);
    t.ok(r.chCrit && r.chCrit[1] && Math.abs(r.chCrit[0] - 4) < 1e-6, `critique : 160 % × 250 % (${r.chCrit})`);
    t.ok(Math.abs(r.cd - 6 * .6) < 1e-6, `recharge 6 s × 0,6 (${r.cd})`);
    t.ok(Math.abs(r.storm - .45) < 1e-6, `Tempête : 30 % × 1,5 (${r.storm})`);
    const q = t.track(await newPage(b));
    await arena(q, 'guerrier', 2, 1);
    const g = await q.evaluate(() => {
      const P = G.P, out = {};
      // Cri de guerre : 6 s × (1 + durée des compétences), dégâts +30 %, dégâts subis −30 %
      S.skillDur = 50; const d0 = S.dmg; P.novaCd = 0; doNova(); out.cri = [P.criT, S.dmg / d0];
      // Rempart : bouclier 60 % de la vie × (1 + dégâts de l'ultime)
      S.ultPct = 50; G.ult = 1e9; P.shield = 0; doUlt(); out.wall = P.shield / S.hp;
      return out;
    });
    t.ok(Math.abs(g.cri[0] - 9) < 1e-6 && g.cri[1] > 1.2 && g.cri[1] < 1.3 + 1e-9, `Cri de guerre : 9 s et +30 % de dégâts, ajoutés aux autres bonus de dégâts (${g.cri})`);
    t.ok(Math.abs(g.wall - .9) < 1e-6, `Rempart : 60 % × 1,5 (${g.wall})`);
    const m = t.track(await newPage(b));
    await arena(m, 'magicien', 1, 1);
    const mg = await m.evaluate(() => {
      const P = G.P, out = {};
      // Blizzard : rayon 320 × (1 + portée des compétences) ; un ennemi à 400 px n'est touché qu'avec +50 %
      const e = __en[0]; for (const o of __en.slice(1)) { o.x = P.x + 2000; o.y = P.y; } e.x = P.x + 400; e.y = P.y;
      S.skillRad = 0; __hits = []; G.ult = 1e9; doUlt(); ultTick(.01); out.far = __hits.length; P.blizT = 0;
      S.skillRad = 50; __hits = []; G.ult = 1e9; doUlt(); ultTick(.01); out.near = __hits.length; P.blizT = 0;
      // Éclair en chaîne : dégâts de compétence +100 % → coup doublé
      e.x = P.x + 100; S.crit = 0; S.skillRad = 0; __hits = []; P.novaCd = 0; doNova(); const a = __hits[0][0];
      const n0 = S.nova; S.nova = n0 * 2; __hits = []; P.novaCd = 0; doNova(); out.eclair = __hits[0][0] / a;
      return out;
    });
    t.eq([mg.far, mg.near], [0, 1], 'Blizzard : la portée des compétences agrandit le rayon');
    t.ok(Math.abs(mg.eclair - 2) < 1e-6, `Éclair en chaîne : dégâts de compétence ×2 (${mg.eclair})`);
  } },
];
