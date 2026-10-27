// En mission : HUD, messages, Capture, ouverture de relique, réussite et butin rapporté.
import { newPage, startMission, sleep } from '../lib.mjs';

const RTIER_C1 = '#ff5a7a';
const hudBoss = (p) => p.evaluate(() => [$('bossTxt').hidden, $('bossTxt').textContent]);
// Audit du HUD : rectangles des éléments visibles en haut de l'écran, chevauchements deux à deux, débordements.
// Cas chargé : 4 altérations, or à 6 chiffres, reliques, Gardien (barre), cryopode en Défense, extraction et 3 captures en Capture.
export async function hudAudit(b, w, mode) {
  const p = await newPage(b, { w, h: w < 360 ? 640 : 844 });
  await p.evaluate(() => { meta.relics.os = [3, 0]; meta.relicQ = [0, 1, 2].map(() => ({ id: 'os', rad: false })); saveMeta(); });
  await startMission(p, { mode, diff: 3, torm: 10, level: 48 });
  await p.evaluate((mode) => {
    G.gold = 123456; G.opened.push(G.relQ[0]); G.react = 12; G.bossT = mode === 'capture' ? 40 : 5;
    Object.assign(G.P, { psnT: 5, psn: 3, brnT: 4, frzT: 2, cbT: 3 });
    if (mode === 'capture') { G.capN = 3; G.exitPt = farPoint(1000); }
    spawnBosses(true); banner('Un Gardien surgit des ténèbres', '#b06ae0', 2, true);
  }, mode);
  await sleep(p, 500);
  const r = await p.evaluate(() => {
    const ids = { vie: '#hpBox .hp-bar', pv: '#hpTxt', poison: '#stP', brulure: '#stB', gelure: '#stF', frenesie: '#stC', niveau: '#lvlTxt', alerte: '#bossTxt', reliques: '#relHud', or: '.hud .gold', sac: '#bagBtn', objectif: '#objBox', gardien: '#bossBar', cryopode: '#objBar', banniere: '#banner' };
    const vis = (e) => e && !e.closest('[hidden]') && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const R = {}; for (const [k, s] of Object.entries(ids)) { const e = document.querySelector(s); if (vis(e)) { const q = e.getBoundingClientRect(); R[k] = [q.left, q.top, q.right, q.bottom]; } }
    const ks = Object.keys(R), over = [], out = [];
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) { const a = R[ks[i]], c = R[ks[j]]; if (a[0] < c[2] - 1 && c[0] < a[2] - 1 && a[1] < c[3] - 1 && c[1] < a[3] - 1) over.push(ks[i] + '×' + ks[j]); }
    for (const k of ks) if (R[k][0] < -1 || R[k][2] > innerWidth + 1) out.push(k);
    // flèches hors écran : leur pointe la plus haute reste sous le HUD du haut
    hudBotAt = -1e9; const cx = innerWidth / 2, cy = innerHeight / 2; let top = 1e9;
    for (let i = 0; i <= 64; i++) { const a = -Math.PI + i * Math.PI / 64; top = Math.min(top, cy + Math.sin(a) * arrowK(a, cx, cy) - 14); }
    const hudB = Math.max(...ks.filter((k) => k !== 'banniere').map((k) => R[k][3]));
    return { R, over, out, alerte: $('bossTxt').textContent, fleches: top >= hudB };
  });
  r.p = p; return r;
}

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
  { name: 'HUD : rien ne se superpose de 320 à 430 px (Survie, Défense, Capture)', fn: async (b, t) => {
    for (const w of [320, 360, 390, 430]) for (const mode of ['survie', 'defense', 'capture']) {
      const r = await hudAudit(b, w, mode); t.track(r.p);
      t.eq(r.over, [], `${w} px ${mode} : aucun chevauchement`);
      t.eq(r.out, [], `${w} px ${mode} : rien ne déborde`);
      t.ok(r.fleches, `${w} px ${mode} : les flèches restent sous le HUD`);
      const shown = ['vie', 'poison', 'frenesie', 'niveau', 'alerte', 'reliques', 'or', 'sac', 'objectif', 'gardien', 'banniere'].filter((k) => !r.R[k]);
      t.eq(shown, [], `${w} px ${mode} : tout est affiché`);
      // reliques : pastille à l'extrême droite, sous le sac (2e ligne)
      const [rel, sac] = [r.R.reliques, r.R.sac];
      t.ok(Math.abs(rel[2] - sac[2]) <= 2 && rel[1] >= sac[3], `${w} px ${mode} : reliques à droite, en 2e ligne`);
      await r.p.ctx.close();
    }
  } },
  { name: 'Capture en chaîne : une nouvelle cible après chaque capture, une relique à chaque fois', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { mode: 'capture', diff: 3, torm: 2, level: 5 });
    const capture = () => p.evaluate(() => { G.spawns = []; G.spawnT = 99; G.bossT = 99; G.en = G.en.filter((e) => e === G.target); G.target.hp = 0; G.target.downed = true; G.target.spd = 0; G.P.x = G.target.x + 20; G.P.y = G.target.y; });
    await capture(); await p.waitForFunction(() => G.capN === 1, null, { timeout: 6000 });
    t.eq(await p.evaluate(() => [!!G.exitPt, G.target, G.loot.relics.slice(), $('lvlTxt').textContent, $('objK').textContent]), [true, null, ['an'], '1 capture', 'Vers l\'extraction'], 'capture 1 : extraction ouverte, Relique Ancestrale (Tourment II, même au niveau 5)');
    t.ok(await p.evaluate(() => /^Cible 2 dans \d s$/.test($('bossTxt').textContent)), 'compte à rebours de la cible suivante');
    const ex = await p.evaluate(() => [G.exitPt.x, G.exitPt.y]);
    await p.waitForFunction(() => G.target && !G.target.downed, null, { timeout: 8000 });
    t.eq(await p.evaluate(() => [G.target.hp === G.target.max, $('objK').textContent, /^Extraction · \d+ m$/.test($('bossTxt').textContent)]), [true, 'Traque la cible 2', true], 'cible 2 apparue, extraction rappelée');
    await capture(); await p.waitForFunction(() => G.capN === 2, null, { timeout: 6000 });
    t.eq(await p.evaluate(() => [G.loot.relics.slice(), [G.exitPt.x, G.exitPt.y]]), [['an', 'an'], ex], 'capture 2 : deuxième relique, même zone d\'extraction');
    await p.evaluate(() => { G.P.x = G.exitPt.x; G.P.y = G.exitPt.y; }); await p.waitForFunction(() => G.over, null, { timeout: 8000 });
    t.eq(await p.evaluate(() => [document.querySelector('#over [data-k="obj"] b').textContent, document.querySelector('#over [data-k="obj"] small').textContent]), ['2', 'cibles capturées'], 'fin de mission : 2 cibles capturées');
  } },
  { name: 'Capture : relique de la difficulté et du Tourment sans plafond de niveau ; les autres reliques inchangées', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    const r = await p.evaluate(() => {
      const at = (d, tm, L, free) => { meta.diff = d; meta.torm = tm; G.level = L; const s = new Set(); for (let i = 0; i < 400; i++) s.add(relicDrop(free)); return [...s].sort().join(','); };
      return { cap: [at(2, 1, 50, true), at(3, 1, 1, true), at(3, 5, 12, true), at(3, 6, 1, true), at(3, 10, 5, true)],
        autres: [at(2, 1, 50), at(3, 3, 29), at(3, 3, 30), at(3, 8, 39), at(3, 8, 40), at(3, 10, 50)] };
    });
    t.eq(r.cap, ['os', 'an', 'an', 'ab,sa', 'ab,sa'], 'capture : Ossuaire hors Tourment, Ancestrale en I–V, Sanguine ou Abyssale en VI+, à tout niveau');
    t.eq(r.autres, ['os', 'os', 'an', 'an', 'sa', 'ab,sa'], 'autres reliques : plafond de niveau inchangé (30, 40, 45)');
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
  { name: 'fin de mission : Au Camp ou Rejouer ; Au Camp ramène à l\'accueil avec la barre d\'onglets, navigation libre (v133)', fn: async (b, t) => {
    const st = (p) => p.evaluate(() => [!$('over').hidden, !$('camp').hidden, !$('intro').hidden, getComputedStyle($('tabbar')).display !== 'none', started, campTab]);
    for (const end of ['réussite', 'échec']) {
      const p = t.track(await newPage(b)); await startMission(p);
      await p.evaluate((end) => { G.loot.items.push(genItem(10)); if (end === 'réussite') missionSuccess(); else gameOver(); }, end);
      await p.waitForFunction(() => !$('over').hidden);
      t.eq(await p.evaluate(() => [...document.querySelectorAll('#over .ovr__foot button')].map((x) => x.firstElementChild.textContent)), ['Au Camp', end === 'réussite' ? 'Rejouer' : 'Réessayer'], `${end} : deux boutons`);
      await p.click('#campBtn2');
      t.eq(await st(p), [false, false, true, true, false, 'equip'], `${end} : écran de fin fermé, accueil du jeu, barre d'onglets visible`);
      await p.click('#tabbar [data-nav="arsenal"]');
      t.eq((await st(p)).slice(1, 6), [true, true, true, false, 'arsenal'], `${end} : l'onglet Arsenal s'ouvre`);
      await p.click('#tabbar [data-nav="heros"]');
      t.eq((await st(p))[5], 'equip', `${end} : puis l'onglet Héros`);
      await p.click('#tabbar [data-nav="combat"]');
      t.eq(await st(p), [false, false, true, true, false, 'equip'], `${end} : Combat ramène à l'accueil`);
      if (end === 'réussite') t.ok(await p.evaluate(() => meta.stash.length > 0), 'le butin est au Camp');
      await p.click('#startBtn'); t.ok(await p.evaluate(() => started && !G.over && $('intro').hidden), `${end} : nouvelle mission depuis l'accueil`);
    }
  } },
  { name: 'fin de mission : or, Gardiens vaincus, objectifs, reliques trouvées et ouvertes, fragments, mods, et tous les équipements, 12 par page (v133)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { os: [2, 0] }; meta.relicQ = [{ id: 'os', rad: false }, { id: 'os', rad: false }]; saveMeta(); });
    await startMission(p);
    await p.evaluate(() => { for (let i = 0; i < 30; i++) G.loot.items.push(genItem(20, i % 4)); G.loot.relics.push('os', 'an'); G.loot.parts.push({ w: 'a6', full: 1 }, { w: 'a3', p: 1 }, { hf: 1 });
      G.bossK = 4; G.objN = 0; objDone(); objDone(); G.opened.push(...G.relQ); G.modsGot = ['ferocite']; G.gold = 900; missionSuccess(); });
    const tiles = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#over .ovr__tile')].map((x) => [x.dataset.k, x.querySelector('b').textContent])));
    t.eq(tiles, { gold: '+900', boss: '4', obj: '2', relF: '2', relO: '2', frag: '4', mods: '1', eq: '31' }, 'les huit compteurs (fragments : arme, harnais et 2 des reliques ouvertes)');
    const pg = () => p.evaluate(() => [document.querySelectorAll('#ovrEq .ovr__slot').length, document.querySelector('.ovr__pager span').textContent]);
    t.eq(await pg(), [12, 'Page 1 / 3'], 'page 1 : 12 équipements');
    await p.click('[data-ovpg="1"]'); await p.click('[data-ovpg="1"]');
    t.eq(await pg(), [7, 'Page 3 / 3'], 'page 3 : les 7 derniers');
    t.ok(await p.evaluate(() => document.querySelector('[data-ovpg="1"]').disabled && !document.querySelector('[data-ovpg="-1"]').disabled), 'Suivant grisé à la dernière page');
    await p.click('#ovrEq .ovr__slot >> nth=0');
    t.ok(await p.evaluate(() => !!document.querySelector('#ovrEq .ovr__slot.is-sel') && / · /.test(document.querySelector('.ovr__cap').textContent)), 'un équipement touché montre son nom');
    t.ok(await p.evaluate(() => { const f = document.querySelector('.ovr__foot').getBoundingClientRect(); return f.bottom <= innerHeight + 1 && f.top > 0; }), 'les deux boutons restent dans l\'écran');
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
  { name: 'séjour après l\'objectif : butin des monstres +10 % par minute après la 1re manche ou la 1re capture, jusqu\'à +100 % (v131)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await startMission(p, { mode: 'survie' });
    t.eq(await p.evaluate(() => [G.objT == null, stayBonus()]), [true, 0], 'avant l\'objectif : aucun bonus');
    await p.evaluate(() => { G.t = 300; roundDone(); });
    t.ok(await p.evaluate(() => G.objT === 300 && /Bonus de séjour/.test($('exLead').textContent) && /10 % par minute/.test($('exLead').textContent)), 'fin de manche : objectif noté, bonus annoncé');
    await p.evaluate(() => { contRun(); G.t = G.objT + 125; });
    await sleep(p, 300);
    t.eq(await p.evaluate(() => Math.round(stayBonus() * 100)), 20, 'deux minutes plus tard : +20 %');
    t.ok(await p.evaluate(() => /Butin des monstres \+20 %/.test($('toast').textContent)), 'un message annonce la hausse');
    await p.evaluate(() => { G.t = G.objT + 3600; openBag(); });
    t.eq(await p.evaluate(() => Math.round(stayBonus() * 100)), 100, 'plafond : +100 %');
    t.ok(await p.evaluate(() => /butin des monstres \+100 %/.test($('bagSum').textContent)), 'la pause affiche le bonus');
    // Mêmes tirages au hasard, avec et sans bonus : objets, mods et reliques des monstres tombent environ deux fois plus.
    const n = await p.evaluate(() => {
      closeBag(); const R = Math.random;
      const run = (late) => { let s = 7; Math.random = () => (s = (s * 16807) % 2147483647) / 2147483647; G.objT = late ? G.t - 3600 : G.t; G.drops = [];
        for (let i = 0; i < 3000; i++) kill({ type: 'brute', x: G.P.x, y: G.P.y, r: 20, col: '#fff' });
        const c = (k) => G.drops.filter((d) => d.kind === k).length; return [c('item'), c('mod'), c('relic')]; };
      try { return [run(false), run(true)]; } finally { Math.random = R; G.drops = []; }
    });
    t.ok(n[1].every((v, i) => v >= n[0][i] * 1.6 && v <= n[0][i] * 2.4 + 2), `butin doublé au plafond : ${JSON.stringify(n)}`);
    const q = t.track(await newPage(b));
    await startMission(q, { mode: 'capture' });
    await q.evaluate(() => { G.t = 90; capReward(); });
    t.eq(await q.evaluate(() => G.objT), 90, 'Capture : la 1re cible capturée lance le bonus');
    await q.evaluate(() => { G.t = 90 + 61; }); await sleep(q, 300);
    t.ok(await q.evaluate(() => /Butin des monstres \+10 %/.test($('toast').textContent)), 'une minute après : +10 %, annoncé');
    await q.evaluate(() => { G.t = 200; capReward(); });
    t.eq(await q.evaluate(() => G.objT), 90, 'les captures suivantes ne relancent pas le compte');
  } },
];
