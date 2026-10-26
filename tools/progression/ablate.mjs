// Crypte des Cendres — d'où vient la puissance du héros ? Retire une source à la fois d'une sauvegarde simulée.
//   node tools/progression/ablate.mjs resultats/magicien_1_etat.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadPlaywright } from '../tests/lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');
const st = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const { chromium } = await loadPlaywright();
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p.route(/pixi\.min\.js|fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs/, (r) => r.abort());
await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
const res = await p.evaluate((st) => {
  const base = JSON.stringify(st.meta), cls = st.C.cls;
  heroCls = cls; G.run = {};
  const m = (fn) => { meta = JSON.parse(base); defGear(meta); if (fn) fn(); const e = curEq(), S = stats(e); return { dps: Math.round(dps(S)), hp: Math.round(S.hp), score: Math.round(itemScore(e)) }; };
  const V = {
    'Tout': null,
    'Sans prestige': () => { meta.prest[cls] = { lv: 0, pts: {} }; },
    'Sans Bonus de la Forge': () => { meta.up = {}; },
    'Sans rangs (fusion)': () => { for (const k in meta.gear) if (meta.gear[k]) meta.gear[k].up = 0; meta.wlv = {}; },
    'Sans mods': () => { meta.hload = {}; meta.wload = {}; meta.aura = {}; },
    'Arme de départ': () => { meta.wpn[cls] = WPN[cls][0].id; },
    'Équipement retiré (hors arme)': () => { for (const k in meta.gear) meta.gear[k] = null; },
  };
  const out = {}; for (const k in V) out[k] = m(V[k]);
  meta = JSON.parse(base); defGear(meta);
  const eq = curEq(); out._gear = Object.fromEntries(Object.entries(eq).map(([k, it]) => [k, it ? { n: it.name, r: it.r, up: it.up | 0, lvl: it.lvl, aff: Object.keys(it.aff).length } : null]));
  out._prest = meta.prest[cls]; out._mods = allMods(cls).map((id) => id + ':' + meta.mods[id] + (modSt(id) ? '★' + modSt(id) : ''));
  return out;
}, st);
for (const [k, v] of Object.entries(res)) if (!k.startsWith('_')) console.log(k.padEnd(32), 'DPS', String(v.dps).padStart(9), ' vie', String(v.hp).padStart(7), ' score', v.score);
console.log(JSON.stringify(res._gear, null, 0)); console.log('prestige', JSON.stringify(res._prest)); console.log('mods', res._mods.join(' '));
await b.close();
