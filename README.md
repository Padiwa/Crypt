# Crypte des Cendres

Action-RPG de crypte en hordes, jouable au pouce sur mobile et au clavier. Site statique, servi tel quel par GitHub Pages (aucune étape de build), installable en PWA.

## Structure
| Fichier | Rôle |
| --- | --- |
| `index.html` | Interface (HUD, accueil Combat, écran Mission, Camp, barre des 5 onglets, Réglages) et ordre de chargement des scripts |
| `css/game.css` | Toute la feuille de style : mise en page et design system « Crypte » (tokens + composants `cx-`), puis l'habillage de la refonte v130, style « AAA mobile » (cadres dorés, boutons à relief, cases serties). `aaa.css` y est fusionné depuis la v135 |
| `js/data.js` | Outils communs, raretés, rythme (`BAL`), emplacements, biomes, classes, armes, reliques et objets des reliques |
| `js/progress.js` | Sauvegarde `meta` et son chargement, Bonus de la Forge, talents, prestige, bonus de partie, sorts et ultimes |
| `js/mods.js` | Statuts (constantes), mods d'arme et de héros, rangs, étoiles, capacité, conversions des mods (v141, v142) |
| `js/items.js` | Affixes, objets (tirage, rang, fragments), objets uniques des Boss (`UQ`), statistiques du héros (`stats`) |
| `js/equip.js` | Migrations v91 et v139, équipement par héros, équipements enregistrés |
| `js/game.js` | État d'une mission (`newGame`), ennemis, apparitions, Nécropole des Sables, sol, effets |
| `js/combat.js` | Dégâts, statuts, explosions, mort d'un ennemi et butin, coups reçus |
| `js/boss.js` | Boss (v147) : fragments et clé d'antre, arène, Bourreau des Cendres, butin, ligne de l'écran Mission, dessins des deux rendus |
| `js/spells.js` | Entrées (clavier, souris, tactile), sorts, ultimes, esquive et potion |
| `js/step.js` | Grille spatiale et pas de simulation `update(dt)` |
| `js/render.js` | Rendu Canvas 2D, formes communes aux deux rendus (sables, statuts, icônes de butin) et HUD |
| `js/rendergl.js` | Rendu WebGL (PixiJS 7.4.2) : textures, formes des monstres et des héros, repli sur le Canvas |
| `js/ui.js` | Fiches d'objets, Pause, bonus de niveau, fin de mission |
| `js/power.js` | Puissance (`powerOf`, `survOf`) et « Équiper le meilleur » |
| `js/modsui.js` | Interface des mods (Héros › Mods) : builds d'arme, de héros et de familier, collection, surcharge |
| `js/camp.js` | Cœur du Camp : état, affichage des onglets et du pied, table d'actions `CAMP_ACT` (chaque fichier du Camp y ajoute les siennes), accueil, feuille de choix |
| `js/heros.js` | Onglet Héros : couleurs, prestige, sorts et talents, équipements enregistrés (actions) |
| `js/arsenal.js` | Onglet Arsenal : Coffre, Recettes (plans, fragments, fabrication), Recycler |
| `js/forge.js` | Onglet Forge : transfert d'affixe, liste de souhaits, Bonus |
| `js/collection.js` | Collection › Reliques : file d'ouverture, reliques forgées, raffinage |
| `js/save.js` | Réglages › Sauvegarde : exporter, importer, recommencer à zéro |
| `js/shell.js` | Navigation de la refonte : barre des 5 onglets, accueil Combat (héros dessiné, carte de mission), écran Mission, feuille du Parcours |
| `js/inv.js` | Inventaire unique (recherche, tri, filtres, grilles de 120 cases) et onglet Héros (six tuiles) |
| `js/gearview.js` | Héros › Équipement (emplacement par emplacement, objets classés par Puissance), équipements enregistrés, Arsenal › Coffre |
| `js/dock.js` | Fiche d'objet ancrée, comparaison, départ d'un transfert d'affixe, message « Annuler » |
| `js/recycle.js` | Arsenal › Recycler |
| `js/fuse.js` | Fusion de rang (armes et équipements) et son écran, Forge › Fusion |
| `js/seal.js` | Sceaux légendaires de la Brèche (Forge › Sceaux) |
| `js/pet.js` | Familiers (Héros › Familier) |
| `js/tut.js` | Parcours du joueur nouveau |
| `js/unlock.js` | Déblocages progressifs du Camp et des choix de mission (conditions, cartes « Nouveau ») |
| `js/rythmes/` | Rythmes de progression (`rapide.js` publié, `long.js`) |
| `js/net.js` | Coopération jusqu'à 4 (WebRTC) : par code à 4 chiffres (relais) ou par QR codes |
| `js/netui.js` | Écran Coopération : salon, codes, QR code, caméra |
| `js/relais.js` | Remplace l'adresse du relais (vide : relais du jeu, `RELAY_CF` dans `js/net.js` ; `off` : QR codes seulement) |
| `relais/` | Le relais (Cloudflare Worker + Durable Objects, offre gratuite) et son déploiement |
| `js/update.js` | Détection des nouvelles versions |
| `js/nav.js` | Retour arrière (bouton Retour d'Android, Échap) et raccourcis clavier du Camp |
| `aide/` | Guide du joueur |
| `tools/tests/` | Suite de tests automatiques |
| `tools/banc/` | Banc de mission : missions jouées par le bot pour mesurer l'équilibrage (voir son README) |
| `CLAUDE.md` | Consignes de travail et état du projet pour Claude Code |
| `js/settings.js` | Réglages de l'appareil, bannière d'événements, vibrations |
| `js/audio.js` | Sons synthétisés (Web Audio) et musique d'ambiance |
| `js/main.js` | Boucle à pas fixe et démarrage |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA (hors ligne, installation) |

Les scripts sont classiques (pas de modules) et partagent la portée globale : **l'ordre des balises `<script>` dans `index.html` compte**.

## Publier sur GitHub Pages
1. Envoie ce dossier à la racine d'un dépôt.
2. Réglages → Pages → Source : branche `main`, dossier `/ (root)`.
3. Le jeu est à `https://<compte>.github.io/<dépôt>/`. Le fichier `.nojekyll` évite tout traitement par Jekyll.

## Mettre à jour
Modifie les fichiers, puis incrémente `VERSION` en haut de `sw.js` (ex. `crypte-v41`) pour que les joueurs reçoivent la nouvelle version.

L'appli détecte toute seule le changement de `VERSION` (au lancement, au retour au premier plan et toutes les 30 min, voir `js/update.js`) : un bandeau « Nouvelle version du jeu · Mettre à jour » s'affiche hors mission (accueil, pause, Camp, fin de partie). Réglages › Application montre la version installée et un bouton Rechercher.

GitHub Pages fait garder chaque fichier 10 minutes par le navigateur. Depuis la v131, `sw.js` contourne ce cache : à l'installation (`cache: 'reload'`) comme pour la page, les scripts et le CSS (`cache: 'no-cache'`, une réponse 304 légère si rien n'a changé). Une version publiée arrive donc dès que GitHub Pages l'a mise en ligne (1 à 2 minutes). La suite `17_pwa` le vérifie sur un petit serveur local.

## Rythme de progression
Les réglages qui fixent la vitesse de progression sont dans des fichiers de rythme, `js/rythmes/` : `rapide.js` (rythme publié, par défaut) et `long.js` (fin de jeu visée vers 80 h). Chacun définit `RYTHME`, chaque valeur commentée : reliques (monstres, élites, Gardiens, part d'Abyssales), réactifs, Gardiens du Tourment, niveau requis pour chaque rareté de relique, coûts en or (fusion de rang, fabrication, Bonus de la Forge), rang maximum du butin des monstres, étoiles de mod, œufs, fragments de harnais.
Le rythme chargé est celui de la balise `<script src="js/rythmes/….js">` d'`index.html`, avant `data.js` (penser aussi à la liste `CORE` de `sw.js`). C'est un réglage de développement : le joueur ne le choisit pas. Pour un nouveau rythme, copier un fichier et changer ses valeurs. Le simulateur le mesure avant publication : `node tools/progression/run.mjs --rythme long --cls guerrier` (nom ou chemin d'un fichier), `--bal '{"relicMob":0.15}'` pour essayer une valeur seule.

## Tester en local
`python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000. Adresses de test : `#test` (invincible, rapide), `#test2d` (idem en rendu Canvas), `#rapide` (manches courtes).

## Tests
Une suite unique vérifie le jeu dans un vrai navigateur (Chromium sans affichage) : démarrage, butin, reliques, fabrication et fusion, coffre, affixes, emplacements, missions, contrôles, sauvegarde, parcours, coopération.
```
npm i playwright && npx playwright install chromium
node tools/tests/run.mjs            # tout (178 tests, ≈ 6 min)
node tools/tests/run.mjs --quick    # sans la coopération (167 tests)
node tools/tests/run.mjs fusion     # seulement les suites dont le fichier contient « fusion »
```
Chaque fichier de `tools/tests/suites/` exporte une liste `tests`. Toute erreur JavaScript dans la page fait échouer le test. **À lancer avant chaque nouvelle version** : la commande sort en erreur si un test échoue.

## Installer sur téléphone
Android (Chrome) : menu ⋮ → « Installer l'application ». iPhone (Safari) : Partager → « Sur l'écran d'accueil ».

## Sauvegarde
Progression dans le stockage du navigateur (`crypte-meta`), réglages dans `crypte-set`. Réglages (l'engrenage) → Exporter ou Importer pour la sauvegarde en JSON.

## Simulateur de progression
`tools/progression/` joue des carrières complètes dans un vrai navigateur sans affichage. Un bot joue des missions de Survie avec les règles du jeu ; entre deux missions, il passe au Camp comme le conseille le Parcours (fusion, fabrication, meilleur équipement, recyclage, Bonus, talents, prestige, emplacements, mods, familier, reliques). Il monte d'un niveau après chaque sortie d'au moins deux manches, change de palier au plafond prévu et redescend de trois niveaux après une mission perdue ; après deux pertes de suite, il descend d'un palier en gardant son niveau.
```
node tools/progression/run.mjs --cls archer --missions 150 --seed 1 --out resultats/archer_1.jsonl
node tools/progression/report.mjs resultats/*.jsonl --notes analyse.html --out rapport.html
node tools/progression/report.mjs resultats/*.jsonl --base ancien/ --base-label v105 --out rapport.html   # comparé à un banc précédent
node tools/progression/ablate.mjs resultats/archer_1_etat.json
node tools/progression/builds.mjs resultats 4 tank feu   # exemples de builds, à partir des états <classe>_1_etat.json
```
`run.mjs` écrit une ligne par mission (palier, niveau, mort, butin, puissance, économie), les jalons et l'état de la sauvegarde. `--caps 5,1,1,...` change le niveau à atteindre sur chaque palier avant de passer au suivant (13 paliers, de Normal à Tourment X). `report.mjs` trace les courbes et les tableaux ; `ablate.mjs` montre d'où vient la puissance du héros en retirant une source à la fois. `builds.mjs` joue les six exemples de builds du document de conception des mods (Poison, Feu, Contrôle, Tank, Critique, Esquive) et le build du bot, à partir d'un état de fin de carrière, tous les mods au rang maximum : morts, manches, ennemis tués par minute, Gardiens. Même graine, même carrière. Compter 5 à 15 s par mission.

## Coopération

`js/net.js` relie jusqu'à 4 appareils en pair à pair (WebRTC, canal de données), sans serveur de jeu. La mise en relation passe par le relais (code à 4 chiffres, le mode par défaut, voir plus bas) ou, sans relais, par les codes d'offre et de réponse (SDP compressé), échangés par QR code ou copier-coller. L'hôte simule les monstres et envoie un instantané 20 fois par seconde ; chaque joueur simule son héros, ses tirs (coups envoyés à l'hôte) et son propre butin. Le QR code utilise `qrcode-generator` (jsDelivr), chargé seulement à l'ouverture de l'écran Coopération (`js/netui.js`). Fonctionne sur GitHub Pages (https) ; même réseau conseillé (un serveur STUN public est aussi indiqué).

Chaque joueur se présente (message `hello`, protocole `NET_V`) avec son héros, son nom et le niveau de prestige de ce héros ; l'hôte renvoie la liste à tous (`roster`) à chaque changement. Le nom vient de `meta.pname` (Réglages › Compte, nettoyé par `cleanName`, 16 signes) ou, par défaut, de l'identifiant `meta.pid` tiré une fois (`Joueur-XXXXX`). Les deux font partie de la sauvegarde.

**Rejoindre avec un code.** Avec le relais (`relais/`, déployé sur Cloudflare, voir `relais/README.md` ; son adresse est `RELAY_CF` dans `js/net.js`, le mode par défaut, que `js/relais.js` peut remplacer), l'hôte touche « Créer une partie » et reçoit un code à 4 chiffres ; les invités le tapent (ou scannent le QR code, ou ouvrent le lien `#coop=<code>`) et arrivent tout seuls, plusieurs à la fois. Le relais ne fait passer que l'offre et les réponses WebRTC (les mêmes codes SDP qu'en mode manuel), puis l'invité le quitte ; l'hôte garde sa salle ouverte tant que la partie existe, et la reprend sous le même code après une coupure. Sans relais, ou relais injoignable, la connexion par QR codes reste disponible. Protections : variable `ORIGINES` du Worker (sites autorisés), frein des codes faux par adresse IP (20 en 10 minutes), et côté hôte Retirer (message `kick`), Nouveau code, Fermer l'accès. Pour les tests, `localStorage['crypte-relay']` remplace l'adresse (`off` : aucun relais) ; `node tools/tests/relais-local.mjs` lance un relais local (même logique, `relais/src/salle.js`).
