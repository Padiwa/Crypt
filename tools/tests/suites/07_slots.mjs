// Emplacements à débloquer : anneau 2 puis dos.
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'déblocage dans l\'ordre, coûts en harnais et en or', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.gold = 9000; meta.hfrag = 40; saveMeta(); });
    await campView(p, 'equip', 'gear:anneau2');
    t.ok(await p.evaluate(() => document.querySelector('[data-cact="slotopen"][data-arg="dos"]').disabled), 'dos fermé avant l\'anneau 2');
    await p.click('[data-cact="slotopen"][data-arg="anneau2"]');
    t.eq(await p.evaluate(() => [gearSlot, !!document.querySelector('.gslot[data-arg="anneau2"]:not(.gslot--lock)'), !!document.querySelector('[data-cact="slotopen"]')]), ['anneau2', true, false], 'anneau 2 ouvert : sa liste remplace le déblocage');
    await p.click('.gslot[data-arg="dos"]');
    await p.click('[data-cact="slotopen"][data-arg="dos"]');
    t.eq(await p.evaluate(() => [GEAR_KEYS().join(), meta.hfrag, meta.gold]), ['armure,amulette,bottes,anneau,anneau2,dos', 3, 2000], 'résultat');
    t.eq(await p.evaluate(() => [GEAR_KEYS('guerrier').join(), GEAR_KEYS('magicien').join()]), ['armure,amulette,bottes,anneau', 'armure,amulette,bottes,anneau'], 'v139 : les autres héros gardent leurs emplacements fermés');
  } },
  { name: 'deux anneaux différents, dos non équipable avant déblocage', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const d = rgItem('B11', 100), before = tgtKey(curEq(), d);
      meta.slotU[heroCls] = { anneau2: true, dos: true }; meta.gear.anneau2 = null; meta.gear.dos = null;
      meta.stash = [rgItem('L7', 100), rgItem('L8', 100), d];
      const plan = bestPlan(curEq(), meta.stash);
      return [before, !!plan.anneau && !!plan.anneau2 && plan.anneau !== plan.anneau2, plan.dos === d];
    });
    t.eq(r, [null, true, true], 'résultat');
  } },
];
