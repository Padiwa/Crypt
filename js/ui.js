// Crypte des Cendres — ui.js : fiches partagées, pause et sac, montée de niveau, coût d'une action, fin de niveau et écran de fin de mission.
// Puissance : power.js ; interface des mods : modsui.js (v145).
/* ---------- Fiches partagées ---------- */
function statRows(St){
  const rows=[['Dégâts',Math.round(St.dmg)],['Attaques / s',St.aps.toFixed(2)],['Critique',Math.round(St.crit)+' %'],['Dégâts critiques',Math.round(St.critDmg)+' %'],['Puissance',Math.round(power(St))],...(()=>{const W=powerOf(St);return [['· attaques',Math.round(W.atk)],['· sort',Math.round(W.skill)],['· ultime',Math.round(W.ult+W.pulse)],...(W.pet?[['· familier',Math.round(W.pet)]]:[])]})(),['Vie',Math.round(St.hp)],['Réduction',Math.round(St.armor)+' %'],['Vitesse',Math.round(St.speed/2.2)+' %'],['Portée des compétences',Math.round(100+St.skillRad)+' %'],...(heroCls==='magicien'?[['Rayon d\'explosion',Math.round(100+St.splash)+' %']]:[]),heroCls==='guerrier'?['Ondes par coup',St.waves]:['Projectiles par tir',(1+St.multi).toFixed(St.multi%1?2:0)],['Double attaque',St.echo+' %'],['Dégâts de compétence',Math.round(St.nova)],
    // v141 : statuts posés par l'arme (chance par coup) et leurs bonus, montrés seulement s'ils servent
    ...[['Brûlure par seconde',St.burn,''],['Poison',St.psnCh,' %'],['Saignement',St.bldCh,' %'],['Ralentir',St.chill,' %'],['Éclair en chaîne',St.shock,' %'],['Étourdir',St.stunCh,' %'],['Immobiliser',St.rootCh,' %'],
      ['Durée des statuts',St.stDur,' %','+'],['Contagion',St.contag,' %'],['Dégâts des statuts',St.dotPct,' %','+'],['Brise-garde',St.ccDmg,' %','+'],['Épines',St.thorns,' %'],
      // v142 : mods de héros (capacités)
      ['Recharge du sort par ennemi abattu',St.flux,' s','−'],['Sort contre un statut',St.intSt,' %','+'],['Statuts du sort',St.impr,'','×'],['Étourdissement du sort',St.comm,' s'],['Bouclier au lancer du sort',St.gardA,' %'],
      ['Vitesse après une esquive',St.elan,' %','+'],['Protection après une esquive',St.peau,' %','−'],['Statuts à l\'esquive',St.pasEl,' %'],['Riposte (étourdit)',St.ripo,' s'],
      ['Potion gardée',St.econ,' %'],['Élixir de fer',St.exFer,' %','−'],['Élixir de rage',Math.floor(St.exRage||0),'','+'],['Durée des renforts',St.buffDur,' %','+'],['Jauge rendue au lancer',St.rema,' %'],['Statuts de l\'ultime',St.flea,'','×'],['Terreur (dégâts reçus)',St.terr,' %','−']
      ].filter(r=>r[1]>0).map(([a,v,u,sg])=>[a,(sg||'')+(v>=10?Math.round(v):+(+v).toFixed(1)).toString().replace('.',',')+u])];
  return rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
}
function slotsHtml(eq,click,selSlot){
  return Object.keys(SLOT).map(k=>{if(!slotOpen(k))return `<div class="slot locked" aria-disabled="true"><span>${SLOT[k]}</span><strong style="color:var(--muted)">Verrouillé</strong></div>`;const it=eq[k],tag=click?'button':'div';
    return `<${tag} class="slot${selSlot===k?' sel':''}"${click?` data-slot="${k}"`:''}><span>${SLOT[k]}</span><strong style="color:${it?RAR[it.r].c:'var(--muted)'}">${it?itemName(it):'Vide'}${it&&it.lock?`<span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:''}</strong></${tag}>`}).join('');
}
// ▲ : l'objet augmente la Puissance du héros (ou, à Puissance égale, sa survie).
function better(it){return memoOn('better',it,()=>{const e=curEq(),k=tgtKey(e,it);if(!k)return false;return eqGt(eqVal({...e,[k]:it}),eqVal(e))})}
const LOCK_SVG='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const cellHtml=(it,attr,sel,up)=>`<button class="cell${sel?' sel':''}${up?' up':''}${it.lock?' locked':''}" data-${attr}="${it.id}" style="border-color:${RAR[it.r].c};color:${RAR[it.r].c}" aria-label="${itemName(it)}${it.lock?', verrouillé':''}">${it.lock?`<span class="lk">${LOCK_SVG}</span>`:''}${it.up?`<span class="cup">R${it.up+1}</span>`:''}${GLYPH[it.slot]}</button>`;
// Clé d'une composition d'équipement (héros, arme, objets) pour le cache d'affichage.
const eqKey=e=>heroCls+'|'+Object.keys(e).map(k=>{const it=e[k];return it?(it.wid?'w'+it.wid+'.'+(meta.wlv[it.wid]|0):it.id+'.'+(it.up|0)):'-'}).join(',');
/* ---------- Pause ---------- */
let runSel=null;
function openBag(){if(G.over)return;paused=true;resetJoy();$('bag').hidden=false;runSel=null;modSel=null;quitAsk=false;G.fresh=0;$('bag').querySelectorAll('details[data-more]').forEach(d=>d.open=!!(typeof moreOpen!=='undefined'&&moreOpen[d.dataset.more]));drawBag()}
function closeBag(){$('bag').hidden=true;paused=false;quitAsk=false;last=performance.now()}
/* ---------- Pause › Retour au Camp : abandonne la mission ----------
   Tout ce qui a été trouvé dans ce niveau est perdu (objets, reliques, armes, or, expérience) ; les reliques équipées ne sont pas consommées.
   En coopération : un invité quitte la mission (les autres continuent) ; l'hôte l'arrête pour tous, les invités gardent leur butin. */
let quitAsk=false;
function abandonRun(){if(!G||G.over)return;
  if(NET.on){if(NET.guest)netSend({t:'leave'});else if(NET.host)netSend({t:'exit'})}
  G.over=true;G.hold=false;started=false;paused=false;quitAsk=false;resetJoy();
  ['bag','lvlup','extract','over'].forEach(id=>$(id).hidden=true);$('bossBar').hidden=true;$('objBar').hidden=true;
  newGame();$('intro').hidden=false;refreshMenus();refreshCoopUi();campTab='equip';openCamp();
  toast('Mission abandonnée : retour au Camp, le butin du niveau est perdu.')}
// Bouton « Retour au Camp » du pied de la pause (recréé si la page en cache est plus ancienne que les scripts).
{let q=$('quitBtnBag');if(!q){q=document.createElement('button');q.className='cx-btn quitbtn';q.id='quitBtnBag';q.textContent='Retour au Camp';const f=$('bagFoot');f&&f.insertBefore(q,$('closeBag'))}
  q.addEventListener('click',()=>{quitAsk=true;drawBag()})}
$('bagBtn').addEventListener('click',()=>{if(started&&!G.over&&$('extract').hidden&&$('lvlup').hidden)$('bag').hidden?openBag():closeBag()});
$('closeBag').addEventListener('click',closeBag);$('closeBagX').addEventListener('click',closeBag);
// Bascule WebGL ↔ rendu standard (Réglages › Rendu).
function rendToggle(){if(PX){dropPixi('choix du joueur');try{localStorage.setItem('crypte-nogl','1')}catch{}}else{try{localStorage.removeItem('crypte-nogl')}catch{}location.reload()}}
function drawBag(){
  {const rq=G.relic?`${G.react|0} / ${reactNeed()}`:`${(G.opened||[]).length} / ${G.relQ.length}`;
    $('bagSum').innerHTML=`<span><b>${G.level}</b><small>niveau</small></span><span><b class="g">${G.gold}</b><small>or</small></span><span><b>${G.kills|0}</b><small>monstres</small></span><span><b class="r">${G.relQ.length?rq:'—'}</b><small>${G.relic?'réactifs':'reliques'}</small></span>`+(()=>{const b=Math.round(stayBonus()*100);return b?`<em class="bagsum__stay">Bonus de séjour · butin des monstres +${b} %</em>`:''})()}
  $('slots').innerHTML=slotsHtml(G.eq,false);
  $('statgrid').innerHTML=statRows(S);
  $('bagKey').innerHTML=typeof keyStats==='function'?keyStats(S):'';
  $('runUpsTitle').textContent=`Bonus de la partie · héros niveau ${G.hl}`;
  const ru=RUP.filter(u=>G.run[u.k]);
  $('runUps').innerHTML=ru.length?ru.map(u=>`<span style="border-color:${u.c}">${u.n} <b>${G.run[u.k]>=u.max?'max':`${G.run[u.k]} / ${u.max}`}</b></span>`).join(''):'<p class="cx-hint" style="margin:0">Ramasse les cristaux d\'expérience pour monter de niveau et choisir des bonus.</p>';
  const L=G.loot,n=L.items.length;
  $('lootTitle').textContent=`Butin de la partie · ${n+L.relics.length+L.parts.length}`;
  const rplan=n?bestPlan(G.eq,L.items):{},rpn=Object.keys(rplan).length;
  if(runSel&&!L.items.some(i=>i.id===runSel))runSel=null;
  $('runLoot').innerHTML=(n||L.parts.length||L.relics.length)
    ?(rpn?`<button class="cx-btn cx-btn--block" id="bestRun" style="margin:0 0 3px">Équiper le meilleur butin · ${rpn}</button>`:'')+(n?`<div class="grid">${L.items.map(it=>cellHtml(it,'run',runSel===it.id,better(it))).join('')}</div><p class="cx-hint" style="margin:0">▲ : meilleur que ce que tu portes. Ce que tu n'équipes pas part au coffre si tu sors, et se perd si tu meurs.</p>`:'')
      +(L.relics.length?(()=>{const g={};for(const id of L.relics)g[id]=(g[id]||0)+1;return `<ul class="partlist">${Object.keys(g).sort((a,b)=>RELICS[b].t-RELICS[a].t).map(id=>`<li>Relique <b style="color:${RTIER[RELICS[id].t].c}">${relicName(id)}</b>${g[id]>1?` ×${g[id]}`:''}</li>`).join('')}</ul>`})():'')
      +(L.parts.length?`<ul class="partlist">${L.parts.map(p=>`<li>${partLabel(p)}</li>`).join('')}</ul>`:'')
    :'<p class="cx-hint" style="margin:0">Rien pour l\'instant. Les monstres lâchent parfois des équipements et des reliques, les Gardiens toujours.</p>';
  $('runLoot').querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>{const id=+b.dataset.run;runSel=runSel===id?null:id;modSel=null;drawBag()});
  if($('bestRun'))$('bestRun').onclick=()=>{const plan=bestPlan(G.eq,G.loot.items);for(const sl in plan){const it=plan[sl];G.loot.items=G.loot.items.filter(i=>i!==it);wearGear(sl,it);G.eq[sl]=it}saveMeta();refreshStats();runSel=null;toast(`${Object.keys(plan).length} objet${Object.keys(plan).length>1?'s':''} équipé${Object.keys(plan).length>1?'s':''}`);drawBag()};
  if(modTab==='p'&&!petEq())modTab='h';
  {const d=$('bagModsT').closest('details');if(d)d.hidden=!isUnl('mods')}
  $('bagModsT').textContent=`Mods · ${bActive(build('w')).length+bActive(build('h')).length} actifs`;
  renderMods('modsBag');
  // fiche ancrée : objet du butin choisi (prioritaire sur le détail d'un mod)
  if(quitAsk){runSel=null;modSel=null}
  if(runSel){const it=L.items.find(i=>i.id===runSel),cur=G.eq[tgtKey(G.eq,it)];
    $('bagDock').innerHTML=`<div class="cx-dock__head"><h3 class="cx-dock__title" style="color:${RAR[it.r].c}">${esc(itemName(it))}</h3><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-bag="close" aria-label="Fermer le détail"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <span class="cx-dock__meta">${RAR[it.r].n} · ${SLOT[it.slot]} · niveau ${it.lvl}</span>
      ${(()=>{const k='r:'+it.id;if(k!==cmpKey){cmpKey=k;cmpPage=0}return cmpObjet(G.eq,it)})()}<button class="cx-btn cx-btn--primary cx-btn--block" data-bag="equip" data-arg="${it.id}" style="margin-top:4px">Équiper maintenant${cur?` · remplace ${esc(itemName(cur))}`:''}</button><p class="cx-hint" style="margin:0">Un objet équipé est gardé même si tu meurs. L'ancien part au coffre du Camp.</p>`;
    $('bagDock').hidden=false;$('bagFoot').hidden=true}
  else if(quitAsk){const L=G.loot,no=L.items.length+L.parts.length,nr=L.relics.length,pl=(n,w)=>`${n} ${w}${n>1?'s':''}`,lostL=[no?pl(no,'objet'):'',nr?pl(nr,'relique'):'',G.gold?`${G.gold} or`:''].filter(Boolean),lost=lostL.length;
    $('bagDock').innerHTML=`<div class="cx-dock__head"><h3 class="cx-dock__title">Retourner au Camp ?</h3></div>
      <p style="margin:0">Tu abandonnes la mission et tu perds tout ce que tu as accumulé dans ce niveau${lost?` (${lostL.join(', ')})`:''}, ainsi que l'expérience. Tes reliques équipées ne sont pas consommées.</p>
      ${NET.on?`<p class="cx-hint" style="margin:0">${NET.host?'Coopération : la mission s\'arrête pour tout le monde, tes partenaires gardent leur butin.':'Coopération : tes partenaires continuent sans toi ; tu les rejoindras à la prochaine mission.'}</p>`:''}
      <div class="cx-actions" style="margin:0"><button class="cx-btn" data-bag="quitno">Continuer la mission</button><button class="cx-btn cx-btn--danger" data-bag="quitok">Retour au Camp</button></div>`;
    $('bagDock').hidden=false;$('bagFoot').hidden=true}
  else if(!modSel){$('bagDock').hidden=true;$('bagFoot').hidden=false}
}
$('bagDock').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.bag==='quitno'){quitAsk=false;drawBag();return}if(b.dataset.bag==='quitok'){abandonRun();return}
  if(b.dataset.bag==='close'){runSel=null;drawBag()}else if(b.dataset.bag==='equip')equipRun(+b.dataset.arg);else if(b.dataset.act)modAct(b.dataset.act,b.dataset)});
/* ---------- Montée de niveau ---------- */
function gainXp(v){
  // En coopération chacun reçoit l'expérience de tous les monstres, plus nombreux : on la divise d'autant pour garder le rythme du solo.
  G.xp+=v*(1+(S.xpPct||0)/100)/(typeof NET!=='undefined'&&NET.on?coopCnt():1);
  while(G.xp>=xpNeed(G.hl)){G.xp-=xpNeed(G.hl);G.hl++;G.pend++}
  if(G.pend&&$('lvlup').hidden&&!G.over)showLevelUp();
}
let luShown=0;
// v139 : sous l'effet d'un bonus, ce qu'il te donne déjà (rang actuel) → ce qu'il donnera si tu le prends ; le plafond est signalé quand la statistique l'atteint.
function luCum(u,rk){
  if(u.k==='fiole'){const n=G.potions|0,m=potMax();return `<span class="choice__cum"><span class="choice__cumk">Potions</span> ${n} → <span class="choice__cumv">${Math.min(m,n+1)}</span> sur ${m}</span>`}
  const f=RUP_CU[u.k];if(!f||!u.max)return '';const cp=RUP_CAP[u.k];let cap='';
  if(cp){const R=G.run;let s1=null;R[u.k]=rk+1;try{s1=stats(G.eq)}catch{}finally{if(rk)R[u.k]=rk;else delete R[u.k]}if(s1&&s1[cp[0]]>=cp[1])cap=` · plafond ${cp[1]} % atteint`}
  return `<span class="choice__cum"><span class="choice__cumk">Cumul</span> ${f(rk)} → <span class="choice__cumv">${f(rk+1)}</span>${cap}</span>`}
function showLevelUp(){SND.play('lvl');
  paused=true;resetJoy();$('bag').hidden=true;
  const capped={crit:S.crit>=75,cdr:S.cdr>=50,refl:S.dashCd>=60,endu:S.antidote>=60};
  const av=RUP.filter(u=>(!u.cls||u.cls.includes(G.cls))&&(G.run[u.k]||0)<u.max&&!capped[u.k]&&(u.k!=='fiole'||G.potions<potMax())),pool=[...av],out=[];
  while(out.length<3&&pool.length)out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  for(const f of RUP_FILL)if(out.length<3)out.push(f);
  $('luSub').textContent=`Héros niveau ${G.hl-G.pend+1}`;
  // v130 : cartes verticales (catégorie, nom, effet, rangs) ; la couleur de catégorie reste celle du jeu.
  const CAT={[C_ATK]:'Attaque',[C_DEF]:'Défense',[C_UTI]:'Utilité',[C_ELE]:'Élément'};
  $('choices').innerHTML=out.map((u,i)=>{const rk=G.run[u.k]||0;
    const d=u.k==='purse'?`+${20*G.level} or`:u.d,rkt=u.max?(rk+1>=u.max&&rk?`rang ${rk+1} / ${u.max} · dernier`:rk?`rang ${rk} → ${rk+1} / ${u.max}`:`rang 1 / ${u.max}`):'',cum=luCum(u,rk);
    return `<button class="choice${!rk&&u.max?' is-new':''}${cum?' has-cum':''}" data-k="${u.k}" style="--cc:${u.c||'var(--gold2)'}"><span class="k">${i+1}</span>${CAT[u.c]?`<span class="choice__cat">${CAT[u.c]}</span>`:''}${!rk&&u.max?'<span class="choice__new">Nouveau</span>':''}<b>${u.n}</b><p>${d}</p>${cum}${u.max?`<span class="pips" aria-hidden="true">${Array.from({length:u.max},(_,j)=>`<i class="${j<rk?'on':j===rk?'nx':''}"></i>`).join('')}</span><small${rk+1>=u.max&&rk?' class="last"':''}>${rkt}</small>`:''}</button>`}).join('');
  $('choices').querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(performance.now()-luShown<350)return;pickUp(b.dataset.k)});
  luShown=performance.now();
  $('lvlup').hidden=false;
}
function pickUp(k){
  if(k==='heal')heal(S.hp*.4);
  else if(k==='purse')G.gold+=20*G.level;
  else if(k==='fiole'){G.run.fiole=(G.run.fiole||0)+1;G.potions=Math.min(potMax(),G.potions+1)}
  else{G.run[k]=(G.run[k]||0)+1;refreshStats();if(k==='hp')heal(S.hp*.15)}
  G.pend--;$('lvlup').hidden=true;
  burst(G.P.x,G.P.y,20,'#9fe3f0',160);
  if(G.pend>0)showLevelUp();else{paused=false;last=performance.now()}
}
function equipRun(id){
  const it=G.loot.items.find(i=>i.id===id);if(!it)return;
  G.loot.items=G.loot.items.filter(i=>i!==it);
  const k=tgtKey(G.eq,it);if(!k){G.loot.items.push(it);toast('Emplacement verrouillé');return}
  const old=meta.gear[k];if(old){meta.stash.push(old)}
  meta.gear[k]=it;G.eq[k]=it;saveMeta();refreshStats();runSel=null;
  toast(`<span style="color:${RAR[it.r].c}">${it.name}</span> équipé`);drawBag();
}
function refreshStats(){if(!G)return;const ratio=G.P.hp/S.hp;S=stats(G.eq);G.P.hp=Math.max(1,Math.min(S.hp,ratio*S.hp))}

/* ---------- Coût d'une action (v134) ----------
   Chaque ressource est nommée et a son icône : « 1 200 or », « 50 essence », « 3 fragments de l'objet », « 12 fragments de harnais »…
   Ce qui manque est en rouge, avec ce que tu as. parts : [[sorte, quantité, ce que tu as (facultatif), précision]]. */
const COST_K={
  or:{i:'<span class="coin"></span>',n:()=>'or',h:()=>meta.gold},
  ess:{i:'<i class="cx-ess"></i>',n:()=>'essence',h:()=>meta.essence},
  frag:{i:'<i class="cost__frag"></i>',n:q=>`fragment${q>1?'s':''} d'objet`,h:()=>fragTotal()},
  pf:{i:'<i class="cost__frag"></i>',n:q=>`fragment${q>1?'s':''} de l'objet`,h:null},
  hf:{i:'<i class="cost__hf"></i>',n:q=>`fragment${q>1?'s':''} de harnais`,h:()=>meta.hfrag|0},
  rel:{i:'<i class="cost__rel"></i>',n:(q,x)=>`relique${q>1?'s':''} ${RTIER[x].n}${q>1?'s':''}`,h:null},
  cp:{i:'<i class="cost__cp"></i>',n:q=>`copie${q>1?'s':''} du mod`,h:null},
  sh:{i:'<i class="cost__sh"></i>',n:q=>`éclat${q>1?'s':''} légendaire${q>1?'s':''}`,h:()=>meta.lshard|0}};
function costHtml(parts){return `<span class="cost">${parts.filter(p=>p&&p[1]>0).map(([k,q,have,x])=>{const K=COST_K[k],h=have!=null?have:K.h?K.h():null,short=h!=null&&h<q;
  return `<span class="cost__p${short?' is-short':''}" title="${short?`il te manque ${fmtBig(q-h)}, tu as ${fmtBig(h)}`:''}">${K.i}<b>${fmtBig(q)}</b> ${K.n(q,x)}</span>`}).join('')}</span>`}
function modsChanged(){if(started&&G&&!G.over){refreshStats();if(G.pet||petEq())G.petS=petStats()}if(!$('bag').hidden)drawBag();if(!$('camp').hidden)drawCamp()}

/* ---------- Fin de niveau, extraction, mort ---------- */
function lootSummary(){
  const L=G.loot,its=L.items.length;
  const byR={};for(const i of L.items)byR[i.r]=(byR[i.r]||0)+1;const byT={};for(const id of L.relics){const t=RELICS[id].t;byT[t]=(byT[t]||0)+1}
  const lc=(c,n,lab)=>`<span class="lc" style="--c:${c}" title="${lab}">${n} ${lab}</span>`;
  return `<div><span>Or ramassé</span><b style="color:var(--r2)">${G.gold}</b></div>
    <div><span>Équipements</span><b>${its?`${its} · `+Object.keys(byR).sort((a,b)=>b-a).map(r=>lc(RAR[r].c,byR[r],RAR[r].n.toLowerCase()+(byR[r]>1?'s':''))).join(''):'0'}</b></div>
    <div><span>Reliques</span><b>${L.relics.length?`${L.relics.length} · `+Object.keys(byT).sort((a,b)=>b-a).map(t=>lc(RTIER[t].c,byT[t],RTIER[t].n)).join(''):'0'}</b></div>
    ${(()=>{const W=L.parts.filter(p=>!p.hf),H=L.parts.length-W.length,b={};for(const p of W){const r=wdef(p.w).r;b[r]=(b[r]||0)+1}
      return (W.length?`<div><span>Armes</span><b>${W.length} · `+Object.keys(b).sort((x,y)=>y-x).map(r=>lc(RAR[r].c,b[r],RAR[r].n.toLowerCase()+(b[r]>1?'s':''))).join('')+`</b></div>`:'')+(H?`<div><span>Fragments de harnais</span><b style="color:var(--rar-aby)">${H}</b></div>`:'')})()}
    ${G.relQ.length?`<div><span>Reliques ouvertes</span><b>${G.opened.length} / ${G.relQ.length}${G.relic?` · ${G.react} / ${reactNeed()} réactifs`:''}</b></div>`:''}${(G.shared||[]).length?`<div><span>Partagées par les partenaires</span><b>${G.shared.length}</b></div>`:''}<div><span>Ennemis abattus</span><b>${G.kills}</b></div><div><span>Temps de survie</span><b>${fmt(G.t)}</b></div>`;
}
function roundDone(){
  objDone();
  if(NET.on){G.hold=true;if(NET.host)netSend({t:'round'})}
  paused=true;resetJoy();$('bag').hidden=true;$('lvlup').hidden=true;
  const nl=G.level+1,unlock=false;
  if(unlock){meta.cp=nl;saveMeta()}
  const r=relicDrop();G.loot.relics.push(r);let extra='';
  if(G.mode==='defense'){const it=genItem(itemLvl(),1);G.loot.items.push(it);extra=` et <span style="color:${RAR[it.r].c}">${it.name}</span>`}
  $('exTitle').textContent=G.mode==='defense'?`Vague ${G.wave} repoussée`:`Niveau ${G.level} terminé`;
  $('exLead').innerHTML=(G.mode==='defense'?'Le cryopode tient. ':'Un portail s\'ouvre. ')+`Récompense de manche : relique <b style="color:${RTIER[RELICS[r].t].c}">${relicName(r)}</b>${extra}. Sors pour tout garder, ou continue : au niveau ${G.level+1}, les monstres seront plus forts.`+(unlock?` Tu peux désormais commencer au niveau ${nl}.`:'')
    +(()=>{const n=Math.round((BAL.stayLoot||0)*100),mx=Math.round((BAL.stayLootMax||0)*100),b=Math.round(stayBonus()*100);if(!n)return '';return `<br><span style="color:#f0cf4a">Bonus de séjour</span> : ${b?`butin des monstres +${b} %. `:''}${b>=mx?(b?'C\'est le maximum.':''):`${b?'E':'e'}n continuant, il grandit de ${n} % par minute, jusqu'à +${mx} %.`}`})()
    +(()=>{const b=tormBoost();if(!b.t||!G.relQ.length)return '';return `<br><span style="color:#ff6a3a">Bonus du Tourment</span> : ${reactNeed()} réactifs par relique au lieu de ${REACT_N}${b.relic?`, reliques +${Math.round(b.relic*100)} %`:''}. Il grandit toutes les 2 minutes passées dans la mission.`})();
  $('exSum').innerHTML=lootSummary();
  $('contBtn').textContent=`Continuer · niveau ${G.level+1}`;
  $('extract').hidden=false;
}
function bank(full){
  const g=full?G.gold:Math.floor(G.gold/2);meta.gold+=g;G.run={};
  // maîtrises du héros et de l'arme, niveau du familier : un point par ennemi abattu
  const gainM=mt=>{if(mt.r<10){mt.xp+=G.kills;while(mt.r<10&&mt.xp>=mastNeed(mt.r)){mt.xp-=mastNeed(mt.r);mt.r++}if(mt.r>=10)mt.xp=0}};
  gainM(mastOf(G.cls));gainM(mstOf(meta.wmast,G.wid));petBank(G.kills);
  if(full){tutWin();
    for(const it of G.loot.items)meta.stash.push(it)
    for(const p of G.loot.parts){if(p.hf)meta.hfrag=(meta.hfrag|0)+1;else if(p.full)gainWeapon(p.w);else if(meta.built[p.w])meta.essence+=6;else{const a=meta.parts[p.w]||(meta.parts[p.w]=[0,0,0]);a[p.p]++}}
    meta.maxL=Math.max(meta.maxL|0,G.level);
    for(const id of G.loot.relics){const a=meta.relics[id]||(meta.relics[id]=[0,0]);a[0]++}
  }
  sealBank(full);saveMeta();return g;
}
function recordBest(){if(G.t>best){best=G.t;try{localStorage.setItem('crypte-best2',String(best))}catch{}}}
/* ---------- Écran de fin de mission (v133), style des maquettes « Résultats » et « Défaite » de la refonte ----------
   Huit compteurs : or, Gardiens vaincus, objectifs réalisés, reliques trouvées, reliques ouvertes, fragments, mods, équipements ;
   puis tous les équipements rapportés (ou perdus), 12 par page. En bas : Au Camp (accueil du jeu) et Rejouer ou Réessayer (même mission). */
const OVR_PAGE=12,OVR={eq:[],pg:0,sel:-1,lost:false};
const ovrNum=n=>Math.round(n||0).toLocaleString('fr-FR');
const ovrDur=t=>{t=Math.max(0,Math.round(t));const m=Math.floor(t/60),s=t%60;return m?`${m} min ${String(s).padStart(2,'0')}`:`${s} s`};
const ovrTag=()=>`${MODES[G.mode]?MODES[G.mode].n:'Mission'} · ${esc(dif().n)} · niveau ${G.level} · ${ovrDur(G.t)}`;
// Équipements de la mission : objets et armes entières, les plus rares d'abord
function ovrEqList(){const L=G.loot,E=[];
  for(const it of L.items){const s=it.slot==='anneau2'?'anneau':it.slot;E.push({r:it.r,ico:GLYPH[s]||GLYPH.armure,n:itemName(it),k:SLOT[it.slot]||'Objet'})}
  for(const p of L.parts){if(p.hf||!p.full)continue;const w=wdef(p.w);if(w)E.push({r:w.r,ico:GLYPH.arme,n:w.n,k:'Arme'})}
  return E.map((e,i)=>({...e,i})).sort((a,b)=>b.r-a.r||a.i-b.i)}
function ovrEqHtml(){const E=OVR.eq,np=Math.max(1,Math.ceil(E.length/OVR_PAGE)),pg=OVR.pg=Math.min(Math.max(0,OVR.pg),np-1),s=E[OVR.sel];
  if(!E.length)return `<p class="ovr__none">${OVR.lost?'Aucun équipement perdu.':'Aucun équipement cette fois.'}</p>`;
  return `<div class="ovr__grid${OVR.lost?' is-lost':''}${np>1?' is-paged':''}">${E.slice(pg*OVR_PAGE,pg*OVR_PAGE+OVR_PAGE).map((e,k)=>{const i=pg*OVR_PAGE+k;
      return `<button class="ovr__slot${i===OVR.sel?' is-sel':''}" data-ovi="${i}" style="--rar:${RARV[e.r]}" aria-label="${esc(e.n)}, ${RAR[e.r].n.toLowerCase()}">${e.ico}</button>`}).join('')}</div>
    <p class="ovr__cap" aria-live="polite">${s?`<b style="color:${RAR[s.r].c}">${esc(s.n)}</b> · ${RAR[s.r].n} · ${s.k}`:'Touche un objet pour voir son nom.'}</p>
    ${np>1?`<div class="ovr__pager"><button class="cx-btn cx-btn--sm" data-ovpg="-1" aria-label="Page précédente"${pg?'':' disabled'}>‹</button><span>Page ${pg+1} / ${np}</span><button class="cx-btn cx-btn--sm" data-ovpg="1" aria-label="Page suivante"${pg<np-1?'':' disabled'}>›</button></div>`:''}`}
function ovrEqDraw(){const e=$('ovrEq');if(e)e.innerHTML=ovrEqHtml()}
$('overBody').addEventListener('click',e=>{const pg=e.target.closest('[data-ovpg]'),it=e.target.closest('[data-ovi]');
  if(pg&&!pg.disabled){OVR.pg+=+pg.dataset.ovpg;OVR.sel=-1;ovrEqDraw();SND.play('ui')}
  else if(it){const i=+it.dataset.ovi;OVR.sel=OVR.sel===i?-1:i;ovrEqDraw()}});
// o : {win, gold, relF (trouvées), relO (ouvertes), relSh (dont partagées), frag, title}
function ovrHtml(o){const k=G.bossK|0,mods=(G.modsGot||[]).length,cap=G.mode==='capture',obj=G.objN|0,E=OVR.eq,W=o.win;
  const tile=(key,v,lab,c,cls)=>`<span class="ovr__tile${cls?' '+cls:''}" data-k="${key}"><b${c?` style="color:${c}"`:''}>${v}</b><small>${lab}</small></span>`;
  const head=W?`<header class="ovr__head"><span class="ovr__rays" aria-hidden="true"></span><i class="ovr__ember" style="left:5%;top:58px"></i><i class="ovr__ember" style="right:7%;top:104px"></i><i class="ovr__ember ovr__ember--s" style="left:66%;top:-20px"></i>
      <span class="ovr__tag">${ovrTag()}</span><h2 class="ovr__title" id="overTitle">${o.title}</h2><span class="ovr__ribbon">Réussie</span></header>`
    :`<header class="ovr__head ovr__head--dead"><span class="ovr__fallen" aria-hidden="true"><canvas id="overHero" width="160" height="160"></canvas></span>
      <h2 class="ovr__title ovr__title--dead" id="overTitle">${o.title}</h2><span class="ovr__tag">${ovrTag()}</span></header>`;
  return head+`<div class="ovr__tiles">
      ${tile('gold','+'+ovrNum(o.gold),W?'or':'or gardé · moitié','var(--gold)')}
      ${tile('boss',ovrNum(k),`Gardien${k>1?'s':''} vaincu${k>1?'s':''}`,'#c79bff')}
      ${tile('obj',ovrNum(obj),cap?`cible${obj>1?'s':''} capturée${obj>1?'s':''}`:`objectif${obj>1?'s':''} réalisé${obj>1?'s':''}`,'#7fe08a')}
      ${tile('relF',ovrNum(o.relF),W?`relique${o.relF>1?'s':''} trouvée${o.relF>1?'s':''}`:`relique${o.relF>1?'s':''} perdue${o.relF>1?'s':''}`,'#ff8a24',W?'':'is-lost')}
      ${tile('relO',ovrNum(o.relO),W?`relique${o.relO>1?'s':''} ouverte${o.relO>1?'s':''}${o.relSh?` · dont ${o.relSh} partagée${o.relSh>1?'s':''}`:''}`:`relique${o.relO>1?'s':''} ouverte${o.relO>1?'s':''}`,'#ff5a7a')}
      ${tile('frag',ovrNum(o.frag),W?`fragment${o.frag>1?'s':''}`:`fragment${o.frag>1?'s':''} perdu${o.frag>1?'s':''}`,'#8fd3e0',W?'':'is-lost')}
      ${tile('mods',ovrNum(mods),`mod${mods>1?'s':''}${W?'':` gardé${mods>1?'s':''}`}`,'#f0cf4a')}
      ${tile('eq',ovrNum(E.length),W?`équipement${E.length>1?'s':''}`:`équipement${E.length>1?'s':''} perdu${E.length>1?'s':''}`,'var(--ink)',W?'':'is-lost')}
    </div>
    <section class="ovr__sec"><h3 class="ovr__lab">${W?'Équipements rapportés':'Équipements perdus'} · ${E.length}</h3><div id="ovrEq">${ovrEqHtml()}</div></section>`}
function overShow(o){const el=$('over'),b=$('overBody');OVR.eq=ovrEqList();OVR.pg=0;OVR.sel=-1;OVR.lost=!o.win;
  el.classList.toggle('is-dead',!o.win);b.innerHTML=ovrHtml(o);b.scrollTop=0;$('againLab').textContent=o.win?'Rejouer':'Réessayer';
  unlockCheck(false);refreshMenus();el.hidden=false;if(!o.win)try{heroPaint($('overHero'),G.cls,-Math.PI/2+1.75,1.1)}catch(err){noteErr('fin de mission',err)}}
// Fragments de la mission : fragments d'armes et de harnais ramassés, et ceux donnés par les reliques ouvertes
const ovrFrag=()=>G.loot.parts.filter(p=>p.hf||!p.full).length;
// Ouvre une relique : un fragment d'un objet de sa rareté (deux si éclatante ; la relique forgée vise son objet).
// Ouvre une relique : fragments de sa rareté pour le héros joué. free : relique partagée par un autre joueur, rien n'est dépensé.
function grantRelic(id,rad,free){
  const a=meta.relics[id],R=RELICS[id];if(!R||(!free&&(!a||a[rad?1:0]<=0)))return null;
  if(!free)a[rad?1:0]--;const n=rad?2:1,got=[];
  for(let i=0;i<n;i++){const pool=R.fz?[R.tgt]:relPool(R.t);if(!pool.length)break;
    // les fragments manquants d'un objet presque complet passent un peu avant
    const w=pool.map(x=>1+fragStatus(x)*.5),tot=w.reduce((p,q)=>p+q,0);let x=Math.random()*tot,k=0;while(x>w[k]&&k<pool.length-1){x-=w[k];k++}
    const bid=pool[k],fi=giveFrag(bid);got.push({bid,fi})}
  relicQFix();
  return {got,html:got.map(g=>{const b=bpdef(g.bid),st=fragStatus(g.bid);return `<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> · fragment ${b.frag[g.fi]} (${st} / 3${st>=3?', prêt à fabriquer':''})`}).join(' et ')}}
function resolveRelic(){
  const S={n:0,sh:0,frag:0};
  const one=(r,free)=>{const g=grantRelic(r.id,r.rad,free);if(!g)return;meta.essence+=25;if(free)S.sh++;else S.n++;S.frag+=g.got.length;eggFromRelic(r.id)};
  for(const r of G.opened)one(r,false);
  for(const r of G.shared||[])one(r,true);
  meta.relOpened=(meta.relOpened|0)+S.n;
  return S;
}
function missionSuccess(){SND.play('win');if(NET.host)netSend({t:'exit'});G.hold=false;
  $('extract').hidden=true;$('lvlup').hidden=true;G.over=true;const relF=G.loot.relics.length,frag0=ovrFrag(),R=resolveRelic(),g=bank(true);recordBest();
  overShow({win:true,title:G.mode==='capture'?'Capture':'Extraction',gold:g,relF,relO:R.n+R.sh,relSh:R.sh,frag:frag0+R.frag});
}
function gameOver(reason){
  if(G.over)return;if(NET.host)netSend({t:'fail'});G.hold=false;SND.play('lose');G.over=true;const g=bank(false);recordBest();
  setTimeout(()=>overShow({win:false,title:reason==='pod'?'Cryopode détruit':'Tu es tombé',gold:g,relF:G.loot.relics.length,relO:G.opened.length,relSh:0,frag:ovrFrag()}),700);
}
$('exitBtn').onclick=()=>{if(NET.guest)return;missionSuccess()};
function contRun(){$('extract').hidden=true;G.level++;G.hold=false;
  if(G.mode==='survie')G.tl=0;else{G.waveState='break';G.waveT=5;G.pod.hp=Math.min(G.pod.max,G.pod.hp+G.pod.max*.3)}
  paused=false;last=performance.now();toast(`<b style="color:var(--ember)">Niveau ${G.level}.</b> Les monstres se renforcent.`)}
$('contBtn').onclick=()=>{if(NET.guest)return;if(NET.host)netSend({t:'cont'});contRun()};

