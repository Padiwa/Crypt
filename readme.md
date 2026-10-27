# Crypte des Cendres — specs

Oct 27, 2026 · @cms · version 132

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
| Manche de Survie | 2 min |
| Gardien (boss) | toutes les 60 s en Survie, 90 s en Capture, toutes les 3 vagues en Défense |
| Ennemis simultanés | jusqu'à 150 |
| Niveaux de mission | 1 à 50, au choix |

## Héros

Trois classes, chacune avec ses stats, ses armes, 3 sorts et 3 ultimes (un de chaque au choix, depuis la v132) et 3 talents permanents. Toutes ont une esquive (recharge 3 s, 0,2 s d'invulnérabilité) et des potions (rendent 45 % de la vie, 5 au maximum).

| Classe | Dégâts | Attaques / s | Vie | Critique | Armure | Vitesse | Attaque |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Archer | 8 | 1,80 | 100 | 5 % | 0 % | 220 | carreaux à distance, ×1,43 de délai en mouvement |
| Guerrier | 14 | 1,50 | 160 | 5 % | 15 % | −6 % | coup en arc de 155° au corps à corps (portée 95), même en marchant |
| Magicien | 12 | 1,25 | 85 | 8 % | 0 % | −2 % | orbes qui explosent (rayon 55), −10 % de recharge |

Les dégâts de base s'ajoutent à ceux de l'arme équipée. Dégâts critiques de base : 150 %.

**Sorts et ultimes** (v132) : chaque héros choisit un sort (touche E) et un ultime (touche F) parmi trois, dans Héros › Sorts et talents, hors mission (`meta.kit[classe] = {s, u}`, `SPELLS` dans `js/data.js`). Le 1er est ouvert dès le début, le 2e au rang 3 de maîtrise du héros, le 3e au rang 6 (`KIT_MAST`) ; un choix encore verrouillé revient au 1er. Toutes les statistiques comptent : dégâts = dégâts de compétence (`S.nova` = dégâts × 4 × (1 + dégâts de compétence %)) ; rayons et portées × (1 + portée des compétences %) ; durées des sorts (Tourbillon, Cri de guerre) et des ralentissements × (1 + durée des compétences %) ; recharge × (1 − réduction de recharge %) ; ultimes × (1 + dégâts de l'ultime %), bouclier et renvoi du Rempart compris, et pendant Œil du faucon, Fureur du berserker et Surcharge arcanique, tous les dégâts du héros × ce même bonus. Chaque coup de sort passe par `spellHit` : bonus contre Gardiens, exécution, dégâts contre ralentis, gel, ralentissement et éclair (éléments), brûlure, comme une attaque ; c'est aussi le cas, depuis la v132, du Tourbillon, de la Nova, de la Colère du Titan, de la Pluie d'acier et des météores. Vol de vie : Tourbillon et Bond écrasant. Les sceaux Sablier (recharge ×0,8) et Soin, et Esprit vif (recharge ×0,85), s'appliquent à tous les sorts. Les renforts (Cri, Faucon, Fureur, Surcharge) passent par `stats()` (champs `criT`, `hawkT`, `berT`, `surT` du héros, seulement en mission).

| Classe | Type | Nom | Recharge | Effet (en % des dégâts de compétence) | Ouvert |
| --- | --- | --- | --- | --- | --- |
| Archer | Sort | Volée | 7 s | 24 carreaux perforants dans toutes les directions, 35 % chacun | dès le début |
| Archer | Sort | Tir du chasseur | 6 s | 3 carreaux lourds vers l'ennemi le plus proche, transpercent tout, 160 % chacun, critiques | maîtrise rang 3 |
| Archer | Sort | Bond arrière | 6 s | saut de 220 px en 0,22 s, intouchable, puis 9 carreaux en éventail (50 %, perforation +1) | maîtrise rang 6 |
| Archer | Ultime | Pluie d'acier | — | 3 s, 4 flèches toutes les 0,12 s sur les ennemis à 450 px, 70 %, critiques | dès le début |
| Archer | Ultime | Œil du faucon | — | 6 s : cadence ×2, tous les tirs critiques | maîtrise rang 3 |
| Archer | Ultime | Tempête de carreaux | — | 3 s : 4 carreaux en spirale toutes les 0,08 s, 30 %, perforation +2, critiques | maîtrise rang 6 |
| Guerrier | Sort | Tourbillon | 9 s | 1,6 s de rotation, rayon 130, 22 % toutes les 0,2 s, dégâts subis ÷ 2 | dès le début |
| Guerrier | Sort | Bond écrasant | 8 s | saut vers le groupe le plus dense à 460 px (300 px au plus, 0,3 s, intouchable) ; atterrissage rayon 150 : 140 %, critiques, ralentit 1,5 s, repousse | maîtrise rang 3 |
| Guerrier | Sort | Cri de guerre | 12 s | 6 s : dégâts +30 % (ajoutés aux autres bonus), dégâts subis ×0,7 ; rayon 200 : repousse et ralentit 1,5 s | maîtrise rang 6 |
| Guerrier | Ultime | Colère du Titan | — | onde rayon 320, 300 %, ralentit 2 s, 3 s d'invulnérabilité | dès le début |
| Guerrier | Ultime | Rempart | — | 6 s : bouclier 60 % de la vie ; la moitié de chaque coup reçu (avant armure) frappe l'ennemi le plus proche à 260 px | maîtrise rang 3 |
| Guerrier | Ultime | Fureur du berserker | — | 8 s : vitesse d'attaque +60 %, portée de frappe +40 %, vol de vie +6, insensible à la gelure | maîtrise rang 6 |
| Magicien | Sort | Nova de givre | 7 s | rayon 175 : 100 %, critiques, ralentit 2,5 s, repousse, efface les projectiles ennemis | dès le début |
| Magicien | Sort | Éclair en chaîne | 6 s | ennemi le plus proche à 520 px puis 6 sauts de 260 px : 120 %, −10 % par saut, critiques | maîtrise rang 3 |
| Magicien | Sort | Transfert | 7 s | téléportation de 240 px (arrêtée par les murs) ; explosion glacée au départ et à l'arrivée : 60 %, ralentit 2,5 s | maîtrise rang 6 |
| Magicien | Ultime | Pluie de météores | — | 3 météores (0,35 s d'intervalle), rayon 150, 300 %, critiques | dès le début |
| Magicien | Ultime | Blizzard | — | 5 s : toutes les 0,3 s, rayon 320 : 50 %, critiques, ralentit 1,5 s | maîtrise rang 3 |
| Magicien | Ultime | Surcharge arcanique | — | 6 s : recharge du sort 0,5 s, cadence ×2, rayon d'explosion +50 % | maîtrise rang 6 |

| Classe | Talent (150 or) | Talent (300 or) | Talent (500 or) |
| --- | --- | --- | --- |
| Archer | Tir en course : pleine cadence en mouvement | Pas de l'ombre : 3 tirs critiques après une esquive | Ricochet : chaque carreau rebondit une fois |
| Guerrier | Charge brutale : l'esquive blesse et repousse | Soif de sang : +2 % de vie par ennemi tué | Onde de choc : un coup sur 4 frappe dans un rayon de 160 |
| Magicien | Sillage de givre : l'esquive laisse une explosion glacée | Barrière : bouclier de 25 % de la vie, recharge après 4 s | Chaîne d'éclairs : une orbe sur 4 foudroie 3 ennemis |

## Missions

Trois modes, tous avec un niveau de mission libre de 1 à 50, choisi sur l'écran Mission et une relique optionnelle à ouvrir.

| Mode | Objectif | Fin de manche | Récompense de manche | Échec |
| --- | --- | --- | --- | --- |
| Survie | tenir face aux hordes | toutes les 2 min : sortir ou continuer (niveau +1) | 1 relique | mort du héros |
| Défense | protéger le cryopode au centre (1 200 PV, dégâts reçus ×0,6) | toutes les 3 vagues : sortir ou continuer | 1 relique + 1 équipement magique ou mieux | cryopode détruit ou mort |
| Capture | mettre la cible à terre, rester 2,5 s à moins de 80 unités, rester 3 s dans la zone d'extraction (la jauge redescend si on en sort) | après 3 s passées dans la zone d'extraction | 1 relique + 60 or × niveau | mort du héros |

**Défense** : chaque vague compte 10 + 4 × vague (+8 par niveau au-delà du 1er) ennemis, 80 au maximum. 60 % des ennemis visent le cryopode. Pause de 4 s entre les vagues, le cryopode récupère 8 % ; 30 % quand on continue.

**Capture** : la cible (260 PV × difficulté) fuit quand le héros est à moins de 480 unités et se téléporte à 330 unités toutes les 4 à 6 s s'il est à moins de 260. Une flèche dorée indique sa direction et sa distance. Après chaque capture (2,5 s à côté de la cible à terre), une nouvelle cible apparaît 5 s plus tard tant qu'on ne s'est pas extrait ; la zone d'extraction, ouverte à la 1re capture, reste en place (v117). Chaque capture rapporte une relique de la difficulté et du Tourment, sans niveau minimum, et 60 or × niveau de mission.

Fissure (ouverture de reliques) : on équipe dans Collection › Reliques (ou par la ligne Reliques de l'écran Mission) autant de reliques qu'on veut, dans l'ordre choisi (Tout équiper, Tout retirer). Depuis v94, la file du Camp est regroupée par relique et par état (« Relique Ossuaire ×8 », « éclatante ×2 »), dans l'ordre de la première de chaque groupe : ↑ ↓ déplacent le groupe entier, − et + retirent ou ajoutent une relique du groupe. Tant qu'il reste une relique à ouvrir, 10 % des ennemis sont corrompus (BAL.corrupt, rythme rapide) (halo doré, +30 % de vie) et lâchent un réactif. 30 réactifs (BAL.reactN ; moins en Tourment, voir Bonus du Tourment) ouvrent la relique en cours, puis le compteur repart à 0 pour la suivante (icône de relique avec l'anneau des réactifs et nombre de reliques ouvertes, en haut). Depuis v95, l'ouverture ne montre plus ni bannière ni message : seuls le son, la secousse et le compteur la signalent. À la réussite, chaque relique ouverte donne 1 fragment d'un objet de sa rareté (2 si éclatante) et 25 essence. Les reliques non ouvertes, ou toutes en cas d'échec, ne sont pas consommées et restent équipées.

**Bonus du Tourment** (v116, réglages dans `js/rythmes/`) : en Tourment, il faut moins de réactifs pour ouvrir une relique, et les reliques tombent plus souvent à mesure qu'on reste dans la mission. Une tranche de séjour = 2 minutes de mission (`G.t`).

| Réglage (rythme rapide) | Valeur | Effet |
| --- | --- | --- |
| `tormReact` | 4 % par palier | réactifs en moins : −4 % au palier I, −40 % au palier X (18 au lieu de 30) |
| `sejReact`, `sejReactMax` | 5 % par tranche, 30 % au plus | réactifs en moins avec le séjour |
| `reactCutMax` | 70 % | réduction totale maximale : il faut toujours au moins 9 réactifs |
| `sejRelic`, `sejRelicMax` | +10 % par tranche, +60 % au plus | chance de relique sur les monstres et les élites |

Le rythme long : 3 % par palier, 4 % par tranche (24 % au plus), 60 % au total, reliques +8 % par tranche (48 % au plus). Un message (gardé en mission) annonce chaque hausse ; l'écran de fin de manche rappelle le bonus (« 20 réactifs par relique au lieu de 30, reliques +20 % ») ; le texte de la difficulté Tourment, sur l'écran Mission, affiche « réactifs −X %, plus en restant ». En coopération, chacun calcule son bonus avec le palier de l'hôte et son propre temps de mission.

**Sortie et mort** : sortir garde tout le butin. Mourir garde la moitié de l'or ramassé, les mods et l'équipement déjà équipé ; les objets et reliques trouvés sont perdus.

**Séjour après l'objectif** (v131) : une fois l'objectif réalisé (1re manche finie en Survie et Brèche, 1re série de 3 vagues en Défense, 1re cible capturée en Capture), chaque minute de plus multiplie les chances de butin des monstres et des élites par 1 + 0,1 × minutes, jusqu'à ×2 au bout de 10 minutes : objets, fragments d'armes, mods et reliques (en Tourment, en plus du bonus de séjour des reliques). Les lâchers garantis (Gardiens, première pièce d'une élite, récompenses de manche et de capture) et l'or ne changent pas. Le temps passé sur l'écran du portail ne compte pas (partie en pause). Un message annonce chaque hausse jusqu'au plafond ; la pause et l'écran du portail montrent le bonus.

**Biomes** (choix sur l'écran de départ, cumulé avec niveau et difficulté) : **Crypte des Cendres** (d'origine) et **❄ Abîmes gelés**. Abîmes gelés : sol de glace bleuté, piliers givrés, braseros à flamme bleue, neige qui tombe ; vie des monstres ×1,3, dégâts ×1,2, butin ×1,3. Nouvel ennemi **Revenant de givre** (26 PV, vitesse 108, 7 dégâts, remplace 65 % des groupes de goules) : son contact inflige **Gelure** 2,2 s (−38 % de vitesse de déplacement, réduite par l'Antidote, dissipée par les sources sacrées). La moitié des reliques trouvées y sont des reliques de givre.

**Affixes de givre** (uniquement sur les objets trouvés dans les Abîmes, 45 % en portent une d'office) : **Gel** (+4–8 % de chances d'immobiliser l'ennemi 1 s, plafond 40 %, pas sur les Gardiens), **Dégâts contre ralentis** (+12–22 % contre les ennemis ralentis ou gelés), **Éclats de glace** (6–12 % de chances qu'un ennemi tué éclate : 1,5 × dégâts dans un rayon de 85 et ralentissement, réaction en chaîne limitée à 3 niveaux, plafond 60 %). Les objets des Abîmes ont leurs propres noms (Pelisse givrée, Talisman de givre, Bottes fourrées, Anneau de givre…, légendaires Œil du Blizzard, Sceau du Zéro absolu…).

Difficulté (écran de départ, en plus du niveau de mission) : Normal 1 Gardien toutes les 60 s ; Difficile 2 toutes les 45 s, butin et or +50 % ; Cauchemar 3 toutes les 35 s, +100 % ; Tourment avec 10 paliers I à X (sélecteur sous les chips) : palier t = 4 Gardiens (5 à partir de VI) toutes les max(16, 26 − t) s, butin et or +200 % + 50 % par palier au-delà du I (+650 % en X), vie des monstres × (1 + 0,5 t), dégâts × (1 + 0,22 t), valeurs d'affixes +5 % par palier, chance de Rare +1,5 point par palier. La difficulté décide du type de relique : Ossuaire (Normal à Cauchemar), Ancestrale (I à V), Sanguine ou Abyssale (VI à X). En Capture l'intervalle est multiplié par 1,5 ; en Défense, le nombre de Gardiens s'applique aux vagues de sortie. La barre de boss cumule la vie de tous les Gardiens vivants.

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

**Équilibrage (passe 1, simulée)** : 300 parties de 3 min (durée de manche de l'époque ; 2 min depuis v84) jouées par un bot, 3 classes × profils T0 (rien) à T4 (ancestral +100, prestige 60) × niveaux 1 à 50 × difficultés. Changements : vie des monstres × 1,025^(L−1) et dégâts × 1,012^(L−1) en plus de la croissance linéaire ; Tourment vie × (1 + 0,5 t), dégâts × (1 + 0,22 t) ; butin × (1 + 0,06 (L−1)) au lieu de 0,25 ; or × (1 + 0,15 (L−1)) au lieu de 0,6 ; bonus de difficulté : ×0,15 sur la quantité d'objets, ×0,5 sur l'or ; chances d'objet par monstre divisées par 2 ; Gardien : 1 objet de plus tous les 10 niveaux (au lieu de 3), 1 relique tous les 12 (au lieu de 4) ; légendaire plafonné à 9 % (+0,6 % par palier de Tourment), rare à 30 % ; affixes Dégâts +0,6 × niveau d'objet (au lieu de 1,2), Vie +2,5 × niveau (au lieu de 4) ; prestige n : 600 + 300 n + 15 n² or, 30 + 15 n + n²/2 essence ; Archer 115 PV et 5 % d'armure, Magicien 100 PV et 5 %. Résultat visé et obtenu : T2 (rare niveau 25 +25) tient jusqu'au niveau 20–30, T3 (légendaire 60 +60) jusqu'au niveau 50 et Tourment I–V, Tourment X demande T4 ; 20 à 90 objets par manche (au lieu de 400 à 2 600) et 1 000 à 55 000 or en Normal (au lieu de 150 000). Outil : `tools/sim/` dans le dépôt jusqu'à la v105, remplacé par tools/progression/.

**Barre et anneau de vie** : la barre en haut à gauche fait 22 px de haut, avec une bordure rouge vif et les PV écrits en gras blanc dans la barre (« 29 / 115 »). Le bouclier s'y superpose en bleu. Sous 30 % de PV, la bordure pulse en rouge (fixe si le système réduit les animations). La ligne dessous n'affiche que le bouclier et le niveau du héros. Autour du héros, un anneau de 6 px avec un contour noir de 9 px et une légère lueur se vide dans le sens horaire avec la vie : vert au-dessus de 50 %, jaune, puis rouge pulsant sous 25 %. Le bouclier forme un arc bleu de 3 px juste à l'extérieur. Aucun message ne s'affiche quand on ramasse un objet : seuls le flash (s'il est activé), le faisceau au sol et le son signalent les bons objets.

**Montée en difficulté** (niveau L, progression f de 0 à 1 dans la manche) :

- Vie des ennemis × 1,2 × (1 + 0,75 × (L − 1)) × (1 + 0,35 × f)
- Dégâts × 1,15 × (1 + 0,35 × (L − 1)) × (1 + 0,15 × f)
- Nombre max d'ennemis : 22 + 14 × (L − 1) + 34 × f, × 1,15, plafond 250, et apparitions 13 % plus rapprochées (Défense : (10 + 4 × vague + 10 × (L − 1)) × 1,15, plafond 160). L'écran ne tremble que quand le héros encaisse un coup, plus fort selon la part de vie perdue (4 à 12 px)
- Chaque nouveau Gardien a +25 % de vie

**Altérations et sources sacrées** : rester dans une zone toxique ajoute un cumul de **Poison** toutes les 0,6 s (5 au maximum, 8 s, environ 1 dégât par seconde et par cumul au niveau 1, régénération et potions moitié moins efficaces). Les flammes appliquent la **Brûlure** (5 s, environ 4 dégâts par seconde au niveau 1). Les effets continuent après la sortie de la zone ; les potions ne les retirent pas. Six **sources sacrées** sont réparties sur la carte, signalées par une flèche bleue vers la plus proche : y passer avec une altération la retire, puis la source se tarit et réapparaît 30 s plus tard ailleurs. En Défense, les zones blessent aussi le cryopode. Le mod de héros **Antidote** réduit la durée des altérations de 15 % par rang.

## Progression en partie

Chaque ennemi lâche un cristal d'expérience (goule et chauve-souris 1, archer 2, brute 5, Gardien 30). Passer du niveau n au suivant demande 120 × 1,32^(n−1) + 20 × n points (120 ou plus au départ, puis 32 % de plus à chaque niveau : 140, 198, 269, 356, 464, 601, 775…), soit environ 5 niveaux sur une première manche au niveau 1, 8 au niveau 40 et 13 en trois manches, mesuré par le bot (historique : 18 puis 9 sur la première manche). En coopération, l'expérience de chaque cristal est divisée par le facteur de nombre de monstres (1 + 0,4 × (joueurs − 1)), car chacun la reçoit de tous les monstres. À chaque niveau, le jeu se met en pause et propose 3 bonus au hasard ; ils durent jusqu'à la fin de la mission.

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

**Ultime** (4e bouton au-dessus de la compétence, touche F) : se charge en abattant 60 ennemis, un Gardien compte pour 10 ; la réduction de recharge ne s'applique pas. Guerrier, **Colère du Titan** : onde de choc de 320 de rayon (dégâts de compétence ×3, recul) et 3 s d'invulnérabilité. Archer, **Pluie d'acier** : pendant 3 s, 4 flèches toutes les 0,12 s sur les ennemis à moins de 450 (×0,7). Magicien, **Pluie de météores** : 3 météores de 150 de rayon (×3), en priorité sur les Gardiens. Pluie d'acier et météores peuvent être critiques (dégâts critiques appliqués depuis la v123), la Colère du Titan jamais. La portée des compétences agrandit ces zones. Bonus de niveau : **Fureur** (−15 % d'ennemis à abattre, 3 fois) et **Apothéose** (+30 % de dégâts de l'ultime, 3 fois).

**Frénésie critique** : 8 coups critiques en 5 s déclenchent un bonus de 5 s (allongé par la durée des compétences), puis 3 s de recharge. Archer : projectiles 50 % plus rapides et +1 transpercement ; Magicien : +50 % de rayon d'explosion ; Guerrier : +30 % de portée de frappe et +25 % de vitesse d'attaque. Sous la barre de vie, « Critiques n / 8 » dès 3 critiques, puis « Frénésie · n s » ; étincelles dorées autour du héros.

**Tremblements** : complément à celui des coups reçus, la compétence secoue légèrement l'écran (3,5 px), l'ultime davantage (7 px, 11 px pour la Colère du Titan), chaque météore 6 px, chaque flèche de la Pluie d'acier 1,5 px, et le déclenchement de la Frénésie 3 px.

## Butin, équipement, mods, reliques et fabrication

**Chances de butin par ennemi tué**

| Butin | Goule | Chauve-souris | Archer | Brute | Gardien |
| --- | --- | --- | --- | --- | --- |
| Or | 65 % × 1 | 35 % × 0,6 | 65 % × 1,5 | 65 % × 5 | 8 pièces, 50 au total |
| Équipement | 1,2 % | 0,4 % | 1,6 % | 7 % | 2 (rare + magique) |
| Relique | 0,3 % | 0,1 % | 0,4 % | 2,5 % | 1 |
| Mod | 0,6 % | 0,2 % | 0,8 % | 6 % | 2 |
| Potion | 0,5 % | 0,5 % | 0,5 % | 5 % | 1 |

Au niveau L, les chances d'équipement, de relique et d'arme sont multipliées par 1 + 0,25 × (L − 1). La valeur de l'or est multipliée par 1 + 0,6 × (L − 1) et sa chance de tomber par 1 + 0,05 × (L − 1). Dès le niveau 2, des armes communes, magiques ou rares du héros tombent aussi des ennemis. Chaque Gardien donne +1 équipement tous les 10 niveaux, +1 relique tous les 12 niveaux et une arme avec une chance de 15 % × ce multiplicateur. Chaque Gardien donne aussi 25 essence.

Équipement : armures (vie), amulettes (critique), bottes (vitesse) et anneaux (dégâts), en plus de l'arme, soit 5 emplacements. Un objet trouvé s'équipe tout de suite depuis la pause (il est alors gardé même en cas de mort) ou part au coffre (taille illimitée, filtre par type, tri par rareté, rang, niveau ou date, recherche par nom ou affixe, défilement continu, armes non portées incluses) à la sortie. Un objet peut être verrouillé (cadenas) : il ne peut plus être recyclé ni sacrifié. Le recyclage se fait uniquement dans Arsenal › Recycler.

**Affixes d'équipement (v80)** : chaque statistique du jeu a désormais son affixe, soit 37 affixes possibles sur armure, amulette, bottes et anneau (hors pouvoirs abyssaux et Embrasement fixe, réservés aux armes). Nouvelles : Embrasement en % des dégâts (4–13), Ralentissement à l'impact (5–10), Éclair en chaîne (3–6), Exécution sous 30 % (12–45), Dégâts contre Gardiens (8–31), Dégâts sous 50 % de vie (10–37), Dégâts de l'ultime (10–22), Charge de l'ultime (−4 à −9 %, plafond −60 %), Protection sous 30 % (8–15), Soin des potions (10–25), Antidote (8–16), Aura de lenteur (5–10), Durée des compétences (8–16), Recharge de l'esquive (5–10), Portée de ramassage (10–25), Or (8–28), Expérience (5–12), Chances de butin (3–7) et Vol de vie (1–3, Guerrier seulement depuis la v123). Les affixes d'arme deviennent aussi possibles sur l'équipement, limitées à la classe jouée au moment du drop : Portée de frappe (Guerrier, 6–20), Rayon d'explosion (Magicien, 10–35), +1 projectile (Archer, Magicien) et +1 transpercement (Archer), ces deux dernières avec un poids de tirage de 0,35. Valeurs données du niveau 1 au niveau 100 avant le multiplicateur de rareté. Les sources Exécution, Gardiens, Expérience, Butin, Fureur et Apothéose s'additionnent maintenant aux bonus de niveau au lieu d'être écrasées. Le score de comparaison des objets tient compte des nouvelles statistiques de combat et de survie ; les affixes utilitaires n'y comptent pas. Alertes de butin et recherche par affixe couvrent les 37.

### Progression v91 : raretés, reliques, fabrication et rang

**Principe** : plus un objet est rare, plus il est fort, à niveau égal. Les monstres ne lâchent que du Commun, du Magique et du Rare ; tout ce qui est Légendaire ou plus rare se fabrique avec 3 fragments trouvés dans les reliques de sa rareté. Les objets Prime (et Prime de givre) sont supprimés.

| Rareté | Affixes | Affixes × | Base × | Source | Fabrication |
| --- | --- | --- | --- | --- | --- |
| Commun | 1 | 1 | 1 | butin | — |
| Magique | 2 | 1,1 | 1,05 | butin | — |
| Rare | 3 | 1,2 | 1,1 | butin (chance min(30, 8 + 0,15 × niveau d'objet) % + 1,5 par palier de Tourment) | — |
| Légendaire | 4 | 1,35 | 1,2 | fragments, relique Ossuaire | 300 or |
| Ancestral | 5 | 1,55 | 1,3 | fragments, relique Ancestrale | 600 or |
| Sanguin | 6 | 1,8 | 1,4 | fragments, relique Sanguine | 1 000 or |
| Abyssal | 6 + 1 pouvoir | 2,1 | 1,5 | fragments, relique Abyssale | 1 500 or |

**Reliques** : une par rareté, selon la difficulté : Ossuaire en Normal, Difficile, Cauchemar ; Ancestrale en Tourment I à V ; Sanguine en Tourment VI à X, ou Abyssale (part par palier dans le tableau des rythmes). Le niveau de mission plafonne la rareté (Ancestrale dès le niveau 30, Sanguine dès 40, Abyssale dès 45 ; sinon la relique du dessous), sauf pour les cibles capturées, qui donnent la relique de la difficulté à tout niveau (v117). Chaque relique ouverte en mission (Fissure : 30 réactifs, moins en Tourment) donne, à la réussite, 1 fragment d'un objet de sa rareté (2 si éclatante, raffinage 50 essence), pris parmi les armes du héros de cette rareté et les objets des reliques de cette rareté ; les objets de givre seulement si la relique est ouverte dans les Abîmes gelés. Tirage pondéré 1 + 0,5 × fragments déjà réunis ; le fragment donné est un manquant s'il en reste. +25 essence par relique, œufs 8 / 12 / 15 / 25 %. **Reliques forgées** : 3 reliques d'un même type (20, 40, 80, 150 essence) → 1 relique forgée de ce type, pour l'objet choisi, qui garantit un fragment de cet objet. La fusion vers le type au-dessus est supprimée.

**Objets des reliques** (RGEAR, 36) : 2 modèles par emplacement et par rareté, affixes fixes, valeurs tirées au niveau de fabrication : Légendaire L1–L8 (4 affixes), Ancestral N1–N8 (5), Sanguin S1–S10 (6, dont 2 de givre), Abyssal B1–B10 (6 + pouvoir, dont 2 de givre). Un objet fabriqué prend le niveau d'objet de la plus haute mission réussie : 1 + (meta.maxL − 1) × 4 ; meta.maxL monte à chaque sortie réussie.

**Armes** : 14 par héros, 2 par rareté, dégâts de base croissants (Archer 6–7, 10–11, 15–16, 21–24, 28–31, 35–38, 42–46 ; Guerrier 6–7 à 46–50 ; Magicien 6–7 à 42–45) et autant d'affixes que l'équipement de même rareté (les abyssales ont 6 affixes + un pouvoir). Commun, Magique et Rare tombent des monstres et Gardiens (arme du héros, rareté tirée comme le butin) ; Légendaire et au-dessus se fabriquent. Une arme obtenue alors qu'on la possède déjà devient un double (meta.wcp).

**Rang (remplace l'amélioration à l'essence)** : rang 1 à 10, stocké dans it.up et meta.wlv (0 à 9), +10 % aux statistiques par rang (×1,9 au rang 10). Deux exemplaires identiques (même modèle : nom de base pour le butin, identifiant pour les objets des reliques ; même rareté ; même rang) fusionnent en un seul du rang au-dessus. L'exemplaire gardé conserve affixes et niveau ; le plus faible des doubles libres (ni porté, ni verrouillé, ni scellé) est sacrifié. Armes : les doubles fusionnent avec l'arme possédée, puis entre eux, jusqu'au plus haut rang possible. Interface : bouton Fusionner dans la fiche ancrée, nouveau sous-onglet Forge › Fusion (liste des fusions, « Tout fusionner »), pastille Forge = fusions possibles. Recyclage : 2 × éclats de rareté × 2^(rang − 1) essence pour un objet (éclats 1, 2, 4, 8, 16, 24, 36), 20 × (rareté + 1) × 2^(rang − 1) pour une arme ; recycler une arme qui a des doubles met le meilleur double à sa place.

**Arsenal › Recettes** (ex-Armurerie) : puces Armes du héros, Légendaire, Ancestral, Sanguin, Abyssal, Prêts, Autres classes. Chaque carte : affixes (noms, valeurs au niveau de fabrication), relique source et difficulté, fragments, Fabriquer (ou « Fabriquer un double »), Tout fabriquer. Arsenal › Armes : rang, doubles, Fusionner. Par héros (v110 ; puce du Coffre de l'Arsenal, ou bouton Par héros de l'onglet Héros) : l'arme et les emplacements ouverts de chacun des trois héros, le héros joué en premier ; toucher l'objet d'un autre héros ouvre sa fiche avec « Équiper sur… » ; un héros sans rien de porté a un conseil.

**Équilibrage vérifié** (score « Équiper le meilleur », médiane, armure au niveau d'objet 97) : Commun 222, Magique 235, Rare 249, Légendaire 412, Ancestral 479, Sanguin 535, Abyssal 759. DPS d'arme seule (Archer) : Commun 31–32, Magique 41–44, Rare 55–93, Légendaire 129–142, Ancestral 175–189, Sanguin 247–306, Abyssal 411–486 ; même ordre sans chevauchement entre raretés pour les trois héros.

**Migration des sauvegardes (meta.v5)** : objets Prime retirés contre 40 × (rareté + 1) essence + la moitié de l'essence d'amélioration ; amélioration +n → rang 1 + ⌊n / 11⌋ (max 10), avec remboursement de la moitié de l'essence investie ; fragments d'objets qui ne se fabriquent plus → 10 essence chacun ; anciennes reliques : Cendre et Ossuaire → Ossuaire, Sanguine → Sanguine, Abysse et forgées Prime → Abyssale (file d'ouverture convertie) ; anciens Légendaires et Ancestraux gardent leurs 4 affixes ; meta.maxL = max(niveau de départ, niveau débloqué).

**Emplacements à débloquer (v93)** : 7 cases au total (arme, armure, amulette, bottes, anneau, puis anneau 2 et dos), communes à tous les héros. Déblocage dans l'ordre, onglet Héros › Emplacements : anneau 2 = 12 fragments de harnais + 2 000 or ; dos = 25 fragments + 5 000 or, après l'anneau 2 (meta.slotU, meta.hfrag). Fragments de harnais : seulement sur les Gardiens, chance 3 % × (1 + 0,5 × min(3, difficulté)) × (1 + 0,05 × palier de Tourment) : 3 % Normal, 4,5 % Difficile, 6 % Cauchemar, 7,5 % à 11,25 % en Tourment I à X ; ils tombent comme un fragment (drop part avec hf) et comptent à la réussite. Anneau 2 : un anneau va dans une case d'anneau vide, sinon à la place de celui qu'il améliore le plus (tgtKey) ; « Équiper le meilleur » remplit les deux cases avec deux anneaux différents ; la comparaison se fait face à l'anneau remplacé. Dos (statistique de base : réduction des dégâts, 2 + ⌊niveau / 25⌋ × 1,5) : uniquement en rareté Abyssale, 2 modèles dans les reliques Abyssales, Cape du Néant (Vie, Réduction, Régénération, Protection sous 30 %, Vol de vie, Soin des potions, Égide du Néant) et Ailes de l'Éclipse (Vie, Réduction, Régénération, Antidote, Aura de lenteur, Recharge de l'esquive, Moisson) ; jamais dans le butin. Un objet de dos se fabrique avant le déblocage mais ne s'équipe qu'après. Pas de rééquilibrage des monstres pour l'instant (choix de conception).

**Chercher par affixe (v96)** : dans Forge › Affixes, la liste couvre tous les objets (portés, coffre, verrouillés, armes possédées). Une affixe ouverte liste jusqu'à 10 objets, du plus fort au plus faible, chacun avec deux boutons : Source (détruit, prend cette affixe ; depuis v98, tout objet peut être source, armes comprises, sauf les objets verrouillés (v99 : Cible seulement, le bouton Source n'est pas affiché) et les armes de départ ; une arme détruite est remplacée par son meilleur double, sinon le héros reprend son arme de départ) et Cible (reçoit l'affixe). Le choix s'affiche en pastille « − Source » ou « + Cible », et la barre du bas propose Fusionner ou Remplacer comme avant. **Ouverture de relique (v95)** : plus de bannière ni de message en mission.

**HUD Gardien (v97)** : en Survie, le compte à rebours du Gardien n'est plus affiché ; « Gardien en approche » apparaît sous le niveau dans les 10 s qui précèdent son arrivée. En Défense, la ligne affiche « Sortie vague n », remplacée par « Gardien en approche » pendant la pause avant une vague à Gardien ; correctif : pendant une pause, n se calcule sur la vague suivante (« Sortie vague 6 » après avoir continué depuis la vague 3). La Capture garde le minuteur du Gardien.

**Parcours du joueur nouveau (v100, js/tut.js)** : carte en tête de l'onglet Héros, une étape à la fois sur six, objectifs cochés automatiquement, un conseil et un lien vers le guide (#debuter-n). Étapes : 1 Premiers pas (réussir une mission ; porter armure, amulette, bottes, anneau) ; 2 Premiers achats (Force et Vigueur ; équiper un familier) ; 3 Monter en niveau (mission 10 réussie ; un objet au rang 2) ; 4 Premières reliques (ouvrir une relique ; fabriquer un légendaire ; mission 20 réussie) ; 5 Difficile et Cauchemar (réussir en Cauchemar ; débloquer l'anneau 2) ; 6 Tourment (réussir en Tourment ; fabriquer un ancestral ; débloquer le dos). Suivi : meta.wins, meta.bestDiff, meta.bestTorm (à chaque mission réussie), meta.relOpened (reliques ouvertes). « Masquer le parcours » (meta.tutOff), « Réafficher le parcours » en bas de l'onglet Héros ; la carte disparaît quand tout est fait. Guide : nouvelle section « Bien débuter » en tête, une sous-section par étape (quoi faire, quand passer à la suite, que faire si on bloque). Solo uniquement ; la coop garde sa section.

**Messages en mission (v101)** : pendant une mission (inMission = partie lancée et non terminée), toast() et banner() n'affichent plus rien sauf les messages marqués keep : arrivée des Gardiens (Survie, Capture, Brèche ; en Défense, bannière « Vague n · un Gardien arrive » sur les vagues de sortie), événements des jumeaux de la Brèche, connexion et déconnexion en coopération, bascule de secours du rendu WebGL. Supprimés en mission : élite en approche et vaincue, Gardien vaincu, ultime, Frénésie critique, source sacrée, vagues ordinaires, capture, extraction, niveau suivant, message de départ (Fissure, Brèche), sceau trouvé, à terre et relevé en coop, confirmations de la pause. Les sons et effets visuels restent. **Régénération (bonus de niveau)** : +1,5 % de la vie maximale par seconde par rang (au moins 3 PV/s), au lieu de +1,5 PV/s ; 3 rangs maximum. Mod Second souffle (v102, statistique regenPct) : +0,5 % de la vie maximale par seconde par rang (0,5 % au rang 0, 2 % au rang 3, surcharge comprise), avec au moins 3 PV/s par point de pourcentage, soit jamais moins que l'ancien +1,5 PV/s par rang.

**Déplacement à la souris (v103)** : sur ordinateur (pointeur de type souris), le héros va vers le pointeur : direction = héros à l'écran → pointeur, zone morte de 26 px autour du héros, vitesse pleine à 116 px. Clic gauche maintenu = immobile (les attaques des tireurs vont plus vite à l'arrêt) ; relâcher reprend le déplacement. Le héros s'arrête aussi quand le pointeur quitte le canvas (survol d'un bouton). Le clavier (ZQSD, flèches) s'ajoute. Curseur en croix sur le jeu. Réglages › Déplacement à la souris : Suivre le pointeur (par défaut, SET.mouse) ou Joystick (ancien glisser à la souris). Le tactile garde le joystick flottant.

**Capture, cible à terre (v104)** : une fois à terre (e.downed), la cible n'est plus visée ni touchée : dmgEnemy l'ignore (aucun dégât, critique, brûlure ni effet), elle sort de la grille de collision (les projectiles la traversent), et elle est exclue du ciblage automatique, des projectiles à tête chercheuse, des éclairs en chaîne et des météores (les familiers l'ignoraient déjà). Les attaques se tournent vers les autres monstres ; la capture (2,5 s à côté) ne change pas.

**v105 · Tests et nettoyage (aucun changement de jeu).** Une suite unique de 43 tests automatiques (`tools/tests/run.mjs`, environ 45 s, `--quick` sans la coopération, filtre par nom) couvre : démarrage et écrans du Camp, butin et raretés, reliques, fabrication et fusion, coffre et recyclage, affixes, emplacements, missions (alertes Gardien, capture), contrôles souris et clavier, sauvegarde (export, import, migration v90), parcours et régénération, coopération. Elle est lancée avant chaque version. Le code a été nettoyé : fonctions, actions et 75 styles hérités qui ne servaient plus ont été retirés, sans effet visible (vérifié par comparaison d'images). La suite a révélé un défaut, corrigé : la fusion gardait un exemplaire verrouillé de plus bas niveau plutôt que le meilleur ; l'ordre est désormais porté, puis plus haut niveau, puis verrouillé.

**Simulateur de progression (outil, aucun changement de jeu).** `tools/progression/` remplace l'ancien banc `tools/sim/`. Un bot joue des carrières complètes en Survie avec les vraies règles du jeu. Entre deux missions, il suit le Parcours au Camp. Il monte d'un niveau par sortie réussie d'au moins deux manches et change de palier au plafond prévu. `report.mjs` produit le rapport (jalons, courbes, butin par palier) et `ablate.mjs` décompose la puissance du héros. Premier constat (v105) : le Tourment X niveau 50 est atteint en 6 h 30 à 8 h de jeu, avec 1 à 3 missions perdues, et en 1 h 55 en allant droit au Tourment à bas niveau. Les causes sont le flux de reliques (60 par mission en Normal, 600 à 900 en Tourment X), les 4 à 5 Gardiens toutes les 16 à 25 s en Tourment, une rareté de relique qui ne dépend que de la difficulté, et l'or sans usage après 20 minutes (Bonus de la Forge au maximum dès la 3e mission, 30 à 50 millions d'or en fin de carrière). Les mods sont au maximum avec leurs étoiles vers 2 h, et le familier au rang 5 niveau 20 vers 2 h 20. La fusion de rang garde les objets de monstres en fin de jeu : une armure rare au rang 7 bat une armure abyssale au rang 1. Sans les rangs, le Magicien de fin de parcours passe de 149 000 à 57 000 dégâts par seconde. Rapport complet : \[Banc de progression\](https://claude.ai/artifact/RHghgXbGi8dXcvR52goLnS).

**Réglages proposés après la simulation (appliqués et recalibrés en v106, voir ci-dessous).** Rythme visé : Tourment I vers 10 h, Tourment X vers 40 à 60 h, abyssal complet vers 80 h. Chaque réglage sera vérifié au simulateur avant mise en ligne.

1. Flux de reliques ÷ 5 environ : reliques des monstres ÷ 5 (goule 0,3 % → 0,06 %), plus de relique en plus tous les 12 niveaux sur les Gardiens, 25 réactifs par relique au lieu de 10, 10 % d'ennemis corrompus au lieu de 18 %.
2. Tourment : 2 à 3 Gardiens toutes les 40 à 50 s (au lieu de 4 à 5 toutes les 16 à 25 s), vie des Gardiens ×1,5.
3. Rareté des reliques liée au niveau : Ancestrale en Tourment I et niveau ≥ 30, Sanguine en Tourment VI et niveau ≥ 40, Abyssale en Tourment VI et niveau ≥ 45 ; sinon la relique du palier inférieur.
4. Or : fusion de rang à 100 × 2^rang × (rareté + 1) or, fabrication ×3 (Légendaire 900, Abyssal 4 500), Bonus de la Forge sur 10 niveaux.
5. Rang maximum des objets de monstres : Commun 3, Magique 4, Rare 5 ; Légendaire et au-dessus : 10.
6. Étoiles de mod : copies demandées ×2 ; œufs par relique ouverte ÷ 3.

**v106 · Rythme de progression réglable.** Tous les réglages de vitesse de progression sont regroupés dans `BAL_PRESETS` (haut de `js/data.js`), avec deux rythmes : `rapide` (par défaut) et `long` (environ 80 h). C'est un réglage de développement, pas un choix du joueur (aucun écran ne le propose) : on change de rythme en modifiant la ligne `BAL_MODE`.

**v107 · Rythmes dans des fichiers.** Chaque rythme est un fichier : `js/rythmes/rapide.js` (rythme publié, par défaut) et `js/rythmes/long.js` (fin de jeu visée vers 80 h). Chacun définit `RYTHME` avec les valeurs du tableau ci-dessous, commentées ; `BAL_PRESETS` et `BAL_MODE` disparaissent de `data.js`. Le rythme chargé est celui de la balise `<script src="js/rythmes/….js">` d'`index.html`, placée avant `data.js` (et la liste `CORE` de `sw.js`). Pour un nouveau rythme, on copie un fichier et on change ses valeurs. Le simulateur charge n'importe quel fichier : `--rythme long` ou un chemin. Le joueur ne choisit toujours pas le rythme.

**v132 · Trois sorts et trois ultimes par héros.**

- Chaque héros choisit un sort et un ultime parmi trois (Héros › Sorts et talents) ; 2e au rang 3 de maîtrise, 3e au rang 6. Nouveaux : Tir du chasseur, Bond arrière, Œil du faucon, Tempête de carreaux (Archer) ; Bond écrasant, Cri de guerre, Rempart, Fureur du berserker (Guerrier) ; Éclair en chaîne, Transfert, Blizzard, Surcharge arcanique (Magicien). Détail dans la section Héros.
- Toutes les statistiques comptent pour tous les sorts (`spellHit`) ; les sorts d'origine gagnent les éléments et la brûlure.
- Nouveaux effets faits avec les anneaux, éclats, carreaux et éclairs déjà dessinés : le rendu des héros, des ennemis et des sorts d'origine ne change pas. Icônes du HUD selon le choix ; la jauge de recharge suit la recharge réelle (`P.novaMax`).
- Message en fin de mission quand la maîtrise ouvre un nouveau sort. Tuile « Sorts et talents ». Suite de tests `18_spells` (5 tests). Tests : 107.

**v131 · Séjour après l'objectif, accueil, mises à jour.**

- **Séjour après l'objectif** : une fois l'objectif réalisé, chaque minute de plus dans la mission ajoute 10 % au butin des monstres et des élites (objets, fragments d'armes, mods, reliques), jusqu'à +100 %. Réglages `BAL.stayLoot` et `BAL.stayLootMax` dans les deux rythmes ; `G.objT`, `stayMin()`, `stayBonus()` et `objDone()` dans `data.js`, appelé par `roundDone()` et `capReward()`. Coopération : chaque joueur tire son butin avec son propre bonus, sans changement de protocole.
- **Accueil** : sans la bannière Parcours, les boutons latéraux remontent ; la taille du héros (`--hs`, calculée dans `shell.js`) suit la hauteur libre de la scène, de 160 à 340 px et 80 % de la largeur au plus, avec son halo et son socle. « Meilleure survie » passe sur l'écran Mission : sur l'accueil, le bouton Combat de la barre la cachait.
- **Mises à jour** : `sw.js` contourne le cache HTTP du navigateur (GitHub Pages garde les fichiers 10 minutes) : `cache: 'reload'` à l'installation, `cache: 'no-cache'` pour la page, les scripts et le CSS. Une version publiée arrive dès qu'elle est en ligne. Nouvelle suite `17_pwa` (serveur local Node). Tests : 102.

**v130 · Nouvelle interface (style AAA mobile).** La logique de jeu ne change pas, seuls l'habillage et la navigation changent. Le rendu en mission (héros, ennemis, effets : `js/render.js`, `js/game.js`) est identique à la v129.

- **Barre de 5 onglets** en bas (`#tabbar`, `js/shell.js`) : Héros, Arsenal, Combat (l'accueil), Forge, Collection ; touches 1 à 5. `campTab` garde ses valeurs (equip, arsenal, forge, mods, pets, relics) ; Collection regroupe Mods, Familiers et Reliques (`collLast`). Un onglet verrouillé montre un cadenas.
- **Accueil Combat** : avatar et bourse, bannière Parcours, familier et reliques à gauche, Coop et Guide à droite, héros au centre (flèches ou glissé pour changer), carte de mission, bouton Combattre.
- **Écran Mission** (`#mission`, ouvert par la carte de mission) : mode, lieu, niveau, difficulté en segment, Tourment, reliques et Lancer (`#startBtn2`).
- **Onglet Héros** : le héros dessiné au centre avec les fonctions du jeu (`heroPaint`), les 7 emplacements autour, les statistiques clés, puis les tuiles Talents, Prestige et Apparence (`heroSub`). Les talents quittent Forge › Bonus.
- **Équipements enregistrés** : sur la vue principale de l'onglet Héros, sous les tuiles, comme en v129 (`setsHtml`, section `#setsSec`) ; le bouton Équipements y fait défiler (`gosets`). La tuile Apparence ne garde que les couleurs.
- **Arsenal** (ex-Armurerie) : Coffre (puces Tout le coffre / Par héros), Armes, Recettes, Recycler (`arsView`). **Forge** : Affixes, Fusion, Bonus, Sceaux (`forgeSub`).
- **En mission** : HUD, cartes de montée de niveau avec catégorie et rangs, résumé du sac en pause (`#bagSum`), portail animé, écran de défaite (classe `is-dead`).
- Habillage dans `css/aaa.css`, chargé après `css/game.css`. Polices Cinzel, Barlow et Barlow Condensed ; Alegreya Sans reste chargée pour le texte du canevas. Tests : 100.

**v129 · Objets portés dans la grille de Forge › Affixes et fusion.** Les sections « Équipé » et « Autres armes » disparaissent (`xfSlot` retiré) : une seule grille « Tes objets » (`afGrids`) montre tout, comme le coffre de l'onglet Héros, avec les onglets Tout, Portés, Arme, Armure… (`invList('affix')` et `invToolbar` traitent maintenant `affix` comme `equip`). Les objets portés par le héros choisi viennent en tête ; ceux des autres héros portent leur initiale (`whoTag`). Clés : `s:<id>` coffre, `g:<emplacement>` porté par le héros choisi, `o:<id>` porté par un autre héros (nouveau, lu par `xfGet`), `w:<arme>` (`afKey`). Un objet d'un autre héros peut être cible ou source d'un transfert (« porté par le Guerrier » dans la liste des objets qui portent l'affixe, `xfAll`) ; détruit comme source, il libère l'emplacement de ce héros. En mode Transférer, la grille passe avant « Chercher par affixe ». Tests : 100.

**v128 · Bouton ⇄ : intervertir source et cible.** Entre les deux rôles de Forge › Affixes et fusion, un bouton rond (`cx-swap`) échange Source et Cible si on s'est trompé. Transfert (`xfswap`) : la cible devient la source et l'inverse ; avec un seul objet choisi, il change de rôle. L'affixe choisie reste si la nouvelle source la porte. Désactivé, avec la raison en info-bulle (`xfSwapWhy`), quand la cible ne peut pas être détruite (verrouillée, arme de départ) ou n'a pas d'affixe à donner. Fusion (`fzswap`) : la cible et la source s'échangent, et les choix d'affixes et de niveau suivent les exemplaires (lettres a et b inversées dans `fzc.sel`) : le résultat est le même, seul l'exemplaire gardé change, avec son sceau, son verrou ou sa place sur le héros. Désactivé (`fzSwapWhy`) quand la cible n'est pas libre (portée, verrouillée, scellée) ou pour une arme. Correction : après une fusion, l'écran repassait au choix de la source (`fzRole` restait `b`), et un objet porté ne pouvait plus être choisi comme cible ; chaque remise à zéro de `fzc` remet `fzRole` à `a`. Tests : 99.

**v127 · Forge › Affixes et fusion : un seul onglet, fusion au choix des affixes, transfert « cible d'abord ».**

- **Onglet** : les sous-onglets Affixes et Fusion n'en font plus qu'un, « Affixes et fusion », avec deux puces d'opération (`afmode`) : Fusionner deux exemplaires (`forgeSub='fuse'`) et Transférer une affixe (`forgeSub='affix'`). Chacune suit son déblocage, renommé Forge · Fusion de rang (mission de niveau 5) et Forge · Transfert d'affixe (niveau 12 ou un légendaire). L'onglet revient à la dernière opération (`afLast`). Les deux partagent les grilles Équipé, Autres armes et Coffre avec les onglets Tout, Arme, Armure… (`afGrids`), dont les cases suivent l'opération (`xfSlot`, `xfCell`).
- **Fusion** : on touche la cible. Seuls les objets qui ont un double libre de même rang sont actifs : même modèle, même rareté, même rang ; libre = ni porté, ni verrouillé, ni scellé. Ses doubles s'affichent (« Fusionne avec X · rang n », avec leur niveau) et un exemplaire d'un autre rang est signalé. Le plus faible est proposé comme source (`fzSetA`). À gauche, la fiche de la source : chaque affixe se touche pour la prendre (`fzk k|b`), et la ligne de niveau prend niveau, stat de base, nom et biographie (`fzbase`). À droite, la cible au rang suivant : affixes gardées, retirées ou ajoutées ; toucher une affixe de la cible la retire ou la remet (`fzk k|a`). Plafond `fzCap` = le plus grand de l'affixe de rareté et du nombre d'affixes des deux exemplaires ; un pouvoir abyssal est toujours gardé (`fzValid`). « Tout prendre » choisit la meilleure valeur de chaque affixe (`fzBest`, le choix de départ, aussi utilisé par Tout fusionner) ; « Garder la cible telle quelle » reprend la cible (`fzKeepA`). Une arme n'a pas d'affixe par exemplaire : la fusion combine ses doubles. Sans sélection, le pied propose Tout fusionner, ou « Fusionner ces raretés · n » avec les puces de rareté (`fuseR`). L'ancienne liste des fusions et son tri (`fuseSort`) disparaissent. La fiche (bouton Fusionner, `fuse1`) ouvre l'écran avec l'objet en cible et y revient après (`campBack`).
- **Transfert, cible d'abord** : le premier objet touché devient la cible (`xf.pick='dst'` par défaut). La case Source porte une liste déroulante (`#xfAff`, `xfAffSel`) des affixes que les autres objets peuvent donner (`xfPool` : équipés, coffre, armes possédées, sans pouvoir abyssal), en deux groupes : « Déjà sur la cible · fusion » et « Nouvelle affixe · ajout » (« remplace une affixe » si la cible est pleine). Chaque option donne le nombre d'objets sacrifiables et la meilleure valeur ; une affixe que seuls des objets verrouillés ou des armes de départ portent est grisée. Une boîte lisible (nom, puis fusion ou ajout, valeur et nombre) recouvre la liste native. L'affixe choisie liste tous les objets qui la portent, du plus fort au plus faible (`xfCands`), avec le résultat sur la cible : « fusion → valeur », « remplace → valeur », « ajout », « cible pleine : remplace une affixe » ou « déjà plus fort ». Les objets verrouillés et les armes de départ sont grisés. Toucher une ligne la prend comme source (`xfsrc`) ; la grille, en mode source, n'active plus que les objets qui portent cette affixe. Les règles de `xfState` ne changent pas (il prend maintenant l'état en paramètre pour l'aperçu de chaque ligne). Après un transfert, la cible reste choisie ; choisir un objet dans la grille ramène en haut de l'écran (`xfJump`, aussi en fusion). Depuis la fiche, « Recevoir une affixe » suit 1 Cible, 2 Affixe, 3 Source. Partir de la source reste possible.
- Guide : sections Affixes et Fusion de rang réécrites, deux captures refaites. Tests : 97.

**v126 · Recyclage : les doubles d'une arme gardée.** Une arme gardée (verrouillée, portée par un héros, ou arme de départ) ne se recycle jamais. Si elle a des doubles, sa case dans le Recyclage les représente seuls : cadenas, « ×N » = nombre de doubles, clé `d:<arme>` (`dupOf`). Les recycler vide `meta.wcp` et laisse l'arme à son rang ; chaque double rend 20 × (rareté + 1) × 2^rang essence (`wDupEss`). Une arme verrouillée sans double reste grisée. Les doubles des armes portées apparaissent aussi. La fiche d'une arme gardée qui a des doubles propose « Recycler les doubles · N », et son texte de verrou le dit. Tests : 93.

**v125 · Recyclage : une arme part avec tous ses doubles.** Avant, recycler une arme n'en détruisait qu'un exemplaire, et le meilleur double prenait sa place. La même arme revenait donc dans la liste après « Tout sélectionner » puis Recycler, autant de fois qu'elle avait de doubles. Maintenant, l'arme et tous ses doubles sont détruits ensemble (`meta.wcp` vidé, puis `wDestroy`). Chaque exemplaire rend 20 × (rareté + 1) × 2^rang essence, l'arme à son rang et chaque double au sien (`wRecyAll`). La case montre « ×N » (l'arme et ses doubles) ; la confirmation dit « Recycler 5 objets (25 exemplaires avec les doubles) ». Pour garder l'arme, on fusionne ses doubles. Tests : 92.

**v124 · Téléphone : palier de Tourment et en-tête du Camp ; Fusion par rareté.**

- Palier de Tourment (feuille Difficulté) : le sélecteur − / + ne rétrécit plus (`.cx-stepper{flex:none}`) ; avant, le + sortait du sélecteur jusqu'à 412 px de large. C'est le libellé qui passe à la ligne.
- En-tête du Camp : l'aide et la croix sortaient de l'écran jusqu'à 390 px avec peu d'or, et même à 430 px avec 30 millions. Les montants sont maintenant courts (`fmtBig` : 98 765, 123 k, 30,5 M, arrondis vers le bas ; montant exact en info-bulle). Jusqu'à 460 px, l'or et l'essence s'empilent, le titre des feuilles passe à 21 px et les boutons de l'en-tête à 40 px. Aucun bouton coupé sur les écrans vérifiés de 320 à 430 px.
- Forge › Fusion : puces de rareté (Toutes, puis une par rareté présente, avec le nombre de fusions ; plusieurs au choix, `fuseR`) et tri Par rareté (la plus rare d'abord, par défaut) ou Par prix (la moins chère d'abord, `fuseSort`). Armes et objets sont dans une seule liste. Avec un filtre, le pied devient « Fusionner ces raretés · n » et ne fusionne que ces raretés (`fuseAll(fuseOk)`).
- Tests : 92 (suite interface).

**v123 · Critiques des ultimes, vol de vie réservé au Guerrier, durée des ralentissements.** Trois écarts relevés en écrivant les [Formules des statistiques](https://claude.ai/artifact/MzhmUehH8qKTgZ2mCHyQZH).

- Pluie d'acier et Pluie de météores : un critique applique maintenant les dégâts critiques (`critHit`). Avant, il s'affichait et comptait pour la Frénésie critique et la Faille, sans dégâts en plus. La Volée et la Colère du Titan restent sans critique.
- Vol de vie réservé au Guerrier (`AFF.leech.cls`) : l'affixe ne tombe plus pour l'Archer et le Magicien. Sur un objet des reliques fabriqué par eux, elle est remplacée par la première affixe absente de l'objet parmi Régénération, Protection sous 30 %, Soin des potions, Antidote, Vie, Réduction (`AFF_SUB`, `rgAff`). L'Arc de la Veuve rouge perd son vol de vie (2 %) contre +35 % d'Exécution.
- Affixe sans effet pour la classe jouée (`affOff`) : vol de vie et portée de frappe hors Guerrier, rayon d'explosion hors Magicien, projectiles hors Archer et Magicien, transpercement hors Archer. Le coffre étant commun, elle peut se retrouver sur un autre héros : elle est ignorée dans les statistiques et par « Équiper le meilleur », barrée sur la fiche avec « sans effet · Guerrier seulement », grisée dans la comparaison (sans compter comme une perte) et étiquetée dans Chercher par affixe. Les objets déjà obtenus ne changent pas.
- Durée des compétences (affixe, Persistance, Prolongation) : allonge aussi tous les ralentissements, comme le dit son texte (`slowT`) : à l'impact 2 s, après un gel 1,5 s, explosion glacée 2,5 s, Colère du Titan 2 s, éclats de glace 1,5 s, familier 1,2 s, Nova 2,5 s. Un nouveau ralentissement ne raccourcit plus un ralentissement plus long en cours (`slowE`).
- Guide : vol de vie « Guerrier », affixes sans effet, Arc de la Veuve rouge. Outil : `report.mjs --base ancien/ --base-label v105` compare deux bancs de progression. Tests : 89 (suite stats).

**Banc de progression v123** (outil, aucun changement de jeu ; [rapport comparé au banc v105](https://claude.ai/artifact/RHghgXbGi8dXcvR52goLnS)). Le Tourment X arrive toujours vers 6 h 30 à 7 h 10, mais la fin de jeu abyssale a ralenti : Guerrier 8 h 36 (v105 : 6 h 54), Magicien 15 h 37 (6 h 48), Archer pas en 24 h (8 h 11). Reliques 4 à 15 fois moins nombreuses, 13 à 28 Gardiens tués par mission en Tourment X (54 à 104), presque aucun en Tourment VI à IX pour l'Archer et le Guerrier, or entièrement dépensé. L'Archer et le Magicien gardent des objets Rares à +2 projectiles : l'affixe vaut 1 × rareté × (1 + 0,05 × palier), arrondi, soit 2 dès le Tourment V en Rare. Bot corrigé (`career.js`) : il fabrique, débloque les emplacements, achète les talents et prend du prestige (la moitié de l'or au plus) avant « Tout fusionner », qui vidait l'or depuis que la fusion est payante.

**v119 · Reliques partagées, nettoyage du code.**

- Reliques partagées en coopération : quand un joueur ouvre une relique en mission, chacun des autres joueurs de la mission reçoit l'ouverture d'une relique du même type, tirée pour son propre héros (fragments de sa classe, 2 si éclatante, 25 essence, chance d'œuf), sans dépenser de relique. Message `relo` (type, éclatante, joueur), relayé par l'hôte aux autres invités ; `G.shared`, accordé à la réussite par `grantRelic(id, rad, free)` comme le reste du butin (perdu en cas d'échec ou de retour au Camp). Une relique forgée se partage comme une relique ordinaire de sa rareté. Pause et fin de mission : ligne « Partagées par les partenaires », détail « ouverte par … ». `meta.relOpened` ne compte que ses propres reliques.
- Nettoyage, sans changement visible (vérifié sur 42 écrans comparés à la v118 : HTML, styles calculés, images, rendu du jeu en mission ; relecture indépendante avec 34 états et 2 400 images simulées) :
  - CSS : 60 règles mortes retirées (classes absentes du code : anciens composants modale, bouton de compétence, grille d'affixes…), 93 déclarations écrasées plus bas par le même sélecteur, 5 règles regroupées ; 100 → 91,5 Ko.
  - JS : code mort retiré (relicsOwned, filtre et pages d'affixes jamais affichés, setFrom, variables locales inutilisées, écouteurs de sauvegarde du Camp, message de départ de mission jamais affiché et qui pouvait planter si une relique s'ouvrait dans la seconde, `meta.v5ess`) ; `catch` sans variable.
  - Factorisation : vue de la caméra et flèches hors écran communes aux deux rendus (`camView`, `offArrows`, `distTxt`), retour de coup (`hitFx`, `riftTry`), ligne de tir (`losClear`), état de départ de la coopération (`netFresh`, `netTicks`), aides du Camp (`wearGear`, `slotCan`, `cellIn`, `wishOf`, `statPairs`), recyclage d'arme par `wDestroy`, `pressFx`, `pxFree`.
  - Seul effet visible : le familier d'un partenaire suivait son maître deux fois par image (calcul en double) ; il bat désormais des ailes à la même vitesse que le sien.
- Tests : 85 (reliques partagées à trois joueurs) ; erreurs de page avec leur pile.

**v118 · Couleurs du héros, zoom.**

- Couleurs du héros (Héros › Couleurs du héros) : cape, bordure et capuche choisies pour chaque classe, dans la sauvegarde (`meta.look[classe]` = 3 couleurs ; absent = couleurs d'origine de `CLS`). Puces Guerrier, Archer, Magicien ; nuancier de 14 pastilles par partie et une pastille pour n'importe quelle couleur (`input type=color`) ; aperçu dessiné par `pPlayer` ; « Couleurs d'origine ». Rendu standard et WebGL (textures par jeu de couleurs, `plTex`, 24 au plus en cache).
- Coopération : les couleurs du héros joué passent dans `hello` et `roster` (`look`) et se mettent à jour en direct ; un joueur d'une version plus ancienne voit les couleurs d'origine. Protocole inchangé (v9).
- Zoom (Réglages › Écran, ouvert aussi depuis la pause) : curseur de 70 % à 140 %, multiplié au zoom automatique de l'écran, effet immédiat, gardé dans `crypte-set` (`SET.zoom`). Le HUD, les flèches et les boutons gardent leur taille ; la zone d'apparition des monstres suit la vue (juste hors de l'écran).
- Tests : 84 (couleurs par classe, aperçu, rendu, couleurs en coopération, zoom et HUD inchangé).

**v117 · HUD sans chevauchement, Capture en chaîne.**

- HUD en mission : rien ne se recouvre de 320 à 430 px de large. Sous la 1re ligne, trois colonnes : les altérations empilées à gauche ; au centre le bandeau d'objectif, puis les barres du Gardien et du cryopode, empilées dans un même conteneur (`.hudmid`) ; à droite, sous le sac, la pastille des reliques ouvertes (icône à la couleur de la relique en cours, anneau des réactifs, nombre ouvert). Libellés courts : Portail dans, Vague suivante, Ennemis restants, Traque la cible n, Capture la cible n, Vers l'extraction, Reste dans la zone. Les flèches hors écran restent sous le HUD (bord haut mesuré, `arrowK`).
- Capture en chaîne : après chaque capture, tant qu'on ne s'est pas extrait, une nouvelle cible apparaît 5 s plus tard (`CAP_NEXT`), loin du héros. La zone d'extraction s'ouvre à la 1re capture et ne bouge plus. Le niveau affiche le nombre de captures ; dessous, la distance de l'extraction ou « Cible n dans x s ». Coopération : compteur et délai passent dans l'état du mode ; chacun reçoit sa relique à chaque capture.
- Relique de capture : celle de la difficulté et du Tourment (Ossuaire hors Tourment, Ancestrale en I à V, Sanguine ou Abyssale en VI à X), sans le niveau minimum de mission (`relicDrop(true)`). Les autres reliques (monstres, élites, Gardiens, fins de manche) et leurs taux ne changent pas.
- Récupération des affixes : la recherche par affixe liste tous les objets qui la portent, sans « … et N autres ».
- Tests : 82 (audit de chevauchement du HUD à 4 largeurs × 3 missions, flèches sous le HUD, capture en chaîne, relique de capture, cible suivante en coopération).

**v116 · Bonus du Tourment, retour d'une autre appli.**

- Tourment : moins de réactifs par palier et avec le séjour dans la mission, plus de reliques avec le séjour (voir Bonus du Tourment, section Missions). Accélère la fin de jeu ; le simulateur n'a pas été relancé.
- Changer d'appli ou éteindre l'écran ouvre le sac en mission (pause ; en coopération le monde continue pour les autres). Au retour (`visibilitychange`, `pageshow`), le moteur WebGL est reconstruit à neuf (`renewRender` : nouveau contexte, textures et décor refaits), sinon rendu standard : corrige l'écran noir après un passage en arrière-plan.
- Tests : 78.

**v115 · Meilleure arme, course de connexion.**

- « Équiper le meilleur » (Camp) prend aussi la meilleure arme possédée du héros, chacune comparée avec ses propres mods et sa maîtrise (`bestPlan(e, pool, true)`) ; la pastille de l'onglet Héros la compte. Une arme trouvée n'est toujours pas équipée toute seule.
- Correctif coopération : si la liaison s'ouvrait avant la fin de `setRemoteDescription`, l'hôte repassait le joueur de « ouvert » à « connexion » ; il lançait alors la mission sans lui, l'invité restant « en attente ». L'état « connexion » ne remplace plus un joueur déjà ouvert (QR codes et code à 4 chiffres). C'était la cause des échecs intermittents des tests de coopération.
- Relais : `ORIGINES` accepte une adresse avec chemin, sans `https://` ou en majuscules (elle compte pour son site).
- Tests : 75.

**v114 · Coupures expliquées, reconnexion automatique.**

- Le relais du jeu est le mode par défaut même si `js/relais.js` manque ou est vide (`RELAY_CF` dans `js/net.js`) ; `js/relais.js` peut le remplacer, ou mettre `off` pour les QR codes seuls.
- Raison de chaque déconnexion (`bye` : jeu fermé ou rechargé ; `end` : l'hôte a fermé la partie ; `close`/`failed` : liaison coupée ; `timeout` : 20 s sans nouvelles en mission), affichée dans Coop (« Dernière déconnexion, à HH:MM : … »). Chaque appareil signale son passage en arrière-plan (message `bg`) pour expliquer une coupure qui suit (écran en veille, autre appli).
- Invité venu par un code : reconnexion automatique à la même partie après une coupure (jusqu'à 6 essais espacés), sauf si l'hôte a fermé la partie ou l'a retiré.
- Rechargement (mise à jour, page rechargée) : la partie est gardée pour l'onglet 10 minutes (`sessionStorage`) ; l'hôte rouvre sa salle sous le même code (même secret), l'invité la rejoint.
- Correctif : une liaison `failed` chez un invité connecté le laissait « connecté » à tort ; elle déclenche maintenant la déconnexion et la reconnexion.
- Tests : 74.

**v113 · Relais en ligne.** Le relais est déployé sur Cloudflare (Workers Builds depuis le dépôt GitHub, dossier racine `relais`, nom du Worker `crypte-relais` identique à `wrangler.toml`) à l'adresse `crypte-relais.cryptcendre.workers.dev`, branchée dans `js/relais.js`. À régler dans le tableau de bord : la variable `ORIGINES` avec l'adresse GitHub Pages du jeu. Tests : 72.

**v112 · Protéger les parties à code (toujours 4 chiffres).**

- Relais : variable `ORIGINES` (sites autorisés, séparés par des virgules, `*.domaine` pour les sous-domaines ; vide = tous), réglée dans le tableau de bord et gardée au déploiement (`keep_vars = true`). Frein des codes faux : 20 codes sans partie en 10 minutes depuis une même adresse IP bloquent ce réseau 10 minutes, même avec un bon code (Durable Object « garde:\<ip> », même classe que les salles). Nouveaux refus `origin` et `slow`, expliqués dans le jeu.
- Hôte : annonce de chaque arrivée ; « Retirer » à côté d'un joueur (message `kick` ; en mission, l'invité garde son butin) ; « Nouveau code » (salle neuve, les joueurs connectés restent) ; « Fermer l'accès » puis « Rouvrir avec un nouveau code ». Protocole du jeu NET\_V = 9.
- Tests : 72 (protections du relais, retrait d'un joueur, nouveau code, accès fermé, site refusé).

**v111 · Rejoindre avec un code à 4 chiffres.** L'hôte touche « Créer une partie » et reçoit un code ; les autres le tapent (connexion dès le 4e chiffre), scannent son QR code ou ouvrent le lien `#coop=<code>`, et arrivent tout seuls, plusieurs à la fois.

- Relais (`relais/`) : Cloudflare Worker et Durable Objects, offre gratuite, une salle par code (`src/salle.js`). Il ne fait passer que l'offre de l'hôte et la réponse de chaque invité (les mêmes codes SDP qu'en mode manuel), puis l'invité le quitte. Rien n'est stocké. Premier message de chaque appareil : `hi`, auquel la salle répond (`ok`, `taken`, `nohost`, `full`). Battement `ping`/`pong` sans réveiller la salle.
- Hôte : salle ouverte tant que sa partie existe (un joueur peut arriver en mission), reprise sous le même code après une coupure (secret `k`), code retiré si un autre hôte l'occupe. Bouton Coop de l'accueil : « Coop · 1234 » tant que personne n'est arrivé.
- Invité : messages clairs pour un code inconnu, une partie complète, une version différente, un relais injoignable ou une connexion directe impossible. Le lien `#coop=` est retiré de l'adresse, et fonctionne aussi dans un onglet où le jeu tourne déjà.
- Sans relais (`js/relais.js` vide, ou relais injoignable) : la connexion par QR codes, inchangée, sous « Sans internet » ; l'hôte d'une partie à code peut aussi inviter ainsi un joueur sans internet.
- Adresse du relais : `RELAY_DEFAULT` dans `js/relais.js` (à remplir après `npx wrangler deploy`) ; `localStorage['crypte-relay']` la remplace pour les tests (`off` : QR codes seulement).
- Tests : 70, dont un relais local qui fait tourner `salle.js` (`tools/tests/relais-local.mjs`, suite « relais ») et deux tests de coopération à trois par code.

**v110 · Lisibilité : recharges, sortie de mission, équipement par héros.** Trois retours de jeu : on ne voyait plus les recharges, ni le bouton pour quitter une mission, ni sur quel héros un objet est porté.

- Compétences : en recharge, l'icône s'assombrit, les secondes restantes s'affichent au centre et un anneau à la couleur de la compétence se remplit (`--cd`, `.skt`, classe `cool`). Au moment de l'utiliser, le bouton s'enfonce et s'éclaire 260 ms ; prête, il garde son halo.
- Pause : « Retour au Camp » devient un bouton en toutes lettres à côté de « Reprendre » ; Guide et Réglages passent en haut, à côté de la croix. La confirmation est inchangée.
- Armurerie › Par héros (nouvelle puce, et « Équipement des héros » depuis l'onglet Héros) : l'arme et les emplacements ouverts de chacun des trois héros, le héros joué en premier. Toucher un objet ouvre sa fiche ; celui d'un autre héros propose « Équiper sur… ». Un héros sans rien de porté a un conseil. Avec une sauvegarde d'avant la v106, tout ce qui était porté est allé au héros joué en dernier, ce qui donnait l'impression que la fonction manquait.
- HUD robuste : un élément absent de la page (page en cache plus ancienne que les scripts) ne bloque plus le reste du HUD ; le bouton Retour au Camp est recréé s'il manque.
- Tests : 66 (recharges, HUD sans un élément, bouton de sortie, vue Par héros).

**v109 · Noms et prestige en coopération.** En coopération, chaque joueur apparaît sous son nom, précédé du niveau de prestige du héros qu'il joue.

- Compte (Réglages, en tête) : identifiant unique tiré une fois (`meta.pid`, 5 signes sans 0, O, 1 ni I) et nom choisi (`meta.pname`, 16 signes au plus : lettres, chiffres, espace, - \_ ' . ; nettoyé par `cleanName`). Sans nom, le joueur s'appelle `Joueur-XXXXX`. Les deux font partie de la sauvegarde.
- Protocole v8 : `hello` et `roster` portent le nom et `prOf(cls).lv` ; ils sont renvoyés à chaque changement de héros, de nom ou de prestige (`netMe`), sans couper la connexion.
- Affichage : pastille dorée du prestige à gauche du nom dans la liste des joueurs, les messages d'arrivée et de départ, et l'étiquette au-dessus de chaque partenaire en mission (Canvas et WebGL). Une étiquette qui en chevauche une autre monte d'un cran ; en WebGL, les signes absents de la police bitmap sont retirés du nom.
- Tests : 62 (un test de coopération en plus : identifiant par défaut, nom nettoyé, mise à jour en direct, salon et mission des deux côtés).

**v108 · Déblocages progressifs.** Le Camp et les choix de mission s'ouvrent au fil de la progression, dans l'ordre du Parcours, pour apprendre une mécanique à la fois (`js/unlock.js`, table `UNL` : clé, condition, ce qu'il faut faire, explication, page du guide). Au départ : Héros, Armurerie › Coffre, Survie en Normal. Une vue verrouillée montre ce qu'elle contiendra et comment l'ouvrir ; un déblocage s'annonce en fin de mission, puis par une carte « Nouveau » au Camp (pastille « ! » sur l'onglet) jusqu'à « Compris ». Un déblocage est définitif (`meta.unl`).

| Quand | Ce qui s'ouvre |
| --- | --- |
| 1re mission réussie | Forge › Bonus, talents (Héros › Talents), Collection › Familiers |
| 2 missions réussies | Mods de l'arme |
| 3 missions réussies | Reliques |
| 4 missions réussies | Arsenal › Recycler |
| Mission de niveau 5 | Forge › Fusion, mission Défense |
| Premier fragment de relique | Arsenal › Recettes |
| Mission de niveau 8 | Mods du héros et aura ; Arsenal › Armes (ou dès une 2e arme) |
| Mission de niveau 10 | Mission Capture |
| Mission de niveau 12 | Difficile ; Forge › Affixes (ou dès un objet légendaire) |
| 6 missions réussies | Équipements enregistrés |
| Fragment de harnais ou réussite en Difficile | Emplacements |
| Réussite en Difficile | Cauchemar |
| Mission de niveau 15 | Abîmes gelés, alignement des mods |
| Réussite en Cauchemar | Tourment I ; chaque palier réussi ouvre le suivant |
| Sceau ou éclat (Brèche) | Forge › Sceaux |

Compatibilité des sauvegardes : une sauvegarde sans `meta.unlV` (v107 et plus anciennes, import compris) qui a de la progression (une mission réussie, un niveau de mission au-dessus de 1, un objet) garde tout ouvert (`meta.unlAll`), comme avant ; une partie neuve part verrouillée. En coopération, l'invité suit la mission de l'hôte même si lui ne l'a pas encore débloquée. Le simulateur respecte les déblocages. Tests : 61 (suite « unlock » ; les autres suites ouvrent tout par défaut, `newPage(…, { locked: true })` pour un joueur neuf).

| Réglage | rapide | long | v105 |
| --- | --- | --- | --- |
| Reliques des monstres (× chance v105, sans bonus de niveau) | ×0,2 | ×0,1 | ×1 × bonus de butin |
| Relique d'élite | 10 % | 5 % | 30 % × bonus de butin |
| Relique en plus sur un Gardien | jamais | jamais | 1 tous les 12 niveaux |
| Part d'Abyssales en Tourment VI, puis par palier | 3 % +1 % | 1,5 % +0,5 % | 15 % +5 % |
| Réactifs par relique · ennemis corrompus | 30 · 10 % | 40 · 8 % | 10 · 18 % |
| Gardiens en Tourment (par vague · intervalle) | 2 puis 3 · 40 → 30 s | 2 · 50 → 40 s | 4 à 5 · 25 → 16 s |
| Vie des Gardiens en Tourment | ×1,5 | ×2 | ×1 |
| Niveau requis : Ancestrale, Sanguine, Abyssale (pas pour une cible capturée) | 30, 40, 45 | 30, 40, 45 | aucun |
| Fabrication · Bonus de la Forge (prix) | ×2 · ×3 | ×4 · ×6 | ×1 |
| Fusion de rang (or) | 40 × 2^rang × (rareté + 1) × (1 + niveau/20) | base 120 | gratuite |
| Rang max des objets de monstres (commun, magique, rare) | 3, 4, 5 | 2, 3, 4 | 10 |
| Copies par étoile de mod · œufs · harnais | ×2 · ×0,4 · ×1 | ×3 · ×0,25 · ×0,6 | ×1 |

Mesures au simulateur (rapide) : Guerrier en fin de jeu (Tourment X niveau 50, dos, 5 pièces abyssales) en 10 h 20 ; Magicien en Tourment X vers 16 h 30. Le premier réglage butait l'Archer et le Magicien sur le Tourment : « Équiper le meilleur » pèse désormais attaque et survie ensemble (moyenne géométrique, 0,55 / 0,45), l'Archer passe à 130 PV et 8 % d'armure, le Magicien à 115 PV et 8 %. À 6 h de jeu, le Magicien atteint le Tourment VIII avec 1 mission perdue (avant : Tourment IV, 6 perdues), l'Archer le Tourment VII avec 4 (avant : Tourment VI, 6).

**v106 · Héros, Armurerie, HUD, coopération.**

- Chaque héros a son équipement (`meta.gearBy[classe]`, `meta.gear` désigne celui du héros choisi). Un objet n'est porté que par un héros à la fois ; l'équiper sur un autre le lui retire. Une ancienne sauvegarde donne son équipement au dernier héros joué.
- Équipements enregistrés : jusqu'à 6 par héros, renommables (onglet Héros). « Porter » reprend chaque objet dans le coffre ou sur un autre héros et signale les objets introuvables.
- Armurerie › Coffre : les objets portés y figurent, avec une pastille A, G ou M à la couleur du héros (en plus du cadenas), et un filtre « Portés ». Le recyclage ne montre jamais un objet porté.
- HUD : plus aucun minuteur de Gardien (Capture comprise), seulement « Gardien en approche ». Sous le niveau, l'icône de relique (couleur de la relique en cours, anneau des réactifs) et le nombre de reliques ouvertes.
- Pause › Retour au Camp, avec confirmation : le butin du niveau est perdu, les reliques équipées ne sont pas consommées.
- Coopération (protocole v7) : changer de héros ne coupe plus la connexion (le message de changement oubliait la version). L'hôte choisit Survie, Défense, Capture ou Brèche sur l'écran d'accueil, sans couper la connexion ; les invités voient la mission choisie. La Brèche devient une 4e mission, déverrouillée dès qu'un joueur est connecté. En Défense le cryopode est commun ; en Capture, n'importe quel héros capture et valide l'extraction, chacun reçoit sa relique. Les invités jouent à la difficulté de l'hôte. Un invité qui retourne au Camp rejoint la mission suivante sans se reconnecter.
- Logo de l'application remplacé (icônes 192, 512, adaptative, iPhone).
- Tests : 56 (nouvelle suite « héros », 2 tests de coopération en plus).

**Comparaison et Équiper le meilleur** : la fiche d'un objet (coffre ou butin de la partie) liste chaque statistique qui change avec sa nouvelle valeur et l'écart (▲ vert, ▼ rouge) face à l'objet porté. « Équiper le meilleur » (onglet Héros, et dans la pause pour le butin de la partie) choisit pour chaque emplacement l'objet qui maximise puissance + 0,3 × vie ; les objets remplacés partent au coffre.

Pastilles de la barre d'onglets (v130) : Héros (améliorations d'équipement, emplacements à débloquer, talents à apprendre, points de prestige à placer ou prestige achetable), Arsenal (objets fabricables maintenant), Forge (fusions possibles, sinon améliorations achetables), Collection (reliques non équipées quand la file est vide, œufs à faire éclore). Un déblocage nouveau affiche « ! » jusqu'à « Compris ».

Onglet Reliques : grille de tuiles (gemme à la couleur du type, nombre d'intactes et d'éclatantes ✦, pastille « n équipées », ★ si un objet qu'elle contient attend son dernier fragment), filtrable par type et Forgées. Toucher une tuile ouvre sa fiche : les objets qu'elle contient avec tes fragments (n / 3, ★ un fragment de plus, prêt à fabriquer), puis les réglages d'équipement et le raffinage. Viennent ensuite les reliques forgées (fusion par type, choix de l'objet), la file d'ouverture, et « Où tombent les reliques » replié.

Équiper par type (onglet Reliques) : au-dessus de la collection, des puces choisissent le type affiché : Toutes, Ossuaire, Ancestrale, Sanguine, Abyssale, et Forgées quand tu en possèdes. « Tout équiper · type (n) » en bas ajoute à la file toutes les reliques de ce type pas encore équipées ; « Retirer · type (n) » enlève de la file celles de ce type.

**Transfert d'affixe** (Forge › Affixes) : on touche d'abord l'objet qui reçoit (la Cible, premier choix depuis v127), puis l'affixe dans la liste déroulante de la case Source et l'objet sacrifié dans la liste des objets qui la portent ; on peut aussi toucher Source ou Cible puis un objet dans la grille « Tes objets » (objets portés, armes et coffre, filtrables ; les objets non valides sont grisés). On choisit un équipement source non verrouillé, une de ses affixes, puis une cible (arme possédée, équipement porté ou du coffre). Si la cible a déjà l'affixe, elle n'est remplacée que par une valeur strictement plus forte ; sinon elle est ajoutée s'il reste de la place (1 à 4 affixes selon la rareté), ou remplace une affixe choisie. La source est détruite et le transfert coûte 50 essence × (rareté de la source + 1). La valeur transférée est celle affichée sur la source, amélioration comprise ; les améliorations suivantes de la cible l'augmentent ensuite. Deux cartes côte à côte montrent la source et l'aperçu de la cible : ligne retirée barrée en rouge, ligne ajoutée en vert.

**Fusion d'affixe** : quand la cible a déjà l'affixe prise sur la source, le transfert devient une fusion par défaut. Nouvelle valeur = la plus forte des deux + 50 % de la plus faible (valeurs affichées, amélioration comprise ; +1 pour projectiles et transpercement). 3 fusions au maximum par affixe et par objet ; coût 100 × (rareté de la source + 1) × (numéro de la fusion) essence. Si la source est plus forte, deux puces permettent de choisir « Fusionner » ou « Remplacer » (le remplacement remet le compteur de fusions à 0). L'aperçu indique « fusion n / 3 ».

**Chercher par affixe** (Forge › Affixes, juste après l'aperçu et avant les objets) : liste de toutes les affixes présentes sur tes objets non verrouillés (portés et coffre), filtrable en Offensives (dégâts, vitesse d'attaque, critique, dégâts critiques, dégâts et portée des compétences…), Défensives (vie, réduction des dégâts, régénération, vol de vie) et Utilitaires (vitesse de déplacement, recharge). Chaque ligne montre la meilleure valeur, l'objet qui la porte, le nombre d'objets et la valeur de ta cible si elle l'a déjà. Toucher la ligne déplie les objets classés du plus fort au plus faible ; « Prendre » désigne cet objet comme source avec cette affixe déjà choisie, puis passe au choix de la cible.

Alertes de butin (Forge › Affixes, repliées en bas) : on coche les affixes recherchées (groupées en Offensives, Défensives, Utilitaires) et l'option Armes nouvelles (active par défaut, ancienne option Légendaires). En mission, quand un objet tombe avec une affixe cochée dont la valeur dépasse la meilleure valeur de cette affixe sur l'équipement porté (rang compris ; toujours si aucune pièce portée ne l'a), ou une arme que le héros ne possède pas encore, l'écran s'illumine brièvement (au plus un flash toutes les 0,35 s) et l'objet au sol porte un grand faisceau doré avec un anneau qui pulse jusqu'à son ramassage.

**Mods** : deux builds séparés dans l'onglet Mods, plus un build Familier dans son propre onglet (décrit plus bas). Le **build d'arme** est attaché à chaque arme (4 cases, capacité 10 + Catalyseur jusqu'à +12 + maîtrise de l'arme jusqu'à +10) : changer d'arme change ses mods. Le **build de héros** est attaché à la classe (3 cases au départ, jusqu'à 6 en payant 15, 30 puis 50 fragments de schéma, + 1 case d'Aura ; capacité 10 + Réacteur jusqu'à +12 + maîtrise du héros jusqu'à +10 + bonus d'Aura). Un mod coûte sa valeur de base + son rang en capacité ; la fusion coûte 10 × 2^rang × (rareté + 1) essence. Un doublon devient une copie du mod (affichée ×n en bleu sur sa carte), sauf quand le mod ne peut plus être surchargé : il rapporte alors 8, 16 ou 24 essence, et les copies se dissolvent au même taux. Surcharge : un mod au rang maximum gagne jusqu'à 5 étoiles, chacune +12 % de sa valeur (+60 % à 5), pour (étoile n) n copies et 50 × (rareté + 1) × n essence ; sa capacité monte de 1 aux étoiles 2 et 4. Refusée si elle dépasse la capacité du build où le mod est équipé. La Pointe de diamant (perforation entière) ne se surcharge pas. Valeurs affichées arrondies (entier au-dessus de 10). Le tableau ci-dessous liste les mods d'arme.

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

**Familiers** (js/pet.js, Collection › Familiers : collection, œufs, fusion, puis le build de mods du familier ; pastille = œufs à faire éclore ; le bouton ? ouvre #familiers ; l'onglet Mods ne montre plus que Héros et Arme, le sac en mission garde les trois) : un familier équipé à la fois, partagé par tous les héros, qui suit le héros en mission. Instance {t, rang 1–5, niveau 1–20, xp}. Premier œuf offert ; une relique ouverte en mission contient un œuf avec 8 % (Ossuaire), 15 % (Sanguine) ou 25 % (Abysse) de chances. L'éclosion donne un des 4 familiers au hasard, au rang ★. **Fusion** : 2 familiers identiques et de même rang → 1 du rang au-dessus (★★★★★ max), garde le meilleur niveau et la meilleure xp, coûte 100 essence × rang. Niveau : xp = ennemis abattus de la mission (comme la maîtrise), 50 × niveau par palier. Puissance = (1 + 0,35 × (rang − 1)) × (1 + 0,05 × (niveau − 1)).

| Familier | Rôle | Effet de base |
| --- | --- | --- |
| Corbeau de cendre | Attaque | Toutes les 1,2 s, frappe l'ennemi le plus proche à moins de 260 px : 60 % des dégâts d'arme × puissance, critique 5 % |
| Feu follet | Soutien | Soigne 1 % de vie max par seconde × puissance, ×2 à l'arrêt |
| Golem de poche | Défense | Toutes les 7 s, attire 4 s les monstres à moins de 160 px (hors Gardiens et cibles), qui le visent à la place des héros ; 30 % des dégâts d'arme toutes les 0,5 s à ceux qui le touchent |
| Furet pilleur | Butin | Portée de ramassage × (1 + 0,6 × puissance), +5 % × puissance de chances de butin |

**Mods de familier** (type p, build de Collection › Familiers) : 3 cases, 4 dès ★★★ ; capacité 8 + 2 × rang + niveau / 2. Mêmes polarités, fusion, surcharge et alignement que les autres builds (l'alignement ne remet rien à 0). Communs : Crocs (+15 % dégâts par rang, 5 rangs), Vivacité (+10 % cadence, 5), Carapace (+15 % durée d'attirance, 3), Lien (+12 % portée et vitesse, 3), Partage de vie (2 % des dégâts du familier rendus en vie par rang, 3), Écho élémentaire (applique brûlure et ralentissement de l'arme, 1). Réservés : Bec acéré (corbeau, +8 % critique), Nuée (corbeau, +1 cible), Lumière apaisante (follet, +20 % soin), Purification (follet, retire poison, brûlure et gelure toutes les 6 s), Provocation (golem, +20 % rayon), Épines (golem, +25 % dégâts renvoyés), Flair du furet (+3 % butin), Poches profondes (furet, va chercher objets, mods et reliques à 420 px). Un mod réservé posé avec un autre familier est inactif. Les mods de familier n'entrent jamais dans les stats du héros.

Coop : le paquet de position du héros porte \[type de familier, x, y, attirance\] (indices 9 à 12) ; l'hôte fait aussi attirer les monstres par le golem d'un partenaire. NET\_V = 6.

| État | Commune (chacune) | Peu commune (chacune) | Rare |
| --- | --- | --- | --- |
| Intacte | 25,33 % | 11 % | 2 % |
| Éclatante (raffinage : 50 essence) | 16,67 % | 20 % | 10 % |

Sauvegarde : « Exporter » télécharge aussitôt crypte-sauvegarde-AAAA-MM-JJ.json, avec « Partager le fichier » (Web Share) sur téléphone et « Copier le JSON » en secours. L'import « Depuis un fichier » le relit tel quel, après confirmation.

**Armurerie, deux vues (v82)** : puces Recettes (toutes les recettes, comme avant) et Mes armes (compteur = armes possédées). Mes armes liste les armes possédées de toutes les classes, héros courant en premier, de la plus rare à la moins rare : niveau +n, dégâts de base et affixes réels (amélioration et affixes ajoutées comprises), maîtrise, nombre de mods posés. Pour le héros courant : DPS estimé avec l'équipement porté et écart en % avec l'arme équipée, bouton Équiper.

Fin de manche et objectif (v81, mis à jour v91) : le résumé de sortie affiche des compteurs : équipements = total + nombre par rareté, reliques = total + nombre par type (Ossuaire, Ancestrale, Sanguine, Abyssale), armes ramassées = total + nombre par rareté. Un bandeau d'objectif centré sous le HUD donne l'étape, la valeur en grand et une jauge : Survie = temps avant le portail (orange pulsant sous 15 s) ; Capture = traque la cible n (distance), capture la cible n (%), vers l'extraction (distance), reste dans la zone (%) ; Défense = vague suivante ou ennemis restants, jauge = vie du cryopode.

Écran de fin de mission réussie (v83, mis à jour v91) : deux encadrés de compteurs. Butin rapporté : équipements (total + par rareté), reliques ramassées (total + par type), armes ramassées. Reliques ouvertes : total + par type, essence gagnée (25 par relique), fragments (nombre et nombre d'objets différents), objets prêts à fabriquer (par nom), œufs de familier, reliques non ouvertes. Le détail relique par relique est replié sous « Détail des n reliques », puis la maîtrise.

**Rythme des sorties (v84)** : Survie, portail toutes les 2 minutes (LEVEL\_T = 120 s, 180 avant). Défense, sortie toutes les 3 vagues (DEF\_N = 3, 5 avant), avec le Gardien de la vague de sortie ; le HUD affiche « Sortie vague 3, 6, 9… ». Chaque manche rapporte toujours une relique (et un équipement magique ou mieux en Défense), donc environ 1,5 × plus de reliques de manche par heure. Moins d'expérience par manche de Survie (environ 4 niveaux sur la première). L'écran de mission réussie reprend le résumé de l'écran du portail (or, équipements par rareté, reliques par niveau, fragments, ennemis, durée de la mission), suivi du bilan des reliques ouvertes.

| Pouvoir | Effet | Plafond |
| --- | --- | --- |
| Moisson | Chaque ennemi tué : +3 à 4 % de dégâts pendant 5 s, cumul ×10 | 6 % par cumul |
| Égide du Néant | Chaque ennemi tué : 8 + 0,6 × niveau de l'objet en bouclier | 30 % des PV |
| Onde du Vide | Toutes les 5 s : 250 à 350 % des dégâts à tous les ennemis dans 200 px (agrandi par la portée des compétences) | — |
| Jugement | Les ennemis sous 8 à 12 % de vie meurent sur le coup, hors gardiens et cible | 20 % |
| Faille | 20 à 30 % de chances qu'un critique rebondisse sur 3 ennemis à 70 % des dégâts | 60 % |
| Chasse royale | +35 à 55 % de dégâts contre gardiens et élites | — |

Un pouvoir abyssal est lié à son objet : il ne peut être ni transféré, ni fusionné, ni remplacé dans l'onglet Forge › Affixes. Il n'apparaît pas dans la recherche par affixe ni dans les alertes de butin, et il ne monte pas avec le rang. Les objets Abyssaux se recyclent comme les autres dans Forge › Recyclage (36 éclats de rareté) ; verrouille ceux que tu veux garder. « Équiper le meilleur » compte une valeur estimée pour chaque pouvoir.

**Messages de butin** : aucun message n'apparaît plus au ramassage (objet, relique, mod, fragment, potion) ni à la chute d'un objet recherché ; le butin se consulte dans la pause (pastille sur le sac). Restent les sons, le flash réglable et le faisceau au sol.

## Progression permanente

Le Camp (v130) a 4 onglets dans la barre du bas, autour de Combat (l'accueil) : Héros (équipement porté, statistiques, équipements enregistrés, emplacements ; tuiles Talents, Prestige, Apparence), Arsenal (Coffre, Armes, Recettes, Recycler), Forge (Affixes, Fusion, Bonus, Sceaux), Collection (Mods, Familiers, Reliques). Deux monnaies : l'or (améliorations, talents, fabrication, prestige) et l'essence (mods, raffinage, reliques forgées, transfert d'affixes, prestige).

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

**Prestige du héros** (Héros › Prestige) : se débloque quand les 8 améliorations permanentes sont au maximum. Il est propre à chaque héros et n'a pas de limite de niveau. Le niveau n+1 coûte 500 + 250 n or et 30 + 15 n essence et donne 1 point à placer, redistribuable gratuitement. Par point : Vitalité +2 % de vie, Puissance +2 % de dégâts, Vivacité +1 % de vitesse d'attaque, Acuité +0,5 % de critique (max 40 points), Brutalité +3 % de dégâts critiques, Arcanes +3 % de dégâts de compétence, Ténacité −0,5 % de dégâts subis (max 40), Sang-froid −0,5 % de recharge (max 30), Foulée +0,5 % de vitesse (max 30), Opulence +2 % d'or, Envergure +3 % de portée des compétences (max 50 points), Déflagration +3 % de rayon d'explosion (max 50). Les plafonds généraux (critique 75 %, armure 60 %, recharge 50 %) s'appliquent toujours.

## Coopération

De 2 à 4 joueurs jouent ensemble (Survie, Défense, Capture ou Brèche), chacun sur son appareil, reliés en étoile à l'hôte en pair à pair (WebRTC), sans compte. Chaque joueur apparaît sous son nom, précédé du niveau de prestige du héros qu'il joue. L'hôte relaie dans son instantané les héros et tirs de tous (place 0 à 3, couleur de place). Un battement toutes les 2 s hors mission évite que le silence du salon soit pris pour une déconnexion.

**Mise en relation par code à 4 chiffres** (v111, `js/net.js`, relais dans `relais/`) : l'hôte touche « Créer une partie » et ouvre une salle au relais sous un code tiré au hasard ; les invités tapent le code (connexion dès le 4e chiffre), scannent le QR code de l'hôte ou ouvrent le lien `#coop=<code>`, et arrivent tout seuls, plusieurs à la fois, jusqu'à 3. Le relais ne fait passer que l'offre WebRTC de l'hôte et la réponse de chaque invité, puis l'invité le quitte ; la partie passe ensuite directement d'un appareil à l'autre. L'hôte garde sa salle ouverte tant que sa partie existe (un joueur peut arriver en mission) et la reprend sous le même code après une coupure.

**Relais** : Cloudflare Worker et Durable Objects (offre gratuite), une salle par code, rien de stocké, déployé depuis GitHub (Workers Builds, dossier racine `relais`). Adresse dans `js/relais.js` : `wss://crypte-relais.cryptcendre.workers.dev`. Premier message de chaque appareil `hi`, réponse `ok`, `taken`, `nohost`, `full`, `origin` ou `slow` ; battement `ping`/`pong` sans réveiller la salle.

**Protections** (v112) : variable `ORIGINES` du Worker (sites autorisés, réglée dans le tableau de bord, gardée au déploiement) ; frein des codes faux (20 codes sans partie en 10 minutes depuis une même adresse IP bloquent ce réseau 10 minutes) ; côté hôte, annonce de chaque arrivée, « Retirer » un joueur, « Nouveau code », « Fermer l'accès ».

**Sans relais** (sans internet, relais injoignable, ou `js/relais.js` vide) : les mêmes codes s'échangent à la main, en QR code ou copier-coller, une invitation à la fois (« Sans internet : connexion par QR codes »).

| Sujet | Règle |
| --- | --- |
| Autorité | L'hôte simule les monstres, leurs tirs, zones et apparitions et envoie un instantané toutes les 50 ms ; l'invité interpole les positions |
| Héros | Chacun simule son héros, ses compétences et ses tirs avec ses propres statistiques ; les tirs du partenaire sont affichés |
| Dégâts de l'invité | Calculés chez lui (modificateurs compris) et envoyés à l'hôte, avec ralentissements, gel, brûlure et recul |
| Coups reçus | Chacun gère ses contacts, projectiles et zones ; les monstres visent le héros debout le plus proche |
| Monstres | Par joueur en plus : vie +50 %, nombre +40 %, plafond +50 (à 4 : vie ×2,5, nombre ×2,2, plafond 400) ; corrompus si l'un des joueurs a une relique équipée |
| Butin | Instancié : chaque mort de monstre génère un butin propre à chaque joueur (objets, or, expérience, réactifs, reliques) |
| Pauses | Le monde ne s'arrête pas pour le sac ou un bonus de niveau (héros protégé pendant le choix) ; il s'arrête en fin de manche |
| À terre | Relève après 8 s près du partenaire debout le plus proche, avec 50 % de vie ; tout le monde à terre = échec pour tous |
| Fin de manche | L'hôte décide sortir ou continuer ; chacun reçoit sa relique de manche |
| Reliques ouvertes | Partagées (v119) : chaque relique ouverte par un joueur donne aux autres l'ouverture d'une relique du même type, tirée pour leur héros, sans en dépenser ; accordée à la réussite |
| Déconnexion | Message « bye » à la fermeture, ou silence de plus de 20 s en mission : si l'hôte part, chaque invité termine en extraction ; si un invité part, les autres continuent |
| Noms | Nom de chaque joueur (Réglages › Compte, sinon Joueur-XXXXX) précédé du prestige du héros joué, dans le salon, les messages et au-dessus des partenaires ; une étiquette qui en chevauche une autre monte d'un cran |
| Retrait | L'hôte retire un joueur depuis le salon (message kick) ; en mission, l'invité retiré garde son butin ; « Nouveau code » l'empêche de revenir |
| Retour au Camp | Depuis la pause : un invité quitte la mission (message leave) et rejoint la suivante sans se reconnecter ; l'hôte arrête la mission pour tous, chaque invité garde son butin |

Fichier `js/net.js` ; QR code par `qrcode-generator` chargé à la demande depuis jsDelivr. Les puits sacrés restent propres à chaque joueur ; les quatre missions se jouent à plusieurs (Survie, Défense, Capture, Brèche). Adresse du relais dans js/relais.js.

| Sens | Message | Fréquence | Contenu |
| --- | --- | --- | --- |
| Hôte → invités | hello, roster | connexion, changement | classe, nom et prestige de l'hôte, place attribuée (J2–J4) ; roster : place, classe, nom et prestige de chacun, mission choisie (mode, niveau, difficulté) |
| Hôte → invités | start | lancement | niveau, biome, carte (piliers, braseros, runes), point d'apparition |
| Hôte → invités | s (instantané) | 20 / s | monstres (id, type, position, vie, taille, états, dégâts, phase), projectiles ennemis, fioles, zones, tous les héros, tirs de chaque joueur, minuteurs |
| Hôte → invités | kill, round, cont, exit, fail | événement | mort d'un monstre (butin calculé par chacun), fin de manche et décision |
| Invité → hôte | hello | connexion, changement de héros | version du protocole, classe, nom, prestige du héros joué, relique équipée ; renvoyé à chaque changement de héros, de nom ou de prestige |
| Invité → hôte | g (état) | 20 / s | héros, tirs, coups portés (monstre, dégâts, critique), effets posés (ralenti, gel, brûlure, recul) |
| Les deux sens | ping, bye | 2 s hors mission, fermeture | présence, départ propre |
| Hôte → invité | kick | retrait | l'invité quitte la partie (en mission, il garde son butin) |
| Invité → hôte | leave | retour au Camp | l'invité quitte la mission en cours et reste connecté |
| Appareil ↔ relais | hi, join, offer, answer, left, hostgone | mise en relation | accueil, arrivée d'un invité, offre de l'hôte (avec NET\_V), réponse de l'invité, départs ; WebSocket, hors de la liaison WebRTC |

Ne circulent jamais : sauvegarde, inventaire, équipement, mods, or, essence, butin, expérience. Liaison WebRTC chiffrée ; débit total de l'hôte à 4 joueurs de l'ordre de 0,5 à 1 Mo/s en wifi local. Les dégâts des invités ne sont pas vérifiés par l'hôte. Un PC ou un Mac est l'hôte conseillé à 3 ou 4 joueurs ; le code de réponse du téléphone lui parvient par Partager puis Coller ou, mieux, par la webcam du PC (connexion par QR codes). Le relais du code à 4 chiffres ne voit que la poignée de main WebRTC (adresses et clés de la liaison), quelques secondes, et ne stocke rien.

Arrivée en cours de mission : si la connexion d'un invité s'ouvre alors que la mission de l'hôte tourne déjà (hôte qui a touché Lancer pendant « Connexion en cours »), l'hôte envoie à cet invité seul un message start et l'ajoute comme partenaire à côté de lui. Avant ce correctif, l'invité restait sur « En attente de l'hôte ». Version du protocole (NET\_V, 9 depuis v112) dans hello : deux appareils de versions différentes se déconnectent avec un message demandant de mettre le jeu à jour.

Lecture des QR codes par caméra (bouton « Scanner avec la caméra », proposé dès que l'appareil a une caméra) : détecteur intégré du navigateur (BarcodeDetector) quand il existe, sinon jsQR 1.4.0 chargé à la demande depuis jsDelivr (webcam de PC, tous navigateurs) ; image réduite à 960 px, une lecture toutes les 120 ms, cadre de visée. Un code reconnu est validé aussitôt : code de connexion (commençant par Z ou P), ou QR code d'une partie à code (#coop=1234 ou CRYPTE:1234), qui rejoint par le relais : l'invité rejoint, l'hôte accepte la réponse, sans copier-coller. La caméra s'arrête dès la lecture, au bouton Arrêter ou à la fermeture. QR code affiché jusqu'à 320 px de large.

Connexion entre deux missions : elle reste ouverte après une sortie, un échec, le Camp ou un changement de héros (battement toutes les 2 s), et l'hôte relance sans refaire les codes. Tant que la coopération est active : verrou d'écran allumé (Screen Wake Lock, redemandé au retour au premier plan), pas de bandeau « Mettre à jour » (un rechargement couperait la partie ; Réglages › Application prévient), et silence toléré de 20 s en mission avant de considérer un joueur parti (au lieu de 8 s).

Fluidité des partenaires (protocole NET\_V = 4) : chaque connexion a deux canaux. Le canal fiable et ordonné porte les événements (hello, start, kill, coups dans g, fins de manche). Le canal rapide (non ordonné, sans renvoi) porte le flux des héros h à 30 / s et l'instantané du monde s à 20 / s, numérotés (un paquet plus ancien est ignoré). Chaque appareil lisse les partenaires à chaque image : vitesse estimée sur les derniers paquets, prolongation du mouvement jusqu'à 0,2 s, rattrapage progressif, téléportation au-delà de 260 px. Mesure (hôte à 220 px/s, vu par l'invité) : avant, 2 images sur 3 figées et des sauts de 15 px ; après, aucune image figée, écart type de 0,5 px par image, environ 60 ms de retard.

**Brèche** (mode coopératif, 2 joueurs minimum, choisi par l'hôte sous « Mode » dans le salon ; protocole NET\_V = 5) : Survie dont les Gardiens arrivent par paires de jumeaux (nombre arrondi au pair, au moins 2). Quand un jumeau meurt, l'autre doit mourir dans les 8 s, sinon le premier réapparaît à 50 % de vie, sans butin (noLoot transmis dans kill). Monstres +25 % de vie en plus du bonus de coopération.

**Sceaux légendaires** (js/seal.js ; protocole NET\_V = 6 depuis les familiers) : chaque Gardien ou élite abattu en Brèche donne à chaque joueur 1 éclat et 0,3 % de chances d'un sceau au hasard (butin instancié). Fin de mission : sortie = sceaux et éclats gardés ; échec = sceaux perdus, moitié des éclats. 100 éclats s'échangent contre 1 sceau au hasard (Camp › Affixes). Un sceau par objet (armure, amulette, bottes, anneau), en plus des affixes, utilisable en solo. Le même sceau ne compte qu'une fois sur l'équipement porté. Poser un sceau sur un objet déjà scellé rend l'ancien à la réserve ; retirer coûte 300 essence. Les sceaux ne sont pas fusionnables.

| Sceau | Effet | Portée |
| --- | --- | --- |
| Sablier brisé | −20 % de recharge de la compétence, hors plafond | soi |
| Esprit vif | −15 % de recharge de la compétence | groupe |
| Gourde sans fond | +2 potions au départ, maximum 6 | soi |
| Alchimie partagée | potion bue : +25 % de vie aux alliés proches | groupe |
| Seconde esquive | 2 esquives d'affilée avant recharge | soi |
| Cri de ralliement | ultime +20 % de charge par ennemi | groupe |
| Main tendue | alliés à terre proches relevés 2 fois plus vite | groupe |
| Aura de soin | compétence : +5 % de vie aux alliés dans la zone | groupe |
| Pas de l'ombre | après une esquive, prochain coup critique | soi |
| Fortune d'équipe | +10 % de chances d'objet | groupe |

Effets de groupe : actifs si toi ou un partenaire debout à moins de 300 px le porte. Chaque héros transmet un masque de ses sceaux de groupe dans son paquet de position. Les soins passent par un message fx relayé par l'hôte.

## Technique

Une seule page HTML avec JavaScript, sans serveur.

**Interface v87 (design system « Crypte des Cendres », navigation)** :

- **Accueil Combat** (v130, `js/shell.js`) : en haut l'avatar (Réglages), le nom et la bourse ; bannière Parcours ; à gauche le familier et les reliques, à droite Coop et Guide ; le héros au centre, dessiné avec les fonctions du jeu (flèches ou glissé pour changer) ; en bas la carte de mission, qui ouvre l'écran Mission (mode, lieu, niveau, difficulté, Tourment, reliques, Lancer), et le bouton Combattre. Barre des 5 onglets tout en bas : Héros, Arsenal, Combat, Forge, Collection.
- **Camp** (v130) : plein écran au-dessus de la barre d'onglets. Héros (héros au centre, 7 emplacements autour, tuiles Talents, Prestige, Apparence, équipements enregistrés sous les tuiles), Arsenal (Coffre, Armes, Recettes, Recycler), Forge (Affixes, Fusion, Bonus, Sceaux), Collection (Mods, Familiers, Reliques ; Mods a Héros · Arme) ; chaque onglet ouvre sur une phrase + « En savoir plus » (état retenu, localStorage crypte-more) ; pastilles sur la barre d'onglets ; action principale en barre du bas (Équiper le meilleur, Tout équiper, Transférer) ; la sauvegarde (exporter, importer) passe dans Réglages ; chaque onglet garde son défilement.
- **Inventaire unique** (js/inv.js) : barre collée (recherche dans noms et affixes, tri, filtres par emplacement, compteur « ▲ n meilleurs »), défilement continu sans pages, partagée entre Héros et Forge › Affixes ; Héros affiche 3 chiffres clés et replie les statistiques complètes.
- **Fiche ancrée** (cx-dock, remplace la barre du bas) : ‹ › et position dans la liste filtrée, comparaison ▲/▼, « Équiper · remplace X », puis Améliorer +1/+10, Verrouiller, Retirer au coffre, Prendre une affixe, Recevoir une affixe, Recycler à la Forge. Même principe pour le détail d'un mod (Équiper · case n, Fusionner, surcharge repliée) et pour le butin dans la Pause (Équiper maintenant).
- **Parcours affixe** : depuis la fiche, Forge › Affixes s'ouvre avec l'objet en source (ou en cible), puce « Retour à Héros » (cx-back) qui rend onglet, sélection et défilement, étapes cx-steps (1 Source, 2 Affixe, 3 Cible ; depuis v127, « Recevoir une affixe » suit 1 Cible, 2 Affixe, 3 Source) et consigne d'étape dans la barre du bas jusqu'à Transférer. « Chercher par affixe » et les alertes (repliées) passent sous le coffre.
- **Annuler plutôt que confirmer** : verrouiller un objet ou retirer un mod passent tout de suite avec un toast « Annuler » de 5 s ; le recyclage d'un lot (Forge › Recyclage) garde sa confirmation.
- **Mods** : jauge de capacité (cx-meter, rouge si dépassée), build en tuiles cx-mod sous la polarité de chaque case, seule la prochaine case verrouillée est montrée, liste « Tes mods » filtrable, alignement replié. **Familier** : carte du familier équipé (rang, jauge d'expérience, effet), lignes Œufs (Faire éclore) et Collection (déplie la liste et les fusions), puis capacité et build.
- **Pause** : butin de la partie d'abord (▲, Équiper le meilleur butin), bonus, équipement, 3 chiffres clés, statistiques et mods repliés ; Guide et Réglages en haut, à côté de la croix ; barre du bas « Retour au Camp » (en toutes lettres, avec confirmation) et Reprendre ; Rendu standard est dans Réglages › Rendu. Boutons de compétences (v110) : en recharge, icône atténuée, secondes restantes au centre et anneau à la couleur de la compétence qui se remplit ; enfoncement bref à l'utilisation ; halo quand elle est prête. Les éléments du HUD absents de la page (page en cache plus ancienne que les scripts) n'arrêtent plus le HUD.
- **Retour arrière** (js/nav.js) : chaque niveau ouvert pousse une entrée d'historique ; Retour ou Échap ferme la fiche, puis la feuille (choix, Réglages, Coop), la sous-vue du Héros ou l'écran Mission, puis le Camp ou la Pause ; à la racine, un premier Retour affiche « Touche encore Retour pour quitter ». Raccourcis du Camp (hors champ de saisie) : 1 à 5 pour les onglets de la barre, flèches et \[ \] dans le coffre, Entrée équipe, / cherche.

**Comparaison et armes (v88–v89)** :

- **CompareObjet** : la fiche compare l'objet choisi à l'objet équipé du même emplacement, en tableau Affixes · Porté · Choisi · Écart. Ordre : statistique de base (toujours en tête), affixes communes, affixes gagnées (« + nouvelle »), affixes perdues (valeur barrée, « − perdue ») ; affixe abyssale ◈, sceau ✦ (« nouveau » / « perdu »). Valeurs avec le rang. Au-delà de 4 affixes, pagination « Affixes 1–4 sur n » avec ‹ › et l'annonce des pertes des pages suivantes. Bloc « Ton héros » (Puissance, Vie, Réduction, seulement ce qui change, sur valeurs arrondies) ; « Toutes les statistiques » ajoute le reste ; « Plus d'actions » déplie Verrouiller, Retirer, Prendre ou Recevoir une affixe, Recycler à la Forge. Aucun verdict ; un objet porté est marqué « Porté » sans comparaison. Même fiche pour le butin de la Pause (face à l'équipement de la partie).
- **Armes dans le coffre** : les armes possédées et non portées (de tous les héros, héros courant d'abord) apparaissent dans le coffre de l'onglet Héros, avec un filtre « Arme ». Leur fiche : comparaison avec l'arme portée, Équiper (héros courant seulement), Verrouiller (meta.wlock), Fusionner, Recevoir une affixe, Recycler à la Forge (essence). L'arme portée se verrouille aussi depuis sa case. Une arme verrouillée est exclue du recyclage de sa fiche, de l'Armurerie et de « Forge › Recyclage ». Les armes ne servent pas de source d'affixe (inchangé) et n'apparaissent pas dans Forge › Affixes côté coffre.

Recyclage (v90, dans l'Armurerie depuis v92) : puce de l'Armurerie (Coffre · Recettes · Mes armes · Recyclage) ; la Forge garde Bonus · Affixes · Fusion · Sceaux (« Améliorations » renommé « Bonus » en v91). Le coffre (barre d'inventaire, grille, fiche ancrée, « Équiper le meilleur ») est aussi dans l'Armurerie, puce Coffre par défaut ; l'onglet Héros garde l'équipement porté, les statistiques, les fragments et le prestige, avec un bouton « Ouvrir le coffre », seul endroit où l'on recycle. Puces « Rareté à recycler » (multi-sélection) + barre d'inventaire commune (recherche, tri, emplacement, filtre Arme). Grille des objets du coffre et des armes non portées (hors armes de départ) ; « Tout sélectionner » prend tous les objets non verrouillés du filtre ; « Recycler · n » avec l'essence gagnée, confirmation au-delà d'un objet. Gains selon la rareté et le rang (aucun fragment rendu depuis v91).

**Fichiers (site GitHub Pages, sans build)** : `index.html`, `css/game.css` et `css/aaa.css` (habillage de la v130, chargée après), puis les scripts classiques, qui partagent la portée globale : `js/data.js` (données, sauvegarde), `js/game.js` (partie, combat, butin), `js/render.js` (Canvas, PixiJS, HUD), `js/ui.js` (fiches, pause, niveaux, mods, fin), `js/camp.js` (Camp), js/seal.js (sceaux), js/pet.js (familiers), js/unlock.js (déblocages), js/net.js (coop), js/relais.js (adresse du relais), `js/shell.js` (barre d'onglets, accueil, écran Mission), js/update.js (mises à jour), `js/settings.js` (réglages, bannière, vibrations), `js/audio.js` (sons), `js/main.js` (boucle) ; l'ordre exact est dans le document Architecture. PWA : `manifest.webmanifest`, `sw.js` (cache, réseau d'abord pour la page et les scripts, numéro `VERSION` à incrémenter à chaque mise à jour), `icons/`, `.nojekyll`.

**Son** : entièrement synthétisé en Web Audio, aucun fichier. Coups (avec limite de cadence), critiques, coup reçu, ramassages par rareté, or, potion, esquive, compétence propre à chaque classe, ultime, météores, Gardien qui surgit et qui meurt, élite, Frénésie, montée de niveau, relique ouverte, vague, victoire, défaite, clics d'interface. Musique d'ambiance : bourdon grave filtré qui respire et cloches rares en mode mineur. Le son démarre au premier geste et se coupe quand l'onglet est masqué.

**Sons de ramassage (v86, Réglages › Son, SET.pickSnd)** : Tous, Importants (par défaut) ou Aucun. Importants coupe l'or et les objets communs ou magiques, et garde les objets rares et mieux, les mods, reliques, fragments et sceaux. Intervalle minimal entre deux sons d'un même type : or 0,22 s (0,05 avant), objet commun 0,2 s, rare et mod 0,15 s, légendaire, relique et fragment 0,12 s ; l'or est aussi plus discret. Les sons de combat (coups 0,045 s, critiques, dégâts reçus), d'ultime et d'alertes ne changent pas.

**Réglages** (bouton sur l'écran de départ et dans la pause, propres à l'appareil, clé `crypte-set`) : volume des effets et de la musique, tremblement Normal / Réduit / Désactivé, flash de butin, chiffres de dégâts, vibrations (coup reçu, légendaire ou affixe recherchée), rendu WebGL ou standard, zoom de la vue de 70 % à 140 % (v118, le HUD garde sa taille). En tête, la section Compte (v109) : nom de joueur (meta.pname, 16 signes : lettres, chiffres, espace, - \_ ' .) et identifiant unique tiré une fois (meta.pid, nom par défaut Joueur-XXXXX) ; ces deux-là sont dans la sauvegarde, pas dans les réglages de l'appareil.

**Côté des boutons** (Réglages › Écran, SET.hand = right | left, propre à l'appareil) : à gauche, la classe lefty sur body place la grappe de compétences en bas à gauche en miroir (grande compétence et ultime côté bord, esquive et potion côté centre, icône d'esquive retournée) et déplace l'aide clavier en bas à droite, alignée à droite. Le joystick reste flottant (n'importe où sur l'écran).

**Mises à jour** (`js/update.js`) : l'appli installée vérifie `sw.js` au lancement, quand elle revient au premier plan et toutes les 30 min. Dès qu'une nouvelle `VERSION` est installée, un bandeau en haut « Nouvelle version du jeu · Mettre à jour » s'affiche, seulement hors mission (accueil, pause, Camp, fin de partie) ; « Mettre à jour » recharge la page, la croix le masque jusqu'au prochain lancement. Réglages › Application affiche la version installée et un bouton Rechercher. Le cache garde désormais une copie par page, pour que l'ouverture du guide n'écrase plus le jeu hors connexion.

**Robustesse du rendu** : la boucle de jeu programme l'image suivante avant de calculer la courante, et une erreur dans le calcul ou l'affichage est notée sans figer le jeu. Si le contexte WebGL est perdu (mémoire graphique du téléphone), le jeu attend 1,5 s qu'il revienne, puis passe au rendu standard avec un message ; au lancement d'une partie, un contexte déjà perdu bascule tout de suite. Le dernier incident (date, endroit, message) est gardé sur l'appareil (clé `crypte-err`) et affiché dans Réglages › Application.

**Guide du joueur** (`aide/index.html`, 34 captures dans `aide/img/`) : une page illustrée qui explique chaque écran et chaque système, avec un sommaire en onglets. Trois accès, qui ouvrent un nouvel onglet : bouton Guide de l'écran d'accueil, bouton Guide du sac (section En mission) et bouton ? du Camp, qui ouvre la section de l'onglet affiché ; section Familiers en #familiers (`#camp-equip`, `#camp-arsenal`, `#camp-relics`, `#camp-mods`, `#camp-affix`, `#camp-forge`).

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
