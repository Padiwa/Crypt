// Crypte des Cendres — relais de mise en relation (Cloudflare Worker + Durable Objects, offre gratuite).
//   wss://<ton-relais>.workers.dev/r/1234?role=h&k=<secret>   l'hôte ouvre la salle 1234
//   wss://<ton-relais>.workers.dev/r/1234?role=g              un invité y entre
// Une salle = un Durable Object (nommé par le code), qui ne garde rien sur disque : seulement les sockets ouvertes.
// Protections : variable ORIGINES (sites autorisés, réglée dans le tableau de bord) et frein des codes faux par réseau (voir salle.js).
// Les sockets « hibernent » entre deux messages (API WebSocket Hibernation) et le battement « ping » reçoit « pong » sans réveiller la salle.
import { DurableObject } from 'cloudflare:workers';
import { join, message, closed, gardeMaj, originOk } from './salle.js';

export class Salle extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === '/garde') return this.garde(u.searchParams.get('a') === 'echec');
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    const r = join(this.ctx, server, u.searchParams.get('role') === 'h' ? 'h' : 'g', (u.searchParams.get('k') || '').slice(0, 40), u.searchParams.get('refus') || '');
    // code sans partie : compté pour ce réseau
    const ip = u.searchParams.get('ip');
    if (r === 'nohost' && ip) { try { await this.env.SALLES.get(this.env.SALLES.idFromName('garde:' + ip)).fetch('https://garde/garde?a=echec'); } catch (e) {} }
    return new Response(null, { status: 101, webSocket: client });
  }
  // Le même Durable Object sert aussi de garde pour un réseau (nommé « garde:<adresse IP> ») : il retient ses codes faux des 10 dernières minutes.
  async garde(echec) {
    const g = gardeMaj(await this.ctx.storage.get('f'), Date.now(), echec);
    if (echec) await this.ctx.storage.put('f', g.f);
    return Response.json({ bloque: g.bloque });
  }
  async webSocketMessage(ws, data) { message(this.ctx, ws, typeof data === 'string' ? data : ''); }
  async webSocketClose(ws) { closed(this.ctx, ws); try { ws.close(1000, 'fin'); } catch (e) {} }
  async webSocketError(ws) { closed(this.ctx, ws); }
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url), m = u.pathname.match(/^\/r\/(\d{4})$/);
    if (!m) return new Response('Relais de Crypte des Cendres : en service.\n', { headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' } });
    if ((req.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('WebSocket attendu.\n', { status: 426 });
    // Contrôles avant d'entrer dans la salle : site autorisé (ORIGINES), puis frein des codes faux pour un invité.
    const ip = req.headers.get('CF-Connecting-IP') || '', guest = u.searchParams.get('role') !== 'h';
    let refus = '';
    if (!originOk(req.headers.get('Origin'), env.ORIGINES)) refus = 'origin';
    else if (guest && ip) { try { const r = await env.SALLES.get(env.SALLES.idFromName('garde:' + ip)).fetch('https://garde/garde?a=voir'); if ((await r.json()).bloque) refus = 'slow'; } catch (e) {} }
    const to = new URL(req.url); to.searchParams.set('refus', refus); to.searchParams.set('ip', ip);
    return env.SALLES.get(env.SALLES.idFromName(m[1])).fetch(new Request(to, req));
  },
};
