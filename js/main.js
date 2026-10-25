// Crypte des Cendres — main.js
/* ---------- Boucle ---------- */
function resize(){dpr=Math.min(devicePixelRatio||1,2);if(PX){PX.R.resize(innerWidth,innerHeight);return}cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr)}
addEventListener('resize',resize);resize();
let last=performance.now(),acc=0;const STEP=1/60;
function frame(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  if(started&&!paused&&!G.over){acc+=dt;let n=0;while(acc>=STEP&&n<6&&started&&!paused&&!G.over){update(STEP);acc-=STEP;n++}if(n>=6)acc=0}
  else{acc=0;if(G.over){for(const p of G.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}compact(G.parts,p=>p.life>0)}}
  render();hud();
  requestAnimationFrame(frame);
}
function start(){
  let noGl=false;try{noGl=localStorage.getItem('crypte-nogl')==='1'}catch(e){}
  try{if(!NOGL&&!noGl&&initPixi())resize()}catch(err){console.error(err);PX=null}
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)$('keys').hidden=true;
  const pickCls=c=>{heroCls=c;try{localStorage.setItem('crypte-cls',c)}catch(e){}
    document.querySelectorAll('.cls[data-c]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.c===c)));
    $('clsDesc').innerHTML=CLS[c].desc;newGame();refreshMenus()};
  $('campBtn').onclick=openCamp;$('campBtn2').onclick=openCamp;$('closeCamp').onclick=closeCamp;
  document.querySelectorAll('.cls[data-c]').forEach(b=>b.onclick=()=>pickCls(b.dataset.c));
  pickCls(heroCls);
  const go=()=>{started=true;paused=false;last=performance.now();missionToast()};
  $('startBtn').onclick=()=>{$('intro').hidden=true;newGame();go()};
  $('againBtn').onclick=()=>{$('over').hidden=true;newGame();go()};
  $('changeBtn').onclick=()=>{$('over').hidden=true;started=false;paused=false;pickCls(heroCls);$('intro').hidden=false};
  requestAnimationFrame(frame);
}
start();
if(FAST){window.__G=()=>G;window.__dmg=(e,d)=>dmgEnemy(e,d,false);window.__wish=it=>wishMatch(it);window.__refresh=()=>refreshStats()}
