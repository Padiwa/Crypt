# Étape 2 — Héros modulaire équipable

> Lire d'abord `SPEC.md`. Prérequis : étape 1 validée.

## Objectif

Un héros construit sur un **Universal Base Character**, dont l'apparence se change par **slots d'équipement** à partir des 62 pièces du pack Modular Character Outfits – Fantasy.

## Analyse préalable (obligatoire)

Avant de coder, inspecter les fichiers de tenues et documenter dans `scenes/characters/OUTFITS.md` :
- la structure : une pièce par fichier, ou plusieurs meshes par fichier ;
- le nom exact de chaque pièce et la manière de déduire son slot (préfixe, dossier…) ;
- le nom du `Skeleton3D` et si les noms d'os sont identiques à ceux du corps de base ;
- les 3 variantes de texture par tenue (matériaux distincts ou textures à échanger).

## Conception

### Données
- `scripts/equipment_part.gd` : `class_name EquipmentPart extends Resource`, avec :
  - `id: StringName` ;
  - `slot: Slot` (enum : `HEAD`, `TORSO`, `ARMS`, `LEGS`, `FEET`, `ACCESSORY`, à ajuster selon l'analyse) ;
  - `scene: PackedScene` (ou chemin du mesh) ;
  - `variants: Array[Material]`.
- Un fichier `.tres` par pièce dans `resources/equipment/`, généré si possible par un **script d'éditeur** (`@tool`) qui parcourt le dossier des tenues.

### Composant
`scripts/modular_character.gd` (sur la racine du héros) :
```gdscript
signal equipment_changed(slot: EquipmentPart.Slot, part: EquipmentPart)

func equip(part: EquipmentPart, variant: int = 0) -> void
func unequip(slot: EquipmentPart.Slot) -> void
func get_equipped(slot: EquipmentPart.Slot) -> EquipmentPart
```

**Règle technique** : une pièce équipée doit être un `MeshInstance3D` **enfant du `Skeleton3D` du héros**, avec `skeleton = NodePath("..")`. Il faut l'instancier, extraire le mesh, le reparenter sur le squelette du héros, puis libérer le reste de la scène. Si les noms d'os ne correspondent pas, s'arrêter et le signaler plutôt que de bricoler.

- Équiper une pièce remplace celle du même slot.
- Les parties du corps de base cachées par une pièce (le torse sous une armure, par exemple) doivent être masquées pour éviter que le corps traverse la tenue. Ce comportement est configurable par pièce avec `hides_body_parts: PackedStringArray`.
- Un `@export var default_loadout: Array[EquipmentPart]` est appliqué au `_ready()`.

### Performance
- Partager les matériaux entre instances : ne pas dupliquer un matériau sans raison.
- Équiper en jeu ne doit pas provoquer de saccade visible. Précharger les `PackedScene` du loadout.

## Critères d'acceptation

- [ ] `scenes/tests/test_equipment.tscn` contient le héros et une UI simple : un bouton par slot pour faire défiler les pièces, et un bouton pour changer de variante de couleur.
- [ ] Le héros garde ses animations (étape 1) avec n'importe quelle combinaison de pièces : les pièces suivent le squelette.
- [ ] Aucun morceau du corps ne traverse visiblement une tenue sur idle et marche.
- [ ] Le signal `equipment_changed` est émis à chaque changement.
- [ ] `OUTFITS.md` documente la structure réelle du pack.
