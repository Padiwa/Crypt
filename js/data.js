// Crypte des Cendres — data.js : outils communs, raretés, rythme (BAL), emplacements, biomes, classes, armes, reliques et objets des reliques.
// Suite des données (v145) : progress.js (sauvegarde, Forge, talents, prestige, bonus de partie, sorts), mods.js, items.js (affixes, stats), equip.js.
const cv=document.getElementById('cv');let ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const DEF_N=3; // Défense : sortie (et Gardien) toutes les DEF_N vagues
const MAP=2800, EDGE=40, GOD=location.hash==='#test'||location.hash==='#test2d',NOGL=location.hash==='#test2d',FAST=GOD||location.hash==='#rapide', LEVEL_T=FAST?24:120, BOSS_T=FAST?8:60;
const rand=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rand(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const fmt=s=>{s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
let dpr=1;

/* ---------- Données ---------- */
const RAR=[{n:'Commun',c:'#bdb6a8',aff:1,shard:1},{n:'Magique',c:'#7b95ff',aff:2,shard:2},{n:'Rare',c:'#f0cf4a',aff:3,shard:4},{n:'Légendaire',c:'#ff8a24',aff:4,shard:8},{n:'Ancestral',c:'#ff5a7a',aff:5,shard:16},{n:'Sanguin',c:'#e8383f',aff:6,shard:24},{n:'Abyssal',c:'#b07cff',aff:7,shard:36}];
// Force selon la rareté : multiplicateur des affixes (RK) et de la statistique de base (RB). Commun → Abyssal.
const RK=[1,1.1,1.2,1.35,1.55,1.8,2.1],RB=[1,1.05,1.1,1.2,1.3,1.4,1.5];
/* ---------- Rythme de progression ----------
   Les réglages de vitesse de progression viennent du fichier de rythme chargé avant data.js (index.html) :
   js/rythmes/rapide.js (rythme publié) ou js/rythmes/long.js. Le joueur ne choisit pas le rythme.
   window.BAL_OVERRIDE : réglages d'essai injectés par le simulateur de progression (tools/progression). */
const BAL=Object.assign({},typeof RYTHME!=='undefined'?RYTHME:{},(typeof window!=='undefined'&&window.BAL_OVERRIDE)||{});
if(typeof RYTHME==='undefined')console.error('Rythme de progression manquant : charger js/rythmes/rapide.js avant js/data.js');
// Coût en or de la fabrication (Légendaire et au-dessus : fragments des reliques).
const CRAFT_G=[0,0,0,300,600,1000,1500].map(g=>Math.round(g*BAL.craftMul));
const SLOT={arme:'Arme',armure:'Armure',amulette:'Amulette',bottes:'Bottes',anneau:'Anneau',anneau2:'Anneau 2',dos:'Dos'};
/* Emplacements à débloquer avec des fragments de harnais (Gardiens) : d'abord le 2e anneau, puis le dos.
   v139 : chaque héros débloque les siens, meta.slotU[classe] = {anneau2, dos} ; c par défaut : le héros choisi. */
const SLOT_U=[{k:'anneau2',n:'Anneau 2',hf:12,gold:2000},{k:'dos',n:'Dos',hf:25,gold:5000,need:'anneau2'}];
const slotCls=c=>{if(c)return c;try{return curCls()}catch{return 'archer'}};
const slotOpen=(k,c)=>{if(!SLOT_U.some(u=>u.k===k))return true;const s=meta.slotU&&meta.slotU[slotCls(c)];return !!(s&&s[k])};
const slotAny=k=>Object.keys(CLS).some(c=>slotOpen(k,c));
const GEAR_KEYS=c=>['armure','amulette','bottes','anneau','anneau2','dos'].filter(k=>slotOpen(k,c));
const keySlot=k=>k==='anneau2'?'anneau':k;
// Case où va un objet : la sienne s'il est porté, sinon une case vide de son type, sinon celle où il apporte le plus.
function tgtKey(eq,it){const ks=GEAR_KEYS().filter(k=>keySlot(k)===it.slot);if(!ks.length)return null;
  for(const k of ks)if(eq[k]===it)return k;for(const k of ks)if(!eq[k])return k;if(ks.length===1)return ks[0];
  let best=ks[0],bs=null;for(const k of ks){const v=eqVal({...eq,[k]:it});if(!bs||eqGt(v,bs)){bs=v;best=k}}return best}
// Fragments de harnais : seulement sur les Gardiens, plus souvent dans les difficultés hautes.
const hfChance=()=>{const D=dif();return .03*BAL.hfMul*(1+.5*Math.min(3,dsel().d))*(1+.05*(D.tier||0))};
const BIOMES=[
  {id:'crypte',n:'Crypte des Cendres',ic:'',tag:'Braseros, monstres connus',d:'La crypte d\'origine : braseros, sang séché, monstres connus.',hp:1,dm:1,loot:1,
   tile:{h:285,s:9,l:12.5},stain:'110,25,30',chip:'214,204,180',pil:['#4a4050','#231d27'],wall:['#211a26','#3d3440'],rune:'232,133,59',light:'255,140,60',flame:'255,190,90',tint:0xff8c3c},
  {id:'givre',n:'Abîmes gelés',ic:'❄',unl:'givre',tag:'Vie ×1,3 · butin +30 %',d:'Cavernes de glace sous la crypte. Monstres plus coriaces (vie ×1,3, dégâts ×1,2), Revenants de givre qui ralentissent, butin +30 %. Seul biome où tombent les affixes de givre et les objets de givre des reliques Sanguine et Abyssale.',hp:1.3,dm:1.2,loot:1.3,
   tile:{h:205,s:24,l:14},stain:'150,210,255',chip:'220,240,255',pil:['#5d7f96','#1b2c3a'],wall:['#142231','#3b5a73'],rune:'140,200,255',light:'120,190,255',flame:'190,230,255',tint:0x78beff},
  // v136 : obel = piliers en obélisques (octogones), dunes = rides de sable sur le sol ; braseros à flamme verte (feux des embaumeurs), halo doré.
  {id:'sables',n:'Nécropole des Sables',ic:'☀',unl:'sables',tag:'Vie ×1,6 · butin +60 %',d:'Tombeaux ensevelis sous le désert. Monstres bien plus coriaces (vie ×1,6, dégâts ×1,4), nuées de scarabées, momies qui se relèvent une fois, sables mouvants qui ralentissent, tempêtes de sable qui cachent la vue, butin +60 %. Seul biome où tombent les affixes de malédiction et les objets des sables des reliques Sanguine et Abyssale.',hp:1.6,dm:1.4,loot:1.6,
   tile:{h:38,s:34,l:19},stain:'210,170,100',chip:'245,225,180',pil:['#a08658','#3a2c18'],wall:['#2a1f12','#6a5434'],rune:'230,190,110',light:'230,190,110',flame:'180,255,160',tint:0xe6be6e,obel:1,dunes:1},
];
const biome=()=>BIOMES[Math.max(0,Math.min(BIOMES.length-1,(typeof G!=='undefined'&&G&&G.biome!=null)?G.biome:(meta.biome|0)))];
const BASES_GIVRE={armure:['Pelisse givrée','Cuirasse de glace'],amulette:['Talisman de givre','Pendentif cristallin'],bottes:['Bottes fourrées','Grèves de glace'],anneau:['Anneau de givre','Bague cristalline']};
// Objets propres à un biome (it.bio = numéro du biome) : 1 Abîmes gelés, 2 Nécropole des Sables.
const BASES_BIO={1:BASES_GIVRE,2:{armure:['Linceul de lin','Cuirasse de grès'],amulette:['Scarabée d\'or','Pectoral des dunes'],bottes:['Sandales des dunes','Grèves de bronze'],anneau:['Anneau des sables','Sceau du tombeau']}};
const BASES={armure:['Cuirasse','Brigandine','Cotte de mailles','Manteau de chasseur'],amulette:['Talisman','Amulette','Médaillon'],bottes:['Bottes de cuir','Grèves','Solerets','Bottes de pèlerin'],anneau:['Anneau','Chevalière','Bague']};
const SUFFIX=['du Corbeau','des Cendres','de la Veuve','du Pèlerin',"de l'Ossuaire",'du Loup gris','de la Lune noire','des Murmures','du Bourreau','de Fer-Sang'];
const GLYPH={
  arme:'<svg viewBox="0 0 24 24"><path d="M5 19 19 5M13 5h6v6M7 11l6 6M4 14l6 6"/></svg>',
  armure:'<svg viewBox="0 0 24 24"><path d="M6 4l6 2 6-2 2.5 5-3 2v9h-11v-9l-3-2z"/></svg>',
  amulette:'<svg viewBox="0 0 24 24"><path d="M7 3c0 6 10 6 10 0"/><circle cx="12" cy="15" r="5"/><circle cx="12" cy="15" r="1.5"/></svg>',
  bottes:'<svg viewBox="0 0 24 24"><path d="M8 3h6v10l6 3v4H5v-6l3-1z"/><path d="M5 18h15"/></svg>',
  dos:'<svg viewBox="0 0 24 24"><path d="M8 3h8l1 3 3 15H4L7 6z"/><path d="M8 3c1 2 7 2 8 0M12 6v15"/></svg>',
  anneau:'<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="6"/><path d="m9 7 3-4 3 4z"/></svg>'};
const CLS={
  archer:{n:'Archer',uicon:'<path d="M6 3v12M12 3v15M18 3v12M3.5 12.5 6 15l2.5-2.5M9.5 15.5 12 18l2.5-2.5M15.5 12.5 18 15l2.5-2.5M5 21h14"/>',base:{dmg:8,aps:1.8,hp:130,crit:5,speed:0,armor:8,cdr:0},
    cloak:'#2d4c50',rim:'#a9cbc0',inner:'#14232a',col:'#e8853b',
    hint:'Glisse pour bouger.<br>Tir automatique, plus rapide à l\'arrêt.',
    desc:'Tire des carreaux automatiquement, plus vite à l\'arrêt. Rapide et précis.',
    icon:'<path d="M12 12 5 5M12 12l7-7M12 12v9M5 5h4M5 5v4M19 5h-4M19 5v4M9 18l3 3 3-3"/>'},
  guerrier:{n:'Guerrier',uicon:'<path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M19.1 4.9l-3.5 3.5M8.4 15.6l-3.5 3.5"/><circle cx="12" cy="12" r="2.5"/>',base:{dmg:14,aps:1.5,hp:160,crit:5,speed:-6,armor:15,cdr:0},
    cloak:'#5b2a26',rim:'#d9a48a',inner:'#2a1210',col:'#d9a48a',
    hint:'Glisse pour bouger.<br>Il frappe tout ce qui l\'approche.',
    desc:'Frappe au corps à corps tout ce qui l\'approche. Beaucoup de vie et d\'armure.',
    icon:'<path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 8a4 4 0 1 1-4 4"/><path d="M4 12 2.5 9M4 12l3-1"/>'},
  magicien:{n:'Magicien',uicon:'<circle cx="15" cy="15" r="5"/><path d="M11.5 11.5 3 3M14 9.8 8 3.5M9.8 14 3.5 8"/>',base:{dmg:12,aps:1.25,hp:115,crit:8,speed:-2,armor:8,cdr:10},
    cloak:'#3c2c63',rim:'#b9a6f0',inner:'#17122b',col:'#9fd0ff',
    hint:'Glisse pour bouger.<br>Orbes automatiques, plus rapides à l\'arrêt.',
    desc:'Lance des orbes qui explosent à l\'impact, plus vite à l\'arrêt. Fragile, redoutable contre les groupes.',
    icon:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>'},
};
// Couleurs du héros, choisies par classe (Héros › Couleurs) : cape, bordure et capuche.
// meta.look[classe] = ['#cape','#bordure','#capuche'] ; absent = couleurs d'origine de la classe. En coopération, les autres joueurs les voient.
const LOOK_PARTS=[{k:'cloak',n:'Cape'},{k:'rim',n:'Bordure'},{k:'inner',n:'Capuche'}];
const LOOK_SW={
  cloak:['#5b2a26','#2d4c50','#3c2c63','#7a1f24','#8a4b16','#6e5a1c','#2f5a2a','#1f4a6b','#26306a','#5a2350','#3a3a44','#1a1a1f','#6f6458','#a89e8e'],
  rim:['#d9a48a','#a9cbc0','#b9a6f0','#f0cf4a','#ff8a4c','#ff5a5f','#8fe07a','#6fd6e6','#8fb8ff','#ff8ad8','#f4efe6','#8f8f9c','#c9a227','#3a3a44'],
  inner:['#2a1210','#14232a','#17122b','#0b0b0d','#3a0f12','#2e1a06','#0f2a14','#0b1e33','#2a0b26','#2b2b31','#4a3a2a','#5e4a8a','#7a2a2a','#e8d9b8']};
const lookOk=a=>Array.isArray(a)&&a.length===3&&a.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c));
const lookDef=cls=>[CLS[cls].cloak,CLS[cls].rim,CLS[cls].inner];
const myLook=cls=>{const a=meta.look&&meta.look[cls];return lookOk(a)?a.map(c=>c.toLowerCase()):lookDef(cls)};
const lookPal=(cls,a)=>{a=lookOk(a)?a:lookDef(cls);return {cloak:a[0],rim:a[1],inner:a[2]}};
const WPN={
  // Deux armes par rareté. Commun, Magique, Rare : butin des monstres. Légendaire et au-dessus : 3 fragments des reliques.
  archer:[
    {id:'a0',n:'Arbalète rouillée',r:0,dmg:6,start:1,aff:{apsPct:5}},
    {id:'a6',n:'Arc de chasse',r:0,dmg:7,aff:{crit:3}},
    {id:'a1',n:'Arc court du Pèlerin',r:1,dmg:10,aff:{apsPct:12,crit:4}},
    {id:'a7',n:'Arc de frêne noir',r:1,dmg:11,aff:{critDmg:20,speed:5}},
    {id:'a2',n:'Arc long du Corbeau',r:2,dmg:15,aff:{crit:8,pierce:1,apsPct:8}},
    {id:'a8',n:'Arc des Brumes',r:2,dmg:16,aff:{multi:1,critDmg:25,chill:8}},
    {id:'a3',n:'Baliste de poing',r:3,dmg:21,aff:{multi:1,critDmg:30,crit:6,apsPct:10}},
    {id:'a4',n:'Ultime Soupir',r:3,dmg:24,aff:{multi:1,pierce:2,apsPct:15,critDmg:25}},
    {id:'a9',n:'Arc des Anciens Rois',r:4,dmg:28,aff:{multi:1,pierce:2,crit:10,critDmg:40,apsPct:15}},
    {id:'a10',n:'Corde du Premier Chasseur',r:4,dmg:31,aff:{multi:1,apsPct:22,crit:8,bossDmg:25,execute:30}},
    {id:'a11',n:'Arc de la Veuve rouge',r:5,dmg:35,aff:{multi:2,pierce:1,critDmg:50,execute:35,crit:10,apsPct:15}},
    {id:'a12',n:'Baliste du Sang versé',r:5,dmg:38,aff:{multi:1,pierce:3,dmgPct:30,critDmg:45,crit:10,lowDmg:35}},
    {id:'a5',n:'Arc du Vide éternel',r:6,dmg:42,aff:{multi:2,pierce:2,apsPct:25,critDmg:60,crit:12,dmgPct:25,abRift:25}},
    {id:'a13',n:'Œil de l\'Abîme',r:6,dmg:46,aff:{multi:2,pierce:2,apsPct:20,critDmg:55,crit:12,bossDmg:35,abHunt:45}}],
  guerrier:[
    {id:'g0',n:'Épée ébréchée',r:0,dmg:6,start:1,aff:{armor:3}},
    {id:'g6',n:'Masse du garde',r:0,dmg:7,aff:{hp:20}},
    {id:'g1',n:'Épée longue du Veilleur',r:1,dmg:11,aff:{leech:2,hp:25}},
    {id:'g7',n:'Hache du bûcheron',r:1,dmg:12,aff:{critDmg:20,reach:8}},
    {id:'g2',n:'Hache de guerre',r:2,dmg:17,aff:{critDmg:40,reach:10,crit:5}},
    {id:'g8',n:'Fléau clouté',r:2,dmg:18,aff:{reach:15,armor:4,apsPct:8}},
    {id:'g3',n:'Espadon de Fer-Sang',r:3,dmg:24,aff:{reach:25,leech:2,crit:6,hp:40}},
    {id:'g4',n:'Brise-Serment',r:3,dmg:26,aff:{reach:20,leech:3,crit:10,critDmg:30}},
    {id:'g9',n:'Marteau des Anciens',r:4,dmg:31,aff:{reach:25,crit:10,critDmg:45,armor:6,hp:60}},
    {id:'g10',n:'Lame du Roi-Soleil',r:4,dmg:34,aff:{reach:20,leech:3,apsPct:15,critDmg:40,bossDmg:25}},
    {id:'g11',n:'Couperet de la Veuve rouge',r:5,dmg:38,aff:{reach:30,leech:4,crit:10,critDmg:50,dmgPct:25,lowDmg:35}},
    {id:'g12',n:'Hache du Bourreau rouge',r:5,dmg:41,aff:{reach:25,leech:3,critDmg:55,execute:40,hp:80,crit:10}},
    {id:'g5',n:'Lame de l\'Abîme',r:6,dmg:46,aff:{reach:30,leech:4,crit:12,critDmg:60,dmgPct:25,hp:80,abSoul:4}},
    {id:'g13',n:'Faux du Néant',r:6,dmg:50,aff:{reach:35,leech:4,crit:12,critDmg:55,apsPct:20,armor:8,abExec:10}}],
  magicien:[
    {id:'m0',n:'Bâton de frêne',r:0,dmg:6,start:1,aff:{splash:8}},
    {id:'m6',n:'Baguette de cendre',r:0,dmg:7,aff:{cdr:5}},
    {id:'m1',n:'Sceptre des Murmures',r:1,dmg:10,aff:{cdr:10,novaPct:15}},
    {id:'m7',n:'Grimoire du novice',r:1,dmg:11,aff:{splash:15,crit:4}},
    {id:'m2',n:'Grimoire de la Veuve',r:2,dmg:15,aff:{splash:25,novaPct:30,cdr:6}},
    {id:'m8',n:'Orbe d\'ambre',r:2,dmg:16,aff:{multi:1,splash:15,crit:5}},
    {id:'m3',n:'Orbe de la Lune noire',r:3,dmg:21,aff:{multi:1,splash:25,novaPct:30,cdr:8}},
    {id:'m4',n:'Étoile Mourante',r:3,dmg:23,aff:{multi:1,splash:30,crit:10,critDmg:25}},
    {id:'m9',n:'Sceptre des Anciens',r:4,dmg:28,aff:{multi:1,splash:35,novaPct:45,cdr:12,crit:8}},
    {id:'m10',n:'Grimoire de l\'Éclipse',r:4,dmg:30,aff:{multi:1,splash:30,critDmg:45,skillRad:30,apsPct:15}},
    {id:'m11',n:'Calice de la Veuve rouge',r:5,dmg:35,aff:{multi:1,splash:45,novaPct:50,critDmg:40,crit:10,cdr:12}},
    {id:'m12',n:'Bâton du Sang versé',r:5,dmg:37,aff:{multi:1,splash:35,dmgPct:30,critDmg:45,crit:10,burnPct:10}},
    {id:'m5',n:'Sceptre du Néant',r:6,dmg:42,aff:{multi:2,splash:50,novaPct:50,crit:12,cdr:15,critDmg:50,abPulse:300}},
    {id:'m13',n:'Étoile du Vide',r:6,dmg:45,aff:{multi:2,splash:45,crit:12,critDmg:55,skillRad:35,dmgPct:25,abRift:25}}],
};
const wdef=id=>{for(const c in WPN){const w=WPN[c].find(x=>x.id===id);if(w)return Object.assign({cls:c},w)}return null};
/* Objets des reliques : deux par emplacement et par rareté (Légendaire L, Ancestral N, Sanguin S, Abyssal B).
   3 fragments (dans les reliques de leur rareté) → l'objet, au niveau d'objet de ta plus haute mission. */
const RGEAR={
  L1:{n:'Cuirasse du Veilleur',slot:'armure',r:3,aff:['hp','armor','regen','dmgPct']},
  L2:{n:'Manteau des Cendres',slot:'armure',r:3,aff:['hp','armor','cdr','novaPct']},
  L3:{n:'Amulette du Pèlerin',slot:'amulette',r:3,aff:['crit','critDmg','dmgPct','apsPct']},
  L4:{n:'Médaillon du Corbeau',slot:'amulette',r:3,aff:['novaPct','skillRad','cdr','crit']},
  L5:{n:'Bottes du Coureur de crypte',slot:'bottes',r:3,aff:['speed','apsPct','dashCd','hp']},
  L6:{n:'Grèves du Veilleur',slot:'bottes',r:3,aff:['speed','armor','regen','crit']},
  L7:{n:'Anneau du Serment',slot:'anneau',r:3,aff:['dmgPct','critDmg','crit','leech']},
  L8:{n:'Chevalière des Cendres',slot:'anneau',r:3,aff:['apsPct','dmgPct','bossDmg','cdr']},
  N1:{n:'Égide des Anciens',slot:'armure',r:4,aff:['hp','armor','regen','dmgPct','lowArmor']},
  N2:{n:'Robe du Premier Mage',slot:'armure',r:4,aff:['hp','novaPct','skillRad','cdr','armor']},
  N3:{n:'Cœur des Anciens Rois',slot:'amulette',r:4,aff:['crit','critDmg','dmgPct','apsPct','bossDmg']},
  N4:{n:'Talisman de l\'Éclipse',slot:'amulette',r:4,aff:['novaPct','skillRad','cdr','ultPct','crit']},
  N5:{n:'Pas des Ancêtres',slot:'bottes',r:4,aff:['speed','apsPct','dashCd','hp','crit']},
  N6:{n:'Sabatons du Roi-Soleil',slot:'bottes',r:4,aff:['speed','armor','hp','regen','dmgPct']},
  N7:{n:'Anneau des Anciens',slot:'anneau',r:4,aff:['dmgPct','critDmg','crit','leech','apsPct']},
  N8:{n:'Bague de l\'Ancêtre',slot:'anneau',r:4,aff:['apsPct','dmgPct','execute','cdr','bossDmg']},
};
const FRAG={archer:['Branches','Corde','Mécanisme'],guerrier:['Lame','Garde','Poignée'],magicien:['Hampe','Focus','Runes'],armure:['Plastron','Sangles','Doublure'],amulette:['Chaîne','Sertissure','Gemme'],bottes:['Tige','Semelle','Boucle'],anneau:['Anneau brut','Chaton','Pierre'],dos:['Étoffe','Agrafe','Doublure de cape']};
const gdef=id=>RGEAR[id]?Object.assign({id},RGEAR[id]):null;
function bpdef(id){const w=wdef(id);if(w)return {...w,kind:'arme',frag:FRAG[w.cls],craft:CRAFT_G[w.r]};const g=gdef(id);return g?{...g,kind:g.slot,frag:FRAG[g.slot],craft:CRAFT_G[g.r]}:null}
// Tout ce qui se fabrique : armes Légendaire et au-dessus, objets des reliques.
const craftIds=()=>[...Object.values(WPN).flat().filter(w=>w.r>=3).map(w=>w.id),...Object.keys(RGEAR)];
/* ---------- Reliques : une par rareté, selon la difficulté ----------
   Ossuaire (Légendaire) en Normal, Difficile, Cauchemar ; Ancestrale en Tourment I–V ; Sanguine et Abyssale en Tourment VI–X.
   Ouvrir une relique en mission donne un fragment d'un objet de sa rareté (deux si éclatante). */
const RTIER=[{n:'Ossuaire',c:'#ff8a24',r:3},{n:'Ancestrale',c:'#ff5a7a',r:4},{n:'Sanguine',c:'#e8383f',r:5},{n:'Abyssale',c:'#b07cff',r:6}];
const RELICS={os:{t:0,n:'Relique Ossuaire'},an:{t:1,n:'Relique Ancestrale'},sa:{t:2,n:'Relique Sanguine'},ab:{t:3,n:'Relique Abyssale'}};
const REACT_N=BAL.reactN;
// Tourment : il faut moins de réactifs pour ouvrir une relique (chaque palier, puis le séjour dans la mission),
// et les reliques tombent plus souvent à mesure qu'on reste. Une tranche de séjour = 2 minutes de mission.
const SEJ_STEP=120;
const sejN=()=>typeof G!=='undefined'&&G?Math.floor((G.t||0)/SEJ_STEP):0;
function tormBoost(){const t=typeof tormT==='function'?tormT():0;if(!t)return {t:0,s:0,react:0,relic:0};const s=sejN();
  const react=Math.min(BAL.reactCutMax||0,t*(BAL.tormReact||0)+Math.min(BAL.sejReactMax||0,s*(BAL.sejReact||0)));
  return {t,s,react,relic:Math.min(BAL.sejRelicMax||0,s*(BAL.sejRelic||0))}}
const reactNeed=()=>Math.max(1,Math.round(REACT_N*(1-tormBoost().react)));
// Séjour après l'objectif (v131) : une fois l'objectif réalisé (1re manche finie en Survie et Brèche, 1re série de vagues tenue en Défense,
// 1re cible capturée), chaque minute de plus dans la mission augmente le butin des monstres et des élites : objets, fragments, mods, reliques
// (BAL.stayLoot par minute, BAL.stayLootMax au plus). G.objT = temps de mission au moment de l'objectif. Les lâchers garantis des Gardiens ne changent pas.
const stayMin=()=>typeof G!=='undefined'&&G&&G.objT!=null?Math.floor(Math.max(0,(G.t||0)-G.objT)/60):0;
const stayBonus=()=>Math.min(BAL.stayLootMax||0,stayMin()*(BAL.stayLoot||0));
function objDone(){if(typeof G==='undefined'||!G)return;G.objN=(G.objN|0)+1;if(G.objT==null)G.objT=G.t||0}
// Chance d'œuf de familier par relique ouverte, selon sa rareté (× BAL.eggMul).
const EGG_CH=[.08,.12,.15,.25];
const REL_SRC=['Normal, Difficile et Cauchemar (et plus haut sous le niveau requis)',`Tourment I et plus, niveau ${BAL.relicLv[0]}+`,`Tourment VI et plus, niveau ${BAL.relicLv[1]}+`,`Tourment VI et plus, niveau ${BAL.relicLv[2]}+, plus rare`];
// Reliques forgées : 3 reliques d'un même type donnent une relique forgée du même type, qui garantit un fragment de l'objet choisi.
// La rareté dépend du palier de Tourment, plafonnée par le niveau de mission (BAL.relicLv) : sous le niveau requis, la relique du dessous.
// free : sans ce plafond (cibles capturées : la relique suit seulement la difficulté et le Tourment).
function relicTierNow(free){const D=dif();if(!D.tier)return 0;let t=D.tier<=5?1:Math.random()<BAL.abyss[0]+BAL.abyss[1]*(D.tier-6)?3:2;
  if(free)return t;const L=(typeof G!=='undefined'&&G&&G.level)||1;while(t>0&&L<BAL.relicLv[t-1])t--;return t}
const relicName=id=>RELICS[id].n;
// Contenu d'une relique : les objets de sa rareté (armes du héros comprises). Objets d'un biome (givre, sables) seulement dans ce biome.
function relPool(t,cls=heroCls){const r=t+3,bio=typeof G!=='undefined'&&G?G.biome|0:0;
  return [...WPN[cls].filter(w=>w.r===r).map(w=>w.id),...Object.keys(RGEAR).filter(id=>RGEAR[id].r===r&&(!RGEAR[id].bio||RGEAR[id].bio===bio))]}
const SANG={
  s1:{n:'Cœur du Martyr',slot:'amulette',aff:['dmgPct','critDmg','crit','leech','apsPct','lowDmg']},
  s2:{n:'Cuirasse de la Veuve rouge',slot:'armure',aff:['hp','armor','regen','dmgPct','leech','lowArmor']},
  s3:{n:"Pas de l'Hémorragie",slot:'bottes',aff:['speed','apsPct','dmgPct','crit','leech','dashCd']},
  s4:{n:'Anneau du Sang versé',slot:'anneau',aff:['crit','critDmg','apsPct','dmgPct','leech','execute']},
  s5:{n:'Linceul écarlate',slot:'armure',aff:['hp','novaPct','skillRad','armor','cdr','regen']},
  s6:{n:'Œil du Calice',slot:'amulette',aff:['cdr','novaPct','skillRad','critDmg','ultPct','crit']},
  s7:{n:'Grèves du Bourreau rouge',slot:'bottes',aff:['speed','hp','armor','cdr','dmgPct','execute']},
  s8:{n:"Sceau de l'Ichor",slot:'anneau',aff:['dmgPct','apsPct','leech','regen','critDmg','bossDmg']},
  s9:{n:'Cœur gelé du Martyr',slot:'amulette',bio:1,aff:['cold','frz','critDmg','dmgPct','crit','shard']},
  s10:{n:"Anneau de l'Hiver sanglant",slot:'anneau',bio:1,aff:['shard','cold','crit','apsPct','frz','dmgPct']},
  s11:{n:'Linceul du Roi-Momie',slot:'armure',bio:2,aff:['hp','curse','armor','hex','regen','doom']},
  s12:{n:'Sandales de la Tempête',slot:'bottes',bio:2,aff:['speed','curse','hex','dmgPct','crit','doom']},
};
const ABY={
  a1:{n:'Œil du Néant',slot:'amulette',aff:['dmgPct','critDmg','crit','apsPct','bossDmg','cdr'],pw:'abRift'},
  a2:{n:'Linceul des Mille Âmes',slot:'armure',aff:['hp','armor','dmgPct','regen','leech','lowArmor'],pw:'abSoul'},
  a3:{n:'Couronne de l\'Éclipse',slot:'amulette',aff:['novaPct','skillRad','cdr','ultPct','crit','critDmg'],pw:'abPulse'},
  a4:{n:'Sceau du Premier Roi',slot:'anneau',aff:['dmgPct','apsPct','critDmg','crit','bossDmg','leech'],pw:'abHunt'},
  a5:{n:'Pas du Vide',slot:'bottes',aff:['speed','apsPct','crit','dashCd','hp','dmgPct'],pw:'abExec'},
  a6:{n:'Égide sans fond',slot:'armure',aff:['hp','regen','armor','lowArmor','cdr','potHeal'],pw:'abWard'},
  a7:{n:'Anneau du Sablier noir',slot:'anneau',aff:['cdr','novaPct','crit','critDmg','skillRad','apsPct'],pw:'abSoul'},
  a8:{n:'Grèves de l\'Abîme',slot:'bottes',aff:['speed','hp','dmgPct','armor','regen','crit'],pw:'abWard'},
  a9:{n:'Cœur du Blizzard éternel',slot:'amulette',bio:1,aff:['cold','frz','critDmg','crit','dmgPct','shard'],pw:'abPulse'},
  a11:{n:'Cape du Néant',slot:'dos',aff:['hp','armor','regen','lowArmor','leech','potHeal'],pw:'abWard'},
  a12:{n:'Ailes de l\'Éclipse',slot:'dos',aff:['hp','armor','regen','antidote','auraSlow','dashCd'],pw:'abSoul'},
  a10:{n:'Anneau du Néant gelé',slot:'anneau',bio:1,aff:['shard','cold','apsPct','frz','crit','critDmg'],pw:'abExec'},
  a13:{n:'Bandelettes du Néant',slot:'armure',bio:2,aff:['hp','armor','curse','hex','regen','doom'],pw:'abWard'},
  a14:{n:'Pas du Simoun',slot:'bottes',bio:2,aff:['speed','curse','hex','doom','crit','dmgPct'],pw:'abSoul'},
};
for(const k in SANG)RGEAR['S'+k.slice(1)]={...SANG[k],r:5,sang:k};
for(const k in ABY)RGEAR['B'+k.slice(1)]={...ABY[k],r:6,aby:k};
/* v141 : les affixes de capacité et de statut ne sortent plus sur les objets neufs. Sur les objets définis (reliques, armes), chacune devient
   la première affixe brute de sa liste qui manque à l'objet ; pour une arme, la valeur suit (× AFF_REMAP_K). Les objets déjà possédés gardent les leurs ;
   une arme est rebâtie depuis son modèle : elle prend l'affixe nouvelle, sauf si le joueur avait changé l'ancienne (meta.waff, w.remap), qui reste alors seule. */
const AFF_REMAP={skillRad:['novaPct','ultPct','cdr','crit','critDmg','dmgPct'],dashCd:['speed','lowArmor','hp','armor'],potHeal:['regen','hp','thorns','armor'],auraSlow:['thorns','armor','regen'],burnPct:['dotPct'],chill:['cold'],skillDur:['novaPct','cdr'],fury:['ultPct','cdr'],shock:['critDmg','dmgPct']};
const AFF_REMAP_K={burnPct:2,chill:2};
const affRemap=(k,has)=>AFF_REMAP[k]?AFF_REMAP[k].find(x=>!has.includes(x))||AFF_REMAP[k][0]:k;
for(const id in RGEAR){const T=RGEAR[id],out=[];for(const k of T.aff)out.push(affRemap(k,[...T.aff,...out]));T.aff=out}
for(const c in WPN)for(const w of WPN[c]){const o={},R={};for(const k in w.aff){const n=affRemap(k,[...Object.keys(w.aff),...Object.keys(o)]);if(n!==k)R[k]=n;o[n]=n===k?w.aff[k]:Math.round(w.aff[k]*(AFF_REMAP_K[k]||1))}w.aff=o;w.remap=R}
for(const id of craftIds()){const b=bpdef(id);RELICS['F_'+id]={t:b.r-3,fz:1,tgt:id,n:`Relique forgée · ${b.n}`}}
const baseRoll=(slot,l)=>slot==='dos'?2+Math.floor(l/25):slot==='armure'?Math.round(20+l*7):slot==='bottes'?6+Math.floor(l/4):slot==='anneau'?7+Math.floor(l*.8):3;
// Affixe propre à certaines classes (cls) : sans effet pour les autres classes, ignorée dans les statistiques et signalée sur la fiche.
const affOff=(k,c=heroCls)=>!!(AFF[k]&&AFF[k].cls&&!AFF[k].cls.includes(c));
const affOnly=k=>AFF[k].cls.map(c=>CLS[c].n).join(' et ')+' seulement';
// Objets des reliques : une affixe sans effet pour le héros qui fabrique (vol de vie hors Guerrier) est remplacée par la première de AFF_SUB absente de l'objet.
const AFF_SUB=['regen','lowArmor','thorns','antidote','hp','armor'];
const rgAff=(T,c=heroCls)=>{const out=[];for(const k of T.aff)out.push(affOff(k,c)?AFF_SUB.find(x=>!T.aff.includes(x)&&!out.includes(x))||k:k);return out};
// Fabrique un objet des reliques au niveau d'objet l.
function rgItem(id,l){const T=RGEAR[id],slot=T.slot,r=T.r;
  const it={id:uid++,slot,r,lvl:l,base:{k:BASE_STAT[slot],v:Math.round(baseRoll(slot,l)*RB[r])},aff:{},name:T.n,type:RAR[r].n,rid:id};
  if(T.sang)it.sang=T.sang;if(T.aby)it.aby=T.aby;if(T.bio)it.bio=T.bio;
  for(const k of rgAff(T)){const A=AFF[k];const v=A.r?A.r(l):5;it.aff[k]=Math.max(1,Math.round(v*RK[r]))}
  if(T.pw)it.aff[T.pw]=AFF[T.pw].r(l);return it}
// Niveau de mission le plus haut atteint, et le niveau d'objet qui en découle.
const maxL=()=>Math.max(1,meta.maxL|0);
const relicItemLvl=()=>1+(maxL()-1)*4;
const MODES={
  survie:{n:'Survie',d:'Tiens face aux hordes. Toutes les 2 minutes, sors ou continue. Chaque manche terminée rapporte une relique.'},
  defense:{n:'Défense',d:'Protège le cryopode contre des vagues d\'ennemis. Toutes les 3 vagues : une relique et un équipement, puis sors ou continue.'},
  breche:{n:'Brèche',coop:1,d:'À plusieurs seulement. Survie où les Gardiens viennent par paires de jumeaux : abattez les deux en moins de 8 s, sinon le premier se relève. Monstres +25 % de vie ; sceaux légendaires et éclats sur les Gardiens et les élites.'},
  capture:{n:'Capture',d:'Traque la cible, mets-la à terre et capture-la : une relique de la difficulté (Tourment compris) et de l\'or. Une autre cible arrive ensuite ; tiens 3 s dans la zone d\'extraction quand tu veux partir.'},
};

