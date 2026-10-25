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

## Tester en local
`python3 -m http.server 8000` dans ce dossier, puis http://localhost:8000. Adresses de test : `#test` (invincible, rapide), `#test2d` (idem en rendu Canvas), `#rapide` (manches courtes).

## Installer sur téléphone
Android (Chrome) : menu ⋮ → « Installer l'application ». iPhone (Safari) : Partager → « Sur l'écran d'accueil ».

## Sauvegarde
Progression dans le stockage du navigateur (`crypte-meta`), réglages dans `crypte-set`. Camp → Forge → Sauvegarde pour exporter ou importer en JSON.
