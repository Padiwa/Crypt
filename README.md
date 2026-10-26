# Crypte des Cendres

Action-RPG de crypte en hordes, jouable au pouce sur mobile et au clavier. Site statique, servi tel quel par GitHub Pages (aucune étape de build), installable en PWA.

## Structure
| Fichier | Rôle |
| --- | --- |
| `index.html` | Interface (HUD, écrans, Camp, Réglages) et ordre de chargement des scripts |
| `css/game.css` | Styles, design system « Crypte » (tokens + composants `cx-`) |
| `js/data.js` | Constantes, classes, armes, reliques, mods, affixes, sauvegarde `meta` |
| `js/game.js` | État de partie, ennemis, combat, apparitions, butin, mise à jour |
| `js/render.js` | Rendu Canvas 2D, rendu WebGL (PixiJS 7.4.2) et HUD |
| `js/ui.js` | Fiches d'objets, Pause, bonus de niveau, Mods, fin de mission |
| `js/camp.js` | Le Camp (Héros, Armurerie, Reliques, Mods, Affixes, Forge), sauvegarde JSON |
| `js/inv.js` | Coffre de l'Armurerie, fiche d'objet ancrée, recyclage |
| `js/fuse.js` | Fusion de rang (armes et équipements) |
| `js/seal.js` | Forge › Affixes (Source / Cible, sceaux) |
| `js/pet.js` | Familiers |
| `js/tut.js` | Parcours du joueur nouveau |
| `js/net.js` | Coopération à deux (WebRTC) |
| `js/update.js` | Détection des nouvelles versions |
| `js/nav.js` | Navigation clavier et manette dans les menus |
| `aide/` | Guide du joueur |
| `tools/tests/` | Suite de tests automatiques |
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

## Tester en local
`python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000. Adresses de test : `#test` (invincible, rapide), `#test2d` (idem en rendu Canvas), `#rapide` (manches courtes).

## Tests
Une suite unique vérifie le jeu dans un vrai navigateur (Chromium sans affichage) : démarrage, butin, reliques, fabrication et fusion, coffre, affixes, emplacements, missions, contrôles, sauvegarde, parcours, coopération.
```
npm i playwright && npx playwright install chromium
node tools/tests/run.mjs            # tout (≈ 45 s)
node tools/tests/run.mjs --quick    # sans la coopération
node tools/tests/run.mjs fusion     # seulement les tests dont le nom contient « fusion »
```
Chaque fichier de `tools/tests/suites/` exporte une liste `tests`. Toute erreur JavaScript dans la page fait échouer le test. **À lancer avant chaque nouvelle version** : la commande sort en erreur si un test échoue.

## Installer sur téléphone
Android (Chrome) : menu ⋮ → « Installer l'application ». iPhone (Safari) : Partager → « Sur l'écran d'accueil ».

## Sauvegarde
Progression dans le stockage du navigateur (`crypte-meta`), réglages dans `crypte-set`. Camp → Forge → Sauvegarde pour exporter ou importer en JSON.

## Banc d'essai d'équilibrage
`tools/sim/` lance de vraies parties sans affichage, pilotées par un bot (esquive, compétences, potions, bonus de niveau), avec des profils d'équipement T0 à T4.
```
npm i playwright && npx playwright install chromium
node tools/sim/run.mjs tools/sim/exemple.json resultats.json
```
Chaque entrée du JSON : `{"cls":"archer","tier":3,"level":30,"diff":3,"torm":1,"rounds":1}`. Sortie : survie, durée, ennemis tués, dégâts subis par seconde, or, objets par rareté, niveau de héros.


## Coopération

`js/net.js` relie deux appareils en pair à pair (WebRTC, canal de données) sans serveur : les codes d'offre et de réponse (SDP compressé) s'échangent par QR code ou copier-coller. L'hôte simule les monstres et envoie un instantané 20 fois par seconde ; chaque joueur simule son héros, ses tirs (coups envoyés à l'hôte) et son propre butin. Le QR code utilise `qrcode-generator` (jsDelivr), chargé seulement à l'ouverture de l'écran Coopération. Fonctionne sur GitHub Pages (https) ; même réseau conseillé (un serveur STUN public est aussi indiqué).
