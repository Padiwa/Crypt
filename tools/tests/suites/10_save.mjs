// Sauvegarde : export fichier, import fichier, JSON collé, ancienne version (v90).
import fs from 'fs';
import os from 'os';
import path from 'path';
import { newPage, FIX, sleep } from '../lib.mjs';

const snap = (p) => p.evaluate(() => JSON.stringify({ gold: meta.gold, ess: meta.essence, maxL: meta.maxL, slotU: meta.slotU, hfrag: meta.hfrag, wcp: meta.wcp, wlv: meta.wlv, built: meta.built, parts: meta.parts, relics: meta.relics, relicQ: meta.relicQ, wins: meta.wins, tutOff: meta.tutOff,
  stash: meta.stash.map((i) => [i.name, i.r, i.up | 0, i.lvl, i.rid || '', i.lock || false]), gear: Object.fromEntries(Object.entries(meta.gear).map(([k, v]) => [k, v && [v.name, v.up | 0]])), wpn: meta.wpn }));

async function importFile(b, t, file) {
  const q = t.track(await newPage(b));
  await q.click('#setBtn'); await q.click('[data-cact="impopen"]'); await q.setInputFiles('#saveFile', file); await sleep(q, 250);
  await q.click('[data-cact="impok"]'); await q.waitForLoadState('load'); await sleep(q, 600);
  return q;
}

export const tests = [
  { name: 'export puis import par fichier : identique', fn: async (b, t) => {
    const p = t.track(await newPage(b, { downloads: true }));
    await p.evaluate(() => { meta.gold = 4321; meta.essence = 765; meta.maxL = 27; meta.slotU = { anneau2: true }; meta.hfrag = 7; meta.built.a3 = true; meta.wlv.a3 = 2; meta.wcp.a3 = [0, 1];
      meta.parts = { L3: [1, 0, 1] }; meta.relics = { os: [3, 1], F_a4: [1, 0] }; meta.relicQ = [{ id: 'os', rad: true }]; meta.wins = 12; meta.tutOff = true;
      const r1 = rgItem('L7', 100); r1.up = 3; meta.gear.anneau = r1; meta.gear.anneau2 = rgItem('L8', 100); meta.stash.push(rgItem('B11', 100)); meta.stash[0].lock = true; saveMeta(); });
    const before = await snap(p);
    await p.click('#setBtn'); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-cact="exp"]')]);
    const f = path.join(os.tmpdir(), 'crypte-test-save.json'); await dl.saveAs(f);
    const q = await importFile(b, t, f);
    t.eq(await snap(q), before, 'sauvegarde après réimport');
  } },
  { name: 'import en collant le JSON : identique', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.gold = 77; meta.stash.push(rgItem('N3', 50)); saveMeta(); });
    const before = await snap(p), code = await p.evaluate(() => exportCode());
    const q = t.track(await newPage(b));
    await q.click('#setBtn'); await q.click('[data-cact="impopen"]'); await q.fill('#saveIn', code); await q.click('[data-cact="imp"]'); await sleep(q, 150);
    await q.click('[data-cact="impok"]'); await q.waitForLoadState('load'); await sleep(q, 600);
    t.eq(await snap(q), before, 'sauvegarde après collage');
  } },
  { name: 'sauvegarde de la v90 : migration automatique', fn: async (b, t) => {
    const q = await importFile(b, t, FIX('save_v90.json'));
    const r = await q.evaluate(() => ({ v5: meta.v5, prime: meta.stash.some((i) => i.type === 'Prime'), ups: meta.stash.map((i) => i.up | 0), wlv: meta.wlv, rel: Object.keys(meta.relics).sort(), parts: Object.keys(meta.parts) }));
    t.eq(r.v5, 1, 'migration faite'); t.ok(!r.prime, 'objets Prime retirés'); t.ok(r.ups.every((u) => u <= 9), 'rangs ≤ 10');
    t.ok(Object.values(r.wlv).every((u) => u <= 9), 'rangs d\'armes'); t.ok(r.rel.every((id) => ['os', 'an', 'sa', 'ab'].includes(id) || id.startsWith('F_')), 'reliques converties : ' + r.rel);
    for (const tab of ['equip', 'arsenal', 'relics', 'forge']) await q.evaluate((x) => { $('camp').hidden = false; campTab = x; drawCamp(); }, tab);
  } },
];
