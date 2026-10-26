// Contrôles : souris (suivre, clic maintenu = immobile, joystick), clavier.
import { newPage, startMission, sleep } from '../lib.mjs';

const near = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 10; // les monstres peuvent bousculer le héros de quelques pixels
const pos = (p) => p.evaluate(() => [Math.round(G.P.x), Math.round(G.P.y)]);
const heroScreen = (p) => p.evaluate(() => { const z = zoom(); return [(G.P.x - G.cam.x) * z + innerWidth / 2, (G.P.y - G.cam.y) * z + innerHeight / 2]; });

export const tests = [
  { name: 'souris : le héros suit le pointeur, s\'arrête dessus et clic maintenu', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 1280, h: 800 })); await startMission(p);
    const a = await pos(p); await p.mouse.move(1200, 400); await sleep(p, 600); const r = await pos(p);
    t.ok(r[0] > a[0] + 40, 'va vers la droite');
    const s = await heroScreen(p); await p.mouse.move(s[0], s[1]); await sleep(p, 200); const c1 = await pos(p); await sleep(p, 300);
    t.ok(near(await pos(p), c1), 'immobile sous le pointeur');
    await p.mouse.move(1200, 400); await p.mouse.down(); await sleep(p, 150); const d0 = await pos(p); await sleep(p, 400);
    t.ok(near(await pos(p), d0), 'immobile clic maintenu'); await p.mouse.up(); await sleep(p, 300);
    t.ok((await pos(p))[0] > d0[0], 'repart au relâchement');
  } },
  { name: 'souris en mode Joystick : pas de suivi', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 1280, h: 800 }));
    await p.evaluate(() => { SET.mouse = 'joy'; saveSet(); }); await startMission(p);
    const a = await pos(p); await p.mouse.move(1200, 400); await sleep(p, 500);
    t.ok(near(await pos(p), a), 'reste en place');
  } },
  { name: 'clavier : D déplace vers la droite', fn: async (b, t) => {
    const p = t.track(await newPage(b, { w: 1280, h: 800 })); await startMission(p);
    const a = await pos(p); await p.keyboard.down('d'); await sleep(p, 400); await p.keyboard.up('d');
    t.ok((await pos(p))[0] > a[0] + 20, 'déplacé');
  } },
  { name: 'zoom réglé dans la pause : vue plus large ou plus serrée, HUD inchangé, gardé après rechargement', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p);
    const hud0 = await p.evaluate(() => [$('hpBox').offsetHeight, $('bagBtn').offsetWidth, $('bDash').offsetWidth, $('objBox').offsetHeight]);
    const vw0 = await p.evaluate(() => G.vw);
    await p.evaluate(() => openBag()); await p.click('#setBtnBag');
    t.eq(await p.evaluate(() => [$('sv_zoom').textContent, document.querySelector('[data-zoom]').value]), ['100 %', '100'], 'curseur à 100 %');
    await p.evaluate(() => { const i = document.querySelector('[data-zoom]'); i.value = '70'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await sleep(p, 200);
    t.ok(await p.evaluate((vw0) => Math.abs(G.vw - vw0 / .7) < 2, vw0), 'à 70 %, la vue montre 1/0,7 fois plus de largeur');
    t.eq(await p.evaluate(() => $('sv_zoom').textContent), '70 %', 'valeur affichée');
    await p.click('#closeSet'); await p.evaluate(() => closeBag()); await sleep(p, 200);
    t.eq(await p.evaluate(() => [$('hpBox').offsetHeight, $('bagBtn').offsetWidth, $('bDash').offsetWidth, $('objBox').offsetHeight]), hud0, 'HUD de la même taille');
    await p.reload(); await startMission(p); await sleep(p, 200);
    t.ok(await p.evaluate((vw0) => SET.zoom === .7 && Math.abs(G.vw - vw0 / .7) < 2, vw0), 'zoom gardé après rechargement');
    await p.evaluate(() => { SET.zoom = 1.4; }); await sleep(p, 200);
    t.ok(await p.evaluate((vw0) => Math.abs(G.vw - vw0 / 1.4) < 2, vw0), 'à 140 %, vue plus serrée');
  } },
];
