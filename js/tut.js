// Crypte des Cendres — tut.js : parcours du joueur nouveau (onglet Héros). Six étapes, objectifs cochés tout seuls.
// Les détails de chaque étape sont dans le guide, section « Bien débuter » (#debuter).
meta.wins=meta.wins|0;meta.bestDiff=meta.bestDiff|0;meta.bestTorm=meta.bestTorm|0;meta.relOpened=meta.relOpened|0;
if(meta.tutV!==1){meta.tutV=1;if(!meta.wins&&(meta.maxL>1||meta.stash.length))meta.wins=1}
const ownedRar=r=>[...meta.stash,...allWorn()].some(i=>i&&i.r>=r&&i.rid)||Object.values(WPN).flat().some(w=>w.r>=r&&ownedW(w.id));
const anyRank=()=>[...meta.stash,...allWorn()].some(i=>i&&(i.up|0)>=1)||Object.values(meta.wlv||{}).some(v=>v>=1);
const TUT=[
  {n:'Premiers pas',tip:'Survie en Normal, niveau 1. Sors au premier portail : un butin ramené vaut mieux qu\'une manche de trop. En pause, équipe ce qui porte ▲.',
    o:[['Réussis ta première mission',()=>meta.wins>=1],['Porte une armure, une amulette, des bottes et un anneau',()=>['armure','amulette','bottes','anneau'].every(k=>meta.gear[k])]]},
  {n:'Premiers achats',tip:'Forge › Bonus : Force, Vigueur puis Célérité. Fais éclore ton œuf offert dans l\'onglet Familier.',
    o:[['Achète Force et Vigueur',()=>lv('str')>=1&&lv('vig')>=1],['Équipe un familier',()=>!!petEq()]]},
  {n:'Monter en niveau',tip:'Monte le niveau de mission sur l\'écran d\'accueil. Après chaque sortie : « Équiper le meilleur », puis Forge › Fusion pour les doubles et Armurerie › Recyclage pour le reste.',
    o:[['Réussis une mission de niveau 10',()=>maxL()>=10],['Fais passer un objet au rang 2',anyRank]]},
  {n:'Premières reliques',tip:'Garde toujours des reliques équipées : elles s\'ouvrent avec les ennemis au halo doré. Pousse ta plus haute mission avant de fabriquer : l\'objet en prend le niveau.',
    o:[['Ouvre une relique en mission',()=>meta.relOpened>=1],['Fabrique un objet légendaire',()=>ownedRar(3)],['Réussis une mission de niveau 20',()=>maxL()>=20]]},
  {n:'Difficile et Cauchemar',tip:'Plus de butin et plus de Gardiens : leurs fragments de harnais débloquent le 2e anneau (onglet Héros).',
    o:[['Réussis une mission en Cauchemar',()=>meta.bestDiff>=2],['Débloque le 2e anneau',()=>slotOpen('anneau2')]]},
  {n:'Tourment',tip:'Tourment I à V : reliques Ancestrales. VI à X : Sanguines et Abyssales, et le dos. Le prestige s\'ouvre quand la Forge est au maximum.',
    o:[['Réussis une mission en Tourment',()=>meta.bestDiff>=3],['Fabrique un objet ancestral',()=>ownedRar(4)],['Débloque le dos',()=>slotOpen('dos')]]},
];
const tutStep=()=>TUT.findIndex(s=>!s.o.every(([,f])=>f()));
// Appelé à la réussite d'une mission (bank).
function tutWin(){meta.wins=(meta.wins|0)+1;const d=dsel().d;if(d>(meta.bestDiff|0))meta.bestDiff=d;if(d===3)meta.bestTorm=Math.max(meta.bestTorm|0,tormT())}
function tutCard(){if(meta.tutOff)return '';const i=tutStep();if(i<0)return '';const S=TUT[i],done=S.o.filter(([,f])=>f()).length;
  return `<section class="cx-card tutc"><div class="cx-card__head"><div><h4 class="cx-card__title">Parcours · étape ${i+1} / ${TUT.length} : ${S.n}</h4><div class="cx-card__meta">${done} / ${S.o.length} objectif${S.o.length>1?'s':''}</div></div></div>
    <ul class="tutl">${S.o.map(([t,f])=>{const ok=f();return `<li class="${ok?'ok':''}"><span aria-hidden="true">${ok?'✓':'○'}</span>${t}</li>`}).join('')}</ul>
    <p class="cx-hint" style="margin:0">${S.tip}</p>
    <div class="cx-actions" style="margin:0"><a class="cx-btn cx-btn--sm" href="aide/index.html#debuter-${i+1}">Voir le guide</a><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="tutoff">Masquer le parcours</button></div></section>`}
