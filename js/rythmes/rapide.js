// Crypte des Cendres — rythme de progression « rapide » (rythme du jeu publié).
// Le rythme se choisit dans index.html : la balise <script src="js/rythmes/….js"> placée avant data.js.
// C'est un réglage de développement : le joueur ne choisit pas le rythme, aucun écran ne le propose.
// Mesuré au simulateur (tools/progression) : le Guerrier atteint la fin de jeu (Tourment X niveau 50, dos, 5 pièces abyssales) en 10 h 20 de jeu.
const RYTHME={
  nom:'rapide',
  relicMob:.2,         // chance de relique sur les monstres (× la chance de la v105, sans le bonus de butin du niveau)
  relicElite:.1,       // chance de relique sur une élite (v105 : 30 % × bonus de butin)
  bossRelicEvery:0,    // relique en plus sur un Gardien tous les N niveaux de mission (0 = jamais ; chaque Gardien en donne toujours une)
  abyss:[.03,.01],     // part d'Abyssales parmi les reliques du Tourment VI, puis en plus par palier (v105 : 15 % puis +5 %)
  reactN:30,           // réactifs pour ouvrir une relique en mission
  tormReact:.04,       // Tourment : réactifs en moins par palier (−4 % au palier I, −40 % au palier X)
  sejReact:.05,        // Tourment : réactifs en moins par tranche de séjour dans la mission (2 min)
  sejReactMax:.3,      // … jusqu'à −30 %
  reactCutMax:.7,      // réduction totale maximale des réactifs (il en faut toujours au moins 30 %)
  sejRelic:.1,         // Tourment : reliques sur les monstres et les élites +10 % par tranche de séjour
  sejRelicMax:.6,      // … jusqu'à +60 %
  stayLoot:.1,         // séjour après l'objectif : butin des monstres (objets, fragments, mods, reliques) +10 % par minute
  stayLootMax:1,       // … jusqu'à +100 %
  corrupt:.1,          // part des ennemis corrompus (porteurs de réactif) quand une relique est équipée
  tormIv:[40,30],      // Tourment : secondes entre deux vagues de Gardiens, au palier I puis au palier X
  tormCnt:[2,3],       // Tourment : Gardiens par vague, paliers I–V puis VI–X
  tormBossHp:1.5,      // Tourment : vie des Gardiens (×)
  relicLv:[30,40,45],  // niveau de mission minimum pour les reliques Ancestrale, Sanguine, Abyssale
  craftMul:2,          // coût en or de la fabrication (×)
  forgeMul:3,          // coût en or des Bonus de la Forge (×)
  fuseGold:40,         // fusion de rang : fuseGold × 2^rang × (rareté + 1) × (1 + niveau d'objet / 20) or
  mobRankMax:[3,4,5],  // rang maximum des objets et armes Commun, Magique, Rare (Légendaire et au-dessus : 10)
  starCopies:2,        // copies de mod demandées par étoile (×)
  eggMul:.4,           // chance d'œuf par relique ouverte (×)
  hfMul:1,             // chance de fragment de harnais sur un Gardien (×)
  keyFrag:.1,          // chance de fragment de clé d'antre sur un Gardien, en solo, dans un lieu qui a son Boss (v147)
  keyFragMax:1,        // … au plus par mission (3 fragments font une clé). Simulateur : 1re clé en 0,4 à 1,4 h, puis une toutes les 20 à 30 min
};
