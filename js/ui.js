// Crypte des Cendres — ui.js
/* ---------- Fiches partagées ---------- */
function statRows(St){
  const rows=[['Dégâts',Math.round(St.dmg)],['Attaques / s',St.aps.toFixed(2)],['Critique',Math.round(St.crit)+' %'],['Dégâts critiques',Math.round(St.critDmg)+' %'],['Puissance (DPS)',Math.round(dps(St))],['Vie',Math.round(St.hp)],['Réduction',Math.round(St.armor)+' %'],['Vitesse',Math.round(St.speed/2.2)+' %'],['Portée des compétences',Math.round(100+St.skillRad)+' %'],...(heroCls==='magicien'?[['Rayon d\'explosion',Math.round(100+St.splash)+' %']]:[]),heroCls==='guerrier'?['Ondes par coup',St.waves]:['Projectiles par tir',(1+St.multi).toFixed(St.multi%1?2:0)],['Double attaque',St.echo+' %'],[CLS[heroCls].skill,Math.round(St.nova)]];
  return rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
}
function slotsHtml(eq,click,selSlot){
  return Object.keys(SLOT).map(k=>{if(!slotOpen(k))return `<div class="slot locked" aria-disabled="true"><span>${SLOT[k]}</span><strong style="color:var(--muted)">Verrouillé</strong></div>`;const it=eq[k],tag=click?'button':'div';
    return `<${tag} class="slot${selSlot===k?' sel':''}"${click?` data-slot="${k}"`:''}><span>${SLOT[k]}</span><strong style="color:${it?RAR[it.r].c:'var(--muted)'}">${it?itemName(it):'Vide'}${it&&it.lock?`<span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:''}</strong></${tag}>`}).join('');
}
function better(it){const e=curEq(),k=tgtKey(e,it);if(!k)return false;return itemScore({...e,[k]:it})>itemScore(e)*1.0001}
const LOCK_SVG='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const cellHtml=(it,attr,sel,up)=>`<button class="cell${sel?' sel':''}${up?' up':''}${it.lock?' locked':''}" data-${attr}="${it.id}" style="border-color:${RAR[it.r].c};color:${RAR[it.r].c}" aria-label="${itemName(it)}${it.lock?', verrouillé':''}">${it.lock?`<span class="lk">${LOCK_SVG}</span>`:''}${it.up?`<span class="cup">R${it.up+1}</span>`:''}${GLYPH[it.slot]}</button>`;
const itemScore=e=>{const x=stats(e);let d=dps(x)*(1+x.abSoul*.06)*(1+x.abExec*.015)*(1+x.crit/100*x.abRift/100*2.1)*(1+x.abHunt*.0025)+x.dmg*x.abPulse/100*.8;d*=1+x.execute*.003+x.bossDmg*.0015+x.lowDmg*.001+x.shock*.01+x.chill*.003+x.ultPct*.001+x.fury*.002;// Attaque et survie pèsent ensemble (moyenne géométrique) : gagner 10 % de vie vaut à peu près gagner 12 % de dégâts, quel que soit le niveau.
  const v=(x.hp+x.abWard*8)/(1-Math.min(60,x.armor)/200)*(1+x.lowArmor*.003+x.potHeal*.001+x.antidote*.001+x.auraSlow*.003)+x.regen*15;
  return Math.pow(Math.max(1,d),.55)*Math.pow(Math.max(1,v),.45)};
// Meilleur équipement : pour chaque emplacement, l'objet qui donne le meilleur score (puissance et vie).
// wpn (au Camp) : compare aussi les armes possédées du héros, chacune avec ses propres mods et sa maîtrise.
function bestPlan(e,pool,wpn){const cur={...e},pick={};
  for(let pass=0;pass<2;pass++)for(const sl of Object.keys(e).filter(k=>k!=='arme')){let best=cur[sl],bs=itemScore(cur);
    for(const it of pool){if(it.slot!==keySlot(sl)||Object.values(cur).includes(it)&&cur[sl]!==it||Object.values(pick).includes(it)&&pick[sl]!==it)continue;const sc=itemScore({...cur,[sl]:it});if(sc>bs+1e-6){bs=sc;best=it}}
    if(best!==cur[sl]){cur[sl]=best;pick[sl]=best}}
  if(wpn&&!started){const c=heroCls,w0=meta.wpn[c],now=curWid(c);let bs=itemScore(cur),bw=null;
    try{for(const w of WPN[c])if(w.id!==now&&ownedW(w.id)){meta.wpn[c]=w.id;const sc=itemScore({...cur,arme:weaponItem(c,w.id)});if(sc>bs+1e-6){bs=sc;bw=w.id}}}finally{meta.wpn[c]=w0}
    if(bw)pick.arme=weaponItem(c,bw)}
  return pick}
/* ---------- Pause ---------- */
let runSel=null;
function openBag(){if(G.over)return;paused=true;resetJoy();$('bag').hidden=false;runSel=null;modSel=null;quitAsk=false;G.fresh=0;$('bag').querySelectorAll('details[data-more]').forEach(d=>d.open=!!(typeof moreOpen!=='undefined'&&moreOpen[d.dataset.more]));$('rendTxt').textContent=PX?'Rendu WebGL (PixiJS)':'Rendu standard';$('rendBtn').textContent=PX?'Passer au rendu standard':'Essayer WebGL';drawBag()}
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
$('rendBtn').addEventListener('click',()=>{if(PX){dropPixi('choix du joueur');try{localStorage.setItem('crypte-nogl','1')}catch(e){}}else{try{localStorage.removeItem('crypte-nogl')}catch(e){}location.reload()}});
function drawBag(){
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
  if($('bestRun'))$('bestRun').onclick=()=>{const plan=bestPlan(G.eq,G.loot.items);for(const sl in plan){const it=plan[sl];G.loot.items=G.loot.items.filter(i=>i!==it);const old=meta.gear[sl];if(old)meta.stash.push(old);meta.gear[sl]=it;G.eq[sl]=it}saveMeta();refreshStats();runSel=null;toast(`${Object.keys(plan).length} objet${Object.keys(plan).length>1?'s':''} équipé${Object.keys(plan).length>1?'s':''}`);drawBag()};
  if(modTab==='p'&&!petEq())modTab='h';
  {const d=$('bagModsT').closest('details');if(d)d.hidden=!isUnl('mods')}
  const bb=build(modTab==='p'?'h':modTab);$('bagModsT').textContent=`Mods · ${bActive(build('w')).length+bActive(build('h')).length} actifs`;
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
function showLevelUp(){SND.play('lvl');
  paused=true;resetJoy();$('bag').hidden=true;
  const capped={crit:S.crit>=75,cdr:S.cdr>=50,refl:S.dashCd>=60,endu:S.antidote>=60};
  const av=RUP.filter(u=>(!u.cls||u.cls.includes(G.cls))&&(G.run[u.k]||0)<u.max&&!capped[u.k]&&(u.k!=='fiole'||G.potions<potMax())),pool=[...av],out=[];
  while(out.length<3&&pool.length)out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  for(const f of RUP_FILL)if(out.length<3)out.push(f);
  $('luSub').textContent=`Héros niveau ${G.hl-G.pend+1}`;
  $('choices').innerHTML=out.map((u,i)=>{const rk=G.run[u.k]||0;
    const d=u.k==='purse'?`+${20*G.level} or`:u.d;
    return `<button class="choice" data-k="${u.k}" style="--cc:${u.c}"><span class="k">${i+1}</span><b>${u.n}${u.max?(rk+1>=u.max?`<small class="last">rang ${rk+1} / ${u.max} · dernier</small>`:rk?`<small>rang ${rk} → ${rk+1} / ${u.max}</small>`:`<small>nouveau · rang 1 / ${u.max}</small>`):''}</b><p>${d}</p>${u.max?`<span class="pips" aria-hidden="true">${Array.from({length:u.max},(_,j)=>`<i class="${j<rk?'on':j===rk?'nx':''}"></i>`).join('')}</span>`:''}</button>`}).join('');
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

/* ---------- Mods (interface) ---------- */
let modSel=null,alSel=null,modTab='h',modPF='all',modSF=null;
const AURA_C='#f0cf4a';
function modDetail(id){
  const m=MODS[id],rk=meta.mods[id],c=MOD_RAR[m.r].c,k=modKind(id),isA=k==='a',b=build(bKind(id)),ok=modOk(id,heroCls);
  const slot=isA?(b.aura===id?0:-1):b.load.indexOf(id),eq=slot>=0,u=bUsed(b),cap=bCap(b),fc=fuseCost(id,rk),maxed=rk>=m.max;
  let act='',why='',fuseBlocked=false,costLine;
  const where=k==='w'?`l'arme (${b.name})`:k==='p'?'le familier':'le héros';
  if(isA){
    costLine=`Aura du héros · rapporte +${m.cap+rk} de capacité`;
    act=eq?'<button class="cx-btn" data-act="unequip">Retirer</button>':`<button class="cx-btn cx-btn--primary" data-act="equip">${b.aura?'Remplacer l\'aura':'Équiper l\'aura'}</button>`;
    if(eq&&u>cap-(m.cap+rk)){why='Retirer cette aura ferait dépasser la capacité du héros : les mods en trop deviendraient inactifs.'}
  }else{
    const p=POL[MOD_POL[id]],bs0=bBest(b,id,rk),bs=(modSF!=null&&modSF<b.slots&&!b.load[modSF]&&b.kind===bKind(id))?{i:modSF,d:bDrain(b,id,rk,modSF)}:bs0,fits=bs.i>=0&&u+bs.d<=cap;
    costLine=`Mod ${k==='w'?'d\'arme':k==='p'?'de familier':'de héros'} · <span style="color:${p.c}">${p.s} ${p.n}</span> · `+(eq?`coûte ${bDrain(b,id,rk,slot)} dans la case ${slot+1}`:`coûte ${modDrain(id,rk)}, ${Math.ceil(modDrain(id,rk)/2)} dans une case ${p.n}`);
    if(!ok){why=`Réservé à : ${m.cls.map(x=>CLS[x].n).join(', ')}.`}
    else if(m.pt&&!eq&&(!petEq()||petEq().t!==m.pt)){why=`Ne fonctionne qu'avec le ${PETS[m.pt].n}.`;act=`<button class="cx-btn" data-act="equip" ${!fits?'disabled':''}>Équiper quand même</button>`}
    else if(eq)act='<button class="cx-btn" data-act="unequip">Retirer</button>';
    else{act=`<button class="cx-btn cx-btn--primary" data-act="equip" ${!fits?'disabled':''}>Équiper${bs.i>=0?` · case ${bs.i+1}`:''}</button>`;
      why=bs.i<0?`Toutes les cases de ${where} sont prises. Retire un mod d'abord.`:!fits?`Capacité insuffisante : il faut ${bs.d} points, il en reste ${Math.max(0,cap-u)}.`:''}
    fuseBlocked=eq&&u-bDrain(b,id,rk,slot)+bDrain(b,id,rk+1,slot)>cap;
  }
  const fuse=maxed?'<span class="owned" style="align-self:center;flex:1;text-align:center">Rang max</span>':`<button class="cx-btn cx-btn--cost" data-act="fuse" ${meta.essence<fc||fuseBlocked?'disabled':''}>Fusionner <span class="cx-price ess"><i class="cx-ess"></i>${fc}</span></button>`;
  if(!why&&fuseBlocked&&!maxed)why='Monter ce mod de rang dépasserait la capacité.';
  return `<span class="cx-dock__meta">${MOD_RAR[m.r].n} · ${costLine} · rang ${rk} / ${m.max}</span>
    <p>${m.t(modVal(id,rk))}${maxed?'':` <span style="color:var(--muted)">· rang ${rk+1} : ${m.t(modVal(id,rk+1))}</span>`}</p>
    <div class="cx-actions">${act}${fuse}</div>${why?`<p class="cx-hint" style="margin:0">${why}</p>`:''}${modCanStar(id)?cxMore('star','Surcharge · '+'★'.repeat(modSt(id))+'☆'.repeat(MOD_ST_MAX-modSt(id))+(meta.modCp[id]?` · ${meta.modCp[id]} copie${meta.modCp[id]>1?'s':''}`:''),starBlock(id,b,k,slot),'Ouvrir'):''}`;
}
const polD=(b,id,i,d0)=>{const p=b.pol[i];return !p?d0:p===MOD_POL[id]?Math.ceil(d0/2):Math.ceil(d0*1.25)};
function starBlock(id,b,k,slot){const m=MODS[id],rk=meta.mods[id],st=modSt(id),cp=meta.modCp[id]|0,maxed=rk>=m.max;
  if(!modCanStar(id))return '';
  const stars=`<span class="stars">${'<i class="on">★</i>'.repeat(st)}${'<i>★</i>'.repeat(MOD_ST_MAX-st)}</span>`;
  const dis=cp?`<button class="btn" data-act="dissolve">Dissoudre ${cp} copie${cp>1?'s':''} · +${cp*8*(m.r+1)} essence</button>`:'';
  if(st>=MOD_ST_MAX)return `<div class="surch"><div class="sh"><b>Surcharge</b>${stars}</div><p class="cx-hint" style="margin:0">Surcharge maximale : +${Math.round(MOD_ST_K*st*100)} % de valeur. Les prochains doublons rapportent de l'essence.</p>${dis?`<div class="actions">${dis}</div>`:''}</div>`;
  const c=starCost(id,st),nd=modDrain(id,rk,st+1)-modDrain(id,rk,st);
  const capOk=k==='a'||slot<0||bUsed(b)-bDrain(b,id,rk,slot)+polD(b,id,slot,modDrain(id,rk,st+1))<=bCap(b);
  const ok=maxed&&cp>=c.cp&&meta.essence>=c.ess&&capOk;
  const why=!maxed?`Monte d'abord ce mod au rang ${m.max}.`:cp<c.cp?`Il faut ${c.cp} copie${c.cp>1?'s':''} de ce mod (tu en as ${cp}). Les doublons trouvés en mission deviennent des copies.`:meta.essence<c.ess?`Il manque ${c.ess-meta.essence} essence.`:!capOk?'La surcharge dépasserait la capacité de ce build.':'';
  return `<div class="surch"><div class="sh"><b>Surcharge</b>${stars}<span class="cx-hint" style="margin:0">${cp} copie${cp>1?'s':''}</span></div>
    <p style="margin:0;font-size:14px">Étoile ${st+1} : <b>${m.t(modVal(id,rk,st+1))}</b>${!maxed?` (au rang ${m.max} : ${m.t(modVal(id,m.max,st+1))})`:''}${nd?` · coût en capacité +${nd}`:''}</p>
    <div class="actions"><button class="btn buy" data-act="star" ${ok?'':'disabled'}>Surcharger · ${c.cp} copie${c.cp>1?'s':''} + ${c.ess} essence</button>${dis}</div>${why?`<p class="empty" style="font-size:13px;margin:0">${why}</p>`:''}</div>`}
function alignPanel(b){
  const cost=bAlignCost(b),mt=b.mast;
  let h=`<h3>Alignement · ${b.kind==='w'?'arme':b.kind==='p'?'familier':'héros'}</h3><p class="empty" style="font-size:13px">Aligne une case sur une polarité : un mod de la même polarité y coûte moitié moins, un autre 25 % de plus. Chaque alignement coûte de l'essence (200, 400, 800 puis 1 600)${b.kind==='p'?'.':` et remet la maîtrise ${b.de} à 0.`}</p>
    <div class="alrow">${b.pol.slice(0,b.slots).map((p,i)=>`<button class="chip" data-act="alslot" data-i="${i}" aria-pressed="${!!alSel&&alSel.i===i}">Case ${i+1} · ${p?`<span style="color:${POL[p].c}">${POL[p].s} ${POL[p].n}</span>`:'neutre'}</button>`).join('')}</div>`;
  if(alSel){const cur=b.pol[alSel.i];
    h+=`<div class="alrow">${Object.keys(POL).map(k=>`<button class="chip" data-act="alpol" data-p="${k}" aria-pressed="${alSel.p===k}" ${cur===k?'disabled':''}><span style="color:${POL[k].c}">${POL[k].s}</span> ${POL[k].n}</button>`).join('')}</div>`;
    if(alSel.p)h+=`<div class="card"><p style="margin:0;font-size:14px">Aligner la case ${alSel.i+1} en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b> pour <b>${cost} essence</b>.${b.kind==='p'?'':` La maîtrise ${b.de} repasse du rang ${mt.r} à 0${mt.r?` : −${mt.r} de capacité jusqu'à ce que tu la regagnes en mission`:''}.`}</p>
      <div class="actions"><button class="btn main" data-act="alok" ${meta.essence<cost?'disabled':''}>Aligner · ${cost} essence</button><button class="btn" data-act="alcancel">Annuler</button></div>
      ${meta.essence<cost?`<p class="empty" style="font-size:13px">Il te manque ${cost-meta.essence} essence.</p>`:''}</div>`;
    else h+='<p class="empty" style="font-size:13px">Choisis la polarité de cette case.</p>';
  }
  return h;
}
// Tuile de mod (ModCard du design system) : polarité, coût, nom, losanges de rang.
function modTile(id,cls='',i,b){const m=MODS[id],rk=meta.mods[id],isA=modKind(id)==='a',p=isA?{c:AURA_C,s:'✦',n:'Aura'}:POL[MOD_POL[id]];
  const d=isA?`+${MODS[id].cap+rk}`:(b&&i!==undefined?bDrain(b,id,rk,i):modDrain(id,rk)),st=modSt(id);
  return `<button class="cx-mod${cls}" data-mod="${id}" style="--mc:${MOD_RAR[m.r].c}" aria-label="${m.n}, rang ${rk}, ${isA?'aura':'polarité '+p.n}, coût ${d}"><span class="cx-mod__pol" style="color:${p.c}">${p.s}</span><span class="cx-mod__cost">${d}</span><b>${m.n}</b>${st?`<span class="mst">${'★'.repeat(st)}</span>`:''}${meta.modCp[id]?`<span class="mcp" title="Copies">×${meta.modCp[id]}</span>`:''}<span class="cx-mod__pips">${'<i class="on"></i>'.repeat(rk)}${'<i></i>'.repeat(m.max-rk)}</span></button>`}
function renderMods(rootId){
  const root=$(rootId);if(!root)return;const inCamp=rootId==='modsCamp';
  if(modTab==='h'&&!isUnl('hmods')){modTab='w';modSel=null;modSF=null;alSel=null} // mods du héros : débloqués plus tard
  const b=build(modTab),u=bUsed(b),cap=bCap(b),act=bActive(b),mt=b.mast;
  const owned=Object.keys(MODS).filter(id=>meta.mods[id]!=null);
  if(modSel&&meta.mods[modSel]==null)modSel=null;
  const fits=id=>bKind(id)===modTab,ptOff=id=>MODS[id].pt&&(!petEq()||petEq().t!==MODS[id].pt);
  if(modSel&&!fits(modSel))modSel=null;
  if(modSF!=null&&modSF>=b.slots)modSF=null;
  const pool=owned.filter(id=>fits(id)&&!b.load.includes(id)&&b.aura!==id);
  const sp=modSF!=null?b.pol[modSF]:null,polOf=id=>modKind(id)==='a'?'a':MOD_POL[id];
  const pcount={all:pool.length};for(const id of pool){const q=polOf(id);pcount[q]=(pcount[q]||0)+1}
  let rest=pool.filter(id=>modSF!=null?(polOf(id)!=='a'&&(!sp||polOf(id)===sp)):(modPF==='all'||polOf(id)===modPF));
  rest.sort(modSF!=null?(x,y)=>(modOk(y,heroCls)-modOk(x,heroCls))||bDrain(b,x,meta.mods[x],modSF)-bDrain(b,y,meta.mods[y],modSF)||MODS[y].r-MODS[x].r
    :(x,y)=>(modOk(y,heroCls)-modOk(x,heroCls))||(modKind(y)==='a')-(modKind(x)==='a')||MODS[y].r-MODS[x].r);
  const pchip=(k,lab,c)=>`<button class="cx-chip cx-chip--sm" data-act="polf" data-p="${k}" aria-pressed="${modSF==null&&modPF===k}"${c&&!(modSF==null&&modPF===k)?` style="color:${c}"`:''}>${lab} <span class="n">${pcount[k]||0}</span></button>`;
  const filt=`<div class="cx-chips" role="group" aria-label="Filtrer les mods par polarité">${pchip('all','Tous')}${Object.keys(POL).map(k=>pchip(k,`${POL[k].s} ${POL[k].n}`,POL[k].c)).join('')}${modTab==='h'&&pcount.a?pchip('a','✦ Aura',AURA_C):''}</div>
    ${modSF!=null?`<p class="cx-hint" style="margin:0">Case ${modSF+1} · ${sp?`<b style="color:${POL[sp].c}">${POL[sp].s} ${POL[sp].n}</b> : seuls les mods ${POL[sp].n} (coût divisé par 2)`:'neutre : tous les mods'}, du moins cher au plus cher. <button class="cx-btn cx-btn--ghost cx-btn--sm" data-act="slotf" data-i="${modSF}" style="margin:0">Retirer le filtre</button></p>`:''}`;
  const slotsN=modTab==='h'?HSLOT_MAX:4;
  const slotHtml=i=>{if(i>b.slots)return '';if(i>=b.slots){const nx=i===b.slots;return `<div class="cx-modslot"><span class="cx-modslot__pol" style="cursor:default">Verrouillée</span><div class="cx-mod cx-mod--empty cx-mod--locked"><b>${b.kind==='p'?'Familier ★★★':nx?`${HSLOT_COST[b.slots-3]} fragments`:'—'}</b></div></div>`}
    const id=b.load[i],p=b.pol[i];return `<div class="cx-modslot${modSF===i?' fsel':''}"><button class="cx-modslot__pol" data-act="slotf" data-i="${i}" aria-pressed="${modSF===i}" aria-label="Filtrer les mods pour la case ${i+1} (${p?POL[p].n:'neutre'})" style="color:${p?POL[p].c:'var(--muted)'}">${p?POL[p].s+' '+POL[p].n:'Neutre'}</button>${id?modTile(id,(modSel===id?' is-sel':'')+(act.includes(id)?'':' off'),i,b):'<div class="cx-mod cx-mod--empty"><b>Libre</b></div>'}</div>`};
  const buyBox=modTab==='h'&&b.slots<HSLOT_MAX&&inCamp?(()=>{const c=HSLOT_COST[b.slots-3],have=fragTotal();
    return `<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Case ${b.slots+1} du héros<small>${c} fragments de relique, pris parmi ceux que tu as en plus grand nombre · tu en as ${have}</small></span><button class="cx-btn cx-btn--sm" data-act="slotbuy" style="margin:0" ${have<c?'disabled':''}>Débloquer</button></div></div>`})():'';
  const petTab=inCamp&&campTab==='pets',bn=modTab==='h'?`Build ${deCls(heroCls)}`:modTab==='w'?`Build ${b.de}`:'Build du familier';
  const over=u>cap;
  root.innerHTML=`${petTab?petPanel():`<div class="cx-tabs" role="tablist"><button class="cx-tab${isUnl('hmods')?'':' is-locked'}" role="tab" data-act="mtab" data-t="h" aria-selected="${modTab==='h'}">${isUnl('hmods')?'':`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>`}Héros · ${CLS[heroCls].n}</button><button class="cx-tab" role="tab" data-act="mtab" data-t="w" aria-selected="${modTab==='w'}">Arme · ${wdef(curWid()).n}</button>${inCamp?'':`<button class="cx-tab" role="tab" data-act="mtab" data-t="p" aria-selected="${modTab==='p'}">Familier</button>`}</div>`}
    <div class="cx-meter${over?' is-over':''}"><div class="cx-meter__top"><span>Capacité</span><b>${u} / ${cap}</b></div><div class="cx-meter__bar"><i style="--v:${Math.min(100,cap?u/cap*100:0)}%"></i></div></div>
    <p class="cx-hint" style="margin:0">${over?'<span style="color:var(--blood-ink)">Capacité dépassée : les mods en trop sont inactifs (grisés). Retire un mod ou regagne de la maîtrise.</span>':b.kind==='p'?`Bonus de niveau du familier +${mt.r} · capacité qui monte avec son rang et son niveau`:`Maîtrise ${b.kind==='w'?'arme':'héros'} ${mt.r} / 10${mt.r<10?` · ${mt.xp} / ${mastNeed(mt.r)}`:''} · gagne de la capacité en mission`}</p>
    ${modTab==='h'?`<div class="aurarow"><div class="cx-modslot"><span class="cx-modslot__pol" style="color:${AURA_C};cursor:default">✦ Aura</span>${b.aura?modTile(b.aura,modSel===b.aura?' is-sel':''):'<div class="cx-mod cx-mod--empty"><b>Aura libre</b></div>'}</div><p class="cx-hint" style="margin:0">Une aura rapporte de la capacité au lieu d'en coûter, et donne un effet permanent.</p></div>`:''}
    <section class="cx-section"><h3 class="cx-section__label">${bn} · ${b.load.slice(0,b.slots).filter(Boolean).length} / ${b.slots} cases</h3><div class="cx-build">${Array.from({length:slotsN},(_,i)=>slotHtml(i)).join('')}</div></section>
    ${buyBox}
    <section class="cx-section"><h3 class="cx-section__label">Tes mods · ${pool.length}</h3>${filt}
    <div class="cx-mods">${rest.map(id=>modTile(id,(modSel===id?' is-sel':'')+(modOk(id,heroCls)&&!ptOff(id)?'':' lock'),modSF!=null&&modKind(id)!=='a'?modSF:undefined,modSF!=null?b:undefined)).join('')||`<p class="cx-hint" style="grid-column:1/-1;margin:0">${pool.length?'Aucun mod pour ce filtre.':`Aucun autre mod ${modTab==='w'?'d\'arme':modTab==='p'?'de familier':'de héros'}.`} Les monstres en laissent parfois tomber, les Gardiens toujours.</p>`}</div></section>
    ${inCamp&&isUnl('align')?cxMore('align_'+b.kind,'Alignement des cases',alignPanel(b),'Ouvrir'):''}`;
  root.querySelectorAll('[data-mod]').forEach(x=>x.onclick=()=>{modSel=modSel===x.dataset.mod?null:x.dataset.mod;runSel=null;modsChanged()});
  root.querySelectorAll('[data-act]').forEach(x=>x.onclick=()=>modAct(x.dataset.act,x.dataset));
  root.querySelectorAll('[data-pet]').forEach(x=>x.onclick=()=>petAct(x.dataset.pet,x.dataset.arg));
  if(!inCamp){const dk=$('bagDock');if(dk){const h=modSel?modDock(modSel):'';dk.innerHTML=h;dk.hidden=!h;if($('bagFoot'))$('bagFoot').hidden=!!h||!!runSel}}
}
// Détail d'un mod, ancré en bas de la feuille (cx-dock).
function modDock(id){const html=modDetail(id);return `<div class="cx-dock__head"><h3 class="cx-dock__title" style="color:${MOD_RAR[MODS[id].r].c}">${MODS[id].n}</h3><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-act="mclose" aria-label="Fermer le détail"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>${html}`}
function modAct(a,ds){
  const id=modSel,rk=id?meta.mods[id]:0;
  if(a==='mclose'){modSel=null}
  else if(a==='mtab'){if(ds.t==='h'&&!isUnl('hmods')){toast(`${UNL_BY.hmods.n} : ${UNL_BY.hmods.need.replace(/^./,c=>c.toLowerCase())}`);return}modTab=ds.t;modSel=null;alSel=null;modSF=null;modPF='all'}
  else if(a==='polf'){modPF=ds.p;modSF=null}
  else if(a==='slotf'){const i=+ds.i;modSF=modSF===i?null:i}
  else if(a==='equip'||a==='unequip'||a==='fuse'){
    const k=modKind(id),b=build(bKind(id));
    if(a==='equip'){if(!modOk(id,heroCls))return;if(k==='a')meta.aura[heroCls]=id;else{let bs=bBest(b,id,rk);if(modSF!=null&&modSF<b.slots&&!b.load[modSF]&&bKind(id)===modTab)bs={i:modSF,d:bDrain(b,id,rk,modSF)};if(bs.i<0||bUsed(b)+bs.d>bCap(b))return;b.load[bs.i]=id}}
    else if(a==='unequip'){if(k==='a'){if(meta.aura[heroCls]===id){meta.aura[heroCls]=null;const hc=heroCls;cxUndo(`${MODS[id].n} retiré`,()=>{meta.aura[hc]=id;modSel=id;modsChanged()})}}else{const i=b.load.indexOf(id);if(i>=0){b.load[i]=null;cxUndo(`${MODS[id].n} retiré de la case ${i+1}`,()=>{if(!b.load[i])b.load[i]=id;modSel=id;modsChanged()})}}}
    else{const c=fuseCost(id,rk);if(meta.essence<c||rk>=MODS[id].max)return;if(k!=='a'){const i=b.load.indexOf(id);if(i>=0&&bUsed(b)-bDrain(b,id,rk,i)+bDrain(b,id,rk+1,i)>bCap(b))return}meta.essence-=c;meta.mods[id]=rk+1}
  }
  else if(a==='star'){const k=modKind(id),b=build(bKind(id)),m=MODS[id],st=modSt(id),c=starCost(id,st);
    if(!modCanStar(id)||rk<m.max||st>=MOD_ST_MAX||(meta.modCp[id]|0)<c.cp||meta.essence<c.ess)return;
    if(k!=='a'){const i=b.load.indexOf(id);if(i>=0&&bUsed(b)-bDrain(b,id,rk,i)+polD(b,id,i,modDrain(id,rk,st+1))>bCap(b))return}
    meta.modCp[id]-=c.cp;meta.essence-=c.ess;meta.modSt[id]=st+1;SND.play('relic');toast(`<b style="color:${MOD_RAR[m.r].c}">${m.n}</b> surchargé : ${'★'.repeat(st+1)}`)}
  else if(a==='dissolve'){const cp=meta.modCp[id]|0;if(!cp)return;meta.essence+=cp*8*(MODS[id].r+1);meta.modCp[id]=0}
  else if(a==='slotbuy'){const b=build('h');if(b.slots>=HSLOT_MAX)return;const c=HSLOT_COST[b.slots-3];if(fragTotal()<c)return;takeFrags(c);meta.hslots[heroCls]=b.slots+1;toast(`Case ${b.slots+1} du héros débloquée`)}
  else if(a==='alslot'){const i=+ds.i;alSel=alSel&&alSel.i===i?null:{i,p:null}}
  else if(a==='alpol'){if(alSel)alSel.p=ds.p}
  else if(a==='alcancel'){alSel=null}
  else if(a==='alok'){const b=build(modTab);if(!alSel||!alSel.p)return;const cost=bAlignCost(b);if(meta.essence<cost)return;
    meta.essence-=cost;b.pol[alSel.i]=alSel.p;b.alignStore[b.key]=(b.alignStore[b.key]||0)+1;if(b.kind!=='p'){b.mast.r=0;b.mast.xp=0}
    toast(`Case ${alSel.i+1} alignée en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b>. ${b.kind==='p'?'':` Maîtrise ${b.de} remise à 0.`}`);alSel=null}
  saveMeta();modsChanged();
}
function modsChanged(){if(started&&G&&!G.over){refreshStats();if(G.pet||petEq())G.petS=petStats()}if(!$('bag').hidden)drawBag();if(!$('camp').hidden)drawCamp()}

/* ---------- Fin de niveau, extraction, mort ---------- */
function lootSummary(end){
  const L=G.loot,its=L.items.length,pts=L.parts.length;
  const byR={};for(const i of L.items)byR[i.r]=(byR[i.r]||0)+1;const byT={};for(const id of L.relics){const t=RELICS[id].t;byT[t]=(byT[t]||0)+1}
  const lc=(c,n,lab)=>`<span class="lc" style="--c:${c}" title="${lab}">${n} ${lab}</span>`;
  return `<div><span>Or ramassé</span><b style="color:var(--r2)">${G.gold}</b></div>
    <div><span>Équipements</span><b>${its?`${its} · `+Object.keys(byR).sort((a,b)=>b-a).map(r=>lc(RAR[r].c,byR[r],RAR[r].n.toLowerCase()+(byR[r]>1?'s':''))).join(''):'0'}</b></div>
    <div><span>Reliques</span><b>${L.relics.length?`${L.relics.length} · `+Object.keys(byT).sort((a,b)=>b-a).map(t=>lc(RTIER[t].c,byT[t],RTIER[t].n)).join(''):'0'}</b></div>
    ${(()=>{const W=L.parts.filter(p=>!p.hf),H=L.parts.length-W.length,b={};for(const p of W){const r=wdef(p.w).r;b[r]=(b[r]||0)+1}
      return (W.length?`<div><span>Armes</span><b>${W.length} · `+Object.keys(b).sort((x,y)=>y-x).map(r=>lc(RAR[r].c,b[r],RAR[r].n.toLowerCase()+(b[r]>1?'s':''))).join('')+`</b></div>`:'')+(H?`<div><span>Fragments de harnais</span><b style="color:var(--rar-aby)">${H}</b></div>`:'')})()}
    ${G.relQ.length&&!end?`<div><span>Reliques ouvertes</span><b>${G.opened.length} / ${G.relQ.length}${G.relic?` · ${G.react} / ${reactNeed()} réactifs`:''}</b></div>`:''}<div><span>Ennemis abattus</span><b>${G.kills}</b></div><div><span>${end?'Durée de la mission':'Temps de survie'}</span><b>${fmt(G.t)}</b></div>`;
}
function roundDone(){
  if(NET.on){G.hold=true;if(NET.host)netSend({t:'round'})}
  paused=true;resetJoy();$('bag').hidden=true;$('lvlup').hidden=true;
  const nl=G.level+1,unlock=false;
  if(unlock){meta.cp=nl;saveMeta()}
  const r=relicDrop();G.loot.relics.push(r);let extra='';
  if(G.mode==='defense'){const it=genItem(itemLvl(),1);G.loot.items.push(it);extra=` et <span style="color:${RAR[it.r].c}">${it.name}</span>`}
  $('exTitle').textContent=G.mode==='defense'?`Vague ${G.wave} repoussée`:`Niveau ${G.level} terminé`;
  $('exLead').innerHTML=(G.mode==='defense'?'Le cryopode tient. ':'Un portail s\'ouvre. ')+`Récompense de manche : relique <b style="color:${RTIER[RELICS[r].t].c}">${relicName(r)}</b>${extra}. Sors pour tout garder, ou continue : au niveau ${G.level+1}, les monstres seront plus forts.`+(unlock?` Tu peux désormais commencer au niveau ${nl}.`:'')
    +(()=>{const b=tormBoost();if(!b.t||!G.relQ.length)return '';return `<br><span style="color:#ff6a3a">Bonus du Tourment</span> : ${reactNeed()} réactifs par relique au lieu de ${REACT_N}${b.relic?`, reliques +${Math.round(b.relic*100)} %`:''}. Il grandit toutes les 2 minutes passées dans la mission.`})();
  $('exSum').innerHTML=lootSummary();
  $('contBtn').textContent=`Continuer · niveau ${G.level+1}`;
  $('extract').hidden=false;
}
function bank(full){
  const g=full?G.gold:Math.floor(G.gold/2);meta.gold+=g;G.run={};
  const gainM=(mt,label)=>{let up=0;if(mt.r<10){mt.xp+=G.kills;while(mt.r<10&&mt.xp>=mastNeed(mt.r)){mt.xp-=mastNeed(mt.r);mt.r++;up++}if(mt.r>=10)mt.xp=0}
    return `Maîtrise ${label} : rang ${mt.r} / 10`+(mt.r<10?` (${mt.xp} / ${mastNeed(mt.r)})`:'')+(up?` · +${up} de capacité`:'')};
  G.mastMsg=gainM(mastOf(G.cls),deCls(G.cls))+'<br>'+gainM(mstOf(meta.wmast,G.wid),deW(wdef(G.wid).n));
  {const pm=petBank(G.kills);if(pm)G.mastMsg+='<br>'+pm}
  if(full){tutWin();
    for(const it of G.loot.items)meta.stash.push(it)
    for(const p of G.loot.parts){if(p.hf)meta.hfrag=(meta.hfrag|0)+1;else if(p.full)gainWeapon(p.w);else if(meta.built[p.w])meta.essence+=6;else{const a=meta.parts[p.w]||(meta.parts[p.w]=[0,0,0]);a[p.p]++}}
    meta.maxL=Math.max(meta.maxL|0,G.level);
    for(const id of G.loot.relics){const a=meta.relics[id]||(meta.relics[id]=[0,0]);a[0]++}
  }
  sealBank(full);saveMeta();return g;
}
function recordBest(){if(G.t>best){best=G.t;try{localStorage.setItem('crypte-best2',String(best))}catch(e){}}}
function showOver(title,txt,earn,rel){$('overTitle').textContent=title;$('overTxt').textContent=txt;$('earnTxt').innerHTML=earn;$('relicTxt').innerHTML=[rel,G&&G.mastMsg?`<p class="lead" style="font-size:13px;margin:6px 0 0">${G.mastMsg}</p>`:'',typeof unlockOverHtml==='function'?unlockOverHtml():''].filter(Boolean).join('');refreshMenus();$('over').hidden=false}
// Ouvre une relique : un fragment d'un objet de sa rareté (deux si éclatante ; la relique forgée vise son objet).
function grantRelic(id,rad){
  const a=meta.relics[id],R=RELICS[id];if(!R||!a||a[rad?1:0]<=0)return null;
  a[rad?1:0]--;const n=rad?2:1,got=[];
  for(let i=0;i<n;i++){const pool=R.fz?[R.tgt]:relPool(R.t);if(!pool.length)break;
    // les fragments manquants d'un objet presque complet passent un peu avant
    const w=pool.map(x=>1+fragStatus(x)*.5),tot=w.reduce((p,q)=>p+q,0);let x=Math.random()*tot,k=0;while(x>w[k]&&k<pool.length-1){x-=w[k];k++}
    const bid=pool[k],fi=giveFrag(bid);got.push({bid,fi})}
  relicQFix();
  return {got,html:got.map(g=>{const b=bpdef(g.bid),st=fragStatus(g.bid);return `<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> · fragment ${b.frag[g.fi]} (${st} / 3${st>=3?', prêt à fabriquer':''})`}).join(' et ')}}
function resolveRelic(){
  const out=[],S={n:0,ess:0,frag:0,fragN:{},ready:new Set(),eggs:0,byT:{}};
  for(const r of G.opened){const g=grantRelic(r.id,r.rad);if(!g)continue;meta.essence+=25;S.n++;S.ess+=25;const t=RELICS[r.id].t;S.byT[t]=(S.byT[t]||0)+1;
    for(const f of g.got){S.frag++;S.fragN[f.bid]=1;if(fragStatus(f.bid)>=3)S.ready.add(f.bid)}
    const egg=eggFromRelic(r.id);if(egg)S.eggs++;
    out.push(`${relicName(r.id)}${r.rad?' éclatante':''} : ${g.html}.`+(egg?' <b style="color:#f0cf4a">Œuf de familier.</b>':''))}
  meta.relOpened=(meta.relOpened|0)+S.n;
  const left=G.relQ.length-G.opened.length;
  if(!S.n&&!left)return '';
  const lc=(c,n,lab)=>`<span class="lc" style="--c:${c}">${n} ${lab}</span>`;
  let h=`<div class="exsum" style="margin-top:4px">`;
  if(S.n)h+=`<div><span>Reliques ouvertes</span><b>${S.n} · ${Object.keys(S.byT).sort((a,b)=>b-a).map(t=>lc(RTIER[t].c,S.byT[t],RTIER[t].n)).join('')}</b></div>`;
  if(S.ess)h+=`<div><span>Essence</span><b style="color:var(--ess)">+${S.ess}</b></div>`;
  if(S.frag)h+=`<div><span>Fragments</span><b>${S.frag} · ${Object.keys(S.fragN).length} objet${Object.keys(S.fragN).length>1?'s':''}</b></div>`;
  if(S.ready.size)h+=`<div><span>Prêts à fabriquer</span><b>${[...S.ready].map(id=>{const b=bpdef(id);return `<span class="lc" style="--c:${RAR[b.r].c}">${esc(b.n)}</span>`}).join('')}</b></div>`;
  if(S.eggs)h+=`<div><span>Œufs de familier</span><b style="color:#f0cf4a">${S.eggs}</b></div>`;
  if(left)h+=`<div><span>Non ouvertes (restent équipées)</span><b>${left}</b></div>`;
  h+='</div>';
  if(out.length)h+=`<details class="reldet"><summary>Détail des ${out.length} relique${out.length>1?'s':''}</summary><div>${out.join('<br>')}</div></details>`;
  return h;
}
function missionSuccess(){SND.play('win');if(NET.host)netSend({t:'exit'});G.hold=false;
  $('extract').hidden=true;$('lvlup').hidden=true;G.over=true;const rel=resolveRelic();const g=bank(true);recordBest();
  const cn=Math.max(1,G.capN|0),txt=G.mode==='capture'?`${cn>1?cn+' cibles capturées':'Cible capturée'} en ${fmt(G.t)}, ${G.kills} ennemis abattus.`:G.mode==='defense'?`Tu as tenu ${G.wave} vagues, ${G.kills} ennemis abattus.`:`Tu es sorti au niveau ${G.level} après ${fmt(G.t)}, avec ${G.kills} ennemis abattus.`;
  showOver(G.mode==='capture'?'Capture réussie':'Extraction réussie',txt+' Ton butin t\'attend au Camp.',`<span class="coin"></span>+${g} or · ${meta.gold} au total`,
    `<div class="exsum">${lootSummary(true)}</div>`+rel);
}
function gameOver(reason){
  if(G.over)return;if(NET.host)netSend({t:'fail'});G.hold=false;SND.play('lose');G.over=true;const g=bank(false);recordBest();
  const lost=G.loot.items.length+G.loot.parts.length+G.loot.relics.length;
  setTimeout(()=>showOver(reason==='pod'?'Le cryopode est détruit':'Tu es tombé',`Mission échouée après ${fmt(G.t)}, ${G.kills} ennemis abattus.`+(lost?(lost>1?` Les ${lost} objets et reliques trouvés sont perdus.`:' L\'objet trouvé est perdu.'):''),
    `<span class="coin"></span>+${g} or gardé (la moitié) · ${meta.gold} au total`,G.relQ.length?'Tes reliques ne sont pas consommées.':''),700);
}
$('exitBtn').onclick=()=>{if(NET.guest)return;missionSuccess()};
function contRun(){$('extract').hidden=true;G.level++;G.hold=false;
  if(G.mode==='survie')G.tl=0;else{G.waveState='break';G.waveT=5;G.pod.hp=Math.min(G.pod.max,G.pod.hp+G.pod.max*.3)}
  paused=false;last=performance.now();toast(`<b style="color:var(--ember)">Niveau ${G.level}.</b> Les monstres se renforcent.`)}
$('contBtn').onclick=()=>{if(NET.guest)return;if(NET.host)netSend({t:'cont'});contRun()};
function missionToast(){if(G.breche){toast(`<b style="color:${SEAL_C}">Brèche.</b> Les Gardiens viennent par paires : abattez les deux jumeaux en moins de 8 s. Sceaux légendaires et éclats sur les Gardiens et les élites.`);return}toast(G.mode==='defense'?'<b>Défense.</b> Protège le cryopode.':G.mode==='capture'?'<b>Capture.</b> Suis la flèche dorée jusqu\'à la cible.':'<b>Survie.</b> Le portail s\'ouvre dans 2 minutes.');
  if(G.relic)setTimeout(()=>toast(`Fissure : ${G.relQ.length} relique${G.relQ.length>1?'s':''} équipée${G.relQ.length>1?'s':''}. Abats les ennemis au halo doré : ${reactNeed()} réactifs ouvrent ${relicName(G.relic.id)}${G.relic.rad?' éclatante':''}, puis la suivante.`),900)}

