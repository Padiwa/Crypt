// Coopération (WebRTC local) : connexion par QR codes et par code à 4 chiffres (relais local), mission, noms. Lente : ignorée avec --quick.
import { newPage, sleep, GAME } from '../lib.mjs';
import { startRelay } from '../relais-local.mjs';
export const slow = true;

// Attente nommée : en cas de délai dépassé, dit laquelle et dans quel état était la page.
async function wf(p, fn, what, timeout = 8000, other = null) {
  try { await p.waitForFunction(fn, null, { timeout }); } catch (e) {
    const st = (q) => q.evaluate(() => JSON.stringify({ started, over: !!(G && G.over), mode: G && G.mode, on: NET.on, state: NET.state, slot: NET.slot, peers: NET.peers.map((x) => [x.state, x.cls]), err: localStorage.getItem('crypte-err') })).catch(() => '?');
    throw new Error(`${what} : délai dépassé ${await st(p)}${other ? ' · autre page ' + await st(other) : ''}`);
  }
}

// Connecte deux pages (A héberge, B rejoint) et ferme les fenêtres de coopération.
// Relais local (même logique que le Worker Cloudflare), lancé au premier test qui en a besoin.
let R = null; const relay = async () => R || (R = await startRelay());
// Une page avec le relais donné (« off » : QR codes seulement) et un héros.
async function coopPage(b, t, url, cls) {
  const p = t.track(await newPage(b));
  await p.evaluate(([u, c]) => { localStorage.setItem('crypte-relay', u); if (c) localStorage.setItem('crypte-cls', c); }, [url, cls]); await p.reload();
  return p;
}
// Par code : A crée la partie, les autres pages tapent le code.
async function pairCode(b, t, n = 1) {
  const { url } = await relay();
  const A = await coopPage(b, t, url, 'archer'), G = [];
  for (let i = 0; i < n; i++) G.push(await coopPage(b, t, url, ['guerrier', 'magicien', 'archer'][i]));
  await A.click('#coopBtn'); await A.click('[data-coop="create"]');
  await wf(A, () => /^\d{4}$/.test(($('coopCode4') || {}).textContent || ''), 'A attend le code', 8000);
  const code = await A.evaluate(() => $('coopCode4').textContent);
  for (const P of G) { await P.click('#coopBtn'); await P.fill('#coopCode', code); }
  for (const P of G) await wf(P, () => NET.on && NET.roster.length > 1, 'invité attend la connexion', 15000, A);
  return { A, G, code };
}

async function pair(b, t) {
  const A = await coopPage(b, t, 'off'), B = await coopPage(b, t, 'off', 'guerrier');
  await A.click('#coopBtn'); await A.click('[data-coop="host"]');
  await wf(A, () => NET.peers.some((p) => p.code), 'A attend 1', 15000);
  const offer = await A.evaluate(() => NET.peers.find((p) => p.code).code);
  await B.click('#coopBtn'); await B.click('[data-coop="join"]'); await B.fill('#coopIn', offer); await B.click('[data-coop="joingo"]');
  await wf(B, () => NET.state === 'showAnswer', 'B attend 2', 15000, A);
  await A.fill('#coopIn', await B.evaluate(() => NET.code)); await A.click('[data-coop="answer"]');
  await wf(A, () => NET.on, 'A attend 3', 15000); await wf(B, () => NET.on, 'B attend 4', 15000, A);
  await A.click('#closeCoop'); await B.click('#closeCoop');
  return [A, B];
}

export const tests = [
  { name: 'deux joueurs se connectent et jouent une Survie', fn: async (b, t) => {
    const [A, B] = await pair(b, t);
    await A.click('#startBtn'); await wf(B, () => started, 'B attend 5', 8000, A); await sleep(A, 3000);
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
    await A.click('#startBtn'); await wf(B, () => started && G && !G.over, 'B attend 6', 8000, A); await sleep(A, 2500);
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
    await A.click('#startBtn'); await wf(B, () => started && G && G.mates.length === 1, 'B attend 7', 8000, A); await sleep(A, 800);
    t.eq(await B.evaluate(() => { const w = who(G.mates[0].slot); return [w.name, w.pr]; }), ['Ombre b', 7], 'en mission, l\'invité affiche « 7 Ombre b » au-dessus de l\'hôte');
    t.eq(await A.evaluate(() => { const w = who(G.mates[0].slot); return [w.name, w.pr]; }), ['Joueur-' + bid, 4], 'et l\'hôte « 4 Joueur-… » au-dessus de l\'invité');
  } },
  { name: 'Capture à deux (cible, capture, récompense et cible suivante synchronisées) puis Brèche', fn: async (b, t) => {
    const [A, B] = await pair(b, t);
    await A.click('.cx-pick[data-m="capture"]'); await sleep(A, 300);
    await A.click('#startBtn'); await wf(B, () => started && G && G.target, 'B attend 8', 8000, A);
    t.eq(await B.evaluate(() => G.mode), 'capture', 'invité en Capture, cible reçue');
    // l'invité se place sur la cible, l'hôte la met à terre : la capture compte l'invité
    await A.evaluate(() => { G.target.hp = 0; G.target.downed = true; G.target.spd = 0; });
    const tp = await A.evaluate(() => [G.target.x, G.target.y]);
    await B.evaluate(([x, y]) => { G.P.x = x + 30; G.P.y = y; }, tp);
    await wf(A, () => !!G.exitPt, 'A attend 9', 8000); await sleep(A, 500);
    t.ok(await B.evaluate(() => !!G.exitPt && G.loot.relics.length >= 1), 'extraction et relique de capture chez l\'invité');
    // capture en chaîne : la cible suivante arrive aussi chez l'invité, avec le compteur et le bandeau
    await wf(B, () => G.target && !G.target.downed && G.capN === 1, 'B attend la cible 2', 10000, A);
    t.eq(await B.evaluate(() => [$('lvlTxt').textContent, $('objK').textContent]), ['1 capture', 'Traque la cible 2'], 'invité : cible 2 affichée');
    await A.evaluate(() => { missionSuccess(); }); await wf(B, () => G.over, 'B attend 10', 5000, A);
    await A.click('#changeBtn').catch(() => {}); await A.evaluate(() => { $('over').hidden = true; started = false; $('intro').hidden = false; refreshMenus(); });
    await A.click('.cx-pick[data-m="breche"]'); await sleep(A, 300);
    t.eq(await A.evaluate(() => meta.mode), 'breche', 'Brèche choisie');
    await A.evaluate(() => { $('startBtn').click(); }); await wf(B, () => started && G && !G.over, 'B attend 11', 8000, A);
    t.eq(await B.evaluate(() => [G.mode, G.breche]), ['survie', true], 'invité en Brèche');
  } },
  { name: 'code à 4 chiffres : l\'hôte crée la partie, deux joueurs tapent le code et arrivent ensemble', fn: async (b, t) => {
    const { A, G: [B, C], code } = await pairCode(b, t, 2);
    t.ok(/^\d{4}$/.test(code), 'code de 4 chiffres affiché chez l\'hôte');
    t.eq(await A.evaluate(() => [NET.peers.filter((p) => p.state === 'open').length, document.querySelectorAll('#coopBody .coopros li').length, $('coopBtn').textContent.trim()]), [2, 3, 'Coop · 3'], 'deux invités connectés, trois joueurs dans le salon');
    t.eq(await B.evaluate(() => [RL.ws === null, NET.roster.map((r) => r.cls)]), [true, ['archer', 'guerrier', 'magicien']], 'l\'invité a quitté le relais et voit les trois joueurs');
    await A.click('#closeCoop'); await B.click('#closeCoop'); await C.click('#closeCoop');
    await A.click('#startBtn');
    await wf(B, () => started && G && !G.over, 'B attend la mission', 8000, A); await wf(C, () => started && G && !G.over, 'C attend la mission', 8000, A); await sleep(A, 1500);
    t.eq(await A.evaluate(() => G.mates.length), 2, 'l\'hôte voit ses deux partenaires');
    t.eq(await C.evaluate(() => G.mates.length), 2, 'chaque invité voit les deux autres');
  } },
  { name: 'code : partie inconnue, relais injoignable (repli sur les QR codes), lien d\'invitation', fn: async (b, t) => {
    const { url } = await relay();
    const B = await coopPage(b, t, url, 'guerrier');
    await B.click('#coopBtn'); await B.fill('#coopCode', '0000');
    await wf(B, () => /Aucune partie avec le code 0000/.test($('coopBody').textContent), 'B attend le refus', 8000);
    t.ok(await B.evaluate(() => !NET.guest && !!$('coopCode')), 'code inconnu : message clair, on peut retaper');
    const X = await coopPage(b, t, 'ws://127.0.0.1:9', 'archer');
    await X.click('#coopBtn'); await X.click('[data-coop="create"]');
    await wf(X, () => /Relais injoignable/.test($('coopBody').textContent), 'X attend l\'erreur du relais', 8000);
    t.ok(await X.evaluate(() => NET.host && !!document.querySelector('[data-coop="add"]')), 'relais injoignable : invitation par QR codes proposée');
    // lien d'invitation : la page s'ouvre avec #coop=<code> et rejoint toute seule
    const A = await coopPage(b, t, url, 'archer');
    await A.click('#coopBtn'); await A.click('[data-coop="create"]');
    await wf(A, () => /^\d{4}$/.test(($('coopCode4') || {}).textContent || ''), 'A attend le code', 8000);
    const code = await A.evaluate(() => $('coopCode4').textContent);
    const L = await coopPage(b, t, url, 'magicien');
    await L.goto(GAME + '#coop=' + code);
    await wf(L, () => NET.on && NET.roster.length === 2, 'L attend la connexion par le lien', 15000, A);
    t.eq(await L.evaluate(() => location.hash), '', 'le code est retiré de l\'adresse');
  } },
  { name: 'code : l\'hôte retire un joueur, change de code, ferme l\'accès ; site non autorisé', fn: async (b, t) => {
    const { A, G: [B], code } = await pairCode(b, t, 1);
    t.ok(await A.evaluate(() => /a rejoint la partie/.test($('toast').textContent)), 'l\'hôte est prévenu de l\'arrivée');
    await A.click('#coopBody [data-coop="kick"][data-arg="1"]');
    await wf(B, () => !NET.on && /retiré de la partie/.test($('coopBody').textContent), 'B attend d\'être retiré', 8000, A);
    t.eq(await A.evaluate(() => NET.peers.length), 0, 'l\'hôte n\'a plus de joueur');
    await A.click('#coopBody [data-coop="newcode"]');
    await wf(A, () => NET.relay === 'on' && /^\d{4}$/.test(($('coopCode4') || {}).textContent || ''), 'A attend le nouveau code', 8000);
    const code2 = await A.evaluate(() => $('coopCode4').textContent);
    if (code2 !== code) {
      await B.fill('#coopCode', code);
      await wf(B, () => /Aucune partie avec le code/.test($('coopBody').textContent), 'B attend le refus de l\'ancien code', 8000);
    }
    await A.click('#coopBody [data-coop="shut"]');
    t.ok(await A.evaluate(() => NET.relay === 'closed' && /Accès fermé/.test($('coopBody').textContent) && RL.ws === null), 'accès fermé');
    await B.fill('#coopCode', code2);
    await wf(B, () => /Aucune partie avec le code/.test($('coopBody').textContent), 'B attend le refus après fermeture', 8000);
    // relais réservé à un autre site : la page locale est refusée, avec l'explication
    const R2 = await startRelay({ origins: 'https://moi.github.io' });
    try {
      const X = await coopPage(b, t, R2.url, 'archer');
      await X.click('#coopBtn'); await X.click('[data-coop="create"]');
      await wf(X, () => /pas autorisé par le relais/.test($('coopBody').textContent), 'X attend le refus du site', 8000);
    } finally { await R2.close(); }
  } },
  { name: 'par défaut, la coopération passe par le relais Cloudflare (code à 4 chiffres)', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.click('#coopBtn');
    t.eq(await p.evaluate(() => [RELAY_URL, !!document.querySelector('#coopBody [data-coop="create"]'), !!$('coopCode')]), ['wss://crypte-relais.cryptcendre.workers.dev', true, true], '« Créer une partie » et le champ du code, sans réglage');
  } },
  { name: 'code : coupure, rechargement de l\'invité puis de l\'hôte, raison affichée, reconnexion automatique', fn: async (b, t) => {
    const { A, G: [B], code } = await pairCode(b, t, 1);
    // l'invité passe en arrière-plan puis la liaison se coupe : l'hôte en donne la raison, l'invité revient tout seul par le code
    await B.evaluate(() => netSend({ t: 'bg', on: 1 })); await sleep(A, 200);
    await A.evaluate(() => NET.peers[0].pc.close());
    await wf(A, () => NET.drop && NET.drop.why, 'A attend la coupure', 8000);
    await wf(B, () => NET.on && NET.roster.length === 2, 'B attend la reconnexion', 20000, A);
    t.ok(await A.evaluate(() => NET.drop.them && /arrière-plan/.test(dropTxt(NET.drop))), 'raison chez l\'hôte : l\'invité était en arrière-plan');
    t.ok(await B.evaluate(() => !!NET.drop && /Reconnecté/.test($('toast').textContent)), 'l\'invité est reconnecté');
    // l'invité recharge la page (mise à jour) : il rejoint la même partie
    await B.reload();
    await wf(B, () => NET.on && NET.roster.length === 2, 'B attend de revenir après rechargement', 20000, A);
    // l'hôte recharge : il rouvre sa salle sous le même code, l'invité revient
    await A.reload();
    await wf(A, () => NET.host && NET.relay === 'on', 'A attend sa salle rouverte', 10000);
    t.eq(await A.evaluate(() => RL.code), code, 'même code après rechargement de l\'hôte');
    await wf(B, () => NET.on && NET.roster.length === 2, 'B attend de revenir après le rechargement de l\'hôte', 25000, A);
    // l'hôte ferme la partie : pas de reconnexion, message clair
    await A.click('#coopBtn'); await A.click('#coopBody [data-coop="quit"]');
    await wf(B, () => !NET.on && !NET.retry && NET.drop && NET.drop.why === 'end', 'B attend la fin de partie', 8000, A);
    await B.click('#coopBtn');
    t.ok(await B.evaluate(() => /a fermé la partie/.test($('coopBody').textContent)), 'invité : « l\'hôte a fermé la partie »');
  } },
];
