# Crypte des Cendres — specs

Oct 24, 2026 · @cms

## Vue d'ensemble

Crypte des Cendres est un prototype jouable de survivor-like mobile en vue de dessus, qui mélange les missions et reliques de Warframe avec le loot et les builds de Diablo. Il tourne dans le navigateur, sur téléphone (joystick tactile) comme sur ordinateur (clavier).

**Boucle de jeu**

1. Au Camp : choisir son héros, son équipement, ses mods et une relique à ouvrir.
2. Choisir une mission (Survie, Défense ou Capture) et un niveau de départ.
3. En mission : attaques automatiques, cristaux d'expérience, choix de bonus à chaque niveau, butin au sol.
4. Fin de manche : sortir avec le butin ou continuer plus fort.
5. Retour au Camp : fabriquer, améliorer, recycler, ouvrir des reliques.

| Élément | Valeur |
| --- | --- |
| Carte | 2 800 × 2 800 unités, caméra qui suit le héros |
| Manche de Survie | 3 min |
| Gardien (boss) | toutes les 60 s en Survie, 90 s en Capture, toutes les 5 vagues en Défense |
| Ennemis simultanés | jusqu'à 150 |
| Niveaux de mission | 1 à 50, au choix |

## Héros

Trois classes, chacune avec ses stats, sa compétence, ses armes et 3 talents permanents. Toutes ont une esquive (recharge 3 s, 0,2 s d'invulnérabilité) et des potions (rendent 45 % de la vie, 5 au maximum).

| Classe | Dégâts | Attaques / s | Vie | Critique | Armure | Vitesse | Attaque |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Archer | 8 | 1,80 | 100 | 5 % | 0 % | 220 | carreaux à distance, ×1,43 de délai en mouvement |
| Guerrier | 14 | 1,50 | 160 | 5 % | 15 % | −6 % | coup en arc de 155° au corps à corps (portée 95), même en marchant |
| Magicien | 12 | 1,25 | 85 | 8 % | 0 % | −2 % | orbes qui explosent (rayon 55), −10 % de recharge |

Les dégâts de base s'ajoutent à ceux de l'arme équipée. Dégâts critiques de base : 150 %.

| Classe | Compétence | Recharge | Effet |
| --- | --- | --- | --- |
| Archer | Volée | 7 s | 24 carreaux perforants dans toutes les directions |
| Guerrier | Tourbillon | 9 s | 1,6 s de rotation, coups dans un rayon de 130 toutes les 0,2 s, dégâts subis ÷ 2 |
| Magicien | Nova de givre | 7 s | dégâts dans un rayon de 175, ralentit 2,5 s, efface les projectiles ennemis |

| Classe | Talent (150 or) | Talent (300 or) | Talent (500 or) |
| --- | --- | --- | --- |
| Archer | Tir en course : pleine cadence en mouvement | Pas de l'ombre : 3 tirs critiques après une esquive | Ricochet : chaque carreau rebondit une fois |
| Guerrier | Charge brutale : l'esquive blesse et repousse | Soif de sang : +2 % de vie par ennemi tué | Onde de choc : un coup sur 4 frappe dans un rayon de 160 |
| Magicien | Sillage de givre : l'esquive laisse une explosion glacée | Barrière : bouclier de 25 % de la vie, recharge après 4 s | Chaîne d'éclairs : une orbe sur 4 foudroie 3 ennemis |

## Missions

Trois modes, tous avec un niveau de mission libre de 1 à 50, choisi sur l'écran d'accueil et une relique optionnelle à ouvrir.

| Mode | Objectif | Fin de manche | Récompense de manche | Échec |
| --- | --- | --- | --- | --- |
| Survie | tenir face aux hordes | toutes les 3 min : sortir ou continuer (niveau +1) | 1 relique | mort du héros |
| Défense | protéger le cryopode au centre (1 200 PV, dégâts reçus ×0,6) | toutes les 5 vagues : sortir ou continuer | 1 relique + 1 équipement magique ou mieux | cryopode détruit ou mort |
| Capture | mettre la cible à terre, rester 2,5 s à moins de 80 unités, rester 3 s dans la zone d'extraction (la jauge redescend si on en sort) | après 3 s passées dans la zone d'extraction | 1 relique + 60 or × niveau | mort du héros |

**Défense** : chaque vague compte 10 + 4 × vague (+8 par niveau au-delà du 1er) ennemis, 80 au maximum. 60 % des ennemis visent le cryopode. Pause de 4 s entre les vagues, le cryopode récupère 8 % ; 30 % quand on continue.

**Capture** : la cible (260 PV × difficulté) fuit quand le héros est à moins de 480 unités et se téléporte à 330 unités toutes les 4 à 6 s s'il est à moins de 260. Une flèche dorée indique sa direction et sa distance.

**Fissure (ouverture de reliques)** : les reliques ne s'ouvrent plus depuis l'inventaire. On équipe au Camp (onglet Reliques, ou bouton « Reliques équipées » de l'écran de départ) autant de reliques qu'on veut, dans l'ordre choisi (flèches ↑ ↓, Tout équiper, Tout retirer). Tant qu'il reste une relique à ouvrir, 18 % des ennemis sont corrompus (halo doré, +30 % de vie) et lâchent un réactif. 10 réactifs ouvrent la relique en cours, puis le compteur repart à 0 pour la suivante (« Relique 2/5 · 4/10 » en haut). À la réussite, chaque relique ouverte donne sa récompense et 25 essence. Les reliques non ouvertes, ou toutes en cas d'échec, ne sont pas consommées et restent équipées.

**Sortie et mort** : sortir garde tout le butin. Mourir garde la moitié de l'or ramassé, les mods et l'équipement déjà équipé ; les objets et reliques trouvés sont perdus.

**Biomes** (choix sur l'écran de départ, cumulé avec niveau et difficulté) : **Crypte des Cendres** (d'origine) et **❄ Abîmes gelés**. Abîmes gelés : sol de glace bleuté, piliers givrés, braseros à flamme bleue, neige qui tombe ; vie des monstres ×1,3, dégâts ×1,2, butin ×1,3. Nouvel ennemi **Revenant de givre** (26 PV, vitesse 108, 7 dégâts, remplace 65 % des groupes de goules) : son contact inflige **Gelure** 2,2 s (−38 % de vitesse de déplacement, réduite par l'Antidote, dissipée par les sources sacrées). La moitié des reliques trouvées y sont des reliques de givre.

**Affixes de givre** (uniquement sur les objets trouvés dans les Abîmes, 45 % en portent une d'office) : **Gel** (+4–8 % de chances d'immobiliser l'ennemi 1 s, plafond 40 %, pas sur les Gardiens), **Dégâts contre ralentis** (+12–22 % contre les ennemis ralentis ou gelés), **Éclats de glace** (6–12 % de chances qu'un ennemi tué éclate : 1,5 × dégâts dans un rayon de 85 et ralentissement, réaction en chaîne limitée à 3 niveaux, plafond 60 %). Les objets des Abîmes ont leurs propres noms (Pelisse givrée, Talisman de givre, Bottes fourrées, Anneau de givre…, légendaires Œil du Blizzard, Sceau du Zéro absolu…).

**Reliques de givre** : Éclat de givre (Cendre), Larme gelée (Ossuaire), Cœur d'hiver (Sanguine), Couronne du Blizzard (Abysse), qui contiennent les fragments des 4 **schémas Prime de givre** (800 or) : Manteau du Blizzard (armure 110, +60 vie, +25 % contre ralentis), Cœur de Givre (amulette, +8 % gel, +30 % dégâts critiques), Bottes de l'Avalanche (+8 % vitesse, 12 % éclats), Anneau du Zéro absolu (+30 % contre ralentis, +6 % critique).

**Difficulté** (écran de départ, en plus du niveau de mission) : Normal 1 Gardien toutes les 60 s ; Difficile 2 toutes les 45 s, butin et or +50 % ; Cauchemar 3 toutes les 35 s, +100 % ; Tourment avec 10 paliers I à X (sélecteur sous les chips) : palier t = 4 Gardiens (5 à partir de VI) toutes les max(16, 26 − t) s, butin et or +200 % + 50 % par palier au-delà du I (+650 % en X), vie des monstres × (1 + 0,35 t), dégâts × (1 + 0,18 t), valeurs d'affixes +5 % par palier, objets Ancestraux 0,4 % × t par objet (×3 sur les objets de Gardien et d'élite). En Capture l'intervalle est multiplié par 1,5 ; en Défense, le nombre de Gardiens s'applique aux vagues 5, 10, 15… La barre de boss cumule la vie de tous les Gardiens vivants.

**Élites** : chaque groupe d'ennemis (sauf chauves-souris) a une chance de compter une élite (2,5 % + 1,2 % par cran de difficulté + 1 % par palier de Tourment, plafond 15 %). Une élite a ×4 vie, ×1,25 taille, ×1,3 dégâts, un anneau coloré et son nom au-dessus d'elle, et un pouvoir : **Rapide** (×1,55 vitesse), **Bouclier** (−50 % de dégâts subis tant qu'elle a plus de la moitié de sa vie), **Vampire** (rend 10 % de sa vie à chaque coup porté), **Explosif** (laisse une zone de flammes de rayon 95 en mourant). Butin garanti : 1 objet magique ou mieux, 40 % d'un second, 30 % d'une relique, or ×5 et expérience ×6.

## Ennemis et difficulté

Les ennemis apparaissent hors écran autour du héros ; ceux qui s'éloignent trop sont replacés près de lui.

| Ennemi | Vie | Vitesse | Dégâts | Comportement | Arrive |
| --- | --- | --- | --- | --- | --- |
| Goule | 16 | 95 | 9 | fonce au contact, par groupes de 2 à 4 | dès le début |
| Chauve-souris | 6 | 165 | 5 | essaim de 5 à 8, trajectoire ondulante | après 20 s |
| Squelette archer | 13 | 85 | 8 | garde 220–330 de distance, tire toutes les 1,6–2,4 s, se rapproche sans ligne de tir | après 25 s |
| Brute | 70 | 66 | 18 | signal rouge puis charge (×1,4 dégâts) | après 50 s ou niveau 2 |
| Empoisonneur | 22 | 80 | 6 | garde 240–380 de distance, lance toutes les 3–4 s une fiole (cercle d'alerte 1 s) qui laisse une zone toxique de rayon 80 pendant 5 s | après 40 s ou niveau 2 |
| Pyromancien | 24 | 80 | 6 | même comportement, bombe qui laisse des flammes de rayon 70 pendant 3 s | après 60 s ou niveau 3 |
| Gelée | 34 → 15 → 7 | 72 → 86 → 104 | 8 | avance par sauts vers toi ; à moins de 170, signal rouge court (0,45 / 0,38 / 0,3 s selon la taille) puis bond de 150 (×1,4 dégâts au contact), toutes les 1,4–2,4 s, plus souvent pour les petites ; à sa mort se divise en 2 petites gelées projetées sur les côtés, qui se divisent à leur tour (3 tailles : 1 → 2 → 4, soit 7 ennemis à abattre). Chaque morceau compte comme un ennemi tué (XP, or, charge de l'ultime, butin réduit) ; seule la grande peut être corrompue | après 30 s ou niveau 2 |
| Gardien | 650 | 60 | 22 | anneaux de projectiles, charge 1 fois sur 3, invoque 3 goules toutes les 7 s sous 50 % de vie | sur minuterie |

**Équilibrage (passe 1, simulée)** : 300 parties de 3 min jouées par un bot, 3 classes × profils T0 (rien) à T4 (ancestral +100, prestige 60) × niveaux 1 à 50 × difficultés. Changements : vie des monstres × 1,025^(L−1) et dégâts × 1,012^(L−1) en plus de la croissance linéaire ; Tourment vie × (1 + 0,5 t), dégâts × (1 + 0,22 t) ; butin × (1 + 0,06 (L−1)) au lieu de 0,25 ; or × (1 + 0,15 (L−1)) au lieu de 0,6 ; bonus de difficulté : ×0,15 sur la quantité d'objets, ×0,5 sur l'or ; chances d'objet par monstre divisées par 2 ; Gardien : 1 objet de plus tous les 10 niveaux (au lieu de 3), 1 relique tous les 12 (au lieu de 4) ; légendaire plafonné à 9 % (+0,6 % par palier de Tourment), rare à 30 % ; affixes Dégâts +0,6 × niveau d'objet (au lieu de 1,2), Vie +2,5 × niveau (au lieu de 4) ; prestige n : 600 + 300 n + 15 n² or, 30 + 15 n + n²/2 essence ; Archer 115 PV et 5 % d'armure, Magicien 100 PV et 5 %. Résultat visé et obtenu : T2 (rare niveau 25 +25) tient jusqu'au niveau 20–30, T3 (légendaire 60 +60) jusqu'au niveau 50 et Tourment I–V, Tourment X demande T4 ; 20 à 90 objets par manche (au lieu de 400 à 2 600) et 1 000 à 55 000 or en Normal (au lieu de 150 000). Outil : `tools/sim/` dans le dépôt.

**Anneau de vie** : un cercle autour du héros se vide dans le sens horaire avec la vie (vert au-dessus de 50 %, jaune, puis rouge pulsant sous 25 %), le bouclier du Magicien en arc bleu juste autour ; la barre en haut à gauche reste. Les objets trouvés (affixe recherchée, légendaire) ne passent plus par la bannière centrale : seulement par les messages sous la barre de vie (et le flash, s'il est activé).

**Montée en difficulté** (niveau L, progression f de 0 à 1 dans la manche) :

- Vie des ennemis × 1,2 × (1 + 0,75 × (L − 1)) × (1 + 0,35 × f)
- Dégâts × 1,15 × (1 + 0,35 × (L − 1)) × (1 + 0,15 × f)
- Nombre max d'ennemis : 22 + 14 × (L − 1) + 34 × f, × 1,15, plafond 250, et apparitions 13 % plus rapprochées (Défense : (10 + 4 × vague + 10 × (L − 1)) × 1,15, plafond 160). L'écran ne tremble que quand le héros encaisse un coup, plus fort selon la part de vie perdue (4 à 12 px)
- Chaque nouveau Gardien a +25 % de vie

**Altérations et sources sacrées** : rester dans une zone toxique ajoute un cumul de **Poison** toutes les 0,6 s (5 au maximum, 8 s, environ 1 dégât par seconde et par cumul au niveau 1, régénération et potions moitié moins efficaces). Les flammes appliquent la **Brûlure** (5 s, environ 4 dégâts par seconde au niveau 1). Les effets continuent après la sortie de la zone ; les potions ne les retirent pas. Six **sources sacrées** sont réparties sur la carte, signalées par une flèche bleue vers la plus proche : y passer avec une altération la retire, puis la source se tarit et réapparaît 30 s plus tard ailleurs. En Défense, les zones blessent aussi le cryopode. Le mod de héros **Antidote** réduit la durée des altérations de 15 % par rang.

## Progression en partie

Chaque ennemi lâche un cristal d'expérience (goule et chauve-souris 1, archer 2, brute 5, Gardien 30). Passer du niveau n au suivant demande 5 + 7 × n points. À chaque niveau, le jeu se met en pause et propose 3 bonus au hasard ; ils durent jusqu'à la fin de la mission.

| Bonus | Effet par rang | Rangs | Classes |
| --- | --- | --- | --- |
| Rage | +12 % de dégâts | 5 | toutes |
| Frénésie | +10 % de vitesse d'attaque | 5 | toutes |
| Précision | +5 % de critique | 4 | toutes |
| Cruauté | +30 % de dégâts critiques | 3 | toutes |
| Double tir | +20 % de chances d'attaquer deux fois | 3 | toutes |
| Puissance | +25 % de dégâts de compétence | 3 | toutes |
| Salve | +1 projectile | 4 | Archer, Magicien |
| Éventail | +2 projectiles, −10 % de dégâts | 2 | Archer, Magicien |
| Perforation | +1 ennemi traversé | 2 | Archer |
| Onde arcanique | +20 % de rayon d'explosion | 3 | Magicien |
| Grande allonge | +15 % de portée | 3 | Guerrier |
| Lames spectrales | +1 onde tranchante par coup | 4 | Guerrier |
| Robustesse | +15 % de vie max, soigne 15 % | 5 | toutes |
| Régénération | +1,5 PV / s | 3 | toutes |
| Vampirisme | +1,5 % de vol de vie | 3 | Guerrier |
| Célérité | +8 % de vitesse | 3 | toutes |
| Aimant | +40 % de portée de ramassage (base 140) | 3 | toutes |
| Concentration | −8 % de recharge | 4 | toutes |
| Braises | brûlure de 10 % des dégâts / s | 3 | toutes |
| Givre | +10 % de chances de ralentir | 3 | toutes |
| Orage | +6 % de chances d'éclair en chaîne | 3 | toutes |
| Ampleur | +12 % de portée des compétences | 4 | toutes |
| Prolongation | +15 % de durée des compétences et ralentissements | 3 | toutes |
| Exécution | +40 % de dégâts contre les ennemis sous 30 % de vie | 3 | toutes |
| Tueur de Gardiens | +20 % de dégâts contre les Gardiens | 3 | toutes |
| Réflexes | −15 % de recharge de l'esquive | 3 | toutes |
| Endurci | −20 % de durée du poison et de la brûlure | 2 | toutes |
| Savoir | +20 % d'expérience | 3 | toutes |
| Bonne étoile | +15 % de chances de butin pendant la mission | 3 | toutes |
| Fiole de réserve | +1 potion tout de suite (si moins de 5) | 3 | toutes |

Un bonus arrivé à son rang maximum n'est plus proposé, ni un bonus dont la statistique est déjà au plafond : Précision à 75 % de critique, Concentration à 50 % de recharge, Réflexes à 60 %, Endurci à 60 %. Chaque carte affiche le rang actuel et le suivant (« rang 1 → 2 / 3 », « rang 5 / 5 · dernier ») ; dans la jauge, les cases pleines sont les rangs acquis et la case qui clignote le rang gagné. Le sac affiche « 2 / 3 » ou « max ». Quand il ne reste plus assez de bonus, le choix est complété par Soin (40 % de vie) ou Bourse (20 or × niveau).

**Portée des compétences** : statistique affichée dans la fiche du héros (100 % de base). Elle vient du bonus Ampleur, du mod Étendue et d'une nouvelle propriété d'équipement (+8 à 16 %). Elle agrandit le Tourbillon, l'Onde de choc, la Nova de givre et le Sillage de givre, et allonge la portée des carreaux de la Volée.

**Portée et rayon, sources** (plafond 300 % chacun, soit ×4) : affixe Portée des compétences 10–20 % + 0,5 × niveau d'objet ; mod Étendue +15 % par rang, 5 rangs (+75 %) ; bonus de niveau Ampleur +20 % × 5 (+100 %) ; prestige Envergure +3 % × 50 (+150 %). Rayon d'explosion du Magicien : mod Déflagration +20 % par rang, 5 rangs (+100 %) ; Onde arcanique +25 % × 5 (+125 %) ; prestige Déflagration +3 % × 50 (+150 %) ; affiché dans les statistiques du Magicien.

**Ultime** (4e bouton au-dessus de la compétence, touche F) : se charge en abattant 60 ennemis, un Gardien compte pour 10 ; la réduction de recharge ne s'applique pas. Guerrier, **Colère du Titan** : onde de choc de 320 de rayon (dégâts de compétence ×3, recul) et 3 s d'invulnérabilité. Archer, **Pluie d'acier** : pendant 3 s, 4 flèches toutes les 0,12 s sur les ennemis à moins de 450 (×0,7). Magicien, **Pluie de météores** : 3 météores de 150 de rayon (×3), en priorité sur les Gardiens. La portée des compétences agrandit ces zones. Bonus de niveau : **Fureur** (−15 % d'ennemis à abattre, 3 fois) et **Apothéose** (+30 % de dégâts de l'ultime, 3 fois).

**Frénésie critique** : 8 coups critiques en 5 s déclenchent un bonus de 5 s (allongé par la durée des compétences), puis 3 s de recharge. Archer : projectiles 50 % plus rapides et +1 transpercement ; Magicien : +50 % de rayon d'explosion ; Guerrier : +30 % de portée de frappe et +25 % de vitesse d'attaque. Sous la barre de vie, « Critiques n / 8 » dès 3 critiques, puis « Frénésie · n s » ; étincelles dorées autour du héros.

**Tremblements** : complément à celui des coups reçus, la compétence secoue légèrement l'écran (3,5 px), l'ultime davantage (7 px, 11 px pour la Colère du Titan), chaque météore 6 px, chaque flèche de la Pluie d'acier 1,5 px, et le déclenchement de la Frénésie 3 px.

## Butin, équipement, mods, reliques et schémas

**Chances de butin par ennemi tué**

| Butin | Goule | Chauve-souris | Archer | Brute | Gardien |
| --- | --- | --- | --- | --- | --- |
| Or | 65 % × 1 | 35 % × 0,6 | 65 % × 1,5 | 65 % × 5 | 8 pièces, 50 au total |
| Équipement | 1,2 % | 0,4 % | 1,6 % | 7 % | 2 (rare + magique) |
| Relique | 0,3 % | 0,1 % | 0,4 % | 2,5 % | 1 |
| Mod | 0,6 % | 0,2 % | 0,8 % | 6 % | 2 |
| Potion | 0,5 % | 0,5 % | 0,5 % | 5 % | 1 |

Au niveau L, les chances d'équipement, de relique et de fragment sont multipliées par 1 + 0,25 × (L − 1). La valeur de l'or est multipliée par 1 + 0,6 × (L − 1) et sa chance de tomber par 1 + 0,05 × (L − 1). Dès le niveau 2, des fragments tombent aussi directement des ennemis. Chaque Gardien donne +1 équipement tous les 3 niveaux, +1 relique tous les 4 niveaux et un fragment avec une chance de 15 % × ce multiplicateur. Chaque Gardien donne aussi 25 essence.

**Équipement** : armures (vie), amulettes (critique), bottes (vitesse) et anneaux (dégâts), en plus de l'arme, soit 5 emplacements, de rareté commune, magique, rare ou légendaire, avec 1 à 4 propriétés aléatoires (dégâts, vitesse, critique, vie, armure, régénération, recharge, compétence, portée des compétences…). Un objet trouvé s'équipe tout de suite depuis la pause (il est alors gardé même en cas de mort) ou part au coffre (taille illimitée, filtre par type, tri par rareté, amélioration, niveau ou date, pages de 24 objets) à la sortie. Recycler rapporte 2, 4, 8 ou 16 essence selon la rareté ; Un objet peut être verrouillé (cadenas) : il ne peut plus être recyclé. « Tout recycler » garde les objets verrouillés, améliorés et Prime.

**Ancestral** : nouvelle rareté au-dessus de Légendaire (couleur rose-rouge), uniquement en Tourment. 4 affixes à ×1,6 (contre ×1,3 pour un légendaire), statistique de base ×1,25, nom « … ancestral », recyclage 32 essence. Il déclenche aussi l'alerte Légendaires.

**Comparaison et Équiper le meilleur** : la fiche d'un objet (coffre ou butin de la partie) liste chaque statistique qui change avec sa nouvelle valeur et l'écart (▲ vert, ▼ rouge) face à l'objet porté. « Équiper le meilleur » (onglet Héros, et dans la pause pour le butin de la partie) choisit pour chaque emplacement l'objet qui maximise puissance + 0,3 × vie ; les objets remplacés partent au coffre.

**Pastilles d'onglets** : Héros (améliorations d'équipement disponibles), Armurerie (objets fabricables maintenant), Reliques (reliques possédées quand aucune n'est équipée), Forge (points de prestige à placer, sinon améliorations et talents achetables).

**Onglet Reliques** : file d'ouverture avec icônes, puis grille de tuiles (gemme à la couleur du niveau, nombre d'intactes et d'éclatantes ✦, pastille « n équipées », ★ si la relique contient le dernier fragment d'un schéma), filtrable par niveau. Toucher une tuile ouvre sa fiche : chaque récompense avec son état (✓ possédé, manquant n / 3, ★ complète le schéma, arme fabriquée) et deux barres de chances (intacte, éclatante), puis les réglages d'équipement et le raffinage.

**Amélioration** : chaque arme et chaque pièce d'équipement s'améliore de +0 à +100 avec de l'essence (Camp › Héros, sélectionner l'objet, boutons +1 ou +10). Chaque niveau ajoute 2 % des valeurs de l'objet, soit ×3 à +100 ; le nombre de projectiles et la perforation ne changent pas. Passer du niveau n à n + 1 coûte 5 + 3n + n²/10 essence (5 au début, environ 1 280 pour le dernier, environ 48 000 au total). Recycler un objet amélioré rend la moitié de l'essence investie ; « Tout recycler » ignore les objets améliorés.

**Transfert d'affixe** (onglet Affixes du Camp) : on touche Source ou Cible puis un objet dans l'inventaire affiché (équipement porté marqué « Équipé », autres armes, coffre filtrable et paginé ; les objets non valides sont grisés). On choisit un équipement source non verrouillé, une de ses affixes, puis une cible (arme possédée, équipement porté ou du coffre). Si la cible a déjà l'affixe, elle n'est remplacée que par une valeur strictement plus forte ; sinon elle est ajoutée s'il reste de la place (1 à 4 affixes selon la rareté), ou remplace une affixe choisie. La source est détruite et le transfert coûte 50 essence × (rareté de la source + 1). La valeur transférée est celle affichée sur la source, amélioration comprise ; les améliorations suivantes de la cible l'augmentent ensuite. Deux cartes côte à côte montrent la source et l'aperçu de la cible : ligne retirée barrée en rouge, ligne ajoutée en vert.

**Fusion d'affixe** : quand la cible a déjà l'affixe prise sur la source, le transfert devient une fusion par défaut. Nouvelle valeur = la plus forte des deux + 50 % de la plus faible (valeurs affichées, amélioration comprise ; +1 pour projectiles et transpercement). 3 fusions au maximum par affixe et par objet ; coût 100 × (rareté de la source + 1) × (numéro de la fusion) essence. Si la source est plus forte, deux puces permettent de choisir « Fusionner » ou « Remplacer » (le remplacement remet le compteur de fusions à 0). L'aperçu indique « fusion n / 3 ».

**Chercher par affixe** (onglet Affixes) : liste de toutes les affixes présentes sur tes objets non verrouillés (portés et coffre), filtrable en Offensives (dégâts, vitesse d'attaque, critique, dégâts critiques, dégâts et portée des compétences…), Défensives (vie, réduction des dégâts, régénération, vol de vie) et Utilitaires (vitesse de déplacement, recharge). Chaque ligne montre la meilleure valeur, l'objet qui la porte, le nombre d'objets et la valeur de ta cible si elle l'a déjà. Toucher la ligne déplie les objets classés du plus fort au plus faible ; « Prendre » désigne cet objet comme source avec cette affixe déjà choisie, puis passe au choix de la cible.

**Alertes de butin** (onglet Affixes) : on coche les affixes recherchées (groupées en Offensives, Défensives, Utilitaires) et l'option Légendaires (active par défaut). En mission, quand un objet tombe avec une affixe cochée dont la valeur dépasse la meilleure valeur de cette affixe sur l'équipement porté (amélioration comprise ; toujours si aucune pièce portée ne l'a), ou un légendaire, l'écran s'illumine brièvement (halo doré, orangé pour un légendaire, au plus un flash toutes les 0,35 s), un message nomme l'affixe trouvée, et l'objet au sol porte un grand faisceau doré avec un anneau qui pulse jusqu'à son ramassage.

**Mods** : deux builds séparés. Le **build d'arme** est attaché à chaque arme (4 cases, capacité 10 + Catalyseur jusqu'à +12 + maîtrise de l'arme jusqu'à +10) : changer d'arme change ses mods. Le **build de héros** est attaché à la classe (3 cases au départ, jusqu'à 6 en payant 15, 30 puis 50 fragments de schéma, + 1 case d'Aura ; capacité 10 + Réacteur jusqu'à +12 + maîtrise du héros jusqu'à +10 + bonus d'Aura). Un mod coûte sa valeur de base + son rang en capacité ; la fusion coûte 10 × 2^rang × (rareté + 1) essence. Un doublon rapporte 8, 16 ou 24 essence. Le tableau ci-dessous liste les mods d'arme.

| Mod | Effet par rang | Rang max |
| --- | --- | --- |
| Férocité | +15 % de dégâts | 5 |
| Cadence | +8 % de vitesse d'attaque | 5 |
| Vitalité | +15 PV | 5 |
| Égide, Pas léger, Intensité, Morsure du givre | armure, vitesse, compétence, ralentissement | 3 |
| Allonge, Déflagration | portée (Guerrier), rayon d'explosion (Magicien) | 3 |
| Œil du chasseur, Boucherie, Braise vive, Flux | critique, dégâts critiques, brûlure, recharge | 3 |
| Sangsue (Guerrier), Pointe de diamant (Archer) | vol de vie, perforation | 3 / 1 |
| Arc électrique, Écho (Archer, Magicien) | 6 % d'éclair, 25 % de projectile en plus | 3 |

| Mod de héros ou Aura | Effet par rang | Polarité |
| --- | --- | --- |
| Vitalité, Égide, Pas léger | +15 PV, −3 % de dégâts subis, +5 % de vitesse | Rempart |
| Intensité, Flux | +20 % de compétence, −6 % de recharge | Spirale |
| Second souffle | +1,5 PV / s | Rempart |
| Alchimiste | +15 % de soin des potions | Rempart |
| Rapace | +20 % de portée de ramassage | Spirale |
| Étendue | +10 % de rayon de compétence | Spirale |
| Persistance | +12 % de durée de compétence et de ralentissement | Spirale |
| Pas fantôme | −10 % de recharge de l'esquive | Rempart |
| Dernier rempart | −10 % de dégâts subis sous 30 % de vie | Rempart |
| Rage du survivant | +15 % de dégâts sous 50 % de vie | Braise |
| Aura Présence glaciale | ennemis à moins de 180 ralentis de 8 % | Aura (+4 + rang de capacité) |
| Aura Cupidité | +10 % d'or | Aura (+4 + rang de capacité) |
| Aura Ferveur | +5 % de vitesse d'attaque | Aura (+4 + rang de capacité) |

**Polarités et alignement** : chaque mod a une polarité, Braise ▲ (attaque), Rempart ■ (défense) ou Spirale ◆ (pouvoir). Au Camp (onglet Mods), une case peut être alignée sur une polarité : un mod de même polarité y coûte la moitié (arrondi au supérieur), un autre +25 %. Chaque alignement d'une classe coûte 200, 400, 800 puis 1 600 essence, et remet à 0 la maîtrise du build concerné (héros ou arme) ; chaque build a ses propres alignements. Si la capacité est dépassée, les derniers mods deviennent inactifs.

**Filtres de mods** : au-dessus de la collection, des chips Tous, ▲ Braise, ■ Rempart, ◆ Spirale (et ✦ Aura pour le héros), chacune avec son nombre. Toucher le nom de polarité au-dessus d'une case filtre pour cette case : seuls les mods de sa polarité (tous si elle est neutre, jamais les auras), classés du moins cher au plus cher avec le coût réel dans cette case ; si elle est libre, « Équiper » place le mod dans cette case plutôt que dans la moins chère.

**Maîtrise** : le héros (par classe) et chaque arme ont chacun un rang de 0 à 10, gagné à la fin de chaque mission (1 point par ennemi tué, que la mission réussisse ou non). Passer du rang r au suivant demande 100 × (r + 1) points. Chaque rang donne +1 de capacité de mods.

**Reliques** : 14 reliques sur 4 niveaux : Cendre (Dent du Pèlerin, Larme de suie, Clou du Bûcher), Ossuaire (Phalange du Veilleur, Crâne fêlé, Côte du Roi-mendiant), Sanguine (Cœur noirci, Calice rouge, Veine de la Veuve, Fiole d'ichor), Abysse (Prunelle du Néant, Couronne brisée, Os du Premier Roi, Sablier noir). Leur niveau dépend du niveau de mission. Chacune contient 6 récompenses : 3 communes, 2 peu communes, 1 rare. Elles s'ouvrent uniquement en mission, par la Fissure, une par une dans l'ordre d'équipement. Le raffinage (intacte → éclatante, 50 essence) ne touche pas les exemplaires équipés.

| État | Commune (chacune) | Peu commune (chacune) | Rare |
| --- | --- | --- | --- |
| Intacte | 25,33 % | 11 % | 2 % |
| Éclatante (raffinage : 50 essence) | 16,67 % | 20 % | 10 % |

**Schémas** : chaque arme ou équipement Prime se fabrique avec 3 fragments, obtenus uniquement dans les reliques, plus de l'or.

**Recyclage des objets fabriqués** : à l'Armurerie, une arme fabriquée et non équipée peut être recyclée (confirmation) contre 40 × (rareté + 1) essence + la moitié de l'essence investie dans ses améliorations, et 1 fragment de son schéma (en priorité un fragment manquant) ; elle perd son niveau et ses affixes ajoutées, ses mods restent dans la collection. Un objet Prime du coffre se recycle de la même façon (essence + 1 fragment). « Tout recycler » continue d'épargner les objets Prime.

**Armurerie, actions groupées** (en tête d'onglet, avec confirmation qui liste les objets) : **Tout fabriquer** fabrique tout ce qui a ses 3 fragments tant que l'or suffit (armes du héros d'abord, puis des autres classes, puis objets Prime, plusieurs exemplaires d'un Prime si les fragments le permettent) ; l'arme du héros fabriquée est équipée. **Tout recycler** recycle les armes fabriquées non équipées (toutes classes) et les objets Prime non verrouillés du coffre, aux mêmes conditions que le recyclage individuel (essence + 1 fragment par objet).

**Objets exclusifs Sanguine** : les reliques Sanguine (Cœur noirci, Calice rouge, Veine de la Veuve, Fiole d'ichor, Cœur d'hiver) contiennent, à la place de leurs récompenses peu communes et rares, des **objets exclusifs** de rareté **Sanguin** (rouge sang, au-dessus d'Ancestral) : impossibles à fabriquer et absents du butin en jeu. Chance par ouverture : 24 % (intacte), 50 % (éclatante). L'objet arrive directement au coffre, au niveau de la mission + 20 (1 + 4 × (L−1) + 20) ; 4 affixes fixes par modèle à ×1,8 de la valeur normale (×1,3 pour un légendaire), statistique de base ×1,4. 10 modèles : Cœur du Martyr, Cuirasse de la Veuve rouge, Pas de l'Hémorragie, Anneau du Sang versé, Linceul écarlate, Œil du Calice, Grèves du Bourreau rouge, Sceau de l'Ichor, et deux de givre (Cœur gelé du Martyr, Anneau de l'Hiver sanglant). Ils sont épargnés par « Tout recycler ». Les fragments légendaires que ces reliques donnaient restent disponibles dans les reliques Abysse et par la fusion de reliques Abysse.

**Fusion de reliques** (onglet Reliques) : 3 reliques d'un même niveau (d'abord celles hors de la file d'ouverture, intactes avant éclatantes ; au besoin des reliques de la file, qui en sont retirées) → 1 relique aléatoire du niveau suivant, pour 20 / 40 / 80 essence (Cendre → Ossuaire → Sanguine → Abysse). 3 reliques Abysse + 150 essence → 1 fragment d'un schéma légendaire choisi (armes légendaires non fabriquées, celle du héros en premier, et les 6 équipements Prime), en priorité un fragment manquant.

**Messages de butin** : aucun message n'apparaît plus au ramassage (objet, relique, mod, fragment, potion) ni à la chute d'un objet recherché ; le butin se consulte dans la pause (pastille sur le sac). Restent les sons, le flash réglable et le faisceau au sol.

| Objet | Classe | Dégâts ou base | Bonus | Fabrication |
| --- | --- | --- | --- | --- |
| Arc court du Pèlerin | Archer | 10 | +15 % vitesse d'attaque | 75 or |
| Arc long du Corbeau | Archer | 15 | +8 % critique, perce 1 | 175 or |
| Baliste de poing | Archer | 21 | +1 projectile, +30 % dég. crit. | 350 or |
| Ultime Soupir | Archer | 30 | +1 projectile, perce 2, +15 % vitesse | 700 or |
| Épée longue du Veilleur | Guerrier | 11 | 2 % vol de vie | 75 or |
| Hache de guerre | Guerrier | 17 | +40 % dég. crit., +10 % portée | 175 or |
| Espadon de Fer-Sang | Guerrier | 24 | +25 % portée, 2 % vol de vie | 350 or |
| Brise-Serment | Guerrier | 32 | +20 % portée, 3 % vol de vie, +10 % crit. | 700 or |
| Sceptre des Murmures | Magicien | 10 | −10 % recharge | 75 or |
| Grimoire de la Veuve | Magicien | 15 | +25 % rayon, +30 % compétence | 175 or |
| Orbe de la Lune noire | Magicien | 21 | +1 projectile | 350 or |
| Étoile Mourante | Magicien | 30 | +1 projectile, +30 % rayon, +10 % crit. | 700 or |
| Linceul du Néant | toutes (armure) | +90 PV | +10 % armure, +2 PV/s | 500 or |
| Cuirasse du Veilleur Prime | toutes (armure) | +70 PV | +15 % dégâts, +6 % armure | 500 or |
| Amulette des Échos | toutes (amulette) | +6 % crit. | +15 % vitesse, −10 % recharge | 500 or |
| Sceau du Néant | toutes (amulette) | +8 % crit. | +50 % dég. crit., +10 % dégâts | 500 or |
| Foulée du Néant | toutes (bottes) | +12 % vitesse | −10 % recharge, +2 PV/s | 500 or |
| Chevalière du Premier Roi | toutes (anneau) | +15 % dégâts | +6 % crit., +30 % dég. crit. | 500 or |

## Progression permanente

Le Camp compte 5 onglets : Héros (équipement, coffre, fragments), Armurerie (toutes les recettes, ouverture de reliques), Reliques (tables, raffinage, choix pour la mission), Mods, Forge (améliorations, talents, niveau de départ, sauvegarde JSON). Deux monnaies : l'or (améliorations, talents, fabrication) et l'essence (fusion des mods, raffinage).

| Amélioration de la Forge | Effet par niveau | Niveaux | Coût du 1er niveau |
| --- | --- | --- | --- |
| Vigueur | +8 % de vie max | 5 | 60 or |
| Force | +6 % de dégâts | 5 | 70 or |
| Célérité | +5 % de vitesse d'attaque | 5 | 70 or |
| Alchimie | +1 potion au départ (base 2) | 3 | 90 or |
| Fortune | +15 % d'or ramassé | 4 | 80 or |
| Flair | +3 de chance de rareté | 3 | 110 or |
| Catalyseur | +3 de capacité de mods | 4 | 100 or |

Chaque niveau suivant coûte ×1,7 du précédent. Les talents coûtent 150, 300 et 500 or par classe.

**Prestige du héros** (Forge) : se débloque quand les 8 améliorations permanentes sont au maximum. Il est propre à chaque héros et n'a pas de limite de niveau. Le niveau n+1 coûte 500 + 250 n or et 30 + 15 n essence et donne 1 point à placer, redistribuable gratuitement. Par point : Vitalité +2 % de vie, Puissance +2 % de dégâts, Vivacité +1 % de vitesse d'attaque, Acuité +0,5 % de critique (max 40 points), Brutalité +3 % de dégâts critiques, Arcanes +3 % de dégâts de compétence, Ténacité −0,5 % de dégâts subis (max 40), Sang-froid −0,5 % de recharge (max 30), Foulée +0,5 % de vitesse (max 30), Opulence +2 % d'or, Envergure +3 % de portée des compétences (max 50 points), Déflagration +3 % de rayon d'explosion (max 50). Les plafonds généraux (critique 75 %, armure 60 %, recharge 50 %) s'appliquent toujours.

## Technique

Une seule page HTML avec JavaScript, sans serveur.

**Fichiers (site GitHub Pages, sans build)** : `index.html`, `css/game.css`, puis les scripts classiques dans cet ordre, qui partagent la portée globale : `js/data.js` (données, sauvegarde), `js/game.js` (partie, combat, butin), `js/render.js` (Canvas, PixiJS, HUD), `js/ui.js` (fiches, pause, niveaux, mods, fin), `js/camp.js` (Camp), `js/settings.js` (réglages, bannière, vibrations), `js/audio.js` (sons), `js/main.js` (boucle). PWA : `manifest.webmanifest`, `sw.js` (cache, réseau d'abord pour la page et les scripts, numéro `VERSION` à incrémenter à chaque mise à jour), `icons/`, `.nojekyll`.

**Son** : entièrement synthétisé en Web Audio, aucun fichier. Coups (avec limite de cadence), critiques, coup reçu, ramassages par rareté, or, potion, esquive, compétence propre à chaque classe, ultime, météores, Gardien qui surgit et qui meurt, élite, Frénésie, montée de niveau, relique ouverte, vague, victoire, défaite, clics d'interface. Musique d'ambiance : bourdon grave filtré qui respire et cloches rares en mode mineur. Le son démarre au premier geste et se coupe quand l'onglet est masqué.

**Réglages** (bouton sur l'écran de départ et dans la pause, propres à l'appareil, clé `crypte-set`) : volume des effets et de la musique, tremblement Normal / Réduit / Désactivé, flash de butin, chiffres de dégâts, vibrations (coup reçu, légendaire ou affixe recherchée), rendu WebGL ou standard.

**Bannière d'événements** : au centre en haut, un message à la fois pendant \~2 s, file de 3 classée par priorité (affixe recherchée ou légendaire > Gardien, relique ouverte, Gardien vaincu > élite, Frénésie). Les ramassages restent dans les messages sous la barre de vie, qui ne peuvent donc plus chasser un événement important.

| Sujet | Choix actuel |
| --- | --- |
| Rendu | PixiJS 7.4.2 (WebGL), repli automatique sur Canvas 2D ; bouton dans la pause pour changer |
| Boucle | logique à pas fixe de 60 calculs / s, au plus 6 rattrapages par image |
| Collisions | grille spatiale de cases de 64 unités pour les projectiles et l'écartement des ennemis |
| Mémoire | tableaux compactés sur place, sprites réutilisés, interface mise à jour seulement si elle change |
| Sauvegarde | stockage local du navigateur (clé crypte-meta) ; export et import en JSON depuis Camp › Forge › Sauvegarde, avec comparaison et confirmation avant remplacement |
| Contrôles mobile | joystick flottant, boutons esquive, compétence, potion (allumés quand disponibles), sac |
| Contrôles clavier | ZQSD ou flèches, Espace esquive, E compétence, R potion, I pause, 1 à 3 pour les bonus |

- [ ] Vérifier que le rendu WebGL s'affiche sur ton téléphone (indiqué dans la pause)
