// Crypte des Cendres — main.js
/* ---------- Boucle ---------- */
function resize(){dpr=Math.min(devicePixelRatio||1,2);if(PX){PX.R.resize(innerWidth,innerHeight);return}cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr)}
addEventListener('resize',resize);resize();
let last=performance.now(),acc=0;const STEP=1/60;
let lastErr=null;
function noteErr(where,err){const m=`${where} : ${(err&&err.message)||err}`;if(lastErr===m)return;lastErr=m;console.error(where,err);try{localStorage.setItem('crypte-err',new Date().toLocaleString('fr-FR')+' · '+m)}catch(e){}}
function frame(now){
  requestAnimationFrame(frame);
  try{step(now)}catch(err){noteErr('boucle',err)}
}
// Changer d'appli : la mission se met en pause (le sac s'ouvre). Au retour, le rendu est reconstruit :
// certains téléphones perdent le rendu WebGL en arrière-plan, ce qui laissait un écran noir.
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){hiddenAt=performance.now();if(started&&G&&!G.over&&$('bag').hidden&&$('lvlup').hidden&&$('extract').hidden)openBag();return}
  last=performance.now();if(hiddenAt){hiddenAt=0;try{renewRender()}catch(err){noteErr('rendu',err)}}});
addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();try{renewRender()}catch(err){noteErr('rendu',err)}}});
function step(now){
  const dt=Math.min(.1,(now-last)/1000);last=now;
  const run=()=>started&&!G.over&&!G.hold&&(!paused||NET.on);
  if(run()){acc+=dt;let n=0;while(acc>=STEP&&n<6&&run()){update(STEP);acc-=STEP;n++}if(n>=6)acc=0}
  else{acc=0;if(G.over){for(const p of G.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}compact(G.parts,p=>p.life>0)}}
  render();hud();
}
function start(){
  let noGl=false;try{noGl=localStorage.getItem('crypte-nogl')==='1'}catch(e){}
  try{if(!NOGL&&!noGl&&initPixi())resize()}catch(err){console.error(err);PX=null}
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)$('keys').hidden=true;
  const pickCls=c=>{heroCls=c;try{localStorage.setItem('crypte-cls',c)}catch(e){}
    if(typeof netMe==='function')netMe();
    document.querySelectorAll('.cx-pick[data-c]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.c===c)));
    {const d=CLS[c].desc,k=d.indexOf('<b>');$('clsDesc').innerHTML=k>0?cxMore('cls',d.slice(0,k).trim(),d.slice(k).split(/(?=<b>Ultime)/).map(x=>`<p>${x.trim()}</p>`).join(''),'Compétences'):`<p class="cx-hint" style="margin:0">${d}</p>`}newGame();refreshMenus()};
  $('campBtn').onclick=openCamp;$('campBtn2').onclick=openCamp;$('closeCamp').onclick=closeCamp;
  document.querySelectorAll('.cx-pick[data-c]').forEach(b=>b.onclick=()=>pickCls(b.dataset.c));
  pickCls(heroCls);
  const go=()=>{started=true;paused=false;last=performance.now();missionToast()};window.goRun=go;
  const coopNew=()=>{newGame();if(NET.host&&NET.on)netStartHost()};
  $('startBtn').onclick=()=>{if(NET.guest&&NET.on)return;$('intro').hidden=true;coopNew();go()};
  $('againBtn').onclick=()=>{if(NET.guest&&NET.on){toast('Coopération : l\'hôte relance la partie.');return}$('over').hidden=true;coopNew();go()};
  $('changeBtn').onclick=()=>{$('over').hidden=true;started=false;paused=false;pickCls(heroCls);$('intro').hidden=false};
  requestAnimationFrame(frame);
}
start();
if(FAST){window.__G=()=>G;window.__dmg=(e,d)=>dmgEnemy(e,d,false);window.__wish=it=>wishMatch(it);window.__refresh=()=>refreshStats()}
