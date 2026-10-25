# SPEC — Jeu mobile 3D dark fantasy (Godot 4)

> Spec principale. À fournir à l'IA **avec** la sous-spec de l'étape en cours (`specs/0X-*.md`).
> Traiter **une sous-spec à la fois**, dans l'ordre, et valider ses critères d'acceptation avant de passer à la suivante.

## 1. Contexte

- **Moteur** : Godot 4 (version stable ≥ 4.3), scripts en **GDScript** typé.
- **Cible** : smartphones Android et iOS, milieu de gamme.
- **Style** : dark fantasy low-poly, basé sur les assets Quaternius (style unifié).
- **Renderer** : `Mobile` par défaut. `Compatibility` doit rester possible en repli pour l'entrée de gamme.

## 2. Assets utilisés

| Rôle | Pack | Licence | Animé |
|---|---|---|---|
| Héros (tenues modulaires) | Modular Character Outfits – Fantasy | CC0 | Non |
| Corps et têtes | Universal Base Characters | CC0 | Non |
| Animations partagées | Universal Animation Library | CC0 | — |
| Monstres | Bestiary – Dungeon Monsters Kit | **QAL** (à vérifier avant publication) | Non |
| Props | Fantasy Props MegaKit | CC0 | — |
| Environnement | Medieval Village MegaKit (modulaire, sur grille) | CC0 | — |

Tous les personnages et monstres utilisent un **rig Humanoid**. Les animations sont donc partagées par retargeting.

## 3. Règles pour l'IA

1. **Ne jamais deviner** les noms de nœuds, d'os, de meshes ou d'animations. Il faut d'abord inspecter les fichiers importés (arbre de scène, `.import`, liste des animations), puis adapter le code.
2. **Ne jamais modifier** les fichiers sources dans `assets/`. Toute personnalisation passe par des scènes héritées, des réglages d'import ou des scripts.
3. Utiliser du GDScript typé (`var x: int`, `-> void`), des `@export` pour tout réglage utile aux designers, et des signaux plutôt que des références directes entre systèmes.
4. Chaque système doit avoir une **scène de test** dans `scenes/tests/` qui permet de le vérifier isolément.
5. Toute hypothèse non vérifiable (taille de cellule, nom d'os…) doit être signalée en commentaire `# HYPOTHÈSE:` et dans le résumé de fin d'étape.
6. Il faut avoir la performance mobile en tête à chaque choix (voir §5).

## 4. Arborescence cible

```
res://
├── assets/quaternius/
│   ├── base_characters/
│   ├── outfits/
│   ├── animations/
│   ├── monsters/
│   ├── props/
│   └── village/
├── resources/          # BoneMap, AnimationLibrary, MeshLibrary, Environment, matériaux
├── scenes/
│   ├── characters/     # héros
│   ├── monsters/
│   ├── levels/
│   ├── ui/             # overlay vignette, HUD
│   └── tests/          # une scène de test par système
├── scripts/
└── shaders/
    └── vignette.gdshader   # déjà fourni
```

## 5. Budgets de performance (objectifs)

- **30 FPS stables** sur un milieu de gamme, et 60 FPS visés si possible.
- Moins de **150 draw calls** et moins de **100k triangles** visibles par image.
- Textures compressées en **VRAM (ETC2/ASTC)**, à 1024 px maximum.
- **8 lumières omni maximum** par mesh (limite du renderer Mobile). Les torches n'ont pas d'ombres.
- Pas de SSAO, de SSR, de SDFGI ni de brouillard volumétrique (non supportés ou trop coûteux sur mobile).

## 6. Étapes

| # | Sous-spec | Résultat |
|---|---|---|
| 1 | `specs/01-import-animations.md` | Assets importés, animations partagées héros et monstres |
| 2 | `specs/02-personnage-modulaire.md` | Héros équipable par slots |
| 3 | `specs/03-niveau-gridmap.md` | Village construit en GridMap, avec collisions |
| 4 | `specs/04-ambiance-rendu.md` | Éclairage, brouillard, post-process, vignette |
| 5 | `specs/05-particules-niveau.md` | Effet de level-up et aura de puissance par paliers |

**Hors périmètre** (specs futures) : contrôles tactiles, caméra de jeu, combat, IA des ennemis, HUD, sauvegarde.

## 7. Format de fin d'étape attendu

À la fin de chaque étape, l'IA fournit :
- la liste des fichiers créés ou modifiés ;
- les réglages faits dans l'éditeur que le code ne peut pas faire lui-même, sous forme d'étapes manuelles numérotées ;
- les hypothèses (`# HYPOTHÈSE:`) restant à vérifier ;
- le résultat de chaque critère d'acceptation.
