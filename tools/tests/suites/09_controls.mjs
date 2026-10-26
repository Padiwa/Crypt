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
];
