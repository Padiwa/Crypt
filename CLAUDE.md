# Crypte des Cendres — consignes pour Claude Code

Jeu d'action-RPG en hordes (survivor façon Diablo / Warframe), en français, jouable au pouce sur mobile et au clavier. Site statique servi tel quel par GitHub Pages (https://padiwa.github.io/Crypt/), sans étape de build, installable en PWA. La structure des fichiers est décrite dans `README.md` ; ce fichier donne les règles de travail et l'état du projet.

## Règles de travail (demandées par l'auteur)

- **Langue** : tous les textes du jeu, du guide et des documents en français simple, avec les mots du jeu (Gardien, élite, cryopode, manche, vague, Tourment, Forge, affixe, relique, Puissance…). Réponses à l'auteur en français.
- **Apparence en mission** : ne pas changer l'aspect des personnages, des ennemis ni des effets en mission sans demande explicite.
- **Équilibrage** : ne pas changer de valeur de jeu sans accord. On mesure d'abord au banc (`tools/banc/`, `tools/progression/`), on présente les résultats, l'auteur choisit, puis on code.
- **Sauvegarde des joueurs** : ne jamais conseiller d'effacer les données du site sans avoir d'abord exporté la sauvegarde (Réglages › Sauvegarde › Exporter). Une version ne doit jamais casser une sauvegarde : prévoir une conversion dans `progress.js` / `equip.js` / `mods.js` si un format change.
- **Git** : ne pousser ou publier sur GitHub que si l'auteur le demande. Jusqu'à la v146, l'auteur déposait lui-même le contenu du dossier à la racine du dépôt.
- **Avant de livrer une version** :
  - incrémenter `VERSION` en haut de `sw.js` (`crypte-v148`…) ;
  - un nouveau script se déclare dans `index.html`, à la bonne place, et dans la liste `CORE` de `sw.js` ;
  - lancer la suite de tests ;
  - mettre à jour le guide (`aide/index.html`), les textes du jeu touchés et `README.md` si la structure change.

## Architecture en bref

- Scripts classiques (pas de modules) qui partagent la portée globale : **l'ordre des balises `<script>` d'`index.html` compte**. Un `const` d'un fichier chargé plus tard n'existe pas encore au chargement d'un fichier précédent.
- `BAL` (`js/data.js`) = rythme `js/rythmes/rapide.js` (publié) + `window.BAL_OVERRIDE` (réglages d'essai du simulateur et du banc).
- Sauvegarde permanente : objet `meta` (`localStorage` `crypte-meta`), classe jouée `crypte-cls`. État d'une mission : `G` (`newGame` dans `js/game.js`), statistiques du héros : `S` (`stats()` dans `js/items.js`), Puissance : `powerOf` (`js/power.js`).
- Simulation à pas fixe (`js/main.js`, `update(dt)` dans `js/step.js`), rendu WebGL (PixiJS 7.4.2, `js/rendergl.js`) avec repli Canvas (`js/render.js`).

## Commandes

```
npm i playwright && npx playwright install chromium   # une fois
node tools/tests/run.mjs                 # tous les tests (178 en 29 suites, environ 6 min)
node tools/tests/run.mjs --quick         # sans la coopération (167)
node tools/tests/run.mjs 27_difficulte   # une suite (filtre sur le nom de fichier)
python3 -m http.server 8000              # jouer en local : http://localhost:8000 (#test, #test2d, #rapide)
node tools/progression/run.mjs --cls guerrier --hours 4 --seed 1 --out x.jsonl   # carrière simulée (voir README)
node tools/banc/mission.mjs . …          # mission jouée par le bot (voir tools/banc/README.md)
```

Pièges connus :

- **Pages de test** (`#test`, `#test2d`) : manches courtes, avec `LEVEL_T` 24 s au lieu de 120 et `BOSS_T` 8 s au lieu de 60. Un test lit ces constantes plutôt que d'écrire 120 ou 60.
- **Héros invincible** : en `#test`, `GOD` est vrai, donc le héros et le cryopode sont invincibles. Pour mesurer des dégâts reçus, ouvrir la page avec `newPage(b, { hash: '#n' })`.
- **Tests de coopération** (`90_coop`, aussi `14_relais`) : ils échouent parfois par hasard de temps, surtout quand la machine est chargée. Les relancer seuls avant de conclure.
- **`pkill -f "<motif>"`** tue aussi le shell qui lance la commande, puisqu'elle contient le motif. Tuer par numéro de processus.
- **Navigateur de test** : il coupe le réseau, donc pas de PixiJS ; le rendu WebGL est testé avec `tools/tests/fixtures/pixi-mock.js`.

## État au 29 octobre 2026 : v147 en cours (non publiée)

Boss, d'après `boss.md` (choix de l'auteur : clé d'antre, objets uniques pour un build, solo, pas une réponse à la fin de jeu) :

- **Socle** (`js/boss.js`) : fragments de clé sur les Gardiens (solo, lieu qui a son Boss, un au plus par mission), 3 font une clé (`meta.keyF`, `meta.keys`), ligne « Clé d'antre » de l'écran Mission (`meta.keyOn`), arrivée après le premier objectif, arène fermée, Gardiens, manche et extraction en pause, barre crantée, butin (objet unique gardé tout de suite, relique, essence, couleurs `meta.lordW`).
- **Bourreau des Cendres** (Crypte) : Sentence et esquive parfaite (`P.dashAt`), Chaîne (pieu), phase d'ombre (`darkK()`). Objet : **Chaîne du Condamné** (`UQ` dans `js/items.js`, compté dans la Puissance).
- Le Boss est un ennemi de type `'boss'` avec `e.lord` (règles des Gardiens pour les statuts et les bonus) ; son pieu a `e.stake`. Les deux passent par `lordStep` et `lordKill` au lieu du comportement et du butin habituels.
- Valeurs mesurées au banc (`LORD=1`, `PERF_MISS` dans `tools/banc/mission.mjs`) et validées par l'auteur : tableau dans `boss.md`. Vie 4 Gardiens, hordes ×0,5 pendant le combat, fragments 10 % (un par mission).
- Tests : `tools/tests/suites/28_boss.mjs`. Guide : section « Boss ».

## v146

La v146 a été réglée au banc avant d'être codée, à partir d'une copie d'essai :

- **Horloge de mission** (`js/game.js` : `CLOCK_HP`, `CLOCK_DM`, `CLOCK_LV`, `missionM()`, `missionLv()`, `diff()`).
  - Les monstres prennent +15 % de vie et +10 % de dégâts par manche : 2 min en Survie et en Capture, 3 vagues en Défense. C'est continu, à partir du niveau de départ `G.lv0`.
  - « Continuer » ne renforce plus les monstres d'un coup. Il fait toujours monter `G.level`, qui compte pour l'or, le butin et le déblocage du niveau de départ.
  - Le nombre de monstres, leur cadence et les élites suivent le niveau effectif (départ + 2 par manche). Les types de monstres suivent le temps et le niveau de manche, comme avant. L'auteur a choisi de garder la même répartition des types.
- **Gardiens** (`bossHpMul`, `bossMean`) : +10 % par Gardien déjà venu, au lieu de +25 %, avec la même vie moyenne qu'en v145 sur une mission type. En Brèche, ils sont comptés par paires.
- **Élites** : chance de départ selon la difficulté, puis +1 point par niveau effectif gagné, plafond 35 % (`ELITE_LV`, `ELITE_CAP`).
- **Cryopode** : sa vie suit le Tourment (`× dif().dm`) et les flaques lui font moitié moins de dégâts (`POD_ZONE` dans `js/combat.js`).
- **Bonus sous condition** : ils s'additionnent au lieu de se multiplier, total plafonné à +300 % (`COND_CAP` dans `dmgEnemy`). La Puissance (`js/power.js`) suit la même règle.
- **Projectiles et Transpercement** : ils ne comptent que sur une arme (`AFF_WONLY`, `affIdle`, `affOff(k, c, it)` dans `js/data.js`).
  - Le butin hors arme ne les tire plus, et le transfert ne les pose que sur une arme.
  - Le +1 par fusion est gardé, jusqu'à +5.
  - Un objet déjà possédé garde l'affixe, barrée « sans effet · sur une arme seulement ».
- Tests de la version : `tools/tests/suites/27_difficulte_v146.mjs`.

## Travaux ouverts (décisions de l'auteur en attente)

- **Fin de jeu** : le très bon équipement au niveau 50 en Tourment X n'est jamais en danger. Faut-il des paliers au-delà du Tourment X, ou un Tourment X plus dur ?
- **Calcul de la Puissance** : sans limite, il atteint des milliards en fin de carrière, avec l'ultime à 92-100 % du total. Piste : ne pas compter les dégâts au-delà de la vie d'un monstre du palier, et compter l'ultime selon le temps où il sert vraiment.
- **Rééquilibrage des styles**, remis à plus tard par l'auteur : l'éclair en chaîne domine (Arc électrique, Surtension) ; poison, saignement et feu sont en retrait.
- Écarts de textes de mods relevés en v145 ; morts de la première heure plus fréquentes au banc depuis la v142 (cause non trouvée).
- Les alertes de butin (liste de souhaits de la Forge) proposent encore Projectiles et Transpercement. Depuis la v146, seules les armes tombées peuvent les porter.

## Idées de l'auteur (ancien `todo.md`)

- Tremblement d'écran quand on lance un sort ou un ultime (touche à l'apparence en mission : demander avant).
- Au-delà d'une certaine valeur de critique, un bonus pendant quelques secondes (vitesse des projectiles, souffle des explosions…).
- Simplifier l'ergonomie de l'interface, selon les bonnes pratiques des jeux du genre.
- Flash de butin seulement quand la valeur de l'affixe dépasse celle de l'objet équipé qui la porte.

## Documents de conception

L'auteur tient des documents sur claude.ai (privés, à lui demander s'il faut s'y référer) :

- Spécification, avec le journal des versions ;
- Difficulté ;
- Formules des statistiques ;
- Tests et banc ;
- Architecture ;
- Mods : effets et calculs ;
- Difficulté au fil de la mission : essais.

Les mettre à jour quand une règle change, ou signaler à l'auteur ce qui y est devenu faux.
