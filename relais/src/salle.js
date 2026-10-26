// Crypte des Cendres — relais de mise en relation : la logique d'une salle (un code à 4 chiffres).
// L'hôte et ses invités s'y échangent les descriptions de connexion WebRTC (offre de l'hôte, réponse de l'invité).
// Ensuite la partie passe directement d'un appareil à l'autre : le relais ne voit jamais le jeu.
// Fonctions sans état propre, sur un « ctx » qui suit l'API des Durable Objects de Cloudflare (acceptWebSocket, getWebSockets,
// pièces jointes des sockets) : elles tournent telles quelles dans le Worker et dans le relais local des tests.

export const MAX_GUESTS = 6;   // invités dans la salle en même temps (en attente ou déjà connectés)
export const MAX_MSG = 16384;  // taille maximale d'un message, en caractères
// Frein contre les codes essayés au hasard : au-delà de 20 codes sans partie en 10 minutes depuis un même réseau (adresse IP),
// ce réseau ne peut plus rejoindre de partie pendant ces 10 minutes. Trouver un code par hasard prendrait alors des jours.
export const GARDE = { max: 20, win: 10 * 60 * 1000 };
export function gardeMaj(f, now, echec) { f = (f || []).filter((t) => now - t < GARDE.win); if (echec) f.push(now); return { f, bloque: f.length >= GARDE.max }; }
// Sites autorisés (variable ORIGINES du Worker, séparés par des virgules ; « *.exemple.com » vaut pour ses sous-domaines). Vide : tous.
export function originOk(origin, list) {
  const L = String(list || '').split(',').map((s) => s.trim().toLowerCase().replace(/\/+$/, '')).filter(Boolean);
  if (!L.length) return true;
  const o = String(origin || '').toLowerCase(); if (!o || o === 'null') return false;
  let host = ''; try { host = new URL(o).host; } catch (e) { return false; }
  return L.some((x) => x === o || (x.startsWith('*.') && (host === x.slice(2) || host.endsWith(x.slice(1)))));
}

const att = (w) => { try { return w.deserializeAttachment() || {}; } catch (e) { return {}; } };
const send = (w, m) => { try { w.send(JSON.stringify(m)); } catch (e) {} };
const sid = () => Math.random().toString(36).slice(2, 10);
// Sockets vivantes d'une étiquette, sans celles qui se ferment (not = identifiant à exclure).
const live = (ctx, tag, not) => ctx.getWebSockets(tag).filter((w) => { const a = att(w); return !a.gone && a.sid !== not; });
function accept(ctx, ws, tags, a) { ctx.acceptWebSocket(ws, tags); ws.serializeAttachment(a); }

// Arrivée d'un appareil. role : 'h' (hôte) ou 'g' (invité). key : secret de l'hôte, pour reprendre sa salle après une coupure.
// refus : raison décidée en amont par le Worker ('origin' : site non autorisé ; 'slow' : trop de codes faux depuis ce réseau).
// Rien n'est envoyé au nouvel arrivant avant son premier message (« hi ») : la réponse à « hi » dit s'il est entré, et pourquoi sinon.
// Renvoie 'nohost' quand un invité tape un code sans partie (compté par le frein).
export function join(ctx, ws, role, key, refus) {
  if (refus) return accept(ctx, ws, ['x'], { role: 'x', sid: sid(), why: refus });
  if (role === 'h') {
    const hosts = live(ctx, 'h');
    if (hosts.some((h) => !key || att(h).key !== key)) return accept(ctx, ws, ['x'], { role: 'x', sid: sid(), why: 'taken' });
    for (const h of hosts) { h.serializeAttachment({ ...att(h), gone: true }); try { h.close(4000, 'remplace'); } catch (e) {} }
    return accept(ctx, ws, ['h'], { role: 'h', sid: sid(), key });
  }
  if (!live(ctx, 'h').length) { accept(ctx, ws, ['x'], { role: 'x', sid: sid(), why: 'nohost' }); return 'nohost'; }
  if (live(ctx, 'g').length >= MAX_GUESTS) return accept(ctx, ws, ['x'], { role: 'x', sid: sid(), why: 'full' });
  const id = sid();
  accept(ctx, ws, ['g', 'g:' + id], { role: 'g', sid: id, id });
  for (const h of live(ctx, 'h')) send(h, { t: 'join', id });
}

// Message reçu. « hi » : réponse d'accueil. Sinon, de l'hôte vers l'invité désigné par « to », ou d'un invité vers l'hôte (avec « from »).
export function message(ctx, ws, data) {
  if (typeof data !== 'string' || data.length > MAX_MSG) return;
  let m; try { m = JSON.parse(data); } catch (e) { return; }
  if (!m || typeof m !== 'object' || Array.isArray(m)) return;
  const a = att(ws);
  if (m.t === 'hi') {
    if (a.role === 'x') { send(ws, { t: a.why }); try { ws.close(4001, String(a.why)); } catch (e) {} }
    else if (a.role === 'h') { send(ws, { t: 'ok' }); for (const g of live(ctx, 'g')) send(ws, { t: 'join', id: att(g).id }); }
    else if (a.role === 'g') send(ws, { t: 'ok', id: a.id });
    return;
  }
  if (a.role === 'h') { const to = String(m.to || ''); delete m.to; if (to) for (const g of live(ctx, 'g:' + to)) send(g, m); }
  else if (a.role === 'g') { m.from = a.id; for (const h of live(ctx, 'h')) send(h, m); }
}

// Départ : l'hôte qui part ferme la salle ; un invité qui part est signalé à l'hôte.
export function closed(ctx, ws) {
  const a = att(ws); if (a.gone || a.role === 'x') return;
  try { ws.serializeAttachment({ ...a, gone: true }); } catch (e) {}
  // (un invité fermé par le relais est marqué tout de suite : getWebSockets peut encore le rendre tant qu'il n'a pas répondu à la fermeture)
  if (a.role === 'h') for (const g of live(ctx, 'g', a.sid)) { send(g, { t: 'hostgone' }); try { g.serializeAttachment({ ...att(g), gone: true }); g.close(4002, 'hote parti'); } catch (e) {} }
  else if (a.role === 'g') for (const h of live(ctx, 'h', a.sid)) send(h, { t: 'left', id: a.id });
}
