// Crypte des Cendres — simulateur de progression : lance une carrière complète dans un vrai navigateur sans affichage.
//   node tools/progression/run.mjs --cls archer --missions 400 --seed 1 --out resultats/archer.jsonl
// Options : --resume (reprend depuis le dernier état), --rythme long (ou chemin d'un fichier de rythme ; --mode reste accepté), --bal '{"relicMob":0.2}' (réglages d'essai), --hours N (arrêt après N heures de jeu simulées), --policy parcours, --caps 20,20,25,... (plafonds par palier).
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadPlaywright } from '../tests/lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cls = arg('cls', 'archer'), N = +arg('missions', 200), H = +arg('hours', 1e9), seed = +arg('seed', 1);
const out = arg('out', path.join('resultats', `${cls}_${seed}.jsonl`));
const FRESH = +arg('fresh', 60), caps = arg('caps', null), bal = arg('bal', null);
// Fichier de rythme à charger à la place de js/rythmes/rapide.js : un nom (long) ou un chemin.
const rythme = arg('rythme', arg('mode', null));
const rythmeFile = rythme ? (fs.existsSync(rythme) ? path.resolve(rythme) : path.join(ROOT, 'js', 'rythmes', rythme + '.js')) : null;
if (rythmeFile && !fs.existsSync(rythmeFile)) { console.error('Fichier de rythme introuvable :', rythmeFile); process.exit(1); }
fs.mkdirSync(path.dirname(out), { recursive: true });

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const url = pathToFileURL(path.join(ROOT, 'index.html')).href;
const etat = out.replace(/\.jsonl$/, '_etat.json'), jal = out.replace(/\.jsonl$/, '_jalons.json');
let ctx = null, p = null, errs = [];
// Ouvre une page de jeu neuve : nouvelle carrière, ou reprise d'un état sauvegardé (après un plantage du navigateur, ou toutes les 60 missions).
async function open(state) {
  if (ctx) await ctx.close().catch(() => {});
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  // réglages d'essai (--bal '{"relicMob":0.2}') injectés avant le chargement du jeu ; le fichier de rythme est servi à la place de rapide.js
  const sd = seed * 100003 + (state ? state.C.n : 0);
  await ctx.addInitScript(fs.readFileSync(path.join(here, 'bot.js'), 'utf8') + `;SIM.seed(${sd});` + (bal ? `window.BAL_OVERRIDE=${bal};` : ''));
  p = await ctx.newPage(); errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  // rendu 2D (pas de WebGL), pas de réseau
  await p.route(/pixi\.min\.js|fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs/, (r) => r.abort());
  if (rythmeFile) await p.route('**/js/rythmes/rapide.js', (r) => r.fulfill({ path: rythmeFile, contentType: 'text/javascript' }));
  await p.goto(url);
  await p.evaluate(([c, m]) => { localStorage.clear(); localStorage.setItem('crypte-cls', c); if (m) localStorage.setItem('crypte-meta', m); }, [cls, state ? JSON.stringify(state.meta) : null]);
  await p.reload();
  await p.addScriptTag({ path: path.join(here, 'career.js') });
  if (state) await p.evaluate((C) => { SIM.C = { ...C, log: [] }; heroCls = C.cls; }, state.C);
  else await p.evaluate(([c, caps]) => SIM.newCareer(c, caps ? { caps: caps.split(',').map(Number) } : {}), [cls, caps]);
}
// --resume : reprend une carrière depuis son dernier état sauvegardé (le journal est gardé jusqu'à cet état)
let state = process.argv.includes('--resume') && fs.existsSync(etat) ? JSON.parse(fs.readFileSync(etat, 'utf8')) : null, crashes = 0;
await open(state);
console.log('rythme :', await p.evaluate(() => BAL.nom || '?'));
if (state) { const rows = fs.readFileSync(out, 'utf8').trim().split('\n').filter((l) => l && JSON.parse(l).n <= state.C.n); fs.writeFileSync(out, rows.join('\n') + '\n'); console.log('reprise à la mission', state.C.n); }
else fs.writeFileSync(out, '');
const t0 = Date.now();
for (let i = state ? state.C.n : 0; i < N; i++) {
  let r;
  try { r = await p.evaluate(() => SIM.step()); }
  catch (e) { if (++crashes > 8 || !state) throw e; console.log('navigateur relancé après :', String(e.message).split('\n')[0]); await open(state); i = state.C.n - 1;
    // le journal reprend après le dernier état sauvegardé
    const rows = fs.readFileSync(out, 'utf8').trim().split('\n').filter((l) => l && JSON.parse(l).n <= state.C.n); fs.writeFileSync(out, rows.join('\n') + (rows.length ? '\n' : '')); continue; }
  fs.appendFileSync(out, JSON.stringify(r) + '\n');
  if (i % 5 === 0 || r.died) console.log(`#${String(r.n).padStart(4)} ${r.h.toFixed(1).padStart(5)} h ${r.tn.padEnd(13)} L${String(r.L).padStart(2)}→${String(r.endL).padStart(2)} ${r.died ? 'MORT' : 'ok  '} r${r.rounds} kills ${String(r.kills).padStart(4)} boss ${r.boss} rel ${r.relics}/${r.opened} dps ${r.dps} hp ${r.hp} or ${r.bank.gold} ess ${r.bank.ess} hf ${r.bank.hfrag} gear ${Object.values(r.gear).map(g => g ? g[0] + (g[1] ? '+' + g[1] : '') : '-').join(' ')} (${r.ms} ms)`);
  if (i % 10 === 9) { state = await p.evaluate(() => SIM.state()); fs.writeFileSync(etat, JSON.stringify(state)); fs.writeFileSync(jal, JSON.stringify({ cls, seed, miles: state.C.miles }, null, 1)); }
  if (i % FRESH === FRESH - 1) await open(state); // page neuve de temps en temps : évite que la mémoire du navigateur gonfle
  if (r.h >= H) break;
  // fin de jeu : Tourment X niveau 50 réussi, dos débloqué et au moins 5 pièces abyssales portées (arme comprise)
  if (!r.died && r.tier === 12 && r.bank.maxL >= 50 && 'dos' in r.gear && Object.values(r.gear).filter((g) => g && g[0] >= 6).length >= 5) { console.log('fin de jeu atteinte'); break; }
  if (errs.length) { console.log('ERREUR', errs.slice(0, 3)); break; }
}
state = await p.evaluate(() => SIM.state());
fs.writeFileSync(etat, JSON.stringify(state));
fs.writeFileSync(jal, JSON.stringify({ cls, seed, miles: state.C.miles }, null, 1));
console.log('jalons', JSON.stringify(state.C.miles));
console.log(`terminé en ${Math.round((Date.now() - t0) / 1000)} s`);
await browser.close();
