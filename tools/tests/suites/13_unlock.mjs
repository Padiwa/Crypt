// Déblocages progressifs du Camp et des choix de mission ; compatibilité des anciennes sauvegardes.
import { newPage, campView, startMission, sleep, FIX } from '../lib.mjs';
import fs from 'fs';

export const tests = [
  { name: 'joueur neuf : onglets verrouillés avec leur condition, Survie et Normal seulement', fn: async (b, t) => {
    const p = t.track(await newPage(b, { locked: true }));
    await campView(p, 'mods');
    t.ok(await p.evaluate(() => !!document.querySelector('.lockc') && /Réussis 2 missions/.test($('campBody').textContent)), 'Mods : carte verrouillée et condition');
    t.eq(await p.evaluate(() => ['relics', 'mods', 'pets', 'forge'].map((k) => document.querySelector(`.tab[data-tab="${k}"]`).classList.contains('is-locked'))), [true, true, true, true], 'quatre onglets verrouillés');
    await campView(p, 'arsenal', 'recy');
    t.ok(await p.evaluate(() => !!document.querySelector('.lockc') && !document.querySelector('#invGrid')), 'Recyclage verrouillé');
    t.eq(await p.evaluate(() => ['defense', 'capture'].map((m) => document.querySelector(`.cx-pick[data-m="${m}"]`).getAttribute('aria-disabled'))), ['true', 'true'], 'Défense et Capture verrouillées');
    await p.evaluate(() => { closeCamp(); $('rowDiff').click(); });
    t.eq(await p.evaluate(() => [...document.querySelectorAll('#pickBody .cx-choice')].map((c) => c.classList.contains('is-locked'))), [false, true, true, true], 'seul Normal est ouvert');
    await p.evaluate(() => document.querySelector('#pickBody [data-pick="3"]').click());
    t.eq(await p.evaluate(() => meta.diff | 0), 0, 'Tourment refusé');
  } },
  { name: 'première mission réussie : Forge › Bonus et Familier, annoncés puis expliqués', fn: async (b, t) => {
    const p = t.track(await newPage(b, { locked: true }));
    await startMission(p);
    await p.evaluate(() => { G.tl = LEVEL_T; }); await p.waitForFunction(() => !$('extract').hidden, null, { timeout: 5000 });
    await p.click('#exitBtn'); await sleep(p, 300);
    t.ok(await p.evaluate(() => /Débloqué/.test($('relicTxt').textContent) && /Forge · Bonus/.test($('relicTxt').textContent) && /Familier/.test($('relicTxt').textContent)), 'annonce en fin de mission');
    await p.evaluate(() => { $('over').hidden = true; started = false; $('intro').hidden = false; });
    await campView(p, 'forge', 'up');
    t.ok(await p.evaluate(() => !!document.querySelector('.newc') && /Nouveau · Forge · Bonus/.test($('campBody').textContent)), 'carte Nouveau');
    t.ok(await p.evaluate(() => document.querySelector('.tab[data-tab="forge"] .cx-tab__badge') !== null), 'pastille sur l\'onglet');
    await p.click('[data-cact="unlok"][data-arg="bonus"]');
    t.ok(await p.evaluate(() => !meta.unlNew.includes('bonus') && !document.querySelector('.newc')), 'Compris : la carte disparaît');
    t.ok(await p.evaluate(() => document.querySelector('.tab[data-tab="mods"]').classList.contains('is-locked')), 'Mods toujours verrouillé');
  } },
  { name: 'déblocages suivants : niveau de mission, difficultés et paliers de Tourment', fn: async (b, t) => {
    const p = t.track(await newPage(b, { locked: true }));
    const r = await p.evaluate(() => {
      meta.wins = 3; meta.maxL = 12; unlockCheck(true);
      const a = ['mods', 'relics', 'fuse', 'defense', 'hmods', 'capture', 'diff1', 'affix'].map(isUnl), d2 = isUnl('diff2');
      meta.bestDiff = 2; unlockCheck(true); const t0 = tormMax(); meta.bestTorm = 4; const t1 = tormMax();
      return [a, d2, isUnl('diff3'), t0, t1];
    });
    t.eq(r, [[true, true, true, true, true, true, true, true], false, true, 1, 5], 'débloqués dans l\'ordre');
    await p.evaluate(() => { meta.diff = 3; meta.torm = 9; saveMeta(); refreshMenus(); });
    t.eq(await p.evaluate(() => meta.torm), 5, 'palier ramené au plus haut débloqué');
  } },
  { name: 'ancienne sauvegarde (avant les déblocages) : tout reste ouvert', fn: async (b, t) => {
    const p = t.track(await newPage(b, { locked: true }));
    const old = JSON.parse(fs.readFileSync(FIX('save_v90.json'), 'utf8'));
    await p.evaluate((m) => { localStorage.setItem('crypte-meta', JSON.stringify(m.meta || m)); }, old);
    await p.reload();
    t.ok(await p.evaluate(() => meta.unlAll === 1 && tormMax() === 10 && ['mods', 'relics', 'affix', 'diff3', 'givre'].every(isUnl)), 'tout débloqué');
    await campView(p, 'mods');
    t.ok(await p.evaluate(() => !document.querySelector('.lockc') && !document.querySelector('.newc')), 'ni verrou ni carte Nouveau');
  } },
  { name: 'Mods : les mods du héros arrivent après ceux de l\'arme', fn: async (b, t) => {
    const p = t.track(await newPage(b, { locked: true }));
    await p.evaluate(() => { meta.wins = 2; unlockCheck(true); saveMeta(); });
    await campView(p, 'mods');
    t.ok(await p.evaluate(() => modTab === 'w' && document.querySelector('[data-act="mtab"][data-t="h"]').classList.contains('is-locked')), 'build de l\'arme, héros verrouillé');
    t.ok(await p.evaluate(() => !/Alignement des cases/.test($('campBody').textContent)), 'alignement pas encore là');
  } },
];
