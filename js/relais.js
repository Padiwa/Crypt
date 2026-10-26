// Crypte des Cendres — relais.js : adresse du relais de mise en relation (dossier relais/, sur Cloudflare Workers, offre gratuite).
// Avec un relais, « Créer une partie » donne un code à 4 chiffres que les autres joueurs tapent pour rejoindre.
// Vide : le relais du jeu (RELAY_CF dans js/net.js). « off » : pas de relais, la coopération se fait seulement par QR codes.
// Un autre relais : son adresse en wss://, par exemple 'wss://crypte-relais.<ton-sous-domaine>.workers.dev'.
const RELAY_DEFAULT = 'wss://crypte-relais.cryptcendre.workers.dev';
