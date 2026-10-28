// Crypte des Cendres — items.js : affixes, objets (tirage, rang, fragments), statistiques du héros (stats). Découpé de data.js en v145.
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
