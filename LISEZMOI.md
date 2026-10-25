# Crypte des Cendres — version PWA

Ce dossier est le jeu prêt à être installé comme une application (plein écran, icône sur l'écran d'accueil, jouable hors ligne).

## Contenu
- `index.html` : le jeu.
- `manifest.webmanifest` : nom, icônes, couleurs, plein écran portrait.
- `sw.js` : met le jeu en cache pour qu'il marche sans réseau.
- `icons/` : icônes 192, 512, « maskable » (Android) et Apple.

## Mettre en ligne (gratuit)
Une PWA doit être servie en **HTTPS** depuis sa propre adresse.

**GitHub Pages**
1. Crée un dépôt (ex. `crypte`) et envoie-y le contenu de ce dossier à la racine.
2. Réglages du dépôt → Pages → Source : branche `main`, dossier `/ (root)`.
3. L'adresse est `https://<ton-compte>.github.io/crypte/`.

**Netlify** : glisse ce dossier sur app.netlify.com/drop. **Cloudflare Pages** : « Upload assets » avec ce dossier.

## Installer sur le téléphone
- **Android (Chrome)** : ouvre l'adresse, menu ⋮ → « Installer l'application ».
- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil ».

## Mettre à jour le jeu
Remplace `index.html` et change `VERSION` en haut de `sw.js` (ex. `crypte-v40`). Le jeu se met à jour au lancement suivant.

## Sauvegarde
La progression est stockée sur l'appareil, propre à cette adresse. Pour reprendre ta partie de l'artifact : Camp → Forge → Sauvegarde → **Exporter** (copier le JSON), puis dans la PWA → **Importer**.
