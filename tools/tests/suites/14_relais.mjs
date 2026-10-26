// Relais de mise en relation (relais/src/salle.js, la logique du Worker Cloudflare) : servi en local, testé par des clients WebSocket de Node.
import { startRelay } from '../relais-local.mjs';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function client(url) {
  const ws = new WebSocket(url); ws.got = []; ws.code = null;
  ws.onmessage = (e) => ws.got.push(e.data === 'pong' ? 'pong' : JSON.parse(e.data)); ws.onclose = (e) => { ws.code = e.code; };
  return new Promise((r) => { ws.onopen = () => { ws.send('{"t":"hi"}'); r(ws); }; ws.onerror = () => r(ws); });
}

export const tests = [
  { name: 'salle : offre et réponse passent entre l\'hôte et l\'invité', fn: async (b, t) => {
    if (typeof WebSocket === 'undefined') { t.ok(true); return; }
    const R = await startRelay();
    try {
      const H = await client(R.url + '/r/1234?role=h&k=s1'); await wait(60);
      const G = await client(R.url + '/r/1234?role=g'); await wait(60);
      const id = G.got[0] && G.got[0].id;
      t.eq([H.got[0] && H.got[0].t, G.got[0] && G.got[0].t, H.got.some((m) => m.t === 'join' && m.id === id)], ['ok', 'ok', true], 'salle ouverte, invité annoncé à l\'hôte');
      H.send(JSON.stringify({ to: id, t: 'offer', sdp: 'OFFRE', v: 8 })); await wait(60);
      t.ok(G.got.some((m) => m.t === 'offer' && m.sdp === 'OFFRE' && !('to' in m)), 'offre transmise à l\'invité');
      G.send(JSON.stringify({ t: 'answer', sdp: 'R'.repeat(9000) })); await wait(60);
      t.ok(H.got.some((m) => m.t === 'answer' && m.sdp.length === 9000 && m.from === id), 'réponse de 9 ko transmise à l\'hôte, avec l\'expéditeur');
      G.send('ping'); await wait(60); t.ok(G.got.includes('pong'), 'battement ping → pong');
      G.close(); await wait(80); t.ok(H.got.some((m) => m.t === 'left' && m.id === id), 'départ de l\'invité signalé');
      H.close();
    } finally { await R.close(); }
  } },
  { name: 'salle : code pris, code sans hôte, reprise par le même hôte, fermeture', fn: async (b, t) => {
    if (typeof WebSocket === 'undefined') { t.ok(true); return; }
    const R = await startRelay();
    try {
      const H = await client(R.url + '/r/4321?role=h&k=s1'); await wait(50);
      const G = await client(R.url + '/r/4321?role=g'); await wait(50);
      const X = await client(R.url + '/r/4321?role=h&k=autre'); await wait(80);
      t.eq([X.got[0] && X.got[0].t, X.code], ['taken', 4001], 'un autre hôte ne prend pas la salle');
      const N = await client(R.url + '/r/9999?role=g'); await wait(80);
      t.eq([N.got[0] && N.got[0].t, N.code], ['nohost', 4001], 'code sans hôte refusé');
      const H2 = await client(R.url + '/r/4321?role=h&k=s1'); await wait(80);
      t.ok(H2.got[0] && H2.got[0].t === 'ok' && H2.got.some((m) => m.t === 'join') && H.code === 4000 && !G.got.some((m) => m.t === 'hostgone'), 'le même hôte reprend sa salle (coupure réseau) sans renvoyer l\'invité');
      H2.close(); await wait(80);
      t.eq([G.got.some((m) => m.t === 'hostgone'), G.code], [true, 4002], 'l\'hôte parti, la salle se ferme pour l\'invité');
    } finally { await R.close(); }
  } },
];
