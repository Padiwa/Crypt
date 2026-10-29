// Crypte des Cendres — spells.js : entrées (clavier, souris, tactile), sorts, ultimes, esquive et potion. Découpé de game.js en v145.
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
function doDash(){const P=G.P;if(P.down)return;if(P.dashCd>0){if(!(sealOn('esq')&&P.dash2))return;P.dash2=0}else if(sealOn('esq'))P.dash2=1;if(sealOn('ombre'))P.critNext=1;SND.play('dash');P.dashT=.2;P.dashAt=G.t;P.dashCd=dashCdMax();burst(P.x,P.y,10,'#9fc2b8',120);
  P.dashHit=new Set();P.dashSt=new Set();
  if(S.elan>0)P.elanT=2;if(S.peau>0)P.peauT=1.5;if(S.ripo>0)P.ripoN=1;petInst();
  if(G.cls==='archer'&&hasTal('a_shadow'))P.critShots=3;
  if(G.cls==='magicien'&&hasTal('m_blink'))explode({x:P.x,y:P.y,d:S.dmg*1.6},null,true)}
/* ---------- Sorts et ultimes (v132) : 3 de chaque par héros, choisis dans Héros › Sorts et talents (SPELLS, G.kit). ----------
   Chaque coup de sort passe par spellHit : bonus de dégâts (Gardiens, exécution…), éléments (gel, ralentissement, éclair) et brûlure, comme une attaque. */
const nearE=(r,x=G.P.x,y=G.P.y)=>{let b=null,bd=r;for(const e of G.en){if(e.dead||e.downed)continue;const d=Math.hypot(e.x-x,e.y-y);if(d<bd){bd=d;b=e}}return b};
function spellHit(e,d,crit){if(e.dead||e.downed)return;G.inSp=(G.inSp|0)+1;try{hitE(e,d,crit)}finally{G.inSp--}}
const spellCrit=(e,d)=>{const c=Math.random()*100<S.crit;spellHit(e,c?d*S.critDmg/100:d,c)};
const skCd=sp=>sp.cd*(1-S.cdr/100)*(sealOn('sablier')?.8:1)*(teamHas('vif')?.85:1);
// Bond (Bond arrière, Bond écrasant) : le héros file en ligne droite, intouchable, puis l'atterrissage agit.
function leap(a,dist,T,kind){const P=G.P;P.leapT=T;P.leapVx=Math.cos(a)*dist/T;P.leapVy=Math.sin(a)*dist/T;P.leapK=kind;P.leapA=a;burst(P.x,P.y,10,'#9fc2b8',120);SND.play('dash')}
function leapLand(){const P=G.P,k=P.leapK;P.leapK=null;
  if(k==='recul'){const t=nearE(700),a0=t?Math.atan2(t.y-P.y,t.x-P.x):P.leapA+Math.PI;P.face=a0;
    for(let i=0;i<9;i++){const a=a0+(i-4)*.15,crit=Math.random()*100<S.crit;G.shots.push({kind:'bolt',sp:1,x:P.x,y:P.y,vx:Math.cos(a)*700,vy:Math.sin(a)*700,a,d:S.nova*.5*(crit?S.critDmg/100:1),crit,pierce:S.pierce+1,hit:new Set(),life:.9*(1+S.skillRad/100)})}
    G.rings.push({x:P.x,y:P.y,t:.15,max:60,col:'255,200,120'});return}
  if(k==='bond'){const R=150*(1+S.reach/100)*(1+S.skillRad/100);G.rings.push({x:P.x,y:P.y,t:0,max:R,col:'255,190,110'});G.rings.push({x:P.x,y:P.y,t:.1,max:R*.6,col:'255,110,60'});burst(P.x,P.y,30,'#ffb070',260,4);G.shake=Math.max(G.shake,8);G.hshake=Math.max(G.hshake||0,6);SND.play('boom');
    for(const e of G.en){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){const crit=Math.random()*100<S.crit,dd=S.nova*1.4*(crit?S.critDmg/100:1);spellHit(e,dd,crit);if(S.leech)heal(dd*S.leech/100);slowE(e,1.5);const kb=e.type==='boss'?60:420;e.kx+=dx/d*kb;e.ky+=dy/d*kb}}}}
// Rempart : la moitié du coup reçu (avant armure) frappe l'ennemi le plus proche (× dégâts de l'ultime).
function wallReflect(d){const t=nearE(260);if(!t)return;G.inUlt=(G.inUlt|0)+1;try{spellHit(t,d*.5*(1+(S.ultPct||0)/100),false)}finally{G.inUlt--}G.rings.push({x:t.x,y:t.y,t:.2,max:28,col:'255,190,110'})}
function doNova(){const P=G.P;if(P.down||P.novaCd>0)return;P.fluxB=2;G.inSp=(G.inSp|0)+1;try{doNova0()}finally{G.inSp--}
  if(S.gardA>0){const v=S.hp*S.gardA/100;addShield(v);P.gaS=v;P.gaT=4;burst(P.x,P.y,12,'#bfe0ff',120,2)}}
function doNova0(){
  const P=G.P;if(P.down)return;if(P.novaCd>0)return;const sp=SPELLS[G.cls].s[(G.kit&&G.kit.s)|0],k=sp.k;
  P.novaCd=P.surT>0?.5:skCd(sp);P.novaMax=P.novaCd;if(sealOn('soin'))netFx('sk',P.x,P.y,Math.max(200,175*(1+S.skillRad/100)));G.hshake=Math.max(G.hshake||0,3.5);SND.play('skill_'+G.cls);
  if(k==='tourbillon'){P.spin=1.6*(1+S.skillDur/100);P.spinTick=0;return}
  if(k==='volee'){
    for(let i=0;i<24;i++){const a=i/24*Math.PI*2;G.shots.push({kind:'bolt',sp:1,x:P.x,y:P.y,vx:Math.cos(a)*640,vy:Math.sin(a)*640,a,d:S.nova*.35,crit:false,pierce:S.pierce+2,hit:new Set(),life:1.2*(1+S.skillRad/100)})}
    G.rings.push({x:P.x,y:P.y,t:.15,max:80,col:'255,200,120'});return;
  }
  if(k==='nova'){
    G.rings.push({x:P.x,y:P.y,t:0,max:175*(1+S.skillRad/100),col:'150,210,255'});G.shake=Math.max(G.shake,5);
    for(const e of G.en){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<175*(1+S.skillRad/100)+e.r){const crit=Math.random()*100<S.crit;slowE(e,2.5);spellHit(e,S.nova*(crit?S.critDmg/100:1),crit);const k=e.type==='boss'?80:420;e.kx+=dx/(d||1)*k;e.ky+=dy/(d||1)*k}}
    G.eb=G.eb.filter(b=>Math.hypot(b.x-P.x,b.y-P.y)>175*(1+S.skillRad/100));return}
  if(k==='chasseur'){const t=nearE(900*(1+S.skillRad/100)),a0=t?Math.atan2(t.y-P.y,t.x-P.x):P.face;P.face=a0;
    for(let i=-1;i<=1;i++){const a=a0+i*.06,crit=Math.random()*100<S.crit;G.shots.push({kind:'bolt',sp:1,x:P.x,y:P.y,vx:Math.cos(a)*900,vy:Math.sin(a)*900,a,d:S.nova*1.6*(crit?S.critDmg/100:1),crit,pierce:99,hit:new Set(),life:1.1*(1+S.skillRad/100)})}
    G.rings.push({x:P.x,y:P.y,t:.15,max:60,col:'255,200,120'});G.shake=Math.max(G.shake,3);return}
  if(k==='recul'){const t=nearE(700);leap(t?Math.atan2(P.y-t.y,P.x-t.x):P.face+Math.PI,220,.22,'recul');return}
  if(k==='bond'){let best=null,bn=0;for(const e of G.en){if(e.dead||e.downed)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d>460)continue;let n=0;for(const o of G.en)if(!o.dead&&Math.abs(o.x-e.x)<150&&Math.abs(o.y-e.y)<150)n++;if(n>bn){bn=n;best=e}}
    const a=best?Math.atan2(best.y-P.y,best.x-P.x):P.face,dist=best?Math.min(300,Math.max(60,Math.hypot(best.x-P.x,best.y-P.y))):200;leap(a,dist,.3,'bond');return}
  if(k==='cri'){P.criT=6*(1+S.skillDur/100);refreshStats();const R=200*(1+S.skillRad/100);G.rings.push({x:P.x,y:P.y,t:0,max:R,col:'255,150,80'});burst(P.x,P.y,24,'#ff9a50',220,3);G.shake=Math.max(G.shake,5);
    for(const e of G.en){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){slowE(e,1.5);const kb=e.type==='boss'?40:380;e.kx+=dx/d*kb;e.ky+=dy/d*kb}}
    ftext(P.x,P.y-P.r-8,'Cri de guerre','#ffb070',15);return}
  if(k==='eclair'){let src=nearE(520*(1+S.skillRad/100)),px=P.x,py=P.y,d=S.nova*1.2;const hit=new Set();if(!src){G.rings.push({x:P.x,y:P.y,t:.15,max:50,col:'190,220,255'});return}
    for(let i=0;i<7&&src;i++){hit.add(src);G.zaps.push({x1:px,y1:py,x2:src.x,y2:src.y,t:0});px=src.x;py=src.y;const crit=Math.random()*100<S.crit;spellHit(src,d*(crit?S.critDmg/100:1),crit);d*=.9;
      let nx=null,nd=260*(1+S.skillRad/100);for(const o of G.en){if(o.dead||o.downed||hit.has(o))continue;const dd=Math.hypot(o.x-px,o.y-py);if(dd<nd){nd=dd;nx=o}}src=nx}
    G.shake=Math.max(G.shake,3);return}
  if(k==='transfert'){const x0=P.x,y0=P.y,ux=P.dx||0,uy=(P.dx||P.dy)?P.dy:-1;let tx=x0,ty=y0;
    for(let st=12;st<=240;st+=12){const nx=x0+ux*st,ny=y0+uy*st;if(blocked(nx,ny,P.r*.6))break;tx=nx;ty=ny}
    explode({x:x0,y:y0,d:S.nova*.6},null,true);P.x=tx;P.y=ty;resolve(P);G.cam.x=P.x;G.cam.y=P.y;P.inv=Math.max(P.inv,.3);explode({x:P.x,y:P.y,d:S.nova*.6},null,true);burst(P.x,P.y,16,'#bfe4ff',180,3);SND.play('dash');return}
}
// Cri de ralliement (sceau d'équipe, v144) : l'ultime se recharge 20 % plus vite, comme Fureur (avant : +20 % sur les ennemis abattus seulement).
const ultNeed=()=>Math.max(ULT_MIN,Math.round(ULT_N*(1-(((S&&S.fury)||0)+(typeof teamHas==='function'&&teamHas('cri')?20:0))/100)));
// Charge de l'ultime (v138) : 1 point par seconde, plus la réserve des ennemis abattus (au plus ULT_KMAX par seconde).
function ultCharge(dt){const P=G.P,need=ultNeed();if(G.ultHalf){G.ultHalf=0;G.ult=Math.max(G.ult||0,need/2)}if(P.down||G.over||(G.ult||0)>=need)return;const k=Math.min(G.ultQ||0,ULT_KMAX*dt);G.ultQ=(G.ultQ||0)-k;G.ult=Math.min(need,(G.ult||0)+dt+k)}
// Tout ce que fait l'ultime (lancer, effets qui durent, carreaux de la Tempête) compte comme dégâts de l'ultime : G.inUlt.
function doUlt(){G.inUlt=(G.inUlt|0)+1;try{return doUlt0()}finally{G.inUlt--}}
function doUlt0(){
  const P=G.P,need=ultNeed();if(P.down)return;if((G.ult||0)<need)return;G.ult=S.rema>0?need*S.rema/100:0;const m=1+(S.ultPct||0)/100,RR=1+S.skillRad/100,bd=1+(S.buffDur||0)/100;G.shake=Math.max(G.shake,12);G.hshake=Math.max(G.hshake||0,G.cls==='guerrier'?11:7);SND.play('ult');
  const k=SPELLS[G.cls].u[(G.kit&&G.kit.u)|0].k;
  if(k==='titan'){const r=320*RR;P.inv=3;G.rings.push({x:P.x,y:P.y,t:0,max:r,col:'255,190,110'});G.rings.push({x:P.x,y:P.y,t:.12,max:r*.6,col:'255,110,60'});burst(P.x,P.y,50,'#ffb070',320,4);
    for(const e of G.en){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);if(d<r+e.r){const k=e.type==='boss'?120:700;e.kx+=dx/(d||1)*k;e.ky+=dy/(d||1)*k;slowE(e,2);spellHit(e,S.nova*ULT_C.titan*m,false)}}
    toast('<b style="color:#ffd45a">Colère du Titan</b> : invulnérable pendant 3 s.');return}
  if(k==='pluie'){P.rain=3;P.rainT=0;toast('<b style="color:#ffd45a">Pluie d\'acier</b>');return}
  if(k==='meteores'){P.meteors=3;P.meteorT=0;toast('<b style="color:#ffd45a">Pluie de météores</b>');return}
  if(k==='faucon'){P.hawkT=6*bd;refreshStats();G.rings.push({x:P.x,y:P.y,t:0,max:140,col:'255,212,90'});burst(P.x,P.y,30,'#ffd45a',220,3);ftext(P.x,P.y-P.r-8,'Œil du faucon','#ffd45a',16);return}
  if(k==='tempete'){P.stormT=3;P.stormTick=0;P.stormA=P.face;ftext(P.x,P.y-P.r-8,'Tempête de carreaux','#ffd45a',16);return}
  if(k==='rempart'){P.wallT=6*bd;P.shield=Math.max(P.shield||0,S.hp*.6*m);G.rings.push({x:P.x,y:P.y,t:0,max:120,col:'255,212,150'});burst(P.x,P.y,30,'#ffd496',200,3);ftext(P.x,P.y-P.r-8,'Rempart','#ffd496',16);return}
  if(k==='berserk'){P.berT=8*bd;P.frzT=0;refreshStats();G.rings.push({x:P.x,y:P.y,t:0,max:160,col:'255,90,60'});burst(P.x,P.y,40,'#ff5a3c',260,4);ftext(P.x,P.y-P.r-8,'Fureur du berserker','#ff7a5a',16);return}
  if(k==='blizzard'){P.blizT=5*bd;P.blizTick=0;ftext(P.x,P.y-P.r-8,'Blizzard','#bfe4ff',16);return}
  if(k==='surcharge'){P.surT=6*bd;P.novaCd=Math.min(P.novaCd,0);refreshStats();G.rings.push({x:P.x,y:P.y,t:0,max:150,col:'190,160,255'});burst(P.x,P.y,36,'#c9a6ff',240,4);ftext(P.x,P.y-P.r-8,'Surcharge arcanique','#c9a6ff',16);return}
}
function ultTick(dt){G.inUlt=(G.inUlt|0)+1;try{ultTick0(dt)}finally{G.inUlt--}}
function ultTick0(dt){const P=G.P;
  if(P.rain>0){P.rain-=dt;P.rainT-=dt;if(P.rainT<=0){P.rainT=.12;const R=450*(1+S.skillRad/100),m=1+(S.ultPct||0)/100,c=[];
      for(const e of G.en)if(!e.dead&&Math.hypot(e.x-P.x,e.y-P.y)<R)c.push(e);
      const bi=c.findIndex(e=>e.type==='boss');for(let i=0;i<4&&c.length;i++){const e=c.splice(i===0&&bi>=0?bi:Math.floor(Math.random()*c.length),1)[0];G.rings.push({x:e.x,y:e.y,t:.2,max:30,col:'255,212,90'});G.hshake=Math.max(G.hshake||0,1.5);SND.play('rain');burst(e.x,e.y,6,'#ffd45a',160,2);spellCrit(e,S.nova*ULT_C.pluie*m)}}}
  if(P.meteors>0){P.meteorT-=dt;if(P.meteorT<=0){P.meteors--;P.meteorT=.35;const m=1+(S.ultPct||0)/100,R=150*(1+S.skillRad/100),c=G.en.filter(e=>!e.dead&&!e.downed&&Math.hypot(e.x-P.x,e.y-P.y)<520);
      const tg=c.find(e=>e.type==='boss')||c[Math.floor(Math.random()*c.length)],x=tg?tg.x:P.x+rand(-150,150),y=tg?tg.y:P.y+rand(-150,150);
      G.rings.push({x,y,t:0,max:R,col:'255,140,60'});G.rings.push({x,y,t:.15,max:R*.5,col:'255,220,140'});burst(x,y,40,'#ff8a3a',300,4);G.shake=Math.max(G.shake,10);G.hshake=Math.max(G.hshake||0,6);SND.play('boom');
      for(const e of G.en){if(!e.dead&&Math.hypot(e.x-x,e.y-y)<R+e.r)spellCrit(e,S.nova*ULT_C.meteores*m)}}}
  // v132 : Tempête de carreaux, Blizzard, fins des renforts
  if(P.stormT>0){P.stormT-=dt;P.stormTick-=dt;if(P.stormTick<=0){P.stormTick=.08;P.stormA+=.55;const m=1+(S.ultPct||0)/100;SND.play('rain');
      for(let i=0;i<4;i++){const a=P.stormA+i*Math.PI/2,crit=Math.random()*100<S.crit;G.shots.push({kind:'bolt',ult:1,x:P.x,y:P.y,vx:Math.cos(a)*640,vy:Math.sin(a)*640,a,d:S.nova*ULT_C.tempete*m*(crit?S.critDmg/100:1),crit,pierce:S.pierce+2,hit:new Set(),life:1*(1+S.skillRad/100)})}}}
  if(P.blizT>0){P.blizT-=dt;P.blizTick-=dt;if(P.blizTick<=0){P.blizTick=.3;const m=1+(S.ultPct||0)/100,R=320*(1+S.skillRad/100);G.rings.push({x:P.x,y:P.y,t:.1,max:R,col:'190,230,255'});
      for(let i=0;i<10&&G.parts.length<420;i++)G.parts.push({x:P.x+rand(-R,R),y:P.y+rand(-R,R),vx:rand(-20,20),vy:rand(30,70),life:.6,max:.6,col:'#e4f4ff',size:rand(1.5,3)});
      for(const e of G.en){if(e.dead||Math.abs(e.x-P.x)>R+e.r||Math.hypot(e.x-P.x,e.y-P.y)>R+e.r)continue;slowE(e,1.5);spellCrit(e,S.nova*ULT_C.blizzard*m)}}}
  let rs=false;for(const t of ['criT','hawkT','berT','surT']){if(P[t]>0){P[t]-=dt;if(P[t]<=0){P[t]=0;rs=true}}}
  if(P.wallT>0){P.wallT-=dt;if(P.wallT<=0){P.wallT=0;P.shield=Math.min(P.shield||0,S.abWard?S.hp*.3:0)}}
  if(rs)refreshStats();
}
function doPotion(){
  const P=G.P;if(P.down)return;if(G.potions<=0||P.hp>=S.hp)return;if(S.econ>0&&Math.random()*100<S.econ)ftext(P.x,P.y-P.r-24,'potion gardée','#9fe0a8',13);else G.potions--;SND.play('potion');
  if(S.exFer>0)P.ferT=4;if(S.exRage>0)G.ult=Math.min(ultNeed(),(G.ult||0)+Math.floor(S.exRage));if(sealOn('alch'))netFx('pot',P.x,P.y,SEAL_R);const h=S.hp*.45*(1+S.potHeal/100)*(P.psnT>0?.5:1);P.hp=Math.min(S.hp,P.hp+h);
  ftext(P.x,P.y-P.r-6,'+'+Math.round(h),'#5fbf7a',18);burst(P.x,P.y,16,'#5fbf7a',110);
}

