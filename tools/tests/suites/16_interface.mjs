// Interface (v124) : sélecteur du palier de Tourment sur téléphone étroit, Forge › Fusion filtrée et triée par rareté.
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'palier de Tourment : le − et le + restent visibles et utilisables de 320 à 430 px', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) {
      const p = await newPage(b, { w, h: 760 });
      await p.evaluate(() => { meta.diff = 3; meta.torm = 5; meta.bestTorm = 9; saveMeta(); refreshMenus(); });
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
  { name: 'Camp : l\'aide et la croix restent dans l\'écran, montants courts dans l\'en-tête', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) {
      const p = await newPage(b, { w, h: 760 });
      const r = await p.evaluate(() => {
        meta.gold = 30500000; meta.essence = 254321; saveMeta(); refreshMenus(); openCamp(); campTab = 'forge'; drawCamp();
        const R = (id) => $(id).getBoundingClientRect(), g = $('campGold');
        return [R('campHelp').right <= innerWidth, R('closeCamp').right <= innerWidth, g.scrollWidth <= g.clientWidth + 1, g.textContent.replace(/\s/g, ' '), R('campGold').right <= R('campHelp').left];
      });
      t.eq(r, [true, true, true, '30,5 M254 k', true], `${w} px : en-tête entier`);
      await p.click('#closeCamp');
      t.ok(await p.evaluate(() => $('camp').hidden), `${w} px : la croix ferme le Camp`);
      await p.ctx.close();
    }
    t.eq(await (async () => { const p = await newPage(b); const v = await p.evaluate(() => [fmtBig(98765), fmtBig(123456), fmtBig(5999999), fmtBig(30500000)].map((s) => s.replace(/\s/g, ' '))); await p.ctx.close(); return v; })(), ['98 765', '123 k', '5,9 M', '30,5 M'], 'montants courts, arrondis vers le bas');
  } },
  { name: 'Forge › Fusion : filtre par rareté, tri par rareté ou par prix, fusion des seules raretés choisies', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.gold = 5e6; meta.stash = [];
      const mk = (r, n) => { for (let i = 0; i < n; i++) { const it = genItem(30, r); Object.assign(it, { r, slot: 'armure', type: 'Cuirasse', name: 'Cuirasse' }); meta.stash.push(it); } };
      mk(1, 2); mk(2, 2); meta.stash.push(rgItem('L1', 40), rgItem('L1', 40), rgItem('S2', 50), rgItem('S2', 50)); saveMeta();
    });
    await campView(p, 'forge', 'fuse');
    const names = () => p.evaluate(() => [...document.querySelectorAll('#campBody .cx-rows .cx-row')].map((r) => r.querySelector('small').textContent.split(' · ')[0]));
    t.eq(await names(), ['Sanguin', 'Légendaire', 'Rare', 'Magique'], 'par rareté : la plus rare d\'abord');
    await p.click('[data-cact="fzs"][data-arg="cost"]');
    t.eq(await names(), ['Magique', 'Rare', 'Légendaire', 'Sanguin'], 'par prix : la moins chère d\'abord');
    await p.click('[data-cact="fzr"][data-arg="5"]'); await p.click('[data-cact="fzr"][data-arg="3"]');
    t.eq(await names(), ['Légendaire', 'Sanguin'], 'filtre Légendaire + Sanguin');
    t.ok(await p.evaluate(() => /Fusionner ces raretés · 2/.test($('campFoot') ? $('campFoot').textContent : document.body.textContent)), 'pied : « Fusionner ces raretés · 2 »');
    await p.click('[data-cact="fuseall"]');
    const r = await p.evaluate(() => meta.stash.map((i) => [i.r, i.up | 0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]));
    t.eq(r, [[1, 0], [1, 0], [2, 0], [2, 0], [3, 1], [5, 1]], 'seuls le Légendaire et le Sanguin ont fusionné');
    await p.click('[data-cact="fzrall"]');
    t.eq(await names(), ['Magique', 'Rare'], 'Toutes : les fusions restantes, toujours par prix');
    t.eq(p.errs, [], 'aucune erreur');
  } },
];
