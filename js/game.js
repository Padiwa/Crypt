// Crypte des Cendres — game.js : état d'une mission (newGame), Nécropole des Sables, sol, effets.
// Suite de la simulation (v145) : combat.js, spells.js (entrées, sorts, ultimes), step.js (update).
/* ---------- État ---------- */
let G=null, S=null, started=false, paused=false;
let best=0; try{best=+localStorage.getItem('crypte-best2')||0}catch{}
const ETYPE={
  ghoul:{r:16,hp:16,spd:95,dmg:9,col:'#8ea37a'},
  bat:{r:10,hp:6,spd:165,dmg:5,col:'#6a557c'},
  archer:{r:15,hp:13,spd:85,dmg:8,col:'#d8cfb8'},
  brute:{r:26,hp:70,spd:66,dmg:18,col:'#7a2f30'},
  poison:{r:15,hp:22,spd:80,dmg:6,col:'#8a3d7e'},
  pyro:{r:15,hp:24,spd:80,dmg:6,col:'#b5532a'},
  givrin:{r:15,hp:26,spd:108,dmg:7,col:'#9cc8e8'},
  scarab:{r:9,hp:5,spd:190,dmg:4,col:'#3d4a24'},
  mummy:{r:17,hp:30,spd:66,dmg:11,col:'#cdb98c'},
  mummyR:{r:17,hp:16,spd:96,dmg:12,col:'#8d7a52'},
  slime:{r:22,hp:34,spd:72,dmg:8,col:'#3f9e8c'},
  boss:{r:50,hp:650,spd:60,dmg:22,col:'#3d2150'},
};
let heroCls='archer';try{heroCls=localStorage.getItem('crypte-cls')||'archer'}catch{}
if(!CLS[heroCls])heroCls='archer';
let floorPat=null;

function newGame(){
  const C=CLS[heroCls],L=clamp(meta.start|0||1,1,LV_MAX);
  G={eid:0,bid:0,zid:0,hold:false,mates:[],oshots:null,cls:heroCls,level:L,t:0,tl:0,potions:2+lv('alc'),kills:0,gold:0,loot:{items:[],parts:[],relics:[],seals:[],lsh:0},breche:false,twinQ:[],fresh:0,run:{},hl:1,xp:0,pend:0,nxp:0,
    en:[],shots:[],eb:[],zaps:[],zones:[],lobs:[],parts:[],texts:[],drops:[],rings:[],spawns:[],shake:0,spawnT:1.2,bossT:BOSS_T,bossN:0,vw:600,vh:900};
  G.lv0=G.level; // v146 : niveau de départ, base de l'horloge de mission
  G.eq=curEq();G.wid=curWid();G.kit=kitOf(heroCls);S=stats(G.eq);if(sealOn('gourde'))G.potions+=2;G.potions=Math.min(potMax(),G.potions); // v144 : jamais plus que le maximum (Alchimie 3 + Gourde = 7 → 6)
  G.P={x:MAP/2,y:MAP/2,r:17,hp:S.hp,face:-Math.PI/2,fire:0,inv:1,flash:0,dashT:0,dashCd:0,novaCd:0,dx:0,dy:-1,spin:0,spinTick:0,swing:null,
    shield:0,noHit:0,psn:0,psnT:0,psnD:0,brnT:0,brnD:0,swings:0,critShots:0,dashHit:new Set()};
  if(heroCls==='magicien'&&hasTal('m_shield'))G.P.shield=S.hp*.25;
  G.cam={x:G.P.x,y:G.P.y};
  G.biome=clamp(meta.biome|0,0,BIOMES.length-1);if(floorPat&&floorPat.__b!==G.biome)floorPat=null;
  genMap();G.storm=0;G.stormIn=FAST?8:rand(40,55);
  G.mode=meta.mode==='breche'?'survie':meta.mode;G.relic=null;G.react=0;G.cracked=false;G.ult=0;G.ultQ=0;G.inUlt=0;G.ultHalf=1;G.bossT=bossIv();G.pod=null;G.target=null;G.exitPt=null;G.capT=0;G.extT=0;G.capN=0;G.nextTgt=0;
  relicQFix();G.relQ=meta.relicQ.map(q=>({id:q.id,rad:!!q.rad}));G.relI=0;G.opened=[];G.shared=[];G.relic=G.relQ[0]||null;
  if(G.mode==='defense'){const m=1200*(1+.5*(L-1))*dif().dm;G.pod={x:MAP/2,y:MAP/2,r:28,hp:m,max:m,flash:0};G.pillars.push(G.pod);G.P.y+=110;G.cam.y=G.P.y;G.wave=0;G.waveState='break';G.waveT=3;G.toSpawn=0}
  if(G.mode==='capture'){spawnTarget()}
  $('objBar').hidden=G.mode!=='defense';
  if(PX&&glLost())dropPixi('contexte WebGL perdu au lancement');
  if(PX)try{buildStatic()}catch(err){dropPixi(err)}
  const KS=SPELLS[G.cls].s[G.kit.s],KU=SPELLS[G.cls].u[G.kit.u];const ub=$('bUlt');ub.querySelector('svg').innerHTML=KU.icon;ub.setAttribute('aria-label',KU.n+', ultime');const nb=$('bNova');nb.querySelector('svg').innerHTML=KS.icon;nb.setAttribute('aria-label',KS.n);nb.style.color=C.col;
  $('hintTxt').innerHTML=C.hint;$('bossBar').hidden=true;
  petInit();lordInit();
}
function placeWell(w){const P=G.P;for(let k=0;k<200;k++){const x=rand(160,MAP-160),y=rand(160,MAP-160);if(Math.hypot(x-P.x,y-P.y)>(G.t?450:250)&&!blocked(x,y,50)&&(!G.wells||G.wells.every(o=>o===w||Math.hypot(o.x-x,o.y-y)>500))){w.x=x;w.y=y;w.on=true;return}}w.x=rand(200,MAP-200);w.y=rand(200,MAP-200);w.on=true}
function genMap(){
  const c=MAP/2,far=(x,y,list,d)=>list.every(p=>Math.hypot(p.x-x,p.y-y)>d);
  G.pillars=[];G.braziers=[];G.runes=[];
  for(let k=0;G.pillars.length<85&&k<2000;k++){const x=rand(120,MAP-120),y=rand(120,MAP-120);if(Math.hypot(x-c,y-c)>220&&far(x,y,G.pillars,150))G.pillars.push({x,y,r:rand(20,34)})}
  for(let k=0;G.braziers.length<45&&k<2000;k++){const x=rand(100,MAP-100),y=rand(100,MAP-100);if(far(x,y,G.pillars,60)&&far(x,y,G.braziers,260))G.braziers.push({x,y,ph:rand(0,6)})}
  for(let i=0;i<14;i++)G.runes.push({x:rand(250,MAP-250),y:rand(250,MAP-250),r:rand(80,140)});
  G.runes.push({x:c,y:c,r:120});
  G.wells=[];for(let i=0;i<6;i++){const w={r:30,on:true,cd:0};placeWell(w);G.wells.push(w)}
  G.sands=[];if(G.biome===2)genSands();
}
/* ---------- Nécropole des Sables (v136) ----------
   Sables mouvants : 9 mares qui ralentissent le héros (×0,6) et les monstres (×0,65 ; ni les scarabées ni les Gardiens).
   Tempête de sable : toutes les STORM_IV secondes environ, STORM_LEN secondes de vue réduite (décidée par l'hôte en coopération). */
const STORM_IV=FAST?16:90,STORM_LEN=FAST?6:15,SAND_C=['#d8b878','#c9a25e','#e6cf9a','#b8915a'];
function genSands(){const c=MAP/2;
  for(let k=0;G.sands.length<9&&k<800;k++){const r=rand(70,115),x=rand(160+r,MAP-160-r),y=rand(160+r,MAP-160-r);
    if(Math.hypot(x-c,y-c)<r+260)continue;
    if(G.pillars.some(p=>Math.hypot(p.x-x,p.y-y)<r+p.r+12)||G.braziers.some(b=>Math.hypot(b.x-x,b.y-y)<r+12)||G.wells.some(w=>Math.hypot(w.x-x,w.y-y)<r+w.r+30)||G.sands.some(q=>Math.hypot(q.x-x,q.y-y)<r+q.r+140))continue;
    G.sands.push({x,y,r,dir:Math.random()<.5?-1:1})}}
const inSand=o=>{const L=G.sands;if(!L||!L.length)return false;for(const q of L){const dx=o.x-q.x,dy=o.y-q.y;if(dx*dx+dy*dy<q.r*q.r)return true}return false};
// Force de la tempête (0 à 1), avec 2 s de montée et de descente.
const stormK=()=>!G||!(G.storm>0)?0:Math.max(0,Math.min(1,(STORM_LEN-G.storm)/2,G.storm/2));
function sandTick(dt){
  if(!NET.guest){if(G.storm>0){G.storm=Math.max(0,G.storm-dt);if(G.storm===0)G.stormIn=STORM_IV*rand(.85,1.15)}
    else{G.stormIn-=dt;if(G.stormIn<=0){G.stormIn=0;G.storm=STORM_LEN}}}
  const on=G.storm>0;if(on&&!G._stormOn){banner('Tempête de sable · on y voit moins loin','#e0b870',1,true);SND.play('wave')}G._stormOn=on;
  // sable porté par le vent (bien plus dense pendant la tempête)
  const k=stormK(),area=clamp(G.vw*G.vh/(620*1100),.5,3);let m=dt*(5+120*k)*area;
  while(m>0&&G.parts.length<420){if(m<1&&Math.random()>m)break;m--;
    G.parts.push({x:G.cam.x+rand(-G.vw/2-160,G.vw/2),y:G.cam.y+rand(-G.vh/2,G.vh/2),vx:rand(140,240)*(.5+k),vy:rand(-8,16),life:rand(1,1.8),max:1.8,col:pick(SAND_C),size:rand(.8,2)*(1+k*.6),w:1})}}
function farPoint(dmin){const P=G.P;for(let k=0;k<300;k++){const x=rand(160,MAP-160),y=rand(160,MAP-160);if(Math.hypot(x-P.x,y-P.y)>=dmin&&!blocked(x,y,60))return {x,y}}return {x:MAP-200,y:MAP-200}}
// Capture : après chaque capture, tant qu'on ne s'est pas extrait, une nouvelle cible apparaît (CAP_NEXT secondes plus tard).
// Chaque capture rapporte une relique de la difficulté et du Tourment, sans le plafond de niveau de mission des autres reliques
// (relicDrop(true)). Les autres sources de reliques ne changent pas.
const CAP_NEXT=5;
function spawnTarget(){
  const p=farPoint(900),{hs}=diff();
  G.target={id:++G.eid,type:'cible',x:p.x,y:p.y,r:18,hp:260*hs,max:260*hs,spd:175,dmg:0,col:'#a8874a',flash:0,hitCd:0,kx:0,ky:0,burnT:0,burnDps:0,burnAcc:0,
    state:'walk',slow:0,timer:0,blink:4,shown:0,wob:rand(0,6),downed:false};
  G.en.push(G.target);
}
function relicDrop(free){return ['os','an','sa','ab'][relicTierNow(free)]}
const LV_MAX=50;
const lootMul=L=>1+.06*(L-1);
const goldMul=L=>1+.15*(L-1);
/* Horloge de mission (v146) : la difficulté ne dépend que de l'avancée de la mission, comptée en manches (2 min en Survie et en Capture,
   3 vagues en Défense), en continu : plus de remise à zéro entre deux manches ni de saut au « Continuer ». À partir du niveau de départ,
   la vie des monstres prend CLOCK_HP par manche et leurs dégâts CLOCK_DM ; le nombre de monstres, leur cadence et les élites suivent
   le niveau effectif (départ + CLOCK_LV par manche) ; les types de monstres suivent toujours le niveau de manche, comme avant.
   G.level monte toujours au « Continuer » : or, butin, déblocage du niveau de départ.
   Mesuré au banc (copie d'essai, 29 octobre 2026) : vie moyenne d'une mission à 6 % près de celle de la v145, aux niveaux 10, 30 et 50. */
const CLOCK_HP=.15,CLOCK_DM=.10,CLOCK_LV=2;
const L0=()=>G.lv0||G.level;
function missionM(){if(G.mode==='defense')return Math.max(0,(G.wave||1)-1)/DEF_N;if(G.mode==='capture')return G.tl/LEVEL_T;return G.level-L0()+Math.min(1,G.tl/LEVEL_T)}
const missionLv=()=>L0()+CLOCK_LV*missionM();
function diff(){const L=L0(),m=missionM(),D=dif();return {hs:1.2*biome().hp*D.hp*(1+.75*(L-1))*Math.pow(1.025,L-1)*Math.pow(1+CLOCK_HP,m),ds:1.15*biome().dm*D.dm*(1+.35*(L-1))*Math.pow(1.012,L-1)*Math.pow(1+CLOCK_DM,m)}}
/* Gardiens (v146) : la vie moyenne de la v145 sur une mission type (6 min de Survie, 12 vagues de Défense), avec +10 % par Gardien
   déjà venu (BOSS_RISE) au lieu de +25 % : les premiers sont plus solides, les derniers moins démesurés. */
const BOSS_RISE=.10;
// Brèche : les Gardiens viennent par paires (spawnBosses), M les compte ainsi.
const bossMean=()=>{const c0=dif().cnt,c=G.breche?Math.max(2,c0+(c0%2)):c0;if(G.mode==='defense')return c*1.5+(c-1)/2;const N=(Math.floor((360-BOSS_T)/bossIv())+1)*c;return (N-1)/2};
const bossHpMul=()=>{const m=bossMean();return (1+.25*m)/(1+BOSS_RISE*m)*(1+BOSS_RISE*(G.bossN||0))*(dif().tier?BAL.tormBossHp:1)};
function spawnEnemy(s){
  const d=ETYPE[s.type],{hs,ds}=diff(),bm=s.type==='boss'?bossHpMul():1;
  const gn=s.type==='slime'?(s.gen||0):0,gr=[1,.66,.45][gn],gh=[1,.45,.2][gn],gs=[1,1.2,1.45][gn];
  const e={type:s.type,gen:gn,x:s.x,y:s.y,r:d.r*gr,hp:d.hp*hs*bm*gh,max:d.hp*hs*bm*gh,spd:d.spd*gs*rand(.92,1.08),dmg:d.dmg*ds,col:d.col,flash:0,hitCd:0,kx:0,ky:0,burnT:0,burnDps:0,burnAcc:0,
    state:'walk',slow:0,timer:rand(1,2.5),side:Math.random()<.5?-1:1,cycle:0,rot:0,sum:4,ang:0,shown:0,wob:rand(0,6)};
  if(s.type==='boss'){$('bossBar').hidden=false;G.bossN++}
  if(G.pod&&s.type!=='boss'&&Math.random()<.6)e.tgtPod=true;
  if(s.kx){e.kx=s.kx;e.ky=s.ky}if(s.tgtPod!=null)e.tgtPod=s.tgtPod;
  if((G.relic||(NET.host&&NET.peers.some(p=>p.relic)))&&!G.cracked&&s.type!=='boss'&&!s.split&&Math.random()<BAL.corrupt){e.corr=true;e.hp*=1.3;e.max*=1.3}
  // Momie relevée (v136) : garde la corruption de la première vie, se relève dans un nuage de sable.
  if(s.rise){if(s.corr){e.corr=true;e.hp*=1.3;e.max*=1.3}burst(s.x,s.y,16,'#d8c08a',150,3)}
  e.id=++G.eid;if(NET.host&&NET.on){const k=coopHp()*(G.breche?1.25:1);e.hp*=k;e.max*=k}
  G.en.push(e);
  if(s.fx)burst(s.x,s.y,10,'#9a6bc4',120);
}
function ringPos(extra=60){
  const P=G.P,R=Math.hypot(G.vw,G.vh)/2+extra;
  for(let k=0;k<14;k++){const a=rand(0,Math.PI*2),x=P.x+Math.cos(a)*R,y=P.y+Math.sin(a)*R;
    if(x>EDGE+30&&x<MAP-EDGE-30&&y>EDGE+30&&y<MAP-EDGE-30&&!blocked(x,y,26))return {x,y}}
  return {x:clamp(P.x+rand(-1,1)*R,EDGE+40,MAP-EDGE-40),y:clamp(P.y+rand(-1,1)*R,EDGE+40,MAP-EDGE-40)};
}
function chooseType(tt,L){const x=Math.random();
  if((tt>40||L>1)&&x>.92)return ['poison',1];
  if((tt>60||L>2)&&x>.86&&x<=.92)return ['pyro',1];
  if(tt>20&&x<.14)return G.biome===2?['scarab',ri(6,9)]:['bat',ri(5,8)];
  if((tt>50||L>1)&&x<.26)return ['brute',1];
  if((tt>30||L>1)&&x>=.5&&x<.58)return ['slime',ri(1,2)];
  if(tt>25&&x<.5)return ['archer',ri(1,2)];
  return G.biome===1&&x>.35?['givrin',ri(2,3)]:G.biome===2&&x>.35?['mummy',ri(1,2)]:['ghoul',ri(2,4)];}
const ELITE={rapide:{n:'Rapide',c:'#8fd3e0'},bouclier:{n:'Bouclier',c:'#c8d6e6'},vampire:{n:'Vampire',c:'#ff5a6a'},explosif:{n:'Explosif',c:'#ff8a3a'}};
function makeElite(e){const k=pick(Object.keys(ELITE));e.elite=k;e.hp*=4;e.max*=4;e.r*=1.25;e.dmg*=1.3;if(k==='rapide')e.spd*=1.55;if(e.corr){e.hp/=1.3;e.max/=1.3}e.corr=false;
  SND.play('elite');banner(`Élite ${ELITE[k].n} en approche`,ELITE[k].c,1)}
// Élites (v146) : chance de départ selon la difficulté, puis +1 point par niveau effectif gagné dans la mission (2 par manche), plafond 35 %.
const ELITE_LV=.01,ELITE_CAP=.35;
function spawnPack(type,n){const p=ringPos();let k=0,first=null;for(let i=0;i<n;i++){const q={x:clamp(p.x+rand(-40,40),EDGE+30,MAP-EDGE-30),y:clamp(p.y+rand(-40,40),EDGE+30,MAP-EDGE-30)};if(!blocked(q.x,q.y,14)){spawnEnemy({type,...q});if(!first)first=G.en[G.en.length-1];k++}}
  const pE=Math.min(ELITE_CAP,.025+.012*dsel().d+.01*dif().tier+ELITE_LV*(missionLv()-L0()));if(first&&type!=='bat'&&type!=='scarab'&&type!=='mummy'&&Math.random()<pE)makeElite(first);return k}
function defenseTick(dt){
  if(G.waveState==='break'){G.waveT-=dt;if(G.waveT<=0){G.wave++;G.waveState='fight';G.toSpawn=Math.min(160,Math.round((10+G.wave*4+(G.level-1)*10)*1.15));G.spawnT=.5;
      const bn=dif().cnt;SND.play('wave');if(G.wave%DEF_N===0)banner(`Vague ${G.wave} · ${bn>1?bn+' Gardiens arrivent':'un Gardien arrive'}`,'#b06ae0',2,true);
      if(G.wave%DEF_N===0)spawnBosses(true)}return}
  if(G.toSpawn>0){G.spawnT-=dt;if(G.spawnT<=0){G.spawnT=Math.max(.3,.9-G.wave*.03)/hordeK();const [type,n]=chooseType(G.wave*18,G.level);const k=spawnPack(type,Math.min(n,G.toSpawn));G.toSpawn-=Math.max(1,k)}}
  else if(!G.en.length&&!G.spawns.length){
    if(G.wave%DEF_N===0)roundDone();
    else{G.waveState='break';G.waveT=4;G.pod.hp=Math.min(G.pod.max,G.pod.hp+G.pod.max*.08);toast(`Vague ${G.wave} repoussée`)}
  }
}
function bossIv(){return dif().iv*(BOSS_T/60)*(((G&&G.mode)||meta.mode)==='capture'?1.5:1)}
function spawnBosses(quiet){let n=dif().cnt;if(G.breche)n=Math.max(2,n+(n%2));const k0=G.en.length;for(let i=0;i<n;i++){const p=ringPos(40);spawnEnemy({type:'boss',x:p.x,y:p.y})}
  if(G.breche){const nb=G.en.slice(k0).filter(e=>e.type==='boss');for(let i=0;i+1<nb.length;i+=2){nb[i].twin=nb[i+1].id;nb[i+1].twin=nb[i].id}}
  SND.play('boss');if(!quiet)banner(G.breche?'Gardiens jumeaux : abattez-les ensemble':n>1?`${n} Gardiens surgissent des ténèbres`:'Un Gardien surgit des ténèbres',G.breche?SEAL_C:'#b06ae0',2,true);G.shake=6+2*(n-1)}
// Brèche : un Gardien jumeau abattu revient (sans butin) si son jumeau n'est pas tombé dans les 8 s.
function twinDied(e){const o=G.en.find(x=>x.id===e.twin&&!x.dead);if(!o)return;G.twinQ.push({x:e.x,y:e.y,max:e.max,mate:o.id,t:8});banner(`<span style="color:${SEAL_C}">Son jumeau doit tomber en 8 s</span>, sinon il se relève`,SEAL_C,2,true)}
function twinTick(dt){if(!G.twinQ.length)return;for(const q of G.twinQ){const o=G.en.find(x=>x.id===q.mate&&!x.dead);if(!o){q.done=1;banner('Jumeaux abattus ensemble',SEAL_C,2,true);continue}
    q.t-=dt;if(q.t<=0){q.done=1;spawnEnemy({type:'boss',x:q.x,y:q.y});const b=G.en[G.en.length-1];if(b&&b.type==='boss'){b.max=q.max;b.hp=q.max*.5;b.noLoot=true;b.twin=o.id;o.twin=b.id}banner('Le jumeau se relève !',SEAL_C,2,true);$('bossBar').hidden=false}}
  G.twinQ=G.twinQ.filter(q=>!q.done)}
function spawner(dt){
  if(G.mode==='defense'){defenseTick(dt);return}
  const L=missionLv(); // v146 : niveau effectif de l'horloge (remplace le niveau et le bonus de manche)
  if(!lordOn())G.bossT-=dt; // v147 : en pause pendant le combat contre un Boss
  if(G.bossT<=0){G.bossT=bossIv();spawnBosses()}
  G.spawnT-=dt;if(G.spawnT>0)return;
  G.spawnT=Math.max(.14,(.85-.12*(L-1))*.87)/hordeK(); // v147 : hordes × hordeK() pendant le combat contre un Boss
  const target=Math.min(NET.host&&NET.on?coopCap():250,Math.round((22+14*(L-1))*1.15*(NET.host&&NET.on?coopCnt():1)*hordeK()));
  if(G.en.length>=target)return;
  const [type,n]=chooseType(G.t,G.level);spawnPack(type,n); // les types de monstres suivent toujours le niveau de manche (arrivée progressive en début de partie)
}

/* ---------- Sol (motif) ---------- */
function buildTile(bi){
  const B=BIOMES[bi==null?(G?G.biome:0):bi]||BIOMES[0],TL=B.tile;
  const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');
  g.fillStyle='#0a080c';g.fillRect(0,0,S,S);
  const TW=64,TH=32;
  for(let row=0;row<S/TH;row++)for(let col=-1;col<S/TW+1;col++){
    const x=col*TW+(row%2?TW/2:0),y=row*TH,l=12.5+Math.random()*4;g.fillStyle=`hsl(${TL.h} ${TL.s}% ${l-12.5+TL.l}%)`;g.fillRect(x+1.5,y+1.5,TW-3,TH-3)}
  g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=1.2;
  for(let i=0;i<14;i++){let x=rand(30,S-30),y=rand(30,S-30);g.beginPath();g.moveTo(x,y);for(let k=0;k<4;k++){x+=rand(-16,16);y+=rand(-16,16);g.lineTo(x,y)}g.stroke()}
  for(let i=0;i<4;i++){const x=rand(70,S-70),y=rand(70,S-70),r=rand(20,50),gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(${B.stain},.22)`);gr.addColorStop(1,`rgba(${B.stain},0)`);g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
  g.strokeStyle=`rgba(${B.chip},.16)`;g.lineWidth=3;g.lineCap='round';
  for(let i=0;i<4;i++){const x=rand(40,S-40),y=rand(40,S-40),a=rand(0,6);g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*16,y+Math.sin(a)*16);g.stroke()}
  if(B.dunes){g.lineCap='round';g.strokeStyle='rgba(235,205,150,.09)';g.lineWidth=2;
    for(let i=0;i<14;i++){const x=rand(30,S-170),y=rand(30,S-30),ph=rand(0,6);g.beginPath();g.moveTo(x,y);for(let k=1;k<=9;k++)g.lineTo(x+k*15,y+Math.sin(k*.8+ph)*4);g.stroke()}
    for(let i=0;i<10;i++){const x=rand(30,S-30),y=rand(30,S-30);g.fillStyle=`rgba(${B.chip},${rand(.08,.16).toFixed(2)})`;g.beginPath();g.ellipse(x,y,rand(2,4.5),rand(1.5,3),rand(0,3),0,7);g.fill()}}
  return c;
}

/* ---------- Effets ---------- */
function burst(x,y,n,col,sp=160,size=3){if(G.parts.length>450)return;for(let i=0;i<n;i++){const a=rand(0,6.28),v=rand(.3,1)*sp;G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.3,.7),max:.7,col,size:rand(1,size)})}}
function ftext(x,y,txt,col,size=16){if(G.texts.length<70)G.texts.push({x,y,txt,col,size,t:0})}
// En mission, seuls les messages marqués (alertes de Gardien, réseau) s'affichent.
const inMission=()=>typeof started!=='undefined'&&started&&typeof G!=='undefined'&&G&&!G.over;
function toast(html,keep){if(inMission()&&!keep)return;const d=document.createElement('div');d.innerHTML=html;$('toast').appendChild(d);setTimeout(()=>d.remove(),2400);while($('toast').children.length>3)$('toast').firstChild.remove()}

