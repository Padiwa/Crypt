// Interface (v124 à v130) : palier de Tourment et en-tête du Camp sur téléphone étroit, sous-onglets de la Forge, écran de fusion de 320 à 430 px, barre des onglets.
import { newPage, campView, openMission, startMission } from '../lib.mjs';

export const tests = [
  { name: 'montée de niveau : les bonus les uns sous les autres, nom et texte entiers, de 320 à 430 px (v134)', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) {
      const p = t.track(await newPage(b, { w, h: w < 360 ? 640 : 844 }));
      await startMission(p);
      await p.evaluate(() => { G.run.multi = 1; G.run.dmg = 2; G.pend = 1; showLevelUp(); });
      await p.waitForFunction(() => !$('lvlup').hidden);
      const r = await p.evaluate(() => { const C = [...document.querySelectorAll('#choices .choice')].map((c) => c.getBoundingClientRect()), sh = document.querySelector('#lvlup .sheet').getBoundingClientRect();
        const cut = [...document.querySelectorAll('#choices .choice b, #choices .choice p')].some((e) => e.scrollWidth > e.clientWidth + 1);
        return { n: C.length, stacked: C.every((c, i) => !i || c.top >= C[i - 1].bottom), wide: C.every((c) => c.width > sh.width * .8), cut, fits: sh.bottom <= innerHeight + 1 && sh.top >= -1 }; });
      t.eq(r, { n: 3, stacked: true, wide: true, cut: false, fits: true }, `${w} px`);
    }
  } },
  { name: 'palier de Tourment : le − et le + restent visibles et utilisables de 320 à 430 px', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) {
      const p = await newPage(b, { w, h: 760 });
      await p.evaluate(() => { meta.diff = 3; meta.torm = 5; meta.bestTorm = 9; saveMeta(); refreshMenus(); });
      await openMission(p);
      t.ok(await p.evaluate(() => { const q = (id) => $(id).getBoundingClientRect(); return !$('tormRow').hidden && q('tormPlus').right <= innerWidth && q('tormMinus').width >= 32 && $('tormVal').textContent === 'V'; }), `${w} px : palier V sur l'écran Mission, − et + visibles`);
      await p.click('#tormPlus'); t.eq(await p.evaluate(() => meta.torm), 6, `${w} px : + de l'écran Mission`);
      await p.click('#tormMinus');
      await p.click('#rowDiff');
      const r = await p.evaluate(() => {
        const st = document.querySelector('#pickBody .cx-stepper'), q = (e) => e.getBoundingClientRect(), S = q(st);
        const inside = (e) => { const x = q(e); return x.left >= S.left - .5 && x.right <= S.right + .5 && x.right <= innerWidth && x.width >= 32; };
        return [inside(st.querySelector('[data-torm="-1"]')), inside(st.querySelector('[data-torm="1"]'))];
      });
      t.eq(r, [true, true], `${w} px : − et + entiers dans le sélecteur`);
      await p.click('#pickBody [data-torm="1"]');
      t.eq(await p.evaluate(() => meta.torm), 6, `${w} px : + monte au palier VI`);
      await p.ctx.close();
    }
  } },
  { name: 'Camp : l\'aide reste dans l\'écran, montants courts dans l\'en-tête, l\'onglet Combat ramène à l\'accueil', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) {
      const p = await newPage(b, { w, h: 760 });
      const r = await p.evaluate(() => {
        meta.gold = 30500000; meta.essence = 254321; saveMeta(); refreshMenus(); openCamp(); campTab = 'forge'; drawCamp();
        const R = (id) => $(id).getBoundingClientRect(), g = $('campGold');
        return [R('campHelp').right <= innerWidth, document.querySelector('#tabbar [data-nav="coll"]').getBoundingClientRect().right <= innerWidth, g.scrollWidth <= g.clientWidth + 1, g.textContent.replace(/\s/g, ' '), R('campGold').right <= R('campHelp').left];
      });
      t.eq(r, [true, true, true, '30,5 M254 k', true], `${w} px : en-tête entier, barre des onglets dans l'écran`);
      await p.click('#tabbar [data-nav="combat"]');
      t.ok(await p.evaluate(() => $('camp').hidden && !$('intro').hidden), `${w} px : l'onglet Combat ramène à l'accueil`);
      await p.ctx.close();
    }
    t.eq(await (async () => { const p = await newPage(b); const v = await p.evaluate(() => [fmtBig(98765), fmtBig(123456), fmtBig(5999999), fmtBig(30500000)].map((s) => s.replace(/\s/g, ' '))); await p.ctx.close(); return v; })(), ['98 765', '123 k', '5,9 M', '30,5 M'], 'montants courts, arrondis vers le bas');
  } },
  { name: 'Forge : sous-onglets Affixes, Fusion, Bonus, Sceaux ; Tout fusionner par rareté (v130)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.gold = 5e6; meta.stash = [];
      const mk = (r, n) => { for (let i = 0; i < n; i++) { const it = genItem(30, r); Object.assign(it, { r, slot: 'armure', type: 'Cuirasse', name: 'Cuirasse' }); meta.stash.push(it); } };
      mk(1, 2); mk(2, 2); meta.stash.push(rgItem('L1', 40), rgItem('L1', 40), rgItem('S2', 50), rgItem('S2', 50)); saveMeta();
    });
    await campView(p, 'forge', 'fuse');
    t.eq(await p.evaluate(() => [...document.querySelectorAll('[data-cact="fsub"]')].map((x) => x.textContent.replace(/\d+$/, '').trim())), ['Affixes', 'Fusion', 'Bonus', 'Sceaux'], 'sous-onglets : Affixes, Fusion, Bonus, Sceaux');
    t.eq(await p.evaluate(() => [document.querySelector('[data-cact="fsub"][aria-selected="true"]').dataset.arg, document.querySelectorAll('[data-cact="afmode"]').length]), ['fuse', 0], 'Fusion choisie, plus de puces de mode');
    await p.click('[data-cact="fzr"][data-arg="5"]'); await p.click('[data-cact="fzr"][data-arg="3"]');
    // le prix et le nombre se calculent juste après l'affichage du pied (« calcul du coût… ») : on attend la fin du calcul
    await p.waitForFunction(() => !/calcul du coût/.test($('campFoot').textContent), null, { timeout: 5000 }).catch(() => {});
    t.ok(await p.evaluate(() => /Fusionner ces raretés · 2/.test($('campFoot').textContent)), 'pied : « Fusionner ces raretés · 2 »');
    await p.click('[data-cact="fuseall"]');
    const r = await p.evaluate(() => meta.stash.map((i) => [i.r, i.up | 0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]));
    t.eq(r, [[1, 0], [1, 0], [2, 0], [2, 0], [3, 1], [5, 1]], 'seuls le Légendaire et le Sanguin ont fusionné');
    await p.click('[data-cact="fsub"][data-arg="affix"]');
    t.ok(await p.evaluate(() => forgeSub === 'affix' && !!document.querySelector('[data-cact="xfpick"]')), 'Affixes : l\'écran de transfert');
    await p.click('[data-cact="fsub"][data-arg="up"]');
    t.ok(await p.evaluate(() => forgeSub === 'up' && !!document.querySelector('[data-cact="up"]') && !document.querySelector('[data-cact="tal"]')), 'Bonus : les améliorations, sans les talents');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'écran de fusion : rien ne sort de l\'écran de 320 à 430 px (v127)', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) {
      const p = await newPage(b, { w, h: 800 });
      await p.evaluate(() => { heroCls = 'archer'; meta.gold = 5e6; meta.stash = []; const A = rgItem('S2', 180), B = rgItem('S2', 200); meta.gear.armure = A; meta.stash.push(B); saveMeta(); });
      await campView(p, 'forge', 'fuse'); await p.click('[data-arg="g:armure"]');
      const r = await p.evaluate(() => { const vw = innerWidth, bad = []; const scrolls = (e) => { for (let x = e.parentElement; x; x = x.parentElement) if (/auto|scroll/.test(getComputedStyle(x).overflowX)) return true; return false; };
        for (const e of document.querySelectorAll('#camp button')) { const q = e.getBoundingClientRect(); if (q.width && (q.right > vw || q.left < 0) && !scrolls(e)) bad.push(e.dataset.cact || e.id); }
        return [bad, [...document.querySelectorAll('.fzdiff li')].filter((x) => x.scrollWidth > x.clientWidth + 1).length, !!document.querySelector('.fzdiff')]; });
      t.eq(r, [[], 0, true], `${w} px : boutons et lignes dans l'écran`);
      await p.ctx.close();
    }
  } },
];
