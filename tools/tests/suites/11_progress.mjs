// Parcours du joueur nouveau, régénération (bonus et mod).
import { newPage, campView, closeCamp } from '../lib.mjs';

export const tests = [
  { name: 'Parcours : étape 1 puis 2, masquer et réafficher', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.ok(await p.evaluate(() => tutStep() === 0 && !$('tutBtn').hidden && /Parcours 1/.test($('tutBtn').textContent)), 'étape 1 : bandeau sur l\'accueil');
    await p.click('#tutBtn');
    t.ok(await p.evaluate(() => !!document.querySelector('#pickBody .tutc') && document.querySelectorAll('#pickBody .tutrack li').length === 6), 'feuille du parcours : 6 étapes et la carte');
    await p.evaluate(() => closePick());
    await p.evaluate(() => { meta.wins = 1; for (const k of ['armure', 'amulette', 'bottes', 'anneau']) { const it = genItem(5); it.slot = k; meta.gear[k] = it; } saveMeta(); refreshMenus(); });
    t.eq(await p.evaluate(() => [tutStep(), /Parcours 2/.test($('tutBtn').textContent)]), [1, true], 'étape 2');
    await p.click('#tutBtn'); await p.click('#pickBody [data-cact="tutoff"]'); t.ok(await p.evaluate(() => $('tutBtn').hidden && $('pickSheet').hidden), 'masqué');
    await campView(p, 'equip');
    await p.click('[data-cact="tuton"]'); await closeCamp(p); t.ok(await p.evaluate(() => !$('tutBtn').hidden), 'réaffiché');
  } },
  { name: 'Régénération : bonus 1,5 % de la vie max (min 3) ; le mod Second souffle n\'existe plus (v142)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'archer'; G.run = { regen: 1 }; const a = stats(curEq());
      G.run = { regen: 3, hp: 5 }; const c = stats(curEq()); G.run = {};
      return [Math.round(a.regen * 10) / 10, Math.round(c.regen * 10) / 10 >= Math.round(c.hp * .045 * 10) / 10 - .1, 'souffle' in MODS];
    });
    t.eq(r[0], 3, 'bonus rang 1 à faible vie = 3 PV/s'); t.ok(r[1], 'bonus rang 3 = 4,5 % de la vie'); t.eq(r[2], false, 'Second souffle retiré');
  } },
];
