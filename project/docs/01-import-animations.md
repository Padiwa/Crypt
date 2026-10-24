# Étape 1 — Import des assets et animations partagées

> Lire d'abord `SPEC.md`.

## Objectif

Importer tous les packs, puis faire en sorte que **le héros et les monstres jouent les mêmes animations** de la Universal Animation Library, par retargeting Humanoid.

## Tâches

### 1.1 Réglages du projet
- Choisir le renderer : `Project Settings > Rendering > Renderer > Rendering Method = mobile`.
- Activer `Rendering > Textures > VRAM Compression > Import ETC2 ASTC = true`.
- Ranger les fichiers `.glb` / `.gltf` selon l'arborescence de `SPEC.md` §4.

### 1.2 BoneMap Humanoid commun
- Créer **une** ressource `resources/humanoid_bonemap.tres` (type `BoneMap`) basée sur le profil `SkeletonProfileHumanoid`.
- L'appliquer dans l'import (`Advanced Import Settings > Skeleton3D > Retarget > Bone Map`) de :
  - chaque Universal Base Character ;
  - chaque fichier de tenue ;
  - chaque monstre du Bestiary ;
  - le fichier de la Universal Animation Library.
- Garder les options **Rest Fixer** par défaut. Ne les ajuster que si on observe des pieds qui glissent ou des membres tordus.
- Vérifier qu'**aucun os requis** du profil ne reste non assigné. Si les noms d'os diffèrent entre packs, créer une BoneMap par pack plutôt que de forcer.

### 1.3 Bibliothèque d'animations
- Importer le fichier d'animations avec `Import As = Animation Library`.
- L'enregistrer comme `resources/anim_library.res` (ou la ressource générée par l'import).
- **Lister toutes les animations** disponibles avec leur nom exact, dans `resources/ANIMATIONS.md`.
- Marquer en boucle (`loop_mode = LINEAR`) les animations cycliques : idle, marche, course.

### 1.4 Scènes héritées
- Pour chaque monstre, créer une scène héritée dans `scenes/monsters/<nom>.tscn`, avec à la racine un `CharacterBody3D` qui contient le modèle.
- Ajouter un `AnimationPlayer` qui charge la bibliothèque (`libraries["ual"] = anim_library`). Si un `AnimationPlayer` existe déjà, l'utiliser.
- Ajouter un script commun `scripts/anim_actor.gd` qui expose :
  ```gdscript
  func play_anim(anim_name: StringName, blend: float = 0.15) -> void
  ```
  Ce script vérifie que l'animation existe et affiche un `push_warning` sinon.

## Critères d'acceptation

- [ ] `scenes/tests/test_animations.tscn` montre le héros (corps de base) et **tous les monstres** côte à côte, qui jouent la **même** animation.
- [ ] Un `OptionButton` dans la scène de test permet de changer l'animation jouée par tous les modèles.
- [ ] Aucun membre tordu ni pied qui glisse de façon visible sur les animations idle, marche, course et attaque.
- [ ] `resources/ANIMATIONS.md` liste les animations avec leurs noms exacts.
- [ ] Aucune erreur ni warning d'import dans la console.
