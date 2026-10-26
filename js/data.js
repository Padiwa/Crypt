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
/* Emplacements à débloquer avec des fragments de harnais (Gardiens) : d'abord le 2e anneau, puis le dos. */
const SLOT_U=[{k:'anneau2',n:'Anneau 2',hf:12,gold:2000},{k:'dos',n:'Dos',hf:25,gold:5000,need:'anneau2'}];
const slotOpen=k=>!SLOT_U.some(u=>u.k===k)||!!(meta.slotU&&meta.slotU[k]);
const GEAR_KEYS=()=>['armure','amulette','bottes','anneau','anneau2','dos'].filter(slotOpen);
const keySlot=k=>k==='anneau2'?'anneau':k;
// Case où va un objet : la sienne s'il est porté, sinon une case vide de son type, sinon celle où il apporte le plus.
function tgtKey(eq,it){const ks=GEAR_KEYS().filter(k=>keySlot(k)===it.slot);if(!ks.length)return null;
  for(const k of ks)if(eq[k]===it)return k;for(const k of ks)if(!eq[k])return k;if(ks.length===1)return ks[0];
  let best=ks[0],bs=-1e18;for(const k of ks){const v=itemScore({...eq,[k]:it});if(v>bs){bs=v;best=k}}return best}
// Fragments de harnais : seulement sur les Gardiens, plus souvent dans les difficultés hautes.
const hfChance=()=>{const D=dif();return .03*BAL.hfMul*(1+.5*Math.min(3,dsel().d))*(1+.05*(D.tier||0))};
const BIOMES=[
  {id:'crypte',n:'Crypte des Cendres',d:'La crypte d\'origine : braseros, sang séché, monstres connus.',hp:1,dm:1,loot:1,
   tile:{h:285,s:9,l:12.5},stain:'110,25,30',chip:'214,204,180',pil:['#4a4050','#231d27'],wall:['#211a26','#3d3440'],rune:'232,133,59',light:'255,140,60',flame:'255,190,90',tint:0xff8c3c},
  {id:'givre',n:'Abîmes gelés',d:'Cavernes de glace sous la crypte. Monstres plus coriaces (vie ×1,3, dégâts ×1,2), Revenants de givre qui ralentissent, butin +30 %. Seul biome où tombent les affixes de givre et les objets de givre des reliques Sanguine et Abyssale.',hp:1.3,dm:1.2,loot:1.3,
   tile:{h:205,s:24,l:14},stain:'150,210,255',chip:'220,240,255',pil:['#5d7f96','#1b2c3a'],wall:['#142231','#3b5a73'],rune:'140,200,255',light:'120,190,255',flame:'190,230,255',tint:0x78beff},
];
const biome=()=>BIOMES[Math.max(0,Math.min(BIOMES.length-1,(typeof G!=='undefined'&&G&&G.biome!=null)?G.biome:(meta.biome|0)))];
const BASES_GIVRE={armure:['Pelisse givrée','Cuirasse de glace'],amulette:['Talisman de givre','Pendentif cristallin'],bottes:['Bottes fourrées','Grèves de glace'],anneau:['Anneau de givre','Bague cristalline']};
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
  archer:{n:'Archer',skill:'Volée',cd:7,ult:'Pluie d\'acier',uicon:'<path d="M6 3v12M12 3v15M18 3v12M3.5 12.5 6 15l2.5-2.5M9.5 15.5 12 18l2.5-2.5M15.5 12.5 18 15l2.5-2.5M5 21h14"/>',base:{dmg:8,aps:1.8,hp:130,crit:5,speed:0,armor:8,cdr:0},
    cloak:'#2d4c50',rim:'#a9cbc0',inner:'#14232a',col:'#e8853b',
    hint:'Glisse pour bouger.<br>Tir automatique, plus rapide à l\'arrêt.',
    desc:'Tire des carreaux automatiquement, plus vite à l\'arrêt. Rapide et précis. <b>Volée</b> : 24 carreaux perforants dans toutes les directions. <b>Ultime, Pluie d\'acier</b> : 3 s de flèches qui s\'abattent sur les ennemis proches.',
    icon:'<path d="M12 12 5 5M12 12l7-7M12 12v9M5 5h4M5 5v4M19 5h-4M19 5v4M9 18l3 3 3-3"/>'},
  guerrier:{n:'Guerrier',skill:'Tourbillon',cd:9,ult:'Colère du Titan',uicon:'<path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M19.1 4.9l-3.5 3.5M8.4 15.6l-3.5 3.5"/><circle cx="12" cy="12" r="2.5"/>',base:{dmg:14,aps:1.5,hp:160,crit:5,speed:-6,armor:15,cdr:0},
    cloak:'#5b2a26',rim:'#d9a48a',inner:'#2a1210',col:'#d9a48a',
    hint:'Glisse pour bouger.<br>Il frappe tout ce qui l\'approche.',
    desc:'Frappe au corps à corps tout ce qui l\'approche. Beaucoup de vie et d\'armure. <b>Tourbillon</b> : tournoie en frappant tout autour, dégâts subis réduits de moitié. <b>Ultime, Colère du Titan</b> : onde de choc géante et 3 s d\'invulnérabilité.',
    icon:'<path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 8a4 4 0 1 1-4 4"/><path d="M4 12 2.5 9M4 12l3-1"/>'},
  magicien:{n:'Magicien',skill:'Nova de givre',cd:7,ult:'Pluie de météores',uicon:'<circle cx="15" cy="15" r="5"/><path d="M11.5 11.5 3 3M14 9.8 8 3.5M9.8 14 3.5 8"/>',base:{dmg:12,aps:1.25,hp:115,crit:8,speed:-2,armor:8,cdr:10},
    cloak:'#3c2c63',rim:'#b9a6f0',inner:'#17122b',col:'#9fd0ff',
    hint:'Glisse pour bouger.<br>Orbes automatiques, plus rapides à l\'arrêt.',
    desc:'Lance des orbes qui explosent à l\'impact, plus vite à l\'arrêt. Fragile, redoutable contre les groupes. <b>Nova de givre</b> : blesse, ralentit et dissipe les projectiles. <b>Ultime, Pluie de météores</b> : 3 météores sur les ennemis proches.',
    icon:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>'},
};
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
    {id:'a11',n:'Arc de la Veuve rouge',r:5,dmg:35,aff:{multi:2,pierce:1,critDmg:50,leech:2,crit:10,apsPct:15}},
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
// Chance d'œuf de familier par relique ouverte, selon sa rareté (× BAL.eggMul).
const EGG_CH=[.08,.12,.15,.25];
const REL_SRC=['Normal, Difficile et Cauchemar (et plus haut sous le niveau requis)',`Tourment I et plus, niveau ${BAL.relicLv[0]}+`,`Tourment VI et plus, niveau ${BAL.relicLv[1]}+`,`Tourment VI et plus, niveau ${BAL.relicLv[2]}+, plus rare`];
// Reliques forgées : 3 reliques d'un même type donnent une relique forgée du même type, qui garantit un fragment de l'objet choisi.
// La rareté dépend du palier de Tourment, plafonnée par le niveau de mission (BAL.relicLv) : sous le niveau requis, la relique du dessous.
// free : sans ce plafond (cibles capturées : la relique suit seulement la difficulté et le Tourment).
function relicTierNow(free){const D=dif();if(!D.tier)return 0;let t=D.tier<=5?1:Math.random()<BAL.abyss[0]+BAL.abyss[1]*(D.tier-6)?3:2;
  if(free)return t;const L=(typeof G!=='undefined'&&G&&G.level)||1;while(t>0&&L<BAL.relicLv[t-1])t--;return t}
const relicName=id=>RELICS[id].n;
// Contenu d'une relique : les objets de sa rareté (armes du héros comprises). Objets de givre seulement dans les Abîmes gelés.
function relPool(t,cls=heroCls){const r=t+3,frost=typeof G!=='undefined'&&G&&G.biome===1;
  return [...WPN[cls].filter(w=>w.r===r).map(w=>w.id),...Object.keys(RGEAR).filter(id=>RGEAR[id].r===r&&(!RGEAR[id].bio||frost))]}
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
};
for(const k in SANG)RGEAR['S'+k.slice(1)]={...SANG[k],r:5,sang:k};
for(const k in ABY)RGEAR['B'+k.slice(1)]={...ABY[k],r:6,aby:k};
for(const id of craftIds()){const b=bpdef(id);RELICS['F_'+id]={t:b.r-3,fz:1,tgt:id,n:`Relique forgée · ${b.n}`}}
const baseRoll=(slot,l)=>slot==='dos'?2+Math.floor(l/25):slot==='armure'?Math.round(20+l*7):slot==='bottes'?6+Math.floor(l/4):slot==='anneau'?7+Math.floor(l*.8):3;
// Fabrique un objet des reliques au niveau d'objet l.
function rgItem(id,l){const T=RGEAR[id],slot=T.slot,r=T.r;
  const it={id:uid++,slot,r,lvl:l,base:{k:BASE_STAT[slot],v:Math.round(baseRoll(slot,l)*RB[r])},aff:{},name:T.n,type:RAR[r].n,rid:id};
  if(T.sang)it.sang=T.sang;if(T.aby)it.aby=T.aby;if(T.bio)it.bio=1;
  for(const k of T.aff){const A=AFF[k];const v=A.r?A.r(l):5;it.aff[k]=Math.max(1,Math.round(v*RK[r]))}
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
let meta={gold:0,up:{},tal:{},cp:1,start:1,essence:0,mods:{ferocite:0},
  load:{guerrier:['ferocite',null,null,null],archer:['ferocite',null,null,null],magicien:['ferocite',null,null,null]},
  gear:{armure:null,amulette:null,bottes:null,anneau:null},stash:[],wpn:{guerrier:'g0',archer:'a0',magicien:'m0'},bp:{},built:{},parts:{},relics:{},mode:'survie',relicSel:null,relicQ:[],diff:0,waff:{},prest:{},wish:{leg:true,aff:{}},pol:{},mast:{},align:{},wlv:{},wload:{},wpol:{},wmast:{},walign:{},hload:{},hslots:{},aura:{}};
try{const m=JSON.parse(localStorage.getItem('crypte-meta')||'null');if(m)meta=Object.assign(meta,m)}catch(e){}
if(!meta.v2){meta.cp=1;meta.start=1;meta.v2=1}
meta.modSt=meta.modSt||{};meta.modCp=meta.modCp||{};
if(!meta.v3){for(const id in meta.bp||{}){const w=wdef(id);if(w&&!meta.built[id])meta.gold+=w.bp||0}meta.bp={};meta.v3=1;meta.relics={lA1:[1,0],...(meta.relics||{})}}
if(!MODES[meta.mode]||meta.mode==='breche')meta.mode='survie'; // la Brèche se choisit une fois la coopération connectée
if(!Array.isArray(meta.relicQ))meta.relicQ=[];if(meta.relicSel){if(!meta.relicQ.length)meta.relicQ=[meta.relicSel];meta.relicSel=null}
const saveMeta=()=>{try{localStorage.setItem('crypte-meta',JSON.stringify(meta))}catch(e){}};
// Compte : un identifiant unique tiré une fois (gardé dans la sauvegarde) et un nom choisi dans Réglages › Compte.
// En coopération, chaque joueur apparaît sous ce nom, précédé du niveau de prestige du héros qu'il joue.
if(!meta.pid||!/^[A-Z2-9]{5}$/.test(meta.pid)){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',r=new Uint8Array(5);try{crypto.getRandomValues(r)}catch(e){for(let i=0;i<5;i++)r[i]=Math.random()*256}
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
const ULT_N=60;
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
  {k:'fury',n:'Fureur',d:'−15 % d\'ennemis à abattre pour charger l\'ultime',max:3,c:C_UTI},
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
  {k:'endu',n:'Endurci',d:'−20 % de durée du poison et de la brûlure',max:2,c:C_DEF},
  {k:'know',n:'Savoir',d:'+20 % d\'expérience',max:3,c:C_UTI},
  {k:'luck',n:'Bonne étoile',d:'+15 % de chances de butin pendant la mission',max:3,c:'#f0cf4a'},
  {k:'fiole',n:'Fiole de réserve',d:'+1 potion tout de suite',max:3,c:C_DEF},
];
const RUP_FILL=[{k:'heal',n:'Soin',d:'Rend 40 % de ta vie',max:0,c:C_DEF},{k:'purse',n:'Bourse',d:'Gagne de l\'or tout de suite',max:0,c:'#f0cf4a'}];
const xpNeed=l=>Math.round(120*Math.pow(1.32,l-1)+20*l);
const TAL={
  guerrier:[{k:'g_charge',n:'Charge brutale',d:"L'esquive blesse et repousse les ennemis traversés.",cost:150},
            {k:'g_blood',n:'Soif de sang',d:'Chaque ennemi abattu te rend 2 % de ta vie.',cost:300},
            {k:'g_quake',n:'Onde de choc',d:'Un coup sur quatre libère une onde qui frappe tout autour.',cost:500}],
  archer:[{k:'a_move',n:'Tir en course',d:'Tu tires à pleine cadence même en courant.',cost:150},
          {k:'a_shadow',n:"Pas de l'ombre",d:'Après une esquive, tes 3 tirs suivants sont critiques.',cost:300},
          {k:'a_rico',n:'Ricochet',d:'Chaque carreau rebondit une fois vers un autre ennemi.',cost:500}],
  magicien:[{k:'m_blink',n:'Sillage de givre',d:"L'esquive laisse une explosion glacée qui ralentit.",cost:150},
            {k:'m_shield',n:'Barrière',d:'Un bouclier absorbe 25 % de ta vie. Il se recharge après 4 s sans être touché.',cost:300},
            {k:'m_chain',n:"Chaîne d'éclairs",d:'Une orbe sur quatre foudroie 3 ennemis proches.',cost:500}],
};

/* ---------- Mods ---------- */
const MOD_RAR=[{n:'Bronze',c:'#c98a5a'},{n:'Argent',c:'#cfd8e3'},{n:'Or',c:'#f0cf4a'}];
const MODS={
  ferocite:{n:'Férocité',r:0,max:5,drain:4,k:'dmgPct',v:15,t:v=>`+${v} % de dégâts`},
  cadence:{n:'Cadence',r:0,max:5,drain:4,k:'apsPct',v:8,t:v=>`+${v} % de vitesse d'attaque`},
  vitalite:{type:'h',n:'Vitalité',r:0,max:5,drain:2,k:'hp',v:15,t:v=>`+${v} points de vie`},
  egide:{type:'h',n:'Égide',r:0,max:3,drain:3,k:'armor',v:3,t:v=>`−${v} % de dégâts subis`},
  pas:{type:'h',n:'Pas léger',r:0,max:3,drain:2,k:'speed',v:5,t:v=>`+${v} % de vitesse de déplacement`},
  intensite:{type:'h',n:'Intensité',r:0,max:3,drain:3,k:'novaPct',v:20,t:v=>`+${v} % de dégâts de compétence`},
  givre:{n:'Morsure du givre',r:0,max:3,drain:3,k:'chill',v:10,t:v=>`${v} % de chances de ralentir à l'impact`},
  allonge:{n:'Allonge',r:0,max:3,drain:3,k:'reach',v:10,t:v=>`+${v} % de portée de frappe`,cls:['guerrier']},
  deflagration:{n:'Déflagration',r:0,max:5,drain:3,k:'splash',v:20,t:v=>`+${v} % de rayon d'explosion`,cls:['magicien']},
  oeil:{n:'Œil du chasseur',r:1,max:3,drain:3,k:'crit',v:5,t:v=>`+${v} % de chances de critique`},
  boucherie:{n:'Boucherie',r:1,max:3,drain:3,k:'critDmg',v:25,t:v=>`+${v} % de dégâts critiques`},
  braise:{n:'Braise vive',r:1,max:3,drain:4,k:'burnPct',v:15,t:v=>`Embrase : ${v} % des dégâts par seconde`},
  flux:{type:'h',n:'Flux',r:1,max:3,drain:3,k:'cdr',v:6,t:v=>`−${v} % de temps de recharge`},
  sangsue:{n:'Sangsue',r:1,max:3,drain:4,k:'leech',v:1.5,t:v=>`${v} % des dégâts rendus en vie`,cls:['guerrier']},
  diamant:{n:'Pointe de diamant',r:1,max:1,drain:4,k:'pierce',v:1,t:v=>`Les carreaux percent ${v} ennemi${v>1?'s':''} de plus`,cls:['archer']},
  orage:{n:'Arc électrique',r:2,max:3,drain:5,k:'shock',v:6,t:v=>`${v} % de chances de lancer un éclair en chaîne`},
  dedoublement:{n:'Écho',r:2,max:3,drain:5,k:'multi',v:.25,t:v=>`${Math.round(v*100)} % de chances de projectile supplémentaire`,cls:['archer','magicien']},
  souffle:{type:'h',n:'Second souffle',r:0,max:3,drain:3,k:'regenPct',v:.5,t:v=>`+${String(v).replace('.',',')} % de ta vie max par seconde (au moins ${String(+(v*3).toFixed(1)).replace('.',',')} PV)`},
  alchimiste:{type:'h',n:'Alchimiste',r:0,max:3,drain:2,k:'potHeal',v:15,t:v=>`+${v} % de soin des potions`},
  rapace:{type:'h',n:'Rapace',r:0,max:3,drain:2,k:'magnetPct',v:20,t:v=>`+${v} % de portée de ramassage`},
  etendue:{type:'h',n:'Étendue',r:1,max:5,drain:4,k:'skillRad',v:15,t:v=>`+${v} % de rayon de compétence`},
  persist:{type:'h',n:'Persistance',r:1,max:3,drain:4,k:'skillDur',v:12,t:v=>`+${v} % de durée de compétence et de ralentissement`},
  fantome:{type:'h',n:'Pas fantôme',r:1,max:3,drain:3,k:'dashCd',v:10,t:v=>`−${v} % de recharge de l'esquive`},
  dernier:{type:'h',n:'Dernier rempart',r:1,max:3,drain:4,k:'lowArmor',v:10,t:v=>`−${v} % de dégâts subis sous 30 % de vie`},
  survivant:{type:'h',n:'Rage du survivant',r:2,max:3,drain:5,k:'lowDmg',v:15,t:v=>`+${v} % de dégâts sous 50 % de vie`},
  antidote:{type:'h',n:'Antidote',r:0,max:3,drain:3,k:'antidote',v:15,t:v=>`−${v} % de durée du poison et de la brûlure`},
  presence:{type:'a',n:'Présence glaciale',r:2,max:3,drain:0,cap:4,k:'auraSlow',v:8,t:v=>`Ennemis proches ralentis de ${v} %`},
  cupidite:{type:'a',n:'Cupidité',r:1,max:3,drain:0,cap:4,k:'goldPct',v:10,t:v=>`+${v} % d'or ramassé`},
  ferveur:{type:'a',n:'Ferveur',r:2,max:3,drain:0,cap:4,k:'apsPct',v:5,t:v=>`+${v} % de vitesse d'attaque`},
};
/* Surcharge des mods : au rang max, des copies du même mod + de l'essence ajoutent des étoiles (5 max), +12 % de la valeur chacune. */
const MOD_ST_MAX=5,MOD_ST_K=.12;
const modSt=id=>(meta.modSt&&meta.modSt[id])|0;
const modCanStar=id=>MODS[id].k!=='pierce';
const starCost=(id,st)=>({cp:Math.ceil((st+1)*BAL.starCopies),ess:50*(MODS[id].r+1)*(st+1)});
const modVal=(id,rk,st=modSt(id))=>{const x=MODS[id].v*(rk+1)*(1+MOD_ST_K*st);return x>=10?Math.round(x):x>=1?+x.toFixed(1):+x.toFixed(2)};
const modDrain=(id,rk,st=modSt(id))=>MODS[id].drain+rk+Math.floor(st/2);
const fuseCost=(id,rk)=>10*Math.pow(2,rk)*(MODS[id].r+1);
const POL={b:{n:'Braise',c:'#e8853b',s:'▲'},r:{n:'Rempart',c:'#5fbf7a',s:'■'},s:{n:'Spirale',c:'#b9a6f0',s:'◆'}};
const MOD_POL={ferocite:'b',cadence:'b',oeil:'b',boucherie:'b',dedoublement:'b',diamant:'b',allonge:'b',deflagration:'b',vitalite:'r',egide:'r',sangsue:'r',pas:'r',intensite:'s',flux:'s',braise:'s',givre:'s',orage:'s',souffle:'r',etendue:'s',persist:'s',fantome:'r',alchimiste:'r',rapace:'s',dernier:'r',survivant:'b',antidote:'r'};
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
  skillRad:{t:v=>`+${v} % de portée des compétences`,r:l=>ri(10,20)+Math.floor(l*.5)},
  novaPct:{t:v=>`+${v} % de dégâts de compétence`,r:l=>ri(20,45)},
  burn:{t:v=>`Embrase : ${v} dégâts par seconde`,w:1},
  multi:{t:v=>`+${v} projectile${v>1?'s':''} par tir`,r:l=>1,cls:['archer','magicien'],wt:.35},
  leech:{t:v=>`${v} % des dégâts rendus en vie`,r:l=>ri(1,2)+(l>60?1:0)},
  reach:{t:v=>`+${v} % de portée de frappe`,r:l=>ri(6,12)+Math.floor(l*.08),cls:['guerrier']},
  splash:{t:v=>`+${v} % de rayon d'explosion`,r:l=>ri(10,20)+Math.floor(l*.15),cls:['magicien']},
  pierce:{t:v=>`Les carreaux transpercent ${v} ennemi${v>1?'s':''}`,r:l=>1,cls:['archer'],wt:.35},
  burnPct:{t:v=>`Embrase : ${v} % des dégâts par seconde`,r:l=>ri(4,8)+Math.floor(l*.05)},
  chill:{t:v=>`+${v} % de chances de ralentir à l'impact`,r:l=>ri(5,10)},
  shock:{t:v=>`+${v} % de chances d'éclair en chaîne`,r:l=>ri(3,6)},
  execute:{t:v=>`+${v} % de dégâts contre les ennemis sous 30 % de vie`,r:l=>ri(12,25)+Math.floor(l*.2)},
  bossDmg:{t:v=>`+${v} % de dégâts contre les Gardiens`,r:l=>ri(8,16)+Math.floor(l*.15)},
  lowDmg:{t:v=>`+${v} % de dégâts quand ta vie est sous 50 %`,r:l=>ri(10,22)+Math.floor(l*.15)},
  ultPct:{t:v=>`+${v} % de dégâts de l'ultime`,r:l=>ri(10,22)},
  fury:{t:v=>`−${v} % d'ennemis à abattre pour charger l'ultime`,r:l=>ri(4,9)},
  lowArmor:{t:v=>`−${v} % de dégâts subis quand ta vie est sous 30 %`,r:l=>ri(8,15)},
  potHeal:{t:v=>`+${v} % de soin des potions`,r:l=>ri(10,25)},
  antidote:{t:v=>`−${v} % de durée du poison, de la brûlure et de la gelure`,r:l=>ri(8,16)},
  auraSlow:{t:v=>`Les ennemis à moins de 180 px sont ralentis de ${v} %`,r:l=>ri(5,10)},
  skillDur:{t:v=>`+${v} % de durée des compétences et des ralentissements`,r:l=>ri(8,16)},
  dashCd:{t:v=>`−${v} % de recharge de l'esquive`,r:l=>ri(5,10)},
  magnetPct:{t:v=>`+${v} % de portée de ramassage`,r:l=>ri(10,25)},
  goldPct:{t:v=>`+${v} % d'or ramassé`,r:l=>ri(8,18)+Math.floor(l*.1)},
  xpPct:{t:v=>`+${v} % d'expérience`,r:l=>ri(5,12)},
  lootPct:{t:v=>`+${v} % de chances de butin`,r:l=>ri(3,7)},
  abSoul:{t:v=>`Pouvoir abyssal · Moisson : chaque ennemi tué donne +${v} % de dégâts pendant 5 s (cumul ×10)`,r:l=>ri(3,4)+(l>120?1:0),w:1,aby:1},
  abWard:{t:v=>`Pouvoir abyssal · Égide du Néant : chaque ennemi tué donne ${v} points de bouclier (jusqu'à 30 % de tes PV)`,r:l=>Math.round(8+l*.6),w:1,aby:1},
  abPulse:{t:v=>`Pouvoir abyssal · Onde du Vide : toutes les 5 s, ${v} % de tes dégâts à tous les ennemis proches`,r:l=>ri(250,350),w:1,aby:1},
  abExec:{t:v=>`Pouvoir abyssal · Jugement : les ennemis (hors gardiens) sous ${v} % de vie meurent sur le coup`,r:l=>ri(8,12),w:1,aby:1},
  abRift:{t:v=>`Pouvoir abyssal · Faille : ${v} % de chances qu'un critique déchire le vide et frappe 3 ennemis de plus`,r:l=>ri(20,30),w:1,aby:1},
  abHunt:{t:v=>`Pouvoir abyssal · Chasse royale : +${v} % de dégâts contre gardiens et élites`,r:l=>ri(35,55),w:1,aby:1},
};
// Tirage pondéré : les affixes très fortes (projectile, transpercement) sortent moins souvent.
function affPick(pool){let t=0;for(const k of pool)t+=AFF[k].wt||1;let x=Math.random()*t;for(const k of pool){x-=AFF[k].wt||1;if(x<=0)return k}return pool[pool.length-1]}
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
  let pool=Object.keys(AFF).filter(k=>!AFF[k].w&&(!AFF[k].bio||bio===AFF[k].bio)&&(!AFF[k].cls||AFF[k].cls.includes(heroCls)));const chosen=[];
  if(bio){const fr=pool.filter(k=>AFF[k].bio);if(Math.random()<.45){const k=pick(fr);chosen.push(k);pool=pool.filter(x=>x!==k)}}
  while(chosen.length<RAR[r].aff&&pool.length){const k=affPick(pool);pool=pool.filter(x=>x!==k);chosen.push(k)}
  for(const k of chosen){const v=Math.round(AFF[k].r(l)*RK[r]*(1+(DQ.aq||0)));it.aff[k]=Math.max(1,v)}
  const base=pick(bio?BASES_GIVRE[slot]:BASES[slot]);if(bio)it.bio=bio;
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
const rkTxt=n=>`rang ${(n||0)+1}`;
const itemName=it=>it.name+(it.up?` · R${it.up+1}`:'');
function weaponItem(c,id){const w=(id&&wdef(id)&&ownedW(id))?wdef(id):wdef(WPN[c][0].id),af={...w.aff,...(meta.waff[w.id]||{})};for(const k in af)if(af[k]==null)delete af[k];
  return {id:'w_'+w.id,wid:w.id,cls:wclsOfD(w.id),slot:'arme',r:w.r,lvl:1,base:{k:'dmg',v:w.dmg},aff:af,name:w.n,type:'Arme',up:meta.wlv[w.id]||0,lock:!!(meta.wlock&&meta.wlock[w.id])}}
const wclsOfD=id=>Object.keys(WPN).find(c=>WPN[c].some(w=>w.id===id));
const curEq=()=>{const e={arme:weaponItem(heroCls,meta.wpn[heroCls])};for(const k of GEAR_KEYS())e[k]=meta.gear[k]||null;return e};
// Arme tombée d'un monstre : une arme commune, magique ou rare de la classe du héros.
function rollPart(){const l=G?itemLvl():1,r=Math.min(2,rollRarity(l+lv('luc')*3)),ws=WPN[heroCls].filter(w=>w.r===r);return {w:pick(ws).id,full:1}}
// Une arme obtenue : nouvelle (elle rejoint tes armes) ou double (gardé pour la fusion de rang).
function gainWeapon(id){if(!ownedW(id)){meta.built[id]=true;return 'new'}(meta.wcp[id]||(meta.wcp[id]=[])).push(0);return 'copy'}
const partLabel=p=>{if(p.hf)return '<span style="color:var(--rar-aby)">Fragment de harnais</span>';const w=bpdef(p.w);return p.full?`<span style="color:${RAR[w.r].c}">${w.n}</span> · arme ${RAR[w.r].n.toLowerCase()}`:`<span style="color:${RAR[w.r].c}">${w.n}</span> · ${w.frag[p.p]}`};

function stats(eq){
  const b=CLS[heroCls].base,s={regenPct:0,dmg:b.dmg,aps:b.aps,hp:b.hp,crit:b.crit,critDmg:150,multi:0,pierce:0,burn:0,armor:b.armor,speed:b.speed,regen:0,cdr:b.cdr,novaPct:0,dmgPct:0,apsPct:0,leech:0,reach:0,splash:0,burnPct:0,chill:0,shock:0,skillRad:0,skillDur:0,dashCd:0,potHeal:0,magnetPct:0,lowArmor:0,lowDmg:0,auraSlow:0,goldPct:0,antidote:0,execute:0,bossDmg:0,xpPct:0,lootPct:0,fury:0,ultPct:0,frz:0,cold:0,shard:0,abSoul:0,abWard:0,abPulse:0,abExec:0,abRift:0,abHunt:0};
  for(const it of Object.values(eq))if(it){const m=upMul(it.up);s[it.base.k]+=it.base.v*m;for(const k in it.aff)s[k]+=NOSCALE[k]?it.aff[k]:it.aff[k]*m}
  s.seals={};for(const it of Object.values(eq))if(it&&it.seal)s.seals[it.seal]=1;
  for(const id of allMods(heroCls))s[MODS[id].k]+=modVal(id,meta.mods[id]);
  const R=(G&&G.run)||{},rr=k=>R[k]||0;
  s.dmgPct+=rr('dmg')*12;s.apsPct+=rr('aps')*10;s.crit+=rr('crit')*5;s.critDmg+=rr('cdmg')*30;s.speed+=rr('spd')*8;
  s.cdr+=rr('cdr')*8;s.novaPct+=rr('nova')*25;s.multi+=rr('multi')+rr('fan')*2;s.dmgPct-=rr('fan')*10;s.echo=rr('echo')*20;s.waves=rr('wave');s.pierce+=rr('pierce');s.reach+=rr('reach')*15;s.leech+=rr('leech')*1.5;
  s.fury+=rr('fury')*15;s.ultPct+=rr('ultp')*30;
  s.splash+=rr('splash')*25;s.burnPct+=rr('burn')*10;s.chill+=rr('chill')*10;s.shock+=rr('shock')*6;
  s.skillRad+=rr('srad')*20;s.skillDur+=rr('sdur')*15;s.dashCd+=rr('refl')*15;s.antidote+=rr('endu')*20;s.execute+=rr('exec')*40;s.bossDmg+=rr('slay')*20;s.xpPct+=rr('know')*20;s.lootPct+=rr('luck')*15;
  s.dmgPct+=prPt('dmg')*2;s.apsPct+=prPt('aps');s.crit+=prPt('crit')*.5;s.critDmg+=prPt('cdmg')*3;s.novaPct+=prPt('nova')*3;s.armor+=prPt('armor')*.5;s.cdr+=prPt('cdr')*.5;s.speed+=prPt('spd')*.5;s.goldPct+=prPt('gold')*2;s.skillRad+=prPt('srad')*3;s.splash+=prPt('splash')*3;
  s.dmgPct+=lv('str')*6;s.apsPct+=lv('cel')*5;s.hp=Math.round(s.hp*(1+lv('vig')*.08)*(1+prPt('hp')*.02)*(1+rr('hp')*.15));s.regen+=rr('regen')*Math.max(3,s.hp*.015)+(s.regenPct?Math.max(s.regenPct*3,s.hp*s.regenPct/100):0);s.magnet=140*(1+rr('mag')*.4)*(1+s.magnetPct/100);
  const cb=!!(G&&G.P&&G.P.cbT>0);
  if(cb){if(heroCls==='archer')s.pierce+=1;else if(heroCls==='magicien')s.splash+=50;else{s.reach+=30;s.apsPct+=25}}
  const dmg=s.dmg*(1+s.dmgPct/100);
  return {shotSpd:cb&&heroCls==='archer'?1.5:1,dmg,aps:s.aps*(1+s.apsPct/100),hp:s.hp,crit:Math.min(s.crit,75),critDmg:s.critDmg,multi:s.multi,pierce:s.pierce,burn:s.burn+dmg*s.burnPct/100,chill:s.chill,shock:s.shock,
    armor:Math.min(s.armor,60),speed:220*(1+s.speed/100),regen:s.regen,cdr:Math.min(s.cdr,50),nova:dmg*4*(1+s.novaPct/100),leech:s.leech,reach:s.reach,splash:Math.min(s.splash,300),magnet:s.magnet,skillRad:Math.min(s.skillRad,300),skillDur:s.skillDur,dashCd:Math.min(s.dashCd,60),potHeal:s.potHeal,lowArmor:Math.min(s.lowArmor,60),lowDmg:s.lowDmg,auraSlow:Math.min(s.auraSlow,50),goldPct:s.goldPct,antidote:s.antidote,execute:s.execute||0,fury:Math.min(s.fury||0,60),ultPct:s.ultPct||0,bossDmg:s.bossDmg||0,xpPct:s.xpPct||0,lootPct:s.lootPct||0,echo:s.echo||0,waves:s.waves||0,frz:Math.min(s.frz,40),cold:s.cold,shard:Math.min(s.shard,60),abSoul:Math.min(s.abSoul,6),abWard:s.abWard,abPulse:s.abPulse,abExec:Math.min(s.abExec,20),abRift:Math.min(s.abRift,60),abHunt:s.abHunt,seals:s.seals};
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
  meta.essence=(meta.essence|0)+ess;meta.maxL=Math.max(meta.maxL|0,meta.start|0,meta.cp|0,1);meta.wcp=meta.wcp||{};meta.v5=1;if(ess)meta.v5ess=ess;saveMeta();
}
meta.wcp=meta.wcp||{};meta.slotU=meta.slotU||{};meta.hfrag=meta.hfrag|0;
/* ---------- v106 : chaque héros a son équipement ----------
   meta.gearBy[classe] = ses emplacements ; meta.gear désigne toujours celui du héros choisi (propriété calculée, non sauvegardée).
   Une ancienne sauvegarde donne son équipement au dernier héros joué. Un objet n'est porté que par un héros à la fois. */
const curCls=()=>{try{if(typeof heroCls!=='undefined'&&CLS[heroCls])return heroCls}catch(e){}let c=null;try{c=localStorage.getItem('crypte-cls')}catch(e){}return CLS[c]?c:'archer'};
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
const findItem=id=>meta.stash.find(i=>i.id===id)||allWorn().find(i=>i.id===id)||null;
// Retire l'objet au héros qui le porte (s'il en a un) ; renvoie la classe du héros dépouillé.
function unwear(it){const c=wornBy(it);if(!c||it.wid)return null;const k=wornSlot(it,c);meta.gearBy[c][k]=null;return c}
/* Équipements enregistrés : meta.sets[classe] = [{n, g:{emplacement: id d'objet ou null}, w: arme}], 6 par héros au plus. */
const SET_MAX=6;
const setsOf=(c=heroCls)=>meta.sets[c]||(meta.sets[c]=[]);
function setSave(i,c=heroCls){const L=setsOf(c),g={};for(const k of GEAR_KEYS())g[k]=meta.gearBy[c][k]?meta.gearBy[c][k].id:null;
  const s={n:L[i]?L[i].n:`Équipement ${L.length+1}`,g,w:curWid(c)};if(L[i])L[i]=s;else if(L.length<SET_MAX)L.push(s);return s}
// Porte un équipement enregistré : chaque objet est pris dans le coffre ou sur un autre héros. Renvoie {done, miss, from}.
function setWear(i,c=heroCls){const s=setsOf(c)[i];if(!s)return null;const g=meta.gearBy[c];let done=0,miss=0;const from=new Set();
  for(const k of GEAR_KEYS()){if(!(k in s.g))continue;const id=s.g[k],cur=g[k]||null;if(cur&&cur.id===id)continue;
    if(id==null){if(cur){meta.stash.push(cur);g[k]=null;done++}continue}
    const it=findItem(id);if(!it||keySlot(k)!==it.slot){miss++;continue}
    const o=unwear(it);if(o)from.add(o);meta.stash=meta.stash.filter(x=>x!==it);if(cur)meta.stash.push(cur);g[k]=it;done++}
  if(s.w&&ownedW(s.w)&&wclsOfD(s.w)===c&&meta.wpn[c]!==s.w){meta.wpn[c]=s.w;done++}else if(s.w&&!ownedW(s.w))miss++;
  return {done,miss,from:[...from]}}

