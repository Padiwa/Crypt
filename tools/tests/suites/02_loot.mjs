// Butin, raretés, armes, reliques par difficulté : règles d'équilibrage.
import { newPage } from '../lib.mjs';

export const tests = [
  { name: 'raretés : 1 à 7 affixes, butin limité à Rare', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.eq(await p.evaluate(() => RAR.map((r) => r.aff)), [1, 2, 3, 4, 5, 6, 7], 'affixes par rareté');
    const r = await p.evaluate(() => { let maxR = 0, bad = 0; for (let i = 0; i < 2000; i++) { const it = genItem(1 + (i % 200), i % 3); maxR = Math.max(maxR, it.r); if (Object.keys(it.aff).length !== it.r + 1) bad++; } return [maxR, bad]; });
    t.eq(r[0], 2, 'rareté max du butin'); t.eq(r[1], 0, 'nombre d\'affixes = rareté + 1');
  } },
  { name: 'objets des reliques : 4, 5, 6 et 6 + pouvoir', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.eq(await p.evaluate(() => ['L1', 'N1', 'S2', 'B2', 'B11'].map((id) => Object.keys(rgItem(id, 97).aff).length)), [4, 5, 6, 7, 7], 'affixes');
    t.ok(await p.evaluate(() => { const v = ['L1', 'N1', 'S2', 'B2'].map((id) => rgItem(id, 97).base.v); return v.every((x, i) => !i || x > v[i - 1]); }), 'base croissante avec la rareté');
    t.eq(await p.evaluate(() => Object.keys(RGEAR).length), 42, '8 + 8 + 12 + 14 objets de reliques (dont 4 de givre et 4 des sables)');
  } },
  { name: 'à niveau égal, une rareté plus haute est plus forte (médianes)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const med = await p.evaluate(() => {
      heroCls = 'archer'; const e0 = { arme: weaponItem('archer', 'a0'), armure: null, amulette: null, bottes: null, anneau: null }, base = itemScore(e0);
      const m = (a) => { a.sort((x, y) => x - y); return a[a.length >> 1]; }, out = [];
      for (let r = 0; r < 3; r++) { const a = []; for (let i = 0; i < 120; i++) { let it; do { it = genItem(97, r); } while (it.slot !== 'armure' || it.r !== r); a.push(itemScore({ ...e0, armure: it }) - base); } out.push(m(a)); }
      for (const r of [3, 4, 5, 6]) { const ids = Object.keys(RGEAR).filter((id) => RGEAR[id].r === r && RGEAR[id].slot === 'armure'); const a = []; for (let i = 0; i < 20; i++) for (const id of ids) a.push(itemScore({ ...e0, armure: rgItem(id, 97) }) - base); out.push(m(a)); }
      return out;
    });
    t.ok(med.every((v, i) => !i || v > med[i - 1]), 'médianes croissantes : ' + med.map(Math.round).join(' / '));
  } },
  { name: 'armes : 14 par héros, 2 par rareté, DPS sans chevauchement entre raretés', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const out = {};
      for (const c of ['archer', 'guerrier', 'magicien']) {
        heroCls = c; const by = {};
        for (const w of WPN[c]) { meta.built[w.id] = true; const d = dps(stats({ arme: weaponItem(c, w.id), armure: null, amulette: null, bottes: null, anneau: null })); (by[w.r] = by[w.r] || []).push(d); }
        out[c] = { n: WPN[c].length, per: Object.values(by).map((a) => a.length), ok: [0, 1, 2, 3, 4, 5].every((r) => Math.max(...by[r]) < Math.min(...by[r + 1])) };
      }
      return out;
    });
    for (const c in r) { t.eq(r[c].n, 14, c + ' : nombre d\'armes'); t.ok(r[c].per.every((n) => n === 2), c + ' : 2 par rareté'); t.ok(r[c].ok, c + ' : DPS croissant par rareté'); }
  } },
  { name: 'reliques selon la difficulté', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const roll = (d, tm, L = 50) => { meta.diff = d; meta.torm = tm; G.level = L; const c = {}; for (let i = 0; i < 2000; i++) { const x = ['os', 'an', 'sa', 'ab'][relicTierNow()]; c[x] = (c[x] || 0) + 1; } return c; };
      return [roll(0, 1), roll(2, 1), roll(3, 3), roll(3, 6), roll(3, 10), roll(3, 10, BAL.relicLv[0] - 1), roll(3, 10, BAL.relicLv[2] - 1), BAL.abyss];
    });
    t.eq(Object.keys(r[5]), ['os'], 'Tourment X sous le niveau des Ancestrales : Ossuaire');
    t.ok(!r[6].ab && r[6].sa > 0, 'Tourment X sous le niveau des Abyssales : pas d\'Abyssale');
    t.eq(Object.keys(r[0]), ['os'], 'Normal : Ossuaire'); t.eq(Object.keys(r[1]), ['os'], 'Cauchemar : Ossuaire');
    t.eq(Object.keys(r[2]), ['an'], 'Tourment III : Ancestrale');
    const ab6 = (r[3].ab || 0) / 2000, ab10 = (r[4].ab || 0) / 2000;
    const e6 = r[7][0], e10 = r[7][0] + 4 * r[7][1];
    t.ok(Math.abs(ab6 - e6) < .03, `Tourment VI : ~${Math.round(e6 * 100)} % Abyssale (${ab6})`); t.ok(Math.abs(ab10 - e10) < .04, `Tourment X : ~${Math.round(e10 * 100)} % Abyssale (${ab10})`);
  } },
  { name: 'armes tombées : classe du héros, rareté ≤ Rare', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => { heroCls = 'guerrier'; let bad = 0; for (let i = 0; i < 500; i++) { const q = rollPart(); const w = wdef(q.w); if (w.cls !== 'guerrier' || w.r > 2 || !q.full) bad++; } return bad; });
    t.eq(r, 0, 'armes hors règle');
  } },
];
