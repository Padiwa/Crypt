// Crypte des Cendres — relais local pour les tests : la même logique de salle que le Worker Cloudflare (relais/src/salle.js),
// servie en WebSocket sur 127.0.0.1, sans dépendance (serveur WebSocket minimal : messages texte, ping, fermeture).
//   const R = await startRelay();  …  R.url = 'ws://127.0.0.1:<port>' ;  await R.close();
import http from 'http';
import crypto from 'crypto';
import { join, message, closed } from '../../relais/src/salle.js';

// Une salle : l'équivalent du « ctx » d'un Durable Object (sockets acceptées et leurs étiquettes).
class Ctx {
  constructor() { this.socks = new Set(); }
  acceptWebSocket(ws, tags) { ws.tags = tags; this.socks.add(ws); }
  getWebSockets(tag) { return [...this.socks].filter((w) => !tag || w.tags.includes(tag)); }
}

// Socket côté serveur avec l'interface utilisée par salle.js (send, close, pièces jointes).
class Sock {
  constructor(sock, ctx) { this.s = sock; this.ctx = ctx; this.att = null; this.open = true; this.buf = Buffer.alloc(0); this.tags = []; }
  serializeAttachment(a) { this.att = JSON.parse(JSON.stringify(a)); }
  deserializeAttachment() { return this.att; }
  send(text) { if (this.open) this.s.write(frame(0x1, Buffer.from(String(text)))); }
  close(code = 1000, reason = '') {
    if (!this.open) return; this.open = false;
    const r = Buffer.from(String(reason)), p = Buffer.alloc(2 + r.length); p.writeUInt16BE(code, 0); r.copy(p, 2);
    try { this.s.write(frame(0x8, p)); this.s.end(); } catch (e) {}
    this.gone();
  }
  gone() { if (this.done) return; this.done = true; this.open = false; closed(this.ctx, this); this.ctx.socks.delete(this); }
  feed(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    for (;;) {
      if (this.buf.length < 2) return;
      const op = this.buf[0] & 0x0f, masked = this.buf[1] & 0x80; let len = this.buf[1] & 0x7f, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      const mk = masked ? this.buf.subarray(off, off + 4) : null; if (masked) off += 4;
      if (this.buf.length < off + len) return;
      const data = Buffer.from(this.buf.subarray(off, off + len)); this.buf = this.buf.subarray(off + len);
      if (mk) for (let i = 0; i < data.length; i++) data[i] ^= mk[i & 3];
      if (op === 0x1) { const t = data.toString('utf8'); if (t === 'ping') this.send('pong'); else message(this.ctx, this, t); }
      else if (op === 0x8) { this.close(1000, ''); return; }
      else if (op === 0x9) { try { this.s.write(frame(0xA, data)); } catch (e) {} }
    }
  }
}
function frame(op, payload) {
  const n = payload.length, head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : (() => { const h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); return h; })();
  return Buffer.concat([head, payload]);
}

export async function startRelay(port = 0) {
  const rooms = new Map();
  const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); res.end('Relais local de Crypte des Cendres : en service.\n'); });
  srv.on('upgrade', (req, sock) => {
    const u = new URL(req.url, 'http://x'), m = u.pathname.match(/^\/r\/(\d{4})$/), key = req.headers['sec-websocket-key'];
    if (!m || !key) { sock.destroy(); return; }
    const acceptKey = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acceptKey}\r\n\r\n`);
    if (!rooms.has(m[1])) rooms.set(m[1], new Ctx());
    const ctx = rooms.get(m[1]), ws = new Sock(sock, ctx);
    sock.on('data', (c) => ws.feed(c)); sock.on('close', () => ws.gone()); sock.on('error', () => ws.gone());
    join(ctx, ws, u.searchParams.get('role') === 'h' ? 'h' : 'g', (u.searchParams.get('k') || '').slice(0, 40));
  });
  await new Promise((r) => srv.listen(port, '127.0.0.1', r)); srv.unref();
  const url = `ws://127.0.0.1:${srv.address().port}`;
  return { url, rooms, close: () => new Promise((r) => { for (const c of rooms.values()) for (const s of c.socks) try { s.s.destroy(); } catch (e) {} srv.close(() => r()); }) };
}

// Lancé seul : un relais local à essayer avec deux navigateurs (localStorage « crypte-relay » = l'adresse affichée).
if (import.meta.url === `file://${process.argv[1]}`) { const R = await startRelay(+process.argv[2] || 8787); console.log('Relais local :', R.url); }
