// En mission : HUD, messages, Capture, ouverture de relique, réussite et butin rapporté.
import { newPage, startMission, sleep } from '../lib.mjs';

const hudBoss = (p) => p.evaluate(() => [$('bossTxt').hidden, $('bossTxt').textContent]);

export const tests = [
  { name: 'Survie : « Gardien en approche » seulement dans les 10 dernières secondes', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'survie' });
    await p.evaluate(() => { G.bossT = 30; }); await sleep(p, 150); t.eq(await hudBoss(p), [true, ''], 'masqué');
    await p.evaluate(() => { G.bossT = 6; }); await sleep(p, 150); t.eq(await hudBoss(p), [false, 'Gardien en approche'], 'alerte');
  } },
  { name: 'Défense : alerte avant une vague à Gardien, vague de sortie correcte', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'defense' });
    await p.evaluate(() => { G.wave = 2; G.waveState = 'break'; G.waveT = 3; }); await sleep(p, 150); t.eq((await hudBoss(p))[1], 'Gardien en approche', 'avant vague 3');
    await p.evaluate(() => { G.wave = 3; G.waveState = 'break'; G.waveT = 3; }); await sleep(p, 150); t.eq((await hudBoss(p))[1], 'Sortie vague 6', 'après avoir continué');
  } },
  { name: 'messages : seules les alertes de Gardien s\'affichent en mission', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p);
    await p.evaluate(() => { $('toast').innerHTML = ''; toast('message ordinaire'); banner('bannière ordinaire'); });
    t.eq(await p.evaluate(() => [$('toast').children.length, $('banner').hidden]), [0, true], 'messages ignorés');
    await p.evaluate(() => { G.bossT = 0; }); await sleep(p, 300);
    t.ok(await p.evaluate(() => !$('banner').hidden && /Gardien/.test($('banner').textContent)), 'alerte Gardien affichée');
  } },
  { name: 'relique ouverte en mission : aucun message', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { os: [2, 0] }; meta.relicQ = [{ id: 'os', rad: false }, { id: 'os', rad: false }]; saveMeta(); });
    await startMission(p);
    await p.evaluate(() => { $('toast').innerHTML = ''; G.react = REACT_N - 1; G.drops.push({ kind: 'react', x: G.P.x, y: G.P.y, t: 0, age: 1, mt: 0 }); });
    await sleep(p, 300);
    t.eq(await p.evaluate(() => [G.opened.length, $('toast').children.length, $('banner').hidden]), [1, 0, true], 'ouverte sans message');
  } },
  { name: 'Capture : la cible à terre n\'est plus visée', fn: async (b, t) => {
    const p = t.track(await newPage(b)); await startMission(p, { mode: 'capture', cls: 'archer' });
    const shots = async () => { await p.evaluate(() => { G.en = G.en.filter((e) => e === G.target); G.spawns = []; G.spawnT = 99; G.bossT = 99; G.target.x = G.P.x + 120; G.target.y = G.P.y; window.__n = 0; const o = G.shots.push.bind(G.shots); G.shots.push = (...a) => { window.__n += a.length; return o(...a); }; }); await sleep(p, 1200); return p.evaluate(() => window.__n); };
    t.ok((await shots()) > 0, 'tire sur la cible debout');
    await p.evaluate(() => { G.target.hp = 0; G.target.downed = true; });
    t.eq(await shots(), 0, 'ne tire plus sur la cible à terre');
    t.eq(await p.evaluate(() => { const h = G.target.hp; dmgEnemy(G.target, 999, true); return G.target.hp - h; }), 0, 'aucun dégât');
  } },
  { name: 'réussite : butin, armes, harnais, fragments et compteurs rapportés', fn: async (b, t) => {
    const p = t.track(await newPage(b));
    await p.evaluate(() => { meta.relics = { an: [1, 0] }; meta.relicQ = [{ id: 'an', rad: false }]; meta.diff = 3; meta.torm = 2; meta.hfrag = 0; saveMeta(); });
    await startMission(p, { mode: 'survie', level: 30, diff: 3, torm: 2, cls: 'archer' });
    await p.evaluate(() => { G.loot.items.push(genItem(117, 2)); G.loot.parts.push({ w: 'a6', full: 1 }, { hf: 1 }); G.opened.push(...G.relQ); G.level = 33; missionSuccess(); });
    await sleep(p, 300);
    const r = await p.evaluate(() => [meta.built.a6, meta.hfrag, meta.maxL, meta.wins, meta.bestDiff, meta.relOpened, Object.keys(meta.parts).length > 0, meta.stash.length > 0]);
    t.eq(r, [true, 1, 33, 1, 3, 1, true, true], 'banque');
  } },
];
