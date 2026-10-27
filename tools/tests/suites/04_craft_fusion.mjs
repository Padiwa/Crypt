// Fabrication à l'Armurerie et fusion de rang.
import { newPage, campView } from '../lib.mjs';

export const tests = [
  { name: 'coûts : chaque amélioration et chaque fusion affiche son prix, ressource nommée, avant l\'action ; Tout fusionner coûte ce qui est affiché (v134)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const txt = (sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, sel);
    // Forge › Bonus : « Améliorer · N or »
    await p.evaluate(() => { meta.gold = 100000; meta.up = {}; saveMeta(); });
    await campView(p, 'forge', 'up');
    t.ok(/^Améliorer \d[\d  ]* or$/i.test(await txt('[data-cact="up"]')), `Forge › Bonus : ${await txt('[data-cact="up"]')}`);
    // Forge › Fusion : Tout fusionner, nombre de fusions et prix exact
    await p.evaluate(() => { meta.stash = []; for (let i = 0; i < 5; i++) { const it = genItem(30, 1); Object.assign(it, { r: 1, slot: 'armure', type: 'Cuirasse', name: 'Cuirasse', up: 0, lvl: 30 }); meta.stash.push(it); } saveMeta(); });
    await campView(p, 'forge', 'fuse');
    await p.waitForFunction(() => { const x = document.querySelector('[data-cact="fuseall"]'); return x && !x.disabled; });
    const fa = await txt('[data-cact="fuseall"]'), want = +fa.match(/(\d[\d  ]*) or/)[1].replace(/\D/g, '');
    const g0 = await p.evaluate(() => meta.gold); await p.click('[data-cact="fuseall"]');
    t.eq(await p.evaluate((g0) => g0 - meta.gold, g0), want, `Tout fusionner : l'or dépensé est celui affiché (${fa})`);
    t.ok(/\d+ fusions? /i.test(fa), 'nombre de fusions sur le bouton');
    // Héros › Emplacements : fragments de harnais et or, ce qui manque en rouge
    await p.evaluate(() => { meta.hfrag = 3; meta.gold = 100000; saveMeta(); });
    await campView(p, 'equip');
    t.ok(/12 fragments de harnais/i.test(await txt('[data-cact="slotopen"]')) && await p.evaluate(() => !!document.querySelector('[data-cact="slotopen"] .cost__p.is-short')), 'emplacement : fragments de harnais (manquants en rouge) et or');
    // Mods : monter de rang · N essence
    await p.evaluate(() => { meta.essence = 10; modTab = 'w'; modSel = 'ferocite'; saveMeta(); });
    await campView(p, 'mods'); await p.evaluate(() => { modSel = 'ferocite'; drawCamp(); });
    t.ok(/Monter de rang \d+ essence/i.test(await txt('[data-act="fuse"]') || ''), `mod : ${await txt('[data-act="fuse"]')}`);
  } },
  { name: 'fabrication : niveau de la plus haute mission, arme neuve puis double', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      meta.gold = 9999; meta.maxL = 25; meta.parts = { L1: [1, 1, 1], a3: [2, 2, 2] }; heroCls = 'archer';
      const it = craftOne('L1'), w1 = craftOne('a3'), w2 = craftOne('a3'), none = craftOne('a3');
      return [it.lvl, it.r, Object.keys(it.aff).length, w1, w2, none, wSpares('a3'), 9999 - meta.gold, CRAFT_G[3] * 3];
    });
    t.eq(r.slice(0, 3), [97, 3, 4], 'objet légendaire au niveau 97');
    t.eq(r.slice(3, 6), ['new', 'copy', null], 'arme neuve, double, plus de fragments');
    t.eq(r[6], [0], 'un double de rang 1'); t.eq(r[7], r[8], 'or dépensé (3 fabrications légendaires)');
  } },
  { name: 'fusion d\'arme : doubles combinés jusqu\'au plus haut rang', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    t.eq(await p.evaluate(() => { meta.gold = 1e6; meta.built.a3 = true; meta.wlv.a3 = 0; meta.wcp.a3 = [0, 0, 0]; const d = wFuse('a3'); return [d, meta.wlv.a3, wSpares('a3'), 1e6 - meta.gold === 2 * fuseGold(3, 0, relicItemLvl()) + fuseGold(3, 1, relicItemLvl())]; }), [2, 2, [], true], 'rang 3, plus de doubles, or payé');
    t.eq(await p.evaluate(() => { meta.gold = fuseGold(3, 0, relicItemLvl()); meta.wlv.a4 = 0; meta.built.a4 = true; meta.wcp.a4 = [0, 0, 0]; const d = wFuse('a4'); return [d, meta.gold, wSpares('a4').length]; }), [1, 0, 2], 'or limité : une seule fusion');
  } },
  { name: 'fusion d\'objets : garde le meilleur, ne sacrifie ni verrouillé ni porté', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const a = rgItem('L3', 97), c = rgItem('L3', 80), l = rgItem('L3', 60); l.lock = true;
      const w = rgItem('L5', 90), w2 = rgItem('L5', 70); meta.gear.bottes = w;
      meta.gold = 1e6; meta.stash.push(a, c, l, w2); const n = fuseAll();
      return [n, a.up | 0, meta.stash.includes(c), meta.stash.includes(l), meta.gear.bottes.up | 0, meta.stash.includes(w2)];
    });
    t.eq(r, [2, 1, false, true, 1, false], 'résultat');
  } },
  { name: 'fiche : bouton de fusion quand un double existe', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.gold = 1e6; const a = rgItem('L7', 97), c = rgItem('L7', 90); meta.stash.push(a, c); saveMeta(); });
    await campView(p, 'arsenal', 'coffre');
    await p.evaluate(() => { campSel = { stash: meta.stash.find((i) => i.rid === 'L7' && i.lvl === 97).id }; drawCamp(); });
    t.ok(await p.evaluate(() => !!document.querySelector('#campDock [data-cact="fuse1"]')), 'bouton Fusionner');
    await p.click('#campDock [data-cact="fuse1"]');
    t.ok(await p.evaluate(() => campTab === 'forge' && forgeSub === 'fuse' && !!document.querySelector('.fzdiff')), 'écran de choix des affixes (v127)');
    await p.click('#campFoot [data-cact="fzok"]');
    t.eq(await p.evaluate(() => meta.stash.filter((i) => i.rid === 'L7').map((i) => [i.lvl, i.up | 0])), [[97, 1]], 'fusionné');
    t.ok(await p.evaluate(() => campTab === 'arsenal' && !!campSel && !!campSel.stash), 'retour à la fiche du coffre');
  } },
  { name: 'butin des monstres : rang maximum plafonné, fusion payante', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const mk = (up) => { const it = genItem(20, 0); it.r = 0; it.slot = 'bottes'; it.type = 'Grèves'; it.up = up; return it; };
      const cap = BAL.mobRankMax[0] - 1, a = mk(cap), c = mk(cap); meta.stash = [a, c]; meta.gold = 1e6;
      const atCap = fuseAll(), x = mk(0), y = mk(0); meta.stash = [x, y]; meta.gold = fuseGold(0, 0, x.lvl) - 1; const poor = fuseAll(); meta.gold += 1; const ok = fuseAll();
      return [atCap, poor, ok, Math.max(...meta.stash.map((i) => i.up | 0)), meta.gold];
    });
    t.eq(r, [0, 0, 1, 1, 0], 'pas de fusion au rang max, ni sans or ; puis une fusion payée');
  } },
  { name: 'fusion d\'équipement : la cible, ses doubles de même rang, les affixes de la source à gauche, plafond d\'affixes (v127)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.gold = 1e6; meta.stash = [];
      const mk = (lvl, aff, up = 0) => { const it = genItem(lvl, 2); Object.assign(it, { r: 2, slot: 'bottes', type: 'Grèves', name: 'Grèves ' + lvl, lvl, aff, up, base: { k: 'speed', v: lvl } }); return it; };
      const A = mk(40, { dmgPct: 10, crit: 5, hp: 100 }), B = mk(50, { dmgPct: 15, speed: 6, regen: 3 }), C = mk(45, { dmgPct: 1 }, 2), D = genItem(30, 0);
      meta.stash.push(A, B, C, D); saveMeta(); window.__ids = [A.id, B.id, C.id, D.id];
    });
    const [A, B, C, D] = await p.evaluate(() => __ids);
    await campView(p, 'forge', 'fuse');
    const dis = (id) => p.evaluate((id) => document.querySelector(`#invGrid [data-arg="s:${id}"]`).getAttribute('aria-disabled') === 'true', id);
    t.eq([await dis(A), await dis(B), await dis(C), await dis(D)], [false, false, true, true], 'cible : seuls les objets qui ont un double de même rang sont actifs');
    await p.click(`#invGrid [data-arg="s:${B}"]`);
    t.ok(await p.evaluate(() => /Fusionne avec Grèves 50/.test(document.body.textContent) && /autre rang/.test(document.body.textContent)), 'doubles de la cible, et l\'exemplaire d\'un autre rang signalé');
    t.eq(await p.evaluate(() => [fzc.a, fzc.b]), [B, A], 'cible Grèves 50, source proposée Grèves 40');
    const taken = () => p.evaluate(() => Object.entries(fzc.sel.k).filter(([, v]) => v).map(([k, v]) => k + v).sort());
    t.eq(await taken(), ['dmgPcta', 'regena', 'speeda'], 'départ : la cible garde ses 3 affixes (dégâts 15 plus forts que 10)');
    await p.click('[data-cact="fzk"][data-arg="crit|b"]');
    t.ok(await p.evaluate(() => $('campFoot').querySelector('[data-cact="fzok"]').disabled && /1 affixe de trop/.test($('campFoot').textContent)), '4 affixes sur 3 : Fusionner désactivé, « 1 affixe de trop »');
    await p.click('[data-cact="fzk"][data-arg="regen|a"]'); await p.click('[data-cact="fzk"][data-arg="hp|b"]'); await p.click('[data-cact="fzk"][data-arg="speed|a"]');
    await p.click('[data-cact="fzbase"][data-arg="b"]');
    await p.click('#campFoot [data-cact="fzok"]');
    const r = await p.evaluate((B) => { const it = meta.stash.find((i) => i.id === B); return [meta.stash.length, it.lvl, it.up | 0, it.name, JSON.stringify(it.aff)]; }, B);
    t.eq(r, [3, 40, 1, 'Grèves 40', '{"dmgPct":15,"crit":5,"hp":100}'], 'résultat : niveau et nom de la source, dégâts 15 de la cible, critique et vie de la source ; rang 2');
    t.eq(await p.evaluate(() => fzc), null, 'choix terminé');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'fusion d\'équipement : Tout prendre, Garder tel quel, choix du sacrifié, pouvoir abyssal gardé, Tout fusionner au mieux (v127)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      heroCls = 'guerrier'; meta.gold = 1e7; meta.stash = [];
      const A = rgItem('B1', 180), B = rgItem('B1', 180), C = rgItem('B1', 170);
      const ks = Object.keys(A.aff); ks.forEach((k, i) => { A.aff[k] = 10 + i; B.aff[k] = i % 2 ? 5 : 30; C.aff[k] = 1; });
      meta.stash.push(A, B, C); saveMeta();
      fzOpen(A, B); const best = JSON.stringify(fzc.sel), keepA = fzKeepA(A, B);
      const aby = ks.find((k) => AFF[k].aby);
      return { ks, aby, best: fzc.sel, keepA, ids: [A.id, B.id, C.id] };
    });
    t.ok(r.aby && r.ks.every((k, i) => r.best.k[k] === (i % 2 ? 'a' : 'b')), 'Tout prendre : la plus haute valeur de chaque affixe');
    t.ok(r.ks.every((k) => r.keepA.k[k] === 'a') && r.keepA.base === 'a', 'Garder tel quel : tout du gardé');
    await campView(p, 'forge', 'fuse');
    await p.evaluate(() => { fzOpen(meta.stash[0], meta.stash[1]); drawCamp(); });
    t.eq(await p.evaluate(() => [...document.querySelectorAll('[data-cact="fzb"]')].length), 2, 'deux doubles libres : choix du sacrifié');
    await p.click(`[data-arg="${r.aby}|${(await p.evaluate((k) => fzc.sel.k[k], r.aby))}"]`);
    t.ok(await p.evaluate((k) => !!fzc.sel.k[k], r.aby), 'le pouvoir abyssal ne se retire pas');
    await p.click('#campFoot [data-cact="fzno"]');
    // sans le 3e exemplaire (niveau 170), Tout fusionner réunit les deux du niveau 180
    const all = await p.evaluate((c) => { meta.stash = meta.stash.filter((i) => i.id !== c); fuseAll(); return meta.stash.map((i) => [i.up | 0, JSON.stringify(i.aff)]); }, r.ids[2]);
    const exp = {}; r.ks.forEach((k, i) => { exp[k] = Math.max(10 + i, i % 2 ? 5 : 30); });
    t.ok(all.length === 1 && all.some(([u, a]) => u === 1 && JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(a)).sort())) === JSON.stringify(Object.fromEntries(Object.entries(exp).sort()))), 'Tout fusionner : meilleures valeurs des deux exemplaires');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'fusion : ⇄ intervertit la cible et la source, les choix d\'affixes suivent, la cible portée ne peut pas être sacrifiée (v128)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => {
      heroCls = 'archer'; meta.gold = 1e6; meta.stash = [];
      const mk = (lvl, aff) => { const it = genItem(lvl, 2); Object.assign(it, { r: 2, slot: 'bottes', type: 'Grèves', name: 'Grèves ' + lvl, lvl, aff, up: 0, base: { k: 'speed', v: lvl } }); return it; };
      const A = mk(40, { dmgPct: 10, crit: 5 }), B = mk(50, { dmgPct: 15, speed: 6 });
      meta.stash.push(A, B); saveMeta(); window.__ids = [A.id, B.id];
    });
    const [A, B] = await p.evaluate(() => __ids);
    await campView(p, 'forge', 'fuse');
    await p.click(`#invGrid [data-arg="s:${A}"]`);
    t.eq(await p.evaluate(() => [fzc.a, fzc.b]), [A, B], 'cible Grèves 40 (touchée), source Grèves 50');
    await p.click('[data-cact="fzk"][data-arg="crit|a"]');
    const before = await p.evaluate(() => JSON.stringify(fzc.sel));
    await p.click('[data-cact="fzswap"]');
    t.eq(await p.evaluate(() => [fzc.a, fzc.b]), [B, A], '⇄ : Grèves 50 gardée, Grèves 40 sacrifiée');
    const sw = (s) => s.replace(/"a"|"b"/g, (m) => (m === '"a"' ? '"b"' : '"a"'));
    t.eq(await p.evaluate(() => JSON.stringify(fzc.sel)), sw(before), 'les choix d\'affixes suivent les exemplaires');
    await p.click('#campFoot [data-cact="fzok"]');
    t.eq(await p.evaluate(() => meta.stash.map((i) => i.id)), [B], 'c\'est Grèves 50 qui reste');
    // une cible portée ne peut pas devenir la source
    await p.evaluate(() => { const C = genItem(30, 2), D = genItem(30, 2); for (const it of [C, D]) Object.assign(it, { r: 2, slot: 'bottes', type: 'Grèves', name: 'Grèves', up: 0 }); meta.gear.bottes = C; meta.stash.push(D); saveMeta(); fzc = null; drawCamp(); });
    await p.click('[data-arg="g:bottes"]');
    t.ok(await p.evaluate(() => { const x = document.querySelector('[data-cact="fzswap"]'); return x.disabled && /porté/.test(x.title); }), 'cible portée : ⇄ désactivé, « porté par… » en info-bulle');
    t.eq(p.errs, [], 'aucune erreur');
  } },
];
