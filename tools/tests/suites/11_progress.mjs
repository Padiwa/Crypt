// Parcours du joueur nouveau, régénération (bonus et mod).
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'Parcours : étape 1 puis 2, masquer et réafficher', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await campView(p, 'equip');
    t.ok(await p.evaluate(() => tutStep() === 0 && !!document.querySelector('.tutc')), 'étape 1 affichée');
    await p.evaluate(() => { meta.wins = 1; for (const k of ['armure', 'amulette', 'bottes', 'anneau']) { const it = genItem(5); it.slot = k; meta.gear[k] = it; } saveMeta(); drawCamp(); });
    t.eq(await p.evaluate(() => tutStep()), 1, 'étape 2');
    await p.click('[data-cact="tutoff"]'); t.ok(await p.evaluate(() => !document.querySelector('.tutc')), 'masqué');
    await p.click('[data-cact="tuton"]'); t.ok(await p.evaluate(() => !!document.querySelector('.tutc')), 'réaffiché');
  } },
  { name: 'Régénération : bonus 1,5 % de la vie max (min 3), mod Second souffle', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'archer'; G.run = { regen: 1 }; const a = stats(curEq());
      G.run = { regen: 3, hp: 5 }; const c = stats(curEq());
      G.run = {}; const keep = allMods; allMods = () => ['souffle']; meta.mods.souffle = 3; const m = stats(curEq()); allMods = keep;
      return [Math.round(a.regen * 10) / 10, Math.round(c.regen * 10) / 10 >= Math.round(c.hp * .045 * 10) / 10 - .1, m.regen];
    });
    t.eq(r[0], 3, 'bonus rang 1 à faible vie = 3 PV/s'); t.ok(r[1], 'bonus rang 3 = 4,5 % de la vie'); t.eq(r[2], 6, 'mod rang 3 à faible vie = 6 PV/s');
  } },
];
