# Étape 5 — Effets de particules : montée en puissance

> Lire d'abord `SPEC.md`. Prérequis : étapes 1, 2 et 4 (héros et ambiance en place).

## Objectif

Rendre la progression **visible** à deux niveaux :
1. **Le moment du level-up** : une explosion d'effets courte (environ 1,5 s) et spectaculaire.
2. **La puissance permanente** : une aura autour du héros qui **évolue par paliers** de niveau. Un joueur haut niveau doit se reconnaître d'un coup d'œil.

## Direction artistique

Feu d'âme et magie noire plutôt que paillettes dorées :
- couleurs **froides et surnaturelles** (cyan spectral, violet), avec de l'or pâle réservé aux plus hauts paliers ;
- matériaux **additifs** (`blend_mode = ADD`) et **unshaded**, qui ressortent naturellement sur l'ambiance sombre de l'étape 4 ;
- mouvement **ascendant** (braises et âmes qui s'élèvent), pour traduire visuellement l'idée de « monter ».

## 5.1 Effet de level-up (one-shot)

Scène `scenes/vfx/level_up_vfx.tscn`, instanciée sur le héros puis libérée à la fin. Elle se compose de couches synchronisées par un `AnimationPlayer` ou un `Tween` :

| t (s) | Couche | Détail |
|---|---|---|
| 0.00 | **Anticipation** | 20–30 particules **aspirées vers le héros** (vitesse radiale négative), sur 0,3 s |
| 0.30 | **Flash** | `OmniLight3D` temporaire (énergie 0 → 4 → 0 en 0,4 s, couleur du palier) + pic d'`intensity` sur la vignette (étape 4) |
| 0.30 | **Onde de choc** | anneau au sol : un `MeshInstance3D` plan avec un shader d'anneau qui s'agrandit et s'efface (0,5 s) |
| 0.30 | **Pilier** | colonne de lumière verticale (cylindre additif sans fond) qui monte puis s'estompe |
| 0.30 | **Explosion** | 40–60 étincelles projetées vers l'extérieur et le haut, avec gravité légère |
| 0.40 → 1.5 | **Âmes** | 15–20 volutes qui montent lentement en spirale (`orbit_velocity`) |
| 0.30 | **Juice** | léger tremblement de caméra (≤ 0,15 s), petit *hitstop* de 0,05 s, et un son |

- API : `func play(tier_color: Color) -> void`, plus un signal `finished`.
- Le héros reste **contrôlable** pendant l'effet : rien ne doit bloquer le gameplay.

## 5.2 Aura de puissance (permanente, par palier)

Scène `scenes/vfx/power_aura.tscn`, enfant du héros. Elle est configurée par des ressources `AuraTier` :

```gdscript
class_name AuraTier extends Resource
@export var min_level: int
@export var color: Color
@export var ember_amount: int        # braises qui montent
@export var wisps_enabled: bool      # volutes en orbite
@export var ground_runes: bool       # cercle de runes au sol
@export var weapon_trail: bool       # traînée sur l'arme
```

Paliers par défaut (à rendre configurables) :

| Palier | Niveaux | Rendu |
|---|---|---|
| 0 | 1–4 | aucune aura |
| 1 | 5–9 | quelques braises grises et bleutées discrètes aux pieds |
| 2 | 10–19 | braises cyan plus nombreuses, plus quelques volutes en orbite |
| 3 | 20–29 | aura violette, volutes, **cercle de runes** qui tourne lentement au sol |
| 4 | 30+ | feu d'âme or pâle et violet, traînée sur l'arme, runes pulsées |

- `func set_level(level: int) -> void` choisit le palier et fait une **transition douce** (fondu de l'`amount` et de la couleur sur environ 1 s), pas de saut brutal.
- Le changement de palier déclenche une version **renforcée** de l'effet 5.1 (plus de particules, plus de flash).

## 5.3 Branchement

- Créer un nœud `scripts/player_stats.gd` avec `level: int` et un signal `leveled_up(new_level: int)`.
- `level_up_vfx` et `power_aura` écoutent ce signal. Aucun appel direct depuis le gameplay.
- La scène `scenes/tests/test_level_up.tscn` contient le héros dans le village, avec des boutons **+1 niveau**, **+10 niveaux** et **Reset**, et l'affichage du niveau et du palier.

## 5.4 Contraintes mobile

- Utiliser **`CPUParticles3D`** par défaut, qui fonctionne partout, y compris avec le renderer Compatibility et l'export Web. Passer à `GPUParticles3D` seulement si un profilage le justifie.
- Budget : **≤ 150 particules actives** pendant le level-up, et **≤ 60** pour l'aura permanente du palier maximal.
- Textures de particules **petites** (64–128 px), en niveaux de gris, teintées par `color`. Un seul atlas pour tous les effets.
- Billboard simple, pas d'ombres, pas de lumière par particule. Une seule `OmniLight3D` temporaire, pendant le flash uniquement.
- Lier au preset graphique (étape 4) :
  - **LOW** : quantités × 0,4, pas de volutes, pas de runes animées ;
  - **MEDIUM** : quantités × 0,7 ;
  - **HIGH** : quantités × 1.
- Pas d'allocation dans `_process`. Réutiliser l'instance de `level_up_vfx` (pool d'une instance) plutôt que de l'instancier à chaque niveau.

## Critères d'acceptation

- [ ] Dans `test_level_up.tscn`, cliquer sur **+1** joue l'effet complet, lisible et synchronisé.
- [ ] Les 5 paliers sont clairement distinguables sur une capture **en petite taille** (simulation d'un écran de téléphone).
- [ ] Les transitions entre paliers sont progressives.
- [ ] Spammer **+1** ne fait pas chuter le framerate et ne cumule pas d'instances. Vérifier le nombre de nœuds dans *Debugger > Monitors*.
- [ ] 30 FPS maintenus en MEDIUM pendant l'effet sur l'appareil de test.
- [ ] Le rendu est correct avec le renderer Mobile **et** avec Compatibility.
