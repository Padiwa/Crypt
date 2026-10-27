// Crypte des Cendres — game.js
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
  G.eq=curEq();G.wid=curWid();S=stats(G.eq);if(sealOn('gourde'))G.potions+=2;
  G.P={x:MAP/2,y:MAP/2,r:17,hp:S.hp,face:-Math.PI/2,fire:0,inv:1,flash:0,dashT:0,dashCd:0,novaCd:0,dx:0,dy:-1,spin:0,spinTick:0,swing:null,
    shield:0,noHit:0,psn:0,psnT:0,psnD:0,brnT:0,brnD:0,swings:0,critShots:0,dashHit:new Set()};
  if(heroCls==='magicien'&&hasTal('m_shield'))G.P.shield=S.hp*.25;
  G.cam={x:G.P.x,y:G.P.y};
  genMap();
  G.biome=clamp(meta.biome|0,0,BIOMES.length-1);if(floorPat&&floorPat.__b!==G.biome)floorPat=null;
  G.mode=meta.mode==='breche'?'survie':meta.mode;G.relic=null;G.react=0;G.cracked=false;G.ult=0;G.bossT=bossIv();G.pod=null;G.target=null;G.exitPt=null;G.capT=0;G.extT=0;G.capN=0;G.nextTgt=0;
  relicQFix();G.relQ=meta.relicQ.map(q=>({id:q.id,rad:!!q.rad}));G.relI=0;G.opened=[];G.shared=[];G.relic=G.relQ[0]||null;
  if(G.mode==='defense'){const m=1200*(1+.5*(L-1));G.pod={x:MAP/2,y:MAP/2,r:28,hp:m,max:m,flash:0};G.pillars.push(G.pod);G.P.y+=110;G.cam.y=G.P.y;G.wave=0;G.waveState='break';G.waveT=3;G.toSpawn=0}
  if(G.mode==='capture'){spawnTarget()}
  $('objBar').hidden=G.mode!=='defense';
  if(PX&&glLost())dropPixi('contexte WebGL perdu au lancement');
  if(PX)try{buildStatic()}catch(err){dropPixi(err)}
  const ub=$('bUlt');ub.querySelector('svg').innerHTML=C.uicon;ub.setAttribute('aria-label',C.ult+', ultime');const nb=$('bNova');nb.querySelector('svg').innerHTML=C.icon;nb.setAttribute('aria-label',C.skill);nb.style.color=C.col;
  $('hintTxt').innerHTML=C.hint;$('bossBar').hidden=true;
  petInit();
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
}
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
function diff(){const L=G.level,f=G.mode==='defense'?Math.max(0,((G.wave||1)-1)%5)/5:Math.min(1.5,G.tl/LEVEL_T);const D=dif();return {hs:1.2*biome().hp*D.hp*(1+.75*(L-1))*Math.pow(1.025,L-1)*(1+.35*f),ds:1.15*biome().dm*D.dm*(1+.35*(L-1))*Math.pow(1.012,L-1)*(1+.15*f)}}
function spawnEnemy(s){
  const d=ETYPE[s.type],{hs,ds}=diff(),bm=s.type==='boss'?(1+.25*G.bossN)*(dif().tier?BAL.tormBossHp:1):1;
  const gn=s.type==='slime'?(s.gen||0):0,gr=[1,.66,.45][gn],gh=[1,.45,.2][gn],gs=[1,1.2,1.45][gn];
  const e={type:s.type,gen:gn,x:s.x,y:s.y,r:d.r*gr,hp:d.hp*hs*bm*gh,max:d.hp*hs*bm*gh,spd:d.spd*gs*rand(.92,1.08),dmg:d.dmg*ds,col:d.col,flash:0,hitCd:0,kx:0,ky:0,burnT:0,burnDps:0,burnAcc:0,
    state:'walk',slow:0,timer:rand(1,2.5),side:Math.random()<.5?-1:1,cycle:0,rot:0,sum:4,ang:0,shown:0,wob:rand(0,6)};
  if(s.type==='boss'){$('bossBar').hidden=false;G.bossN++}
  if(G.pod&&s.type!=='boss'&&Math.random()<.6)e.tgtPod=true;
  if(s.kx){e.kx=s.kx;e.ky=s.ky}if(s.tgtPod!=null)e.tgtPod=s.tgtPod;
  if((G.relic||(NET.host&&NET.peers.some(p=>p.relic)))&&!G.cracked&&s.type!=='boss'&&!s.split&&Math.random()<BAL.corrupt){e.corr=true;e.hp*=1.3;e.max*=1.3}
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
  if(tt>20&&x<.14)return ['bat',ri(5,8)];
  if((tt>50||L>1)&&x<.26)return ['brute',1];
  if((tt>30||L>1)&&x>=.5&&x<.58)return ['slime',ri(1,2)];
  if(tt>25&&x<.5)return ['archer',ri(1,2)];
  return G.biome===1&&x>.35?['givrin',ri(2,3)]:['ghoul',ri(2,4)];}
const ELITE={rapide:{n:'Rapide',c:'#8fd3e0'},bouclier:{n:'Bouclier',c:'#c8d6e6'},vampire:{n:'Vampire',c:'#ff5a6a'},explosif:{n:'Explosif',c:'#ff8a3a'}};
function makeElite(e){const k=pick(Object.keys(ELITE));e.elite=k;e.hp*=4;e.max*=4;e.r*=1.25;e.dmg*=1.3;if(k==='rapide')e.spd*=1.55;e.corr=false;
  SND.play('elite');banner(`Élite ${ELITE[k].n} en approche`,ELITE[k].c,1)}
function spawnPack(type,n){const p=ringPos();let k=0,first=null;for(let i=0;i<n;i++){const q={x:clamp(p.x+rand(-40,40),EDGE+30,MAP-EDGE-30),y:clamp(p.y+rand(-40,40),EDGE+30,MAP-EDGE-30)};if(!blocked(q.x,q.y,14)){spawnEnemy({type,...q});if(!first)first=G.en[G.en.length-1];k++}}
  const pE=Math.min(.15,.025+.012*dsel().d+.01*dif().tier);if(first&&type!=='bat'&&Math.random()<pE)makeElite(first);return k}
function defenseTick(dt){
  if(G.waveState==='break'){G.waveT-=dt;if(G.waveT<=0){G.wave++;G.waveState='fight';G.toSpawn=Math.min(160,Math.round((10+G.wave*4+(G.level-1)*10)*1.15));G.spawnT=.5;
      const bn=dif().cnt;SND.play('wave');if(G.wave%DEF_N===0)banner(`Vague ${G.wave} · ${bn>1?bn+' Gardiens arrivent':'un Gardien arrive'}`,'#b06ae0',2,true);
      if(G.wave%DEF_N===0)spawnBosses(true)}return}
  if(G.toSpawn>0){G.spawnT-=dt;if(G.spawnT<=0){G.spawnT=Math.max(.3,.9-G.wave*.03);const [type,n]=chooseType(G.wave*18,G.level);const k=spawnPack(type,Math.min(n,G.toSpawn));G.toSpawn-=Math.max(1,k)}}
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
  const L=G.level,f=Math.min(1,G.tl/LEVEL_T);
  G.bossT-=dt;
  if(G.bossT<=0){G.bossT=bossIv();spawnBosses()}
  G.spawnT-=dt;if(G.spawnT>0)return;
  G.spawnT=Math.max(.14,(.85-.12*(L-1)-.4*f)*.87);
  const target=Math.min(NET.host&&NET.on?coopCap():250,Math.round((22+14*(L-1)+Math.floor(34*f))*1.15*(NET.host&&NET.on?coopCnt():1)));
  if(G.en.length>=target)return;
  const [type,n]=chooseType(G.t,L);spawnPack(type,n);
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
  return c;
}

/* ---------- Effets ---------- */
function burst(x,y,n,col,sp=160,size=3){if(G.parts.length>450)return;for(let i=0;i<n;i++){const a=rand(0,6.28),v=rand(.3,1)*sp;G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:rand(.3,.7),max:.7,col,size:rand(1,size)})}}
function ftext(x,y,txt,col,size=16){if(G.texts.length<70)G.texts.push({x,y,txt,col,size,t:0})}
// En mission, seuls les messages marqués (alertes de Gardien, réseau) s'affichent.
const inMission=()=>typeof started!=='undefined'&&started&&typeof G!=='undefined'&&G&&!G.over;
function toast(html,keep){if(inMission()&&!keep)return;const d=document.createElement('div');d.innerHTML=html;$('toast').appendChild(d);setTimeout(()=>d.remove(),2400);while($('toast').children.length>3)$('toast').firstChild.remove()}

/* ---------- Combat ---------- */
const CS_N=8,CS_W=5;
const CB_TXT={archer:'projectiles +50 % plus rapides, +1 transpercement',magicien:'+50 % de rayon d\'explosion',guerrier:'+30 % de portée de frappe, +25 % de vitesse d\'attaque'};
function critTick(){const P=G.P;if(!P||G.over)return;G.crits=(G.crits||[]).filter(t=>t>G.t-CS_W);
  if(P.cbT>0)return;G.crits.push(G.t);
  if(G.crits.length>=CS_N&&G.t>=(P.cbCd||0)){P.cbT=5*(1+(S.skillDur||0)/100);G.crits=[];P.cbCd=G.t+P.cbT+3;refreshStats();
    G.rings.push({x:P.x,y:P.y,t:0,max:120,col:'255,211,77'});burst(P.x,P.y,24,'#ffd34d',200,3);G.hshake=Math.max(G.hshake||0,3);
    SND.play('frenzy');banner(`Frénésie critique · <span style="font-weight:500">${CB_TXT[G.cls]}</span>`,'#ffd34d',1)}}
function dmgEnemy(e,d,crit,dot){
  if(e.downed)return; // Capture : la cible à terre n'est plus touchée
  if(!dot&&S.lowDmg&&G.P.hp<S.hp*.5)d*=1+S.lowDmg/100;
  if(!dot&&S.execute&&e.hp<e.max*.3)d*=1+S.execute/100;
  if(S.bossDmg&&e.type==='boss')d*=1+S.bossDmg/100;
  if(e.elite==='bouclier'&&e.hp>e.max*.5)d*=.5;
  if(S.cold&&(e.slow>0||e.frz>0))d*=1+S.cold/100;
  if(S.abHunt&&(e.type==='boss'||e.elite))d*=1+S.abHunt/100;
  if(S.abSoul&&G.P.soulN)d*=1+G.P.soulN*S.abSoul/100;
  if(NET.guest){if(dot)return;if(S.abExec&&e.type!=='boss'&&e.hp-d<e.max*S.abExec/100)d=Math.max(d,e.hp);
    netHit(e,d,crit);e.hp=Math.max(1,e.hp-d);e.shown=2;if(crit)critTick();hitFx(e,d,crit);
    if(crit)riftTry(e,d);return}
  e.hp-=d;e.shown=2;
  if(S.abExec&&e.hp>0&&e.type!=='boss'&&e.type!=='cible'&&e.hp<e.max*S.abExec/100){e.hp=0;ftext(e.x,e.y-e.r-6,'jugé','#b07cff',14);burst(e.x,e.y,10,'#b07cff',140,3)}
  if(!dot&&crit)riftTry(e,d);
  if(!dot&&crit)critTick();
  if(!dot)hitFx(e,d,crit);
  else if(SET.dmgNum&&Math.random()<.25)ftext(e.x,e.y-e.r,Math.round(d),'#ff9a4a',12);
  if(e.type==='cible'){if(e.hp<=0){e.hp=0;if(!e.downed){e.downed=true;burst(e.x,e.y,20,'#f0cf4a',160);toast('<b style="color:var(--r2)">La cible est à terre.</b> Reste près d\'elle pour la capturer.')}}}
  else if(e.hp<=0&&!e.dead)kill(e);
}
function podHurt(d){const p=G.pod;if(!p||G.over||GOD||NET.guest)return;d*=.6;p.hp-=d;p.flash=1;if(p.hp<=0){p.hp=0;gameOver('pod')}}
const itemLvl=()=>1+(G.level-1)*4+Math.floor(G.tl/45);
function wishBest(k){let b=null;const eq=(G&&G.eq)||curEq();for(const x of Object.values(eq))if(x&&x.aff&&x.aff[k]!=null){const v=NOSCALE[k]?x.aff[k]:x.aff[k]*upMul(x.up);if(b==null||v>b)b=v}return b}
function wishMatch(it){const W=meta.wish||{},hit=Object.keys(it.aff).filter(k=>{if(!(W.aff&&W.aff[k]))return false;const cur=wishBest(k),v=NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up);return cur==null||v>cur+1e-9});
  if(hit.length)return {aff:hit};if(it.r>=3&&W.leg)return {leg:1};return null}
let lfT=0;
function lootFlash(w,it){const now=performance.now(),el=$('lootFlash');
  if(now-lfT>350){lfT=now;SND.play(w.leg?'leg':'wish');vibe([30,40,30]);if(SET.flash){el.className='';void el.offsetWidth;el.className='on'+(w.leg?' leg':'')}}
}
function shatter(e){G.rings.push({x:e.x,y:e.y,t:0,max:95,col:'170,225,255'});burst(e.x,e.y,14,'#cfefff',180,3);SND.play('crit');G._sh=(G._sh||0)+1;
  if(G._sh<4)for(const o of G.en){if(!o.dead&&o!==e&&Math.abs(o.x-e.x)<120&&Math.hypot(o.x-e.x,o.y-e.y)<85+o.r){slowE(o,1.5);dmgEnemy(o,S.dmg*1.5,false)}}G._sh--}
function kill(e){
  e.dead=true;G.kills++;
  if(NET.host)netSend({t:'kill',id:e.id,type:e.type,x:e.x|0,y:e.y|0,elite:e.elite||0,corr:e.corr?1:0,gen:e.gen||0,nl:e.noLoot?1:0});
  if(S.abSoul){G.P.soulN=Math.min(10,(G.P.soulN||0)+1);G.P.soulT=5}
  if(S.abWard)G.P.shield=Math.max(G.P.shield||0,Math.min(S.hp*.3,(G.P.shield||0)+S.abWard));
  if(S.shard&&Math.random()*100<S.shard)shatter(e);
  if(e.type==='slime'&&e.gen<2&&!NET.guest){burst(e.x,e.y,14,'#7fe0c8',150,3);
    for(const sd of[-1,1]){const a=rand(0,Math.PI*2)*0+Math.atan2(e.y-G.P.y,e.x-G.P.x)+sd*Math.PI/2+rand(-.4,.4);
      G.spawns.push({type:'slime',gen:e.gen+1,split:1,tgtPod:e.tgtPod,x:clamp(e.x+Math.cos(a)*e.r*.6,EDGE+30,MAP-EDGE-30),y:clamp(e.y+Math.sin(a)*e.r*.6,EDGE+30,MAP-EDGE-30),kx:Math.cos(a)*260,ky:Math.sin(a)*260,t:.12})}}
  if(e.twin&&!NET.guest)twinDied(e);
  const boss=e.type==='boss'&&!e.noLoot,L=G.level,DL=dif().loot,dl=1+DL*.5,lm=lootMul(L)*(1+(S.lootPct||0)/100)*(1+DL*.15)*biome().loot*(teamHas('fort')?1.1:1)*(1+petLootPct()/100),st=1+stayBonus();
  G.ult=Math.min(ultNeed(),(G.ult||0)+(boss?10:1)*(teamHas('cri')?1.2:1));
  burst(e.x,e.y,boss?60:10,e.col,boss?320:150,4);burst(e.x,e.y,boss?20:4,'#e8853b',120);
  const push=(o,s=20)=>{const d=Object.assign({x:e.x+rand(-s,s),y:e.y+rand(-s,s),t:rand(0,6),age:0,mt:0},o);G.drops.push(d);if(o.kind==='item'){const w=wishMatch(o.item);if(w){d.wish=1;lootFlash(w,o.item)}}else if(o.kind==='part'&&o.part.full&&meta.wish&&meta.wish.leg&&!ownedW(o.part.w)){d.wish=1;lootFlash({leg:1},null)}};
  sealLoot(e,push);
  if(boss){
    push({kind:'item',item:genItem(itemLvl(),2)},40);push({kind:'item',item:genItem(itemLvl(),1)},40);push({kind:'relic',id:relicDrop()},40);push({kind:'potion'},40);
    for(let i=0;i<Math.floor((L-1)/10);i++)push({kind:'item',item:genItem(itemLvl(),1)},50);
    if(BAL.bossRelicEvery)for(let i=0;i<Math.floor((L-1)/BAL.bossRelicEvery);i++)push({kind:'relic',id:relicDrop()},50);
    if(Math.random()<Math.min(1,.15*lm*st))push({kind:'part',part:rollPart()},40);
    if(Math.random()<hfChance())push({kind:'part',part:{hf:1}},40);
    for(let i=0;i<2;i++)push({kind:'mod',id:rollMod(true)},40);
    meta.essence+=25;saveMeta();G.shake=14;SND.play('bossdie');banner('Gardien vaincu · son butin est à toi','#e8853b',2);
    if(!G.en.some(o=>o.type==='boss'&&!o.dead))$('bossBar').hidden=true;
  }else{
    const t=e.type;
    if(Math.random()<({ghoul:.006,bat:.002,archer:.008,poison:.008,pyro:.008,brute:.035,slime:.0035,givrin:.007})[t]*lm*st)push({kind:'item',item:genItem(itemLvl())});
    if(Math.random()<({ghoul:.003,bat:.001,archer:.004,poison:.004,pyro:.004,brute:.025,slime:.0018,givrin:.0035})[t]*BAL.relicMob*(1+tormBoost().relic)*st)push({kind:'relic',id:relicDrop()});
    if(L>1&&Math.random()<({ghoul:.0015,bat:.0005,archer:.002,poison:.002,pyro:.002,brute:.012,slime:.0009,givrin:.0018})[t]*(lm-1)*st)push({kind:'part',part:rollPart()});
    if(e.corr)push({kind:'react'},6);
    if(Math.random()<({ghoul:.006,bat:.002,archer:.008,poison:.008,pyro:.008,brute:.06,slime:.004,givrin:.007})[t]*st)push({kind:'mod',id:rollMod(false)});
    if(Math.random()<(t==='brute'?.05:.005))push({kind:'potion'});
  }
  if(e.elite){push({kind:'item',item:genItem(itemLvl(),1)},30);if(Math.random()<.4*st)push({kind:'item',item:genItem(itemLvl(),1)},30);if(Math.random()<BAL.relicElite*(1+tormBoost().relic)*st)push({kind:'relic',id:relicDrop()},30);
    if(e.elite==='explosif'&&!NET.guest)G.lobs.push({x0:e.x,y0:e.y,tx:e.x,ty:e.y,t:0,T:.7,kind:'pyro',r:95,dps:2*diff().ds});
    burst(e.x,e.y,30,ELITE[e.elite].c,240,4);SND.play('bossdie');toast(`<b style="color:${ELITE[e.elite].c}">Élite ${ELITE[e.elite].n} vaincue</b>`)}
  const gv=({ghoul:1,bat:.6,archer:1.5,poison:1.5,pyro:1.5,brute:5,boss:50,slime:.8,givrin:1.2})[e.type]*goldMul(L)*dl*(e.elite?5:1),n=boss?8:e.elite?5:(Math.random()<Math.min(1,(e.type==='bat'?.35:.65)*(1+.05*(L-1)))?1:0);
  for(let i=0;i<n;i++)push({kind:'gold',amt:Math.max(1,Math.round(gv/(boss?8:1)*rand(.7,1.3)))},boss?45:15);
  const xv=({ghoul:1,bat:1,archer:2,poison:2,pyro:2,brute:5,boss:30,slime:1,givrin:1})[e.type]*(e.elite?6:1);
  if(G.nxp>220){for(let k=0;k<12;k++){const o=G.drops[Math.floor(Math.random()*G.drops.length)];if(o&&o.kind==='xp'){o.v+=xv;break}}}
  else{push({kind:'xp',v:xv},6);G.nxp++}
  if(G.cls==='guerrier'&&hasTal('g_blood'))heal(S.hp*.02);
}
function dotHurt(d){if(GOD||G.over||d<=0||G.P.down)return;const P=G.P;d*=1-S.armor/200;P.hp-=d;P.noHit=0;if(P.hp<=0){P.hp=0;NET.on?heroDown():gameOver()}}
function hurt(d){
  const P=G.P;if(P.inv>0||P.dashT>0||GOD||P.down)return;
  d*=1-S.armor/100;if(P.hp<S.hp*.3)d*=1-S.lowArmor/100;if(P.spin>0)d*=.5;P.noHit=0;
  if(P.shield>0){const ab=Math.min(P.shield,d);P.shield-=ab;d-=ab;if(d<=0){P.inv=.35;ftext(P.x,P.y-P.r,'bloqué','#9fd0ff',13);return}}
  P.hp-=d;P.flash=1;P.inv=.35;SND.play('hurt');vibe(d/S.hp>.15?60:25);G.hshake=Math.max(G.hshake||0,Math.min(12,4+d/S.hp*45));
  ftext(P.x,P.y-P.r,'-'+Math.round(d),'#ff5a5a',16);
  if(P.hp<=0){P.hp=0;NET.on?heroDown():gameOver()}
}
function heal(v){G.P.hp=Math.min(S.hp,G.P.hp+v)}
// Durée d'un ralentissement : allongée par la durée des compétences (affixe, Persistance, Prolongation) ; un ralentissement plus long en cours est gardé.
const slowT=t=>t*(1+(S.skillDur||0)/100),slowE=(e,t)=>{e.slow=Math.max(e.slow||0,slowT(t))};
function onHit(e,d){if(S.frz&&e.type!=='boss'&&Math.random()*100<S.frz){e.frz=1;slowE(e,1.5)}if(S.chill&&Math.random()*100<S.chill)slowE(e,2);if(S.shock&&Math.random()*100<S.shock)chain(e,d*.6)}
function gainMod(id){
  const m=MODS[id],c=MOD_RAR[m.r].c;
  if(meta.mods[id]==null){
    meta.mods[id]=0;let msg=`Nouveau mod : <span style="color:${c}">${m.n}</span>`;
    const kd=modKind(id);
    if(kd==='a'){if(!meta.aura[heroCls]){meta.aura[heroCls]=id;refreshStats();msg+=' · aura équipée'}}
    else if(modOk(id,heroCls)){const b=build(kd),bs=bBest(b,id,0);if(bs.i>=0&&bUsed(b)+bs.d<=bCap(b)){b.load[bs.i]=id;refreshStats();msg+=kd==='w'?' · équipé sur l\'arme':' · équipé sur le héros'}}
  }else if(modCanStar(id)&&modSt(id)<MOD_ST_MAX){meta.modCp[id]=(meta.modCp[id]|0)+1}
  else{const e=8*(m.r+1);meta.essence+=e}
  saveMeta();
}
function chain(src,d){
  const t=G.en.filter(o=>o!==src&&!o.dead&&!o.downed).map(o=>[o,Math.hypot(o.x-src.x,o.y-src.y)]).filter(a=>a[1]<240).sort((a,b)=>a[1]-b[1]).slice(0,3);
  let px=src.x,py=src.y;for(const [o] of t){G.zaps.push({x1:px,y1:py,x2:o.x,y2:o.y,t:0});px=o.x;py=o.y;dmgEnemy(o,d,false)}
}
function explode(s,primary,frost){
  const R=(frost?85*(1+S.skillRad/100):55)*(1+S.splash/100);
  G.rings.push({x:s.x,y:s.y,t:.22,max:R,col:'140,190,255'});burst(s.x,s.y,8,'#9fc8ff',140,3);
  for(const e of G.en){if(e===primary||e.dead)continue;if(Math.abs(e.x-s.x)<R+e.r&&Math.hypot(e.x-s.x,e.y-s.y)<R+e.r){if(frost)slowE(e,2.5);dmgEnemy(e,s.d*(frost?1:.6),false);if(S.burn){e.burnT=2.5;e.burnDps=S.burn}}}
}
function fireE(e,a,sp,d,r=7){G.eb.push({id:++G.bid,x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,d,r,life:4})}
function ring(e,n,sp){e.rot+=.27;for(let i=0;i<n;i++)fireE(e,e.rot+i/n*Math.PI*2,sp,e.dmg*.55,8)}
// Retour d'un coup sur un monstre : son, éclat blanc, chiffre de dégâts (critique en doré).
const hitFx=(e,d,crit)=>{SND.play(crit?'crit':'hit');e.flash=1;if(SET.dmgNum&&(crit||G.en.length<60))ftext(e.x+rand(-8,8),e.y-e.r,Math.round(d)+(crit?'!':''),crit?'#ffd34d':'#f1e8d6',crit?20:15)};
// Faille (abyssal) : un critique peut lancer des éclairs en chaîne (70 % des dégâts) ; pas de chaîne depuis une chaîne.
const riftTry=(e,d)=>{if(S.abRift&&!G._rift&&Math.random()*100<S.abRift){G._rift=1;chain(e,d*.7);G._rift=0}};
// Coup qui peut être critique : les dégâts critiques s'appliquent (Pluie d'acier, météores).
const critHit=(e,d)=>{const c=Math.random()*100<S.crit;dmgEnemy(e,c?d*S.critDmg/100:d,c)};
// Récompense de capture (chaque joueur reçoit la sienne).
function capReward(){objDone();const r=relicDrop(true);G.loot.relics.push(r);G.fresh++;G.gold+=60*G.level;
  toast(`<b style="color:var(--r2)">Cible capturée.</b> ${relicName(r)} et ${60*G.level} or. Rejoins l'extraction, ou traque la cible suivante.`)}
// Ligne de tir dégagée entre un monstre et sa cible (5 points testés sur le trajet).
const losClear=(e,dx,dy)=>{for(let k=1;k<6;k++)if(blocked(e.x+dx*k/6,e.y+dy*k/6,4))return false;return true};
function blocked(x,y,r){
  if(x<EDGE+r||x>MAP-EDGE-r||y<EDGE+r||y>MAP-EDGE-r)return true;
  for(const p of G.pillars){if(p===G.pod)continue;const m=p.r+r;if(Math.abs(p.x-x)<m&&Math.abs(p.y-y)<m&&Math.hypot(p.x-x,p.y-y)<m)return true}
  return false;
}
function resolve(o){
  let hit=false;const lo=EDGE+o.r,hi=MAP-EDGE-o.r;
  if(o.x<lo){o.x=lo;hit=true} if(o.x>hi){o.x=hi;hit=true} if(o.y<lo){o.y=lo;hit=true} if(o.y>hi){o.y=hi;hit=true}
  for(const p of G.pillars){const m=p.r+o.r;if(Math.abs(o.x-p.x)>m||Math.abs(o.y-p.y)>m)continue;const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy)||1;if(d<m){o.x=p.x+dx/d*m;o.y=p.y+dy/d*m;hit=true}}
  return hit;
}

/* ---------- Entrées ---------- */
const keys={};
const joy={id:null,ox:0,oy:0,x:0,y:0,vx:0,vy:0};
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();keys[k]=true;
  if(!started||G.over||!$('extract').hidden)return;
  if(!$('lvlup').hidden){if(['1','2','3'].includes(k)){const b=$('choices').children[+k-1];if(b)b.click()}return}
  if(k==='i'||k==='tab'||k==='escape'){e.preventDefault();$('bag').hidden?openBag():closeBag();return}
  if(paused)return;
  if(k===' '){e.preventDefault();doDash()} else if(k==='e')doNova(); else if(k==='r')doPotion(); else if(k==='f')doUlt();
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
// Souris (ordinateur) : le héros va vers le pointeur ; clic gauche maintenu = il reste immobile. « Joystick » garde l'ancien glisser.
const mouse={x:0,y:0,in:false,down:false};
const mouseMode=()=>(typeof SET!=='undefined'&&SET.mouse==='joy')?'joy':'follow';
cv.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.in=true});
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){mouse.in=false;mouse.down=false}});
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&mouseMode()!=='joy'){mouse.down=true;mouse.btn=e.button;mouse.x=e.clientX;mouse.y=e.clientY;mouse.in=true}},true);
addEventListener('pointerup',e=>{if(e.pointerType==='mouse')mouse.down=false});
function mouseVec(){const mm=mouseMode();if(mm==='joy'||!mouse.in||!G||!G.P)return null;if(mouse.down&&(mouse.btn|0)===0)return {x:0,y:0};
  const z=zoom(),hx=(G.P.x-G.cam.x)*z+innerWidth/2,hy=(G.P.y-G.cam.y)*z+innerHeight/2,dx=mouse.x-hx,dy=mouse.y-hy,d=Math.hypot(dx,dy),DZ=26;
  if(d<=DZ)return {x:0,y:0};const m=Math.min(1,(d-DZ)/90);return {x:dx/d*m,y:dy/d*m}}
cv.addEventListener('pointerdown',e=>{if(joy.id!==null||paused)return;if(e.pointerType==='mouse'&&mouseMode()!=='joy')return;joy.id=e.pointerId;joy.ox=joy.x=e.clientX;joy.oy=joy.y=e.clientY;joy.vx=joy.vy=0;try{cv.setPointerCapture(e.pointerId)}catch{}});
cv.addEventListener('pointermove',e=>{
  if(e.pointerId!==joy.id)return;const M=56;let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy,d=Math.hypot(dx,dy);
  if(d>M){joy.ox+=dx/d*(d-M);joy.oy+=dy/d*(d-M);dx=e.clientX-joy.ox;dy=e.clientY-joy.oy;d=M}
  joy.x=e.clientX;joy.y=e.clientY;joy.vx=dx/M;joy.vy=dy/M;
});
const endJoy=e=>{if(e.pointerId===joy.id){joy.id=null;joy.vx=joy.vy=0}};
cv.addEventListener('pointerup',endJoy);cv.addEventListener('pointercancel',endJoy);
const tap=(id,fn)=>$(id).addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(started&&!paused&&!G.over)fn()});
tap('bDash',doDash);tap('bNova',doNova);tap('bPot',doPotion);tap('bUlt',doUlt);
['bDash','bNova','bPot','bUlt'].forEach(id=>$(id).addEventListener('click',e=>e.preventDefault()));
const resetJoy=()=>{joy.id=null;joy.vx=joy.vy=0;mouse.down=false;for(const k in keys)keys[k]=false};

function inputVec(){
  let x=joy.vx,y=joy.vy;{const mv=mouseVec();if(mv&&joy.id===null){x+=mv.x;y+=mv.y}}
  if(keys.q||keys.a||keys.arrowleft)x-=1; if(keys.d||keys.arrowright)x+=1;
  if(keys.z||keys.w||keys.arrowup)y-=1; if(keys.s||keys.arrowdown)y+=1;
  const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
  return {x,y,m:Math.min(m,1)};
}
const dashCdMax=()=>3*(1-S.cdr/100)*(1-S.dashCd/100);
function doDash(){const P=G.P;if(P.down)return;if(P.dashCd>0){if(!(sealOn('esq')&&P.dash2))return;P.dash2=0}else if(sealOn('esq'))P.dash2=1;if(sealOn('ombre'))P.critNext=1;SND.play('dash');P.dashT=.2;P.dashCd=dashCdMax();burst(P.x,P.y,10,'#9fc2b8',120);
  P.dashHit=new Set();
  if(G.cls==='archer'&&hasTal('a_shadow'))P.critShots=3;
  if(G.cls==='magicien'&&hasTal('m_blink'))explode({x:P.x,y:P.y,d:S.dmg*1.6},null,true)}
function doNova(){
  const P=G.P;if(P.down)return;if(P.novaCd>0)return;P.novaCd=CLS[G.cls].cd*(1-S.cdr/100)*(sealOn('sablier')?.8:1)*(teamHas('vif')?.85:1);if(sealOn('soin'))netFx('sk',P.x,P.y,Math.max(200,175*(1+S.skillRad/100)));G.hshake=Math.max(G.hshake||0,3.5);SND.play('skill_'+G.cls);
  if(G.cls==='guerrier'){P.spin=1.6*(1+S.skillDur/100);P.spinTick=0;return}
  if(G.cls==='archer'){
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;G.shots.push({kind:'bolt',x:P.x,y:P.y,vx:Math.cos(a)*640,vy:Math.sin(a)*640,a,d:S.nova*.35,crit:false,pierce:S.pierce+2,hit:new Set(),life:1.2*(1+S.skillRad/100)})}
    G.rings.push({x:P.x,y:P.y,t:.15,max:80,col:'255,200,120'});return;
  }
  G.rings.push({x:P.x,y:P.y,t:0,max:175*(1+S.skillRad/100),col:'150,210,255'});G.shake=Math.max(G.shake,5);
  for(const e of G.en){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<175*(1+S.skillRad/100)+e.r){const crit=Math.random()*100<S.crit;slowE(e,2.5);dmgEnemy(e,S.nova*(crit?S.critDmg/100:1),crit);const k=e.type==='boss'?80:420;e.kx+=dx/(d||1)*k;e.ky+=dy/(d||1)*k}}
  G.eb=G.eb.filter(b=>Math.hypot(b.x-P.x,b.y-P.y)>175*(1+S.skillRad/100));
}
const ultNeed=()=>Math.max(10,Math.round(ULT_N*(1-((S&&S.fury)||0)/100)));
function doUlt(){
  const P=G.P,need=ultNeed();if(P.down)return;if((G.ult||0)<need)return;G.ult=0;const m=1+(S.ultPct||0)/100,RR=1+S.skillRad/100;G.shake=Math.max(G.shake,12);G.hshake=Math.max(G.hshake||0,G.cls==='guerrier'?11:7);SND.play('ult');
  if(G.cls==='guerrier'){const r=320*RR;P.inv=3;G.rings.push({x:P.x,y:P.y,t:0,max:r,col:'255,190,110'});G.rings.push({x:P.x,y:P.y,t:.12,max:r*.6,col:'255,110,60'});burst(P.x,P.y,50,'#ffb070',320,4);
    for(const e of G.en){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<r+e.r){const k=e.type==='boss'?120:700;e.kx+=dx/(d||1)*k;e.ky+=dy/(d||1)*k;slowE(e,2);dmgEnemy(e,S.nova*3*m,false)}}
    toast('<b style="color:#ffd45a">Colère du Titan</b> : invulnérable pendant 3 s.');return}
  if(G.cls==='archer'){P.rain=3;P.rainT=0;toast('<b style="color:#ffd45a">Pluie d\'acier</b>');return}
  P.meteors=3;P.meteorT=0;toast('<b style="color:#ffd45a">Pluie de météores</b>');
}
function ultTick(dt){const P=G.P;
  if(P.rain>0){P.rain-=dt;P.rainT-=dt;if(P.rainT<=0){P.rainT=.12;const R=450*(1+S.skillRad/100),m=1+(S.ultPct||0)/100,c=[];
      for(const e of G.en)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<R)c.push(e);
      for(let i=0;i<4&&c.length;i++){const e=c.splice(Math.floor(Math.random()*c.length),1)[0];G.rings.push({x:e.x,y:e.y,t:.2,max:30,col:'255,212,90'});G.hshake=Math.max(G.hshake||0,1.5);SND.play('rain');burst(e.x,e.y,6,'#ffd45a',160,2);critHit(e,S.nova*.7*m)}}}
  if(P.meteors>0){P.meteorT-=dt;if(P.meteorT<=0){P.meteors--;P.meteorT=.35;const m=1+(S.ultPct||0)/100,R=150*(1+S.skillRad/100),c=G.en.filter(e=>!e.dead&&!e.downed&&Math.hypot(e.x-P.x,e.y-P.y)<520);
      const tg=c.find(e=>e.type==='boss')||c[Math.floor(Math.random()*c.length)],x=tg?tg.x:P.x+rand(-150,150),y=tg?tg.y:P.y+rand(-150,150);
      G.rings.push({x,y,t:0,max:R,col:'255,140,60'});G.rings.push({x,y,t:.15,max:R*.5,col:'255,220,140'});burst(x,y,40,'#ff8a3a',300,4);G.shake=Math.max(G.shake,10);G.hshake=Math.max(G.hshake||0,6);SND.play('boom');
      for(const e of G.en){if(!e.dead&&Math.hypot(e.x-x,e.y-y)<R+e.r)critHit(e,S.nova*3*m)}}}
}
function doPotion(){
  const P=G.P;if(P.down)return;if(G.potions<=0||P.hp>=S.hp)return;G.potions--;SND.play('potion');if(sealOn('alch'))netFx('pot',P.x,P.y,SEAL_R);const h=S.hp*.45*(1+S.potHeal/100)*(P.psnT>0?.5:1);P.hp=Math.min(S.hp,P.hp+h);
  ftext(P.x,P.y-P.r-6,'+'+Math.round(h),'#5fbf7a',18);burst(P.x,P.y,16,'#5fbf7a',110);
}

/* ---------- Grille spatiale ---------- */
const CELL=64,GW=Math.ceil(MAP/CELL);let gHead=new Int32Array(GW*GW),gNext=new Int32Array(512);
function gridBuild(){gHead.fill(-1);const L=G.en;if(gNext.length<L.length)gNext=new Int32Array(L.length*2);
  for(let i=0;i<L.length;i++){const e=L[i];if(e.downed)continue;const cx=clamp(e.x/CELL|0,0,GW-1),cy=clamp(e.y/CELL|0,0,GW-1),c=cy*GW+cx;gNext[i]=gHead[c];gHead[c]=i}}
function gridEach(x,y,r,fn){const x0=clamp((x-r)/CELL|0,0,GW-1),x1=clamp((x+r)/CELL|0,0,GW-1),y0=clamp((y-r)/CELL|0,0,GW-1),y1=clamp((y+r)/CELL|0,0,GW-1);
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)for(let i=gHead[cy*GW+cx];i>=0;i=gNext[i]){const e=G.en[i];if(e&&fn(e,i)===false)return}}
function compact(arr,alive){let j=0;for(let i=0;i<arr.length;i++){const o=arr[i];if(alive(o))arr[j++]=o}arr.length=j}
/* ---------- Mise à jour ---------- */
function update(dt){
  if(NET.guest)netApplySnap();
  G.t+=dt;G.tl+=dt;
  // Tourment : toutes les 2 minutes de séjour, le bonus des reliques grandit (annoncé tant qu'il augmente)
  {const s=sejN();if(s>(G.sejSeen|0)){G.sejSeen=s;const b=tormBoost();if(b.t&&G.relQ.length&&(s*(BAL.sejReact||0)<=(BAL.sejReactMax||0)+1e-9||s*(BAL.sejRelic||0)<=(BAL.sejRelicMax||0)+1e-9))toast(`<b style="color:#ff6a3a">Séjour prolongé.</b> ${reactNeed()} réactifs par relique, reliques +${Math.round(b.relic*100)} %.`,true)}}
  // Séjour après l'objectif : chaque minute, le butin des monstres grandit (annoncé jusqu'au plafond)
  {const m=stayMin();if(m>(G.staySeen|0)){G.staySeen=m;const b=stayBonus();if(b>0&&m*(BAL.stayLoot||0)<=(BAL.stayLootMax||0)+1e-9)toast(`<b style="color:#f0cf4a">Butin des monstres +${Math.round(b*100)} %</b> : tu restes après l'objectif${b>=(BAL.stayLootMax||0)-1e-9?' (c\'est le maximum)':''}.`,true)}}
  if(!NET.guest&&G.mode==='survie'&&G.tl>=LEVEL_T){G.tl=LEVEL_T;roundDone();return}
  if(G.pod)G.pod.flash=Math.max(0,G.pod.flash-dt*6);
  const P=G.P;
  if(!NET.guest){for(const s of G.spawns)s.t-=dt;
  for(const s of G.spawns.filter(s=>s.t<=0))spawnEnemy({...s,fx:!s.split});
  G.spawns=G.spawns.filter(s=>s.t>0);
  spawner(dt);twinTick(dt)}
  if(NET.on&&G.mates&&G.mates.length)matesSmooth(dt);
  petTick(dt);
  if(G.oshots){for(const s of G.oshots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt}G.oshots=G.oshots.filter(s=>s.life>0)}
  // joueur
  const iv=inputVec(), moving=iv.m>.15;
  P.inv-=dt;P.flash=Math.max(0,P.flash-dt*5);P.dashCd-=dt;P.novaCd-=dt;P.fire-=dt;ultTick(dt);
  if(P.down)heroDownTick(dt);if(NET.on&&!$('lvlup').hidden)P.inv=Math.max(P.inv,.3);
  if(S.regen&&!P.down)P.hp=Math.min(S.hp,P.hp+S.regen*dt*(P.psnT>0?.5:1));
  if(P.soulT>0){P.soulT-=dt;if(P.soulT<=0)P.soulN=0}
  if(S.abPulse){P.abT=(P.abT==null?5:P.abT)-dt;if(P.abT<=0){P.abT=5;const R=200*(1+S.skillRad/200);G.rings.push({x:P.x,y:P.y,t:0,max:R,col:'176,124,255'});burst(P.x,P.y,20,'#b07cff',220,3);SND.play('boom');
    for(const o of G.en.slice())if(!o.dead&&Math.abs(o.x-P.x)<R+o.r&&Math.hypot(o.x-P.x,o.y-P.y)<R+o.r)dmgEnemy(o,S.dmg*S.abPulse/100,false)}}
  const antiM=1-Math.min(60,S.antidote||0)/100;
  for(const z of G.zones){z.life-=dt;
    if(!P.down&&Math.hypot(P.x-z.x,P.y-z.y)<z.r+P.r*.4){
      if(z.kind==='poison'){z.tick=(z.tick||0)-dt;if(z.tick<=0){z.tick=.6;P.psn=Math.min(5,P.psn+1);P.psnT=8*antiM;P.psnD=Math.max(P.psnD,z.dps*.5)}}
      else{P.brnT=5*antiM;P.brnD=Math.max(P.brnD||0,z.dps*2)}}
    if(G.pod&&Math.hypot(G.pod.x-z.x,G.pod.y-z.y)<z.r+G.pod.r)podHurt(z.dps*(z.kind==='pyro'?2:1.2)*dt)}
  compact(G.zones,z=>z.life>0);
  if(P.psnT>0){P.psnT-=dt;dotHurt(P.psn*P.psnD*dt);if(P.psnT<=0){P.psn=0;P.psnD=0}}
  if(P.frzT>0)P.frzT-=dt;
  if(G.biome===1&&Math.random()<dt*16&&G.parts.length<420)G.parts.push({x:G.cam.x+rand(-G.vw/2,G.vw/2),y:G.cam.y+rand(-G.vh/2,G.vh/2),vx:rand(-12,12),vy:rand(18,42),life:2.4,max:2.4,col:'#e4f4ff',size:rand(1,2.2)});
  if(P.brnT>0){P.brnT-=dt;dotHurt(P.brnD*dt);if(Math.random()<dt*10)G.parts.push({x:P.x+rand(-8,8),y:P.y+rand(-6,6),vx:0,vy:-60,life:.5,max:.5,col:'#ff8a3a',size:3})}
  if(G.over)return;
  if(NET.guest)for(const l of G.lobs)l.t+=dt;else for(const l of G.lobs){l.t+=dt;if(l.t>=l.T){l.done=true;const life=l.kind==='poison'?5:3;G.zones.push({id:++G.zid,x:l.tx,y:l.ty,r:l.r,life,max:life,kind:l.kind,dps:l.dps});burst(l.tx,l.ty,14,l.kind==='poison'?'#e07ad6':'#ff8a3a',140,3)}}
  compact(G.lobs,l=>!l.done);
  for(const w of G.wells){if(!w.on){w.cd-=dt;if(w.cd<=0)placeWell(w)}
    else if((P.psnT>0||P.brnT>0||P.frzT>0)&&Math.hypot(P.x-w.x,P.y-w.y)<w.r+P.r){P.psn=0;P.psnT=0;P.psnD=0;P.brnT=0;P.frzT=0;w.on=false;w.cd=30;burst(w.x,w.y,24,'#bfeaff',160,3);toast('<b style="color:#9fdcff">Source sacrée</b> : altérations purifiées. Elle réapparaîtra ailleurs.')}}
  if(P.cbT>0){P.cbT-=dt;if(Math.random()<dt*24){const a=rand(0,Math.PI*2);G.parts.push({x:P.x+Math.cos(a)*P.r*1.4,y:P.y+Math.sin(a)*P.r*1.4,vx:Math.cos(a)*30,vy:-50,life:.45,max:.45,col:'#ffd34d',size:3})}if(P.cbT<=0){P.cbT=0;refreshStats()}}
  if(G.cls==='magicien'&&hasTal('m_shield')){P.noHit+=dt;if(P.noHit>4)P.shield=Math.min(S.hp*.25,P.shield+S.hp*.08*dt)}
  if(moving){P.dx=iv.x/iv.m;P.dy=iv.y/iv.m;P.face=Math.atan2(P.dy,P.dx)}
  let sp=P.down?0:S.speed*iv.m*(P.frzT>0?.62:1);
  if(P.dashT>0){P.dashT-=dt;sp=S.speed*3.4;P.x+=P.dx*sp*dt;P.y+=P.dy*sp*dt;if(Math.random()<.6)G.parts.push({x:P.x,y:P.y,vx:0,vy:0,life:.25,max:.25,col:'#9fc2b8',size:P.r*.8})}
  else{P.x+=iv.x/(iv.m||1)*sp*dt;P.y+=iv.y/(iv.m||1)*sp*dt}
  resolve(P);
  G.cam.x+=(P.x-G.cam.x)*Math.min(1,dt*8);G.cam.y+=(P.y-G.cam.y)*Math.min(1,dt*8);
  // Capture : décidée par l'hôte (en coopération, n'importe quel héros debout compte pour capturer et pour l'extraction).
  if(G.mode==='capture'&&!NET.guest){
    const t=G.target,heroes=[P,...(G.mates||[])].filter(h=>!h.down),near=(x,y,r)=>heroes.some(h=>Math.hypot(x-h.x,y-h.y)<r);
    if(t&&t.downed){if(near(t.x,t.y,80)){G.capT+=dt;if(G.capT>=2.5){G.en=G.en.filter(e=>e!==t);G.target=null;G.capT=0;G.capN++;burst(t.x,t.y,36,'#f0cf4a',220);
        if(!G.exitPt)G.exitPt=farPoint(1000);G.nextTgt=CAP_NEXT;capReward();if(NET.host)netSend({t:'cap'})}}
      else G.capT=Math.max(0,G.capT-dt)}
    if(!G.target&&G.nextTgt>0){G.nextTgt-=dt;if(G.nextTgt<=0){G.nextTgt=0;spawnTarget()}}
    if(G.exitPt){const inZ=near(G.exitPt.x,G.exitPt.y,55);
      if(inZ){if(G.extT===0)toast('Reste <b>3 s</b> dans la zone pour t\'extraire.');G.extT+=dt;if(G.extT>=EXT_T){missionSuccess();return}}
      else G.extT=Math.max(0,G.extT-dt*1.5)}
  }
  if(P.dashT>0&&G.cls==='guerrier'&&hasTal('g_charge'))for(const e of G.en)if(!e.dead&&!P.dashHit.has(e)&&Math.hypot(e.x-P.x,e.y-P.y)<e.r+P.r+10){
    P.dashHit.add(e);const a=Math.atan2(e.y-P.y,e.x-P.x),k=e.type==='boss'?40:380;e.kx+=Math.cos(a)*k;e.ky+=Math.sin(a)*k;dmgEnemy(e,S.dmg*1.5,false)}
  // attaque
  if(P.swing){P.swing.t+=dt;if(P.swing.t>.2)P.swing=null}
  if(P.spin>0){P.spin-=dt;P.spinTick-=dt;P.face+=dt*18;
    if(P.spinTick<=0){P.spinTick=.2;const R=130*(1+S.reach/100)*(1+S.skillRad/100);
      for(const e of G.en){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){const crit=Math.random()*100<S.crit,dd=S.nova*.22*(crit?S.critDmg/100:1);dmgEnemy(e,dd,crit);if(S.leech)heal(dd*S.leech/100);const k=e.type==='boss'?10:90;e.kx+=dx/d*k;e.ky+=dy/d*k}}}}
  let tgt=null,td=1e9;if(!P.down)for(const e of G.en){if(e.downed)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<td){td=d;tgt=e}}
  if(G.cls==='guerrier'){
    const R=(78+P.r)*(1+S.reach/100);
    if(tgt&&P.dashT<=0&&P.spin<=0){
      if(td<R+tgt.r+40)P.face=Math.atan2(tgt.y-P.y,tgt.x-P.x);
      if(td<R+tgt.r&&P.fire<=0){
        P.fire=1/S.aps;const a=P.face;P.swing={t:0,a,R};const forceC=!!P.critNext;P.critNext=0;
        for(const e of G.en){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d>R+e.r)continue;
          const da=Math.abs((((Math.atan2(dy,dx)-a)%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI);
          if(da>1.35&&d>e.r+P.r+6)continue;
          const crit=forceC||Math.random()*100<S.crit,dd=S.dmg*(crit?S.critDmg/100:1);dmgEnemy(e,dd,crit);onHit(e,dd);
          if(S.burn){e.burnT=2.5;e.burnDps=S.burn}if(S.leech)heal(dd*S.leech/100);
          const k=e.type==='boss'?30:e.type==='brute'?140:280;e.kx+=dx/d*k;e.ky+=dy/d*k}
        G.shake=Math.max(G.shake,2);
        for(let i=0;i<S.waves;i++){const wa=a+(i-(S.waves-1)/2)*.35;G.shots.push({kind:'wave',x:P.x+Math.cos(wa)*P.r,y:P.y+Math.sin(wa)*P.r,vx:Math.cos(wa)*520,vy:Math.sin(wa)*520,a:wa,d:S.dmg*.6,crit:false,pierce:99,hit:new Set(),life:.5})}
        if(Math.random()*100<S.echo)P.fire=Math.min(P.fire,.12);
        P.swings++;
        if(hasTal('g_quake')&&P.swings%4===0){const R2=160*(1+S.reach/100)*(1+S.skillRad/100);G.rings.push({x:P.x,y:P.y,t:.1,max:R2,col:'255,210,160'});G.shake=Math.max(G.shake,5);
          for(const e of G.en){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R2+e.r){const k=e.type==='boss'?20:200;e.kx+=dx/d*k;e.ky+=dy/d*k;dmgEnemy(e,S.dmg*.9,false)}}}
      }
    }
  }else if(tgt&&td<560&&P.dashT<=0){
    P.face=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    if(P.fire<=0){
      const slow=moving&&!(G.cls==='archer'&&hasTal('a_move'));
      P.fire=1/S.aps*(slow?1.43:1);const n=1+Math.floor(S.multi)+(Math.random()<S.multi%1?1:0),orb=G.cls==='magicien',sp=(orb?430:640)*(S.shotSpd||1);
      const cs=P.critShots>0||!!P.critNext;if(P.critNext)P.critNext=0;else if(cs)P.critShots--;
      const gap=Math.min(orb?.25:.17,(orb?1.5:1.2)/n);
      for(let i=0;i<n;i++){const a=P.face+(i-(n-1)/2)*gap,crit=cs||Math.random()*100<S.crit;
        G.shots.push({kind:orb?'orb':'bolt',x:P.x,y:P.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a,d:S.dmg*(crit?S.critDmg/100:1),crit,pierce:orb?0:S.pierce,hit:new Set(),life:1.4})}
      if(Math.random()*100<S.echo)P.fire=Math.min(P.fire,.1);
    }
  }
  // projectiles du héros
  gridBuild();
  for(const s of G.shots){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(blocked(s.x,s.y,2)){s.life=0;if(s.kind==='orb')explode(s,null);else burst(s.x,s.y,3,'#e8a76b',80,2);continue}
    gridEach(s.x,s.y,60,e=>{if(e.dead||s.hit.has(e))return;const m=e.r+(s.kind==='orb'?7:4);if(Math.abs(e.x-s.x)>m||Math.abs(e.y-s.y)>m)return;if(Math.hypot(e.x-s.x,e.y-s.y)>=m)return;
      dmgEnemy(e,s.d,s.crit);onHit(e,s.d);if(S.burn){e.burnT=2.5;e.burnDps=S.burn}
      const k=e.type==='boss'?20:e.type==='brute'?60:140;e.kx+=Math.cos(s.a)*k;e.ky+=Math.sin(s.a)*k;
      s.hit.add(e);if(s.kind==='orb'){explode(s,e);if(G.cls==='magicien'&&hasTal('m_chain')&&Math.random()<.25)chain(e,s.d*.8);s.life=0;return false}
      if(s.pierce>0){s.pierce--;return}
      if(G.cls==='archer'&&hasTal('a_rico')&&!s.bounced){s.bounced=true;let nt=null,nd=280;
        for(const o of G.en){if(o.dead||o.downed||s.hit.has(o))continue;const dd=Math.hypot(o.x-s.x,o.y-s.y);if(dd<nd){nd=dd;nt=o}}
        if(nt){const a=Math.atan2(nt.y-s.y,nt.x-s.x);s.a=a;s.vx=Math.cos(a)*640;s.vy=Math.sin(a)*640;s.life=.8}else s.life=0;return false}
      s.life=0;return false});
  }
  compact(G.shots,s=>s.life>0);
  // ennemis
  const farR=Math.hypot(G.vw,G.vh)*1.1;
  if(NET.guest)netGuestEnemies(dt,P);else for(const e of G.en){
    if(e.dead)continue;
    e.flash=Math.max(0,e.flash-dt*7);e.hitCd-=dt;e.shown-=dt;
    if(e.burnT>0){e.burnT-=dt;e.burnAcc+=e.burnDps*dt;if(e.burnAcc>=1){const d=Math.floor(e.burnAcc);e.burnAcc-=d;dmgEnemy(e,d,false,true)}
      if(Math.random()<dt*8)G.parts.push({x:e.x+rand(-e.r,e.r)*.6,y:e.y+rand(-e.r,e.r)*.4,vx:0,vy:-50,life:.5,max:.5,col:'#ff8a3a',size:2.5})}
    if(e.dead)continue;
    const PT=(!NET.guest&&e.type!=='boss'&&petLure(e))||netNear(e,P),T=(e.tgtPod&&G.pod)?G.pod:PT,dx=T.x-e.x,dy=T.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;let mx=0,my=0;
    const dP=T===PT?d:Math.hypot(PT.x-e.x,PT.y-e.y);
    if(dP>farR&&e.type!=='boss'&&e.type!=='cible'&&!e.tgtPod){const p=ringPos();e.x=p.x;e.y=p.y;continue}
    if(e.type==='cible'){
      if(!e.downed){
        if(dP<480){mx=-(P.x-e.x)/dP;my=-(P.y-e.y)/dP;e.blink-=dt;
          if(e.blink<=0&&dP<260){e.blink=rand(4,6);burst(e.x,e.y,16,'#f0cf4a',160);const a=Math.atan2(e.y-P.y,e.x-P.x);
            for(let k=0;k<10;k++){const b=a+rand(-1,1),nx=e.x+Math.cos(b)*330,ny=e.y+Math.sin(b)*330;if(!blocked(nx,ny,22)){e.x=nx;e.y=ny;break}}burst(e.x,e.y,16,'#f0cf4a',160)}}
        else{e.wob+=dt*.7;mx=Math.cos(e.wob)*.4;my=Math.sin(e.wob*1.3)*.4}
      }
    }
    else if(e.type==='ghoul'||e.type==='givrin'){mx=ux;my=uy}
    else if(e.type==='slime'){e.timer-=dt;
      if(e.state==='walk'){const h=Math.max(0,Math.sin(G.t*5+e.wob));mx=ux*(.35+1.3*h);my=uy*(.35+1.3*h);
        if(e.timer<=0){if(d<170+e.r){e.state='wind';e.timer=[.45,.38,.3][e.gen];e.ang=Math.atan2(dy,dx)}else e.timer=.4}}
      else if(e.state==='wind'){if(e.timer<=0){e.state='charge';e.timer=.28;burst(e.x,e.y+e.r*.5,6,'#7fe0c8',90,2)}}
      else if(e.state==='charge'){mx=Math.cos(e.ang)*5.2;my=Math.sin(e.ang)*5.2;if(e.timer<=0){e.state='walk';e.timer=rand(1.4,2.4)*[1,.85,.7][e.gen]}}}
    else if(e.type==='bat'){e.wob+=dt*6;mx=ux-uy*Math.sin(e.wob)*.6;my=uy+ux*Math.sin(e.wob)*.6}
    else if(e.type==='poison'||e.type==='pyro'){
      e.noLos=(e.noLos||0)-dt;
      if(e.noLos>0){mx=ux;my=uy}else if(d<240){mx=-ux;my=-uy}else if(d>380){mx=ux;my=uy}else{mx=-uy*e.side*.6;my=ux*e.side*.6}
      e.timer-=dt;if(e.timer<=0){e.timer=rand(3,4.2);
        if(!losClear(e,dx,dy))e.noLos=2.5;else if(d<560){const lv=G.level,ds=diff().ds;
          G.lobs.push({x0:e.x,y0:e.y,tx:T.x+rand(-30,30),ty:T.y+rand(-30,30),t:0,T:1,kind:e.type,r:(e.type==='poison'?80:70)*Math.min(1.5,1+.02*(lv-1)),dps:2*ds})}}
    }
    else if(e.type==='archer'){
      e.noLos=(e.noLos||0)-dt;
      const lo=e.tgtPod?110:220,hi=e.tgtPod?170:330;if(e.noLos>0){mx=ux;my=uy}else if(d<lo){mx=-ux;my=-uy}else if(d>hi){mx=ux;my=uy}else{mx=-uy*e.side*.7;my=ux*e.side*.7}
      e.timer-=dt;if(e.timer<=0){e.timer=rand(1.6,2.4);
        if(!losClear(e,dx,dy))e.noLos=2.5;else if(d<520)fireE(e,Math.atan2(dy,dx),250,e.dmg)}
    }else if(e.type==='brute'||e.type==='boss'){
      e.timer-=dt;const boss=e.type==='boss',half=e.hp<e.max/2;
      if(e.state==='walk'){mx=ux*(boss?.7:1);my=uy*(boss?.7:1);
        if(e.timer<=0){
          if(boss){e.cycle++;if(e.cycle%3===0){e.state='wind';e.timer=.75;e.ang=Math.atan2(dy,dx)}else{if(d<700)ring(e,half?20:14,half?220:190);e.timer=half?1.5:2.3}}
          else if(d<380){e.state='wind';e.timer=.55;e.ang=Math.atan2(dy,dx)}else e.timer=.5;
        }
        if(boss&&half){e.sum-=dt;if(e.sum<=0){e.sum=7;for(let i=0;i<3;i++)G.spawns.push({type:'ghoul',x:clamp(e.x+rand(-90,90),EDGE+40,MAP-EDGE-40),y:clamp(e.y+rand(-90,90),EDGE+40,MAP-EDGE-40),t:.8})}}
      }else if(e.state==='wind'){if(e.timer<=0){e.state='charge';e.timer=boss?.65:.45}}
      else if(e.state==='charge'){mx=Math.cos(e.ang)*(boss?7.5:6.5);my=Math.sin(e.ang)*(boss?7.5:6.5);
        if(Math.random()<.5)G.parts.push({x:e.x,y:e.y+e.r*.6,vx:rand(-30,30),vy:rand(-30,30),life:.4,max:.4,col:'#5b4a52',size:4});
        if(e.timer<=0){e.state='walk';e.timer=boss?1.3:rand(2.5,4)}}
    }
    e.slow-=dt;if(e.frz>0)e.frz-=dt;let sm=e.frz>0?0:e.slow>0?.4:1;if(S.auraSlow&&dP<180)sm*=1-S.auraSlow/100;
    e.x+=(mx*e.spd*sm+e.kx)*dt;e.y+=(my*e.spd*sm+e.ky)*dt;
    const f=Math.pow(.002,dt);e.kx*=f;e.ky*=f;
    if(resolve(e)&&e.state==='charge'){e.state='walk';e.timer=e.type==='boss'?1.6:e.type==='slime'?1.5:2.5;G.shake=Math.max(G.shake,e.type==='boss'?8:4);burst(e.x,e.y,10,'#6b5a60',150)}
    if(e.type!=='archer'&&e.type!=='cible'&&e.hitCd<=0){const cd=e.state==='charge'?e.dmg*1.4:e.dmg;
      if(T===G.pod&&d<e.r+T.r+5){podHurt(cd);e.hitCd=.8}else if(PT===P&&dP<e.r+P.r){hurt(cd);e.hitCd=.8;if(e.type==='givrin'){P.frzT=2.2*(1-Math.min(60,S.antidote||0)/100)}if(e.elite==='vampire'){e.hp=Math.min(e.max,e.hp+e.max*.1);ftext(e.x,e.y-e.r,'+vie','#ff5a6a',13)}}}
  }
  // séparation
  gridBuild();const L=G.en;
  if(!NET.guest)for(let i=0;i<L.length;i++){const a=L[i];gridEach(a.x,a.y,a.r+50,(b,j)=>{if(j<=i)return;const m=a.r+b.r,dx=b.x-a.x;if(dx>m||dx<-m)return;const dy=b.y-a.y;if(dy>m||dy<-m)return;
    const d=Math.hypot(dx,dy)||1;if(d<m){const p=(m-d)/2,wa=a.type==='boss'?0:1,wb=b.type==='boss'?0:1;a.x-=dx/d*p*wa;a.y-=dy/d*p*wa;b.x+=dx/d*p*wb;b.y+=dy/d*p*wb}})}
  compact(G.en,e=>!e.dead);
  // projectiles ennemis
  for(const b of G.eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(G.pod&&Math.hypot(b.x-G.pod.x,b.y-G.pod.y)<b.r+G.pod.r){podHurt(b.d);b.life=0}else if(blocked(b.x,b.y,b.r*.5))b.life=0;else if(!P.down&&Math.hypot(b.x-P.x,b.y-P.y)<b.r+P.r-3){hurt(b.d);b.life=0;if(NET.guest)NET.ebUsed.add(b.id)}}
  compact(G.eb,b=>b.life>0);
  // butin
  for(const d of G.drops){
    d.t+=dt;d.age+=dt;if(d.kind==='gold'&&d.age>45){d.gone=true;continue}
    const dx=P.x-d.x,dy=P.y-d.y,dist=Math.hypot(dx,dy)||1;
    if(dist<S.magnet*petMagnet()||d.mt>0){d.mt+=dt;const v=Math.min(800,260+d.mt*500);d.x+=dx/dist*v*dt;d.y+=dy/dist*v*dt}
    if(!P.down&&dist<P.r+16){
      d.gone=true;
      if(d.kind==='xp'){G.nxp--;gainXp(d.v)}
      else if(d.kind==='gold'){SND.play('gold');const a=Math.round(d.amt*(1+lv('for')*.15)*(1+S.goldPct/100));G.gold+=a;ftext(P.x+rand(-10,10),P.y-P.r-12,'+'+a,'#f0cf4a',13)}
      else if(d.kind==='mod'){SND.play('pick2');gainMod(d.id)}
      else if(d.kind==='seal'){SND.play('leg');(G.loot.seals||(G.loot.seals=[])).push(d.id);G.fresh++}
      else if(d.kind==='relic'){SND.play('pick3');G.loot.relics.push(d.id);G.fresh++}
      else if(d.kind==='react'){if(G.relic){G.react++;if(G.react>=reactNeed()){const r=G.relic;G.opened.push(r);relShare(r);G.relI++;G.react=0;G.relic=G.relQ[G.relI]||null;G.shake=6;
          SND.play('relic');}}}
      else if(d.kind==='potion'){SND.play('pick');if(G.potions<potMax()){G.potions++}else d.gone=false}
      else if(d.kind==='item'){SND.play(d.item.r>=3?'pick3':d.item.r>=2?'pick2':'pick');G.loot.items.push(d.item);G.fresh++;if(d.item.r===3)G.shake=6}
      else if(d.kind==='part'){SND.play('pick3');G.loot.parts.push(d.part);G.fresh++}
    }
  }
  compact(G.drops,d=>!d.gone);
  // particules, textes, anneaux
  for(const p of G.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy*=.92;p.life-=dt}
  compact(G.parts,p=>p.life>0);
  for(const t of G.texts)t.t+=dt;compact(G.texts,t=>t.t<.8);
  for(const r of G.rings)r.t+=dt;compact(G.rings,r=>r.t<.45);
  for(const z of G.zaps)z.t+=dt;compact(G.zaps,z=>z.t<.25);
  G.shake=Math.max(0,G.shake-dt*30);G.hshake=Math.max(0,(G.hshake||0)-dt*28);
}

