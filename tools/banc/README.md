# Banc de mission

Le banc fait jouer des missions entières au bot du banc de progression (`tools/progression/bot.js`), dans Chromium sans affichage, pour mesurer l'équilibrage **avant** de changer une valeur du jeu. C'est lui qui a servi à régler la v146 (horloge de mission, cryopode, Gardiens, élites, bonus additionnés).

Il faut Playwright, comme pour les tests (`npm i playwright && npx playwright install chromium`).

## Contenu

| Fichier | Rôle |
| --- | --- |
| `mission.mjs` | Joue une mission (Survie, Défense ou Capture) et ajoute une ligne JSON par partie au fichier de sortie |
| `resume.py` | Résume un ou plusieurs fichiers de sortie |
| `etats/` | Fins de carrière du banc de la v143 (`archer_2`, `guerrier_1`, `magicien_1`) : méta (progression, mods, familiers) et équipement du bot au niveau 30 |
| `builds/` | Équipements choisis pour chaque héros : `<héros>30.json` et `<héros>50.json`, avec les builds `raw` (objets des reliques au mieux, tirages au maximum) et `forge` (Forge au mieux). Ceux du niveau 50 ont été optimisés avec les bonus sous condition additionnés (règle de la v146) |

## Lancer

Depuis la racine du dépôt :

```
node tools/banc/mission.mjs . <état> <builds> <build> <niveau> "<d:t,…>" <parties> <sortie.jsonl> ['<réglages BAL>'] [étiquette] [survie|defense|capture]
```

- `<build>` : `bot` (l'équipement du bot dans l'état), `raw` ou `forge` (pris dans le fichier de builds).
- `"<d:t,…>"` : difficulté et palier de Tourment, par exemple `"0:1"` (Normal), `"3:1"` (Tourment I), `"3:10"` (Tourment X) ; plusieurs séparés par des virgules.
- `<parties>` : nombre de parties par palier (graines 4242, 4259, 4276…). Le jeu est déterministe à graine égale.
- `<réglages BAL>` : valeurs injectées dans `BAL` (`window.BAL_OVERRIDE`), par exemple `'{"tormBossHp":2}'`. Pour essayer une règle qui n'est pas dans `BAL`, la mettre d'abord derrière un réglage dans une copie du site, puis lancer le banc sur cette copie (premier argument).

Variables d'environnement :

- `POD_R=50` : en Défense, le bot revient vers le cryopode quand il s'en éloigne de plus de 50 px (260 par défaut ; 50 donne de meilleurs résultats).
- `POD_IMM=1` : en Défense, le cryopode ne meurt pas ; on mesure les dégâts qu'il aurait reçus vague par vague (champ `waves`), et `resume.py` rejoue sa vraie vie. À utiliser avec `FORCE_N`.
- `FORCE_N=4` : nombre de manches jouées sans sortir (4 manches = 12 vagues en Défense).
- `POD_SRC=1` : origine des dégâts au cryopode (coups, tirs, flaques).
- `MAXT=600` : secondes de jeu au plus (utile en Capture : le bot ne capture pas, il tient face aux monstres).

Exemples (ceux des essais du 29 octobre 2026) :

```
# Survie, bot au niveau 30, Tourment I et X, 3 parties
node tools/banc/mission.mjs . tools/banc/etats/guerrier_1_etat.json tools/banc/builds/gue30.json bot 30 "3:1,3:10" 3 sortie.jsonl '{}' v146 survie
# Défense sur 12 vagues, très bon équipement au niveau 50, Tourment X, cryopode immortel
POD_IMM=1 FORCE_N=4 POD_R=50 node tools/banc/mission.mjs . tools/banc/etats/magicien_1_etat.json tools/banc/builds/mag50.json raw 50 "3:10" 3 sortie.jsonl '{}' v146 defense
python3 tools/banc/resume.py sortie.jsonl
```

Une partie de Survie prend environ 30 s, une Défense de 12 vagues 10 à 60 s. Deux lots en parallèle par cœur au plus.

## Repères mesurés en v146

- Survie, bot niveau 30 : Tourment I sans mort ; Tourment X, l'Archer meurt dans la première manche (déjà en v145).
- Défense, 12 vagues : le bot niveau 30 en Tourment I va jusqu'à la vague 11 en médiane ; le très bon équipement niveau 50 en Tourment X tient les 12 vagues.
- Très bon équipement niveau 50, Tourment X : jamais sous 95 % de vie en Survie, Gardien tué en 3 s environ.
