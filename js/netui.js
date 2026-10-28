// Crypte des Cendres — netui.js : écran de coopération (salon, codes, QR code, caméra). Découpé de net.js en v145.
/* ---------- Écran de connexion ---------- */
function loadQr(){return new Promise(res=>{if(window.qrcode)return res(true);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';s.onload=()=>res(!!window.qrcode);s.onerror=()=>res(false);document.head.appendChild(s)})}
function qrSvg(text){try{const q=qrcode(0,'L');q.addData(text);q.make();return q.createSvgTag({cellSize:3,margin:2,scalable:true})}catch{return ''}}
const COOP_SVG='<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/></svg>';
function refreshCoopUi(){const b=$('coopBtn'),n=coopN(),live=NET.on||(NET.host&&NET.relay==='on'&&RL.code);
  if(b){b.innerHTML=`<span class="home__sbi">${COOP_SVG}</span><small>${NET.on?`Coop · ${n}`:live?`Code ${RL.code}`:'Coop'}</small>${live?'<span class="cx-dot" aria-hidden="true"></span>':''}`;b.classList.toggle('is-live',!!live)}
  for(const id of ['startBtn','startBtn2']){const sb=$(id);if(sb&&NET.guest&&NET.on){sb.disabled=true;sb.innerHTML=`En attente<small>l'hôte lance${NET.hostMode?' · '+(MODES[NET.hostMode.mode]||MODES.survie).n:''}</small>`}else if(sb&&sb.disabled&&!NET.guest){sb.disabled=false;refreshMenus()}}}
function codeBox(lab,code,share){return `<div class="coopcode"><span class="cx-hint" style="margin:0">${lab}</span><div class="qr" id="coopQr"></div>
  <textarea readonly id="coopOut" rows="3" aria-label="${lab}">${code}</textarea>
  <div class="actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-coop="copy">Copier</button>${share&&navigator.share?'<button class="cx-btn cx-btn--sm" data-coop="share">Partager</button>':''}</div></div>`}
function pasteBox(lab,btn,act){return `<div class="coopcode"><span class="cx-hint" style="margin:0">${lab}</span><textarea id="coopIn" rows="3" placeholder="Colle le code ici" aria-label="${lab}"></textarea>
  <div class="actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-coop="paste">Coller</button>${camOk()?`<button class="cx-btn cx-btn--sm" data-coop="scan" data-then="${act}">Scanner avec la caméra</button>`:''}<button class="cx-btn cx-btn--sm cx-btn--primary" data-coop="${act}">${btn}</button></div>
  ${camBox()}</div>`}
const camBox=()=>`<div class="camwrap" id="coopCamWrap" hidden><div class="camv"><video id="coopCam" playsinline muted></video><span class="camframe" aria-hidden="true"></span></div><p class="cx-hint" id="coopCamTxt" style="margin:0">Montre le QR code à la caméra, bien à plat et sans reflet.</p><div class="actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-coop="scanstop">Arrêter la caméra</button></div></div>`;
const missionTxt=o=>`${MODES[o.mode]?MODES[o.mode].n:'Survie'} · niveau ${o.lv} · ${o.dn}`;
const rosterHtml=list=>`<ul class="coopros">${list.map(r=>{const w=who(r.slot),me=r.slot===(NET.host?0:NET.slot),c=w.cls||r.cls;return `<li><span class="dotc" style="background:${SLOT_C[r.slot]||'#888'}"></span>${prBadge(w.pr)}<b class="coopname">${esc(w.name)}</b><span class="cooptag">${[r.slot===0?'hôte':'',me?'toi':''].filter(Boolean).join(' · ')}</span><span class="cx-hint" style="margin:0">${c&&CLS[c]?CLS[c].n:'…'}</span>${NET.host&&r.slot&&!started?`<button class="cx-btn cx-btn--sm cx-btn--ghost kickb" data-coop="kick" data-arg="${r.slot}" aria-label="Retirer ${esc(w.name)} de la partie">Retirer</button>`:''}</li>`}).join('')}</ul>`;
const RULES=`<p class="cx-hint" style="margin:0">Jusqu'à ${NET_MAX} joueurs. Chacun garde son équipement et son butin, qui tombe séparément pour chaque joueur. Par joueur en plus, les monstres ont 50 % de vie en plus et sont 40 % plus nombreux. Un héros à terre se relève 8 s plus tard près d'un partenaire debout ; si tout le monde tombe, la mission échoue.</p>`;
// Lien d'invitation du QR code : la page du jeu avec #coop=1234 (ouvert, il rejoint tout seul), sinon le code seul (lu par le scanner du jeu).
const coopLink=code=>{try{if(/^https?:$/.test(location.protocol)&&window.top===window)return `${location.origin}${location.pathname}#coop=${code}`}catch{}return 'CRYPTE:'+code};
function drawCoop(){const body=$('coopBody');if(!body||$('coop').hidden)return;camStop();let h='';
  const steps=`<ol class="coopsteps"><li>Tous les appareils sont sur le <b>même wifi</b> (ou la même box).</li><li>Un joueur <b>héberge</b> et affiche un QR code d'invitation ; un autre le <b>scanne avec sa caméra</b> (ou colle le code).</li><li>Celui qui rejoint affiche son QR code de réponse : l'hôte le <b>scanne avec sa caméra ou sa webcam</b>, la connexion se valide toute seule.</li><li>L'hôte ajoute ainsi jusqu'à ${NET_MAX-1} joueurs, un par un, puis lance la mission.</li></ol>`;
  const manual=`<div class="actions" style="margin:0"><button class="cx-btn${RELAY_URL?'':' cx-btn--primary'}" data-coop="host">Héberger${RELAY_URL?' par QR codes':' une partie'}</button><button class="cx-btn" data-coop="join">Rejoindre${RELAY_URL?' par QR code':''}</button></div>${NET.state==='joinIn'?pasteBox('Colle ou scanne le code de l\'hôte','Rejoindre','joingo'):''}`;
  if(NET.host){const open=NET.peers.filter(p=>p.state==='open'),pend=NET.peers.find(p=>p.state!=='open'&&!p.rid),arriving=NET.peers.filter(p=>p.rid&&p.state!=='open').length,full=1+NET.peers.length>=NET_MAX,relay=NET.relay&&NET.relay!=='off';
    const top=NET.relay==='on'?`<div class="code4box"><span class="cx-hint" style="margin:0">Code de la partie</span><b class="code4big" id="coopCode4" aria-label="Code ${RL.code.split('').join(' ')}">${RL.code}</b><div class="qr" id="coopQr4"></div>
        <span class="cx-hint" style="margin:0;text-align:center">${full?'La partie est complète.':`Les autres touchent <b>Coop</b> et tapent ce code, ou scannent le QR code : ils arrivent tout seuls. ${NET_MAX-1-NET.peers.length>1?`Encore ${NET_MAX-1-NET.peers.length} places.`:'Encore une place.'}`}</span><div class="actions" style="margin:0;justify-content:center">${navigator.share?'<button class="cx-btn cx-btn--sm" data-coop="share4">Partager le code</button>':''}<button class="cx-btn cx-btn--sm" data-coop="newcode">Nouveau code</button><button class="cx-btn cx-btn--sm" data-coop="shut">Fermer l'accès</button></div></div>`
      :NET.relay==='wait'?'<p class="cx-hint" style="margin:0">Ouverture de la partie…</p>'
      :NET.relay==='closed'?`<div class="code4box"><span style="text-align:center">Accès fermé : plus personne ne peut arriver avec un code. Les joueurs déjà là restent.</span><div class="actions" style="margin:0;justify-content:center"><button class="cx-btn cx-btn--sm cx-btn--primary" data-coop="newcode">Rouvrir avec un nouveau code</button></div></div>`:'';
    h=`<section class="cx-section"><h3 class="cx-section__label">Ta partie · ${1+open.length} / ${NET_MAX} joueurs</h3>${top}${rosterHtml(rosterList())}
      ${arriving?`<p class="cx-hint" style="margin:0">${arriving} joueur${arriving>1?'s':''} en train d'arriver…</p>`:''}
      ${!relay&&!pend&&!full?`<div class="actions" style="margin:0"><button class="cx-btn${open.length?'':' cx-btn--primary'}" data-coop="add">Inviter un joueur</button></div>`:''}
      <div class="setrow"><div><b>Mission</b><span>${missionTxt(lobbyInfo())}. Le mode, le niveau et la difficulté se choisissent sur l'écran Mission (touche la carte de mission de l'accueil)${open.length?'':' ; la Brèche demande au moins un autre joueur'}.</span></div></div>
      ${open.length?`<p style="margin:0">Ferme cette fenêtre et touche « Lancer » : vous partez ensemble. Chacun joue son héros et peut en changer entre deux missions.</p>`:''}${dropHtml()}${RULES}</section>`;
    if(pend){const n=pend.slot+1;
      if(pend.state==='offer')h+='<p class="cx-hint">Préparation du code…</p>';
      else h+=`<section class="cx-section"><h3 class="cx-section__label">Inviter le joueur ${n}</h3>${codeBox('1. Fais scanner ou envoie ce code au joueur '+n,pend.code,true)}${pasteBox('2. Colle ou scanne son code de réponse','Valider','answer')}${pend.state==='connecting'?'<p class="cx-hint" style="margin:0">Connexion en cours…</p>':''}<div class="actions"><button class="cx-btn cx-btn--sm" data-coop="cancel">Annuler cette invitation</button></div></section>`}
    else if(relay&&!full)h+=cxMore('coop_man1','Un joueur sans internet ?',`<p class="cx-hint" style="margin:0">Invite-le par QR codes : il scanne le tien, puis tu scannes sa réponse.</p><div class="actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-coop="add">Inviter par QR codes</button></div>`,'Afficher');
    h+=`<div class="actions"><button class="cx-btn cx-btn--sm" data-coop="quit">Fermer la partie</button></div>`}
  else if(NET.guest&&NET.on)h=`<section class="cx-section"><h3 class="cx-section__label">Connecté</h3>${rosterHtml(NET.roster.length?NET.roster:[{slot:0,cls:NET.hostCls},{slot:NET.slot,cls:heroCls}])}<p style="margin:0">${NET.hostMode?`Mission choisie par l'hôte : ${missionTxt(NET.hostMode)}. `:''}Attends que l'hôte lance la mission. Tu peux changer de héros d'ici là.</p>${dropHtml()}${RULES}<div class="actions"><button class="cx-btn cx-btn--sm" data-coop="quit">Se déconnecter</button></div></section>`;
  else if(NET.guest&&(NET.state==='rjoin'||NET.state==='connecting'))h=`<section class="cx-section"><h3 class="cx-section__label">${NET.retry?'Reconnexion à':'Rejoindre'} la partie ${RL.code}</h3><p style="margin:0">${NET.state==='rjoin'?'Recherche de la partie…':'Connexion à l\'hôte…'}${NET.retry&&NET.retry.n?` (essai ${NET.retry.n+1})`:''}</p>${dropHtml()}<div class="actions"><button class="cx-btn cx-btn--sm" data-coop="quit">Annuler</button></div></section>`;
  else if(NET.retry&&!NET.host)h=`<section class="cx-section"><h3 class="cx-section__label">Reconnexion à la partie ${NET.retry.code}</h3><p style="margin:0">Nouvel essai dans un instant…</p>${dropHtml()}<div class="actions"><button class="cx-btn cx-btn--sm" data-coop="quit">Annuler</button></div></section>`;
  else if(NET.guest&&NET.state==='answer')h='<p class="cx-hint">Préparation de la réponse…</p>';
  else if(NET.guest&&NET.state==='showAnswer')h=`<section class="cx-section"><h3 class="cx-section__label">Rejoindre</h3>${codeBox('Montre ou envoie ce code de réponse à l\'hôte',NET.code,true)}<p class="cx-hint" style="margin:0">La connexion s'établit dès que l'hôte l'a validé.</p><div class="actions"><button class="cx-btn cx-btn--sm" data-coop="quit">Annuler</button></div></section>`;
  else if(RELAY_URL){if(NET.state==='joinIn')moreOpen.coop_man=true;
    h=`<section class="cx-section"><h3 class="cx-section__label">Jouer à plusieurs</h3><p style="margin:0">Jusqu'à ${NET_MAX} joueurs sur le <b>même wifi</b>. Un joueur crée la partie et reçoit un <b>code à 4 chiffres</b> ; les autres le tapent ci-dessous. Internet ne sert qu'au moment de se connecter.</p>
        <div class="actions" style="margin:0"><button class="cx-btn cx-btn--primary" data-coop="create">Créer une partie</button></div></section>
      <section class="cx-section"><h3 class="cx-section__label">Rejoindre une partie</h3><div class="codejoin"><input id="coopCode" class="code4in" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" enterkeyhint="go" placeholder="Code à 4 chiffres" aria-label="Code de la partie, 4 chiffres"><button class="cx-btn cx-btn--primary" data-coop="joincode">Rejoindre</button></div>
        ${camOk()&&NET.state!=='joinIn'?`<div class="actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-coop="scan" data-then="code">Scanner le QR code de l'hôte</button></div>${camBox()}`:''}</section>
      ${cxMore('coop_man','Sans internet : connexion par QR codes',`${steps}${manual}`,'Afficher')}`}
  else h=`<section class="cx-section"><h3 class="cx-section__label">Jouer à plusieurs</h3>${steps}${manual}</section>`;
  if(NET.err)h+=`<p class="empty" style="font-size:13px;color:#ff8a80">${NET.err}</p>`;
  if(!NET.on&&!NET.host&&!NET.guest&&!NET.retry)h+=dropHtml();
  body.innerHTML=h;
  const code=NET.host?(NET.peers.find(p=>(p.state==='waitAnswer'||p.state==='connecting')&&!p.rid)||{}).code:NET.code;
  const qr=$('coopQr');if(qr&&code)loadQr().then(ok=>{if(ok&&$('coopQr'))$('coopQr').innerHTML=qrSvg(code)});
  const q4=$('coopQr4');if(q4&&RL.code){const c=RL.code;loadQr().then(ok=>{if(ok&&$('coopQr4')&&RL.code===c)$('coopQr4').innerHTML=qrSvg(coopLink(c))})}}
/* Lecture du QR code par la caméra : détecteur du navigateur s'il existe (Android, Mac), sinon jsQR (webcam de PC, tous navigateurs). */
const camOk=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
function loadJsQr(){return new Promise(res=>{if(window.jsQR)return res(true);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';s.onload=()=>res(!!window.jsQR);s.onerror=()=>res(false);document.head.appendChild(s)})}
let camStream=null;
function camStop(){if(camStream){camStream.getTracks().forEach(t=>t.stop());camStream=null}const w=$('coopCamWrap');if(w)w.hidden=true;const v=$('coopCam');if(v)v.srcObject=null}
async function qrReader(){
  if('BarcodeDetector' in window){try{const f=await BarcodeDetector.getSupportedFormats();if(f.includes('qr_code')){const det=new BarcodeDetector({formats:['qr_code']});return async v=>{const r=await det.detect(v);return r.length?r[0].rawValue:null}}}catch{}}
  if(!await loadJsQr())return null;
  const c=document.createElement('canvas'),g=c.getContext('2d',{willReadFrequently:true});
  return async v=>{const w=v.videoWidth,h=v.videoHeight;if(!w||!h)return null;const k=Math.min(1,960/Math.max(w,h));c.width=Math.round(w*k);c.height=Math.round(h*k);
    g.drawImage(v,0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height),r=jsQR(d.data,c.width,c.height,{inversionAttempts:'attemptBoth'});return r&&r.data?r.data:null}}
async function coopScan(then){const v=$('coopCam'),w=$('coopCamWrap');if(!v||!w)return;camStop();
  try{camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
  catch{NET.err='Caméra indisponible ou refusée : autorise la caméra pour ce site, ou colle le code à la place.';drawCoop();return}
  v.srcObject=camStream;w.hidden=false;try{await v.play()}catch{}
  const read=await qrReader();if(!read){camStop();NET.err='Lecteur de QR code indisponible (hors connexion ?) : colle le code à la place.';drawCoop();return}
  let busy=false;const tick=async()=>{if(!camStream||w.hidden)return;if(!busy){busy=true;try{const code=await read(v);const c4=code&&RELAY_URL?((code.match(/(?:#coop=|^CRYPTE:)(\d{4})(?!\d)/)||code.trim().match(/^(\d{4})$/)||[])[1]):null;
        if(c4){camStop();SND.play('pick2');netJoinCode(c4);return}
        if(code&&/^[ZP][A-Za-z0-9_-]{40,}$/.test(code.trim())){camStop();SND.play('pick2');const box=$('coopIn');if(box)box.value=code.trim();
        if(then==='answer')netAnswerIn(code.trim());else if(then==='joingo')netJoin(code.trim());return}}catch{}busy=false}setTimeout(tick,120)};tick()}
function openCoop(){$('coop').hidden=false;NET.err='';drawCoop()}
addEventListener('pagehide',()=>{if(NET.on)netSend({t:'bye'})});
(function wireCoop(){
  const ov=document.createElement('div');ov.className='overlay';ov.id='coop';ov.hidden=true;ov.style.zIndex='40';
  ov.innerHTML=`<section class="cx-sheet" role="dialog" aria-label="Coopération"><div class="cx-sheet__grip"></div><header class="cx-sheet__head"><h2 class="cx-sheet__title">Coopération</h2><div class="cx-sheet__aside"><button class="cx-icon-btn cx-icon-btn--ghost" id="closeCoopX" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div></header><div class="cx-sheet__body" id="coopBody"></div><footer class="cx-sheet__foot"><button class="cx-btn cx-btn--primary" id="closeCoop">Fermer</button></footer></section>`;
  document.body.appendChild(ov);
  const close=()=>{ov.hidden=true;camStop()};
  $('closeCoopX').onclick=close;$('closeCoop').onclick=close;
  $('coopBody').addEventListener('click',async e=>{const b=e.target.closest('[data-coop]');if(!b)return;const a=b.dataset.coop;NET.err='';
    if(!('RTCPeerConnection' in window)){NET.err='Ce navigateur ne permet pas la coopération.';drawCoop();return}
    if(a==='create')netHostCode();else if(a==='joincode')netJoinCode(($('coopCode')||{}).value);
    else if(a==='newcode')relayNewCode();else if(a==='shut')relayShut();else if(a==='kick')netKick(+b.dataset.arg);
    else if(a==='share4'){try{await navigator.share({title:'Crypte des Cendres',text:`Rejoins ma partie de Crypte des Cendres : code ${RL.code}`,...(/^CRYPTE:/.test(coopLink(RL.code))?{}:{url:coopLink(RL.code)})})}catch{}}
    else if(a==='host')netHost();else if(a==='add')netAddPeer();else if(a==='cancel')netCancelPending();
    else if(a==='join'){NET.state='joinIn';drawCoop()}
    else if(a==='joingo'){const c=$('coopIn').value;if(c.trim())netJoin(c)}
    else if(a==='answer'){const c=$('coopIn').value;if(c.trim())netAnswerIn(c)}
    else if(a==='copy'){const t=$('coopOut');try{await navigator.clipboard.writeText(t.value);b.textContent='Copié'}catch{t.select()}}
    else if(a==='share'){try{await navigator.share({text:$('coopOut').value})}catch{}}
    else if(a==='paste'){try{$('coopIn').value=await navigator.clipboard.readText()}catch{$('coopIn').focus()}}
    else if(a==='scan')coopScan(b.dataset.then);
    else if(a==='scanstop')camStop();
    else if(a==='quit'){if(NET.on)netSend({t:'bye',end:1});netReset();NET.retry=null;NET.drop=null;clearTimeout(RL.reT);coopForget();refreshCoopUi();drawCoop()}});
  $('coopBody').addEventListener('input',e=>{if(e.target.id!=='coopCode')return;const v=e.target.value.replace(/\D/g,'').slice(0,4);if(e.target.value!==v)e.target.value=v;if(v.length===4)netJoinCode(v)});
  $('coopBody').addEventListener('keydown',e=>{if(e.target.id==='coopCode'&&e.key==='Enter')netJoinCode(e.target.value)});
  // Lien d'invitation (#coop=1234) : la page ouvre la coopération et rejoint la partie toute seule.
  // (à l'ouverture de la page, ou si le lien est ouvert dans l'onglet où le jeu tourne déjà)
  const coopHash=delay=>{const m=location.hash.match(/^#coop=(\d{4})$/);if(!m||!RELAY_URL)return;try{history.replaceState(null,'',location.pathname+location.search)}catch{}
    const go=()=>{if(started||(NET.on&&NET.guest))return;openCoop();netJoinCode(m[1])};delay?addEventListener('load',()=>setTimeout(go,delay)):go()};
  coopHash(300);addEventListener('hashchange',()=>coopHash(0));
  // Rechargement pendant une partie à code (mise à jour, page rechargée) : l'hôte rouvre sa salle sous le même code, l'invité la rejoint.
  {let c=null;try{c=JSON.parse(sessionStorage.getItem(COOP_SS)||'null')}catch{}
    if(c&&RELAY_URL&&Date.now()-(c.at||0)<10*60*1000&&!/^#coop=/.test(location.hash))addEventListener('load',()=>setTimeout(()=>{if(NET.on||NET.host||NET.guest||started)return;
      if(c.r==='h'&&c.code&&c.key){netHostCode(c.code,c.key);toast('Partie rouverte sous le code '+c.code+'.',true)}else if(c.r==='g'&&c.code){NET.retry={code:c.code,n:0};netJoinCode(c.code,true)}},500))}
  const btn=document.createElement('button');btn.className='home__sb home__sb--coop';btn.id='coopBtn';btn.setAttribute('aria-label','Coopération');btn.innerHTML='Coop';btn.onclick=openCoop;
  const g=$('guideBtn');if(g)g.before(btn);refreshCoopUi();
})();
