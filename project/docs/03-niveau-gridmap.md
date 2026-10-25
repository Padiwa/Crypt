# Étape 3 — Niveau : village en GridMap

> Lire d'abord `SPEC.md`. Peut être fait en parallèle de l'étape 2.

## Objectif

Construire un village dark fantasy avec le **Medieval Village MegaKit** (pièces modulaires alignées sur une grille) dans un `GridMap`, avec des collisions, puis l'habiller avec le **Fantasy Props MegaKit**.

## Tâches

### 3.1 Mesurer la grille
- Inspecter les pièces de mur et de sol et **mesurer leur taille réelle** (AABB du mesh).
- En déduire `cell_size` (par exemple `Vector3(2, 2, 2)` : **à vérifier**, ne pas supposer) et le centrage (`cell_center_x/y/z`).
- Documenter la valeur retenue dans `resources/GRID.md`.

### 3.2 MeshLibrary
- Créer `scenes/levels/village_library_source.tscn` : un `MeshInstance3D` par pièce du village, chacun à l'origine.
- **Collisions** : la version gratuite n'en fournit pas. Pour chaque pièce, ajouter un `StaticBody3D` avec une forme :
  - murs et sols : `BoxShape3D` ou `ConvexPolygonShape3D` (préférées pour leur coût) ;
  - formes complexes (escaliers, arches) : `ConcavePolygonShape3D` (trimesh) seulement si nécessaire.
- Automatiser cette étape avec un script `@tool` (`scripts/tools/build_village_library.gd`) qui génère la scène source à partir du dossier `assets/quaternius/village/`.
- Exporter la bibliothèque dans `resources/village_meshlib.tres` (avec `Scene > Export As > MeshLibrary`, ou depuis le script avec `MeshLibrary` + `ResourceSaver`).

### 3.3 Niveau de démo
- Créer `scenes/levels/village_demo.tscn` contenant :
  - un `GridMap` qui utilise `village_meshlib.tres` : une place centrale, 3 à 4 maisons, une ruelle, un escalier ;
  - un nœud `Props` (`Node3D`) avec les props du Fantasy Props MegaKit, placés à la main : coffres, tonneaux, étals, torches, armes ;
  - un `NavigationRegion3D` qui englobe le sol, avec une navmesh cuite pour les futurs ennemis ;
  - un `Marker3D` nommé `PlayerSpawn`, et quelques `Marker3D` dans un groupe `monster_spawn`.

### 3.4 Optimisation
- Les props statiques n'ont pas de script. Ceux qui sont répétés en grand nombre (tonneaux, caisses) passent par un `MultiMeshInstance3D` s'il y en a plus de 20.
- Les 200 props partagent 4 jeux de textures : **conserver ce partage**, sans dupliquer les matériaux.
- Régler `visibility_range_end` sur les petits props (environ 25–40 m selon la caméra).

## Critères d'acceptation

- [ ] Le héros (étape 1 ou 2) peut se déplacer dans le village sans traverser les murs ni tomber à travers le sol (utiliser un contrôleur de test minimal au clavier, dans `scenes/tests/`).
- [ ] Les pièces s'emboîtent sans trou ni chevauchement visible.
- [ ] La navmesh couvre les zones praticables.
- [ ] Moins de 150 draw calls dans la vue la plus chargée (vérifié avec le moniteur *Debugger > Monitors*).
- [ ] La valeur de `cell_size` est documentée et justifiée.
