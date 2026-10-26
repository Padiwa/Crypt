// Crypte des Cendres — relais de mise en relation (Cloudflare Worker + Durable Objects, offre gratuite).
//   wss://<ton-relais>.workers.dev/r/1234?role=h&k=<secret>   l'hôte ouvre la salle 1234
//   wss://<ton-relais>.workers.dev/r/1234?role=g              un invité y entre
// Une salle = un Durable Object (nommé par le code), qui ne garde rien sur disque : seulement les sockets ouvertes.
// Les sockets « hibernent » entre deux messages (API WebSocket Hibernation) et le battement « ping » reçoit « pong » sans réveiller la salle.
import { DurableObject } from 'cloudflare:workers';
import { join, message, closed } from './salle.js';

export class Salle extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  async fetch(req) {
    const u = new URL(req.url), pair = new WebSocketPair(), [client, server] = Object.values(pair);
    join(this.ctx, server, u.searchParams.get('role') === 'h' ? 'h' : 'g', (u.searchParams.get('k') || '').slice(0, 40));
    return new Response(null, { status: 101, webSocket: client });
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
    return env.SALLES.get(env.SALLES.idFromName(m[1])).fetch(req);
  },
};
