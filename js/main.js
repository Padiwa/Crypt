// Crypte des Cendres — main.js
/* ---------- Boucle ---------- */
function resize(){dpr=SET.eco?1:Math.min(devicePixelRatio||1,2);if(PX){PX.R.resize(innerWidth,innerHeight);return}cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr)}
addEventListener('resize',resize);resize();
let last=performance.now(),acc=0;const STEP=1/60;
let lastErr=null;
function noteErr(where,err){const m=`${where} : ${(err&&err.message)||err}`;if(lastErr===m)return;lastErr=m;console.error(where,err);try{localStorage.setItem('crypte-err',new Date().toLocaleString('fr-FR')+' · '+m)}catch{}}
/* Économie d'énergie (v134). L'accueil, le Camp, l'écran Mission et l'écran de fin couvrent tout l'écran et cachent le jeu : on n'y dessine rien et la boucle
   ne se réveille que 4 fois par seconde. Partie figée (pause, montée de niveau, fin de manche ou de partie) : 5 images par seconde
   (20 pendant l'écran de fin, le temps que les éclats retombent). Réglage « Économie de batterie » : 30 images par seconde en mission
   et image en résolution 1×. La simulation garde son pas fixe de 1/60 s. */
const COVER=['intro','camp','mission','over'].map(id=>$(id));
let lastDraw=0,drawN=0,sleepT=0;
function frame(now){
  sleepT=0;
  if(COVER.some(e=>!e.hidden)&&!(started&&G&&!G.over)){last=now;sleepT=setTimeout(()=>{sleepT=0;requestAnimationFrame(frame)},250);return}
  requestAnimationFrame(frame);
  try{step(now)}catch(err){noteErr('boucle',err)}
}
// Réveil immédiat : au lancement d'une mission et à chaque geste (toucher, touche, curseur), la prochaine image est dessinée tout de suite.
function wakeLoop(){lastDraw=0;if(sleepT){clearTimeout(sleepT);sleepT=0;requestAnimationFrame(frame)}}
for(const ev of['pointerdown','keydown','input','change','resize'])addEventListener(ev,wakeLoop,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wakeLoop()});
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
  const live=run();
  if(live){acc+=dt;let n=0;while(acc>=STEP&&n<6&&run()){update(STEP);acc-=STEP;n++}if(n>=6)acc=0}
  else{acc=0;if(G.over){for(const p of G.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}compact(G.parts,p=>p.life>0)}}
  const gap=live?(SET.eco?1000/30-4:0):G.over?50:200;
  if(now-lastDraw>=gap){render();hud();lastDraw=now;drawN++}
}
function start(){
  let noGl=false;try{noGl=localStorage.getItem('crypte-nogl')==='1'}catch{}
  try{if(!NOGL&&!noGl&&initPixi())resize()}catch(err){console.error(err);PX=null}
  if(!matchMedia('(hover:hover) and (pointer:fine)').matches)$('keys').hidden=true;
  window.pickCls=c=>{heroCls=c;try{localStorage.setItem('crypte-cls',c)}catch{}
    if(typeof netMe==='function')netMe();
    newGame();refreshMenus();if(!$('camp').hidden)drawCamp()};
  // Fin de mission : deux boutons (v133). « Retour au Camp » termine la partie et ramène à l'accueil du jeu, barre d'onglets comprise
  // (c'était « Changer de héros ») ; « Recommencer » relance la même mission. Avant, « Aller au Camp » laissait l'écran de fin ouvert
  // sous le Camp : la barre d'onglets restait cachée et l'onglet Combat ramenait à l'écran de fin.
  $('campBtn2').onclick=()=>{$('over').hidden=true;$('bossBar').hidden=true;$('objBar').hidden=true;started=false;paused=false;resetJoy();
    pickCls(heroCls);$('intro').hidden=false;if(typeof refreshCoopUi==='function')refreshCoopUi();navSync()};
  pickCls(heroCls);
  const go=()=>{started=true;paused=false;last=performance.now();wakeLoop()};window.goRun=go;
  const coopNew=()=>{newGame();if(NET.host&&NET.on)netStartHost()};
  const startRun=()=>{if(NET.guest&&NET.on)return;$('intro').hidden=true;$('mission').hidden=true;coopNew();go()};
  $('startBtn').onclick=startRun;$('startBtn2').onclick=startRun;
  $('againBtn').onclick=()=>{if(NET.guest&&NET.on){toast('Coopération : l\'hôte relance la partie.');return}$('over').hidden=true;coopNew();go()};
  requestAnimationFrame(frame);
}
start();
if(FAST){window.__G=()=>G;window.__dmg=(e,d)=>dmgEnemy(e,d,false);window.__wish=it=>wishMatch(it);window.__refresh=()=>refreshStats()}
