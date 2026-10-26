// Crypte des Cendres — simulateur de progression : rapport HTML à partir des carrières simulées.
//   node tools/progression/report.mjs resultats/*.jsonl --notes analyse.html --out rapport.html
// Chaque .jsonl est une carrière (une ligne par mission) ; son fichier _jalons.json voisin donne les jalons.
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const out = opt('out', 'rapport.html'), notes = opt('notes', null), version = opt('version', '');
const files = args.filter((f) => f.endsWith('.jsonl'));
const CLSN = { archer: 'Archer', guerrier: 'Guerrier', magicien: 'Magicien' };
const COL = { archer: 'var(--c1)', guerrier: 'var(--c2)', magicien: 'var(--c3)' };
const TIERN = ['Normal', 'Difficile', 'Cauchemar', ...['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map((r) => 'T' + r)];

const runs = files.map((f) => {
  const rows = fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const jf = f.replace(/\.jsonl$/, '_jalons.json');
  const j = fs.existsSync(jf) ? JSON.parse(fs.readFileSync(jf, 'utf8')) : { miles: {} };
  const cls = j.cls || path.basename(f).split('_')[0];
  // jalons recalculés depuis le journal (le fichier _jalons.json complète les fabrications)
  const miles = { ...(j.miles || {}) }, set = (k, x) => { if (!miles[k] || miles[k].n > x.n) miles[k] = { n: x.n, h: x.h }; };
  for (const x of rows) {
    if (!x.died) { set('win', x); set('win_' + x.tn, x); }
    if (['armure', 'amulette', 'bottes', 'anneau'].every((k) => x.gear[k])) set('slots4', x);
    for (const L of [5, 10, 20, 30, 40, 50]) if (x.bank.maxL >= L) set('L' + L, x);
    if (Object.values(x.gear).some((g) => g && g[1] >= 1)) set('rank2', x);
    for (let r = 3; r <= 6; r++) if (Object.values(x.gear).some((g) => g && g[0] >= r)) set('own' + r, x);
    if (x.opened > 0) set('relic1', x);
    if (x.up >= 33) set('forge_max', x);
    if ('anneau2' in x.gear) set('slot_anneau2', x);
    if ('dos' in x.gear) set('slot_dos', x);
    if (!x.died && x.tier === 12 && x.bank.maxL >= 50 && 'dos' in x.gear && Object.values(x.gear).filter((g) => g && g[0] >= 6).length >= 5) set('endgame', x);
  }
  return { f, cls, rows, miles };
});
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fr = (x, d = 0) => Number(x).toLocaleString('fr-FR', { maximumFractionDigits: d, minimumFractionDigits: d });
const hfmt = (h) => h < 1 ? `${Math.round(h * 60)} min` : `${fr(h, 1)} h`;

// ---------- Graphiques SVG (une échelle par axe, couleurs prises dans les jetons du thème) ----------
function chart({ series, yLog = false, yTicks, yFmt = (v) => fr(v), xMax, xLabel = 'heures de jeu', yLabel = '', h = 260, step = false }) {
  const W = 720, H = h, L = 84, R = 16, T = 14, B = 40, pw = W - L - R, ph = H - T - B;
  const ys = series.flatMap((s) => s.pts.map((p) => p[1])).filter((v) => !yLog || v > 0);
  let y0 = yLog ? Math.min(...ys) : 0, y1 = Math.max(...ys);
  if (yTicks) { y0 = Math.min(y0, yTicks[0]); y1 = Math.max(y1, yTicks[yTicks.length - 1]); }
  const tr = (v) => yLog ? Math.log10(v) : v;
  const X = (x) => L + (x / xMax) * pw, Y = (v) => T + ph - ((tr(v) - tr(y0)) / ((tr(y1) - tr(y0)) || 1)) * ph;
  const ticks = yTicks || Array.from({ length: 5 }, (_, i) => y0 + (y1 - y0) * i / 4);
  const xt = []; const xs = xMax <= 3 ? .5 : xMax <= 8 ? 1 : xMax <= 20 ? 2 : xMax <= 50 ? 5 : 10; for (let x = 0; x <= xMax + 1e-9; x += xs) xt.push(x);
  let g = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(yLabel)}">`;
  for (const v of ticks) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="tick">${esc(yFmt(v))}</text>`;
  for (const x of xt) g += `<text x="${X(x)}" y="${H - B + 18}" text-anchor="middle" class="tick">${fr(x, xs < 1 ? 1 : 0)}</text>`;
  g += `<text x="${L + pw / 2}" y="${H - 4}" text-anchor="middle" class="axis">${esc(xLabel)}</text>`;
  for (const s of series) {
    const P = s.pts.filter((p) => !yLog || p[1] > 0); if (!P.length) continue;
    let d = ''; P.forEach((p, i) => { const x = X(p[0]), y = Y(p[1]); if (!i) d += `M${x},${y}`; else if (step) d += `H${x}V${y}`; else d += `L${x},${y}`; });
    g += `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="2" stroke-linejoin="round"/>`;
    const e = P[P.length - 1]; g += `<circle cx="${X(e[0])}" cy="${Y(e[1])}" r="3.5" fill="${s.col}"/>`;
    for (const m of s.marks || []) g += `<circle cx="${X(m[0])}" cy="${Y(m[1])}" r="2.4" fill="var(--bad)"/>`;
  }
  return g + '</svg>';
}
const legend = (rs) => `<div class="legend">${rs.map((r) => `<span><i style="background:${COL[r.cls]}"></i>${CLSN[r.cls] || r.cls}</span>`).join('')}<span><i class="dot" style="background:var(--bad)"></i>mission perdue</span></div>`;

const xMax = Math.max(...runs.map((r) => r.rows.length ? r.rows[r.rows.length - 1].h : 1));
const rungVal = (r) => r.tier + Math.min(.9, (r.L - 1) / 55); // palier + fraction du niveau

// Progression : palier atteint au fil des heures
const chProg = chart({ series: runs.map((r) => ({ col: COL[r.cls], pts: r.rows.map((x) => [x.h, rungVal(x)]), marks: r.rows.filter((x) => x.died).map((x) => [x.h, rungVal(x)]) })),
  yTicks: TIERN.map((_, i) => i), yFmt: (v) => TIERN[Math.round(v)] || '', xMax, yLabel: 'Palier de difficulté au fil du temps', h: 340, step: true });
const chLvl = chart({ series: runs.map((r) => ({ col: COL[r.cls], pts: r.rows.map((x) => [x.h, x.bank.maxL]) })), yTicks: [0, 10, 20, 30, 40, 50], xMax, yLabel: 'Plus haute mission réussie' , step: true });
const chPow = chart({ series: runs.map((r) => ({ col: COL[r.cls], pts: r.rows.map((x) => [x.h, x.dps]) })), yLog: true, xMax, yLabel: 'Dégâts par seconde (échelle log)',
  yTicks: [10, 100, 1e3, 1e4, 1e5, 1e6].filter((v, i, a) => true), yFmt: (v) => v >= 1e6 ? fr(v / 1e6) + ' M' : v >= 1e3 ? fr(v / 1e3) + ' k' : fr(v) });
const chHp = chart({ series: runs.map((r) => ({ col: COL[r.cls], pts: r.rows.map((x) => [x.h, x.hp]) })), yLog: true, xMax, yLabel: 'Vie maximale (échelle log)', yTicks: [100, 1e3, 1e4, 1e5], yFmt: (v) => v >= 1e3 ? fr(v / 1e3) + ' k' : fr(v) });

// Jalons
const MILES = [['win', 'Première mission réussie'], ['slots4', 'Quatre emplacements équipés'], ['rank2', 'Un objet au rang 2'], ['relic1', 'Première relique ouverte'], ['own3', 'Premier objet légendaire'], ['L10', 'Mission de niveau 10'], ['forge_max', 'Bonus de la Forge au maximum'],
  ['L20', 'Mission de niveau 20'], ['win_Difficile', 'Réussite en Difficile'], ['win_Cauchemar', 'Réussite en Cauchemar'], ['slot_anneau2', '2e anneau débloqué'], ['win_Tourment I', 'Réussite en Tourment I'], ['own4', 'Premier objet ancestral'],
  ['L30', 'Mission de niveau 30'], ['win_Tourment V', 'Réussite en Tourment V'], ['win_Tourment VI', 'Réussite en Tourment VI'], ['own5', 'Premier objet sanguin'], ['own6', 'Premier objet abyssal'], ['slot_dos', 'Dos débloqué'], ['L40', 'Mission de niveau 40'], ['win_Tourment X', 'Réussite en Tourment X'], ['L50', 'Mission de niveau 50'], ['endgame', 'Fin de jeu : Tourment X niv. 50, 5 pièces abyssales']];
const mileTable = `<div class="tw"><table><thead><tr><th>Jalon</th>${runs.map((r) => `<th class="num"><span class="sw" style="background:${COL[r.cls]}"></span>${CLSN[r.cls]}</th>`).join('')}</tr></thead><tbody>${MILES.map(([k, n]) => `<tr><td>${n}</td>${runs.map((r) => { const m = r.miles[k]; return `<td class="num">${m ? `<b>${hfmt(m.h)}</b><small>mission ${m.n}</small>` : '<span class="na">non atteint</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;

// Morts et murs : par palier
const wallRows = TIERN.map((n, t) => { const c = runs.map((r) => { const R = r.rows.filter((x) => x.tier === t); return R.length ? { n: R.length, d: R.filter((x) => x.died).length, h: R.reduce((a, x) => a + x.t + 45, 0) / 3600 } : null; }); return { n, c }; }).filter((w) => w.c.some(Boolean));
const wallTable = `<div class="tw"><table><thead><tr><th>Palier</th>${runs.map((r) => `<th class="num">${CLSN[r.cls]}</th>`).join('')}</tr></thead><tbody>${wallRows.map((w) => `<tr><td>${w.n}</td>${w.c.map((c) => `<td class="num">${c ? `<b>${hfmt(c.h)}</b><small>${c.n} mission${c.n > 1 ? 's' : ''} · ${c.d} perdue${c.d > 1 ? 's' : ''}</small>` : '<span class="na">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

// Économie moyenne par mission, selon le palier
const econ = runs.map((r) => { const by = {}; for (const x of r.rows) { const b = by[x.tier] || (by[x.tier] = { n: 0, gold: 0, ess: 0, rel: 0, op: 0, kills: 0, boss: 0, t: 0 }); b.n++; b.gold += x.gold; b.ess += x.ess; b.rel += x.relics; b.op += x.opened; b.kills += x.kills; b.boss += x.boss; b.t += x.t; } return { cls: r.cls, by }; });
const econTable = `<div class="tw"><table><thead><tr><th>Classe · palier</th><th class="num">Durée</th><th class="num">Ennemis</th><th class="num">Gardiens</th><th class="num">Or</th><th class="num">Essence</th><th class="num">Reliques trouvées</th><th class="num">ouvertes</th></tr></thead><tbody>${econ.flatMap((e) => Object.entries(e.by).filter(([t]) => [0, 2, 3, 8, 12].includes(+t)).map(([t, b]) => `<tr><td>${CLSN[e.cls]} · ${TIERN[t]}</td><td class="num">${fr(b.t / b.n / 60, 1)} min</td><td class="num">${fr(b.kills / b.n)}</td><td class="num">${fr(b.boss / b.n, 1)}</td><td class="num">${fr(b.gold / b.n)}</td><td class="num">${fr(b.ess / b.n)}</td><td class="num">${fr(b.rel / b.n, 1)}</td><td class="num">${fr(b.op / b.n, 1)}</td></tr>`)).join('')}</tbody></table></div>`;

const totM = runs.reduce((a, r) => a + r.rows.length, 0), totH = runs.reduce((a, r) => a + (r.rows.length ? r.rows[r.rows.length - 1].h : 0), 0);
const notesHtml = notes && fs.existsSync(notes) ? fs.readFileSync(notes, 'utf8') : '';

const html = `<title>Banc de progression</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Mise en page : une colonne de lecture, des graphiques pleine largeur, des tableaux qui défilent seuls. */
:root{--bg:#f6f3f1;--panel:#fffdfb;--ink:#231d27;--muted:#6f6570;--line:#e2dad6;--ember:#c0561f;--c1:#2f7f86;--c2:#b4432f;--c3:#6b55c4;--bad:#d0313a;--good:#2f8a4f;
  --f-disp:'Cinzel',Georgia,serif;--f-body:'Source Sans 3',system-ui,sans-serif;--f-mono:'IBM Plex Mono',ui-monospace,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#17131a;--panel:#211b25;--ink:#ece4dc;--muted:#a69aa3;--line:#3a3140;--ember:#e8853b;--c1:#6cc3c9;--c2:#ef7b63;--c3:#a796f2;--bad:#ff5a62;--good:#5fbf7a;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#17131a;--panel:#211b25;--ink:#ece4dc;--muted:#a69aa3;--line:#3a3140;--ember:#e8853b;--c1:#6cc3c9;--c2:#ef7b63;--c3:#a796f2;--bad:#ff5a62;--good:#5fbf7a;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:16px/1.55 var(--f-body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:28px 64px}
main{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:30px}
h1,h2,h3{font-family:var(--f-disp);text-wrap:balance;margin:0;letter-spacing:.01em}
h1{font-size:clamp(28px,6vw,40px);line-height:1.1}
h2{font-size:22px;color:var(--ember)}
h3{font-size:16px;font-family:var(--f-body);font-weight:700}
p{margin:0;max-width:66ch}
section{display:flex;flex-direction:column;gap:12px;min-width:0}
.eyebrow{font:500 12px/1 var(--f-mono);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.lead{font-size:18px;color:var(--ink)}
.facts{display:flex;flex-wrap:wrap;gap:8px 22px;font:13px/1.4 var(--f-mono);color:var(--muted)}
.facts b{color:var(--ink);font-weight:500}
figure{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 12px 8px;display:flex;flex-direction:column;gap:6px;min-width:0}
figcaption{font-weight:700;font-size:14px}
svg{width:100%;height:auto;display:block}
svg .grid{stroke:var(--line);stroke-width:1}
svg .tick{fill:var(--muted);font:11px var(--f-mono)}
svg .axis{fill:var(--muted);font:12px var(--f-body)}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:var(--muted)}
.legend i{display:inline-block;width:14px;height:3px;border-radius:2px;vertical-align:middle;margin-right:6px}
.legend i.dot{width:7px;height:7px;border-radius:50%}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px;background:var(--panel)}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{padding:8px 12px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
tr:last-child td{border-bottom:0}
th{font:600 12px/1.2 var(--f-body);color:var(--muted);text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
td.num b{display:block;font-weight:600}
td small{color:var(--muted);font-size:12px}
.na{color:var(--muted);font-size:12px}
.sw{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}
.notes{display:flex;flex-direction:column;gap:14px}
.notes ol,.notes ul{margin:0;padding-left:1.2em;display:flex;flex-direction:column;gap:8px;max-width:68ch}
.prop{border-left:3px solid var(--ember);padding:2px 0 2px 14px;display:flex;flex-direction:column;gap:6px}
.prop .chg{font:13px/1.5 var(--f-mono);color:var(--muted)}
code{font:13px var(--f-mono)}
</style>
<main>
<header style="display:flex;flex-direction:column;gap:12px">
  <span class="eyebrow">Crypte des Cendres${version ? ' · ' + esc(version) : ''} · simulateur de progression</span>
  <h1>Banc de progression</h1>
  <p class="lead">Un bot joue de vraies missions de Survie avec les règles du jeu, puis passe au Camp comme le conseille le Parcours. Il monte d'un niveau après chaque sortie d'au moins deux manches, change de palier au plafond prévu, et redescend de trois niveaux après une mission perdue.</p>
  <div class="facts"><span><b>${runs.length}</b> carrières</span><span><b>${fr(totM)}</b> missions</span><span><b>${fr(totH, 1)} h</b> de jeu simulées</span><span>temps de jeu = durée des manches + 45 s de Camp par mission</span></div>
</header>
${notesHtml}
<section><h2>Jalons</h2><p>Temps de jeu cumulé pour atteindre chaque étape, et numéro de la mission.</p>${mileTable}</section>
<section><h2>Courbes</h2>
<figure><figcaption>Palier de difficulté au fil du temps</figcaption>${chProg}${legend(runs)}</figure>
<figure><figcaption>Plus haute mission réussie (fixe le niveau des objets fabriqués)</figcaption>${chLvl}${legend(runs)}</figure>
<figure><figcaption>Dégâts par seconde du héros (échelle logarithmique)</figcaption>${chPow}${legend(runs)}</figure>
<figure><figcaption>Vie maximale du héros (échelle logarithmique)</figcaption>${chHp}${legend(runs)}</figure>
</section>
<section><h2>Temps passé par palier</h2>${wallTable}</section>
<section><h2>Butin moyen par mission</h2><p>Paliers Normal, Cauchemar, Tourment I, VI et X. L'essence compte celle gagnée pendant la mission, avant les dépenses au Camp.</p>${econTable}</section>
<section><h2>Méthode</h2><p>Simulateur : <code>tools/progression/</code>. Une carrière : <code>node tools/progression/run.mjs --cls archer --missions 400 --seed 1</code>, puis <code>node tools/progression/report.mjs resultats/*.jsonl</code>. Le hasard est fixé par la graine : même graine, même carrière. Le bot fuit en arc, tire à l'arrêt, ramasse réactifs et butin, utilise compétence, ultime, esquive et potions ; il joue moins bien qu'un bon joueur dans les situations serrées, donc les murs mesurés sont plutôt pessimistes et les durées plutôt longues.</p></section>
</main>`;
fs.writeFileSync(out, html);
console.log('rapport :', out);
