// Crypte des Cendres — unlock.js : le Camp et les choix de mission se débloquent au fil de la progression.
// Chaque déblocage arrive quand le joueur en a besoin, dans l'ordre du Parcours, avec une carte « Nouveau » qui explique la mécanique.
// Un déblocage est définitif. Les sauvegardes d'avant ce système (v107 et plus anciennes) gardent tout ouvert, comme avant.
meta.unl=meta.unl||{};meta.unlNew=Array.isArray(meta.unlNew)?meta.unlNew:[];
const UNL=[
  {k:'bonus',n:'Forge · Bonus',when:()=>meta.wins>=1,need:'Réussis ta première mission.',
    learn:'L\'or rapporté de mission achète des améliorations permanentes pour tous tes héros. Commence par Force et Vigueur. Les talents, propres à chaque héros, s\'achètent dans l\'onglet Héros › Sorts et talents.',go:['forge','up'],help:'camp-forge'},
  {k:'pets',n:'Familier',when:()=>meta.wins>=1,need:'Réussis ta première mission.',
    learn:'Ton premier œuf t\'attend dans Héros › Familier : fais-le éclore et équipe ton familier. Il te suit en mission et gagne des niveaux avec les ennemis abattus.',go:['pets'],help:'familiers'},
  {k:'mods',n:'Mods de l\'arme',when:()=>meta.wins>=2,need:'Réussis 2 missions.',
    learn:'Les mods ramassés en mission se glissent dans les cases de ton arme (Héros › Mods). Chacun coûte de la capacité ; la maîtrise, gagnée en jouant avec cette arme, en ajoute. Un doublon devient une copie, et l\'essence monte le rang d\'un mod.',go:['mods'],help:'camp-mods'},
  {k:'recy',n:'Arsenal · Recyclage',when:()=>meta.wins>=4,need:'Réussis 4 missions.',
    learn:'Recycle les objets qui ne servent plus contre de l\'essence : elle monte le rang des mods et, plus tard, le prestige. Les objets portés ou verrouillés ne se recyclent pas.',go:['arsenal','recy'],help:'camp-coffre'},
  {k:'relics',n:'Reliques',when:()=>meta.wins>=3||(meta.relOpened|0)>0,need:'Réussis 3 missions.',
    learn:'Équipe tes reliques avant de partir : en mission, les ennemis au halo doré lâchent des réactifs qui les ouvrent. Chaque relique ouverte donne un fragment d\'objet légendaire ou plus rare.',go:['relics'],help:'camp-relics'},
  {k:'fuse',n:'Forge · Fusion de rang',when:()=>maxL()>=5||anyRank(),need:'Réussis une mission de niveau 5.',
    learn:'Deux objets identiques de même rang en font un seul du rang au-dessus (+10 % de statistiques). La fusion coûte de l\'or ; les objets portés ou verrouillés ne sont jamais sacrifiés.',go:['forge','fuse'],help:'camp-fusion'},
  {k:'defense',n:'Mission Défense',when:()=>maxL()>=5,need:'Réussis une mission de niveau 5.',
    learn:'Protège le cryopode contre des vagues d\'ennemis. Toutes les 3 vagues : un Gardien, une relique, un équipement, puis sortir ou continuer.',home:1,help:'missions'},
  {k:'craft',n:'Arsenal · Recettes',when:()=>fragTotal()>0||ownedRar(3),need:'Ouvre une relique en mission.',
    learn:'Trois fragments d\'un même objet le fabriquent, au niveau d\'objet de ta plus haute mission réussie : pousse ta mission la plus haute avant de fabriquer.',go:['arsenal','rec'],help:'camp-arsenal'},
  {k:'hmods',n:'Mods du héros',when:()=>maxL()>=8,need:'Réussis une mission de niveau 8.',
    learn:'Ton héros a ses propres cases de mods (vie, armure, compétence…), en plus de celles de l\'arme, et une case d\'aura qui rapporte de la capacité au lieu d\'en coûter.',go:['mods','h'],help:'camp-mods'},
  {k:'arms',n:'Tes armes',when:()=>Object.values(WPN).flat().some(w=>!w.start&&ownedW(w.id))||maxL()>=8,need:'Trouve une deuxième arme.',
    learn:'Tes armes sont dans Héros › Équipement › Arme, avec leur rang, leur maîtrise, leurs mods et leur Puissance comparée à celle que tu portes. Une arme trouvée en double se fusionne pour monter de rang.',go:['equip','gear'],help:'camp-equip'},
  {k:'capture',n:'Mission Capture',when:()=>maxL()>=10,need:'Réussis une mission de niveau 10.',
    learn:'Traque une cible qui fuit, mets-la à terre et capture-la : une relique de la difficulté (Tourment compris) et de l\'or. Une autre cible arrive ensuite ; tiens 3 s dans la zone d\'extraction pour rentrer avec tout.',home:1,help:'missions'},
  {k:'affix',n:'Forge · Transfert d\'affixe',when:()=>maxL()>=12||ownedRar(3),need:'Fabrique un objet légendaire ou réussis une mission de niveau 12.',
    learn:'Prends une affixe sur un objet (la source, détruite) pour la poser sur un autre (la cible) : c\'est ainsi qu\'on construit un build précis. Le coût en essence dépend de la rareté de la source.',go:['forge','affix'],help:'camp-affix'},
  {k:'diff1',n:'Difficulté Difficile',when:()=>maxL()>=12,need:'Réussis une mission de niveau 12.',
    learn:'Deux Gardiens à la fois, plus souvent, 25 % d\'or et 7,5 % de chances d\'objet en plus. Les fragments de harnais tombent plus souvent sur les Gardiens.',home:1,help:'difficulte'},
  {k:'sets',n:'Équipements enregistrés',when:()=>meta.wins>=6,need:'Réussis 6 missions.',
    learn:'Dans Héros › Équipement, enregistre l\'arme et les objets portés pour les remettre en un geste, par exemple un équipement pour les Gardiens et un pour les hordes. Chaque héros a les siens.',go:['equip'],help:'equipements'},
  {k:'diff2',n:'Difficulté Cauchemar',when:()=>(meta.bestDiff|0)>=1,need:'Réussis une mission en Difficile.',
    learn:'Trois Gardiens à la fois, 50 % d\'or et 15 % de chances d\'objet en plus. C\'est là qu\'on rassemble les fragments de harnais du 2e anneau.',home:1,help:'difficulte'},
  {k:'slots',n:'Emplacements',when:()=>(meta.hfrag|0)>0||(meta.bestDiff|0)>=1||slotOpen('anneau2'),need:'Trouve un fragment de harnais sur un Gardien.',
    learn:'Les fragments de harnais, lâchés par les Gardiens, débloquent un 2e anneau puis le dos, pour tous tes héros (Héros › Équipement).',go:['equip'],help:'emplacements'},
  {k:'givre',n:'Biome Abîmes gelés',when:()=>maxL()>=15,need:'Réussis une mission de niveau 15.',
    learn:'Des cavernes de glace : monstres plus coriaces, mais 30 % de butin en plus et les seules affixes et objets de givre.',home:1,help:'difficulte'},
  {k:'align',n:'Alignement des mods',when:()=>maxL()>=15,need:'Réussis une mission de niveau 15.',
    learn:'Aligne une case de mod sur une polarité : un mod de la même polarité y coûte moitié moins de capacité. Ça coûte de l\'essence et remet la maîtrise à 0.',go:['mods'],help:'camp-mods'},
  {k:'sables',n:'Biome Nécropole des Sables',when:()=>maxL()>=25,need:'Réussis une mission de niveau 25.',
    learn:'Des tombeaux sous le désert : monstres bien plus coriaces, sables mouvants et tempêtes de sable, mais 60 % de butin en plus et les seules affixes de malédiction et objets des sables.',home:1,help:'difficulte'},
  {k:'diff3',n:'Tourment',when:()=>(meta.bestDiff|0)>=2,need:'Réussis une mission en Cauchemar.',
    learn:'Dix paliers, chacun débloqué en réussissant le précédent. Dès le niveau 30, les reliques deviennent Ancestrales ; au palier VI, Sanguines puis Abyssales.',home:1,help:'difficulte'},
  {k:'seals',n:'Forge · Sceaux',when:()=>(typeof SEAL_IDS!=='undefined'&&SEAL_IDS.some(id=>(meta.seals||{})[id]>0))||(meta.lshard|0)>0,need:'Trouve un sceau ou un éclat légendaire en Brèche (à plusieurs).',
    learn:'Les sceaux légendaires, trouvés en Brèche, se posent sur un objet en plus de ses affixes.',go:['forge','seals'],help:'coop'},
];
const UNL_BY=Object.fromEntries(UNL.map(u=>[u.k,u]));
const isUnl=k=>!!(meta.unl[k]||meta.unlAll);
// Palier de Tourment le plus haut accessible : le suivant de ton meilleur palier réussi.
const tormMax=()=>meta.unlAll?10:isUnl('diff3')?Math.min(10,(meta.bestTorm|0)+1):0;
const diffOk=i=>i===0||isUnl('diff'+i);
// Vérifie les conditions ; les nouveaux déblocages sont annoncés (carte « Nouveau » au Camp et sur l'écran de fin de mission), sauf en silencieux.
function unlockCheck(silent){const got=[];for(const u of UNL){if(isUnl(u.k))continue;let ok=false;try{ok=!!u.when()}catch{}
    if(ok){meta.unl[u.k]=1;got.push(u.k);if(!silent&&!meta.unlNew.includes(u.k))meta.unlNew.push(u.k)}}
  if(got.length)saveMeta();return got}
function unlockAll(){for(const u of UNL)meta.unl[u.k]=1;meta.unlAll=1;meta.unlNew=[];saveMeta()}
// Une sauvegarde d'avant ce système avec de la progression garde tout ouvert ; une nouvelle partie part avec le Camp fermé.
if(meta.unlV!==1){meta.unlV=1;const legacy=(meta.wins|0)>0||maxL()>1||meta.stash.length>0||allWorn().length>0;if(legacy)unlockAll();else unlockCheck(true);saveMeta()}
else unlockCheck(true);

// Vue verrouillée : ce qu'elle contiendra et comment l'obtenir.
function lockedHtml(k){const u=UNL_BY[k];return `<section class="cx-card lockc"><div class="cx-card__head"><span class="lockc__ico" aria-hidden="true">${LOCK_SVG}</span><div><h4 class="cx-card__title">${u.n} · verrouillé</h4><div class="cx-card__meta">${u.need}</div></div></div><p class="cx-hint" style="margin:0">${u.learn}</p></section>`}
// Carte « Nouveau » en tête de la vue débloquée, jusqu'à « Compris ».
function newCard(k){if(!meta.unlNew.includes(k))return '';const u=UNL_BY[k];
  return `<section class="cx-card newc"><div class="cx-card__head"><div><h4 class="cx-card__title">Nouveau · ${u.n}</h4></div></div><p style="margin:0">${u.learn}</p><div class="cx-actions" style="margin:0"><a class="cx-btn cx-btn--sm" href="aide/index.html#${u.help}" target="_blank" rel="noopener">Voir le guide</a><button class="cx-btn cx-btn--sm cx-btn--primary" data-cact="unlok" data-arg="${k}">Compris</button></div></section>`}
// Les déblocages d'accueil (missions, difficultés, biome) s'annoncent dans la description de l'écran d'accueil.
function unlockHomeSeen(){const n=meta.unlNew.length;meta.unlNew=meta.unlNew.filter(k=>!UNL_BY[k].home);if(meta.unlNew.length!==n)saveMeta()}
