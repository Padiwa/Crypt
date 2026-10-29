// Crypte des Cendres — boss.js : Boss (v147). Clé d'antre, arène fermée, Bourreau des Cendres, objet unique ; écran Mission et dessins.
/* Boss (v147) : rencontres nommées, en solo, au plus une par mission.
   Fragments : un Gardien peut lâcher un fragment de clé d'antre (BAL.keyFrag, un au plus par mission), seulement en solo et dans un lieu
   qui a son Boss. Ils sont gardés au retour, comme le reste du butin ; 3 fragments du même lieu font une clé (meta.keyF, meta.keys).
   Clé : choisie dans l'écran Mission (meta.keyOn), cachée en coopération. Le Boss arrive après le premier objectif (fin de la 1re manche
   en Survie, 3e vague en Défense, première capture) ; la clé est consommée quand il apparaît.
   Combat : un cercle de runes se referme (on ne peut plus en sortir), le minuteur des Gardiens et l'horloge de la manche sont en pause,
   l'extraction de la Capture est fermée. Le Boss compte comme un Gardien pour les statuts et les bonus (type 'boss', e.lord).
   Butin : l'objet unique (dans le coffre tout de suite ; déjà possédé, de l'essence), une relique garantie, de l'essence, une couleur de héros
   à la première victoire. Valeurs mesurées au banc et choisies par l'auteur le 29 octobre 2026 (BAL.lordHp, BAL.sentHp… pour les essais). */
const LORDS={
  bourreau:{n:'Le Bourreau des Cendres',bio:0,col:'#4a1c18',uq:'condamne',sw:{cloak:'#3b0e0c',rim:'#b8322a',inner:'#120707'}},
};
const lordOfBio=b=>Object.keys(LORDS).find(k=>LORDS[k].bio===b)||null;
const LORD_C='#ff6a50',KEY_N=3,LORD_IN=4,ARENA_R=560,LORD_ESS=100,UQ_DUP_ESS=150;
const LORD_HP=BAL.lordHp||4;            // vie : × celle d'un Gardien au même moment (choix de l'auteur au banc : combats d'une minute environ)
// Sentence : un cercle se resserre 2 s autour du héros, puis un coup énorme. Une esquive lancée dans les SENT_PERF dernières secondes
// (« esquive parfaite ») l'annule et étourdit le Bourreau PERF_STUN s, pendant lesquelles il subit des dégâts doublés.
// Sans esquive : SENT_HP de la vie maximale du héros, avant sa réduction des dégâts (dangereux sans tuer d'un coup un héros en pleine vie).
const SENT_IV=BAL.sentIv||9,SENT_T=2,SENT_PERF=.3,SENT_HP=BAL.sentHp||.6,PERF_STUN=1,PERF_X=2;
// Chaîne : un pieu tombe près du héros, qui ne peut plus s'en éloigner de CHAIN_R px tant qu'il tient debout.
const CHAIN_IV=BAL.chainIv||13,CHAIN_R=190,STAKE_HP=BAL.stakeHp||210;
// Hordes pendant le combat : de son apparition à sa mort, moitié moins de monstres, qui arrivent deux fois moins vite (LORD_HORDE).
// Choisi par l'auteur après le banc du 29 octobre 2026 : le combat se lit mieux, un peu moins de morts au niveau 30.
const LORD_HORDE=BAL.lordHorde??.5;
const hordeK=()=>lordOn()?LORD_HORDE:1;
meta.keyF=meta.keyF||{};meta.keys=meta.keys||{};meta.lordW=meta.lordW||{};
const lordOn=()=>!!(G&&G.lord&&!G.lord.dead);
const lordArenaR=()=>{const A=G.arena;return A?A.r*(1+1.5*(1-A.k)):0};
// Obscurité de la tempête de sable ou de la phase d'ombre du Bourreau (les deux rendus).
const darkK=()=>Math.max(stormK(),(G&&G.lordDk)||0);
function lordInit(){
  G.lordSt=0;G.lord=null;G.arena=null;G.sent=null;G.stake=null;G.lordDk=0;G.lordX=0;G.lordRes=null;G.lordLog=null;G.keyN=0;G.loot.keys=0;
  const id=lordOfBio(G.biome);G.lordKey=meta.keyOn&&id&&(meta.keys[BIOMES[G.biome].id]|0)>0&&!NET.on?id:null}
// Fragment de clé sur un Gardien (kill), un au plus par mission.
function keyDrop(push){if(NET.on||!lordOfBio(G.biome)||(G.keyN|0)>=(BAL.keyFragMax||1))return;
  if(Math.random()<(BAL.keyFrag||0)){G.keyN=(G.keyN|0)+1;push({kind:'key'},40)}}
// Au retour (bank) : les fragments ramassés rejoignent ceux du lieu ; 3 font une clé.
function keyBank(){const n=G.loot.keys|0;if(!n)return;const bk=BIOMES[G.biome].id;meta.keyF[bk]=(meta.keyF[bk]|0)+n;
  while(meta.keyF[bk]>=KEY_N){meta.keyF[bk]-=KEY_N;meta.keys[bk]=(meta.keys[bk]|0)+1;const L=LORDS[lordOfBio(G.biome)];
    toast(`<b style="color:${LORD_C}">Clé d'antre forgée</b> : ${L?L.n+' peut':'le Boss du lieu pourra'} être appelé (écran Mission).`,true)}}
/* ---------- Combat ---------- */
function lordTick(dt){
  if(!G.lordKey||G.over)return;
  if(G.lordSt===0){if((G.objN|0)<1)return;
    const P=G.P,m=EDGE+320;G.lordSt=1;G.lordIn=LORD_IN;G.arena={x:clamp(P.x,m,MAP-m),y:clamp(P.y,m,MAP-m),r:ARENA_R,k:0};
    banner(`<span style="color:${LORD_C}">${LORDS[G.lordKey].n}</span> vient rendre sa sentence`,LORD_C,3,true);SND.play('boss');G.shake=8;return}
  if(G.lordSt===1){G.lordIn-=dt;G.arena.k=Math.min(1,G.arena.k+dt/LORD_IN);if(G.lordIn<=0)lordSpawn();return}
  if(G.lordSt!==2)return;
  const e=G.lord,want=e&&e.ph===2?1:0;G.lordDk+=clamp(want-G.lordDk,-dt/1.5,dt/1.5);
  if(G.sent){G.sent.t-=dt;if(G.sent.t<=0){G.sent=null;lordStrike()}}
  if(G.stake&&G.stake.dead)G.stake=null}
function lordSpawn(){
  const id=G.lordKey,A=G.arena,bk=BIOMES[G.biome].id,P=G.P;
  meta.keys[bk]=Math.max(0,(meta.keys[bk]|0)-1);saveMeta(); // la clé est consommée à l'apparition
  let x=A.x,y=A.y;for(let k=0;k<30;k++){const a=rand(0,Math.PI*2),r=rand(.45,.75)*A.r,qx=clamp(A.x+Math.cos(a)*r,EDGE+80,MAP-EDGE-80),qy=clamp(A.y+Math.sin(a)*r,EDGE+80,MAP-EDGE-80);
    if(!blocked(qx,qy,60)&&Math.hypot(qx-P.x,qy-P.y)>300){x=qx;y=qy;break}}
  const n=G.bossN;spawnEnemy({type:'boss',x,y});G.bossN=n; // ne compte pas parmi les Gardiens (+10 % par Gardien venu)
  const e=G.en[G.en.length-1],L=LORDS[id];
  Object.assign(e,{lord:id,r:54,col:L.col,spd:ETYPE.boss.spd*1.15,ph:1,sentT:4,chainT:8,timer:2.5,state:'walk'});e.hp*=LORD_HP;e.max*=LORD_HP;
  G.lord=e;G.lordSt=2;G.lordT0=G.t;G.lordLog={sent:0,perf:0,hit:0,chain:0,t:0};
  burst(x,y,40,LORD_C,260,4);G.rings.push({x,y,t:0,max:160,col:'255,106,80'});SND.play('boss');G.shake=12;
  banner(`<span style="color:${LORD_C}">${L.n}</span> · l'arène est fermée`,LORD_C,3,true)}
// Pas d'un Boss ou de son pieu dans la boucle des ennemis (step.js), à la place du comportement des autres monstres.
function lordStep(e,dt,stn){
  if(e.stake){e.kx=0;e.ky=0;return}
  const P=G.P,dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;let mx=0,my=0;
  if(e.ph===1&&e.hp<e.max*.5){e.ph=2;e.state='walk';e.timer=1.5;G.shake=10;SND.play('wave');banner('Le Bourreau éteint les braseros · guette la ligne rouge',LORD_C,3,true)}
  const ph2=e.ph===2;
  if(!stn&&!P.down){e.sentT-=dt;e.chainT-=dt;e.timer-=dt;
    if(e.state==='walk'){mx=ux*.75;my=uy*.75;
      if(!G.sent&&e.sentT<=0){G.sent={t:SENT_T};e.sentT=SENT_IV*(ph2?.8:1);e.state='sent';G.lordLog.sent++;SND.play('elite');banner('Sentence · esquive au tout dernier moment',LORD_C,2,true)}
      else if(!G.stake&&e.chainT<=0&&d<650){lordChain();e.chainT=CHAIN_IV}
      else if(e.timer<=0){e.state='wind';e.timer=ph2?.9:.75;e.ang=Math.atan2(dy,dx)}}
    else if(e.state==='sent'){if(!G.sent){e.state='walk';e.timer=1}}
    else if(e.state==='wind'){if(e.timer<=0){e.state='charge';e.timer=.7}}
    else if(e.state==='charge'){const v=ph2?8.5:7.5;mx=Math.cos(e.ang)*v;my=Math.sin(e.ang)*v;
      if(Math.random()<.5)G.parts.push({x:e.x,y:e.y+e.r*.6,vx:rand(-30,30),vy:rand(-30,30),life:.4,max:.4,col:'#5b3a30',size:4});
      if(e.timer<=0){e.state='walk';e.timer=ph2?1.4:2.4}}}
  e.slow-=dt;if(e.frz>0)e.frz-=dt;if(e.curse>0)e.curse-=dt;let sm=e.frz>0||e.root>0||stn?0:e.slow>0?.4:1;if(S.auraSlow&&d<180)sm*=1-S.auraSlow/100;
  e.x+=(mx*e.spd*sm+e.kx)*dt;e.y+=(my*e.spd*sm+e.ky)*dt;const f=Math.pow(.002,dt);e.kx*=f;e.ky*=f;
  const A=G.arena;if(A){const R=A.r-e.r,ax=e.x-A.x,ay=e.y-A.y,ad=Math.hypot(ax,ay);if(ad>R){e.x=A.x+ax/ad*R;e.y=A.y+ay/ad*R;if(e.state==='charge'){e.state='walk';e.timer=1.6}}}
  if(resolve(e)&&e.state==='charge'){e.state='walk';e.timer=1.6;G.shake=Math.max(G.shake,8);burst(e.x,e.y,10,'#6b5a60',150)}
  if(e.hitCd<=0&&!stn&&!P.down&&d<e.r+P.r){const cd=(S.terr>0&&d<180?1-S.terr/100:1)*(e.state==='charge'?e.dmg*1.4:e.dmg);thornE(e,hurt(cd));e.hitCd=.8}}
// Fin de la Sentence : esquive parfaite (esquive lancée dans les SENT_PERF dernières secondes) ou coup énorme.
function lordStrike(){const P=G.P,e=G.lord,perf=P.dashAt!=null&&G.t-P.dashAt<=SENT_PERF+1e-6;
  G.rings.push({x:P.x,y:P.y,t:0,max:150,col:perf?'255,211,77':'255,80,60'});G.shake=Math.max(G.shake,12);
  if(perf){G.lordLog.perf++;G.lordX=G.t+PERF_STUN;if(e&&!e.dead){e.stun=Math.max(e.stun||0,PERF_STUN);e.stunI=PERF_STUN+STUN_IMM;e.state='walk';e.timer=1.5}
    ftext(P.x,P.y-P.r-14,'Esquive parfaite','#ffd34d',18);SND.play('frenzy');banner('Esquive parfaite · dégâts doublés','#ffd34d',2,true)}
  else{if(hurt(S.hp*SENT_HP)>0)G.lordLog.hit++;SND.play('boom');burst(P.x,P.y,20,'#ff5a3a',200,4)}
  if(e&&!e.dead&&e.state==='sent'){e.state='walk';e.timer=1}}
function lordChain(){const P=G.P,{hs}=diff();let x=P.x,y=P.y;
  for(let k=0;k<12;k++){const a=rand(0,Math.PI*2),r=rand(50,90),qx=P.x+Math.cos(a)*r,qy=P.y+Math.sin(a)*r;if(!blocked(qx,qy,20)){x=qx;y=qy;break}}
  const st={id:++G.eid,type:'pieu',stake:1,x,y,r:16,hp:STAKE_HP*hs,max:STAKE_HP*hs,spd:0,dmg:0,col:'#5a4434',flash:0,hitCd:1e9,kx:0,ky:0,burnT:0,burnDps:0,burnAcc:0,state:'walk',slow:0,timer:0,shown:0,wob:0};
  G.en.push(st);G.stake=st;G.lordLog.chain++;SND.play('hit');burst(x,y,14,'#8a7058',140,3);banner('Enchaîné au pieu · brise-le pour te libérer','#c9a27a',2,true)}
// Après le déplacement du héros : il reste dans l'arène et au bout de sa chaîne.
function lordHold(P){const A=G.arena;if(A){const R=lordArenaR()-P.r,dx=P.x-A.x,dy=P.y-A.y,d=Math.hypot(dx,dy);if(d>R){P.x=A.x+dx/d*R;P.y=A.y+dy/d*R}}
  const s=G.stake;if(s&&!s.dead){const dx=P.x-s.x,dy=P.y-s.y,d=Math.hypot(dx,dy);if(d>CHAIN_R){P.x=s.x+dx/d*CHAIN_R;P.y=s.y+dy/d*CHAIN_R}}}
const ownsUq=k=>meta.stash.some(i=>i&&i.uq===k)||allWorn().some(i=>i.uq===k)||Object.values(meta.gear||{}).some(i=>i&&i.uq===k);
// Mort du Boss ou de son pieu (kill, combat.js).
function lordKill(e){e.dead=true;
  if(e.stake){if(G.stake===e)G.stake=null;burst(e.x,e.y,18,'#8a7058',180,3);SND.play('crit');return}
  G.kills++;G.lordSt=3;G.sent=null;if(G.stake){G.stake.dead=true;G.stake=null}G.arena=null;G.lordLog.t=Math.round((G.t-G.lordT0)*10)/10;
  const L=LORDS[e.lord],first=!(meta.lordW[e.lord]>0),dup=ownsUq(L.uq),it=dup?null:uqItem(L.uq,itemLvl());
  meta.lordW[e.lord]=(meta.lordW[e.lord]|0)+1;if(it)meta.stash.push(it);meta.essence+=LORD_ESS+(dup?UQ_DUP_ESS:0);saveMeta();
  const drop=o=>G.drops.push(Object.assign({x:e.x+rand(-40,40),y:e.y+rand(-40,40),t:rand(0,6),age:0,mt:0},o));
  drop({kind:'relic',id:relicDrop(true)});drop({kind:'potion'});for(let i=0;i<10;i++)drop({kind:'gold',amt:Math.max(1,Math.round(12*goldMul(G.level)*rand(.7,1.3)))});
  G.ult=Math.min(ultNeed(),(G.ult||0)+ULT_BOSS);G.lordRes={id:e.lord,item:it?it.name:null,dup,first};
  burst(e.x,e.y,70,LORD_C,340,5);burst(e.x,e.y,24,'#e8853b',140);G.shake=16;SND.play('bossdie');
  banner(`<span style="color:${LORD_C}">${L.n} vaincu</span> · ${it?esc(it.name)+' rejoint ton coffre':`objet déjà à toi : +${UQ_DUP_ESS} essence`}`,LORD_C,3,true);
  if(!G.en.some(o=>o.type==='boss'&&!o.dead))$('bossBar').hidden=true}
// Écran de fin de mission : le Boss vaincu et son butin.
function lordOvr(){const R=G.lordRes;if(!R)return '';const L=LORDS[R.id];
  return `<section class="ovr__sec"><h3 class="ovr__lab" style="color:${LORD_C}">${esc(L.n)} vaincu</h3><p class="cx-hint" style="margin:0">${R.item?`<b style="color:${RAR[3].c}">${esc(R.item)}</b> rejoint ton coffre.`:`Tu as déjà son objet unique : +${UQ_DUP_ESS} essence.`} +${LORD_ESS} essence et une relique.${R.first?' Nouvelles couleurs de héros dans Héros › Couleurs.':''}</p></section>`}
// Couleurs gagnées sur les Boss vaincus, ajoutées au nuancier (Héros › Couleurs).
const lookSw=k=>LOOK_SW[k].concat(Object.keys(LORDS).filter(id=>meta.lordW[id]>0).map(id=>LORDS[id].sw[k]).filter(c=>!LOOK_SW[k].includes(c)));
/* ---------- Écran Mission : clé d'antre ---------- */
function lordMsnDraw(){const sec=$('keySec');if(!sec)return;
  const seen=Object.values(meta.keyF).some(v=>v>0)||Object.values(meta.keys).some(v=>v>0)||Object.values(meta.lordW).some(v=>v>0);sec.hidden=!seen;if(!seen)return;
  const bi=clamp(meta.biome|0,0,BIOMES.length-1),id=lordOfBio(bi),bk=BIOMES[bi].id,n=meta.keys[bk]|0,f=meta.keyF[bk]|0,coop=typeof NET!=='undefined'&&NET.on,ok=!!id&&n>0&&!coop,on=ok&&!!meta.keyOn;
  const sub=coop?'En solo seulement.':!id?'Pas de Boss dans ce lieu pour l\'instant.':n?(on?'Il arrive après le premier objectif. La clé est consommée à son apparition.':'Touche pour l\'appeler pendant la mission.'):`Fragments : ${f} / ${KEY_N}. Ils tombent sur les Gardiens, un au plus par mission.`;
  $('keyK').innerHTML=`${id?esc(LORDS[id].n):'Clé d\'antre'}<small>${sub}</small>`;
  $('keyVal').textContent=id?`${n} clé${n>1?'s':''}${on?' · appelé':''}`:'';
  const b=$('keyBtn');b.setAttribute('aria-pressed',String(on));b.disabled=!ok;b.classList.toggle('is-on',on)}
$('keyBtn').onclick=()=>{if(NET.on)return;meta.keyOn=!meta.keyOn;saveMeta();newGame();refreshMenus()};
// Accueil : étiquette de la carte de mission quand le Boss est appelé.
function lordTag(){const bi=clamp(meta.biome|0,0,BIOMES.length-1),id=lordOfBio(bi);
  return meta.keyOn&&id&&(meta.keys[BIOMES[bi].id]|0)>0&&!NET.on?`<span class="home__tag" style="--c:${LORD_C}">${esc(LORDS[id].n)}</span>`:''}
/* ---------- Dessins (formes communes aux deux rendus, tournées vers la droite) ---------- */
function bourreauShape(r,white){const W=white?'#fff':null;
  ctx.fillStyle=W||'#4a1c18';circle(0,0,r);ctx.fill();ctx.strokeStyle=W||'#1c0907';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle=W||'#6e3a22';ctx.beginPath();ctx.ellipse(-r*.15,0,r*.55,r*.8,0,0,7);ctx.fill();
  ctx.fillStyle=W||'#0e0a0c';ctx.beginPath();ctx.moveTo(r*.75,0);ctx.lineTo(-r*.1,-r*.52);ctx.quadraticCurveTo(-r*.45,0,-r*.1,r*.52);ctx.closePath();ctx.fill();
  if(!white){ctx.fillStyle='#ff5a3a';circle(r*.36,-r*.13,3.2);ctx.fill();circle(r*.36,r*.13,3.2);ctx.fill()}
  ctx.strokeStyle=W||'#5a3d24';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.1,r*.75);ctx.lineTo(r*1.05,r*.55);ctx.stroke();
  ctx.fillStyle=W||'#b9b2a6';ctx.beginPath();ctx.moveTo(r*.85,r*.58);ctx.quadraticCurveTo(r*1.38,r*.92,r*1.16,r*1.26);ctx.lineTo(r*.8,r*.86);ctx.closePath();ctx.fill();
  if(!white){ctx.strokeStyle='#7a1f1a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(r*1.1,r*.8);ctx.lineTo(r*1.2,r*1.15);ctx.stroke()}}
const LORD_TEX=r=>2*Math.ceil(r*1.4+8);
function stakeShape(r,white){ctx.fillStyle=white?'#fff':'#5a4434';circle(0,0,r);ctx.fill();ctx.strokeStyle=white?'#fff':'#2a1e16';ctx.lineWidth=3;ctx.stroke();if(white)return;
  ctx.strokeStyle='#8f8a80';ctx.lineWidth=2.5;circle(0,0,r*.62);ctx.stroke();ctx.fillStyle='#3a2a1e';circle(0,0,r*.3);ctx.fill()}
function keyShape(c){ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';ctx.fillStyle='#1d1822';circle(-5,0,6);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(1,0);ctx.lineTo(12,0);ctx.moveTo(8,0);ctx.lineTo(8,5);ctx.moveTo(12,0);ctx.lineTo(12,4);ctx.stroke()}
// Phase d'ombre : loin du héros, le Bourreau se fond dans le noir (sauf quand il charge).
const lordAlpha=e=>e.lord&&e.ph===2&&e.state!=='charge'&&Math.hypot(e.x-G.P.x,e.y-G.P.y)>220?.25:1;
// Au-dessus de l'obscurité : cercle de l'arène, chaîne, Sentence, ligne rouge de la phase d'ombre. Canvas puis WebGL.
function lordTop2D(){const A=G.arena,P=G.P;
  if(A){const R=lordArenaR();ctx.strokeStyle=`rgba(255,106,80,${(.4+.25*Math.sin(G.t*3)).toFixed(3)})`;ctx.lineWidth=4;circle(A.x,A.y,R);ctx.stroke();ctx.strokeStyle='rgba(255,106,80,.22)';ctx.lineWidth=2;circle(A.x,A.y,R-14);ctx.stroke()}
  const s=G.stake;if(s&&!s.dead){ctx.strokeStyle='rgba(200,190,175,.85)';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(P.x,P.y);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='rgba(200,190,175,.2)';ctx.lineWidth=2;circle(s.x,s.y,CHAIN_R);ctx.stroke()}
  const e=G.lord;if(e&&!e.dead&&e.ph===2&&e.state==='wind'){ctx.strokeStyle='rgba(230,60,50,.6)';ctx.lineWidth=e.r*1.4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.ang)*420,e.y+Math.sin(e.ang)*420);ctx.stroke()}
  if(G.sent){const k=G.sent.t/SENT_T,R=P.r+8+120*k,now=G.sent.t<=SENT_PERF;ctx.fillStyle=`rgba(255,60,40,${(.08+.14*(1-k)).toFixed(3)})`;circle(P.x,P.y,R);ctx.fill();
    ctx.strokeStyle=now?'#ffd34d':'rgba(255,70,50,.95)';ctx.lineWidth=now?5:3;ctx.stroke()}}
function lordTopGL(g){g.clear();const A=G.arena,P=G.P;
  if(A){const R=lordArenaR();g.lineStyle(4,0xff6a50,.4+.25*Math.sin(G.t*3));g.drawCircle(A.x,A.y,R);g.lineStyle(2,0xff6a50,.22);g.drawCircle(A.x,A.y,R-14)}
  const s=G.stake;if(s&&!s.dead){g.lineStyle(3,0xc8beaf,.85);g.moveTo(s.x,s.y);g.lineTo(P.x,P.y);g.lineStyle(2,0xc8beaf,.2);g.drawCircle(s.x,s.y,CHAIN_R)}
  const e=G.lord;if(e&&!e.dead&&e.ph===2&&e.state==='wind'){g.lineStyle(e.r*1.4,0xe63c32,.6);g.moveTo(e.x,e.y);g.lineTo(e.x+Math.cos(e.ang)*420,e.y+Math.sin(e.ang)*420)}
  if(G.sent){const k=G.sent.t/SENT_T,R=P.r+8+120*k,now=G.sent.t<=SENT_PERF;g.lineStyle(now?5:3,now?0xffd34d:0xff4632,.95);g.beginFill(0xff3c28,.08+.14*(1-k));g.drawCircle(P.x,P.y,R);g.endFill()}
  g.lineStyle(0)}
