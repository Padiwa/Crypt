# Crypte des Cendres · Boss

*Propositions du 28 octobre 2026 (v136), revues le 29 octobre 2026 pour la v146 avec les choix de l'auteur.*

## État (v147, 29 octobre 2026)

Construit : le socle (fragments, clé, écran Mission, arène, pauses, barre crantée, butin, couleurs, bot, banc, tests, guide) et le Bourreau avec la Chaîne du Condamné. Code : `js/boss.js`, `UQ` dans `js/items.js`, tests `tools/tests/suites/28_boss.mjs`, banc `LORD=1` (`tools/banc/README.md`).

Choix faits en construisant, à confirmer par l'auteur :

- La **clé est consommée à l'apparition** du Boss, comme proposé.
- L'**objet unique va dans le coffre tout de suite**, même si le héros tombe ensuite (le reste du butin suit la règle habituelle).
- Pendant le combat, la **manche attend** aussi (horloge de mission en pause), pas seulement le minuteur des Gardiens : sinon la fin de manche ouvrirait le portail au milieu du combat.
- La **Sentence** retire 60 % de la vie maximale (avant la réduction des dégâts) au lieu de dépendre des dégâts du Bourreau : à 3,5 fois ses dégâts, elle tuait d'un coup un héros débutant.
- Les fragments ne tombent **qu'en solo**.

Valeurs provisoires, à régler au banc puis à choisir par l'auteur :

| Réglage | Valeur | Où |
| --- | --- | --- |
| Chance de fragment par Gardien | 10 %, un au plus par mission | `keyFrag`, `keyFragMax` (rythmes) |
| Vie du Bourreau | 8 Gardiens au même moment | `LORD_HP` (`BAL.lordHp`) |
| Sentence | toutes les 9 s (×0,8 dans l'ombre), 60 % de la vie, fenêtre parfaite 0,3 s | `SENT_IV`, `SENT_HP`, `SENT_PERF` |
| Esquive parfaite | Bourreau étourdi 1 s, dégâts ×2 | `PERF_STUN`, `PERF_X` |
| Chaîne | toutes les 13 s, 190 px, pieu à 210 × la vie de base | `CHAIN_IV`, `CHAIN_R`, `STAKE_HP` |
| Butin | 100 essence, double : 150 essence | `LORD_ESS`, `UQ_DUP_ESS` |
| Chaîne du Condamné | +40 % (bonus sous condition) | `UQ.condamne.v` |

Premier banc (bot niveau 30 de `tools/banc/etats`, Normal et Tourment I, 2 parties par héros) : 12 Bourreaux vaincus sur 12, sans mort, en 4 à 54 s. Le bot réussit toutes ses esquives parfaites, ce qu'un joueur ne fera pas : le banc mesure surtout la vie du Bourreau.

Les **Gardiens restent** tels qu'ils sont : ils arrivent régulièrement pendant la mission. Les **Boss s'ajoutent** : des rencontres uniques et nommées, en plusieurs phases, au plus une par mission, avec un objet unique pensé pour un build.

## Choix de l'auteur (29 octobre 2026)

- **Arrivée : la clé d'antre.**
- **Butin : des objets uniques** qui complètent un build précis.
- **En solo seulement.** En coopération, la clé ne peut pas être choisie, comme la Brèche ne peut l'être qu'à plusieurs.
- **Pas une réponse à la fin de jeu.** Le Boss suit la difficulté et le Tourment comme un Gardien, sans palier à part. La question du Tourment X reste ouverte à part.

## La clé d'antre

- Les Gardiens lâchent des **fragments de clé**, comme les fragments de harnais (`data.js:37`) : plus souvent dans les difficultés hautes. La chance est à régler au banc.
- Un fragment appartient au **biome où il tombe**. Trois fragments du même biome donnent la clé de son Boss. Les clés à part (Colosse, Hydre, Reflet) sont décrites avec leur Boss.
- La clé se choisit **à l'accueil, avant de partir**, sur une ligne « Clé d'antre » à côté de Biome, Niveau, Difficulté et Reliques. Elle n'est proposée qu'en solo.
- Le Boss arrive **après le premier objectif** :
  - Survie : fin de la 1re manche ;
  - Défense : fin de la 3e vague ;
  - Capture : première capture.
- Un cercle de runes se referme : on ne peut plus fuir ni s'extraire tant que le Boss vit.
- La clé est **consommée quand le Boss apparaît**. Si on quitte la mission avant, elle est gardée.
- Déblocage : la ligne apparaît au premier fragment ramassé (`unlock.js`), avec une carte « Nouveau ».

## Règles communes

- Une barre de Boss crantée par phase, en haut, à la place de la barre des Gardiens.
- Chaque attaque dangereuse est annoncée au moins 0,8 s avant, avec les codes déjà connus : ligne rouge pour une charge (état `wind`), cercle pour une zone.
- Le minuteur des Gardiens (`G.bossT`) est en pause pendant le combat.
- **Vie du Boss** : elle suit la difficulté, le Tourment et l'horloge de mission (`missionM()`, v146), comme les autres monstres. Un Boss appelé tard dans une mission doit rester aussi dur que les monstres autour de lui.
- Les statuts gardent les règles des Gardiens (étourdir 3 fois moins, immobiliser 2 fois moins, pas d'exécution) : le Boss compte comme un Gardien.
- **Butin** :
  - l'objet unique du Boss ;
  - une relique garantie de la difficulté ;
  - de l'essence ;
  - une couleur de héros à la première victoire.
- L'aspect des héros, des monstres et des effets existants ne change pas. Seuls les Boss apportent de nouveaux dessins, dans les deux rendus (WebGL et Canvas).

## Les objets uniques

Un objet unique est un objet d'un emplacement hors arme, de rareté légendaire, avec ses affixes normales et un **pouvoir propre** en plus. C'est le principe des sceaux de la Brèche (`seal.js`) : un pouvoir par objet, qui ne compte qu'une fois sur l'équipement porté.

- **Doublons** : un deuxième exemplaire du même objet se recycle en essence. On garde le meilleur.
- **Valeurs** : à régler au banc, avec `tools/progression/builds.mjs`, sur le build visé et sur le build du bot. Un objet unique doit rendre son build nettement meilleur sans le rendre meilleur que les autres builds.
- **Styles en retrait** : poison, saignement et feu sont aujourd'hui moins forts que l'éclair en chaîne. Trois objets les visent. Cela touche au rééquilibrage des styles que l'auteur a remis à plus tard : à mesurer avant de décider.

| Boss | Objet | Emplacement | Build visé |
| --- | --- | --- | --- |
| Le Bourreau | Chaîne du Condamné | Amulette | Saignement |
| Le Roi-Momie | Masque du Roi-Momie | Armure | Poison et malédiction |
| La Matriarche | Couronne de la Matriarche | Anneau | Givre et contrôle |
| L'Hydre | Cœur de l'Hydre | Amulette | Feu |
| Le Colosse | Cœur de Fer-Sang | Armure | Tank |
| Le Reflet | Miroir brisé | Dos | Esquive |

## Les Boss

### 1. Le Bourreau des Cendres · Crypte des Cendres

- **Sentence :** il marque le héros. Un cercle se resserre pendant 2 s, puis vient un coup de hache énorme. Une esquive au tout dernier moment, l'« esquive parfaite », annule le coup et l'étourdit 1 s. Tes dégâts sont doublés pendant ce temps.
- **Chaîne :** il t'attache à un pieu. Tu ne peux pas t'en éloigner tant que le pieu n'est pas détruit.
- **Phase 2, l'ombre (à 50 %) :** les braseros s'éteignent et il charge depuis le noir. Seule la ligne rouge le trahit.
- **Objet : la Chaîne du Condamné** (Saignement). Un ennemi qui porte 3 saignements est « condamné » : il prend plus de dégâts de toutes les sources tant qu'il en garde 3.
- **Coût :** faible à moyen. Il ajoute l'esquive parfaite, une nouvelle mécanique pour tout le jeu. Il faut aussi l'apprendre au bot.

### 2. Le Roi-Momie · Nécropole des Sables

- **Phase 1, les sarcophages :** quatre sarcophages l'entourent. Tant qu'il en reste un debout, il subit 80 % de dégâts en moins. Chaque sarcophage brisé libère trois momies.
- **Phase 2, la tempête royale (à 50 % de vie) :** la tempête devient permanente, et des tourbillons de sable traversent l'arène en poussant le héros. Les sables mouvants avancent vers toi.
- **Phase 3, les canopes :** à 0 PV, il tombe pendant 8 s et quatre canopes apparaissent. Chaque canope encore intacte lui rend 25 % de vie quand il se relève. Il réutilise le principe du relèvement des jumeaux de la Brèche (`twin`, `game.js:163`).
- **Objet : le Masque du Roi-Momie** (Poison et malédiction). Les couches de poison peuvent dépasser le plafond de 10 sur un ennemi maudit.
- **Coût :** moyen. Il réutilise les momies, la tempête et les sables mouvants.

### 3. La Matriarche du Givre · Abîmes gelés

- **Phase 1, les lances de glace :** chaque lance laisse un mur de glace pendant 6 s, qui bloque tes tirs comme les monstres. L'arène se découpe en couloirs.
- **Phase 2, le froid mordant :** une jauge de froid monte quand tu t'éloignes des trois braseros de l'arène. Quand elle est pleine, tu es gelé 2 s. Elle souffle les feux un par un.
- **Phase 3, le cœur de cristal :** elle s'enferme dans un cristal. Il faut briser trois cristaux en 10 s, sinon elle récupère de la vie.
- **Objet : la Couronne de la Matriarche** (Givre et contrôle). Un ennemi gelé, étourdi ou immobilisé qui meurt éclate en éclats de glace qui ralentissent autour de lui.
- **Coût :** moyen. Les murs qui bloquent les tirs sont nouveaux.

### 4. L'Hydre des Cendres · tous biomes, Cauchemar et plus

- **Clé à part :** ses fragments tombent sur les élites, à partir de Cauchemar, dans tous les biomes.
- **Trois têtes :** une crache le feu en cône, une la glace (elle ralentit), la troisième lance un éclair en chaîne.
- **Repousse :** une tête coupée repousse en deux, sauf si toutes les têtes tombent en moins de 10 s. En solo, c'est un test de dégâts sur plusieurs cibles.
- **Objet : le Cœur de l'Hydre** (Feu). La brûlure se cumule jusqu'à 3 fois, comme le saignement, au lieu de se renouveler.
- **Coût :** moyen.

### 5. Le Colosse de Fer-Sang · mode Défense

- **Clé à part :** ses fragments tombent sur les Gardiens en Défense seulement. On l'appelle en Défense, dans n'importe quel biome.
- **Marche :** il avance vers le cryopode sans jamais être repoussé. Il frappe le sol tous les cinq pas en lançant des ondes de choc.
- **Points faibles :** deux jambes et un cœur. Chaque jambe brisée le ralentit. Le cœur ne s'ouvre qu'une fois les deux jambes tombées.
- **Chaînes :** il en lance sur le cryopode. Il faut les couper, sinon il tire le cryopode vers lui.
- **Objet : le Cœur de Fer-Sang** (Tank). Tu ne peux plus être repoussé, et ta réduction des dégâts augmente quand tu es à l'arrêt.
- **Coût :** moyen.

### 6. Le Reflet · Tourment

- **Clé à part :** ses fragments tombent en Tourment.
- **Copie :** il copie ta classe, ton sort et ton ultime, et les utilise contre toi, avec les mêmes signes d'alerte.
- **Phase 2 :** il se divise en trois. Seul le vrai a une ombre, et frapper un faux le fait exploser.
- **Objet : le Miroir brisé** (Esquive). Après une esquive, un reflet de toi reste sur place 2 s et attire les monstres.
- **Coût :** élevé. Il faut un adversaire qui lance les sorts et les ultimes des trois classes. À faire en dernier, ou pas du tout.

## Où le brancher dans le code

Un nouveau fichier **`js/boss.js`**, chargé après `combat.js` et avant `step.js` dans `index.html`, et ajouté à la liste `CORE` de `sw.js`. Il contient la table des Boss (biome ou mode, clé, phases, objet), leur apparition et leur comportement.

| Fichier | Ajout |
| --- | --- |
| `game.js` | apparition après le premier objectif, cercle de runes, pause de `G.bossT` |
| `step.js` | aiguillage dans la boucle des ennemis vers le comportement du Boss |
| `combat.js` | réductions de dégâts (sarcophages), changements de phase, mort et butin |
| `seal.js` ou `items.js` | objets uniques et leur pouvoir, dans la fiche d'objet |
| `items.js` (`stats`) | pouvoirs des objets uniques dans les statistiques du héros |
| `power.js` | les pouvoirs comptés dans la Puissance |
| `render.js`, `rendergl.js` | dessins des Boss, de l'arène et de la barre crantée |
| `progress.js` | fragments et clés par biome, Boss vaincus, couleurs gagnées ; valeurs par défaut pour les anciennes sauvegardes |
| `shell.js`, `camp.js` | ligne « Clé d'antre » à l'accueil, cachée en coopération |
| `ui.js` | écran de fin de mission (Boss vaincu, objet unique) |
| `unlock.js`, `tut.js` | déblocage au premier fragment, conseil du Parcours |
| `tools/progression/bot.js` | le bot sait appeler et combattre un Boss, pour le banc |
| `tools/tests/suites/` | une suite « boss » |
| `aide/index.html` | une page du guide |

`net.js` n'a pas à changer, puisque les Boss se jouent en solo.

## Ordre de construction

1. **Le socle et le Bourreau** : fragments, clé, accueil, arène, barre crantée, pause des Gardiens, butin, objet unique, bot, tests, guide. La Crypte est ouverte à tous, et le Bourreau est le plus simple.
2. Le Roi-Momie : il réutilise le relèvement des jumeaux.
3. La Matriarche.
4. Le Colosse, pour la Défense.
5. L'Hydre.
6. Le Reflet, en dernier ou pas du tout.

Chaque Boss est réglé au banc avant d'être livré : vie, temps des phases, chance des fragments, valeurs de l'objet.

## À décider

- Les pouvoirs des six objets proposés ci-dessus : les garder, les changer ?
- Les choix faits en construisant le Bourreau (voir « État (v147) ») : clé consommée à l'apparition, objet gardé tout de suite, manche en pause, Sentence en part de la vie.
- La chance de tomber des fragments, et le nombre de missions visé pour une clé (aujourd'hui : au moins 3 missions, une sur dix environ par Gardien).
- Les valeurs du Bourreau après un banc plus large (niveaux 10, 30 et 50, Tourment X).
