// Crypte des Cendres — exemples de builds (document de conception, v143) joués au banc : à partir d'un état de fin de carrière, tous les mods au rang maximum
// (sans étoile), maîtrises au maximum, cases sans polarité, familier du style au rang 5 niveau 20 ; build forcé (arme, héros, aura, familier) ou build du bot.
// Joue K missions au palier et au niveau de l'état (sauvegarde remise à chaque fois) : morts, manches, ennemis tués par minute, Gardiens.
//   node tools/progression/builds.mjs <dossier d'états> [K] [style…]
// Le dossier d'états est celui d'un banc de carrières (run.mjs --out <dossier>/<classe>_1.jsonl écrit <classe>_1_etat.json) ;
// il faut un état par classe jouée. Résultats : une ligne JSON par style, aussi ajoutée à <dossier>/builds.jsonl.
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
import { loadPlaywright } from '../tests/lib.mjs';
const [dir, K = '4', ...only] = process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(here, '..', '..');
const STY = {
  poison: { cls: 'archer', w: ['venin', 'peste', 'virulence', 'contagion'], h: ['impregnation', 'intensite', 'flux', 'ame'], au: null, pet: 'corbeau', p: ['pecho', 'pmarque'] },
  feu: { cls: 'magicien', w: ['braise', 'embrasement', 'deflagration', 'catalyse'], h: ['etendue', 'intensite', 'fleau', 'prolong'], au: null, pet: 'corbeau', p: ['pecho'] },
  controle: { cls: 'magicien', w: ['givre', 'cryogenie', 'orage', 'surtension'], h: ['persist', 'commotion', 'etendue', 'paselem'], au: 'presence', pet: 'golem', p: ['pseisme', 'pprov'] },
  tank: { cls: 'guerrier', w: ['entaille', 'hemorragie', 'coup', 'soif'], h: ['garde', 'elixfer', 'peau', 'fantome'], au: 'terreur', pet: 'golem', p: ['pepine', 'pseisme', 'pcara'] },
  critique: { cls: 'archer', w: ['rafale', 'oeil', 'boucherie', 'entaille'], h: ['ame', 'remanence', 'prolong', 'elan'], au: null, pet: 'corbeau', p: ['pbec', 'pmarque'] },
  esquive: { cls: 'guerrier', w: ['coup', 'entrave', 'rafale', 'catalyse'], h: ['riposte', 'paselem', 'fantome', 'elan'], au: null, pet: 'follet', p: ['pflamme', 'pinst'] },
  'bot-archer': { cls: 'archer', bot: 1, pet: 'corbeau' }, 'bot-magicien': { cls: 'magicien', bot: 1, pet: 'corbeau' }, 'bot-guerrier': { cls: 'guerrier', bot: 1, pet: 'golem' },
};
const { chromium } = await loadPlaywright();
const b = await chromium.launch();
for (const [name, st] of Object.entries(STY)) {
  if (only.length && !only.includes(name)) continue;
  const etat = JSON.parse(fs.readFileSync(path.join(dir, `${st.cls}_1_etat.json`), 'utf8'));
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(fs.readFileSync(path.join(here, 'bot.js'), 'utf8') + ';SIM.seed(4242);');
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.route(/pixi\.min\.js|fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs/, (r) => r.abort());
  await p.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  await p.evaluate(([c, m]) => { localStorage.clear(); localStorage.setItem('crypte-cls', c); localStorage.setItem('crypte-meta', m); }, [st.cls, JSON.stringify(etat.meta)]);
  await p.reload();
  await p.addScriptTag({ path: path.join(here, 'career.js') });
  const out = await p.evaluate(([C, st, K]) => {
    SIM.C = { ...C, log: [] }; heroCls = C.cls;
    // tous les mods au maximum, sans étoile ; maîtrises au maximum ; familier du style
    for (const id in MODS) { meta.mods[id] = MODS[id].max; delete meta.modSt[id]; } meta.modCp = {};
    mastOf(heroCls).r = 10; mstOf(meta.wmast, curWid()).r = 10; meta.hslots[heroCls] = Math.max(meta.hslots[heroCls] || 3, 4);
    meta.pets = [{ uid: 77, t: st.pet, rk: 5, lv: 20, xp: 0 }]; meta.petEq = 77;
    const set = (b, L) => { b.load.fill(null); b.pol.fill(null); L.forEach((id, i) => { b.load[i] = id; }); };
    if (st.bot) { for (const k of ['w', 'h', 'p']) build(k).pol.fill(null); SIM.mods(); }
    else { set(build('w'), st.w); set(build('h'), st.h); meta.aura[heroCls] = st.au || 'terreur'; set(build('p'), st.p); }
    const act = ['w', 'h', 'p'].map((k) => bActive(build(k)).join('+'));
    const x = stats(curEq()), pw = Math.round(power(x)), sv = Math.round(survOf(x));
    const T = SIM.TIERS[C.tier], level = C.level, snap = JSON.stringify(meta), R = [];
    for (let i = 0; i < K; i++) { meta = Object.assign(meta, JSON.parse(snap)); const r = SIM.mission({ level, diff: T.d, torm: T.t, maxRounds: 3 }); R.push([r.died ? 1 : 0, r.rounds, r.kills, r.t, r.boss]); }
    return { tier: T.n, level, pw, sv, act, au: meta.aura[heroCls], R };
  }, [etat.C, st, +K]);
  const n = out.R.length, died = out.R.reduce((a, r) => a + r[0], 0), rounds = out.R.reduce((a, r) => a + r[1], 0) / n, kpm = out.R.reduce((a, r) => a + r[2], 0) / out.R.reduce((a, r) => a + r[3], 0) * 60, boss = out.R.reduce((a, r) => a + r[4], 0) / n;
  const line = { name, cls: st.cls, tier: out.tier, level: out.level, pw: out.pw, sv: out.sv, act: out.act, au: out.au, died, n, rounds: +rounds.toFixed(2), kpm: Math.round(kpm), boss: +boss.toFixed(1), errs: errs.slice(0, 2) };
  console.log(JSON.stringify(line));
  fs.appendFileSync(path.join(dir, 'builds.jsonl'), JSON.stringify(line) + '\n');
  await ctx.close();
}
await b.close();
