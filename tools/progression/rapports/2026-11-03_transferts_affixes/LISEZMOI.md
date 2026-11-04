# Transferts d'affixes au banc (3 novembre 2026, v154)

`comparaison.html` : page autonome à ouvrir dans le navigateur. Carrières simulées de 8 h par héros, 5 graines (1 à 5), sans transfert (`xf0`) et avec transferts orientés (`xf1`, `--xf 1`).

Stratégie du bot avec `--xf 1` (`SIM.affixPass` dans `tools/progression/career.js`) : affixe prise sur un objet à recycler ou une arme qu'aucun héros ne porte, posée sur l'équipement porté ; build visé (dégâts critiques, dégâts, critique jusqu'à 75 %, dégâts des statuts si les mods posent des statuts, projectiles et transpercement pour l'Archer, survie après une mort) ; sans perte de survie ; essence réservée d'abord au prochain rang des mods portés, puis un quart au plus par passage au Camp.

Résultat à 8 h (moyennes, avec transferts par rapport à sans) : dégâts par seconde +90 % (Guerrier), +91 % (Archer), +29 % (Magicien) ; morts inchangées ; même palier atteint.

Régénérer la page depuis les carrières :

    node tools/progression/compare.mjs tools/progression/rapports/2026-11-03_transferts_affixes/carrieres --out tools/progression/rapports/2026-11-03_transferts_affixes/comparaison.html
