// Crypte des Cendres — nav.js : retour arrière un niveau à la fois (bouton Retour d'Android, Échap) et raccourcis du Camp.
// Niveaux : 4 fiche ancrée · 3 feuille de choix, Réglages, Coop · 2 onglet du Camp, écran Mission ou Pause · 1 accueil ou partie (rien à fermer).
// Touches 1 à 5 au Camp : les onglets de la barre du bas.
let navDepth=0,navWas={};
function navPush(k){try{history.pushState({crypte:++navDepth,k},'')}catch{}}
const shown=id=>{const el=$(id);return !!el&&!el.hidden};
// Ferme le niveau le plus haut ouvert ; renvoie false s'il n'y avait rien à fermer.
function navClose(){
  if(shown('pickSheet')){closePick();return true}
  if(shown('settings')){closeSettings();return true}
  if(shown('coop')){const b=$('closeCoopX');if(b)b.click();else $('coop').hidden=true;return true}
  if(shown('camp')){
    if(shown('campDock')){if((campTab==='mods'||campTab==='pets')&&modSel){modSel=null}else campSel=null;drawCamp();return true}
    if(campBack){const B=campBack;campBack=null;campTab=B.tab;campSel=B.sel;drawCamp();$('campBody').parentElement.scrollTop=B.scroll||0;return true}
    if(campTab==='equip'&&heroSub!=='main'){heroSub='main';drawCamp();return true}
    if(campTab==='mods'||campTab==='pets'){modSel=null;campTab='equip';heroSub='main';drawCamp();return true}
    closeCamp();return true}
  if(shown('mission')){closeMission();return true}
  if(shown('bag')){if(shown('bagDock')){runSel=null;modSel=null;drawBag();return true}closeBag();return true}
  return false}
addEventListener('popstate',()=>{navDepth=Math.max(0,navDepth-1);
  if(navClose())return;
  if(navDepth>0){try{history.back()}catch{}return}
  // racine : on reste dans l'appli, un second Retour quitte
  const now=Date.now();if(now-(navRootT||0)<3000){try{history.back()}catch{}return}
  navRootT=now;navPush('root');if(typeof cxUndo==='function')cxUndo('Touche encore Retour pour quitter le jeu.',null)});
let navRootT=0;
// Pousse une entrée d'historique quand un niveau s'ouvre (observé à chaque image légère).
function navWatch(){const st={pick:shown('pickSheet'),set:shown('settings'),coop:shown('coop'),camp:shown('camp'),msn:shown('mission'),bag:shown('bag'),cdock:shown('campDock'),bdock:shown('bagDock')};
  for(const k in st)if(st[k]&&!navWas[k])navPush(k);navWas=st}
setInterval(navWatch,150);
addEventListener('keydown',e=>{
  const tag=(document.activeElement&&document.activeElement.tagName)||'',typing=/INPUT|TEXTAREA|SELECT/.test(tag);
  if(e.key==='Escape'){if(navClose()){e.preventDefault();e.stopImmediatePropagation()}else if(typing)document.activeElement.blur();return}
  if(typing||!shown('camp')||shown('pickSheet')||shown('settings'))return;
  const tabs=[...document.querySelectorAll('#tabbar [data-nav]')];
  if(/^[1-9]$/.test(e.key)&&tabs[+e.key-1]){tabs[+e.key-1].click();e.preventDefault();return}
  if(e.key==='/'){const s=document.querySelector('#campBody [data-inv="q"]');if(s){s.focus();e.preventDefault()}return}
  if(isCoffre()){const L=invList('equip');if(!L.length)return;const i=L.findIndex(isSel);
    const g=document.querySelector('#invGrid .grid'),cols=g?Math.max(1,getComputedStyle(g).gridTemplateColumns.split(' ').length):1;
    let n=null;
    if(e.key==='['||e.key==='ArrowLeft')n=Math.max(0,i-1);else if(e.key===']'||e.key==='ArrowRight')n=Math.min(L.length-1,i+1);
    else if(e.key==='ArrowDown')n=i<0?0:Math.min(L.length-1,i+cols);else if(e.key==='ArrowUp')n=i<0?0:Math.max(0,i-cols);
    else if(e.key==='Enter'&&i>=0){const b=document.querySelector('#campDock [data-cact="equip"]');if(b){b.click();e.preventDefault()}return}
    if(n!=null){campSel=selOf(L[n]);drawCamp();const c=document.querySelector(L[n].wid?`#invGrid [data-wsel="${L[n].wid}"]`:`#invGrid [data-stash="${L[n].id}"]`);if(c)c.scrollIntoView({block:'nearest'});e.preventDefault();e.stopImmediatePropagation()}}
},true);
