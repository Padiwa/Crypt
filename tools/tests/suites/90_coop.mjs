// Coopération à deux (WebRTC local) : connexion, mission, familiers, pas d'erreur. Lente : ignorée avec --quick.
import { newPage, sleep } from '../lib.mjs';
export const slow = true;

export const tests = [
  { name: 'deux joueurs se connectent et jouent une Survie', fn: async (b, t) => {
    const A = t.track(await newPage(b)), B = t.track(await newPage(b));
    await B.evaluate(() => { localStorage.setItem('crypte-cls', 'guerrier'); }); await B.reload();
    await A.click('#coopBtn'); await A.click('[data-coop="host"]');
    await A.waitForFunction(() => NET.peers.some((p) => p.code), null, { timeout: 15000 });
    const offer = await A.evaluate(() => NET.peers.find((p) => p.code).code);
    await B.click('#coopBtn'); await B.click('[data-coop="join"]'); await B.fill('#coopIn', offer); await B.click('[data-coop="joingo"]');
    await B.waitForFunction(() => NET.state === 'showAnswer', null, { timeout: 15000 });
    await A.fill('#coopIn', await B.evaluate(() => NET.code)); await A.click('[data-coop="answer"]');
    await A.waitForFunction(() => NET.on, null, { timeout: 15000 }); await B.waitForFunction(() => NET.on, null, { timeout: 15000 });
    await A.click('#closeCoop'); await B.click('#closeCoop');
    await A.click('#startBtn'); await B.waitForFunction(() => started, null, { timeout: 8000 }); await sleep(A, 3000);
    t.ok(await A.evaluate(() => G.mates.length === 1), 'l\'hôte voit l\'invité');
    t.ok(await B.evaluate(() => G.mates.length === 1 && G.en.length > 0), 'l\'invité voit l\'hôte et les monstres');
  } },
];
