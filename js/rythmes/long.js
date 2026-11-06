// Crypte des Cendres — rythme de progression « long » : fin de jeu visée vers 80 h de jeu.
// Pour l'utiliser : dans index.html, remplacer js/rythmes/rapide.js par js/rythmes/long.js (et dans sw.js, liste CORE).
// C'est un réglage de développement : le joueur ne choisit pas le rythme, aucun écran ne le propose.
// À confirmer au simulateur : node tools/progression/run.mjs --rythme long --cls guerrier --hours 90
const RYTHME={
  nom:'long',
  relicMob:.1,         // chance de relique sur les monstres (× la chance de la v105, sans le bonus de butin du niveau)
  relicElite:.05,      // chance de relique sur une élite
  bossRelicEvery:0,    // relique en plus sur un Gardien tous les N niveaux de mission (0 = jamais)
  abyss:[.015,.005],   // part d'Abyssales parmi les reliques du Tourment VI, puis en plus par palier
  reactN:40,           // réactifs pour ouvrir une relique en mission
  tormReact:.03,       // Tourment : réactifs en moins par palier
  sejReact:.04,        // Tourment : réactifs en moins par tranche de séjour dans la mission (2 min)
  sejReactMax:.24,     // … au plus
  reactCutMax:.6,      // réduction totale maximale des réactifs
  sejRelic:.08,        // Tourment : reliques sur les monstres et les élites en plus par tranche de séjour
  sejRelicMax:.48,     // … au plus
  stayLoot:.1,         // séjour après l'objectif : butin des monstres (objets, fragments, mods, reliques) +10 % par minute
  stayLootMax:1,       // … jusqu'à +100 %
  corrupt:.08,         // part des ennemis corrompus quand une relique est équipée
  tormIv:[50,40],      // Tourment : secondes entre deux vagues de Gardiens, au palier I puis au palier X
  tormCnt:[2,2],       // Tourment : Gardiens par vague, paliers I–V puis VI–X
  tormBossHp:2,        // Tourment : vie des Gardiens (×)
  relicLv:[30,40,45],  // niveau de mission minimum pour les reliques Ancestrale, Sanguine, Abyssale
  craftMul:4,          // coût en or de la fabrication (×)
  forgeMul:6,          // coût en or des Bonus de la Forge (×)
  fuseGold:120,        // fusion de rang : fuseGold × 2^rang × (rareté + 1) × (1 + niveau d'objet / 20) or
  mobRankMax:[2,3,4],  // rang maximum des objets et armes Commun, Magique, Rare (Légendaire et au-dessus : 10)
  starCopies:3,        // copies de mod demandées par étoile (×)
  eggMul:.25,          // chance d'œuf par relique ouverte (×)
  hfMul:.6,            // chance de fragment de harnais sur un Gardien (×)
  keyFrag:.1,          // chance de fragment de clé d'antre sur un Gardien, en solo, dans un lieu qui a son Boss (v147)
  keyFragMax:1,        // … au plus par mission (3 fragments font une clé)
  // Paliers au-delà du Tourment X (v155, valeurs choisies par l'auteur). Chaque tableau donne XI, XII, XIII, XIV, XV.
  tormTop:15,          // palier de Tourment le plus haut (10 = pas de palier au-delà du X)
  tormX:[2,3,4.5,6,8], // vie et dégâts des monstres, × ceux du Tourment X (v156, banc du 5 novembre 2026) (butin et qualité des affixes suivent la courbe des paliers I à X)
  subCh:[.1,.15,.2,.25,.3],  // chance qu'une affixe d'un objet tombé en mission soit Sublime
  subBonus:[.2,.25,.3,.4,.5],// une affixe Sublime vaut (1 + ce bonus) × sa valeur tirée (au-dessus du maximum habituel)
  firstEss:[500,1000,1500,2000,2500], // première victoire d'un palier : essence du coffre (avec une relique Abyssale et un fragment de clé d'antre)
  lordUqStep:10,       // objet unique d'un Boss tué au-delà du Tourment X : pouvoir + lordUqStep points par palier au-dessus du X
  keyFragTop:.2,       // chance de fragment de clé d'antre sur un Gardien au-delà du Tourment X (au lieu de keyFrag)
};
