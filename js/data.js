// Crypte des Cendres — data.js
const cv=document.getElementById('cv');let ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
const MAP=2800, EDGE=40, GOD=location.hash==='#test'||location.hash==='#test2d',NOGL=location.hash==='#test2d',FAST=GOD||location.hash==='#rapide', LEVEL_T=FAST?24:180, BOSS_T=FAST?8:60;
const rand=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rand(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const fmt=s=>{s=Math.max(0,Math.ceil(s));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
let dpr=1;

/* ---------- Données ---------- */
const RAR=[{n:'Commun',c:'#bdb6a8',aff:1,shard:1},{n:'Magique',c:'#7b95ff',aff:2,shard:2},{n:'Rare',c:'#f0cf4a',aff:3,shard:4},{n:'Légendaire',c:'#ff8a24',aff:4,shard:8},{n:'Ancestral',c:'#ff5a7a',aff:4,shard:16},{n:'Sanguin',c:'#e8383f',aff:4,shard:20},{n:'Abyssal',c:'#b07cff',aff:4,shard:30}];
const SLOT={arme:'Arme',armure:'Armure',amulette:'Amulette',bottes:'Bottes',anneau:'Anneau'};
const BIOMES=[
  {id:'crypte',n:'Crypte des Cendres',d:'La crypte d\'origine : braseros, sang séché, monstres connus.',hp:1,dm:1,loot:1,
   tile:{h:285,s:9,l:12.5},stain:'110,25,30',chip:'214,204,180',pil:['#4a4050','#231d27'],wall:['#211a26','#3d3440'],rune:'232,133,59',light:'255,140,60',flame:'255,190,90',tint:0xff8c3c},
  {id:'givre',n:'Abîmes gelés',d:'Cavernes de glace sous la crypte. Monstres plus coriaces (vie ×1,3, dégâts ×1,2), Revenants de givre qui ralentissent, butin +30 %. Seul biome où tombent les affixes de givre, les reliques de givre et leurs schémas.',hp:1.3,dm:1.2,loot:1.3,
   tile:{h:205,s:24,l:14},stain:'150,210,255',chip:'220,240,255',pil:['#5d7f96','#1b2c3a'],wall:['#142231','#3b5a73'],rune:'140,200,255',light:'120,190,255',flame:'190,230,255',tint:0x78beff},
];
const biome=()=>BIOMES[Math.max(0,Math.min(BIOMES.length-1,(typeof G!=='undefined'&&G&&G.biome!=null)?G.biome:(meta.biome|0)))];
const BASES_GIVRE={armure:['Pelisse givrée','Cuirasse de glace'],amulette:['Talisman de givre','Pendentif cristallin'],bottes:['Bottes fourrées','Grèves de glace'],anneau:['Anneau de givre','Bague cristalline']};
const LEGEND_GIVRE={armure:['Linceul de l\'Hiver éternel'],amulette:['Œil du Blizzard'],bottes:['Pas de l\'Avalanche'],anneau:['Sceau du Zéro absolu']};
const BASES={armure:['Cuirasse','Brigandine','Cotte de mailles','Manteau de chasseur'],amulette:['Talisman','Amulette','Médaillon'],bottes:['Bottes de cuir','Grèves','Solerets','Bottes de pèlerin'],anneau:['Anneau','Chevalière','Bague']};
const SUFFIX=['du Corbeau','des Cendres','de la Veuve','du Pèlerin',"de l'Ossuaire",'du Loup gris','de la Lune noire','des Murmures','du Bourreau','de Fer-Sang'];
const LEGEND={armure:["Linceul d'Argent",'Serment du Veilleur','Peau de Wyverne'],amulette:["Œil de l'Abîme",'Larme de la Sorcière','Sceau du Premier Mort'],bottes:['Pas du Spectre','Foulée de Cendre','Semelles du Banni'],anneau:['Alliance Brisée','Anneau du Bourreau','Cercle de Braise']};
const GLYPH={
  arme:'<svg viewBox="0 0 24 24"><path d="M5 19 19 5M13 5h6v6M7 11l6 6M4 14l6 6"/></svg>',
  armure:'<svg viewBox="0 0 24 24"><path d="M6 4l6 2 6-2 2.5 5-3 2v9h-11v-9l-3-2z"/></svg>',
  amulette:'<svg viewBox="0 0 24 24"><path d="M7 3c0 6 10 6 10 0"/><circle cx="12" cy="15" r="5"/><circle cx="12" cy="15" r="1.5"/></svg>',
  bottes:'<svg viewBox="0 0 24 24"><path d="M8 3h6v10l6 3v4H5v-6l3-1z"/><path d="M5 18h15"/></svg>',
  anneau:'<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="6"/><path d="m9 7 3-4 3 4z"/></svg>'};
const CLS={
  archer:{n:'Archer',skill:'Volée',cd:7,ult:'Pluie d\'acier',uicon:'<path d="M6 3v12M12 3v15M18 3v12M3.5 12.5 6 15l2.5-2.5M9.5 15.5 12 18l2.5-2.5M15.5 12.5 18 15l2.5-2.5M5 21h14"/>',base:{dmg:8,aps:1.8,hp:115,crit:5,speed:0,armor:5,cdr:0},
    cloak:'#2d4c50',rim:'#a9cbc0',inner:'#14232a',col:'#e8853b',
    hint:'Glisse pour bouger.<br>Tir automatique, plus rapide à l\'arrêt.',
    desc:'Tire des carreaux automatiquement, plus vite à l\'arrêt. Rapide et précis. <b>Volée</b> : 24 carreaux perforants dans toutes les directions. <b>Ultime, Pluie d\'acier</b> : 3 s de flèches qui s\'abattent sur les ennemis proches.',
    icon:'<path d="M12 12 5 5M12 12l7-7M12 12v9M5 5h4M5 5v4M19 5h-4M19 5v4M9 18l3 3 3-3"/>'},
  guerrier:{n:'Guerrier',skill:'Tourbillon',cd:9,ult:'Colère du Titan',uicon:'<path d="M12 2v5M12 17v5M2 12h5M17 12h5M4.9 4.9l3.5 3.5M15.6 15.6l3.5 3.5M19.1 4.9l-3.5 3.5M8.4 15.6l-3.5 3.5"/><circle cx="12" cy="12" r="2.5"/>',base:{dmg:14,aps:1.5,hp:160,crit:5,speed:-6,armor:15,cdr:0},
    cloak:'#5b2a26',rim:'#d9a48a',inner:'#2a1210',col:'#d9a48a',
    hint:'Glisse pour bouger.<br>Il frappe tout ce qui l\'approche.',
    desc:'Frappe au corps à corps tout ce qui l\'approche. Beaucoup de vie et d\'armure. <b>Tourbillon</b> : tournoie en frappant tout autour, dégâts subis réduits de moitié. <b>Ultime, Colère du Titan</b> : onde de choc géante et 3 s d\'invulnérabilité.',
    icon:'<path d="M12 4a8 8 0 1 1-8 8"/><path d="M12 8a4 4 0 1 1-4 4"/><path d="M4 12 2.5 9M4 12l3-1"/>'},
  magicien:{n:'Magicien',skill:'Nova de givre',cd:7,ult:'Pluie de météores',uicon:'<circle cx="15" cy="15" r="5"/><path d="M11.5 11.5 3 3M14 9.8 8 3.5M9.8 14 3.5 8"/>',base:{dmg:12,aps:1.25,hp:100,crit:8,speed:-2,armor:5,cdr:10},
    cloak:'#3c2c63',rim:'#b9a6f0',inner:'#17122b',col:'#9fd0ff',
    hint:'Glisse pour bouger.<br>Orbes automatiques, plus rapides à l\'arrêt.',
    desc:'Lance des orbes qui explosent à l\'impact, plus vite à l\'arrêt. Fragile, redoutable contre les groupes. <b>Nova de givre</b> : blesse, ralentit et dissipe les projectiles. <b>Ultime, Pluie de météores</b> : 3 météores sur les ennemis proches.',
    icon:'<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 2 3-2M9 20l3-2 3 2"/>'},
};
const WPN={
  archer:[
    {id:'a0',n:'Arbalète rouillée',r:0,bp:0,dmg:6,aff:{}},
    {id:'a1',n:'Arc court du Pèlerin',r:1,bp:150,dmg:10,aff:{apsPct:15}},
    {id:'a2',n:'Arc long du Corbeau',r:2,bp:350,dmg:15,aff:{crit:8,pierce:1}},
    {id:'a3',n:'Baliste de poing',r:2,bp:700,dmg:21,aff:{multi:1,critDmg:30}},
    {id:'a4',n:'Ultime Soupir',r:3,bp:1400,dmg:30,aff:{multi:1,pierce:2,apsPct:15}},
    {id:'a5',n:'Arc du Vide éternel',r:6,bp:2400,dmg:42,relicOnly:1,aff:{multi:2,pierce:2,apsPct:25,critDmg:50,abRift:25}}],
  guerrier:[
    {id:'g0',n:'Épée ébréchée',r:0,bp:0,dmg:6,aff:{}},
    {id:'g1',n:'Épée longue du Veilleur',r:1,bp:150,dmg:11,aff:{leech:2}},
    {id:'g2',n:'Hache de guerre',r:2,bp:350,dmg:17,aff:{critDmg:40,reach:10}},
    {id:'g3',n:'Espadon de Fer-Sang',r:2,bp:700,dmg:24,aff:{reach:25,leech:2}},
    {id:'g4',n:'Brise-Serment',r:3,bp:1400,dmg:32,aff:{reach:20,leech:3,crit:10}},
    {id:'g5',n:'Lame de l\'Abîme',r:6,bp:2400,dmg:46,relicOnly:1,aff:{reach:30,leech:4,crit:12,critDmg:60,abSoul:4}}],
  magicien:[
    {id:'m0',n:'Bâton de frêne',r:0,bp:0,dmg:6,aff:{}},
    {id:'m1',n:'Sceptre des Murmures',r:1,bp:150,dmg:10,aff:{cdr:10}},
    {id:'m2',n:'Grimoire de la Veuve',r:2,bp:350,dmg:15,aff:{splash:25,novaPct:30}},
    {id:'m3',n:'Orbe de la Lune noire',r:2,bp:700,dmg:21,aff:{multi:1}},
    {id:'m4',n:'Étoile Mourante',r:3,bp:1400,dmg:30,aff:{multi:1,splash:30,crit:10}},
    {id:'m5',n:'Sceptre du Néant',r:6,bp:2400,dmg:42,relicOnly:1,aff:{multi:1,splash:50,novaPct:50,crit:12,abPulse:300}}],
};
const PARTS={archer:['Branches','Corde','Mécanisme'],guerrier:['Lame','Garde','Poignée'],magicien:['Hampe','Focus','Runes']};
const wdef=id=>{for(const c in WPN){const w=WPN[c].find(x=>x.id===id);if(w)return Object.assign({cls:c},w)}return null};
const GEAR_BP=[
  {id:'x1',n:'Linceul du Néant',slot:'armure',r:3,base:90,aff:{armor:10,regen:2},craft:500},
  {id:'x2',n:'Cuirasse du Veilleur Prime',slot:'armure',r:3,base:70,aff:{dmgPct:15,armor:6},craft:500},
  {id:'x3',n:'Amulette des Échos',slot:'amulette',r:3,base:6,aff:{apsPct:15,cdr:10},craft:500},
  {id:'x4',n:'Sceau du Néant',slot:'amulette',r:3,base:8,aff:{critDmg:50,dmgPct:10},craft:500},
  {id:'x5',n:'Foulée du Néant',slot:'bottes',r:3,base:12,aff:{cdr:10,regen:2},craft:500},
  {id:'x6',n:'Chevalière du Premier Roi',slot:'anneau',r:3,base:15,aff:{crit:6,critDmg:30},craft:500},
  {id:'y1',n:'Manteau du Blizzard',slot:'armure',r:3,base:110,aff:{hp:60,cold:25},craft:800,bio:1},
  {id:'y2',n:'Cœur de Givre',slot:'amulette',r:3,base:8,aff:{frz:8,critDmg:30},craft:800,bio:1},
  {id:'y3',n:'Bottes de l\'Avalanche',slot:'bottes',r:3,base:14,aff:{speed:8,shard:12},craft:800,bio:1},
  {id:'y4',n:'Anneau du Zéro absolu',slot:'anneau',r:3,base:18,aff:{cold:30,crit:6},craft:800,bio:1},
];
const FRAG={archer:['Branches','Corde','Mécanisme'],guerrier:['Lame','Garde','Poignée'],magicien:['Hampe','Focus','Runes'],armure:['Plastron','Sangles','Doublure'],amulette:['Chaîne','Sertissure','Gemme'],bottes:['Tige','Semelle','Boucle'],anneau:['Anneau brut','Chaton','Pierre']};
function bpdef(id){const w=wdef(id);if(w)return {...w,kind:'arme',frag:FRAG[w.cls]};const g=GEAR_BP.find(x=>x.id===id);return g?{...g,kind:g.slot,frag:FRAG[g.slot]}:null}
/* ---------- Reliques ---------- */
const RTIER=[{n:'Cendre',c:'#c9a46a'},{n:'Ossuaire',c:'#a9bccf'},{n:'Sanguine',c:'#e07a7a'},{n:'Abysse',c:'#f0cf4a'}];
const RELICS_GIVRE={
  fA1:{t:0,n:"Éclat de givre",bio:1,rw:['a1:*','g1:*','ess:30','m1:*','a2:*','g2:*']},
  fB1:{t:1,n:"Larme gelée",bio:1,rw:['a2:*','g2:*','gold:200','m3:*','a3:*','g3:*']},
  fC1:{t:2,n:"Cœur d'hiver",bio:1,rw:['a3:*','m3:*','ess:80','g3:*','sang:s9','sang:s10']},
  fD1:{t:3,n:"Couronne du Blizzard",bio:1,rw:['y1:*','y2:*','y3:*','y4:*','aby:a9','aby:a10']},
};
const RELICS={
  lA1:{t:0,n:"Dent du Pèlerin",rw:['a1:*','g1:*','ess:20','m1:*','a2:*','g2:*']},
  lB1:{t:0,n:"Larme de suie",rw:['m1:*','a1:*','gold:80','g1:*','m2:*','a2:*']},
  lC1:{t:0,n:"Clou du Bûcher",rw:['g1:*','m1:*','a1:*','g2:*','a2:*','m2:*']},
  mA1:{t:1,n:"Phalange du Veilleur",rw:['g2:*','m2:*','ess:40','a3:*','g3:*','m3:*']},
  mB1:{t:1,n:"Crâne fêlé",rw:['a2:*','g2:*','m2:*','a3:*','m3:*','g3:*']},
  mC1:{t:1,n:"Côte du Roi-mendiant",rw:['a2:*','m2:*','gold:200','g3:*','m3:*','a3:*']},
  nA1:{t:2,n:"Cœur noirci",rw:['a3:*','g3:*','m3:*','sang:s1','sang:s2','sang:s3']},
  nB1:{t:2,n:"Calice rouge",rw:['a3:*','g3:*','m3:*','sang:s4','sang:s5','sang:s6']},
  nC1:{t:2,n:"Veine de la Veuve",rw:['a3:*','g3:*','m3:*','sang:s7','sang:s8','sang:s1']},
  xA1:{t:3,n:"Prunelle du Néant",rw:['x1:*','x2:*','ess:100','a4:*','aby:a1','aby:a2']},
  xB1:{t:3,n:"Couronne brisée",rw:['x3:*','x4:*','gold:400','g4:*','aby:a3','aby:a4']},
  xC1:{t:3,n:"Os du Premier Roi",rw:['x5:*','x6:*','ess:100','m4:*','aby:a5','aby:a6']},
  nD1:{t:2,n:"Fiole d'ichor",rw:['g3:*','m3:*','ess:60','sang:s2','sang:s6','sang:s7']},
  xE1:{t:3,n:"Écharde du Vide",rw:['a4:*','x3:*','ess:150','a5:*','aby:a1','a5:*']},
  xF1:{t:3,n:"Cœur de l'Abîme",rw:['g4:*','x2:*','ess:150','g5:*','aby:a2','g5:*']},
  xG1:{t:3,n:"Œil du Néant éternel",rw:['m4:*','x4:*','ess:150','m5:*','aby:a3','m5:*']},
  xD1:{t:3,n:"Sablier noir",rw:['x2:*','x5:*','gold:300','x6:*','aby:a7','aby:a8']},
};
const RW_RAR=[0,0,0,1,1,2], CH=[[25.33,11,2],[16.67,20,10]], REACT_N=10;
Object.assign(RELICS,RELICS_GIVRE);
/* Reliques forgées : 3 Abysse fusionnées au Camp donnent une de ces reliques (une par schéma légendaire).
   Elle s'ouvre en mission comme les autres et donne à coup sûr un fragment de son schéma, manquant en priorité. */
for(const b of [...Object.values(WPN).flat().filter(w=>w.r===3),...GEAR_BP.filter(g=>g.r===3)])
  RELICS['F_'+b.id]={t:3,fz:1,n:`Relique forgée · ${b.n}`,rw:Array(6).fill(b.id+':*')};
/* Niveau de relique selon le niveau de mission : 1–10 Cendre, 11–25 Ossuaire, 26–40 Sanguine, 41+ Abysse ; 70 % ce niveau, 20 % celui du dessous, 10 % celui du dessus. */
const REL_BAND=[10,25,40];
const relicBase=L=>REL_BAND.filter(x=>L>x).length;
function relicTierOdds(L){const b=relicBase(L),o=[0,0,0,0];o[b]+=70;if(b>0)o[b-1]+=20;else o[b]+=20;if(b<3)o[b+1]+=10;else o[b]+=10;return o}
function relicTierRoll(L){const o=relicTierOdds(L);let x=Math.random()*100;for(let i=0;i<4;i++){x-=o[i];if(x<0)return i}return 3}
const relicName=id=>`${RELICS[id].n} (${RTIER[RELICS[id].t].n}${RELICS[id].bio?' · givre':''})`;
function rollRelic(id,rad){const ch=CH[rad?1:0];let x=Math.random()*100;for(let i=0;i<6;i++){x-=ch[RW_RAR[i]];if(x<0)return RELICS[id].rw[i]}return RELICS[id].rw[0]}
const SANG={
  s1:{n:'Cœur du Martyr',slot:'amulette',aff:['dmgPct','critDmg','crit','leech']},
  s2:{n:'Cuirasse de la Veuve rouge',slot:'armure',aff:['hp','armor','regen','dmgPct']},
  s3:{n:"Pas de l'Hémorragie",slot:'bottes',aff:['speed','apsPct','dmgPct','crit']},
  s4:{n:'Anneau du Sang versé',slot:'anneau',aff:['crit','critDmg','apsPct','dmgPct']},
  s5:{n:'Linceul écarlate',slot:'armure',aff:['hp','novaPct','skillRad','armor']},
  s6:{n:'Œil du Calice',slot:'amulette',aff:['cdr','novaPct','skillRad','critDmg']},
  s7:{n:'Grèves du Bourreau rouge',slot:'bottes',aff:['speed','hp','armor','cdr']},
  s8:{n:"Sceau de l'Ichor",slot:'anneau',aff:['dmgPct','apsPct','leech','regen']},
  s9:{n:'Cœur gelé du Martyr',slot:'amulette',aff:['cold','frz','critDmg','dmgPct']},
  s10:{n:"Anneau de l'Hiver sanglant",slot:'anneau',aff:['shard','cold','crit','apsPct']},
};
const SANG_K=1.8;
function sangItem(sid,l){const T=SANG[sid],slot=T.slot,bk=BASE_STAT[slot];
  const bv=slot==='armure'?Math.round(20+l*7):slot==='bottes'?8+Math.floor(l/4):slot==='anneau'?10+Math.floor(l*.8):5;
  const it={id:uid++,slot,r:5,lvl:l,base:{k:bk,v:Math.round(bv*1.4)},aff:{},name:T.n,type:'Sanguin',sang:sid};
  for(const k of T.aff){const A=AFF[k];let v=A.r?A.r(l):({leech:2,reach:10,splash:15,multi:1,pierce:1,burn:5})[k]||5;it.aff[k]=Math.max(1,Math.round(v*SANG_K))}
  return it}
const sangLvl=()=>{const L=(typeof G!=='undefined'&&G&&G.level)||clamp(meta.start|0||1,1,50);return 1+(L-1)*4+20};
const ABY={
  a1:{n:'Œil du Néant',slot:'amulette',aff:['dmgPct','critDmg','crit'],pw:'abRift'},
  a2:{n:'Linceul des Mille Âmes',slot:'armure',aff:['hp','armor','dmgPct'],pw:'abSoul'},
  a3:{n:'Couronne de l\'Éclipse',slot:'amulette',aff:['novaPct','skillRad','cdr'],pw:'abPulse'},
  a4:{n:'Sceau du Premier Roi',slot:'anneau',aff:['dmgPct','apsPct','critDmg'],pw:'abHunt'},
  a5:{n:'Pas du Vide',slot:'bottes',aff:['speed','apsPct','crit'],pw:'abExec'},
  a6:{n:'Égide sans fond',slot:'armure',aff:['hp','regen','armor'],pw:'abWard'},
  a7:{n:'Anneau du Sablier noir',slot:'anneau',aff:['cdr','novaPct','crit'],pw:'abSoul'},
  a8:{n:'Grèves de l\'Abîme',slot:'bottes',aff:['speed','hp','dmgPct'],pw:'abWard'},
  a9:{n:'Cœur du Blizzard éternel',slot:'amulette',aff:['cold','frz','critDmg'],pw:'abPulse'},
  a10:{n:'Anneau du Néant gelé',slot:'anneau',aff:['shard','cold','apsPct'],pw:'abExec'},
};
const ABY_K=2.1;
function abyItem(aid,l){const T=ABY[aid],slot=T.slot,bk=BASE_STAT[slot];
  const bv=slot==='armure'?Math.round(20+l*7):slot==='bottes'?8+Math.floor(l/4):slot==='anneau'?10+Math.floor(l*.8):5;
  const it={id:uid++,slot,r:6,lvl:l,base:{k:bk,v:Math.round(bv*1.5)},aff:{},name:T.n,type:'Abyssal',aby:aid};
  for(const k of T.aff){const A=AFF[k];it.aff[k]=Math.max(1,Math.round(A.r(l)*ABY_K))}
  it.aff[T.pw]=AFF[T.pw].r(l);return it}
const abyLvl=()=>sangLvl()+10;
function rwLabel(r){const [k,v]=r.split(':');if(k==='aby')return `${ABY[v].n} · objet abyssal exclusif`;if(k==='sang')return `${SANG[v].n} · objet exclusif`;if(k==='ess')return `Essence ×${v}`;if(k==='gold')return `${v} or`;const b=bpdef(k);return v==='*'?`${b.n} · fragment`:`${b.n} · ${b.frag[+v]}`}
const MODES={
  survie:{n:'Survie',d:'Tiens face aux hordes. Toutes les 3 minutes, sors ou continue. Chaque manche terminée rapporte une relique.'},
  defense:{n:'Défense',d:'Protège le cryopode contre des vagues d\'ennemis. Toutes les 5 vagues : une relique et un équipement, puis sors ou continue.'},
  capture:{n:'Capture',d:'Traque la cible, mets-la à terre, capture-la puis tiens 3 s dans la zone d\'extraction. Une relique et de l\'or à la clé.'},
};

/* ---------- Progression permanente ---------- */
let meta={gold:0,up:{},tal:{},cp:1,start:1,essence:0,mods:{ferocite:0},
  load:{guerrier:['ferocite',null,null,null],archer:['ferocite',null,null,null],magicien:['ferocite',null,null,null]},
  gear:{armure:null,amulette:null,bottes:null,anneau:null},stash:[],wpn:{guerrier:'g0',archer:'a0',magicien:'m0'},bp:{},built:{},parts:{},relics:{},mode:'survie',relicSel:null,relicQ:[],diff:0,waff:{},prest:{},wish:{leg:true,aff:{}},pol:{},mast:{},align:{},wlv:{},wload:{},wpol:{},wmast:{},walign:{},hload:{},hslots:{},aura:{}};
try{const m=JSON.parse(localStorage.getItem('crypte-meta')||'null');if(m)meta=Object.assign(meta,m)}catch(e){}
if(!meta.v2){meta.cp=1;meta.start=1;meta.v2=1}
meta.modSt=meta.modSt||{};meta.modCp=meta.modCp||{};
if(!meta.v3){for(const id in meta.bp||{}){const w=wdef(id);if(w&&!meta.built[id])meta.gold+=w.bp}meta.bp={};meta.v3=1;meta.relics={lA1:[1,0],...(meta.relics||{})}}
if(!MODES[meta.mode])meta.mode='survie';
if(!Array.isArray(meta.relicQ))meta.relicQ=[];if(meta.relicSel){if(!meta.relicQ.length)meta.relicQ=[meta.relicSel];meta.relicSel=null}
const saveMeta=()=>{try{localStorage.setItem('crypte-meta',JSON.stringify(meta))}catch(e){}};
function relicQFix(){const used={};meta.relicQ=(meta.relicQ||[]).filter(q=>{const a=q&&meta.relics[q.id];if(!a||!RELICS[q.id])return false;q.rad=!!q.rad;const k=q.id+'|'+(q.rad?1:0);used[k]=(used[k]||0)+1;return used[k]<=(a[q.rad?1:0]||0)})}
const relicQN=(id,rad)=>meta.relicQ.filter(q=>q.id===id&&!!q.rad===rad).length;
const DIFF=[{n:'Normal',iv:60,cnt:1,loot:0,c:'#bdb6a8'},{n:'Difficile',iv:45,cnt:2,loot:.5,c:'#7b95ff'},{n:'Cauchemar',iv:35,cnt:3,loot:1,c:'#f0cf4a'},{n:'Tourment',iv:25,cnt:4,loot:2,c:'#ff6a3a'}];
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const tormT=()=>(meta.diff|0)===3?Math.max(1,Math.min(10,meta.torm|0||1)):0;
const dif=()=>{const i=Math.max(0,Math.min(3,meta.diff|0)),D=DIFF[i];if(i<3)return Object.assign({hp:1,dm:1,aq:0,anc:0,tier:0},D);
  const t=tormT();return {n:`Tourment ${ROM[t-1]}`,iv:Math.max(16,26-t),cnt:t>=6?5:4,loot:2+.5*(t-1),c:D.c,hp:1+.5*t,dm:1+.22*t,aq:.05*t,anc:.004*t,tier:t}};
const ULT_N=60;
const lv=k=>meta.up[k]||0, hasTal=k=>!!meta.tal[k];
const ownedW=id=>/0$/.test(id)||!!meta.built[id];
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
const upCost=u=>Math.round(u.cost*Math.pow(1.7,lv(u.k)));
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
  {k:'regen',n:'Régénération',d:'+1,5 PV par seconde',max:3,c:C_DEF},
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
  souffle:{type:'h',n:'Second souffle',r:0,max:3,drain:3,k:'regen',v:1.5,t:v=>`+${v} PV par seconde`},
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
const starCost=(id,st)=>({cp:st+1,ess:50*(MODS[id].r+1)*(st+1)});
const modVal=(id,rk,st=modSt(id))=>{const x=MODS[id].v*(rk+1)*(1+MOD_ST_K*st);return x>=10?Math.round(x):x>=1?+x.toFixed(1):+x.toFixed(2)};
const modDrain=(id,rk,st=modSt(id))=>MODS[id].drain+rk+Math.floor(st/2);
const fuseCost=(id,rk)=>10*Math.pow(2,rk)*(MODS[id].r+1);
const POL={b:{n:'Braise',c:'#e8853b',s:'▲'},r:{n:'Rempart',c:'#5fbf7a',s:'■'},s:{n:'Spirale',c:'#b9a6f0',s:'◆'}};
const MOD_POL={ferocite:'b',cadence:'b',oeil:'b',boucherie:'b',dedoublement:'b',diamant:'b',allonge:'b',deflagration:'b',vitalite:'r',egide:'r',sangsue:'r',pas:'r',intensite:'s',flux:'s',braise:'s',givre:'s',orage:'s',souffle:'r',etendue:'s',persist:'s',fantome:'r',alchimiste:'r',rapace:'s',dernier:'r',survivant:'b',antidote:'r'};
const mastOf=c=>(meta.mast[c]||(meta.mast[c]={r:0,xp:0}));
const mastNeed=r=>100*(r+1);
const deCls=c=>c==='archer'?"de l'Archer":`du ${CLS[c].n}`;
const modOk=(id,c)=>!MODS[id].cls||MODS[id].cls.includes(c);
const modKind=id=>MODS[id].type||'w';
const curWid=(c=heroCls)=>meta.wpn[c]&&ownedW(meta.wpn[c])?meta.wpn[c]:WPN[c][0].id;
const arrOf=(o,k,n)=>{let a=o[k];if(!a)a=o[k]=Array(n).fill(null);while(a.length<n)a.push(null);return a};
const mstOf=(o,k)=>o[k]||(o[k]={r:0,xp:0});
const deW=n=>/^[aeiouyéèêâîôh]/i.test(n)&&!/^h/i.test(n)?`de l'${n}`:`de ${n}`;
const HSLOT_MAX=6,HSLOT_COST=[15,30,50];
const auraCap=id=>id&&meta.mods[id]!=null?MODS[id].cap+meta.mods[id]:0;
function build(kind,c=heroCls){
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
  multi:{t:v=>`+${v} projectile${v>1?'s':''} par tir`,w:1},
  leech:{t:v=>`${v} % des dégâts rendus en vie`,w:1},
  reach:{t:v=>`+${v} % de portée de frappe`,w:1},
  splash:{t:v=>`+${v} % de rayon d'explosion`,w:1},
  pierce:{t:v=>`Les carreaux transpercent ${v} ennemi${v>1?'s':''}`,w:1},
  abSoul:{t:v=>`Pouvoir abyssal · Moisson : chaque ennemi tué donne +${v} % de dégâts pendant 5 s (cumul ×10)`,r:l=>ri(3,4)+(l>120?1:0),w:1,aby:1},
  abWard:{t:v=>`Pouvoir abyssal · Égide du Néant : chaque ennemi tué donne ${v} points de bouclier (jusqu'à 30 % de tes PV)`,r:l=>Math.round(8+l*.6),w:1,aby:1},
  abPulse:{t:v=>`Pouvoir abyssal · Onde du Vide : toutes les 5 s, ${v} % de tes dégâts à tous les ennemis proches`,r:l=>ri(250,350),w:1,aby:1},
  abExec:{t:v=>`Pouvoir abyssal · Jugement : les ennemis (hors gardiens) sous ${v} % de vie meurent sur le coup`,r:l=>ri(8,12),w:1,aby:1},
  abRift:{t:v=>`Pouvoir abyssal · Faille : ${v} % de chances qu'un critique déchire le vide et frappe 3 ennemis de plus`,r:l=>ri(20,30),w:1,aby:1},
  abHunt:{t:v=>`Pouvoir abyssal · Chasse royale : +${v} % de dégâts contre gardiens et élites`,r:l=>ri(35,55),w:1,aby:1},
};
const BASE_STAT={arme:'dmg',armure:'hp',amulette:'crit',bottes:'speed',anneau:'dmgPct'};
const baseTxtOf=(slot,v)=>slot==='arme'?`${v} dégâts de base`:slot==='armure'?`+${v} points de vie`:slot==='bottes'?`+${v} % de vitesse de déplacement`:slot==='anneau'?`+${v} % de dégâts`:`+${v} % de chances de critique`;
function baseLine(it){return baseTxtOf(it.slot,it.base.v)}
let uid=1+Math.max(0,...meta.stash.map(i=>i.id),...Object.values(meta.gear).filter(Boolean).map(i=>i.id));
function rollRarity(l){const tb=(typeof G!=='undefined'&&G)?dif().tier*.6:0,x=Math.random()*100,leg=Math.min(9,1.5+l*.05)+tb,rare=Math.min(30,8+l*.15);return x<leg?3:x<leg+rare?2:x<leg+rare+32?1:0}
function genItem(l,minR=0){
  let r=Math.max(rollRarity(l+lv('luc')*3),minR);const DQ=G?dif():{anc:0,aq:0};if(DQ.anc&&Math.random()<DQ.anc*(minR>=1?3:1))r=4;const slot=pick(['armure','amulette','bottes','anneau']), bk=BASE_STAT[slot];
  const bv=slot==='armure'?Math.round(20+l*7+rand(-4,6)):slot==='bottes'?ri(4,8)+Math.floor(l/4):slot==='anneau'?ri(5,10)+Math.floor(l*.8):ri(2,5);
  const it={id:uid++,slot,r,lvl:l,base:{k:bk,v:bv},aff:{}};
  const bio=(typeof G!=='undefined'&&G&&G.biome)||0;
  let pool=Object.keys(AFF).filter(k=>!AFF[k].w&&(!AFF[k].bio||bio===AFF[k].bio));const chosen=[];
  if(bio){const fr=pool.filter(k=>AFF[k].bio);if(Math.random()<.45){const k=pick(fr);chosen.push(k);pool=pool.filter(x=>x!==k)}}
  while(chosen.length<RAR[r].aff&&pool.length){const k=pick(pool);pool=pool.filter(x=>x!==k);chosen.push(k)}
  for(const k of chosen){let v=AFF[k].r(l);if(r===3)v=v*1.3;if(r===4)v=v*1.6;v=Math.round(v*(1+(DQ.aq||0)));it.aff[k]=Math.max(1,v)}
  const base=pick(bio?BASES_GIVRE[slot]:BASES[slot]),LG=bio?LEGEND_GIVRE:LEGEND;
  if(r===4)it.base.v=Math.round(it.base.v*1.25);if(bio)it.bio=bio;
  it.name=r===4?`${pick(LG[slot])} ancestral`:r===3?pick(LG[slot]):r===0?base:`${base} ${pick(SUFFIX)}`;
  it.type=base;
  return it;
}
const UP_MAX=100,upCostLv=n=>5+3*n+Math.floor(n*n/10),upMul=n=>1+.02*(n||0),NOSCALE={multi:1,pierce:1,abSoul:1,abWard:1,abPulse:1,abExec:1,abRift:1,abHunt:1};
const upCostRange=(from,k)=>{let c=0;for(let i=from;i<Math.min(UP_MAX,from+k);i++)c+=upCostLv(i);return c};
const upInvested=n=>upCostRange(0,n||0);
const fmtN=x=>(Math.round(x*10)/10).toLocaleString('fr-FR');
const itemName=it=>it.name+(it.up?` +${it.up}`:'');
function weaponItem(c,id){const w=(id&&wdef(id)&&ownedW(id))?wdef(id):wdef(WPN[c][0].id),af={...w.aff,...(meta.waff[w.id]||{})};for(const k in af)if(af[k]==null)delete af[k];
  return {id:'w_'+w.id,wid:w.id,slot:'arme',r:w.r,lvl:1,base:{k:'dmg',v:w.dmg},aff:af,name:w.n,type:'Arme',up:meta.wlv[w.id]||0}}
const curEq=()=>({arme:weaponItem(heroCls,meta.wpn[heroCls]),armure:meta.gear.armure||null,amulette:meta.gear.amulette||null,bottes:meta.gear.bottes||null,anneau:meta.gear.anneau||null});
function rollPart(){
  // En mission, seuls les schémas magiques et rares de l'arme du héros tombent ; légendaires et Prime : reliques Abysse uniquement.
  const L=G?G.level:1,ws=WPN[heroCls].filter(w=>w.r>=1&&w.r<=2),wt=ws.map((w,i)=>Math.max(.5,3-i+(L-1)*i*.5));
  let x=Math.random()*wt.reduce((a,b)=>a+b,0),k=0;while(x>wt[k]){x-=wt[k];k++}
  return {w:ws[Math.min(k,ws.length-1)].id,p:ri(0,2)};
}
const partLabel=p=>{const w=bpdef(p.w);return `<span style="color:${RAR[w.r].c}">${w.n}</span> · ${w.frag[p.p]}`};

function stats(eq){
  const b=CLS[heroCls].base,s={dmg:b.dmg,aps:b.aps,hp:b.hp,crit:b.crit,critDmg:150,multi:0,pierce:0,burn:0,armor:b.armor,speed:b.speed,regen:0,cdr:b.cdr,novaPct:0,dmgPct:0,apsPct:0,leech:0,reach:0,splash:0,burnPct:0,chill:0,shock:0,skillRad:0,skillDur:0,dashCd:0,potHeal:0,magnetPct:0,lowArmor:0,lowDmg:0,auraSlow:0,goldPct:0,antidote:0,frz:0,cold:0,shard:0,abSoul:0,abWard:0,abPulse:0,abExec:0,abRift:0,abHunt:0};
  for(const it of Object.values(eq))if(it){const m=upMul(it.up);s[it.base.k]+=it.base.v*m;for(const k in it.aff)s[k]+=NOSCALE[k]?it.aff[k]:it.aff[k]*m}
  s.seals={};for(const it of Object.values(eq))if(it&&it.seal)s.seals[it.seal]=1;
  for(const id of allMods(heroCls))s[MODS[id].k]+=modVal(id,meta.mods[id]);
  const R=(G&&G.run)||{},rr=k=>R[k]||0;
  s.dmgPct+=rr('dmg')*12;s.apsPct+=rr('aps')*10;s.crit+=rr('crit')*5;s.critDmg+=rr('cdmg')*30;s.speed+=rr('spd')*8;s.regen+=rr('regen')*1.5;
  s.cdr+=rr('cdr')*8;s.novaPct+=rr('nova')*25;s.multi+=rr('multi')+rr('fan')*2;s.dmgPct-=rr('fan')*10;s.echo=rr('echo')*20;s.waves=rr('wave');s.pierce+=rr('pierce');s.reach+=rr('reach')*15;s.leech+=rr('leech')*1.5;
  s.fury=rr('fury')*15;s.ultPct=rr('ultp')*30;
  s.splash+=rr('splash')*25;s.burnPct+=rr('burn')*10;s.chill+=rr('chill')*10;s.shock+=rr('shock')*6;
  s.skillRad+=rr('srad')*20;s.skillDur+=rr('sdur')*15;s.dashCd+=rr('refl')*15;s.antidote+=rr('endu')*20;s.execute=rr('exec')*40;s.bossDmg=rr('slay')*20;s.xpPct=rr('know')*20;s.lootPct=rr('luck')*15;
  s.dmgPct+=prPt('dmg')*2;s.apsPct+=prPt('aps');s.crit+=prPt('crit')*.5;s.critDmg+=prPt('cdmg')*3;s.novaPct+=prPt('nova')*3;s.armor+=prPt('armor')*.5;s.cdr+=prPt('cdr')*.5;s.speed+=prPt('spd')*.5;s.goldPct+=prPt('gold')*2;s.skillRad+=prPt('srad')*3;s.splash+=prPt('splash')*3;
  s.dmgPct+=lv('str')*6;s.apsPct+=lv('cel')*5;s.hp=Math.round(s.hp*(1+lv('vig')*.08)*(1+prPt('hp')*.02)*(1+rr('hp')*.15));s.magnet=140*(1+rr('mag')*.4)*(1+s.magnetPct/100);
  const cb=!!(G&&G.P&&G.P.cbT>0);
  if(cb){if(heroCls==='archer')s.pierce+=1;else if(heroCls==='magicien')s.splash+=50;else{s.reach+=30;s.apsPct+=25}}
  const dmg=s.dmg*(1+s.dmgPct/100);
  return {shotSpd:cb&&heroCls==='archer'?1.5:1,dmg,aps:s.aps*(1+s.apsPct/100),hp:s.hp,crit:Math.min(s.crit,75),critDmg:s.critDmg,multi:s.multi,pierce:s.pierce,burn:s.burn+dmg*s.burnPct/100,chill:s.chill,shock:s.shock,
    armor:Math.min(s.armor,60),speed:220*(1+s.speed/100),regen:s.regen,cdr:Math.min(s.cdr,50),nova:dmg*4*(1+s.novaPct/100),leech:s.leech,reach:s.reach,splash:Math.min(s.splash,300),magnet:s.magnet,skillRad:Math.min(s.skillRad,300),skillDur:s.skillDur,dashCd:Math.min(s.dashCd,60),potHeal:s.potHeal,lowArmor:Math.min(s.lowArmor,60),lowDmg:s.lowDmg,auraSlow:Math.min(s.auraSlow,50),goldPct:s.goldPct,antidote:s.antidote,execute:s.execute||0,bossDmg:s.bossDmg||0,xpPct:s.xpPct||0,lootPct:s.lootPct||0,echo:s.echo||0,waves:s.waves||0,frz:Math.min(s.frz,40),cold:s.cold,shard:Math.min(s.shard,60),abSoul:Math.min(s.abSoul,6),abWard:s.abWard,abPulse:s.abPulse,abExec:Math.min(s.abExec,20),abRift:Math.min(s.abRift,60),abHunt:s.abHunt,seals:s.seals};
}
const dps=S=>S.dmg*S.aps*(1+S.crit/100*(S.critDmg/100-1))*(1+S.multi*.8)*(1+S.echo/100)*(1+S.waves*.5)*(heroCls==='archer'?1:1.2)+S.burn;

