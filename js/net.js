// Crypte des Cendres — net.js : coopération jusqu'à 4 joueurs en pair à pair (WebRTC), sans serveur.
// L'hôte fait tourner les monstres et relie chaque invité (connexion en étoile) ; chacun simule son propre héros,
// ses tirs et son butin (instancié). Les invités ne se connectent qu'à l'hôte, qui relaie les héros des autres.
const NET={on:false,host:false,guest:false,pc:null,dc:null,state:'idle',code:'',err:'',hits:[],ebUsed:new Set(),snap:null,tick:null,
  peers:[],slot:0,roster:[],hostCls:null,hostName:'',hostPr:0,via:'',hostBgAt:0,ready:false};
const NET_MAX=4; // joueurs, hôte compris
const NET_V=9;
const NET_TIMEOUT=20000; // silence toléré en mission (une notification ou un écran qui s'éteint ne doit pas couper la partie)   // version du protocole : deux appareils de versions différentes refusent de jouer ensemble
const ICE=[{urls:'stun:stun.l.google.com:19302'}];
// Relais du jeu (Cloudflare) : le mode par défaut, même si js/relais.js manque ou est vide (page en cache ancienne).
// js/relais.js peut le remplacer (une autre adresse, ou « off » pour les QR codes seulement) ; pour les tests, localStorage « crypte-relay » aussi.
const RELAY_CF='wss://crypte-relais.cryptcendre.workers.dev';
const RELAY_URL=(()=>{let v=null;try{v=localStorage.getItem('crypte-relay')}catch(e){}if(!v&&typeof RELAY_DEFAULT==='string')v=RELAY_DEFAULT;v=String(v||RELAY_CF).trim();return v==='off'?'':v.replace(/\/+$/,'')})();
const SLOT_C=['#e8853b','#8fd3e0','#b9a6f0','#f0cf4a'];
// Nombre de joueurs dans la partie (hôte compris) : sert à la difficulté.
const coopN=()=>NET.host?1+NET.peers.filter(p=>p.state==='open').length:NET.guest&&NET.on?Math.max(2,NET.roster.length):1;
const coopHp=()=>1+.5*(coopN()-1), coopCnt=()=>1+.4*(coopN()-1), coopCap=()=>250+50*(coopN()-1);

/* ---------- Codes de connexion (SDP compressé) ---------- */
const b64u=buf=>{let s='';const b=new Uint8Array(buf);for(let i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const t=atob(s),b=new Uint8Array(t.length);for(let i=0;i<t.length;i++)b[i]=t.charCodeAt(i);return b};
async function packSdp(desc){const txt=JSON.stringify({t:desc.type,s:desc.sdp});
  if(typeof CompressionStream!=='undefined'){const cs=new Blob([txt]).stream().pipeThrough(new CompressionStream('deflate-raw'));return 'Z'+b64u(await new Response(cs).arrayBuffer())}
  return 'P'+b64u(new TextEncoder().encode(txt))}
async function unpackSdp(code){code=(code||'').trim().replace(/\s+/g,'');if(!code)throw new Error('code vide');
  const k=code[0],raw=ub64(code.slice(1));let txt;
  if(k==='Z'){const ds=new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));txt=await new Response(ds).text()}
  else if(k==='P')txt=new TextDecoder().decode(raw);else throw new Error('code inconnu');
  const o=JSON.parse(txt);return {type:o.t,sdp:o.s}}
const iceDone=pc=>new Promise(res=>{if(pc.iceGatheringState==='complete')return res();const t=setTimeout(res,4000);pc.addEventListener('icegatheringstatechange',()=>{if(pc.iceGatheringState==='complete'){clearTimeout(t);res()}})});

/* ---------- Connexion ---------- */
// Écran allumé tant que la coopération est active : un téléphone qui se met en veille coupe sa connexion.
let wakeL=null;async function wakeOn(){if(wakeL||!navigator.wakeLock)return;try{wakeL=await navigator.wakeLock.request('screen');wakeL.addEventListener('release',()=>{wakeL=null})}catch(e){wakeL=null}}
function wakeOff(){try{wakeL&&wakeL.release()}catch(e){}wakeL=null}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&NET.on)wakeOn()});
// Battement de cœur hors mission, pour que le silence du salon ne passe pas pour une déconnexion.
function pingOn(){wakeOn();if(NET.pingT)return;NET.pingT=setInterval(()=>{if(NET.on&&(!started||!G||G.over||G.hold))netSend({t:'ping'})},2000)}
function closePeer(p){try{p.dc&&p.dc.close()}catch(e){}try{p.pc&&p.pc.close()}catch(e){}}
function netReset(){relayClose();RL.code='';NET.relay=null;for(const p of NET.peers)closePeer(p);try{NET.dc&&NET.dc.close()}catch(e){}try{NET.pc&&NET.pc.close()}catch(e){}clearInterval(NET.tick);clearInterval(NET.htick);clearInterval(NET.pingT);NET.pingT=null;wakeOff();
  Object.assign(NET,{on:false,host:false,guest:false,pc:null,dc:null,state:'idle',code:'',err:'',hits:[],snap:null,tick:null,peers:[],slot:0,roster:[],hostCls:null,hostName:'',hostPr:0,via:'',hostBgAt:0,ready:false});
  NET.ebUsed=new Set();NET.fdc=null;NET.hq=0;NET.sq=0;NET.hT=0;NET.hostMode=null;if(G)G.mates=[];if(meta.mode==='breche'){meta.mode='survie';saveMeta()}refreshCoopUi();if(typeof refreshMenus==='function'&&!started)refreshMenus()}
const myRelic=()=>!!(meta.relicQ&&meta.relicQ.length);
function rosterList(){return [{slot:0,cls:heroCls,name:myName(),pr:myPr()},...NET.peers.filter(p=>p.state==='open'&&p.cls).map(p=>({slot:p.slot,cls:p.cls,name:p.name,pr:p.pr|0}))]}
// Présentation : héros, nom et prestige du héros joué, renvoyés à chaque changement (héros, nom, prestige).
const helloMsg=()=>({t:'hello',v:NET_V,cls:heroCls,relic:myRelic(),name:myName(),pr:myPr()});
function netMe(){if(!NET.on)return;if(NET.host)sendRoster();else netSend(helloMsg())}
// Nom et prestige d'un joueur de la partie, d'après son emplacement (0 = hôte).
function who(slot){slot=slot|0;const def={name:'Joueur '+(slot+1),pr:0,cls:null};
  if(slot===(NET.host?0:NET.slot))return {name:myName(),pr:myPr(),cls:heroCls};
  if(NET.host){const p=NET.peers.find(p=>p.slot===slot);return p?{name:p.name||def.name,pr:p.pr|0,cls:p.cls}:def}
  const r=(NET.roster||[]).find(r=>r.slot===slot);if(r)return {name:r.name||def.name,pr:r.pr|0,cls:r.cls};
  return slot===0&&NET.hostName?{name:NET.hostName,pr:NET.hostPr|0,cls:NET.hostCls}:def}
const prBadge=pr=>`<span class="prb" title="Prestige ${pr|0}" aria-label="Prestige ${pr|0}">${pr|0}</span>`;
const whoHtml=slot=>{const w=who(slot);return `${prBadge(w.pr)}<b style="color:${SLOT_C[slot|0]||'#8fd3e0'}">${esc(w.name)}</b>`};
// Le salon : joueurs et mission choisie par l'hôte (mode, niveau, difficulté), renvoyés à chaque changement.
const lobbyInfo=()=>({mode:meta.mode,lv:clamp(meta.start|0||1,1,LV_MAX),dn:dif().n});
function sendRoster(){if(NET.host)netSend({t:'roster',list:rosterList(),...lobbyInfo()})}
function wireDc(dc,peer){
  if(peer)peer.dc=dc;else NET.dc=dc;
  dc.onopen=()=>{
    if(peer){peer.state='open';peer.lastRx=performance.now();NET.on=true;NET.state='lobby';netSendTo(peer,{...helloMsg(),slot:peer.slot});sendRoster();
      // Mission déjà lancée (l'hôte a touché Lancer pendant la connexion) : le joueur rejoint en cours de route.
      if(started&&G&&!G.over){netStartFor(peer);if(!NET.tick){clearInterval(NET.tick);NET.tick=setInterval(netTick,50);clearInterval(NET.htick);NET.htick=setInterval(netHeroTick,33)}toast(`${whoHtml(peer.slot)} rejoint la mission.`)}}
    else{relayClose();NET.on=true;NET.lastRx=performance.now();NET.state='connected';NET.via=RL.code||'';netSend(helloMsg());
      if(NET.retry){NET.retry=null;toast('<b style="color:#8fd3e0">Reconnecté à la partie.</b>',true)}coopSave()}
    pingOn();SND.play('relic');toast('<b style="color:#8fd3e0">Coopération connectée.</b>',true);refreshCoopUi();drawCoop()};
  dc.onclose=()=>peer?netPeerLost(peer,false,'close'):netLost('close');dc.onerror=()=>{};
  dc.onmessage=e=>{if(peer)peer.lastRx=performance.now();else NET.lastRx=performance.now();let m;try{m=JSON.parse(e.data)}catch(x){return}
    try{peer?netRecvHost(peer,m):netRecvGuest(m)}catch(err){typeof noteErr==='function'&&noteErr('coop',err)}}}
// Hôte : une place de plus, avec son offre de connexion (code SDP). rid : identifiant de l'invité au relais (absent en mode manuel).
async function newPeer(rid){const used=new Set(NET.peers.map(p=>p.slot));let slot=1;while(used.has(slot))slot++;
  const peer={slot,rid:rid||null,state:'offer',code:'',cls:null,relic:false,Q:null,sh:[],lastRx:0};NET.peers.push(peer);drawCoop();
  try{const pc=new RTCPeerConnection({iceServers:ICE});peer.pc=pc;wireDc(pc.createDataChannel('crypte',{ordered:true}),peer);wireFast(pc.createDataChannel('fast',{ordered:false,maxRetransmits:0}),peer);
    pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){if(peer.state==='open')netPeerLost(peer,false,'failed');else{NET.err=`Joueur ${slot+1} : la connexion a échoué (même wifi ?).`;netPeerLost(peer,true)}}};
    await pc.setLocalDescription(await pc.createOffer());await iceDone(pc);peer.code=await packSdp(pc.localDescription);return NET.peers.includes(peer)?peer:null}
  catch(err){NET.err=err.message;NET.peers=NET.peers.filter(p=>p!==peer);drawCoop();return null}}
// Mode manuel : l'hôte prépare une invitation à la fois, avec son propre QR code.
function netHost(){if(!NET.host){netReset();NET.host=true;NET.state='lobby'}netAddPeer()}
async function netAddPeer(){if(!NET.host)return;
  if(NET.peers.some(p=>p.state!=='open'&&!p.rid))return drawCoop();
  if(1+NET.peers.length>=NET_MAX){NET.err=`La partie est complète (${NET_MAX} joueurs).`;return drawCoop()}
  const peer=await newPeer(null);if(peer)peer.state='waitAnswer';drawCoop()}
async function netAnswerIn(code){const peer=NET.peers.find(p=>p.state==='waitAnswer');if(!peer)return;
  try{await peer.pc.setRemoteDescription(await unpackSdp(code));peer.state='connecting'}catch(err){NET.err='Code de réponse invalide : '+err.message}drawCoop()}
function netCancelPending(){const p=NET.peers.find(q=>q.state!=='open'&&!q.rid);if(p){closePeer(p);NET.peers=NET.peers.filter(q=>q!==p)}if(!NET.peers.length&&!RL.ws)netReset();drawCoop()}
// Invité : la réponse à l'offre de l'hôte (code SDP), qui ouvre la connexion directe.
async function guestAnswer(code){const pc=new RTCPeerConnection({iceServers:ICE});NET.pc=pc;pc.ondatachannel=e=>e.channel.label==='fast'?wireFast(e.channel,null):wireDc(e.channel,null);
  pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){if(NET.on)netLost('failed');else netFail('la connexion a échoué (même wifi ?)')}};
  await pc.setRemoteDescription(await unpackSdp(code));await pc.setLocalDescription(await pc.createAnswer());await iceDone(pc);return packSdp(pc.localDescription)}
async function netJoin(code){netReset();NET.guest=true;NET.state='answer';drawCoop();
  try{NET.code=await guestAnswer(code);NET.state='showAnswer'}
  catch(err){NET.guest=false;netFail('Code de l\'hôte invalide : '+err.message)}drawCoop()}

/* ---------- Relais : rejoindre avec un code à 4 chiffres ----------
   L'hôte ouvre une salle au relais (js/relais.js, dossier relais/) sous un code tiré au hasard ; un invité qui tape ce code y entre.
   Le relais fait passer l'offre de l'hôte et la réponse de l'invité (les mêmes codes qu'en mode manuel), puis la partie passe
   directement d'un appareil à l'autre. L'hôte garde la salle ouverte tant que sa partie existe, pour qu'un joueur puisse encore arriver. */
const RL={ws:null,code:'',key:'',tries:0,pingT:null,joinT:null};
const rnd4=()=>{const a=new Uint32Array(1);try{crypto.getRandomValues(a)}catch(e){a[0]=Math.random()*1e9}return String(a[0]%10000).padStart(4,'0')};
function relayClose(){const w=RL.ws;RL.ws=null;clearInterval(RL.pingT);RL.pingT=null;clearTimeout(RL.joinT);if(w){w.onclose=w.onmessage=w.onerror=null;try{w.close()}catch(e){}}}
function relayOpen(code,role,onMsg,onEnd){relayClose();let ws;try{ws=new WebSocket(`${RELAY_URL}/r/${code}?role=${role}${role==='h'?'&k='+RL.key:''}`)}catch(e){setTimeout(()=>onEnd('err'),0);return}
  RL.ws=ws;let opened=false;
  ws.onopen=()=>{opened=true;try{ws.send('{"t":"hi"}')}catch(e){}RL.pingT=setInterval(()=>{try{ws.send('ping')}catch(e){}},25000)};
  ws.onmessage=e=>{if(e.data==='pong')return;let m;try{m=JSON.parse(e.data)}catch(x){return}try{onMsg(m)}catch(err){typeof noteErr==='function'&&noteErr('relais',err)}};
  ws.onerror=()=>{};
  ws.onclose=()=>{if(RL.ws!==ws)return;RL.ws=null;clearInterval(RL.pingT);RL.pingT=null;onEnd(opened?'closed':'err')}}
const relaySend=m=>{try{if(RL.ws&&RL.ws.readyState===1)RL.ws.send(JSON.stringify(m))}catch(e){}};
// Hôte : « Créer une partie ».
function netHostCode(code,key){netReset();NET.host=true;NET.state='lobby';if(code&&key){relayClose();NET.relay='wait';RL.key=key;RL.tries=0;relayHost(code);refreshCoopUi();drawCoop()}else relayNewCode()}
// Nouveau code (salle neuve, nouveau secret) : les joueurs déjà connectés restent ; l'ancien code ne mène plus nulle part.
function relayNewCode(){relayClose();NET.relay='wait';RL.key=Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2);RL.tries=0;relayHost(rnd4());refreshCoopUi();drawCoop()}
// Fermer l'accès : plus personne ne peut arriver avec un code (« Rouvrir » en donne un nouveau).
function relayShut(){relayClose();RL.code='';NET.relay='closed';coopForget();refreshCoopUi();drawCoop()}
function relayHost(code){RL.code=code;relayOpen(code,'h',relayHostMsg,why=>{if(!NET.host)return;
  if(NET.relay==='wait'&&why==='err'){NET.relay='off';NET.err='Relais injoignable : vérifie la connexion internet, ou invite les joueurs par QR code (ci-dessous).';refreshCoopUi();drawCoop();return}
  // salle perdue (coupure réseau) : on la rouvre sous le même code tant que la partie existe
  if(NET.relay==='on'||NET.relay==='wait'){NET.relay='wait';refreshCoopUi();drawCoop();setTimeout(()=>{if(NET.host&&!RL.ws&&NET.relay==='wait')relayHost(RL.code)},2500)}})}
// Refus du relais avant d'entrer : site non autorisé (variable ORIGINES du Worker) ou trop de codes faux depuis ce réseau.
const RELAY_WHY={origin:()=>`Ce site (${location.origin==='null'?'fichier local':location.origin}) n'est pas autorisé par le relais : ajoute son adresse à la variable ORIGINES du Worker, sur Cloudflare.`,
  slow:()=>'Trop de codes faux essayés depuis ce réseau : réessaie dans 10 minutes.'};
function relayHostMsg(m){
  if(m.t==='ok'){NET.relay='on';coopSave();refreshCoopUi();drawCoop();return}
  if(RELAY_WHY[m.t]){relayClose();NET.relay='off';NET.err=RELAY_WHY[m.t]();refreshCoopUi();drawCoop();return}
  if(m.t==='taken'){if(++RL.tries>8){NET.relay='off';NET.err='Aucun code libre pour l\'instant : réessaie dans un moment.';drawCoop();return}relayHost(rnd4());return}
  if(m.t==='join'){relayGuestIn(m.id);return}
  if(m.t==='answer'){const p=NET.peers.find(q=>q.rid===m.from);if(p&&p.state==='sent')unpackSdp(m.sdp).then(d=>p.pc.setRemoteDescription(d)).then(()=>{p.state='connecting';drawCoop()}).catch(()=>netPeerLost(p,true));return}
  if(m.t==='left'){const p=NET.peers.find(q=>q.rid===m.id);if(p&&p.state!=='open')netPeerLost(p,true)}}
async function relayGuestIn(rid){if(!NET.host||NET.peers.some(p=>p.rid===rid))return;
  if(1+NET.peers.length>=NET_MAX){relaySend({to:rid,t:'full'});return}
  const peer=await newPeer(rid);if(!peer)return;
  relaySend({to:rid,t:'offer',v:NET_V,sdp:peer.code});peer.state='sent';drawCoop();
  setTimeout(()=>{if(NET.peers.includes(peer)&&peer.state!=='open')netPeerLost(peer,true)},30000)}
// Hôte : retirer un joueur de la partie (il reçoit « kick » et la connexion est fermée ; « Nouveau code » l'empêche de revenir).
function netKick(slot){const p=NET.peers.find(q=>q.slot===slot);if(!p)return;const nm=p.name||'Joueur '+(slot+1);netSendTo(p,{t:'kick'});
  setTimeout(()=>netPeerLost(p,true),150);toast(`<b>${esc(nm)}</b> est retiré de la partie.${NET.relay==='on'?' Touche « Nouveau code » pour qu\'il ne revienne pas.':''}`,true)}
// Invité : rejoindre la partie d'un code.
function netJoinCode(code,auto){code=String(code||'').replace(/\D/g,'');if(code.length!==4){NET.err='Le code de la partie a 4 chiffres.';drawCoop();return}
  if(!auto){NET.retry=null;clearTimeout(RL.reT)}
  netReset();NET.guest=true;NET.state='rjoin';RL.code=code;drawCoop();
  // échec : en reconnexion automatique, on réessaie (5 fois) tant que l'erreur peut passer (hôte qui recharge, réseau qui revient)
  const fail=(msg,final)=>{relayClose();netReset();if(auto&&!final&&NET.retry&&NET.retry.n<5){rejoinSoon(code,NET.retry.n+1);return}
    if(auto)coopForget();NET.retry=null;NET.err=msg;drawCoop()};
  RL.joinT=setTimeout(()=>{if(NET.guest&&NET.state==='rjoin')fail(`La partie ${code} ne répond pas : vérifie le code avec l'hôte.`)},15000);
  relayOpen(code,'g',async m=>{
    if(m.t==='nohost')return fail(`Aucune partie avec le code ${code}. Vérifie le code avec l'hôte : il le voit en touchant Coop.`);
    if(RELAY_WHY[m.t])return fail(RELAY_WHY[m.t](),true);
    if(m.t==='full')return fail('Cette partie est complète.',true);
    if(m.t==='hostgone'){if(!NET.on)fail('L\'hôte a fermé la partie.');return}
    if(m.t==='offer'){if(m.v!==NET_V)return fail('Version du jeu différente de celle de l\'hôte. Mettez le jeu à jour sur les deux appareils (Réglages › Application), puis recommencez.',true);
      clearTimeout(RL.joinT);NET.state='connecting';drawCoop();
      try{const ans=await guestAnswer(m.sdp);relaySend({t:'answer',sdp:ans});
        RL.joinT=setTimeout(()=>{if(NET.guest&&!NET.on)fail('La connexion directe n\'a pas pu s\'établir : êtes-vous sur le même wifi ?')},20000)}
      catch(err){fail('Connexion impossible : '+err.message)}}
  },why=>{if(NET.guest&&!NET.on&&why==='err')fail('Relais injoignable : vérifie la connexion internet, ou utilise la connexion par QR codes.')})}
function netFail(msg){NET.err=msg;NET.state='idle';drawCoop()}
// Canal rapide (non fiable, sans ordre) : positions des héros et instantanés du monde. Un paquet perdu est remplacé 33 à 50 ms plus tard,
// sans bloquer les suivants ; les messages importants (coups, morts, départ, fin) restent sur le canal fiable.
function wireFast(dc,peer){if(peer)peer.fdc=dc;else NET.fdc=dc;
  dc.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch(x){return}if(peer)peer.lastRx=performance.now();else NET.lastRx=performance.now();
    try{peer?netRecvHost(peer,m):netRecvGuest(m)}catch(err){typeof noteErr==='function'&&noteErr('coop',err)}}}
function fastTo(p,str){const d=p&&p.fdc;if(d&&d.readyState==='open'){try{d.send(str);return}catch(e){}}netSendTo(p,str)}
function sendFast(m){const str=JSON.stringify(m);if(NET.host){for(const p of NET.peers)if(p.state==='open')fastTo(p,str)}
  else{const d=NET.fdc;if(d&&d.readyState==='open'){try{d.send(str);return}catch(e){}}netSend(m)}}
function netSendTo(p,m){if(p&&p.dc&&p.dc.readyState==='open')try{p.dc.send(typeof m==='string'?m:JSON.stringify(m))}catch(e){}}
function netSend(m){if(NET.host){const s=JSON.stringify(m);for(const p of NET.peers)if(p.state==='open')netSendTo(p,s)}
  else if(NET.dc&&NET.dc.readyState==='open')try{NET.dc.send(JSON.stringify(m))}catch(e){}}
/* ---------- Déconnexions : la raison, et la reconnexion automatique ----------
   why : 'bye' (l'autre a fermé ou rechargé le jeu), 'close' / 'failed' (liaison coupée), 'timeout' (plus de nouvelles depuis 20 s).
   Chaque appareil prévient les autres quand il passe en arrière-plan (« bg ») : une coupure juste après s'explique (écran en veille, autre appli). */
const BG_RECENT=90000;
function noteDrop(why,who,themBg){const meBg=NET.bgAt&&performance.now()-NET.bgAt<BG_RECENT;NET.drop={at:new Date(),why,who:who||'',me:!!meBg,them:!!themBg}}
function dropTxt(d){const who=d.who?`<b>${esc(d.who)}</b>`:'l\'autre joueur';
  if(d.why==='end')return `${who} a fermé la partie.`;
  if(d.why==='bye')return `${who} a fermé ou rechargé le jeu.`;
  if(d.me)return 'ton appareil était en arrière-plan ou en veille (écran éteint, autre appli) : la connexion s\'est coupée.';
  if(d.them)return `${who} avait mis le jeu en arrière-plan (écran éteint ou autre appli).`;
  if(d.why==='timeout')return `plus de nouvelles de ${who} depuis 20 s : wifi coupé, ou appareil en veille.`;
  return `la connexion directe avec ${who} s'est coupée : wifi qui change, ou appareil en veille.`}
const dropHtml=()=>NET.drop?`<p class="cx-hint coopdrop" style="margin:0">Dernière déconnexion, à ${NET.drop.at.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} : ${dropTxt(NET.drop)}</p>`:'';
document.addEventListener('visibilitychange',()=>{const hid=document.visibilityState==='hidden';if(hid)NET.bgAt=performance.now();if(NET.on)netSend({t:'bg',on:hid?1:0})});
// Hôte : un invité est parti.
function netPeerLost(peer,silent,why){if(!NET.peers.includes(peer))return;const was=peer.state==='open';closePeer(peer);NET.peers=NET.peers.filter(p=>p!==peer);
  if(was&&why)noteDrop(why,peer.name,peer.bgAt&&performance.now()-peer.bgAt<BG_RECENT);
  if(G&&G.mates)G.mates=G.mates.filter(q=>q.slot!==peer.slot);
  NET.on=NET.peers.some(p=>p.state==='open');if(!NET.on&&meta.mode==='breche'&&!started){meta.mode='survie';saveMeta()}
  if(was&&!silent)toast(`${prBadge(peer.pr)}<b style="color:#e0474b">${esc(peer.name||'Joueur '+(peer.slot+1))} déconnecté.</b>`+(started&&G&&!G.over?(NET.on?' La partie continue.':' Tu continues seul.'):'')+(why&&why!=='bye'&&peer.rid?' Il peut revenir avec le code.':''),true);
  sendRoster();if(started&&G&&!G.over)coopCheckFail();refreshCoopUi();drawCoop()}
// Invité : l'hôte est parti. Venu par un code, l'invité se reconnecte tout seul (l'hôte garde sa salle ouverte).
function netLost(why='close'){if(NET.state==='idle'&&!NET.on)return;const was=NET.on,wasGuest=NET.guest,code=NET.via;
  if(was)noteDrop(why,NET.hostName||'l\'hôte',NET.hostBgAt&&performance.now()-NET.hostBgAt<BG_RECENT);const drop=NET.drop;netReset();NET.drop=drop;
  const again=was&&wasGuest&&code&&RELAY_URL&&why!=='end';
  if(was){toast('<b style="color:#e0474b">Hôte déconnecté.</b>'+(started&&G&&!G.over&&wasGuest?' La mission se termine : tu gardes ton butin.':'')+(again?' Reconnexion…':''),true);
    if(wasGuest&&started&&G&&!G.over){G.hold=false;missionSuccess()}}
  if(again)rejoinSoon(code)}
// Reconnexion par le code : plusieurs essais espacés (l'hôte peut être en train de recharger le jeu).
function rejoinSoon(code,n=0){clearTimeout(RL.reT);NET.retry={code,n};drawCoop();RL.reT=setTimeout(()=>{if(NET.on||NET.host||!NET.retry)return;netJoinCode(code,true)},n?3000:1500)}
// Après un rechargement (mise à jour, page fermée par erreur) : la partie en cours, gardée pour l'onglet pendant 10 minutes.
const COOP_SS='crypte-coop';
function coopSave(){try{if(NET.host&&NET.relay&&RL.code&&RL.key)sessionStorage.setItem(COOP_SS,JSON.stringify({r:'h',code:RL.code,key:RL.key,at:Date.now()}));
  else if(NET.guest&&NET.on&&NET.via)sessionStorage.setItem(COOP_SS,JSON.stringify({r:'g',code:NET.via,at:Date.now()}));else sessionStorage.removeItem(COOP_SS)}catch(e){}}
function coopForget(){try{sessionStorage.removeItem(COOP_SS)}catch(e){}}

/* ---------- Démarrage de la mission ---------- */
const SPAWN_OFF=[[0,0],[80,0],[-80,0],[0,80]];
const mateNew=(slot,cls,x,y)=>({slot,cls:cls||'guerrier',x,y,face:0,hp:1,max:1,down:false,r:17,flash:0,dashT:0,spin:0,shield:0});
const startMsg=()=>({t:'start',br:G.breche?1:0,mode:G.mode,nd:{d:meta.diff|0,t:meta.torm|0},level:G.level,biome:G.biome,n:coopN(),map:{pil:G.pillars.filter(p=>p!==G.pod).map(p=>[p.x|0,p.y|0,+p.r.toFixed(1)]),bra:G.braziers.map(b=>[b.x|0,b.y|0]),run:G.runes.map(r=>[r.x|0,r.y|0,r.r|0])},x:G.P.x|0,y:G.P.y|0});
function netStartHost(){ // appelé par l'hôte au lancement (main.js)
  const open=NET.peers.filter(p=>p.state==='open'),now=performance.now();for(const p of open)p.lastRx=now;
  G.breche=meta.mode==='breche'&&open.length>0;for(const p of open)p.left=false;
  G.mates=open.map(p=>{const o=SPAWN_OFF[p.slot]||[40,0],q=mateNew(p.slot,p.cls,G.P.x+o[0],G.P.y+o[1]);p.Q=q;p.sh=[];return q});
  netSend(startMsg());clearInterval(NET.tick);NET.tick=setInterval(netTick,50);clearInterval(NET.htick);NET.htick=setInterval(netHeroTick,33)}
// Un joueur arrive alors que la mission tourne déjà : on ne lance que lui, près de l'hôte.
function netStartFor(peer){peer.lastRx=performance.now();peer.left=false;const o=SPAWN_OFF[peer.slot]||[40,0],q=mateNew(peer.slot,peer.cls,G.P.x+o[0],G.P.y+o[1]);peer.Q=q;peer.sh=[];
  G.mates=(G.mates||[]).filter(x=>x.slot!==peer.slot);G.mates.push(q);netSendTo(peer,startMsg())}
// L'invité joue la mission de l'hôte : même mode, même difficulté, même carte ; sa sauvegarde garde ses propres choix.
function netStartGuest(m){const sv=meta.mode;meta.mode=MODES[m.mode]?m.mode:'survie';newGame();meta.mode=sv;G.nd=m.nd||null;G.bossT=bossIv();G.breche=!!m.br;G.level=m.level;G.biome=m.biome;if(floorPat)floorPat=null;
  G.pillars=m.map.pil.map(a=>({x:a[0],y:a[1],r:a[2]}));G.braziers=m.map.bra.map(a=>({x:a[0],y:a[1],ph:rand(0,6)}));G.runes=m.map.run.map(a=>({x:a[0],y:a[1],r:a[2]}));if(G.pod)G.pillars.push(G.pod);
  {const o=SPAWN_OFF[NET.slot]||[40,0];G.P.x=m.x+o[0];G.P.y=m.y+o[1];resolve(G.P)}G.cam.x=G.P.x;G.cam.y=G.P.y;G.en=[];G.mates=[];
  if(PX)try{buildStatic()}catch(err){dropPixi(err)}
  ['over','extract','lvlup','camp','bag','coop','settings'].forEach(id=>{const el=$(id);if(el)el.hidden=true});$('intro').hidden=true;
  NET.lastRx=performance.now();window.goRun&&window.goRun();clearInterval(NET.tick);NET.tick=setInterval(netTick,50);clearInterval(NET.htick);NET.htick=setInterval(netHeroTick,33)}

/* ---------- Échanges en partie ---------- */
const r1=v=>Math.round(v*10)/10;
const heroPack=P=>[P.x|0,P.y|0,r1(P.face),Math.ceil(P.hp),Math.round(S.hp),heroCls,(P.down?1:0)|(P.dashT>0?2:0)|(P.spin>0?4:0)|(P.flash>0?8:0)|(P.inv>0?16:0),Math.round(P.shield||0),sealMask(),G.pet?PET_IDS.indexOf(G.pet.t)+1:0,G.pet?G.pet.x|0:0,G.pet?G.pet.y|0:0,G.pet&&G.pet.taunt>0?1:0];
const shotPack=(L,n=70)=>L.slice(0,n).map(s=>[s.kind,s.x|0,s.y|0,r1(s.a),s.vx|0,s.vy|0,r1(s.life),s.crit?1:0]);
const shotObj=a=>({kind:a[0],x:a[1],y:a[2],a:a[3],vx:a[4],vy:a[5],life:a[6],crit:!!a[7]});
function heroUnpack(a,Q){Q=Q||{r:17};const now=performance.now();
  if(Q.tx==null||Math.hypot(a[0]-Q.tx,a[1]-Q.ty)>260){Q.x=a[0];Q.y=a[1];Q.vx=0;Q.vy=0}
  else{const dt=Math.min(.25,Math.max(.016,(now-(Q.rt||now))/1000));const k=.5;Q.vx=Q.vx*(1-k)+(a[0]-Q.tx)/dt*k;Q.vy=Q.vy*(1-k)+(a[1]-Q.ty)/dt*k}
  Q.tx=a[0];Q.ty=a[1];Q.rt=now;Object.assign(Q,{face:a[2],hp:a[3],max:a[4],cls:a[5],down:!!(a[6]&1),dashT:a[6]&2?.1:0,spin:a[6]&4?1:0,flash:a[6]&8?1:0,inv:a[6]&16?.1:0,shield:a[7]||0,aur:a[8]|0,r:17});
  if(a[9]){const t=PET_IDS[a[9]-1];if(!Q.pet||Q.pet.t!==t)Q.pet={t,x:a[10],y:a[11],flap:0,r:10};Q.pet.tx=a[10];Q.pet.ty=a[11];Q.pet.taunt=a[12]?1:0}else Q.pet=null;return Q}
// Lissage des partenaires à chaque image : on prolonge leur dernier mouvement connu et on rattrape en douceur.
function matesSmooth(dt){const now=performance.now();for(const q of G.mates||[]){if(q.pet){const p=q.pet,k=Math.min(1,dt*12);if(Math.hypot(p.tx-p.x,p.ty-p.y)>400){p.x=p.tx;p.y=p.ty}p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;p.flap+=dt*10}if(q.pet){const p=q.pet,k=Math.min(1,dt*12);if(Math.hypot(p.tx-p.x,p.ty-p.y)>400){p.x=p.tx;p.y=p.ty}p.x+=(p.tx-p.x)*k;p.y+=(p.ty-p.y)*k;p.flap+=dt*10}if(q.tx==null)continue;const age=Math.min(.2,(now-q.rt)/1000),px=q.tx+(q.vx||0)*age,py=q.ty+(q.vy||0)*age;
  const k=Math.min(1,dt*20);q.x+=(px-q.x)*k;q.y+=(py-q.y)*k}}
// Flux rapide des héros, 30 fois par seconde.
let hSeq=0;
function netHeroTick(){if(!NET.on||!started||!G||G.over)return;hSeq++;
  if(NET.host){const ps=[[0,...heroPack(G.P)]];for(const p of NET.peers)if(p.state==='open'&&p.Q){const q=p.Q;ps.push([p.slot,Math.round(q.tx!=null?q.tx:q.x),Math.round(q.ty!=null?q.ty:q.y),q.face,Math.ceil(q.hp),q.max,q.cls,(q.down?1:0)|(q.dashT>0?2:0)|(q.spin>0?4:0)|(q.flash>0?8:0)|(q.inv>0?16:0),q.shield|0,q.aur|0])}
    sendFast({t:'h',q:hSeq,ps})}
  else sendFast({t:'h',q:hSeq,p:heroPack(G.P)})}
// État propre au mode, envoyé par l'hôte : Défense (cryopode, vagues), Capture (capture, extraction).
function modeSnap(){if(G.mode==='defense'&&G.pod)return ['d',G.pod.hp|0,G.pod.max|0,G.wave|0,G.waveState==='break'?1:0,r1(G.waveT||0),G.toSpawn|0];
  if(G.mode==='capture')return ['c',r1(G.capT||0),r1(G.extT||0),G.exitPt?G.exitPt.x|0:-1,G.exitPt?G.exitPt.y|0:-1];return null}
function modeApply(md){if(!md)return;
  if(md[0]==='d'&&G.pod){G.pod.hp=md[1];G.pod.max=md[2];G.wave=md[3];G.waveState=md[4]?'break':'fight';G.waveT=md[5];G.toSpawn=md[6]}
  else if(md[0]==='c'){G.capT=md[1];G.extT=md[2];G.exitPt=md[3]>=0?{x:md[3],y:md[4]}:null}}
function netTick(){if(!NET.on||!started||!G)return;const now=performance.now();
  if(NET.host){
    for(const p of NET.peers.slice())if(p.state==='open'&&p.lastRx&&now-p.lastRx>NET_TIMEOUT&&!G.over&&!G.hold&&document.visibilityState==='visible')netPeerLost(p,false,'timeout');
    if(!NET.on)return;
    const en=G.en.filter(e=>!e.dead).map(e=>[e.id,e.type,e.x|0,e.y|0,Math.ceil(e.hp),Math.ceil(e.max),r1(e.r),(e.corr?1:0)|(e.frz>0?2:0)|(e.slow>0?4:0)|(e.flash>0?8:0)|(e.burnT>0?16:0)|(e.downed?32:0),e.elite||0,e.gen||0,Math.round(e.dmg),e.state==='walk'?0:e.state==='wind'?1:2,r1(e.ang||0)]);
    const ps=[[0,...heroPack(G.P)]],osh=[[0,shotPack(G.shots,60)]];
    for(const p of NET.peers)if(p.state==='open'&&p.Q){ps.push([p.slot,p.Q.x|0,p.Q.y|0,p.Q.face,Math.ceil(p.Q.hp),p.Q.max,p.Q.cls,(p.Q.down?1:0)|(p.Q.dashT>0?2:0)|(p.Q.spin>0?4:0)|(p.Q.flash>0?8:0)|(p.Q.inv>0?16:0),p.Q.shield|0,p.Q.aur|0]);if(p.shRaw)osh.push([p.slot,p.shRaw.slice(0,40)])}
    NET.sSeq=(NET.sSeq||0)+1;sendFast({t:'s',sq:NET.sSeq,lv:G.level,tl:r1(G.tl),bt:r1(G.bossT),en,eb:G.eb.slice(0,150).map(b=>[b.id,b.x|0,b.y|0,b.vx|0,b.vy|0,b.r,Math.round(b.d),r1(b.life)]),
      lb:G.lobs.map(l=>[l.x0|0,l.y0|0,l.tx|0,l.ty|0,+l.t.toFixed(2),l.T,l.kind,l.r|0]),z:G.zones.map(z=>[z.id,z.x|0,z.y|0,z.r|0,z.kind,+z.dps.toFixed(2),r1(z.life),z.max]),ps,osh,md:modeSnap()});
  }else{
    if(NET.lastRx&&now-NET.lastRx>NET_TIMEOUT&&!G.over&&!G.hold&&document.visibilityState==='visible'){netLost('timeout');return}
    const st=[];for(const e of G.en){const s0=e._s||{};if(e.slow>(s0.slow||0)+.05||e.frz>(s0.frz||0)+.05||(e.burnT>0&&e.burnT>(s0.burnT||0)+.05)||e.kx||e.ky){st.push([e.id,r1(e.slow||0),r1(e.frz||0),r1(e.burnT||0),r1(e.burnDps||0),e.kx|0,e.ky|0]);e.kx=e.ky=0;e._s={slow:e.slow,frz:e.frz,burnT:e.burnT}}}
    netSend({t:'g',p:heroPack(G.P),sh:shotPack(G.shots),h:NET.hits.splice(0),st,rel:!!G.relic});
  }}
function netHit(e,d,crit){NET.hits.push([e.id,Math.round(d*10)/10,crit?1:0])}
// Quelqu'un reste-t-il debout ? Sinon la mission échoue pour tous (décidé par l'hôte).
const matesUp=()=>(G.mates||[]).some(q=>!q.down);
function coopCheckFail(){if(!NET.host||!G||G.over)return;if(G.P.down&&!matesUp()){netSend({t:'fail'});gameOver()}}
function netRecvHost(peer,m){
  if(m.t==='ping')return;
  if(m.t==='bye'){netPeerLost(peer,false,'bye');return}
  if(m.t==='bg'){peer.bgAt=m.on?performance.now():0;return}
  if(m.t==='leave'){peer.left=true;peer.Q=null;if(G&&G.mates)G.mates=G.mates.filter(q=>q.slot!==peer.slot);toast(`${whoHtml(peer.slot)} est retourné au Camp.`,true);if(started&&G&&!G.over)coopCheckFail();drawCoop();return}
  if(m.t==='hello'){if(m.v!==NET_V){netSendTo(peer,{t:'oldver',v:NET_V});NET.err=`Joueur ${peer.slot+1} : version du jeu différente. Mettez le jeu à jour sur les deux appareils (Réglages › Application), puis recommencez.`;netPeerLost(peer,true);return}
    const first=peer.name==null;peer.cls=CLS[m.cls]?m.cls:'guerrier';peer.relic=m.relic;peer.name=cleanName(m.name)||'Joueur '+(peer.slot+1);
    if(first&&!(started&&G&&!G.over)){peer.pr=Math.max(0,m.pr|0);toast(`${whoHtml(peer.slot)} a rejoint la partie.`,true)}peer.pr=Math.max(0,m.pr|0);if(peer.Q)peer.Q.cls=peer.cls;sendRoster();drawCoop();return}
  if(!G)return;
  if(m.t==='fx'){fxApply(m);for(const p of NET.peers)if(p!==peer&&p.state==='open')netSendTo(p,m);return}
  if(m.t==='h'){if(!peer.Q||!m.p)return;if(m.q<=(peer.hq||0)&&peer.hq-m.q<1000)return;peer.hq=m.q;peer.hT=performance.now();heroUnpack(m.p,peer.Q);peer.Q.slot=peer.slot;return}
  if(m.t==='g'){if(peer.left||!started||G.over)return;if(!peer.Q){peer.Q=mateNew(peer.slot,peer.cls,G.P.x,G.P.y);if(G.mates&&!G.mates.includes(peer.Q))G.mates.push(peer.Q)}
    if(!peer.hT||performance.now()-peer.hT>400){heroUnpack(m.p,peer.Q);peer.Q.slot=peer.slot}peer.shRaw=m.sh;peer.sh=m.sh.map(shotObj);peer.relic=m.rel;
    G.oshots=NET.peers.flatMap(p=>p.state==='open'?p.sh||[]:[]);
    if(m.h.length||m.st.length){const by=new Map();for(const e of G.en)by.set(e.id,e);
      for(const [id,d,crit] of m.h){const e=by.get(id);if(!e||e.dead)continue;let dd=d;if(e.elite==='bouclier'&&e.hp>e.max*.5)dd*=.5;e.hp-=dd;e.flash=1;e.shown=2;if(e.hp<=0&&!e.dead)kill(e)}
      for(const [id,slow,frz,bt,bd,kx,ky] of m.st){const e=by.get(id);if(!e||e.dead)continue;if(slow>e.slow)e.slow=slow;if(frz>(e.frz||0))e.frz=frz;if(bt>e.burnT){e.burnT=bt;e.burnDps=Math.max(e.burnDps||0,bd)}if(e.type!=='boss'){e.kx+=kx;e.ky+=ky}}}
    coopCheckFail();return}
}
function netRecvGuest(m){
  if(m.t==='ping')return;
  if(m.t==='bye'){netLost(m.end?'end':'bye');return}
  if(m.t==='bg'){NET.hostBgAt=m.on?performance.now():0;return}
  if(m.t==='kick'){const inGame=started&&G&&!G.over;netReset();NET.retry=null;coopForget();toast('<b style="color:#e0474b">L\'hôte t\'a retiré de la partie.</b>'+(inGame?' Tu gardes ton butin.':''),true);if(inGame){G.hold=false;missionSuccess()}NET.err='L\'hôte t\'a retiré de la partie.';drawCoop();return}
  if(m.t==='oldver'||(m.t==='hello'&&m.v!==NET_V)){const err='Version du jeu différente de celle de l\'hôte. Mettez le jeu à jour sur les deux appareils (Réglages › Application), puis recommencez.';netReset();NET.err=err;openCoop();NET.err=err;drawCoop();return}
  if(m.t==='hello'){if(m.slot)NET.slot=m.slot;NET.hostCls=m.cls;NET.hostName=cleanName(m.name);NET.hostPr=Math.max(0,m.pr|0);drawCoop();refreshCoopUi();return}
  if(m.t==='roster'){NET.roster=(m.list||[]).map(r=>({slot:r.slot|0,cls:CLS[r.cls]?r.cls:null,name:cleanName(r.name),pr:Math.max(0,r.pr|0)}));if(m.mode)NET.hostMode={mode:m.mode,lv:m.lv,dn:m.dn};drawCoop();refreshCoopUi();return}
  if(m.t==='start'){netStartGuest(m);return}
  // hors mission (retour au Camp, fin de partie) : on ignore le flux de la mission de l'hôte
  if(!G||!started||G.over)return;
  if(m.t==='cap'){capReward();return}
  if(m.t==='fx'){fxApply(m);return}
  if(m.t==='s'){if(m.sq&&NET.sq&&m.sq<=NET.sq&&NET.sq-m.sq<1000)return;NET.sq=m.sq;NET.snap=m;return}
  if(m.t==='h'){if(m.q<=(NET.hq||0)&&NET.hq-m.q<1000)return;NET.hq=m.q;NET.hT=performance.now();matesFrom(m.ps);return}
  if(m.t==='kill'){const e=G.en.find(o=>o.id===m.id),o=e||{x:m.x,y:m.y,r:ETYPE[m.type].r,col:ETYPE[m.type].col};
    Object.assign(o,{type:m.type,elite:m.elite||undefined,corr:!!m.corr,gen:m.gen||0,x:m.x,y:m.y,noLoot:!!m.nl});if(o.dead)return;kill(o);G.en=G.en.filter(x=>x!==o);return}
  if(m.t==='round'){roundDone();coopWait(true);return}
  if(m.t==='cont'){coopWait(false);contRun();return}
  if(m.t==='exit'){coopWait(false);G.hold=false;missionSuccess();return}
  if(m.t==='fail'){G.hold=false;gameOver();return}
}
// Côté invité : applique le dernier instantané reçu (monstres, projectiles, zones, autres héros).
function netApplySnap(){const m=NET.snap;if(!m)return;NET.snap=null;
  G.level=m.lv;G.tl=m.tl;G.bossT=m.bt;
  const by=new Map();for(const e of G.en)by.set(e.id,e);const out=[];
  for(const a of m.en){let e=by.get(a[0]);const d=ETYPE[a[1]];
    if(!e){e={id:a[0],type:a[1],x:a[2],y:a[3],col:d?d.col:'#888',flash:0,hitCd:0,kx:0,ky:0,burnT:0,burnDps:0,slow:0,frz:0,shown:0,wob:rand(0,6),rot:0,tgtPod:false}}
    e.tx=a[2];e.ty=a[3];e.hp=Math.min(e.hp==null?a[4]:e.hp,a[4]);if(a[4]>e.hp+1)e.hp=a[4];e.max=a[5];e.r=a[6];e.corr=!!(a[7]&1);
    if(a[7]&2)e.frz=Math.max(e.frz||0,.1);if(a[7]&4)e.slow=Math.max(e.slow||0,.1);if(a[7]&8)e.flash=Math.max(e.flash,.5);
    e.elite=a[8]||undefined;e.gen=a[9];e.dmg=a[10];e.state=a[11]===0?'walk':a[11]===1?'wind':'charge';e.ang=a[12];e.downed=!!(a[7]&32);out.push(e)}
  G.en=out;G.target=out.find(e=>e.type==='cible')||null;modeApply(m.md);
  G.eb=m.eb.filter(b=>!NET.ebUsed.has(b[0])).map(b=>({id:b[0],x:b[1],y:b[2],vx:b[3],vy:b[4],r:b[5],d:b[6],life:b[7]}));
  if(NET.ebUsed.size>800)NET.ebUsed=new Set([...NET.ebUsed].slice(-300));
  G.lobs=m.lb.map(l=>({x0:l[0],y0:l[1],tx:l[2],ty:l[3],t:l[4],T:l[5],kind:l[6],r:l[7]}));
  const zb=new Map();for(const z of G.zones)zb.set(z.id,z);
  G.zones=m.z.map(a=>{const z=zb.get(a[0])||{id:a[0]};return Object.assign(z,{x:a[1],y:a[2],r:a[3],kind:a[4],dps:a[5],life:a[6],max:a[7]})});
  if(!NET.hT||performance.now()-NET.hT>400)matesFrom(m.ps);
  G.oshots=(m.osh||[]).filter(x=>x[0]!==NET.slot).flatMap(x=>x[1].map(shotObj));
  if(G.en.some(e=>e.type==='boss'))$('bossBar').hidden=false}
function matesFrom(ps){if(!G||!ps)return;const old=new Map((G.mates||[]).map(q=>[q.slot,q]));const out=[];
  for(const a of ps){if(a[0]===NET.slot)continue;const q=heroUnpack(a.slice(1),old.get(a[0]));q.slot=a[0];out.push(q)}G.mates=out}
// Côté invité : mouvement interpolé des monstres et coups au contact.
function netGuestEnemies(dt,P){const k=Math.min(1,dt*14);
  for(const e of G.en){if(e.tx!=null){e.x+=(e.tx-e.x)*k;e.y+=(e.ty-e.y)*k}
    e.flash=Math.max(0,e.flash-dt*7);e.hitCd-=dt;e.shown-=dt;if(e.slow>0)e.slow-=dt;if(e.frz>0)e.frz-=dt;if(e.burnT>0)e.burnT-=dt;e.wob+=dt*6;
    if(P.down||e.type==='archer'||e.type==='cible'||e.hitCd>0)continue;
    if(Math.hypot(P.x-e.x,P.y-e.y)<e.r+P.r){hurt(e.state==='charge'?e.dmg*1.4:e.dmg);e.hitCd=.8;if(e.type==='givrin')P.frzT=2.2*(1-Math.min(60,S.antidote||0)/100)}}}
// Monstre ciblé (hôte) : le héros debout le plus proche.
function netNear(e,P){if(!NET.host||!G.mates||!G.mates.length)return P;let best=P.down?null:P,bd=P.down?1e12:(P.x-e.x)**2+(P.y-e.y)**2;
  for(const q of G.mates){if(q.down)continue;const d=(q.x-e.x)**2+(q.y-e.y)**2;if(d<bd){bd=d;best=q}}return best||P}
// Héros à terre : relevé 8 s plus tard près d'un partenaire debout.
function heroDown(){const P=G.P;if(P.down)return;P.down=true;P.hp=0;P.downT=8;P.psnT=0;P.brnT=0;SND.play('lose');toast('<b style="color:#e0474b">Tu es à terre.</b> Tu te relèves dans 8 s si un partenaire tient bon.');
  coopCheckFail()}
function heroDownTick(dt){const P=G.P;P.downT-=dt*(mateNearSeal('main')?2:1);
  if(P.downT<=0){let Q=null,bd=1e12;for(const q of G.mates||[]){if(q.down)continue;const d=(q.x-P.x)**2+(q.y-P.y)**2;if(d<bd){bd=d;Q=q}}
    if(Q){P.down=false;P.hp=S.hp*.5;P.inv=2;P.x=Q.x+rand(-30,30);P.y=Q.y+rand(-30,30);resolve(P);burst(P.x,P.y,24,'#8fd3e0',180,3);toast('<b style="color:#8fd3e0">Relevé !</b>')}}}
// Relais des fins de manche (hôte) et attente (invité).
function coopWait(on){const el=$('exitBtn'),c=$('contBtn');if(!el)return;el.disabled=on;c.disabled=on;let w=$('coopWaitTxt');
  if(on){if(!w){w=document.createElement('p');w.id='coopWaitTxt';w.className='cx-hint';w.style.margin='0';el.parentElement.after(w)}w.textContent='Coopération : l\'hôte choisit de sortir ou de continuer.'}else if(w)w.remove()}

/* ---------- Écran de connexion ---------- */
function loadQr(){return new Promise(res=>{if(window.qrcode)return res(true);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';s.onload=()=>res(!!window.qrcode);s.onerror=()=>res(false);document.head.appendChild(s)})}
function qrSvg(text){try{const q=qrcode(0,'L');q.addData(text);q.make();return q.createSvgTag({cellSize:3,margin:2,scalable:true})}catch(e){return ''}}
function refreshCoopUi(){const b=$('coopBtn'),n=coopN();if(b)b.innerHTML=NET.on?`<span class="cx-dot"></span>Coop · ${n}`:NET.host&&NET.relay==='on'&&RL.code?`<span class="cx-dot"></span>Coop · ${RL.code}`:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/></svg>Coop';
  const sb=$('startBtn');if(sb&&NET.guest&&NET.on){sb.disabled=true;sb.textContent=`En attente de l'hôte${NET.hostMode?' · '+(MODES[NET.hostMode.mode]||MODES.survie).n:''}…`}else if(sb&&sb.disabled&&!NET.guest){sb.disabled=false;refreshMenus()}}
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
const coopLink=code=>{try{if(/^https?:$/.test(location.protocol)&&window.top===window)return `${location.origin}${location.pathname}#coop=${code}`}catch(e){}return 'CRYPTE:'+code};
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
      <div class="setrow"><div><b>Mission</b><span>${missionTxt(lobbyInfo())}. Le mode, le niveau et la difficulté se choisissent sur l'écran d'accueil${open.length?'':' ; la Brèche demande au moins un autre joueur'}.</span></div></div>
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
  if('BarcodeDetector' in window){try{const f=await BarcodeDetector.getSupportedFormats();if(f.includes('qr_code')){const det=new BarcodeDetector({formats:['qr_code']});return async v=>{const r=await det.detect(v);return r.length?r[0].rawValue:null}}}catch(e){}}
  if(!await loadJsQr())return null;
  const c=document.createElement('canvas'),g=c.getContext('2d',{willReadFrequently:true});
  return async v=>{const w=v.videoWidth,h=v.videoHeight;if(!w||!h)return null;const k=Math.min(1,960/Math.max(w,h));c.width=Math.round(w*k);c.height=Math.round(h*k);
    g.drawImage(v,0,0,c.width,c.height);const d=g.getImageData(0,0,c.width,c.height),r=jsQR(d.data,c.width,c.height,{inversionAttempts:'attemptBoth'});return r&&r.data?r.data:null}}
async function coopScan(then){const v=$('coopCam'),w=$('coopCamWrap');if(!v||!w)return;camStop();
  try{camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false})}
  catch(err){NET.err='Caméra indisponible ou refusée : autorise la caméra pour ce site, ou colle le code à la place.';drawCoop();return}
  v.srcObject=camStream;w.hidden=false;try{await v.play()}catch(e){}
  const read=await qrReader();if(!read){camStop();NET.err='Lecteur de QR code indisponible (hors connexion ?) : colle le code à la place.';drawCoop();return}
  let busy=false;const tick=async()=>{if(!camStream||w.hidden)return;if(!busy){busy=true;try{const code=await read(v);const c4=code&&RELAY_URL?((code.match(/(?:#coop=|^CRYPTE:)(\d{4})(?!\d)/)||code.trim().match(/^(\d{4})$/)||[])[1]):null;
        if(c4){camStop();SND.play('pick2');netJoinCode(c4);return}
        if(code&&/^[ZP][A-Za-z0-9_-]{40,}$/.test(code.trim())){camStop();SND.play('pick2');const box=$('coopIn');if(box)box.value=code.trim();
        if(then==='answer')netAnswerIn(code.trim());else if(then==='joingo')netJoin(code.trim());return}}catch(e){}busy=false}setTimeout(tick,120)};tick()}
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
    else if(a==='share4'){try{await navigator.share({title:'Crypte des Cendres',text:`Rejoins ma partie de Crypte des Cendres : code ${RL.code}`,...(/^CRYPTE:/.test(coopLink(RL.code))?{}:{url:coopLink(RL.code)})})}catch(x){}}
    else if(a==='host')netHost();else if(a==='add')netAddPeer();else if(a==='cancel')netCancelPending();
    else if(a==='join'){NET.state='joinIn';drawCoop()}
    else if(a==='joingo'){const c=$('coopIn').value;if(c.trim())netJoin(c)}
    else if(a==='answer'){const c=$('coopIn').value;if(c.trim())netAnswerIn(c)}
    else if(a==='copy'){const t=$('coopOut');try{await navigator.clipboard.writeText(t.value);b.textContent='Copié'}catch(x){t.select()}}
    else if(a==='share'){try{await navigator.share({text:$('coopOut').value})}catch(x){}}
    else if(a==='paste'){try{$('coopIn').value=await navigator.clipboard.readText()}catch(x){$('coopIn').focus()}}
    else if(a==='scan')coopScan(b.dataset.then);
    else if(a==='scanstop')camStop();
    else if(a==='quit'){if(NET.on)netSend({t:'bye',end:1});netReset();NET.retry=null;NET.drop=null;clearTimeout(RL.reT);coopForget();refreshCoopUi();drawCoop()}});
  $('coopBody').addEventListener('input',e=>{if(e.target.id!=='coopCode')return;const v=e.target.value.replace(/\D/g,'').slice(0,4);if(e.target.value!==v)e.target.value=v;if(v.length===4)netJoinCode(v)});
  $('coopBody').addEventListener('keydown',e=>{if(e.target.id==='coopCode'&&e.key==='Enter')netJoinCode(e.target.value)});
  // Lien d'invitation (#coop=1234) : la page ouvre la coopération et rejoint la partie toute seule.
  // (à l'ouverture de la page, ou si le lien est ouvert dans l'onglet où le jeu tourne déjà)
  const coopHash=delay=>{const m=location.hash.match(/^#coop=(\d{4})$/);if(!m||!RELAY_URL)return;try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    const go=()=>{if(started||(NET.on&&NET.guest))return;openCoop();netJoinCode(m[1])};delay?addEventListener('load',()=>setTimeout(go,delay)):go()};
  coopHash(300);addEventListener('hashchange',()=>coopHash(0));
  // Rechargement pendant une partie à code (mise à jour, page rechargée) : l'hôte rouvre sa salle sous le même code, l'invité la rejoint.
  {let c=null;try{c=JSON.parse(sessionStorage.getItem(COOP_SS)||'null')}catch(e){}
    if(c&&RELAY_URL&&Date.now()-(c.at||0)<10*60*1000&&!/^#coop=/.test(location.hash))addEventListener('load',()=>setTimeout(()=>{if(NET.on||NET.host||NET.guest||started)return;
      if(c.r==='h'&&c.code&&c.key){netHostCode(c.code,c.key);toast('Partie rouverte sous le code '+c.code+'.',true)}else if(c.r==='g'&&c.code){NET.retry={code:c.code,n:0};netJoinCode(c.code,true)}},500))}
  const btn=document.createElement('button');btn.className='cx-btn cx-btn--sm cx-btn--ghost';btn.style.margin='0';btn.id='coopBtn';btn.innerHTML='Coop';btn.onclick=openCoop;
  const g=$('guideBtn');if(g)g.before(btn);
})();
