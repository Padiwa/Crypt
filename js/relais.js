// Crypte des Cendres — relais.js : adresse du relais de mise en relation (dossier relais/, sur Cloudflare Workers, offre gratuite).
// Avec un relais, « Créer une partie » donne un code à 4 chiffres que les autres joueurs tapent pour rejoindre.
// Vide : pas de relais, la coopération se fait seulement par QR codes (mode manuel), comme avant.
// Après « npx wrangler deploy » dans relais/, mets ici l'adresse affichée, en wss:// :
//   const RELAY_DEFAULT = 'wss://crypte-relais.<ton-sous-domaine>.workers.dev';
const RELAY_DEFAULT = 'wss://crypte-relais.cryptcendre.workers.dev';
