// Crypte des Cendres — progress.js : sauvegarde permanente (meta) et son chargement, Forge, talents, prestige, bonus de partie, sorts et ultimes. Découpé de data.js en v145.
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

