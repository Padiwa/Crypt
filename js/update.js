/* ---------- Mises à jour de l'application (PWA) ----------
   Le service worker (sw.js) active tout de suite une nouvelle version. Ici on la détecte :
   au lancement, quand l'appli revient au premier plan et toutes les 30 min, puis on propose
   de recharger, seulement hors mission (écran d'accueil, pause, fin de partie, Camp). */
const UPD={ok:false,ready:false,reg:null,ver:'',state:'',msg:''};
(function(){
  const bar=document.createElement('div');bar.id='updBar';bar.hidden=true;bar.setAttribute('role','status');
  bar.innerHTML='<span><b>Nouvelle version du jeu</b> · recharge pour en profiter, ta progression est gardée.</span><button type="button" class="cx-btn cx-btn--sm cx-btn--primary" id="updGo">Mettre à jour</button><button type="button" class="cx-icon-btn cx-icon-btn--ghost" id="updX" aria-label="Plus tard"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>';
  document.body.appendChild(bar);
  let later=false;
  document.getElementById('updGo').onclick=()=>location.reload();
  document.getElementById('updX').onclick=()=>{later=true;bar.hidden=true};
  // Hors mission seulement : on ne coupe jamais une partie en cours.
  const calm=()=>!started||!G||G.over||!$('bag').hidden||!$('camp').hidden||!$('intro').hidden;
  setInterval(()=>{bar.hidden=!(UPD.ready&&!later&&calm())},1000);
  const askVer=()=>{const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(!c)return;const ch=new MessageChannel();ch.port1.onmessage=e=>{UPD.ver=e.data||'';refreshSet()};c.postMessage({type:'version'},[ch.port2])};
  const refreshSet=()=>{if(typeof drawSettings==='function'&&$('settings')&&!$('settings').hidden)drawSettings()};
  const found=()=>{UPD.ready=true;UPD.state='ready';refreshSet()};
  UPD.check=async()=>{if(!UPD.reg){UPD.state='off';refreshSet();return}
    UPD.state='checking';refreshSet();
    try{await UPD.reg.update()}catch(e){UPD.state='error';refreshSet();return}
    setTimeout(()=>{if(!UPD.ready){UPD.state='uptodate';refreshSet()}},2500)};
  if(!('serviceWorker' in navigator)||!(location.protocol==='https:'||location.hostname==='localhost')||/claude/.test(location.host)){UPD.state='off';return}
  UPD.ok=true;
  const hadCtl=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadCtl)found();askVer()});
  addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(reg=>{
    UPD.reg=reg;askVer();
    if(reg.waiting&&hadCtl)found();
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)found()})});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
    setInterval(()=>reg.update().catch(()=>{}),30*60*1000);
  }).catch(()=>{UPD.state='off'}));
})();
function updSection(){
  const st={checking:'Recherche…',uptodate:'Le jeu est à jour.',ready:'Une nouvelle version est prête.',error:'Impossible de vérifier (hors connexion ?).',off:'Mises à jour gérées par la page (pas d\'application installée ici).'}[UPD.state]||'';
  return `<section class="cx-section"><h3 class="cx-section__label">Application</h3>
    <div class="setrow"><div><b>Version ${UPD.ver?UPD.ver.replace('crypte-v',''):'—'}</b><span id="updSt">${st}</span></div>${UPD.ready?'<button class="cx-btn cx-btn--sm cx-btn--primary" id="setUpdGo">Mettre à jour</button>':UPD.ok?'<button class="cx-btn cx-btn--sm" id="setUpd">Rechercher</button>':''}</div>
    ${(()=>{let e='';try{e=localStorage.getItem('crypte-err')||''}catch(x){}return e?`<p class="cx-hint" style="margin:0;user-select:text">Dernier incident : ${e.replace(/[<>&]/g,'')}</p>`:''})()}</section>`}
