// Crypte des Cendres — simulateur de progression : compare deux séries de carrières simulées dans un fichier HTML autonome.
//   node tools/progression/compare.mjs <dossier> --a xf0 --b xf1 --la "Sans transfert" --lb "Transferts orientés" --out comparaison.html
// Le dossier contient des carrières nommées <classe>_<série>_s<graine>.jsonl (une ligne par mission, sortie de run.mjs).
// Pour chaque héros et chaque valeur, le fichier trace la moyenne de chaque série heure par heure, avec la plage entre la graine
// la plus basse et la plus haute ; un tableau résume l'écart à la fin, et un autre détaille les transferts d'affixes (journal xfl).
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const A = opt('a', 'xf0'), B = opt('b', 'xf1'), LA = opt('la', 'Sans transfert'), LB = opt('lb', 'Transferts orientés');
const out = opt('out', 'comparaison.html'), title = opt('title', 'Transferts d\'affixes au banc'), dir = args[0] || '.';
const CLS = ['guerrier', 'archer', 'magicien'], CLSN = { guerrier: 'Guerrier', archer: 'Archer', magicien: 'Magicien' };
const TIERN = ['Normal', 'Difficile', 'Cauchemar', ...['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map((r) => 'Tourment ' + r)];
const STEP = .5;

const read = (f) => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const runs = {}; // runs[série][classe] = [ {seed, rows} ]
for (const f of fs.readdirSync(dir)) {
  const m = f.match(/^(\w+?)_(\w+)_s(\d+)\.jsonl$/); if (!m || !CLS.includes(m[1]) || ![A, B].includes(m[2])) continue;
  const rows = read(path.join(dir, f)); if (!rows.length) continue;
  ((runs[m[2]] ||= {})[m[1]] ||= []).push({ seed: +m[3], rows });
}
// Valeurs suivies : à chaque instant, la dernière mission finie (cumul pour les morts et les transferts).
const METRICS = [
  { k: 'dps', n: 'Dégâts par seconde', f: (r) => r.dps },
  { k: 'hp', n: 'Vie', f: (r) => r.hp },
  { k: 'L', n: 'Niveau de mission max', f: (r) => r.bank.maxL },
  { k: 'tier', n: 'Palier de difficulté', f: (r) => r.tier, tiers: true },
  { k: 'died', n: 'Morts (cumul)', cum: (r) => (r.died ? 1 : 0) },
  { k: 'xf', n: 'Transferts d\'affixes (cumul)', cum: (r) => r.xf | 0 },
  { k: 'ess', n: 'Essence en réserve', f: (r) => r.bank.ess },
  { k: 'gold', n: 'Or en réserve', f: (r) => r.bank.gold },
  { k: 'score', n: 'Score d\'équipement', f: (r) => r.score },
];
const hMax = Math.max(1, ...Object.values(runs).flatMap((o) => Object.values(o).flatMap((L) => L.map((x) => x.rows[x.rows.length - 1].h))));
const T = []; for (let t = STEP; t <= Math.floor(hMax / STEP) * STEP + 1e-9; t += STEP) T.push(+t.toFixed(2));
// une carrière ne compte que jusqu'à sa dernière mission (une carrière en cours ou arrêtée plus tôt ne prolonge pas sa dernière valeur)
const sample = (rows, m) => T.map((t) => { let v = null, c = 0, seen = false; if (t > rows[rows.length - 1].h + STEP / 2) return null;
  for (const r of rows) { if (r.h > t) break; seen = true; if (m.cum) c += m.cum(r); else v = m.f(r); }
  return seen ? (m.cum ? c : v) : null; });
const data = {};
for (const s of [A, B]) for (const c of CLS) { const L = (runs[s] || {})[c] || []; if (!L.length) continue;
  for (const m of METRICS) { const per = L.map((x) => sample(x.rows, m));
    const agg = T.map((_, i) => { const v = per.map((p) => p[i]).filter((x) => x != null); if (!v.length) return null;
      return [v.reduce((a, b) => a + b, 0) / v.length, Math.min(...v), Math.max(...v), v.length]; });
    ((data[s] ||= {})[c] ||= {})[m.k] = agg; } }
const seeds = Object.fromEntries([A, B].map((s) => [s, Object.fromEntries(CLS.map((c) => [c, ((runs[s] || {})[c] || []).length]))]));
// Transferts : affixe, objet visé et type, depuis le journal xfl (« xf <affixe> <objet> <type> [-remplacée] +<gain> % »).
const xfd = {};
for (const c of CLS) { const L = (runs[B] || {})[c] || [], k = {}, d = {}, md = {}; let n = 0, g = 0;
  for (const x of L) for (const r of x.rows) for (const e of r.xfl || []) { const m = e.match(/^xf (\S+) (\S+) (\S+)(?: -(\S+))? \+([\d.]+) %/); if (!m) continue;
    n++; g += +m[5]; k[m[1]] = (k[m[1]] || 0) + 1; const o = m[2].startsWith('w:') ? 'Arme' : ({ armure: 'Armure', amulette: 'Amulette', bottes: 'Bottes', anneau: 'Anneau', anneau2: 'Anneau 2', dos: 'Dos' })[m[2].slice(2)] || m[2].slice(2); d[o] = (d[o] || 0) + 1; const t = m[3] === 'rep' ? 'remplacement' : m[3] === 'fuse' ? 'fusion' : m[3] === 'up' ? 'plus fort' : 'ajout'; md[t] = (md[t] || 0) + 1; }
  xfd[c] = { n, g: n ? g / n : 0, k, d, md }; }

const DATA = { T, A, B, LA, LB, CLS, CLSN, TIERN, METRICS: METRICS.map(({ k, n, tiers }) => ({ k, n, tiers: !!tiers })), data, seeds, xfd };
const html = `<title>${title}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* Banc d'essai : en-tête et filtres, puis un graphique par héros (moyenne et plage des graines), puis les tableaux */
:root{--bg:#f7f6f3;--panel:#fcfcfb;--ink:#141412;--ink2:#52514e;--muted:#77756f;--line:#e4e1da;--grid:#ecebe6;--a:#2a78d6;--b:#eb6834;--good:#1f7a43;--bad:#b3261e;
  --f-ui:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--f-num:ui-monospace,"SF Mono",Menlo,Consolas,monospace;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121211;--panel:#1a1a19;--ink:#f0efec;--ink2:#c3c2b7;--muted:#9a988f;--line:#2e2d2a;--grid:#262523;--a:#3987e5;--b:#d95926;--good:#5cc489;--bad:#ef7b74;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#121211;--panel:#1a1a19;--ink:#f0efec;--ink2:#c3c2b7;--muted:#9a988f;--line:#2e2d2a;--grid:#262523;--a:#3987e5;--b:#d95926;--good:#5cc489;--bad:#ef7b74;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:15px/1.5 var(--f-ui);margin:0}
.wrap{max-width:1180px;margin:0 auto;padding-block:28px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));display:flex;flex-direction:column;gap:22px}
h1{margin:0;font-size:26px;letter-spacing:-.01em;text-wrap:balance}
h2{margin:0;font-size:17px}
.sub{margin:4px 0 0;color:var(--ink2);max-width:72ch}
.bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.lab{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chips button{font:600 13px/1 var(--f-ui);padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:var(--panel);color:var(--ink2);cursor:pointer}
.chips button[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.chips button:focus-visible{outline:2px solid var(--a);outline-offset:2px}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:13px;color:var(--ink2)}
.legend span{display:inline-flex;align-items:center;gap:8px}
.legend svg{width:26px;height:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 14px 8px;min-width:0;display:flex;flex-direction:column;gap:6px}
.card h3{margin:0;font-size:15px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.card h3 small{font:500 12px var(--f-ui);color:var(--muted)}
.chart{position:relative}
.chart svg{display:block;width:100%;height:auto;overflow:visible}
.tip{position:absolute;pointer-events:none;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:12.5px;box-shadow:0 4px 16px rgba(0,0,0,.12);white-space:nowrap;z-index:2}
.tip b{font-variant-numeric:tabular-nums}
.tip i{display:inline-block;width:10px;height:3px;margin-right:6px;vertical-align:middle}
.tbl{overflow-x:auto;background:var(--panel);border:1px solid var(--line);border-radius:10px}
table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{padding:8px 12px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap;font-variant-numeric:tabular-nums}
th:first-child,td:first-child{text-align:left}
th{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}
tr:last-child td{border-bottom:0}
.up{color:var(--good);font-weight:600}.dn{color:var(--bad);font-weight:600}
.note{font-size:13px;color:var(--ink2);max-width:80ch;margin:0}
.xf{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}
.bars{display:flex;flex-direction:column;gap:5px;font-size:13px}
.bars div{display:grid;grid-template-columns:150px 1fr 40px;gap:8px;align-items:center}
.bars s{display:block;height:8px;border-radius:0 4px 4px 0;background:var(--b);text-decoration:none}
.bars em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums;color:var(--ink2)}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
  <header><h1>${title}</h1><p class="sub" id="sub"></p></header>
  <div class="bar"><span class="lab">Valeur</span><div class="chips" id="metrics" role="group" aria-label="Valeur affichée"></div></div>
  <div class="legend" id="legend"></div>
  <div class="grid" id="charts"></div>
  <section><h2>À la fin des carrières</h2><p class="note" id="endnote"></p></section>
  <div class="tbl"><table id="end"></table></div>
  <section><h2>Transferts d'affixes faits par le bot</h2><p class="note">Série « ${LB} », toutes graines confondues : nombre de transferts par affixe, par objet visé et par type (ajout sur une place libre, remplacement d'une autre affixe, valeur plus forte, fusion de deux valeurs).</p></section>
  <div class="xf" id="xf"></div>
</div>
<script>
const D=${JSON.stringify(DATA)};
const $=(id)=>document.getElementById(id),fmt=(v)=>v==null?'—':Math.abs(v)>=1000?Math.round(v).toLocaleString('fr-FR'):(Math.round(v*10)/10).toLocaleString('fr-FR');
let metric='dps';try{metric=localStorage.getItem('cmp-metric')||'dps'}catch(e){}
if(!D.METRICS.some(m=>m.k===metric))metric='dps';
const S=[{k:D.A,n:D.LA,c:'var(--a)',dash:'6 4'},{k:D.B,n:D.LB,c:'var(--b)',dash:''}];
const nSeeds=c=>S.map(s=>D.seeds[s.k][c]+' graine'+(D.seeds[s.k][c]>1?'s':'')+' '+s.n.toLowerCase()).join(', ');
$('sub').textContent='Carrières simulées de '+Math.round(D.T[D.T.length-1])+' h de jeu par le bot du banc, mêmes graines pour les deux séries. Trait plein et pointillé : moyenne ; zone claire : de la graine la plus basse à la plus haute.';
$('legend').innerHTML=S.map(s=>'<span><svg viewBox="0 0 26 10" aria-hidden="true"><line x1="1" y1="5" x2="25" y2="5" stroke="'+s.c+'" stroke-width="2.5" stroke-dasharray="'+s.dash+'"/></svg>'+s.n+'</span>').join('');
function chips(){$('metrics').innerHTML=D.METRICS.map(m=>'<button type="button" data-m="'+m.k+'" aria-pressed="'+(m.k===metric)+'">'+m.n+'</button>').join('')}
$('metrics').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b)return;metric=b.dataset.m;try{localStorage.setItem('cmp-metric',metric)}catch(e){}chips();draw()});
function draw(){const M=D.METRICS.find(m=>m.k===metric);
  $('charts').innerHTML=D.CLS.map(c=>'<div class="card"><h3>'+D.CLSN[c]+'<small>'+nSeeds(c)+'</small></h3><div class="chart" id="ch_'+c+'"></div></div>').join('');
  for(const c of D.CLS)chart(c,M)}
function chart(c,M){const el=$('ch_'+c),W=560,H=260,L=52,R=12,Tp=12,Bt=30,T=D.T;
  const ser=S.map(s=>({...s,v:((D.data[s.k]||{})[c]||{})[M.k]||[]}));
  let lo=Infinity,hi=-Infinity;for(const s of ser)for(const p of s.v)if(p){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[2])}
  if(!isFinite(lo)){el.innerHTML='<p class="note">Pas de données.</p>';return}
  lo=Math.min(0,lo);if(M.tiers){lo=0;hi=12}if(hi<=lo)hi=lo+1;
  const nice=x=>{const p=Math.pow(10,Math.floor(Math.log10(x))),f=x/p;return (f<=1?1:f<=2?2:f<=5?5:10)*p};
  const step=M.tiers?3:nice((hi-lo)/4),top=M.tiers?12:Math.ceil(hi/step)*step;
  const X=t=>L+(t-0)/(T[T.length-1])*(W-L-R),Y=v=>Tp+(1-(v-lo)/(top-lo))*(H-Tp-Bt);
  let g='';for(let v=lo;v<=top+1e-9;v+=step){const y=Y(v);g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" stroke="var(--grid)"/><text x="'+(L-8)+'" y="'+(y+4)+'" text-anchor="end" font-size="11" fill="var(--muted)">'+(M.tiers?(v===0?'Normal':v<=2?D.TIERN[v]:'T'+D.TIERN[v].split(' ')[1]):fmt(v))+'</text>'}
  for(let h=0;h<=T[T.length-1];h+=2)g+='<text x="'+X(h)+'" y="'+(H-10)+'" text-anchor="middle" font-size="11" fill="var(--muted)">'+h+' h</text>';
  g+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(lo)+'" y2="'+Y(lo)+'" stroke="var(--line)"/>';
  for(const s of ser){const pts=T.map((t,i)=>s.v[i]?[X(t),s.v[i]]:null).filter(Boolean);if(!pts.length)continue;
    const up=pts.map(p=>p[0]+','+Y(p[1][2])).join(' '),dn=pts.slice().reverse().map(p=>p[0]+','+Y(p[1][1])).join(' ');
    g+='<polygon points="'+up+' '+dn+'" fill="'+s.c+'" opacity=".12"/>';
    g+='<polyline points="'+pts.map(p=>p[0]+','+Y(p[1][0])).join(' ')+'" fill="none" stroke="'+s.c+'" stroke-width="2.2" stroke-linejoin="round" stroke-dasharray="'+s.dash+'"/>';
    const e=pts[pts.length-1];g+='<circle cx="'+e[0]+'" cy="'+Y(e[1][0])+'" r="4" fill="'+s.c+'" stroke="var(--panel)" stroke-width="2"/>'}
  g+='<line class="cross" x1="0" x2="0" y1="'+Tp+'" y2="'+(H-Bt)+'" stroke="var(--muted)" stroke-dasharray="3 3" visibility="hidden"/>';
  el.innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+M.n+', '+D.CLSN[c]+'">'+g+'<rect x="'+L+'" y="0" width="'+(W-L-R)+'" height="'+H+'" fill="transparent"/></svg><div class="tip" hidden></div>';
  const svg=el.querySelector('svg'),tip=el.querySelector('.tip'),cr=svg.querySelector('.cross');
  const move=ev=>{const r=svg.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*W;let i=Math.round((x-L)/(W-L-R)*T[T.length-1]/(T[1]-T[0]))-1;i=Math.max(0,Math.min(T.length-1,i));
    const cx=X(T[i]);cr.setAttribute('x1',cx);cr.setAttribute('x2',cx);cr.setAttribute('visibility','visible');
    const val=v=>M.tiers?D.TIERN[Math.round(v)]||fmt(v):fmt(v);
    tip.innerHTML='<div><b>'+String(T[i]).replace('.',',')+' h</b></div>'+ser.map(s=>{const p=s.v[i];return '<div><i style="background:'+s.c+'"></i>'+s.n+' : <b>'+(p?val(p[0]):'—')+'</b>'+(p&&p[3]>1?' <span style="color:var(--muted)">('+val(p[1])+' à '+val(p[2])+')</span>':'')+'</div>'}).join('');
    tip.hidden=false;const px=cx/W*r.width;tip.style.left=Math.min(Math.max(0,px+12),r.width-tip.offsetWidth)+'px';tip.style.top='8px'};
  svg.addEventListener('pointermove',move);svg.addEventListener('pointerleave',()=>{tip.hidden=true;cr.setAttribute('visibility','hidden')})}
function endTable(){const last=D.T.length-1,ms=D.METRICS.filter(m=>m.k!=='xf');
  $('endnote').textContent='Moyennes à '+String(D.T[last]).replace('.',',')+' h, puis l\\'écart de la série « '+D.LB+' » par rapport à « '+D.LA+' ».';
  let h='<thead><tr><th>Héros</th>'+ms.map(m=>'<th>'+m.n+'</th>').join('')+'</tr></thead><tbody>';
  for(const c of D.CLS){h+='<tr><td>'+D.CLSN[c]+'</td>'+ms.map(m=>{const a=((D.data[D.A]||{})[c]||{})[m.k],b=((D.data[D.B]||{})[c]||{})[m.k];const x=a&&a[last],y=b&&b[last];if(!x||!y)return '<td>—</td>';
    const d=m.tiers||m.k==='died'||m.k==='L'?(y[0]-x[0]):(x[0]?(y[0]/x[0]-1)*100:0),better=m.k==='died'?d<0:d>0,u=m.tiers||m.k==='died'||m.k==='L'?'':' %';
    const vv=v=>m.tiers?(D.TIERN[Math.round(v)]||fmt(v)):fmt(v);
    return '<td>'+vv(x[0])+' → '+vv(y[0])+'<br><span class="'+(Math.abs(d)<.05?'':better?'up':'dn')+'">'+(d>0?'+':'')+fmt(d)+u+'</span></td>'}).join('')+'</tr>'}
  $('end').innerHTML=h+'</tbody>'}
function xfCards(){const AFN={dmgPct:'Dégâts',critDmg:'Dégâts critiques',crit:'Chances de critique',dotPct:'Dégâts des statuts',novaPct:'Dégâts de compétence',ultPct:'Dégâts de l\\'ultime',execute:'Exécution',ccDmg:'Dégâts sous contrôle',lowDmg:'Dégâts sous 50 % de vie',multi:'Projectiles',pierce:'Transpercement',hp:'Points de vie',armor:'Réduction des dégâts',regen:'Régénération',apsPct:'Vitesse d\\'attaque',cdr:'Temps de recharge',speed:'Vitesse de déplacement',bossDmg:'Dégâts contre Gardiens',reach:'Portée de frappe',leech:'Vol de vie',splash:'Rayon d\\'explosion',xpPct:'Expérience',skillRad:'Portée des compétences',goldPct:'Or',lowArmor:'Protection sous 30 % de vie'};
  const bars=o=>{const e=Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,10),mx=Math.max(1,...e.map(x=>x[1]));return '<div class="bars">'+e.map(([k,v])=>'<div><span>'+(AFN[k]||k)+'</span><s style="width:'+(v/mx*100)+'%"></s><em>'+v+'</em></div>').join('')+'</div>'};
  $('xf').innerHTML=D.CLS.map(c=>{const x=D.xfd[c];return '<div class="card"><h3>'+D.CLSN[c]+'<small>'+x.n+' transferts · gain annoncé +'+fmt(x.g)+' % de Puissance en moyenne</small></h3>'+(x.n?'<span class="lab">Affixes</span>'+bars(x.k)+'<span class="lab">Objets visés</span>'+bars(x.d)+'<span class="lab">Types</span>'+bars(x.md):'<p class="note">Aucun transfert.</p>')+'</div>'}).join('')}
chips();draw();endTable();xfCards();
</script>`;
fs.writeFileSync(out, html);
console.log('écrit', out, '·', Object.entries(seeds).map(([s, o]) => s + ' ' + JSON.stringify(o)).join(' · '));
