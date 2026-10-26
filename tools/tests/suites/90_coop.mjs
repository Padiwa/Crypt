// Coopération à deux (WebRTC local) : connexion, mission, familiers, pas d'erreur. Lente : ignorée avec --quick.
import { newPage, sleep } from '../lib.mjs';
export const slow = true;

// Attente nommée : en cas de délai dépassé, dit laquelle et dans quel état était la page.
async function wf(p, fn, what, timeout = 8000) {
  try { await p.waitForFunction(fn, null, { timeout }); } catch (e) {
    const s = await p.evaluate(() => JSON.stringify({ started, over: !!(G && G.over), mode: G && G.mode, on: NET.on, state: NET.state, peers: NET.peers.map((q) => [q.state, q.cls]) })).catch(() => '?');
    throw new Error(`${what} : délai dépassé ${s}`);
  }
}

// Connecte deux pages (A héberge, B rejoint) et ferme les fenêtres de coopération.
async function pair(b, t) {
  const A = t.track(await newPage(b)), B = t.track(await newPage(b));
  await B.evaluate(() => { localStorage.setItem('crypte-cls', 'guerrier'); }); await B.reload();
  await A.click('#coopBtn'); await A.click('[data-coop="host"]');
  await wf(A, () => NET.peers.some((p) => p.code), 'A attend 1', 15000);
  const offer = await A.evaluate(() => NET.peers.find((p) => p.code).code);
  await B.click('#coopBtn'); await B.click('[data-coop="join"]'); await B.fill('#coopIn', offer); await B.click('[data-coop="joingo"]');
  await wf(B, () => NET.state === 'showAnswer', 'B attend 2', 15000);
  await A.fill('#coopIn', await B.evaluate(() => NET.code)); await A.click('[data-coop="answer"]');
  await wf(A, () => NET.on, 'A attend 3', 15000); await wf(B, () => NET.on, 'B attend 4', 15000);
  await A.click('#closeCoop'); await B.click('#closeCoop');
  return [A, B];
}

export const tests = [
  { name: 'deux joueurs se connectent et jouent une Survie', fn: async (b, t) => {
    const [A, B] = await pair(b, t);
    await A.click('#startBtn'); await wf(B, () => started, 'B attend 5', 8000); await sleep(A, 3000);
    t.ok(await A.evaluate(() => G.mates.length === 1), 'l\'hôte voit l\'invité');
    t.ok(await B.evaluate(() => G.mates.length === 1 && G.en.length > 0), 'l\'invité voit l\'hôte et les monstres');
  } },
  { name: 'changer de héros et de mission dans le salon ne coupe pas la connexion ; Défense à deux ; retour au Camp', fn: async (b, t) => {
    const [A, B] = await pair(b, t);
    await B.click('.cx-pick[data-c="magicien"]'); await sleep(A, 600);
    t.ok(await A.evaluate(() => NET.on && NET.peers[0].cls === 'magicien'), 'l\'hôte voit le Magicien, toujours connecté');
    await A.click('.cx-pick[data-c="guerrier"]'); await sleep(A, 400);
    t.eq(await A.evaluate(() => document.querySelector('.cx-pick[data-m="breche"]').getAttribute('aria-disabled')), 'false', 'Brèche disponible à deux');
    await A.click('.cx-pick[data-m="defense"]'); await sleep(A, 500);
    t.eq(await B.evaluate(() => [NET.on, NET.hostMode && NET.hostMode.mode]), [true, 'defense'], 'l\'invité voit la Défense');
    await A.click('#startBtn'); await wf(B, () => started && G && !G.over, 'B attend 6', 8000); await sleep(A, 2500);
    t.eq(await B.evaluate(() => [G.mode, !!G.pod, meta.mode, G.mates.length]), ['defense', true, 'survie', 1], 'invité en Défense, sa sauvegarde garde son mode');
    t.ok(await B.evaluate(() => G.pod.max > 0 && $('objBar').hidden === false), 'cryopode affiché chez l\'invité');
    await B.evaluate(() => { openBag(); }); await B.click('#quitBtnBag'); await B.click('#bagDock [data-bag="quitok"]'); await sleep(A, 800);
    t.eq(await B.evaluate(() => [started, $('intro').hidden, NET.on]), [false, false, true], 'invité au Camp, toujours connecté');
    t.eq(await A.evaluate(() => [started && !G.over, G.mates.length]), [true, 0], 'l\'hôte continue seul');
  } },
  { name: 'noms et niveaux de prestige : identifiant par défaut, nom réglé dans Compte, mis à jour en direct', fn: async (b, t) => {
    const [A, B] = await pair(b, t);
    const bid = await B.evaluate(() => meta.pid);
    t.ok(/^[A-Z2-9]{5}$/.test(bid), 'identifiant unique tiré pour le joueur');
    t.eq(await A.evaluate(() => [NET.peers[0].name, NET.peers[0].pr]), ['Joueur-' + bid, 0], 'l\'hôte reçoit le nom par défaut de l\'invité');
    // l'hôte règle son nom (les signes interdits sont retirés) et a du prestige sur son héros
    await A.evaluate(() => { meta.prest[heroCls] = { lv: 7, pts: {} }; });
    await A.click('#setBtn'); await A.fill('#setName', 'Ombre <b>&'); await A.press('#setName', 'Enter'); await sleep(A, 500);
    t.eq(await A.evaluate(() => meta.pname), 'Ombre b', 'nom nettoyé et gardé dans la sauvegarde');
    t.eq(await B.evaluate(() => { const r = NET.roster.find((x) => x.slot === 0); return [r.name, r.pr]; }), ['Ombre b', 7], 'l\'invité voit le nom et le prestige de l\'hôte');
    await A.click('#closeSet');
    // l'invité change de héros : le prestige suit le héros joué
    await B.evaluate(() => { meta.prest.magicien = { lv: 4, pts: {} }; });
    await B.click('.cx-pick[data-c="magicien"]'); await sleep(A, 600);
    t.eq(await A.evaluate(() => [NET.on, NET.peers[0].cls, NET.peers[0].pr]), [true, 'magicien', 4], 'prestige du Magicien reçu, connexion gardée');
    await A.click('#coopBtn');
    t.eq(await A.evaluate(() => [...document.querySelectorAll('#coopBody .coopros li')].map((li) => li.querySelector('.prb').textContent + ' ' + li.querySelector('.coopname').textContent)), ['7 Ombre b', '4 Joueur-' + bid], 'salon : prestige à gauche du nom, pour chaque joueur');
    await A.click('#closeCoop');
    await B.click('#coopBtn');
    t.eq(await B.evaluate(() => [...document.querySelectorAll('#coopBody .coopros li .prb')].map((x) => x.textContent)), ['7', '4'], 'salon de l\'invité');
    await B.click('#closeCoop');
    await A.click('#startBtn'); await wf(B, () => started && G && G.mates.length === 1, 'B attend 7', 8000); await sleep(A, 800);
    t.eq(await B.evaluate(() => { const w = who(G.mates[0].slot); return [w.name, w.pr]; }), ['Ombre b', 7], 'en mission, l\'invité affiche « 7 Ombre b » au-dessus de l\'hôte');
    t.eq(await A.evaluate(() => { const w = who(G.mates[0].slot); return [w.name, w.pr]; }), ['Joueur-' + bid, 4], 'et l\'hôte « 4 Joueur-… » au-dessus de l\'invité');
  } },
  { name: 'Capture à deux (cible, capture et récompense synchronisées) puis Brèche', fn: async (b, t) => {
    const [A, B] = await pair(b, t);
    await A.click('.cx-pick[data-m="capture"]'); await sleep(A, 300);
    await A.click('#startBtn'); await wf(B, () => started && G && G.target, 'B attend 8', 8000);
    t.eq(await B.evaluate(() => G.mode), 'capture', 'invité en Capture, cible reçue');
    // l'invité se place sur la cible, l'hôte la met à terre : la capture compte l'invité
    await A.evaluate(() => { G.target.hp = 0; G.target.downed = true; G.target.spd = 0; });
    const tp = await A.evaluate(() => [G.target.x, G.target.y]);
    await B.evaluate(([x, y]) => { G.P.x = x + 30; G.P.y = y; }, tp);
    await wf(A, () => !!G.exitPt, 'A attend 9', 8000); await sleep(A, 500);
    t.ok(await B.evaluate(() => !!G.exitPt && G.loot.relics.length >= 1), 'extraction et relique de capture chez l\'invité');
    await A.evaluate(() => { missionSuccess(); }); await wf(B, () => G.over, 'B attend 10', 5000);
    await A.click('#changeBtn').catch(() => {}); await A.evaluate(() => { $('over').hidden = true; started = false; $('intro').hidden = false; refreshMenus(); });
    await A.click('.cx-pick[data-m="breche"]'); await sleep(A, 300);
    t.eq(await A.evaluate(() => meta.mode), 'breche', 'Brèche choisie');
    await A.evaluate(() => { $('startBtn').click(); }); await wf(B, () => started && G && !G.over, 'B attend 11', 8000);
    t.eq(await B.evaluate(() => [G.mode, G.breche]), ['survie', true], 'invité en Brèche');
  } },
];
