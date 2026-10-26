// En mission : HUD, messages, Capture, ouverture de relique, réussite et butin rapporté.
import { newPage, startMission, sleep } from '../lib.mjs';

const RTIER_C1 = '#ff5a7a';
const hudBoss = (p) => p.evaluate(() => [$('bossTxt').hidden, $('bossTxt').textContent]);

export const tests = [
  { name: 'Survie : « Gardien en approche » seulement dans les 10 dernières secondes', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'survie' });
    await p.evaluate(() => { G.bossT = 30; }); await sleep(p, 150); t.eq(await hudBoss(p), [true, ''], 'masqué');
    await p.evaluate(() => { G.bossT = 6; }); await sleep(p, 150); t.eq(await hudBoss(p), [false, 'Gardien en approche'], 'alerte');
  } },
  { name: 'Défense : alerte avant une vague à Gardien, vague de sortie correcte', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'defense' });
    await p.evaluate(() => { G.wave = 2; G.waveState = 'break'; G.waveT = 3; }); await sleep(p, 150); t.eq((await hudBoss(p))[1], 'Gardien en approche', 'avant vague 3');
    await p.evaluate(() => { G.wave = 3; G.waveState = 'break'; G.waveT = 3; }); await sleep(p, 150); t.eq((await hudBoss(p))[1], 'Sortie vague 6', 'après avoir continué');
  } },
  { name: 'Capture : pas de minuteur de Gardien, seulement l\'alerte', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'capture' });
    await p.evaluate(() => { G.bossT = 40; }); await sleep(p, 150); t.eq(await hudBoss(p), [true, ''], 'pas de minuteur');
    await p.evaluate(() => { G.bossT = 5; }); await sleep(p, 150); t.eq(await hudBoss(p), [false, 'Gardien en approche'], 'alerte');
  } },
  { name: 'HUD : icône de relique et nombre de reliques ouvertes', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { an: [3, 0] }; meta.relicQ = [0, 1, 2].map(() => ({ id: 'an', rad: false })); saveMeta(); });
    await startMission(p);
    t.eq(await p.evaluate(() => [$('relHud').hidden, $('relN').textContent]), [false, '0'], 'affichée, 0 ouverte');
    await p.evaluate(() => { G.react = REACT_N - 1; G.drops.push({ kind: 'react', x: G.P.x, y: G.P.y, t: 0, age: 1, mt: 0 }); }); await sleep(p, 300);
    t.eq(await p.evaluate(() => [$('relN').textContent, getComputedStyle($('relHud')).getPropertyValue('--tc').trim()]), ['1', RTIER_C1], 'une ouverte, couleur ancestrale');
    t.ok(await p.evaluate(() => !document.getElementById('relTxt')), 'ancien texte retiré');
  } },
  { name: 'HUD : pas d\'icône sans relique équipée', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p);
    t.ok(await p.evaluate(() => $('relHud').hidden), 'masquée');
  } },
  { name: 'messages : seules les alertes de Gardien s\'affichent en mission', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p);
    await p.evaluate(() => { $('toast').innerHTML = ''; toast('message ordinaire'); banner('bannière ordinaire'); });
    t.eq(await p.evaluate(() => [$('toast').children.length, $('banner').hidden]), [0, true], 'messages ignorés');
    await p.evaluate(() => { G.bossT = 0; }); await sleep(p, 300);
    t.ok(await p.evaluate(() => !$('banner').hidden && /Gardien/.test($('banner').textContent)), 'alerte Gardien affichée');
  } },
  { name: 'relique ouverte en mission : aucun message', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { os: [2, 0] }; meta.relicQ = [{ id: 'os', rad: false }, { id: 'os', rad: false }]; saveMeta(); });
    await startMission(p);
    await p.evaluate(() => { $('toast').innerHTML = ''; G.react = REACT_N - 1; G.drops.push({ kind: 'react', x: G.P.x, y: G.P.y, t: 0, age: 1, mt: 0 }); });
    await sleep(p, 300);
    t.eq(await p.evaluate(() => [G.opened.length, $('toast').children.length, $('banner').hidden]), [1, 0, true], 'ouverte sans message');
  } },
  { name: 'Capture : la cible à terre n\'est plus visée', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'capture', cls: 'archer' });
    const shots = async () => { await p.evaluate(() => { G.en = G.en.filter((e) => e === G.target); G.spawns = []; G.spawnT = 99; G.bossT = 99; G.target.x = G.P.x + 120; G.target.y = G.P.y; window.__n = 0; const o = G.shots.push.bind(G.shots); G.shots.push = (...a) => { window.__n += a.length; return o(...a); }; }); await sleep(p, 1200); return p.evaluate(() => window.__n); };
    t.ok((await shots()) > 0, 'tire sur la cible debout');
    await p.evaluate(() => { G.target.hp = 0; G.target.downed = true; });
    t.eq(await shots(), 0, 'ne tire plus sur la cible à terre');
    t.eq(await p.evaluate(() => { const h = G.target.hp; dmgEnemy(G.target, 999, true); return G.target.hp - h; }), 0, 'aucun dégât');
  } },
  { name: 'réussite : butin, armes, harnais, fragments et compteurs rapportés', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { an: [1, 0] }; meta.relicQ = [{ id: 'an', rad: false }]; meta.diff = 3; meta.torm = 2; meta.hfrag = 0; saveMeta(); });
    await startMission(p, { mode: 'survie', level: 30, diff: 3, torm: 2, cls: 'archer' });
    await p.evaluate(() => { G.loot.items.push(genItem(117, 2)); G.loot.parts.push({ w: 'a6', full: 1 }, { hf: 1 }); G.opened.push(...G.relQ); G.level = 33; missionSuccess(); });
    await sleep(p, 300);
    const r = await p.evaluate(() => [meta.built.a6, meta.hfrag, meta.maxL, meta.wins, meta.bestDiff, meta.relOpened, Object.keys(meta.parts).length > 0, meta.stash.length > 0]);
    t.eq(r, [true, 1, 33, 1, 3, 1, true, true], 'banque');
  } },
  { name: 'pause › Retour au Camp : confirmation, butin du niveau perdu', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p);
    await p.evaluate(() => { G.loot.items.push(genItem(10)); G.gold = 500; meta.gold = 7; openBag(); });
    await p.click('#quitBtnBag');
    t.ok(await p.evaluate(() => /Retourner au Camp/.test($('bagDock').textContent) && started), 'confirmation, mission en pause');
    await p.click('#bagDock [data-bag="quitno"]');
    t.ok(await p.evaluate(() => $('bagDock').hidden && started && !G.over), 'annulé');
    await p.click('#quitBtnBag'); await p.click('#bagDock [data-bag="quitok"]');
    t.eq(await p.evaluate(() => [started, $('intro').hidden, $('camp').hidden, meta.gold, meta.stash.length]), [false, false, false, 7, 0], 'au Camp, rien gardé');
  } },
  { name: 'compétences : secondes de recharge sur le bouton, puis prête', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p); await sleep(p, 300);
    const st = () => p.evaluate(() => ['bNova', 'bDash'].map((id) => { const e = $(id), x = e.querySelector('.skt'); return [e.classList.contains('ready'), e.classList.contains('cool'), x ? x.textContent : '']; }));
    t.eq(await st(), [[true, false, ''], [true, false, '']], 'prêtes au départ');
    await p.evaluate(() => { doNova(); doDash(); }); await sleep(p, 200);
    const a = await st();
    t.ok(a.every(([r, c, n]) => !r && c && /^\d+$/.test(n)), 'en recharge : secondes affichées (' + JSON.stringify(a) + ')');
    await p.evaluate(() => { G.P.novaCd = 0; G.P.dashCd = 0; }); await sleep(p, 200);
    t.eq(await st(), [[true, false, ''], [true, false, '']], 'de nouveau prêtes');
  } },
  { name: 'HUD : un élément absent de la page ne bloque pas le reste', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { $('relHud').remove(); $('quitBtnBag').remove(); });
    await startMission(p); await sleep(p, 200);
    await p.evaluate(() => doNova()); await sleep(p, 200);
    t.ok(await p.evaluate(() => $('bNova').classList.contains('cool')), 'la recharge s\'affiche toujours');
    t.eq(p.errs, [], 'aucune erreur');
  } },
  { name: 'pause : « Retour au Camp » en toutes lettres, avec confirmation', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p);
    await p.evaluate(() => openBag()); await sleep(p, 100);
    t.eq(await p.evaluate(() => [$('quitBtnBag').textContent.trim(), $('quitBtnBag').scrollWidth <= $('quitBtnBag').clientWidth]), ['Retour au Camp', true], 'bouton lisible en entier');
    await p.click('#quitBtnBag');
    t.ok(await p.evaluate(() => /Retourner au Camp/.test($('bagDock').textContent)), 'confirmation');
    await p.click('#bagDock [data-bag="quitok"]'); await sleep(p, 200);
    t.eq(await p.evaluate(() => [started, $('camp').hidden]), [false, false], 'au Camp');
  } },
  { name: 'Tourment : moins de réactifs par palier et avec le séjour, plus de reliques avec le séjour', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics.os = [3, 0]; meta.relicQ = [{ id: 'os', rad: false }, { id: 'os', rad: false }]; saveMeta(); });
    await startMission(p, { diff: 3, torm: 10, level: 30 });
    const r = await p.evaluate(() => { const a = [REACT_N, reactNeed(), tormBoost().relic]; G.t = 6 * 120 + 5; const b2 = [reactNeed(), +tormBoost().relic.toFixed(2)]; G.t = 50 * 120; const c = [reactNeed(), +tormBoost().relic.toFixed(2)]; return [a, b2, c]; });
    t.eq(r, [[30, 18, 0], [9, 0.6], [9, 0.6]], 'palier X : 18 réactifs au départ ; après 12 min, 9 réactifs et reliques +60 % ; plafonds tenus');
    // ramasser le nombre réduit de réactifs ouvre bien la relique
    const opened = await p.evaluate(() => { G.t = 0; const n = reactNeed(); for (let i = 0; i < n; i++) G.drops.push({ kind: 'react', x: G.P.x, y: G.P.y, t: 0, age: 1, mt: 0 }); return n; });
    await sleep(p, 600);
    t.eq(await p.evaluate(() => G.opened.length), 1, opened + ' réactifs ouvrent la relique');
    t.ok(await p.evaluate(() => /réactifs −40 %/.test(diffLine(3))), 'accueil : la ligne du Tourment annonce −40 % de réactifs au palier X');
  } },
  { name: 'hors Tourment : le nombre de réactifs ne change pas', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { diff: 2 });
    t.eq(await p.evaluate(() => { G.t = 1000; return [reactNeed(), tormBoost().relic]; }), [30, 0], 'Cauchemar : 30 réactifs, pas de bonus');
  } },
  { name: 'changer d\'appli : la mission se met en pause, le rendu repart au retour', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p); await sleep(p, 200);
    const vis = (s) => p.evaluate((s) => { Object.defineProperty(document, 'visibilityState', { value: s, configurable: true }); Object.defineProperty(document, 'hidden', { value: s === 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }, s);
    await vis('hidden');
    t.eq(await p.evaluate(() => [!$('bag').hidden, paused]), [true, true], 'en arrière-plan : pause, sac ouvert');
    await vis('visible'); await sleep(p, 200);
    t.ok(await p.evaluate(() => !$('bag').hidden && started && !G.over), 'au retour : toujours en pause, mission intacte');
    const t0 = await p.evaluate(() => { closeBag(); return G.t; }); await sleep(p, 400);
    t.ok(await p.evaluate((t0) => G.t > t0, t0), 'Reprendre relance la mission');
  } },
];
