// Crypte des Cendres — data.js
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

/* ---------- Progression permanente ---------- */
let meta={gold:0,up:{},tal:{},cp:1,start:1,essence:0,mods:{venin:0},
  load:{guerrier:['venin',null,null,null],archer:['venin',null,null,null],magicien:['venin',null,null,null]},
  gear:{armure:null,amulette:null,bottes:null,anneau:null},stash:[],wpn:{guerrier:'g0',archer:'a0',magicien:'m0'},bp:{},built:{},parts:{},relics:{},mode:'survie',relicSel:null,relicQ:[],diff:0,waff:{},prest:{},wish:{leg:true,aff:{}},pol:{},mast:{},align:{},wlv:{},wload:{},wpol:{},wmast:{},walign:{},hload:{},hslots:{},aura:{}};
try{const m=JSON.parse(localStorage.getItem('crypte-meta')||'null');if(m)meta=Object.assign(meta,m)}catch{}
if(!meta.v2){meta.cp=1;meta.start=1;meta.v2=1}
meta.modSt=meta.modSt||{};meta.modCp=meta.modCp||{};
if(!meta.v3){for(const id in meta.bp||{}){const w=wdef(id);if(w&&!meta.built[id])meta.gold+=w.bp||0}meta.bp={};meta.v3=1;meta.relics={lA1:[1,0],...(meta.relics||{})}}
if(!MODES[meta.mode]||meta.mode==='breche')meta.mode='survie'; // la Brèche se choisit une fois la coopération connectée
if(!Array.isArray(meta.relicQ))meta.relicQ=[];if(meta.relicSel){if(!meta.relicQ.length)meta.relicQ=[meta.relicSel];meta.relicSel=null}
// metaVer : compteur de modifications de la sauvegarde (calculs gardés en cache, comme le plan de « Tout fusionner »)
let metaVer=0,saveLock=false;
/* Cache d'un affichage du Camp (v135) : ouvert au début de drawCamp et de invRefresh, fermé à la fin. Hors affichage, rien n'est gardé :
   un résultat ne peut donc pas survivre à une modification de la sauvegarde. memo(clé, calcul) ; memoOn(étiquette, objet, calcul). */
let drawCache=null;
function memo(k,f){if(!drawCache)return f();let v=drawCache.get(k);if(v===undefined){v=f();drawCache.set(k,v)}return v}
function memoOn(tag,o,f){if(!drawCache)return f();let m=drawCache.get(tag);if(!m){m=new Map();drawCache.set(tag,m)}let v=m.get(o);if(v===undefined){v=f();m.set(o,v)}return v}
// saveLock : pendant une réinitialisation, plus rien n'écrit la sauvegarde avant le rechargement de la page.
const saveMeta=()=>{metaVer++;if(saveLock)return;try{localStorage.setItem('crypte-meta',JSON.stringify(meta))}catch{}};
// Compte : un identifiant unique tiré une fois (gardé dans la sauvegarde) et un nom choisi dans Réglages › Compte.
// En coopération, chaque joueur apparaît sous ce nom, précédé du niveau de prestige du héros qu'il joue.
if(!meta.pid||!/^[A-Z2-9]{5}$/.test(meta.pid)){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=new Uint8Array(5);try{crypto.getRandomValues(r)}catch{for(let i=0;i<5;i++)r[i]=Math.random()*256}
  meta.pid=[...r].map(x=>A[x%A.length]).join('');saveMeta()}
const NAME_MAX=16;
const cleanName=s=>String(s||'').normalize('NFC').replace(/[^\p{L}\p{N} _\-'.]/gu,'').replace(/\s+/g,' ').trim().slice(0,NAME_MAX);
const defName=()=>'Joueur-'+meta.pid;
const myName=()=>cleanName(meta.pname)||defName();
const myPr=()=>prOf(heroCls).lv|0;
function relicQFix(){const used={};meta.relicQ=(meta.relicQ||[]).filter(q=>{const a=q&&meta.relics[q.id];if(!a||!RELICS[q.id])return false;q.rad=!!q.rad;const k=q.id+'|'+(q.rad?1:0);used[k]=(used[k]||0)+1;return used[k]<=(a[q.rad?1:0]||0)})}
const relicQN=(id,rad)=>meta.relicQ.filter(q=>q.id===id&&!!q.rad===rad).length;
const DIFF=[{n:'Normal',iv:60,cnt:1,loot:0,c:'#bdb6a8'},{n:'Difficile',iv:45,cnt:2,loot:.5,c:'#7b95ff'},{n:'Cauchemar',iv:35,cnt:3,loot:1,c:'#f0cf4a'},{n:'Tourment',iv:25,cnt:4,loot:2,c:'#ff6a3a'}];
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
// Difficulté en cours : la sienne, ou en coopération celle de l'hôte pendant la mission (G.nd = {d, t}).
const dsel=()=>{const n=typeof G!=='undefined'&&G&&G.nd&&typeof started!=='undefined'&&started?G.nd:null;return n||{d:meta.diff|0,t:meta.torm|0}};
const tormT=()=>{const s=dsel();return s.d===3?Math.max(1,Math.min(10,s.t||1)):0};
const dif=()=>{const i=Math.max(0,Math.min(3,dsel().d)),D=DIFF[i];if(i<3)return Object.assign({hp:1,dm:1,aq:0,anc:0,tier:0},D);
  const t=tormT();return {n:`Tourment ${ROM[t-1]}`,iv:Math.round(BAL.tormIv[0]+(BAL.tormIv[1]-BAL.tormIv[0])*(t-1)/9),cnt:t>=6?BAL.tormCnt[1]:BAL.tormCnt[0],loot:2+.5*(t-1),c:D.c,hp:1+.5*t,dm:1+.22*t,aq:.05*t,anc:0,tier:t}};
// Charge de l'ultime (v138) : la jauge part à moitié en début de mission, puis 1 point par seconde ; chaque ennemi abattu ajoute ULT_KILL point (au plus ULT_KMAX par seconde,
// gardés en réserve jusqu'à ULT_POOL) ; un Gardien abattu en donne ULT_BOSS d'un coup. Il faut ULT_N points, moins Fureur (plafond 50 %) et 20 % avec le Cri de ralliement (v144),
// jamais moins de ULT_MIN. Les ennemis tués par l'ultime ne la rechargent pas. Avant la v138 : 60 ennemis abattus, 10 par Gardien.
const ULT_N=40,ULT_MIN=20,ULT_KILL=.5,ULT_KMAX=1.5,ULT_POOL=6,ULT_BOSS=6;
// Dégâts des ultimes en multiples de la puissance de compétence (v138) : par onde (Titan), par flèche (Pluie), par météore,
// par vague de froid (Blizzard, toutes les 0,3 s), par carreau (Tempête). Avant la v138 : 3 ; 0,7 ; 3 ; 0,5 ; 0,3.
const ULT_C={titan:3.5,pluie:.8,meteores:1.1,blizzard:.12,tempete:.35};
// Les dégâts de l'ultime comptent triple contre les Gardiens (v138) : un lancer leur retire une vraie part de vie.
const ULT_GX=3;
const upc=k=>Math.round(ULT_C[k]*100)+' %';
const lv=k=>meta.up[k]||0, hasTal=k=>!!meta.tal[k];
const ownedW=id=>{const w=wdef(id);return !!w&&(!!w.start||!!meta.built[id])};
const UPG=[
  {k:'vig',n:'Vigueur',d:l=>`+${l*8} % de vie maximale`,max:5,cost:60},
  {k:'str',n:'Force',d:l=>`+${l*6} % de dégâts`,max:5,cost:70},
  {k:'cel',n:'Célérité',d:l=>`+${l*5} % de vitesse d'attaque`,max:5,cost:70},
  {k:'alc',n:'Alchimie',d:l=>`${2+l} potions au départ`,max:3,cost:90},
  {k:'for',n:'Fortune',d:l=>`+${l*15} % d'or ramassé`,max:4,cost:80},
  {k:'luc',n:'Flair',d:l=>`Butin plus rare (chance +${l*3})`,max:3,cost:110},
  {k:'cat',n:'Catalyseur',d:l=>`Capacité de mods d'arme ${10+l*3}`,max:4,cost:100},
  {k:'rea',n:'Réacteur',d:l=>`Capacité de mods de héros ${10+l*3}`,max:4,cost:100},
];
const upCost=u=>Math.round(u.cost*BAL.forgeMul*Math.pow(1.7,lv(u.k)));
/* ---------- Prestige du héros ---------- */
const PREST=[
  {k:'hp',n:'Vitalité',per:2,t:'% de vie maximale'},
  {k:'dmg',n:'Puissance',per:2,t:'% de dégâts'},
  {k:'aps',n:'Vivacité',per:1,t:'% de vitesse d\'attaque'},
  {k:'crit',n:'Acuité',per:.5,t:'% de chances de critique',max:40},
  {k:'cdmg',n:'Brutalité',per:3,t:'% de dégâts critiques'},
  {k:'nova',n:'Arcanes',per:3,t:'% de dégâts de compétence'},
  {k:'armor',n:'Ténacité',per:.5,t:'% de dégâts subis',neg:1,max:40},
  {k:'cdr',n:'Sang-froid',per:.5,t:'% de temps de recharge',neg:1,max:30},
  {k:'spd',n:'Foulée',per:.5,t:'% de vitesse de déplacement',max:30},
  {k:'gold',n:'Opulence',per:2,t:'% d\'or ramassé'},
  {k:'srad',n:'Envergure',per:3,t:'% de portée des compétences',max:50},
  {k:'splash',n:'Déflagration',per:3,t:'% de rayon d\'explosion',max:50},
];
const prOf=(c=heroCls)=>{const o=meta.prest[c]||(meta.prest[c]={lv:0,pts:{}});o.pts=o.pts||{};return o};
const prPt=(k,c=heroCls)=>(meta.prest[c]&&meta.prest[c].pts&&meta.prest[c].pts[k])||0;
const prFree=(c=heroCls)=>{const o=prOf(c);return o.lv-Object.values(o.pts).reduce((a,b)=>a+b,0)};
const prOpen=()=>UPG.every(u=>lv(u.k)>=u.max);
const prCost=n=>({gold:600+300*n+15*n*n,ess:Math.round(30+15*n+n*n/2)});
const prFmt=v=>(Math.round(v*10)/10).toLocaleString('fr-FR');
/* ---------- Bonus de partie (montée de niveau) ---------- */
const C_ATK='#e8853b',C_DEF='#5fbf7a',C_UTI='#8fd3e0',C_ELE='#b9a6f0';
const RUP=[
  {k:'dmg',n:'Rage',d:'+12 % de dégâts',max:5,c:C_ATK},
  {k:'aps',n:'Frénésie',d:'+10 % de vitesse d\'attaque',max:5,c:C_ATK},
  {k:'crit',n:'Précision',d:'+5 % de chances de critique',max:4,c:C_ATK},
  {k:'cdmg',n:'Cruauté',d:'+30 % de dégâts critiques',max:3,c:C_ATK},
  {k:'multi',n:'Salve',d:'+1 projectile par tir',max:4,c:C_ATK,cls:['archer','magicien']},
  {k:'fan',n:'Éventail',d:'+2 projectiles par tir, −10 % de dégâts',max:2,c:C_ATK,cls:['archer','magicien']},
  {k:'echo',n:'Double tir',d:'+20 % de chances d\'attaquer deux fois de suite',max:3,c:C_ATK},
  {k:'wave',n:'Lames spectrales',d:'Chaque coup projette +1 onde tranchante',max:4,c:C_ATK,cls:['guerrier']},
  {k:'pierce',n:'Perforation',d:'Les carreaux percent 1 ennemi de plus',max:2,c:C_ATK,cls:['archer']},
  {k:'reach',n:'Grande allonge',d:'+15 % de portée de frappe',max:3,c:C_ATK,cls:['guerrier']},
  {k:'splash',n:'Onde arcanique',d:'+25 % de rayon d\'explosion',max:5,c:C_ATK,cls:['magicien']},
  {k:'nova',n:'Puissance',d:'+25 % de dégâts de compétence',max:3,c:C_ATK},
  {k:'fury',n:'Fureur',d:'L\'ultime se recharge 15 % plus vite',max:3,c:C_UTI},
  {k:'ultp',n:'Apothéose',d:'+30 % de dégâts de l\'ultime',max:3,c:C_ATK},
  {k:'hp',n:'Robustesse',d:'+15 % de vie maximale, soigne 15 %',max:5,c:C_DEF},
  {k:'regen',n:'Régénération',d:'+1,5 % de ta vie max par seconde',max:3,c:C_DEF},
  {k:'leech',n:'Vampirisme',d:'+1,5 % des dégâts rendus en vie',max:3,c:C_DEF,cls:['guerrier']},
  {k:'spd',n:'Célérité',d:'+8 % de vitesse de déplacement',max:3,c:C_UTI},
  {k:'mag',n:'Aimant',d:'+40 % de portée de ramassage',max:3,c:C_UTI},
  {k:'cdr',n:'Concentration',d:'−8 % de temps de recharge',max:4,c:C_UTI},
  {k:'burn',n:'Braises',d:'Embrase : 10 % des dégâts par seconde',max:3,c:C_ELE},
  {k:'chill',n:'Givre',d:'+10 % de chances de ralentir à l\'impact',max:3,c:C_ELE},
  {k:'shock',n:'Orage',d:'+6 % de chances d\'éclair en chaîne',max:3,c:C_ELE},
  {k:'srad',n:'Ampleur',d:'+20 % de portée des compétences',max:5,c:C_ATK},
  {k:'sdur',n:'Prolongation',d:'+15 % de durée des compétences et des ralentissements',max:3,c:C_UTI},
  {k:'exec',n:'Exécution',d:'+40 % de dégâts contre les ennemis sous 30 % de vie',max:3,c:C_ATK},
  {k:'slay',n:'Tueur de Gardiens',d:'+20 % de dégâts contre les Gardiens',max:3,c:C_ATK},
  {k:'refl',n:'Réflexes',d:'−15 % de recharge de l\'esquive',max:3,c:C_UTI},
  {k:'endu',n:'Endurci',d:'−20 % de durée du poison, de la brûlure et de la gelure',max:2,c:C_DEF},
  {k:'know',n:'Savoir',d:'+20 % d\'expérience',max:3,c:C_UTI},
  {k:'luck',n:'Bonne étoile',d:'+15 % de chances de butin pendant la mission',max:3,c:'#f0cf4a'},
  {k:'fiole',n:'Fiole de réserve',d:'+1 potion tout de suite',max:3,c:C_DEF},
];
const RUP_FILL=[{k:'heal',n:'Soin',d:'Rend 40 % de ta vie',max:0,c:C_DEF},{k:'purse',n:'Bourse',d:'Gagne de l\'or tout de suite',max:0,c:'#f0cf4a'}];
/* Cumul d'un bonus de partie au rang n (v139, écran de montée de niveau : « ce que le bonus donne déjà → ce qu'il donnera si tu le prends »).
   Les valeurs suivent stats() ; le texte du bonus, juste au-dessus, dit de quoi il s'agit. RUP_CAP : statistique plafonnée et son plafond. */
const rupP=(v,sg='+')=>n=>n?`${sg}${fmtN(v*n)} %`:'0 %',rupN=n=>n?`+${n}`:'0';
const RUP_CU={dmg:rupP(12),aps:rupP(10),crit:rupP(5),cdmg:rupP(30),multi:rupN,fan:n=>n?`+${2*n} projectiles et −${10*n} %`:'0',echo:rupP(20),wave:rupN,pierce:rupN,
  reach:rupP(15),splash:rupP(25),nova:rupP(25),fury:rupP(15),ultp:rupP(30),hp:rupP(15),regen:rupP(1.5),leech:rupP(1.5),spd:rupP(8),mag:rupP(40),cdr:rupP(8,'−'),
  burn:n=>n?`${10*n} %`:'0 %',chill:rupP(10),shock:rupP(6),srad:rupP(20),sdur:rupP(15),exec:rupP(40),slay:rupP(20),refl:rupP(15,'−'),endu:rupP(20,'−'),know:rupP(20),luck:rupP(15)};
const RUP_CAP={crit:['crit',75],cdr:['cdr',50],fury:['fury',50],refl:['dashCd',60],endu:['antidote',60]};
const xpNeed=l=>Math.round(120*Math.pow(1.32,l-1)+20*l);
/* ---------- Sorts et ultimes (v132) ----------
   Trois sorts (compétence, touche E) et trois ultimes (touche F) par héros. Le 1er de chaque liste est celui d'origine ;
   le 2e s'ouvre au rang 3 de maîtrise du héros, le 3e au rang 6 (KIT_MAST). Choix par héros : meta.kit[classe] = {s, u}, dans Héros › Sorts et talents.
   Toutes les statistiques comptent : dégâts = S.nova (dégâts de compétence : dégâts du héros × 4 × (1 + dégâts de compétence %)),
   rayons et portées × (1 + portée des compétences %), durées des sorts × (1 + durée des compétences %), recharge × (1 − réduction de recharge %),
   ultimes : dégâts × (1 + dégâts de l'ultime %) ; pendant un ultime de renfort (Œil du faucon, Fureur, Surcharge), tous les dégâts du héros × ce même bonus.
   Critiques, éléments (brûlure, gel, éclair), vol de vie et bonus contre Gardiens s'appliquent comme aux attaques. */
const KIT_MAST=[0,3,6];
const SPELLS={
  archer:{s:[{k:'volee',n:'Volée',cd:7,d:'24 carreaux perforants dans toutes les directions (35 % des dégâts de compétence chacun).'},
      {k:'chasseur',n:'Tir du chasseur',cd:6,icon:'<path d="M3 7h13M3 12h16M3 17h13"/><path d="M13 4l3 3-3 3M16 9l3 3-3 3M13 14l3 3-3 3"/>',d:'3 carreaux lourds vers l\'ennemi le plus proche, qui transpercent tout (160 % des dégâts de compétence chacun, critiques possibles).'},
      {k:'recul',n:'Bond arrière',cd:6,icon:'<path d="M13 5 6 12l7 7"/><path d="M6 12h14"/><path d="M3 5v14"/>',d:'Saut de 220 px en arrière, intouchable pendant le saut, puis 9 carreaux en éventail vers l\'avant (50 % des dégâts de compétence chacun).'}],
    u:[{k:'pluie',n:'Pluie d\'acier',d:`3 s de flèches sur les ennemis proches, dont une sur quatre sur un Gardien proche (${upc('pluie')} des dégâts de compétence par flèche, critiques possibles).`},
      {k:'faucon',n:'Œil du faucon',icon:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',d:'6 s : cadence doublée et tous tes tirs critiques.'},
      {k:'tempete',n:'Tempête de carreaux',icon:'<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6 8 8 0 1 1-8-8"/>',d:`3 s de carreaux perforants en spirale tout autour (${upc('tempete')} des dégâts de compétence chacun, critiques possibles).`}]},
  guerrier:{s:[{k:'tourbillon',n:'Tourbillon',cd:9,d:'Tournoie 1,6 s en frappant tout autour (22 % des dégâts de compétence toutes les 0,2 s) ; dégâts subis réduits de moitié.'},
      {k:'bond',n:'Bond écrasant',cd:8,icon:'<path d="M4 19C6 10 12 5 19 5"/><path d="M15 3l4 2-2 4"/><path d="M2 21h10"/>',d:'Bondit vers le groupe d\'ennemis le plus proche (300 px au plus) ; l\'atterrissage blesse tout autour (140 % des dégâts de compétence), ralentit et repousse.'},
      {k:'cri',n:'Cri de guerre',cd:12,icon:'<path d="M4 9v6h4l6 4V5L8 9z"/><path d="M17 8a5 5 0 0 1 0 8M20 5a9 9 0 0 1 0 14"/>',d:'6 s : dégâts +30 % et dégâts subis −30 % ; repousse et ralentit les ennemis proches.'}],
    u:[{k:'titan',n:'Colère du Titan',d:`Onde de choc géante (${upc('titan')} des dégâts de compétence) et 3 s d'invulnérabilité.`},
      {k:'rempart',n:'Rempart',icon:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v8M8 12h8"/>',d:'6 s : bouclier de 60 % de ta vie, et la moitié de chaque coup reçu renvoyée à l\'ennemi le plus proche.'},
      {k:'berserk',n:'Fureur du berserker',icon:'<path d="M12 2c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3-1-5 0-7z"/>',d:'8 s : vitesse d\'attaque +60 %, portée de frappe +40 %, vol de vie +6 %, insensible aux ralentissements.'}]},
  magicien:{s:[{k:'nova',n:'Nova de givre',cd:7,d:'Onde glacée autour de toi (100 % des dégâts de compétence) : ralentit, repousse et dissipe les projectiles ennemis.'},
      {k:'eclair',n:'Éclair en chaîne',cd:6,icon:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',d:'Foudroie l\'ennemi le plus proche puis 6 autres à la suite (120 % des dégâts de compétence, 10 % de moins à chaque saut, critiques possibles).'},
      {k:'transfert',n:'Transfert',cd:7,icon:'<circle cx="5" cy="12" r="2"/><circle cx="18" cy="12" r="3.5"/><path d="M8.5 12h1.5M12 12h1.5"/>',d:'Téléportation de 240 px dans ta direction ; explosion glacée au départ et à l\'arrivée (60 % des dégâts de compétence, ralentit).'}],
    u:[{k:'meteores',n:'Pluie de météores',d:`3 météores sur les ennemis proches, en priorité les Gardiens (${upc('meteores')} des dégâts de compétence chacun, critiques possibles).`},
      {k:'blizzard',n:'Blizzard',icon:'<path d="M7 15a4 4 0 1 1 1-7.9A5 5 0 0 1 18 8a3.5 3.5 0 0 1 0 7z"/><path d="M8 19v.01M12 19v.01M16 19v.01M10 22v.01M14 22v.01"/>',d:`5 s de froid autour de toi : toutes les 0,3 s, ${upc('blizzard')} des dégâts de compétence et ralentissement (critiques possibles).`},
      {k:'surcharge',n:'Surcharge arcanique',icon:'<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4"/>',d:'6 s : sort rechargé en 0,5 s, cadence doublée, explosions +50 %.'}]},
};
// Icônes d'origine (celles de la classe) pour le 1er sort et le 1er ultime.
for(const c in SPELLS){SPELLS[c].s[0].icon=CLS[c].icon;SPELLS[c].u[0].icon=CLS[c].uicon}
// Choix en cours d'un héros (un choix encore verrouillé revient au 1er).
const kitOk=(c,i)=>i>0&&i<3&&mastOf(c).r>=KIT_MAST[i];
const kitOf=(c=heroCls)=>{const k=(meta.kit&&meta.kit[c])||{};return {s:kitOk(c,k.s|0)?k.s|0:0,u:kitOk(c,k.u|0)?k.u|0:0}};
const kitS=(c=heroCls)=>SPELLS[c].s[kitOf(c).s],kitU=(c=heroCls)=>SPELLS[c].u[kitOf(c).u];
const TAL={
  guerrier:[{k:'g_charge',n:'Charge brutale',d:"L'esquive blesse et repousse les ennemis traversés.",cost:150},
            {k:'g_blood',n:'Soif de sang',d:'Chaque ennemi abattu te rend 2 % de ta vie.',cost:300},
            {k:'g_quake',n:'Onde de choc',d:'Un coup sur quatre libère une onde qui frappe tout autour.',cost:500}],
  archer:[{k:'a_move',n:'Tir en course',d:'Tu tires à pleine cadence même en courant.',cost:150},
          {k:'a_shadow',n:"Pas de l'ombre",d:'Après une esquive, tes 3 tirs suivants sont critiques.',cost:300},
          {k:'a_rico',n:'Ricochet',d:'Chaque carreau rebondit une fois vers un autre ennemi.',cost:500}],
  magicien:[{k:'m_blink',n:'Sillage de givre',d:"L'esquive laisse une explosion glacée qui ralentit.",cost:150},
            {k:'m_shield',n:'Barrière',d:'Un bouclier absorbe 25 % de ta vie. Il se recharge après 4 s sans être touché.',cost:300},
            {k:'m_chain',n:"Chaîne d'éclairs",d:'Chaque orbe a 25 % de chances de foudroyer 3 ennemis proches (80 % de ses dégâts).',cost:500}],
};

/* ---------- Mods ---------- */
/* Statuts (v141) : poison (couches), saignement (3 à la fois), étourdir et immobiliser (immunité après), plafonds de chance par coup. */
// BAL.psnPct, BAL.bldPct : réglages d'essai du banc de progression (--bal).
const PSN_PCT=BAL.psnPct||15,PSN_T=4,PSN_MAX=10,BLD_PCT=BAL.bldPct||60,BLD_T=3,BLD_MAX=3,STUN_T=.6,STUN_IMM=1.5,ROOT_T=1.5,ROOT_IMM=2;
// Réglage d'essai du banc (BAL.explSt, 0 dans le jeu) : chance des statuts posés par les explosions sans Déflagration, en % de leur chance.
// Essayé en v143 à 25 % pour le Magicien : pas de gain mesuré, gardé à 0.
const EXPL_ST=BAL.explSt!=null?BAL.explSt:0;
const ST_CAP={psnCh:60,bldCh:60,chill:60,shock:40,stunCh:25,rootCh:30,contag:60};
const surtJ=v=>Math.max(1,Math.round(v*10)-1);
const MOD_RAR=[{n:'Bronze',c:'#c98a5a'},{n:'Argent',c:'#cfd8e3'},{n:'Or',c:'#f0cf4a'}];
const MODS={
  /* Mods d'arme (v141) : les statuts posés à l'impact, leur réglage, la frappe ; Or = transformations.
     Rangs 0 à max (comme les autres mods) : valeur (b + v × (rang + 1)) × (1 + 12 % par étoile) ; Venin et Entaille 5 valeurs, les autres 3, Pointe de diamant 1. Les statistiques brutes (dégâts, cadence, critique) sont aux affixes. */
  venin:{n:'Venin',r:0,max:4,drain:3,k:'psnCh',v:8,t:v=>`${v} % de chances d'empoisonner : une couche, ${PSN_PCT} % des dégâts du coup par seconde pendant ${PSN_T} s (${PSN_MAX} couches au plus)`},
  entaille:{n:'Entaille',r:0,max:4,drain:3,k:'bldCh',v:6,t:v=>`${v} % de chances de faire saigner : ${BLD_PCT} % des dégâts du coup en ${BLD_T} s (${BLD_MAX} saignements au plus)`},
  givre:{n:'Morsure du givre',r:0,max:2,drain:3,k:'chill',v:10,t:v=>`${v} % de chances de ralentir 2 s à l'impact`},
  braise:{n:'Braise vive',r:1,max:2,drain:4,k:'burnPct',v:15,t:v=>`Embrase : ${v} % des dégâts par seconde pendant 2,5 s`},
  orage:{n:'Arc électrique',r:1,max:2,drain:4,k:'shock',v:6,t:v=>`${v} % de chances de lancer un éclair en chaîne`},
  coup:{n:'Coup sourd',r:1,max:2,drain:4,k:'stunCh',v:4,t:v=>`${v} % de chances d'étourdir ${fmtN(STUN_T)} s (Gardiens : 3 fois moins)`},
  entrave:{n:'Entrave',r:1,max:2,drain:4,k:'rootCh',v:5,t:v=>`${v} % de chances d'immobiliser ${fmtN(ROOT_T)} s (Gardiens : 2 fois moins)`},
  virulence:{n:'Virulence',r:1,max:2,drain:4,k:'stDur',v:15,t:v=>`+${v} % de durée des statuts posés à l'impact (sauf l'étourdissement)`},
  contagion:{n:'Contagion',r:1,max:2,drain:4,k:'contag',v:10,t:v=>`${v} % de chances qu'un statut posé touche aussi l'ennemi le plus proche`},
  rafale:{n:'Rafale',r:1,max:2,drain:4,k:'echo',v:8,t:v=>`${v} % de chances que l'attaque parte deux fois`},
  oeil:{n:'Œil du chasseur',r:1,max:2,drain:3,k:'critSt',v:6,t:v=>`+${v} % de chances de critique contre un ennemi qui porte un statut`},
  boucherie:{n:'Boucherie',r:1,max:2,drain:3,k:'cdSt',v:25,t:v=>`+${v} % de dégâts critiques contre un ennemi qui porte un statut`},
  embrasement:{n:'Embrasement',r:2,max:2,drain:5,k:'embr',b:60,v:30,t:v=>`Un ennemi qui meurt en brûlant enflamme ceux à moins de ${Math.round(v)} px`},
  peste:{n:'Peste',r:2,max:2,drain:5,k:'peste',b:2,v:1,t:v=>`À ${PSN_MAX} couches, le poison passe aux ennemis proches : ${Math.floor(v)} couches`},
  hemorragie:{n:'Hémorragie',r:2,max:2,drain:5,k:'hemo',v:25,t:v=>`Tes critiques font toujours saigner ; leurs saignements +${v} %`},
  cryogenie:{n:'Cryogénie',r:2,max:2,drain:5,k:'cryo',b:.4,v:.2,t:v=>`Ralentir un ennemi déjà ralenti le gèle ${fmtN(v)} s (Gardiens : ralentis 1 s de plus)`},
  surtension:{n:'Surtension',r:2,max:2,drain:5,k:'surt',b:.1,v:.1,t:v=>`L'éclair en chaîne étourdit ${fmtN(v)} s et touche ${surtJ(v)} ennemi${surtJ(v)>1?'s':''} de plus`},
  catalyse:{n:'Catalyse',r:2,max:2,drain:5,k:'cata',v:10,t:v=>`+${v} % de dégâts contre un ennemi qui porte au moins 2 statuts différents`},
  diamant:{n:'Pointe de diamant',r:2,max:0,drain:5,k:'diam',v:1,cls:['archer'],t:()=>'Un carreau qui transperce pose à coup sûr les statuts de l\'arme sur les ennemis suivants'},
  deflagration:{n:'Déflagration',r:2,max:2,drain:5,k:'defl',b:25,v:25,cls:['magicien'],t:v=>`Les explosions posent les statuts de l'arme à ${v} % de leur chance`},
  soif:{n:'Soif du fer',r:2,max:2,drain:5,k:'soif',v:2,cls:['guerrier'],t:v=>`Tu récupères ${v} % des dégâts de tes saignements en vie`},
  /* Mods de héros (v142) : les capacités (sort, esquive, potion, ultime) ; la vie, la réduction et la vitesse brutes viennent des affixes.
     Rangs 0 à max comme les mods d'arme ; les mods Or montent d'un cran de leur liste (b + v × (rang + 1)). */
  flux:{type:'h',n:'Flux',r:1,max:2,drain:3,k:'flux',v:.2,t:v=>`Chaque ennemi abattu par ton sort retire ${fmtN(v)} s à sa recharge (2 s au plus par lancer)`},
  intensite:{type:'h',n:'Intensité',r:1,max:2,drain:3,k:'intSt',v:20,t:v=>`+${v} % de dégâts du sort contre un ennemi qui porte un statut`},
  etendue:{type:'h',n:'Étendue',r:1,max:4,drain:4,k:'skillRad',v:15,t:v=>`+${v} % de portée des compétences`},
  persist:{type:'h',n:'Persistance',r:1,max:2,drain:4,k:'skillDur',v:12,t:v=>`+${v} % de durée du sort, des ralentissements et des immobilisations`},
  impregnation:{type:'h',n:'Imprégnation',r:2,max:2,drain:5,k:'impr',b:1,v:.5,t:v=>`Les statuts posés par ton sort ont ${fmtN(v)} fois plus de chances (plafonds inchangés)`},
  commotion:{type:'h',n:'Commotion',r:2,max:2,drain:5,k:'comm',b:.2,v:.2,t:v=>`Ton sort étourdit ${fmtN(v)} s (Gardiens : 3 fois moins)`},
  garde:{type:'h',n:'Garde arcanique',r:2,max:2,drain:5,k:'gardA',b:4,v:4,t:v=>`Lancer ton sort donne un bouclier de ${v} % de ta vie pendant 4 s (boucliers à 50 % de ta vie au plus)`},
  fantome:{type:'h',n:'Pas fantôme',r:1,max:2,drain:3,k:'dashCd',v:10,t:v=>`−${v} % de recharge de l'esquive`},
  elan:{type:'h',n:'Élan',r:0,max:4,drain:2,k:'elan',v:8,t:v=>`+${v} % de vitesse pendant 2 s après une esquive`},
  peau:{type:'h',n:'Seconde peau',r:0,max:4,drain:2,k:'peau',v:8,t:v=>`−${v} % de dégâts subis pendant 1,5 s après une esquive`},
  paselem:{type:'h',n:'Pas élémentaire',r:2,max:2,drain:5,k:'pasEl',b:25,v:25,t:v=>`L'esquive pose les statuts de ton arme sur les ennemis traversés, à ${v} % de leur chance`},
  riposte:{type:'h',n:'Riposte',r:2,max:2,drain:5,k:'ripo',b:.3,v:.2,t:v=>`Après une esquive, ton coup suivant étourdit ${fmtN(v)} s`},
  alchimiste:{type:'h',n:'Alchimiste',r:0,max:2,drain:2,k:'potHeal',v:15,t:v=>`+${v} % de soin des potions`},
  econome:{type:'h',n:'Économe',r:1,max:2,drain:3,k:'econ',v:10,t:v=>`${v} % de chances que la potion ne soit pas consommée`},
  elixfer:{type:'h',n:'Élixir de fer',r:2,max:2,drain:5,k:'exFer',b:10,v:10,t:v=>`Boire réduit les dégâts subis de ${v} % pendant 4 s`},
  elixrage:{type:'h',n:'Élixir de rage',r:2,max:2,drain:5,k:'exRage',b:1.5,v:3.5,t:v=>`Boire charge l'ultime de ${Math.floor(v)} points (sur ${ULT_N})`},
  ame:{type:'h',n:'Âme ardente',r:1,max:2,drain:3,k:'fury',v:5,t:v=>`L'ultime se recharge ${v} % plus vite`},
  prolong:{type:'h',n:'Prolongement',r:1,max:2,drain:4,k:'buffDur',v:10,t:v=>`+${v} % de durée des renforts (Œil du faucon, Fureur du berserker, Surcharge, Rempart) et du Blizzard`},
  remanence:{type:'h',n:'Rémanence',r:2,max:2,drain:6,k:'rema',b:5,v:10,t:v=>`Quand tu lances l'ultime, ${v} % de sa jauge revient aussitôt`},
  fleau:{type:'h',n:'Fléau',r:2,max:2,drain:5,k:'flea',b:1,v:.5,t:v=>`Les statuts posés par l'ultime ont ${fmtN(v)} fois plus de chances (plafonds inchangés)`},
  presence:{type:'a',n:'Présence glaciale',r:2,max:2,drain:0,cap:4,k:'auraSlow',v:8,t:v=>`Ennemis à moins de 180 px ralentis de ${v} %`},
  terreur:{type:'a',n:'Terreur',r:2,max:2,drain:0,cap:4,k:'terr',v:5,t:v=>`Ennemis à moins de 180 px : ${v} % de dégâts en moins contre toi`},
  cupidite:{type:'a',n:'Cupidité',r:1,max:2,drain:0,cap:4,k:'goldPct',v:10,t:v=>`+${v} % d'or ramassé`},
};
/* Surcharge des mods : au rang max, des copies du même mod + de l'essence ajoutent des étoiles (5 max), +12 % de la valeur chacune. */
const MOD_ST_MAX=5,MOD_ST_K=.12;
const modSt=id=>(meta.modSt&&meta.modSt[id])|0;
const modCanStar=id=>!['pierce','diam','impr','rema','flea','pCleanse','pPocket','pEcho'].includes(MODS[id].k);
const starCost=(id,st)=>({cp:Math.ceil((st+1)*BAL.starCopies),ess:50*(MODS[id].r+1)*(st+1)});
const modVal=(id,rk,st=modSt(id))=>{const m=MODS[id],x=((m.b||0)+m.v*(rk+1))*(1+MOD_ST_K*st);return x>=10?Math.round(x):x>=1?+x.toFixed(1):+x.toFixed(2)};
const modDrain=(id,rk,st=modSt(id))=>MODS[id].drain+rk+Math.floor(st/2);
const fuseCost=(id,rk)=>10*Math.pow(2,rk)*(MODS[id].r+1);
const POL={b:{n:'Braise',c:'#e8853b',s:'▲'},r:{n:'Rempart',c:'#5fbf7a',s:'■'},s:{n:'Spirale',c:'#b9a6f0',s:'◆'}};
// BAL.modV : réglages d'essai du banc de progression (--bal '{"modV":{"venin":{"v":10}}}'), valeurs d'un mod remplacées.
if(BAL.modV)for(const k in BAL.modV)if(MODS[k])Object.assign(MODS[k],BAL.modV[k]);
const MOD_POL={venin:'s',entaille:'b',givre:'s',braise:'b',orage:'s',coup:'r',entrave:'r',virulence:'s',contagion:'s',rafale:'b',oeil:'b',boucherie:'b',embrasement:'b',peste:'s',hemorragie:'b',cryogenie:'s',surtension:'s',catalyse:'s',diamant:'b',deflagration:'s',soif:'r',
  flux:'s',intensite:'s',etendue:'s',persist:'s',impregnation:'s',commotion:'r',garde:'r',fantome:'r',elan:'b',peau:'r',paselem:'s',riposte:'r',alchimiste:'r',econome:'r',elixfer:'r',elixrage:'b',ame:'b',prolong:'s',remanence:'b',fleau:'s'};
const mastOf=c=>(meta.mast[c]||(meta.mast[c]={r:0,xp:0}));
const mastNeed=r=>100*(r+1);
const deCls=c=>c==='archer'?"de l'Archer":`du ${CLS[c].n}`;
const modOk=(id,c)=>!MODS[id].cls||MODS[id].cls.includes(c);
const modKind=id=>MODS[id].type||'w',bKind=id=>{const k=modKind(id);return k==='w'||k==='p'?k:'h'};
const curWid=(c=heroCls)=>meta.wpn[c]&&ownedW(meta.wpn[c])?meta.wpn[c]:WPN[c][0].id;
const arrOf=(o,k,n)=>{let a=o[k];if(!a)a=o[k]=Array(n).fill(null);while(a.length<n)a.push(null);return a};
const mstOf=(o,k)=>o[k]||(o[k]={r:0,xp:0});
const deW=n=>/^[aeiouyéèêâîôh]/i.test(n)&&!/^h/i.test(n)?`de l'${n}`:`de ${n}`;
const HSLOT_MAX=6,HSLOT_COST=[15,30,50];
const auraCap=id=>id&&meta.mods[id]!=null?MODS[id].cap+meta.mods[id]:0;
function build(kind,c=heroCls){
  if(kind==='p')return petBuild();
  if(kind==='w'){const wid=curWid(c);return {kind,key:wid,load:arrOf(meta.wload,wid,4),pol:arrOf(meta.wpol,wid,4),mast:mstOf(meta.wmast,wid),slots:4,alignStore:meta.walign,cap0:10+lv('cat')*3,name:wdef(wid).n,de:deW(wdef(wid).n)}}
  const au=meta.aura[c]||null;
  return {kind:'h',key:c,load:arrOf(meta.hload,c,HSLOT_MAX),pol:arrOf(meta.pol,c,HSLOT_MAX),mast:mastOf(c),slots:meta.hslots[c]||3,alignStore:meta.align,cap0:10+lv('rea')*3+auraCap(au),name:CLS[c].n,de:deCls(c),aura:au};
}
const bCap=b=>b.cap0+b.mast.r;
const bDrain=(b,id,rk,i)=>{const base=modDrain(id,rk),p=b.pol[i];return !p?base:p===MOD_POL[id]?Math.ceil(base/2):Math.ceil(base*1.25)};
const bUsed=b=>b.load.slice(0,b.slots).reduce((a,id,i)=>a+(id&&meta.mods[id]!=null?bDrain(b,id,meta.mods[id],i):0),0);
function bActive(b,c=heroCls){const out=[];let u=0;const cap=bCap(b);b.load.slice(0,b.slots).forEach((id,i)=>{if(!id||meta.mods[id]==null||!modOk(id,c))return;const d=bDrain(b,id,meta.mods[id],i);if(u+d<=cap){u+=d;out.push(id)}});return out}
function bBest(b,id,rk){let best=-1,bd=1e9;for(let i=0;i<b.slots;i++){if(b.load[i])continue;const d=bDrain(b,id,rk,i);if(d<bd){bd=d;best=i}}return {i:best,d:bd}}
const bAlignCost=b=>200*Math.pow(2,Math.min(3,b.alignStore[b.key]||0));
const fragTotal=()=>Object.values(meta.parts).reduce((a,p)=>a+p.reduce((x,y)=>x+y,0),0);
function takeFrags(n){while(n>0){let bk=null,bi=0,bv=0;for(const k in meta.parts)meta.parts[k].forEach((v,i)=>{if(v>bv){bv=v;bk=k;bi=i}});if(!bk)return false;meta.parts[bk][bi]--;n--}return true}
function allMods(c=heroCls){const out=[...bActive(build('w',c),c),...bActive(build('h',c),c)];const au=meta.aura[c];if(au&&meta.mods[au]!=null)out.push(au);return out}
if(!meta.v4){
  for(const c of Object.keys(CLS)){const old=(meta.load&&meta.load[c])||[],wid=curWid(c),wl=arrOf(meta.wload,wid,4),hl=arrOf(meta.hload,c,HSLOT_MAX);let hi=0;
    old.forEach((id,i)=>{if(!id||!MODS[id])return;if(modKind(id)==='w')wl[i]=id;else if(hi<3)hl[hi++]=id});
    meta.wpol[wid]=meta.pol[c]?meta.pol[c].slice(0,4):[null,null,null,null];meta.walign[wid]=meta.align[c]||0;
    if(meta.mast[c])meta.wmast[wid]={r:meta.mast[c].r,xp:meta.mast[c].xp};
    meta.pol[c]=Array(HSLOT_MAX).fill(null);meta.align[c]=0}
  meta.v4=1;saveMeta();
}
/* v141 : mods d'arme refaits. Chaque ancien mod devient son équivalent (rang, étoiles, copies gardés ; un rang au-delà du nouveau maximum est
   remboursé) ; Férocité, Cadence et Allonge (statistiques des affixes) sont remboursés : toute l'essence de leurs rangs et de leurs étoiles,
   plus 8 × (rareté + 1) par copie. meta.modNote : résumé montré une fois au Camp. */
if((meta.modV|0)<1){
  const OLDR={ferocite:0,cadence:0,allonge:0,deflagration:0,dedoublement:2,sangsue:1,diamant:1,orage:2,givre:0,braise:1,oeil:1,boucherie:1};
  const REN={dedoublement:'rafale',sangsue:'soif'},REF=['ferocite','cadence','allonge'];
  const rankEss=(r,from,to)=>{let e=0;for(let i=from;i<to;i++)e+=10*Math.pow(2,i)*(r+1);return e};
  const starEss=(r,st)=>{let e=0;for(let i=0;i<st;i++)e+=50*(r+1)*(i+1);return e};
  const swap=(L,a,b)=>{if(L)for(let i=0;i<L.length;i++)if(L[i]===a)L[i]=b};
  const everyLoad=f=>{for(const k in meta.wload)f(meta.wload[k]);for(const c in (meta.sets||{}))for(const st of meta.sets[c]||[])if(st&&st.wm)f(st.wm)};
  let conv=0,ref=0,ess=0;
  for(const id of REF)if(meta.mods[id]!=null){const r=OLDR[id];ess+=rankEss(r,0,meta.mods[id]|0)+starEss(r,meta.modSt[id]|0)+(meta.modCp[id]|0)*8*(r+1);
    delete meta.mods[id];delete meta.modSt[id];delete meta.modCp[id];everyLoad(L=>swap(L,id,null));ref++}
  for(const [o,n] of Object.entries(REN))if(meta.mods[o]!=null){const rk=meta.mods[o]|0,mx=MODS[n].max;ess+=rankEss(OLDR[o],mx,rk);
    meta.mods[n]=Math.min(rk,mx);if(meta.modSt[o])meta.modSt[n]=meta.modSt[o];if(meta.modCp[o])meta.modCp[n]=meta.modCp[o];
    delete meta.mods[o];delete meta.modSt[o];delete meta.modCp[o];everyLoad(L=>swap(L,o,n));conv++}
  for(const id of ['givre','braise','oeil','boucherie','orage','diamant','deflagration'])if(meta.mods[id]!=null){const mx=MODS[id].max,rk=meta.mods[id]|0;
    if(rk>mx){ess+=rankEss(OLDR[id],mx,rk);meta.mods[id]=mx}if(!modCanStar(id)&&meta.modSt[id]){ess+=starEss(OLDR[id],meta.modSt[id]);delete meta.modSt[id]}conv++}
  // un ancien joueur reçoit aussi Venin (rang 0), le mod de départ des nouveaux joueurs, pour poser tout de suite un statut
  let ven=0;if((conv||ref)&&meta.mods.venin==null){meta.mods.venin=0;ven=1}
  if(conv||ref){meta.essence=(meta.essence|0)+ess;meta.modNote={conv,ref,ess,ven}}
  meta.modV=1;saveMeta()}
/* v142 : mods de héros refaits. Intensité, Flux, Étendue, Persistance, Pas fantôme, Alchimiste et les auras Présence glaciale et Cupidité
   gardent leur nom (rang ramené au nouveau maximum, l'excédent remboursé) ; Ferveur devient Terreur ; les 8 mods de survie brute
   (Vitalité, Égide, Pas léger, Second souffle, Rapace, Dernier rempart, Rage du survivant, Antidote) sont remboursés comme en v141.
   Le message de conversion s'ajoute à celui de la v141 s'il n'a pas encore été lu. */
if((meta.modV|0)<2){
  const OLDR={vitalite:0,egide:0,pas:0,souffle:0,rapace:0,dernier:1,survivant:2,antidote:0,intensite:0,flux:1,etendue:1,persist:1,fantome:1,alchimiste:0,presence:2,cupidite:1,ferveur:2};
  const REF=['vitalite','egide','pas','souffle','rapace','dernier','survivant','antidote'],REN={ferveur:'terreur'},KEEP=['intensite','flux','etendue','persist','fantome','alchimiste','presence','cupidite'];
  const rankEss=(r,from,to)=>{let e=0;for(let i=from;i<to;i++)e+=10*Math.pow(2,i)*(r+1);return e};
  const starEss=(r,st)=>{let e=0;for(let i=0;i<st;i++)e+=50*(r+1)*(i+1);return e};
  const swap=(L,a,b)=>{if(L)for(let i=0;i<L.length;i++)if(L[i]===a)L[i]=b};
  const everyLoad=f=>{for(const k in meta.hload)f(meta.hload[k]);for(const c in (meta.sets||{}))for(const st of meta.sets[c]||[])if(st&&st.hm)f(st.hm)};
  const auraSwap=(a,b)=>{for(const c in meta.aura)if(meta.aura[c]===a)meta.aura[c]=b;for(const c in (meta.sets||{}))for(const st of meta.sets[c]||[])if(st&&st.au===a)st.au=b};
  let conv=0,ref=0,ess=0;
  for(const id of REF)if(meta.mods[id]!=null){const r=OLDR[id];ess+=rankEss(r,0,meta.mods[id]|0)+starEss(r,meta.modSt[id]|0)+(meta.modCp[id]|0)*8*(r+1);
    delete meta.mods[id];delete meta.modSt[id];delete meta.modCp[id];everyLoad(L=>swap(L,id,null));ref++}
  for(const [o,n] of Object.entries(REN))if(meta.mods[o]!=null){const rk=meta.mods[o]|0,mx=MODS[n].max;ess+=rankEss(OLDR[o],mx,rk);
    meta.mods[n]=Math.min(rk,mx);if(meta.modSt[o])meta.modSt[n]=meta.modSt[o];if(meta.modCp[o])meta.modCp[n]=meta.modCp[o];
    delete meta.mods[o];delete meta.modSt[o];delete meta.modCp[o];auraSwap(o,n);conv++}
  for(const id of KEEP)if(meta.mods[id]!=null){const mx=MODS[id].max,rk=meta.mods[id]|0;if(rk>mx){ess+=rankEss(OLDR[id],mx,rk);meta.mods[id]=mx}conv++}
  // un ancien mod d'aura retiré ne reste pas équipé
  for(const c in meta.aura)if(meta.aura[c]&&!MODS[meta.aura[c]])meta.aura[c]=null;
  if(conv||ref){meta.essence=(meta.essence|0)+ess;const n=meta.modNote||{conv:0,ref:0,ess:0};meta.modNote={...n,conv:(n.conv|0)+conv,ref:(n.ref|0)+ref,ess:(n.ess|0)+ess,h:1}}
  meta.modV=2;saveMeta()}
function rollMod(boss){const x=Math.random()*100,r=x<(boss?30:8)?2:x<(boss?75:38)?1:0;return pick(Object.keys(MODS).filter(id=>MODS[id].r===r&&modOk(id,heroCls)))}

/* ---------- Objets ---------- */
const AFF={
  dmgPct:{t:v=>`+${v} % de dégâts`,r:l=>ri(6,12)+Math.floor(l*.6)},
  apsPct:{t:v=>`+${v} % de vitesse d'attaque`,r:l=>ri(6,14)},
  crit:{t:v=>`+${v} % de chances de critique`,r:l=>ri(3,7)},
  critDmg:{t:v=>`+${v} % de dégâts critiques`,r:l=>ri(15,35)},
  hp:{t:v=>`+${v} points de vie`,r:l=>ri(12,24)+Math.round(l*2.5)},
  armor:{t:v=>`−${v} % de dégâts subis`,r:l=>ri(3,7)},
  speed:{t:v=>`+${v} % de vitesse de déplacement`,r:l=>ri(4,9)},
  regen:{t:v=>`+${v} PV par seconde`,r:l=>ri(1,2)+Math.floor(l/4)},
  cdr:{t:v=>`−${v} % de temps de recharge`,r:l=>ri(5,12)},
  frz:{t:v=>`+${v} % de chances de geler l'ennemi 1 s`,r:l=>ri(4,8)+Math.floor(l*.04),bio:1},
  cold:{t:v=>`+${v} % de dégâts contre les ennemis ralentis ou gelés`,r:l=>ri(12,22)+Math.floor(l*.3),bio:1},
  shard:{t:v=>`${v} % de chances qu'un ennemi tué éclate en glace`,r:l=>ri(6,12)+Math.floor(l*.05),bio:1},
  // Malédiction (Nécropole des Sables, v136) : un ennemi maudit (5 s) subit 15 % de dégâts en plus, plus « hex ».
  curse:{t:v=>`+${v} % de chances de maudire l'ennemi touché (5 s : +15 % de dégâts subis)`,r:l=>ri(5,10)+Math.floor(l*.05),bio:2},
  hex:{t:v=>`+${v} % de dégâts contre les ennemis maudits`,r:l=>ri(12,22)+Math.floor(l*.3),bio:2},
  doom:{t:v=>`${v} % de chances qu'un ennemi maudit tué maudisse et blesse ses voisins`,r:l=>ri(6,12)+Math.floor(l*.05),bio:2},
  skillRad:{t:v=>`+${v} % de portée des compétences`,r:l=>ri(10,20)+Math.floor(l*.5),old:1},
  novaPct:{t:v=>`+${v} % de dégâts de compétence`,r:l=>ri(20,45)},
  burn:{t:v=>`Embrase : ${v} dégâts par seconde`,w:1},
  multi:{t:v=>`+${v} projectile${v>1?'s':''} par tir`,r:l=>1,cls:['archer','magicien'],wt:.35},
  leech:{t:v=>`${v} % des dégâts rendus en vie`,r:l=>ri(1,2)+(l>60?1:0),cls:['guerrier']},
  reach:{t:v=>`+${v} % de portée de frappe`,r:l=>ri(6,12)+Math.floor(l*.08),cls:['guerrier']},
  splash:{t:v=>`+${v} % de rayon d'explosion`,r:l=>ri(10,20)+Math.floor(l*.15),cls:['magicien']},
  pierce:{t:v=>`Les carreaux transpercent ${v} ennemi${v>1?'s':''}`,r:l=>1,cls:['archer'],wt:.35},
  burnPct:{t:v=>`Embrase : ${v} % des dégâts par seconde`,r:l=>ri(4,8)+Math.floor(l*.05),old:1},
  chill:{t:v=>`+${v} % de chances de ralentir à l'impact`,r:l=>ri(5,10),old:1},
  shock:{t:v=>`+${v} % de chances d'éclair en chaîne`,r:l=>ri(3,6),old:1},
  execute:{t:v=>`+${v} % de dégâts contre les ennemis sous 30 % de vie`,r:l=>ri(12,25)+Math.floor(l*.2)},
  bossDmg:{t:v=>`+${v} % de dégâts contre les Gardiens`,r:l=>ri(8,16)+Math.floor(l*.15)},
  lowDmg:{t:v=>`+${v} % de dégâts quand ta vie est sous 50 %`,r:l=>ri(10,22)+Math.floor(l*.15)},
  ultPct:{t:v=>`+${v} % de dégâts de l'ultime`,r:l=>ri(10,22)},
  fury:{t:v=>`L'ultime se recharge ${v} % plus vite`,r:l=>ri(4,9),old:1},
  lowArmor:{t:v=>`−${v} % de dégâts subis quand ta vie est sous 30 %`,r:l=>ri(8,15)},
  potHeal:{t:v=>`+${v} % de soin des potions`,r:l=>ri(10,25),old:1},
  antidote:{t:v=>`−${v} % de durée du poison, de la brûlure et de la gelure`,r:l=>ri(8,16)},
  auraSlow:{t:v=>`Les ennemis à moins de 180 px sont ralentis de ${v} %`,r:l=>ri(5,10),old:1},
  skillDur:{t:v=>`+${v} % de durée des compétences et des ralentissements`,r:l=>ri(8,16),old:1},
  dashCd:{t:v=>`−${v} % de recharge de l'esquive`,r:l=>ri(5,10),old:1},
  magnetPct:{t:v=>`+${v} % de portée de ramassage`,r:l=>ri(10,25)},
  goldPct:{t:v=>`+${v} % d'or ramassé`,r:l=>ri(8,18)+Math.floor(l*.1)},
  xpPct:{t:v=>`+${v} % d'expérience`,r:l=>ri(5,12)},
  lootPct:{t:v=>`+${v} % de chances de butin`,r:l=>ri(3,7)},
  // v141 : affixes pour les styles de statut, de tank et de contrôle
  dotPct:{t:v=>`+${v} % de dégâts du feu, du poison et du saignement`,r:l=>ri(10,20)+Math.floor(l*.3)},
  thorns:{t:v=>`Renvoie ${v} % des dégâts reçus à l'attaquant`,r:l=>ri(10,20)+Math.floor(l*.2)},
  ccDmg:{t:v=>`+${v} % de dégâts contre les ennemis étourdis, immobilisés ou gelés`,r:l=>ri(12,22)+Math.floor(l*.3)},
  abSoul:{t:v=>`Pouvoir abyssal · Moisson : chaque ennemi tué donne +${v} % de dégâts pendant 5 s (cumul ×10)`,r:l=>ri(3,4)+(l>120?1:0),w:1,aby:1},
  abWard:{t:v=>`Pouvoir abyssal · Égide du Néant : chaque ennemi tué donne ${v} points de bouclier (jusqu'à 30 % de tes PV)`,r:l=>Math.round(8+l*.6),w:1,aby:1},
  abPulse:{t:v=>`Pouvoir abyssal · Onde du Vide : toutes les 5 s, ${v} % de tes dégâts à tous les ennemis proches`,r:l=>ri(250,350),w:1,aby:1},
  abExec:{t:v=>`Pouvoir abyssal · Jugement : les ennemis (hors gardiens) sous ${v} % de vie meurent sur le coup`,r:l=>ri(8,12),w:1,aby:1},
  abRift:{t:v=>`Pouvoir abyssal · Faille : ${v} % de chances qu'un critique déchire le vide et frappe 3 ennemis de plus`,r:l=>ri(20,30),w:1,aby:1},
  abHunt:{t:v=>`Pouvoir abyssal · Chasse royale : +${v} % de dégâts contre gardiens et élites`,r:l=>ri(35,55),w:1,aby:1},
};
// Tirage pondéré : les affixes très fortes (projectile, transpercement) sortent moins souvent.
// v141 : thème par emplacement, une affixe du thème sort 3 fois plus souvent.
const AFF_THEME={anneau:['dmgPct','critDmg','dotPct','execute','bossDmg'],amulette:['crit','cdr','novaPct','ultPct','ccDmg'],armure:['hp','armor','regen','thorns','antidote'],bottes:['speed','lowArmor','lowDmg','magnetPct'],dos:['hp','armor','regen','thorns','antidote'],arme:['dmgPct','apsPct','crit','critDmg']};
const affW=(k,slot)=>(AFF[k].wt||1)*(slot&&AFF_THEME[slot]&&AFF_THEME[slot].includes(k)?3:1);
function affPick(pool,slot){let t=0;for(const k of pool)t+=affW(k,slot);let x=Math.random()*t;for(const k of pool){x-=affW(k,slot);if(x<=0)return k}return pool[pool.length-1]}
const BASE_STAT={arme:'dmg',armure:'hp',amulette:'crit',bottes:'speed',anneau:'dmgPct',dos:'armor'};
const baseTxtOf=(slot,v)=>slot==='dos'?`−${v} % de dégâts subis`:slot==='arme'?`${v} dégâts de base`:slot==='armure'?`+${v} points de vie`:slot==='bottes'?`+${v} % de vitesse de déplacement`:slot==='anneau'?`+${v} % de dégâts`:`+${v} % de chances de critique`;
let uid=1+Math.max(0,...meta.stash.map(i=>i.id),...Object.values(meta.gear||{}).filter(Boolean).map(i=>i.id),...Object.values(meta.gearBy||{}).flatMap(g=>Object.values(g||{})).filter(Boolean).map(i=>i.id));
// Butin des monstres : Commun, Magique ou Rare. Le Tourment rend le Rare plus fréquent.
function rollRarity(l){const tb=(typeof G!=='undefined'&&G)?dif().tier*1.5:0,x=Math.random()*100,rare=Math.min(30,8+l*.15)+tb;return x<rare?2:x<rare+32?1:0}
function genItem(l,minR=0){
  let r=Math.min(2,Math.max(rollRarity(l+lv('luc')*3),minR));const DQ=G?dif():{aq:0};const slot=pick(['armure','amulette','bottes','anneau']), bk=BASE_STAT[slot];
  const bv=slot==='armure'?Math.round(20+l*7+rand(-4,6)):slot==='bottes'?ri(4,8)+Math.floor(l/4):slot==='anneau'?ri(5,10)+Math.floor(l*.8):ri(2,5);
  const it={id:uid++,slot,r,lvl:l,base:{k:bk,v:Math.max(1,Math.round(bv*RB[r]))},aff:{}};
  const bio=(typeof G!=='undefined'&&G&&G.biome)||0;
  let pool=Object.keys(AFF).filter(k=>!AFF[k].w&&!AFF[k].old&&(!AFF[k].bio||bio===AFF[k].bio)&&(!AFF[k].cls||AFF[k].cls.includes(heroCls)));const chosen=[];
  if(bio){const fr=pool.filter(k=>AFF[k].bio);if(Math.random()<.45){const k=pick(fr);chosen.push(k);pool=pool.filter(x=>x!==k)}}
  while(chosen.length<RAR[r].aff&&pool.length){const k=affPick(pool,slot);pool=pool.filter(x=>x!==k);chosen.push(k)}
  for(const k of chosen){const v=Math.round(AFF[k].r(l)*RK[r]*(1+(DQ.aq||0)));it.aff[k]=Math.max(1,v)}
  const base=pick(bio?BASES_BIO[bio][slot]:BASES[slot]);if(bio)it.bio=bio;
  it.name=r===0?base:`${base} ${pick(SUFFIX)}`;
  it.type=base;
  return it;
}
/* Rang (1 à 10) : deux exemplaires identiques de même rang fusionnent en un seul du rang au-dessus, +10 % de statistiques par rang.
   Stocké dans it.up (et meta.wlv pour les armes) : 0 = rang 1, 9 = rang 10. */
const UP_MAX=9;
// Rang maximum (0 = rang 1) : 10 pour les objets des reliques et les armes Légendaire et au-dessus, BAL.mobRankMax pour le butin des monstres.
const rankCap=it=>it.wid?wRankCap(it.wid):(it.rid||it.r>=3)?UP_MAX:Math.min(UP_MAX,BAL.mobRankMax[it.r]-1);
const wRankCap=id=>{const w=wdef(id);return !w||w.r>=3?UP_MAX:Math.min(UP_MAX,BAL.mobRankMax[w.r]-1)};
// Prix en or d'une fusion qui fait passer du rang n au rang n+1 : grandit avec la rareté, le rang et le niveau de l'objet
// (une arme compte pour le niveau d'objet de ta plus haute mission).
const fuseGold=(r,n,l=1)=>Math.round(BAL.fuseGold*Math.pow(2,n|0)*(r+1)*(1+(l|0)/20));
const upMul=n=>1+.1*(n||0),NOSCALE={multi:1,pierce:1,abSoul:1,abWard:1,abPulse:1,abExec:1,abRift:1,abHunt:1};
const fmtN=x=>(Math.round(x*10)/10).toLocaleString('fr-FR');
// Montant court pour les en-têtes étroits : 98 765, puis 123 k, puis 5,4 M (arrondi vers le bas : on n'annonce jamais plus que ce qu'on a).
const fmtBig=x=>{x=Math.floor(+x||0);return x>=1e6?(Math.floor(x/1e5)/10).toLocaleString('fr-FR')+' M':x>=1e5?Math.floor(x/1e3).toLocaleString('fr-FR')+' k':x.toLocaleString('fr-FR')};
const rkTxt=n=>`rang ${(n||0)+1}`;
const itemName=it=>it.name+(it.up?` · R${it.up+1}`:'');
function weaponItem(c,id){const w=(id&&wdef(id)&&ownedW(id))?wdef(id):wdef(WPN[c][0].id),ov=meta.waff[w.id]||{},af={...w.aff};for(const k in ov){const n=w.remap&&w.remap[k];if(n)delete af[n];af[k]=ov[k]}for(const k in af)if(af[k]==null)delete af[k];
  return {id:'w_'+w.id,wid:w.id,cls:wclsOfD(w.id),slot:'arme',r:w.r,lvl:1,base:{k:'dmg',v:w.dmg},aff:af,name:w.n,type:'Arme',up:meta.wlv[w.id]||0,lock:!!(meta.wlock&&meta.wlock[w.id])}}
const wclsOfD=id=>Object.keys(WPN).find(c=>WPN[c].some(w=>w.id===id));
const curEq=()=>{const e={arme:weaponItem(heroCls,meta.wpn[heroCls])};for(const k of GEAR_KEYS())e[k]=meta.gear[k]||null;return e};
// Arme tombée d'un monstre : une arme commune, magique ou rare de la classe du héros.
function rollPart(){const l=G?itemLvl():1,r=Math.min(2,rollRarity(l+lv('luc')*3)),ws=WPN[heroCls].filter(w=>w.r===r);return {w:pick(ws).id,full:1}}
// Une arme obtenue : nouvelle (elle rejoint tes armes) ou double (gardé pour la fusion de rang).
function gainWeapon(id){if(!ownedW(id)){meta.built[id]=true;return 'new'}(meta.wcp[id]||(meta.wcp[id]=[])).push(0);return 'copy'}
const partLabel=p=>{if(p.hf)return '<span style="color:var(--rar-aby)">Fragment de harnais</span>';const w=bpdef(p.w);return p.full?`<span style="color:${RAR[w.r].c}">${w.n}</span> · arme ${RAR[w.r].n.toLowerCase()}`:`<span style="color:${RAR[w.r].c}">${w.n}</span> · ${w.frag[p.p]}`};

function stats(eq){
  const b=CLS[heroCls].base,s={regenPct:0,dmg:b.dmg,aps:b.aps,hp:b.hp,crit:b.crit,critDmg:150,multi:0,pierce:0,burn:0,armor:b.armor,speed:b.speed,regen:0,cdr:b.cdr,novaPct:0,dmgPct:0,apsPct:0,leech:0,reach:0,splash:0,burnPct:0,chill:0,shock:0,skillRad:0,skillDur:0,dashCd:0,potHeal:0,magnetPct:0,lowArmor:0,lowDmg:0,auraSlow:0,goldPct:0,antidote:0,execute:0,bossDmg:0,xpPct:0,lootPct:0,fury:0,ultPct:0,frz:0,cold:0,shard:0,curse:0,hex:0,doom:0,abSoul:0,abWard:0,abPulse:0,abExec:0,abRift:0,abHunt:0,
    psnCh:0,bldCh:0,stunCh:0,rootCh:0,stDur:0,contag:0,echo:0,critSt:0,cdSt:0,embr:0,peste:0,hemo:0,cryo:0,surt:0,cata:0,diam:0,defl:0,soif:0,dotPct:0,thorns:0,ccDmg:0,
    flux:0,intSt:0,impr:0,comm:0,gardA:0,elan:0,peau:0,pasEl:0,ripo:0,econ:0,exFer:0,exRage:0,buffDur:0,rema:0,flea:0,terr:0};
  for(const it of Object.values(eq))if(it){const m=upMul(it.up);s[it.base.k]+=it.base.v*m;for(const k in it.aff)if(!affOff(k))s[k]+=NOSCALE[k]?it.aff[k]:it.aff[k]*m}
  s.seals={};for(const it of Object.values(eq))if(it&&it.seal)s.seals[it.seal]=1;
  for(const id of allMods(heroCls))s[MODS[id].k]+=modVal(id,meta.mods[id]);
  const R=(G&&G.run)||{},rr=k=>R[k]||0;
  s.dmgPct+=rr('dmg')*12;s.apsPct+=rr('aps')*10;s.crit+=rr('crit')*5;s.critDmg+=rr('cdmg')*30;s.speed+=rr('spd')*8;
  s.cdr+=rr('cdr')*8;s.novaPct+=rr('nova')*25;s.multi+=rr('multi')+rr('fan')*2;s.dmgPct-=rr('fan')*10;s.echo+=rr('echo')*20;s.waves=rr('wave');s.pierce+=rr('pierce');s.reach+=rr('reach')*15;s.leech+=rr('leech')*1.5;
  s.fury+=rr('fury')*15;s.ultPct+=rr('ultp')*30;
  s.splash+=rr('splash')*25;s.burnPct+=rr('burn')*10;s.chill+=rr('chill')*10;s.shock+=rr('shock')*6;
  s.skillRad+=rr('srad')*20;s.skillDur+=rr('sdur')*15;s.dashCd+=rr('refl')*15;s.antidote+=rr('endu')*20;s.execute+=rr('exec')*40;s.bossDmg+=rr('slay')*20;s.xpPct+=rr('know')*20;s.lootPct+=rr('luck')*15;
  s.dmgPct+=prPt('dmg')*2;s.apsPct+=prPt('aps');s.crit+=prPt('crit')*.5;s.critDmg+=prPt('cdmg')*3;s.novaPct+=prPt('nova')*3;s.armor+=prPt('armor')*.5;s.cdr+=prPt('cdr')*.5;s.speed+=prPt('spd')*.5;s.goldPct+=prPt('gold')*2;s.skillRad+=prPt('srad')*3;s.splash+=prPt('splash')*3;
  s.dmgPct+=lv('str')*6;s.apsPct+=lv('cel')*5;s.hp=Math.round(s.hp*(1+lv('vig')*.08)*(1+prPt('hp')*.02)*(1+rr('hp')*.15));s.regen+=rr('regen')*Math.max(3,s.hp*.015)+(s.regenPct?Math.max(s.regenPct*3,s.hp*s.regenPct/100):0);s.magnet=140*(1+rr('mag')*.4)*(1+s.magnetPct/100);
  const cb=!!(G&&G.P&&G.P.cbT>0);
  if(cb){if(heroCls==='archer')s.pierce+=1;else if(heroCls==='magicien')s.splash+=50;else{s.reach+=30;s.apsPct+=25}}
  // Renforts des sorts et ultimes (v132), seulement en mission
  const bf=(typeof started!=='undefined'&&started&&G&&G.P&&!G.over)?G.P:{},ub=1+(s.ultPct||0)/100;let apsX=1,dmgX=1;
  if(bf.criT>0)s.dmgPct+=30;
  if(bf.hawkT>0){apsX*=2;dmgX*=ub}
  if(bf.berT>0){s.apsPct+=60;s.reach+=40;s.leech+=6;dmgX*=ub}
  if(bf.surT>0){apsX*=2;s.splash+=50;dmgX*=ub}
  const dmg=s.dmg*(1+s.dmgPct/100)*dmgX;
  return {shotSpd:cb&&heroCls==='archer'?1.5:1,dmg,aps:s.aps*(1+s.apsPct/100)*apsX,hp:s.hp,crit:Math.min(s.crit,75),critDmg:s.critDmg,multi:s.multi,pierce:s.pierce,burn:(s.burn+dmg*s.burnPct/100)*(1+s.dotPct/100),chill:Math.min(s.chill,ST_CAP.chill),shock:Math.min(s.shock,ST_CAP.shock),
    armor:Math.min(s.armor,60),speed:220*(1+s.speed/100),regen:s.regen,cdr:Math.min(s.cdr,50),nova:dmg*4*(1+s.novaPct/100),leech:s.leech,reach:s.reach,splash:Math.min(s.splash,300),magnet:s.magnet,skillRad:Math.min(s.skillRad,300),skillDur:s.skillDur,dashCd:Math.min(s.dashCd,60),potHeal:s.potHeal,lowArmor:Math.min(s.lowArmor,60),lowDmg:s.lowDmg,auraSlow:Math.min(s.auraSlow,50),goldPct:s.goldPct,antidote:s.antidote,execute:s.execute||0,fury:Math.min(s.fury||0,50),ultPct:s.ultPct||0,bossDmg:s.bossDmg||0,xpPct:s.xpPct||0,lootPct:s.lootPct||0,echo:s.echo||0,waves:s.waves||0,frz:Math.min(s.frz,40),cold:s.cold,shard:Math.min(s.shard,60),curse:Math.min(s.curse,60),hex:s.hex,doom:Math.min(s.doom,60),abSoul:Math.min(s.abSoul,6),abWard:s.abWard,abPulse:s.abPulse,abExec:Math.min(s.abExec,20),abRift:Math.min(s.abRift,60),abHunt:s.abHunt,seals:s.seals,
    psnCh:Math.min(s.psnCh,ST_CAP.psnCh),bldCh:Math.min(s.bldCh,ST_CAP.bldCh),stunCh:Math.min(s.stunCh,ST_CAP.stunCh),rootCh:Math.min(s.rootCh,ST_CAP.rootCh),stDur:s.stDur,contag:Math.min(s.contag,ST_CAP.contag),
    critSt:s.critSt,cdSt:s.cdSt,embr:s.embr,peste:Math.floor(s.peste),hemo:s.hemo,cryo:s.cryo,surt:s.surt,cata:s.cata,diam:s.diam,defl:s.defl,soif:s.soif,dotPct:s.dotPct,thorns:s.thorns,ccDmg:s.ccDmg,
    flux:s.flux,intSt:s.intSt,impr:s.impr,comm:s.comm,gardA:s.gardA,elan:s.elan,peau:s.peau,pasEl:s.pasEl,ripo:s.ripo,econ:Math.min(s.econ,60),exFer:Math.min(s.exFer,70),exRage:s.exRage,buffDur:s.buffDur,rema:Math.min(s.rema,35),flea:s.flea,terr:Math.min(s.terr,50)};
}
const dps=S=>S.dmg*S.aps*(1+S.crit/100*(S.critDmg/100-1))*(1+S.multi*.8)*(1+S.echo/100)*(1+S.waves*.5)*(heroCls==='archer'?1:1.2)+S.burn;
/* ---------- Migration v91 : rangs, reliques par rareté, fin des objets Prime ---------- */
if(!meta.v5){
  const oldInv=n=>{let c=0;for(let i=0;i<(n||0);i++)c+=5+3*i+Math.floor(i*i/10);return c},rk=n=>Math.min(9,Math.floor((n||0)/11));let ess=0;
  const fixIt=it=>{if(!it)return it;if(it.type==='Prime'){ess+=40*(it.r+1)+Math.floor(oldInv(it.up)/2);return null}
    if(it.up){ess+=Math.floor(oldInv(it.up)/2);it.up=rk(it.up)}
    if(it.sang&&!it.rid)it.rid='S'+it.sang.slice(1);if(it.aby&&!it.rid)it.rid='B'+it.aby.slice(1);return it};
  meta.stash=(meta.stash||[]).map(fixIt).filter(Boolean);for(const k in meta.gear)meta.gear[k]=fixIt(meta.gear[k]);
  for(const id in (meta.wlv||{})){ess+=Math.floor(oldInv(meta.wlv[id])/2);meta.wlv[id]=rk(meta.wlv[id])}
  const ok=new Set(craftIds());for(const id in (meta.parts||{}))if(!ok.has(id)){ess+=10*(meta.parts[id]||[]).reduce((a,b)=>a+(b|0),0);delete meta.parts[id]}
  const map=id=>RELICS[id]?id:/^F_/.test(id)?'ab':/^(l|m|fA|fB)/.test(id)?'os':/^(n|fC)/.test(id)?'sa':'ab';
  const nr={};for(const id in (meta.relics||{})){const a=meta.relics[id]||[0,0],n=map(id),b=nr[n]||(nr[n]=[0,0]);b[0]+=a[0]|0;b[1]+=a[1]|0}meta.relics=nr;
  meta.relicQ=(meta.relicQ||[]).map(q=>({id:map(q.id),rad:!!q.rad}));
  meta.essence=(meta.essence|0)+ess;meta.maxL=Math.max(meta.maxL|0,meta.start|0,meta.cp|0,1);meta.wcp=meta.wcp||{};meta.v5=1;saveMeta();
}
meta.wcp=meta.wcp||{};meta.slotU=meta.slotU||{};meta.hfrag=meta.hfrag|0;
// v139 : emplacements par héros. Une sauvegarde d'avant ({anneau2, dos} pour tous) les garde ouverts pour chaque héros.
if(SLOT_U.some(u=>u.k in meta.slotU)){const o=meta.slotU,n={};for(const c in CLS){n[c]={};for(const u of SLOT_U)if(o[u.k])n[c][u.k]=true}meta.slotU=n;saveMeta()}
for(const c in CLS)if(!meta.slotU[c]||typeof meta.slotU[c]!=='object')meta.slotU[c]={};
/* ---------- v106 : chaque héros a son équipement ----------
   meta.gearBy[classe] = ses emplacements ; meta.gear désigne toujours celui du héros choisi (propriété calculée, non sauvegardée).
   Une ancienne sauvegarde donne son équipement au dernier héros joué. Un objet n'est porté que par un héros à la fois. */
const curCls=()=>{try{if(typeof heroCls!=='undefined'&&CLS[heroCls])return heroCls}catch{}let c=null;try{c=localStorage.getItem('crypte-cls')}catch{}return CLS[c]?c:'archer'};
function defGear(m){
  if(!m.gearBy){const d=Object.getOwnPropertyDescriptor(m,'gear'),old=d&&'value' in d?d.value:null;m.gearBy={[curCls()]:old||{}}}
  for(const c in CLS)m.gearBy[c]=m.gearBy[c]||{};
  delete m.gear;
  Object.defineProperty(m,'gear',{get(){return m.gearBy[curCls()]},set(v){m.gearBy[curCls()]=v||{}},enumerable:false,configurable:true});
  m.sets=m.sets||{};
}
defGear(meta);
// Qui porte cet objet (classe), à quel emplacement ; tous les objets portés, tous héros confondus.
const wornBy=it=>{if(!it)return null;if(it.wid){const c=wclsOfD(it.wid);return c&&curWid(c)===it.wid?c:null}for(const c in CLS){const g=meta.gearBy[c];for(const k in g)if(g[k]===it)return c}return null};
const wornSlot=(it,c)=>{const g=meta.gearBy[c]||{};for(const k in g)if(g[k]===it)return k;return null};
const allWorn=()=>Object.keys(CLS).flatMap(c=>Object.values(meta.gearBy[c]||{}).filter(Boolean));
// « par l'Archer », « par le Guerrier »…
const parCls=c=>/^[AEIOUÉ]/.test(CLS[c].n)?`par l'${CLS[c].n}`:`par le ${CLS[c].n}`;
const pourCls=c=>parCls(c).replace(/^par /,'pour ');
const findItem=id=>meta.stash.find(i=>i.id===id)||allWorn().find(i=>i.id===id)||null;
// Retire l'objet au héros qui le porte (s'il en a un) ; renvoie la classe du héros dépouillé.
function unwear(it){const c=wornBy(it);if(!c||it.wid)return null;const k=wornSlot(it,c);meta.gearBy[c][k]=null;return c}
/* Équipements enregistrés : meta.sets[classe] = [{n, g:{emplacement: id d'objet ou null}, w: arme, wm: mods de l'arme, hm: mods du héros,
   au: aura, pet: familier (uid ou null), pm: mods du familier}], 6 par héros au plus. Mods, aura et familier : depuis la v134
   (un équipement enregistré avant n'a pas ces champs, « Porter » laisse alors les mods et le familier tels quels). act : l'équipement en cours (v143). */
const SET_MAX=6;
const setsOf=(c=heroCls)=>meta.sets[c]||(meta.sets[c]=[]);
function setSave(i,c=heroCls){const L=setsOf(c),g={};for(const k of GEAR_KEYS(c))g[k]=meta.gearBy[c][k]?meta.gearBy[c][k].id:null;
  const s={n:L[i]?L[i].n:`Équipement ${L.length+1}`,g,w:curWid(c),wm:build('w',c).load.slice(),hm:build('h',c).load.slice(),au:meta.aura[c]||null,
    pet:meta.petEq==null?null:meta.petEq,pm:petBuild().load.slice()};
  // v143 : l'équipement enregistré ou porté en dernier est l'équipement en cours (act) ; ses changements se rangent par « Mettre à jour »
  for(const x of L)delete x.act;s.act=1;
  if(L[i])L[i]=s;else if(L.length<SET_MAX)L.push(s);return s}
// Remet des mods enregistrés dans une configuration (arme, héros ou familier) : seulement les mods possédés, permis au héros et du bon type,
// dans les cases ouvertes, tant que la capacité suit. Renvoie le nombre de mods laissés de côté.
function setMods(b,ids,c){let miss=0;for(let i=0;i<b.load.length;i++)b.load[i]=null;
  (ids||[]).forEach((id,i)=>{if(!id)return;const rk=meta.mods[id];
    if(rk==null||!MODS[id]||!modOk(id,c)||bKind(id)!==b.kind||modKind(id)==='a'||i>=b.slots||bUsed(b)+bDrain(b,id,rk,i)>bCap(b)){miss++;return}b.load[i]=id});
  return miss}
// Mods, aura et familier d'un équipement enregistré sont-ils ceux d'aujourd'hui ?
function setModsSame(s,c=heroCls){if(!('hm' in s))return true;const eq=(a,b)=>a.length>=b.length?a.every((x,i)=>(x||null)===(b[i]||null)):eq(b,a);
  return eq(build('w',c).load,s.wm||[])&&eq(build('h',c).load,s.hm||[])&&(meta.aura[c]||null)===(s.au||null)&&(meta.petEq==null?null:meta.petEq)===s.pet&&eq(petBuild().load,s.pm||[])}
// Porte un équipement enregistré : chaque objet est pris dans le coffre ou sur un autre héros. Renvoie {done, miss, from}.
function setWear(i,c=heroCls){const s=setsOf(c)[i];if(!s)return null;const g=meta.gearBy[c];let done=0,miss=0;const from=new Set();
  for(const x of setsOf(c))delete x.act;s.act=1;
  const sg=s.g||{};for(const k of GEAR_KEYS(c)){if(!(k in sg))continue;const id=sg[k],cur=g[k]||null;if(cur&&cur.id===id)continue;
    if(id==null){if(cur){meta.stash.push(cur);g[k]=null;done++}continue}
    const it=findItem(id);if(!it||keySlot(k)!==it.slot){miss++;continue}
    const o=unwear(it);if(o)from.add(o);meta.stash=meta.stash.filter(x=>x!==it);if(cur)meta.stash.push(cur);g[k]=it;done++}
  const wOk=!s.w||ownedW(s.w)&&wclsOfD(s.w)===c;
  if(s.w&&wOk&&meta.wpn[c]!==s.w){meta.wpn[c]=s.w;done++}else if(s.w&&!wOk)miss++;
  // v134 : mods de l'arme (si c'est bien l'arme enregistrée), aura et mods du héros, familier et ses mods
  let mm=0,petMiss=false;
  if('hm' in s){
    if(wOk)mm+=setMods(build('w',c),s.wm,c);
    if(s.au==null||meta.mods[s.au]!=null&&modOk(s.au,c))meta.aura[c]=s.au||null;else mm++;
    mm+=setMods(build('h',c),s.hm,c);
    if(s.pet==null)meta.petEq=null;else if(meta.pets.some(p=>p.uid===s.pet))meta.petEq=s.pet;else petMiss=true;
    mm+=setMods(petBuild(),s.pm,c)}
  return {done,miss,from:[...from],mm,petMiss}}

