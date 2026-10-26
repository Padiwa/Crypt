// Crypte des Cendres — suite de tests unique.
// Lancer depuis n'importe où :  node tools/tests/run.mjs            (tout, coopération comprise)
//                                node tools/tests/run.mjs --quick    (sans la coopération, plus rapide)
//                                node tools/tests/run.mjs relics     (seulement les suites dont le nom contient « relics »)
// Code de sortie 0 si tout passe, 1 sinon. Chaque test échoue aussi sur toute erreur JavaScript de la page.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadPlaywright } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), quick = args.includes('--quick'), filt = args.filter((a) => !a.startsWith('--'));
const files = fs.readdirSync(path.join(here, 'suites')).filter((f) => f.endsWith('.mjs')).sort()
  .filter((f) => !filt.length || filt.some((x) => f.includes(x)));

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
let pass = 0, fail = 0, skip = 0; const fails = []; const t0 = Date.now();

for (const f of files) {
  const mod = await import(pathToFileURL(path.join(here, 'suites', f)).href);
  const suite = f.replace(/^\d+_|\.mjs$/g, '');
  if (quick && mod.slow) { console.log(`· ${suite} (ignorée en --quick)`); skip += mod.tests.length; continue; }
  console.log(`\n▸ ${suite}`);
  for (const t of mod.tests) {
    const errs = [], pages = [];
    const T = {
      ok: (c, m) => { if (!c) errs.push(m || 'condition fausse'); },
      eq: (a, b, m) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) errs.push(`${m || 'égalité'} : obtenu ${A}, attendu ${B}`); },
      track: (p) => { pages.push(p); return p; },
    };
    const s = Date.now();
    try { await t.fn(browser, T); } catch (e) { errs.push('exception : ' + (e.message || e).split('\n')[0]); }
    for (const p of pages) { for (const e of p.errs || []) errs.push('erreur page : ' + e); try { await p.ctx.close(); } catch (e) {} }
    const ms = Date.now() - s;
    if (errs.length) { fail++; fails.push(`${suite} › ${t.name}`); console.log(`  ✗ ${t.name} (${ms} ms)`); for (const e of errs.slice(0, 6)) console.log(`      ${e}`); }
    else { pass++; console.log(`  ✓ ${t.name} (${ms} ms)`); }
  }
}
await browser.close();
console.log(`\n${pass} réussi${pass > 1 ? 's' : ''}, ${fail} échoué${fail > 1 ? 's' : ''}${skip ? `, ${skip} ignoré${skip > 1 ? 's' : ''}` : ''} · ${Math.round((Date.now() - t0) / 1000)} s`);
if (fails.length) { console.log('Échecs :'); for (const f of fails) console.log('  - ' + f); }
process.exit(fail ? 1 : 0);
