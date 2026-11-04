// Crypte des Cendres — tourment.js : paliers au-delà du Tourment X (v155, choix de l'auteur).
// Affixes Sublimes, première victoire de chaque palier (coffre, couleurs, titre en coopération), objet unique renforcé des Boss.
// Toutes les valeurs sont dans le rythme (js/rythmes/*.js) : tormTop, tormX, subCh, subBonus, firstEss, lordUqStep, keyFragTop.
// La vie et les dégâts des monstres de ces paliers sont calculés dans dif() (progress.js, tormTopK).
meta.tormW = meta.tormW || {}; // paliers au-delà du X déjà réussis une fois : { 11: 1, … }

// Rang du palier au-delà du X (0 pour le XI, 4 pour le XV), ou -1 en dessous.
const topI = (t = tormT()) => t > 10 ? t - 11 : -1;
const topV = (key, t) => { const i = topI(t); return i < 0 ? 0 : ((BAL[key] || [])[i] || 0); };
// Plus haut palier au-delà du X réussi (0 sinon) : le titre affiché en coopération.
const myTT = () => (meta.bestTorm | 0) > 10 ? meta.bestTorm | 0 : 0;
const ttBadge = (tt) => (tt | 0) > 10 ? `<span class="ttb" title="Tourment ${ROM[tt - 1]} réussi" aria-label="Tourment ${ROM[tt - 1]} réussi">${ROM[tt - 1]}</span>` : '';

/* ---------- Affixes Sublimes ---------- */
// Un objet tombé en mission au-delà du X : chaque affixe a la chance BAL.subCh d'être Sublime, et vaut alors (1 + BAL.subBonus) × sa valeur
// tirée. Les pouvoirs abyssaux et les affixes en nombre entier (projectiles, transpercement…, NOSCALE) ne le sont jamais ; les armes non plus
// (valeurs fixes) ni les objets fabriqués. La marque (it.sub) suit l'affixe dans un transfert (forge.js) et une fusion de rang (fuse.js).
function subRoll(it) {
  if (typeof started === 'undefined' || !started || !G || G.over || !it || !it.aff || it.wid) return it;
  const ch = topV('subCh'), bo = topV('subBonus'); if (!ch || !bo) return it;
  for (const k in it.aff) { if (!AFF[k] || AFF[k].aby || NOSCALE[k] || it.aff[k] == null) continue;
    if (Math.random() < ch) { it.aff[k] = Math.round(it.aff[k] * (1 + bo) * 10) / 10; (it.sub || (it.sub = {}))[k] = 1; } }
  return it;
}
const isSub = (it, k) => !!(it && it.sub && it.sub[k]);
const subTag = '<span class="subt" title="Affixe Sublime : au-dessus du maximum habituel (tombée au-delà du Tourment X)">Sublime</span>';
const subN = (it) => it && it.sub ? Object.keys(it.sub).filter((k) => it.aff && it.aff[k] != null).length : 0;

/* ---------- Première victoire d'un palier au-delà du X ---------- */
// Couleurs gagnées (cape, bordure, capuche), proposées dans Héros › Apparence (lookSw, boss.js) et montrées dans Collection › Couleurs.
const TORM_SW = {
  11: { n: 'Braise du Tourment XI', cloak: '#2a1208', rim: '#ff7a2a', inner: '#140804' },
  12: { n: 'Givre noir du Tourment XII', cloak: '#0e1a26', rim: '#7fd4ff', inner: '#060b10' },
  13: { n: 'Sang royal du Tourment XIII', cloak: '#3a0716', rim: '#e8b04a', inner: '#16030a' },
  14: { n: 'Néant du Tourment XIV', cloak: '#120a24', rim: '#b07cff', inner: '#07040e' },
  15: { n: 'Cendre d\'or du Tourment XV', cloak: '#1c1a16', rim: '#ffd86b', inner: '#0b0a08' },
};
const tormSw = (k) => Object.keys(TORM_SW).filter((t) => meta.tormW[t]).map((t) => TORM_SW[t][k]);
// Appelée à la victoire (tutWin, au retour au Camp) : coffre (relique Abyssale, essence BAL.firstEss, fragment de clé d'antre),
// couleurs et titre (meta.bestTorm). Une seule fois par palier.
function tormFirstWin(t) {
  if (t <= 10 || meta.tormW[t]) return; meta.tormW[t] = 1;
  const a = meta.relics.ab || (meta.relics.ab = [0, 0]); a[0]++;
  const e = topV('firstEss', t); meta.essence += e;
  keyGive(1);
  toast(`<b style="color:#ff6a3a">Tourment ${ROM[t - 1]} réussi pour la première fois</b> : relique Abyssale, ${e} essence, fragment de clé d'antre et couleurs « ${TORM_SW[t] ? TORM_SW[t].n : ''} » (Héros › Apparence).`, true);
}

/* ---------- Boss au-delà du X ---------- */
// Pouvoir de l'objet unique tombé : UQ.v + BAL.lordUqStep par palier au-dessus du X (it.uqv). S'il est déjà à toi, le tien prend
// ce pouvoir quand il est plus fort (au lieu de l'essence de double).
const lordUqBonus = () => { const t = tormT(); return t > 10 ? (t - 10) * (BAL.lordUqStep || 0) : 0; };
const uqVal = (it) => it ? (it.uqv || (UQ[it.uq] ? UQ[it.uq].v : 0)) : 0;
// Chance de fragment de clé d'antre sur un Gardien (keyDrop, boss.js).
const keyFragCh = () => tormT() > 10 ? (BAL.keyFragTop || BAL.keyFrag || 0) : (BAL.keyFrag || 0);
