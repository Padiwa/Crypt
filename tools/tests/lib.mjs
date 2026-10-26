// Crypte des Cendres — aides de la suite de tests (Playwright, navigateur Chromium sans affichage).
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..', '..');           // dossier du site
export const GAME = pathToFileURL(path.join(ROOT, 'index.html')).href;
export const GUIDE = pathToFileURL(path.join(ROOT, 'aide', 'index.html')).href;
export const FIX = (f) => path.join(here, 'fixtures', f);

// Playwright : paquet local (npm i playwright), sinon chemin donné par PLAYWRIGHT_PATH.
export async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) {}
  const p = process.env.PLAYWRIGHT_PATH || '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
  return await import(pathToFileURL(p).href);
}

// Une page neuve (stockage vide). hash : '#test2d' (rendu 2D, accéléré, invincible) ou '#test' (WebGL).
// locked : garde le Camp verrouillé comme pour un joueur neuf (par défaut, tout est débloqué pour tester chaque écran).
export async function newPage(browser, { hash = '#test2d', w = 390, h = 844, downloads = false, keep = false, locked = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, acceptDownloads: downloads });
  const p = await ctx.newPage();
  p.errs = [];
  p.on('pageerror', (e) => p.errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  // pas de réseau en test : polices et CDN coupés
  await p.route(/fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs/, (r) => r.abort());
  await p.goto(GAME + hash);
  if (!keep) { await p.evaluate(() => localStorage.clear()); await p.reload(); if (!locked) await p.evaluate(() => unlockAll()); }
  p.ctx = ctx;
  return p;
}

// Prépare la sauvegarde puis recharge (les migrations de data.js s'exécutent).
export async function withMeta(p, fn, arg) {
  await p.evaluate(fn, arg);
  await p.evaluate(() => saveMeta());
}

// Navigation du Camp, indépendante de la disposition exacte des onglets.
export async function openCamp(p) { if (await p.evaluate(() => $('camp').hidden)) await p.click('#campBtn'); }
export async function campView(p, tab, sub) {
  await openCamp(p);
  await p.evaluate(([t, s]) => {
    campTab = t; campSel = null; campBack = null;
    if (t === 'forge' && s) forgeSub = s;
    if (t === 'arsenal' && s) arsView = s;
    drawCamp();
  }, [tab, sub]);
}
export async function closeCamp(p) { if (!(await p.evaluate(() => $('camp').hidden))) await p.click('#closeCamp'); }

// Lance une mission (mode, niveau, difficulté, palier, classe).
export async function startMission(p, { mode = 'survie', level = 1, diff = 0, torm = 1, cls = null } = {}) {
  await p.evaluate(([m, l, d, t, c]) => {
    meta.mode = m; meta.start = l; meta.diff = d; meta.torm = t; saveMeta();
    if (c) { localStorage.setItem('crypte-cls', c); }
  }, [mode, level, diff, torm, cls]);
  if (cls) await p.reload();
  await closeCamp(p);
  await p.click('#startBtn');
  await p.waitForFunction(() => started && G && !G.over);
}

export const sleep = (p, ms) => p.waitForTimeout(ms);
