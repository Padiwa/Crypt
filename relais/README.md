# Relais de Crypte des Cendres

Le relais fait se rencontrer les appareils d'une partie en coopération. L'hôte touche « Créer une partie » et reçoit un code à 4 chiffres ; les autres joueurs tapent ce code et arrivent tout seuls.

Le relais ne fait passer que la poignée de main WebRTC : l'offre de l'hôte, puis la réponse de chaque invité, quelques kilo-octets en quelques secondes. Ensuite la partie passe directement d'un appareil à l'autre par le wifi. Le relais ne stocke rien et ne voit jamais la partie.

Il tourne sur Cloudflare Workers, dans l'offre gratuite : un Worker et des Durable Objects, une salle par code. L'offre gratuite autorise 100 000 requêtes par jour pour les Workers et autant pour les Durable Objects ; chaque connexion d'un joueur en compte une de chaque, et les messages échangés ensuite comptent pour 1/20 de requête. C'est très au-delà de ce qu'il faut ici.

## Déployer (une fois, environ 5 minutes)

Il faut un compte Cloudflare gratuit (https://dash.cloudflare.com/sign-up) et Node.js 22 ou plus récent sur ton ordinateur.

```sh
cd relais
npx wrangler login      # npx propose d'installer Wrangler : réponds y ; le navigateur s'ouvre : autorise Wrangler sur ton compte
npx wrangler deploy     # envoie le relais ; si ton compte n'a pas encore de sous-domaine workers.dev, Wrangler t'en fait choisir un
```

À la fin, Wrangler affiche l'adresse du relais, par exemple `https://crypte-relais.ton-nom.workers.dev`.

1. Ouvre cette adresse dans un navigateur : la page doit afficher « Relais de Crypte des Cendres : en service. »
2. Dans le jeu, ouvre `js/relais.js` et mets cette adresse, en remplaçant `https://` par `wss://` :

   ```js
   const RELAY_DEFAULT = 'wss://crypte-relais.ton-nom.workers.dev';
   ```

3. Publie le site comme d'habitude. Dans Coop, le jeu propose maintenant « Créer une partie » et le champ du code.

Tant que `RELAY_DEFAULT` est vide, le jeu garde la connexion par QR codes, comme avant.

## Mettre à jour, surveiller

- Après une modification de `src/`, relance `npx wrangler deploy`. Un nouvel envoi coupe les salles ouvertes : l'hôte rouvre la sienne tout seul sous le même code ; un joueur en train d'arriver retape le code. Les parties déjà connectées ne sont pas touchées.
- `npx wrangler tail` affiche en direct les connexions au relais.
- Dans le tableau de bord Cloudflare, Workers & Pages › crypte-relais montre le nombre de requêtes du jour.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/index.js` | Le Worker : envoie chaque connexion `/r/<code>` à la salle de ce code (un Durable Object). Les sockets hibernent entre deux messages ; le battement `ping` reçoit `pong` sans réveiller la salle. |
| `src/salle.js` | La logique d'une salle : un hôte, jusqu'à 6 invités ; offre et réponse relayées ; salle reprise par le même hôte après une coupure ; fermée quand l'hôte part. |
| `wrangler.toml` | Nom du Worker, liaison `SALLES` et déclaration des Durable Objects (obligatoire dans l'offre gratuite, sans stockage). |

## Protocole

Connexion WebSocket : `wss://<relais>/r/<code>?role=h&k=<secret>` pour l'hôte, `?role=g` pour un invité. Messages JSON :

| De → vers | Message | Sens |
| --- | --- | --- |
| appareil → relais | `{t:'hi'}` | premier message, dès la connexion : le relais répond par l'accueil (rien n'est envoyé avant) |
| relais → hôte | `{t:'ok'}` | salle ouverte |
| relais → hôte | `{t:'taken'}` | code déjà pris par un autre hôte : le jeu en tire un autre |
| relais → hôte | `{t:'join', id}` | un invité est entré |
| hôte → relais → invité | `{to:id, t:'offer', v, sdp}` | offre de connexion (version du protocole du jeu `v`) |
| invité → relais → hôte | `{t:'answer', sdp}` (reçu avec `from`) | réponse de l'invité |
| relais → hôte | `{t:'left', id}` | l'invité est parti |
| relais → invité | `{t:'ok', id}`, `{t:'nohost'}`, `{t:'full'}`, `{t:'hostgone'}` | entré, code sans hôte, salle pleine, hôte parti |

Les tests du jeu font tourner la même logique (`src/salle.js`) dans un relais local : `node tools/tests/run.mjs relais coop`.
