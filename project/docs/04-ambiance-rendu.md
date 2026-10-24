# Étape 4 — Ambiance dark fantasy et rendu mobile

> Lire d'abord `SPEC.md`. Prérequis : étape 3 (un niveau à éclairer).

## Objectif

Transformer le village Quaternius, plutôt coloré à l'origine, en lieu **sombre, froid et oppressant**, éclairé par des torches, tout en restant dans les budgets mobiles.

## Direction artistique

- Base **froide et désaturée** (bleu-gris, violet sombre).
- Accents **chauds** uniquement sur les sources de lumière (torches, braseros, fenêtres).
- Lisibilité d'abord : le héros et les ennemis doivent rester visibles sur un petit écran.

## Tâches

### 4.1 Environment
Créer `resources/dark_env.tres` (`Environment`), utilisé par un `WorldEnvironment` dans le niveau :
- **Background** : ciel procédural sombre (`ProceduralSkyMaterial`), avec un horizon violet-gris et un sol presque noir.
- **Ambient light** : couleur bleu-gris, énergie faible (≈ 0.2–0.4).
- **Tonemap** : `ACES` (ou `Filmic`), exposition ajustée.
- **Fog** : brouillard classique (en profondeur), teinte bleu nuit, densité modérée. **Pas de brouillard volumétrique** (non supporté par le renderer Mobile).
- **Glow** : activé, avec un seuil (`hdr_threshold`) réglé pour que **seules** les flammes brillent.
- **Adjustments** : saturation ≈ 0.6–0.8, contraste légèrement augmenté.
- Interdit : SSAO, SSR, SSIL, SDFGI.

### 4.2 Lumières
- `DirectionalLight3D` (lune) : bleutée, énergie faible.
  - Ombres activées, `directional_shadow_mode = PSSM 2 Splits`, `directional_shadow_max_distance` ≈ 20–30 m.
- Scène réutilisable `scenes/props/torch.tscn` :
  - mesh de torche du Fantasy Props MegaKit ;
  - `OmniLight3D` orange, avec `omni_range` ≈ 4–6 m et **sans ombres** ;
  - scintillement léger par script (variation de `light_energy` par bruit, **sans** allocation à chaque image) ;
  - `@export var flicker: bool = true`.
- Respecter la limite de **8 omni par mesh**. Signaler les zones où trop de torches se recouvrent.

### 4.3 Vignette (shader fourni)
- Le shader existe déjà : `res://shaders/vignette.gdshader` (uniforms `intensity`, `radius`, `softness`, `vignette_color`).
- Créer `scenes/ui/vignette_overlay.tscn` :
  - `CanvasLayer` (`layer = 10`) contenant un `ColorRect` en ancrage *Full Rect* ;
  - **`mouse_filter = MOUSE_FILTER_IGNORE`** : obligatoire, sinon le tactile est bloqué ;
  - un `ShaderMaterial` qui utilise le shader.
- Exposer sur la racine `@export var intensity: float` qui met à jour l'uniform, pour pouvoir assombrir l'écran quand le héros est blessé plus tard.

### 4.4 Lisibilité
- Ajouter une petite `OmniLight3D` sans ombres qui suit le héros (énergie faible), ou un léger effet rim dans un matériau dérivé, pour qu'il ne disparaisse jamais dans le noir.
- Utiliser les **variantes de couleur les plus sombres** des monstres par défaut.

### 4.5 Qualité ajustable
`scripts/graphics_settings.gd` (autoload) avec 3 presets `LOW / MEDIUM / HIGH`, qui agissent sur :
- les ombres de la lune (désactivées en LOW) ;
- le glow (désactivé en LOW) ;
- le scintillement des torches (désactivé en LOW) ;
- `scaling_3d_scale` (0.7 / 0.85 / 1.0).

## Critères d'acceptation

- [ ] `village_demo.tscn` a une ambiance nocturne dark fantasy. Comparer des captures avant et après dans `docs/`.
- [ ] Le héros reste lisible partout dans le village.
- [ ] La vignette s'affiche en portrait comme en paysage et **ne bloque pas les touches**.
- [ ] Le jeu tient 30 FPS sur l'appareil de test en preset MEDIUM.
- [ ] Le changement de preset en jeu fonctionne sans redémarrer.
- [ ] Aucun effet non supporté par le renderer Mobile n'est activé.
