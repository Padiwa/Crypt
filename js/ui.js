// Crypte des Cendres — ui.js
/* ---------- Fiches partagées ---------- */
function statRows(St){
  const rows=[['Dégâts',Math.round(St.dmg)],['Attaques / s',St.aps.toFixed(2)],['Critique',Math.round(St.crit)+' %'],['Dégâts critiques',Math.round(St.critDmg)+' %'],['Puissance (DPS)',Math.round(dps(St))],['Vie',Math.round(St.hp)],['Réduction',Math.round(St.armor)+' %'],['Vitesse',Math.round(St.speed/2.2)+' %'],['Portée des compétences',Math.round(100+St.skillRad)+' %'],...(heroCls==='magicien'?[['Rayon d\'explosion',Math.round(100+St.splash)+' %']]:[]),heroCls==='guerrier'?['Ondes par coup',St.waves]:['Projectiles par tir',(1+St.multi).toFixed(St.multi%1?2:0)],['Double attaque',St.echo+' %'],[CLS[heroCls].skill,Math.round(St.nova)]];
  return rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
}
function slotsHtml(eq,click,selSlot){
  return Object.keys(SLOT).map(k=>{const it=eq[k],tag=click?'button':'div';
    return `<${tag} class="slot${selSlot===k?' sel':''}"${click?` data-slot="${k}"`:''}><span>${SLOT[k]}</span><strong style="color:${it?RAR[it.r].c:'var(--muted)'}">${it?itemName(it):'Vide'}${it&&it.lock?`<span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:''}</strong></${tag}>`}).join('');
}
function better(it){const e=curEq(),a=stats(e),b=stats({...e,[it.slot]:it});return dps(b)+b.hp*.3>dps(a)+a.hp*.3}
const LOCK_SVG='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const cellHtml=(it,attr,sel,up)=>`<button class="cell${sel?' sel':''}${up?' up':''}${it.lock?' locked':''}" data-${attr}="${it.id}" style="border-color:${RAR[it.r].c};color:${RAR[it.r].c}" aria-label="${itemName(it)}${it.lock?', verrouillé':''}">${it.lock?`<span class="lk">${LOCK_SVG}</span>`:''}${it.up?`<span class="cup">+${it.up}</span>`:''}${GLYPH[it.slot]}</button>`;
function upBlock(it){
  const n=it.up||0;
  if(n>=UP_MAX)return `<div class="upg"><span>Amélioration <b>+100 / 100</b> · statistiques ×3</span></div>`;
  const c1=upCostRange(n,1),k=Math.min(10,UP_MAX-n),ck=upCostRange(n,k);
  return `<div class="upg"><span>Amélioration <b>+${n} / ${UP_MAX}</b> · statistiques ×${fmtN(upMul(n))} · chaque niveau ajoute 2 % des valeurs de base</span>
    <div class="actions"><button class="btn buy" data-cact="upg" data-arg="1" ${meta.essence<c1?'disabled':''}>+1 · <span class="essi"></span>${c1}</button>${k>1?`<button class="btn buy" data-cact="upg" data-arg="${k}" ${meta.essence<ck?'disabled':''}>+${k} · <span class="essi"></span>${ck}</button>`:''}</div></div>`;
}
function cmpBlock(e,it){const a=stats(e),b=stats({...e,[it.slot]:it}),cur=e[it.slot];
  const R=[['Puissance (DPS)',dps(a),dps(b),0],['Vie',a.hp,b.hp,0],['Dégâts',a.dmg,b.dmg,1],['Attaques / s',a.aps,b.aps,2],['Critique',a.crit,b.crit,1,' %'],['Dégâts critiques',a.critDmg,b.critDmg,0,' %'],['Réduction',a.armor,b.armor,1,' %'],['Vitesse',a.speed/2.2,b.speed/2.2,0,' %'],['Régénération',a.regen,b.regen,1,' /s'],['Recharge',a.cdr,b.cdr,1,' %'],['Portée des compétences',100+a.skillRad,100+b.skillRad,0,' %'],[CLS[heroCls].skill,a.nova,b.nova,0]];
  const f=(v,dc)=>(Math.round(v*10**dc)/10**dc).toLocaleString('fr-FR',{minimumFractionDigits:dc,maximumFractionDigits:dc});
  const rows=R.filter(([l,x,y,dc])=>Math.abs(y-x)>=.5/10**dc).map(([l,x,y,dc,u=''])=>{const d=y-x,up=d>0;return `<div><span>${l}</span><b>${f(y,dc)}${u}</b><em class="${up?'g':'b'}">${up?'▲ +':'▼ −'}${f(Math.abs(d),dc)}</em></div>`}).join('');
  return `<div class="cmp2"><div class="cmph">Comparé à ${cur?`<b style="color:${RAR[cur.r].c}">${esc(itemName(cur))}</b>`:'un emplacement vide'}</div>${rows||'<p class="cx-hint" style="margin:0">Aucun changement de statistique.</p>'}</div>`}
const itemScore=e=>{const x=stats(e);let d=dps(x)*(1+x.abSoul*.06)*(1+x.abExec*.015)*(1+x.crit/100*x.abRift/100*2.1)*(1+x.abHunt*.0025)+x.dmg*x.abPulse/100*.8;return d+(x.hp+x.abWard*8)*.3};
function bestPlan(e,pool){const cur={...e},pick={};
  for(let pass=0;pass<2;pass++)for(const sl of ['armure','amulette','bottes','anneau']){let best=cur[sl],bs=itemScore(cur);
    for(const it of pool){if(it.slot!==sl||Object.values(pick).includes(it)&&pick[sl]!==it)continue;const sc=itemScore({...cur,[sl]:it});if(sc>bs+1e-6){bs=sc;best=it}}
    if(best!==cur[sl]){cur[sl]=best;pick[sl]=best}}
  return pick}
function card(it,mode){
  const r=RAR[it.r];let extra='';
  if(mode==='stash'||mode==='run'){
    const e=mode==='run'?G.eq:curEq(),a=stats(e),b=stats({...e,[it.slot]:it});
    extra=cmpBlock(e,it)+(mode==='run'
      ?`<div class="actions"><button class="btn main" data-ract="${it.id}">Équiper maintenant</button></div><p class="empty" style="font-size:13px">Un objet équipé est gardé même si tu meurs. L'ancien part au coffre du Camp.</p>`
      :`<div class="actions"><button class="btn main" data-cact="equip">Équiper</button><button class="btn" data-cact="lock">${it.lock?'Déverrouiller':'Verrouiller'}</button></div><div class="actions"><button class="btn" data-cact="recycle" ${it.lock?'disabled':''}>${it.lock?'Verrouillé : recyclage impossible':(primeBp(it)?`Recycler · +${primeRecyEss(it)} essence · 1 fragment`:`Recycler · +${r.shard*2+Math.floor(upInvested(it.up)/2)} essence`)}</button></div>`+upBlock(it));
  }else if(mode==='worn'){
    extra=it.slot==='arme'?'<div class="actions"><button class="btn" data-cact="toarsenal">Changer d\'arme à l\'Armurerie</button></div>'
      :`<div class="actions"><button class="btn" data-cact="unequip">Retirer au coffre</button><button class="btn" data-cact="lock">${it.lock?'Déverrouiller':'Verrouiller'}</button></div>`;
    extra+=upBlock(it);
  }
  return `<div class="card"><div class="nm" style="color:${r.c}">${itemName(it)}${it.lock?`<span class="lockchip">${LOCK_SVG}Verrouillé</span>`:''}</div><div class="meta">${r.n} · ${SLOT[it.slot]}${it.wid?' · fabriquée':` · ${it.type==='Sanguin'?'exclusif des reliques Sanguine':it.type==='Abyssal'?'exclusif des reliques Abysse':it.type} · niveau ${it.lvl}`}${mode==='worn'?' · équipé':''}</div>
    <ul><li>${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${Object.keys(it.aff).map(k=>`<li${AFF[k].aby?' class="abyp"':''}>${AFF[k].t(NOSCALE[k]?it.aff[k]:fmtN(it.aff[k]*upMul(it.up)))}</li>`).join('')}</ul>${extra}</div>`;
}

/* ---------- Pause ---------- */
let runSel=null;
function openBag(){if(G.over)return;paused=true;resetJoy();$('bag').hidden=false;runSel=null;G.fresh=0;$('rendTxt').textContent=PX?'Rendu WebGL (PixiJS)':'Rendu standard';$('rendBtn').textContent=PX?'Passer au rendu standard':'Essayer WebGL';drawBag()}
function closeBag(){$('bag').hidden=true;paused=false;last=performance.now()}
$('bagBtn').addEventListener('click',()=>{if(started&&!G.over&&$('extract').hidden&&$('lvlup').hidden)$('bag').hidden?openBag():closeBag()});
$('closeBag').addEventListener('click',closeBag);$('closeBagX').addEventListener('click',closeBag);
$('rendBtn').addEventListener('click',()=>{if(PX){dropPixi('choix du joueur');try{localStorage.setItem('crypte-nogl','1')}catch(e){}}else{try{localStorage.removeItem('crypte-nogl')}catch(e){}location.reload()}});
function drawBag(){
  $('slots').innerHTML=slotsHtml(G.eq,false);
  $('statgrid').innerHTML=statRows(S);
  $('runUpsTitle').textContent=`Bonus de la partie · héros niveau ${G.hl}`;
  const ru=RUP.filter(u=>G.run[u.k]);
  $('runUps').innerHTML=ru.length?ru.map(u=>`<span style="border-color:${u.c}">${u.n} <b>${G.run[u.k]>=u.max?'max':`${G.run[u.k]} / ${u.max}`}</b></span>`).join(''):'<p class="empty" style="font-size:13px">Ramasse les cristaux d\'expérience pour monter de niveau et choisir des bonus.</p>';
  const L=G.loot;
  const rplan=L.items.length?bestPlan(G.eq,L.items):{},rpn=Object.keys(rplan).length;
  $('runLoot').innerHTML=(L.items.length||L.parts.length||L.relics.length)
    ?(rpn?`<div class="actions" style="margin:0 0 8px"><button class="btn" id="bestRun">Équiper le meilleur butin · ${rpn}</button></div>`:'')+(L.items.length?`<div class="grid">${L.items.map(it=>cellHtml(it,'run',runSel===it.id,better(it))).join('')}</div>`:'')
      +(runSel&&L.items.some(i=>i.id===runSel)?card(L.items.find(i=>i.id===runSel),'run'):'')
      +(L.relics.length?`<ul class="partlist">${L.relics.map(id=>`<li>Relique <b style="color:${RTIER[RELICS[id].t].c}">${relicName(id)}</b></li>`).join('')}</ul>`:'')
      +(L.parts.length?`<ul class="partlist">${L.parts.map(p=>`<li>${partLabel(p)}</li>`).join('')}</ul>`:'')
    :'<p class="empty">Rien pour l\'instant. Les monstres lâchent parfois des équipements et des reliques, les Gardiens toujours.</p>';
  $('runLoot').querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>{runSel=+b.dataset.run;drawBag()});
  $('runLoot').querySelectorAll('[data-ract]').forEach(b=>b.onclick=()=>equipRun(+b.dataset.ract));
  if($('bestRun'))$('bestRun').onclick=()=>{const plan=bestPlan(G.eq,G.loot.items);for(const sl in plan){const it=plan[sl];G.loot.items=G.loot.items.filter(i=>i!==it);const old=meta.gear[sl];if(old)meta.stash.push(old);meta.gear[sl]=it;G.eq[sl]=it}saveMeta();refreshStats();runSel=null;toast(`${Object.keys(plan).length} objet${Object.keys(plan).length>1?'s':''} équipé${Object.keys(plan).length>1?'s':''}`);drawBag()};
  renderMods('modsBag');
}
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
  const av=RUP.filter(u=>(!u.cls||u.cls.includes(G.cls))&&(G.run[u.k]||0)<u.max&&!capped[u.k]&&(u.k!=='fiole'||G.potions<5)),pool=[...av],out=[];
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
  else if(k==='fiole'){G.run.fiole=(G.run.fiole||0)+1;G.potions=Math.min(5,G.potions+1)}
  else{G.run[k]=(G.run[k]||0)+1;refreshStats();if(k==='hp')heal(S.hp*.15)}
  G.pend--;$('lvlup').hidden=true;
  burst(G.P.x,G.P.y,20,'#9fe3f0',160);
  if(G.pend>0)showLevelUp();else{paused=false;last=performance.now()}
}
function equipRun(id){
  const it=G.loot.items.find(i=>i.id===id);if(!it)return;
  G.loot.items=G.loot.items.filter(i=>i!==it);
  const old=meta.gear[it.slot];if(old){meta.stash.push(old)}
  meta.gear[it.slot]=it;G.eq[it.slot]=it;saveMeta();refreshStats();runSel=null;
  toast(`<span style="color:${RAR[it.r].c}">${it.name}</span> équipé`);drawBag();
}
function refreshStats(){if(!G)return;const ratio=G.P.hp/S.hp;S=stats(G.eq);G.P.hp=Math.max(1,Math.min(S.hp,ratio*S.hp))}

/* ---------- Mods (interface) ---------- */
let modSel=null,alSel=null,modTab='h',modPF='all',modSF=null;
const AURA_C='#f0cf4a';
function modCard(id,cls='',i,b){const m=MODS[id],rk=meta.mods[id],isA=modKind(id)==='a',p=isA?{c:AURA_C,s:'✦',n:'Aura'}:POL[MOD_POL[id]];
  const d=isA?`+${MODS[id].cap+rk}`:(b&&i!==undefined?bDrain(b,id,rk,i):modDrain(id,rk));
  return `<button class="mod${cls}" data-mod="${id}" style="--mc:${MOD_RAR[m.r].c}" aria-label="${m.n}, rang ${rk}, ${isA?'aura':'polarité '+p.n}"><span class="pl" style="color:${p.c}">${p.s}</span><span class="dr">${d}</span><b>${m.n}</b>${modSt(id)?`<span class="mst" aria-label="${modSt(id)} étoile${modSt(id)>1?'s':''}">${'★'.repeat(modSt(id))}</span>`:''}${meta.modCp[id]?`<span class="mcp" title="Copies">×${meta.modCp[id]}</span>`:''}<span class="pp">${'<i class="on"></i>'.repeat(rk)}${'<i></i>'.repeat(m.max-rk)}</span></button>`}
function modDetail(id){
  const m=MODS[id],rk=meta.mods[id],c=MOD_RAR[m.r].c,k=modKind(id),isA=k==='a',b=build(k==='w'?'w':'h'),ok=modOk(id,heroCls);
  const slot=isA?(b.aura===id?0:-1):b.load.indexOf(id),eq=slot>=0,u=bUsed(b),cap=bCap(b),fc=fuseCost(id,rk),maxed=rk>=m.max;
  let act='',why='',fuseBlocked=false,costLine;
  const where=k==='w'?`l'arme (${b.name})`:'le héros';
  if(isA){
    costLine=`Aura du héros · rapporte +${m.cap+rk} de capacité`;
    act=eq?'<button class="btn" data-act="unequip">Retirer</button>':`<button class="btn main" data-act="equip">${b.aura?'Remplacer l\'aura':'Équiper l\'aura'}</button>`;
    if(eq&&u>cap-(m.cap+rk)){why='Retirer cette aura ferait dépasser la capacité du héros : les mods en trop deviendraient inactifs.'}
  }else{
    const p=POL[MOD_POL[id]],bs0=bBest(b,id,rk),bs=(modSF!=null&&modSF<b.slots&&!b.load[modSF]&&b.kind===(modKind(id)==='w'?'w':'h'))?{i:modSF,d:bDrain(b,id,rk,modSF)}:bs0,fits=bs.i>=0&&u+bs.d<=cap;
    costLine=`Mod ${k==='w'?'d\'arme':'de héros'} · <span style="color:${p.c}">${p.s} ${p.n}</span> · `+(eq?`coûte ${bDrain(b,id,rk,slot)} dans la case ${slot+1}`:`coûte ${modDrain(id,rk)}, ${Math.ceil(modDrain(id,rk)/2)} dans une case ${p.n}`);
    if(!ok){why=`Réservé à : ${m.cls.map(x=>CLS[x].n).join(', ')}.`}
    else if(eq)act='<button class="btn" data-act="unequip">Retirer</button>';
    else{act=`<button class="btn main" data-act="equip" ${!fits?'disabled':''}>Équiper${bs.i>=0?` · case ${bs.i+1}`:''}</button>`;
      why=bs.i<0?`Toutes les cases de ${where} sont prises. Retire un mod d'abord.`:!fits?`Capacité insuffisante : il faut ${bs.d} points, il en reste ${Math.max(0,cap-u)}.`:''}
    fuseBlocked=eq&&u-bDrain(b,id,rk,slot)+bDrain(b,id,rk+1,slot)>cap;
  }
  const fuse=maxed?'<span class="owned" style="align-self:center;flex:1;text-align:center">Rang max</span>':`<button class="btn buy" data-act="fuse" ${meta.essence<fc||fuseBlocked?'disabled':''}>Fusionner · ${fc} essence</button>`;
  if(!why&&fuseBlocked&&!maxed)why='Monter ce mod de rang dépasserait la capacité.';
  return `<div class="card"><div class="nm" style="color:${c}">${m.n}</div><div class="meta">${MOD_RAR[m.r].n} · ${costLine} · rang ${rk} / ${m.max}</div>
    <ul><li>${m.t(modVal(id,rk))}</li>${maxed?'':`<li style="color:var(--muted)">Rang ${rk+1} : ${m.t(modVal(id,rk+1))}</li>`}</ul>
    <div class="actions">${act}${fuse}</div>${why?`<p class="empty" style="font-size:13px">${why}</p>`:''}${starBlock(id,b,k,slot)}</div>`;
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
  let h=`<h3>Alignement · ${b.kind==='w'?'arme':'héros'}</h3><p class="empty" style="font-size:13px">Aligne une case sur une polarité : un mod de la même polarité y coûte moitié moins, un autre 25 % de plus. Chaque alignement coûte de l'essence (200, 400, 800 puis 1 600) et remet la maîtrise ${b.de} à 0.</p>
    <div class="alrow">${b.pol.slice(0,b.slots).map((p,i)=>`<button class="chip" data-act="alslot" data-i="${i}" aria-pressed="${!!alSel&&alSel.i===i}">Case ${i+1} · ${p?`<span style="color:${POL[p].c}">${POL[p].s} ${POL[p].n}</span>`:'neutre'}</button>`).join('')}</div>`;
  if(alSel){const cur=b.pol[alSel.i];
    h+=`<div class="alrow">${Object.keys(POL).map(k=>`<button class="chip" data-act="alpol" data-p="${k}" aria-pressed="${alSel.p===k}" ${cur===k?'disabled':''}><span style="color:${POL[k].c}">${POL[k].s}</span> ${POL[k].n}</button>`).join('')}</div>`;
    if(alSel.p)h+=`<div class="card"><p style="margin:0;font-size:14px">Aligner la case ${alSel.i+1} en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b> pour <b>${cost} essence</b>. La maîtrise ${b.de} repasse du rang ${mt.r} à 0${mt.r?` : −${mt.r} de capacité jusqu'à ce que tu la regagnes en mission`:''}.</p>
      <div class="actions"><button class="btn main" data-act="alok" ${meta.essence<cost?'disabled':''}>Aligner · ${cost} essence</button><button class="btn" data-act="alcancel">Annuler</button></div>
      ${meta.essence<cost?`<p class="empty" style="font-size:13px">Il te manque ${cost-meta.essence} essence.</p>`:''}</div>`;
    else h+='<p class="empty" style="font-size:13px">Choisis la polarité de cette case.</p>';
  }
  return h;
}
function renderMods(rootId){
  const root=$(rootId);if(!root)return;const inCamp=rootId==='modsCamp';
  const b=build(modTab),u=bUsed(b),cap=bCap(b),act=bActive(b),mt=b.mast;
  const owned=Object.keys(MODS).filter(id=>meta.mods[id]!=null);
  if(modSel&&meta.mods[modSel]==null)modSel=null;
  if(modSel&&(modKind(modSel)==='w')!==(modTab==='w'))modSel=null;
  const fits=id=>modTab==='w'?modKind(id)==='w':modKind(id)!=='w';
  if(modSF!=null&&modSF>=b.slots)modSF=null;
  const pool=owned.filter(id=>fits(id)&&!b.load.includes(id)&&b.aura!==id);
  const sp=modSF!=null?b.pol[modSF]:null,polOf=id=>modKind(id)==='a'?'a':MOD_POL[id];
  const pcount={all:pool.length};for(const id of pool){const q=polOf(id);pcount[q]=(pcount[q]||0)+1}
  let rest=pool.filter(id=>modSF!=null?(polOf(id)!=='a'&&(!sp||polOf(id)===sp)):(modPF==='all'||polOf(id)===modPF));
  rest.sort(modSF!=null?(x,y)=>(modOk(y,heroCls)-modOk(x,heroCls))||bDrain(b,x,meta.mods[x],modSF)-bDrain(b,y,meta.mods[y],modSF)||MODS[y].r-MODS[x].r
    :(x,y)=>(modOk(y,heroCls)-modOk(x,heroCls))||(modKind(y)==='a')-(modKind(x)==='a')||MODS[y].r-MODS[x].r);
  const pchip=(k,lab,c)=>`<button class="cx-chip cx-chip--sm" data-act="polf" data-p="${k}" aria-pressed="${modSF==null&&modPF===k}"${c&&!(modSF==null&&modPF===k)?` style="color:${c}"`:''}>${lab} <span class="n">${pcount[k]||0}</span></button>`;
  const filt=`<div class="cx-chips" role="group" aria-label="Filtrer les mods par polarité">${pchip('all','Tous')}${Object.keys(POL).map(k=>pchip(k,`${POL[k].s} ${POL[k].n}`,POL[k].c)).join('')}${modTab==='h'&&pcount.a?pchip('a','✦ Aura',AURA_C):''}</div>
    ${modSF!=null?`<p class="cx-hint" style="margin:0">Case ${modSF+1} · ${sp?`<b style="color:${POL[sp].c}">${POL[sp].s} ${POL[sp].n}</b> : seuls les mods ${POL[sp].n} (coût divisé par 2)`:'neutre : tous les mods'}, du moins cher au plus cher dans cette case${b.load[modSF]?'':' ; « Équiper » les place dans cette case'}. <button class="cx-btn cx-btn--ghost cx-btn--sm" data-act="slotf" data-i="${modSF}" style="margin:0">Retirer le filtre</button></p>`:'<p class="cx-hint" style="margin:0">Touche le nom de polarité au-dessus d\'une case pour voir les mods qui lui conviennent le mieux.</p>'}`;
  const slotsN=modTab==='w'?4:HSLOT_MAX;
  const slotHtml=i=>{if(i>=b.slots){const nx=i===b.slots;return `<div class="mslot"><span class="sp" style="color:var(--muted)">Verrouillée</span><div class="mod empty lockd">${nx?`${HSLOT_COST[b.slots-3]} fragments`:'—'}</div></div>`}
    const id=b.load[i],p=b.pol[i];return `<div class="mslot${modSF===i?' fsel':''}"><button class="sp" data-act="slotf" data-i="${i}" aria-pressed="${modSF===i}" aria-label="Filtrer les mods pour la case ${i+1} (${p?POL[p].n:'neutre'})" style="color:${p?POL[p].c:'var(--muted)'}">${p?POL[p].s+' '+POL[p].n:'Neutre'}</button>${id?modCard(id,(modSel===id?' sel':'')+(act.includes(id)?'':' off'),i,b):'<div class="mod empty">Libre</div>'}</div>`};
  const buyBox=modTab==='h'&&b.slots<HSLOT_MAX&&inCamp?(()=>{const c=HSLOT_COST[b.slots-3],have=fragTotal();
    return `<div class="card"><p style="margin:0;font-size:14px">Débloquer la case ${b.slots+1} du héros : <b>${c} fragments de schéma</b>, pris parmi ceux que tu as en plus grand nombre. Tu en as ${have}.</p><div class="actions"><button class="btn buy" data-act="slotbuy" ${have<c?'disabled':''}>Débloquer · ${c} fragments</button></div></div>`})():'';
  root.innerHTML=`<div class="alrow"><button class="chip" data-act="mtab" data-t="h" aria-pressed="${modTab==='h'}">Héros · ${CLS[heroCls].n}</button><button class="chip" data-act="mtab" data-t="w" aria-pressed="${modTab==='w'}">Arme · ${wdef(curWid()).n}</button></div>
    <div class="modhead"><span>Capacité <b class="${u>cap?'over':''}">${u} / ${cap}</b></span><span>Essence <b>${meta.essence}</b></span>
      <span>Maîtrise ${b.kind==='w'?'arme':'héros'} <b>${mt.r} / 10</b>${mt.r<10?` · ${mt.xp} / ${mastNeed(mt.r)}`:''}</span></div>
    ${u>cap?'<p class="empty" style="font-size:13px;color:var(--blood)">Capacité dépassée : les mods en trop sont inactifs (grisés). Regagne de la maîtrise en mission ou retire un mod.</p>':''}
    ${modTab==='h'?`<div class="aurarow"><div class="mslot"><span class="sp" style="color:${AURA_C}">✦ Aura</span>${b.aura?modCard(b.aura,modSel===b.aura?' sel':''):'<div class="mod empty">Aura libre</div>'}</div><p class="empty" style="font-size:13px">Une aura rapporte de la capacité au héros au lieu d'en coûter, et donne un effet permanent.</p></div>`:''}
    <div class="modslots${slotsN>4?' six':''}">${Array.from({length:slotsN},(_,i)=>slotHtml(i)).join('')}</div>
    ${buyBox}
    ${filt}
    <div class="modlist">${rest.map(id=>modCard(id,(modSel===id?' sel':'')+(modOk(id,heroCls)?'':' lock'),modSF!=null&&modKind(id)!=='a'?modSF:undefined,modSF!=null?b:undefined)).join('')||`<p class="empty" style="grid-column:1/-1">${pool.length?'Aucun mod pour ce filtre.':`Aucun autre mod ${modTab==='w'?'d\'arme':'de héros'}.`} Les monstres en laissent parfois tomber, les Gardiens toujours.</p>`}</div>
    ${modSel?modDetail(modSel):`<p class="empty" style="font-size:13px">${modTab==='w'?'Les mods d\'arme restent attachés à cette arme : chaque arme a son propre build.':'Les mods de héros servent à la survie, au déplacement et aux compétences.'} Le symbole en haut à gauche d'un mod est sa polarité, le chiffre son coût.</p>`}
    ${inCamp?alignPanel(b):''}`;
  root.querySelectorAll('[data-mod]').forEach(x=>x.onclick=()=>{modSel=x.dataset.mod;modsChanged()});
  root.querySelectorAll('[data-act]').forEach(x=>x.onclick=()=>modAct(x.dataset.act,x.dataset));
}
function modAct(a,ds){
  const id=modSel,rk=id?meta.mods[id]:0;
  if(a==='mtab'){modTab=ds.t;modSel=null;alSel=null;modSF=null;modPF='all'}
  else if(a==='polf'){modPF=ds.p;modSF=null}
  else if(a==='slotf'){const i=+ds.i;modSF=modSF===i?null:i}
  else if(a==='equip'||a==='unequip'||a==='fuse'){
    const k=modKind(id),b=build(k==='w'?'w':'h');
    if(a==='equip'){if(!modOk(id,heroCls))return;if(k==='a')meta.aura[heroCls]=id;else{let bs=bBest(b,id,rk);if(modSF!=null&&modSF<b.slots&&!b.load[modSF]&&(k==='w')===(modTab==='w'))bs={i:modSF,d:bDrain(b,id,rk,modSF)};if(bs.i<0||bUsed(b)+bs.d>bCap(b))return;b.load[bs.i]=id}}
    else if(a==='unequip'){if(k==='a'){if(meta.aura[heroCls]===id)meta.aura[heroCls]=null}else{const i=b.load.indexOf(id);if(i>=0)b.load[i]=null}}
    else{const c=fuseCost(id,rk);if(meta.essence<c||rk>=MODS[id].max)return;if(k!=='a'){const i=b.load.indexOf(id);if(i>=0&&bUsed(b)-bDrain(b,id,rk,i)+bDrain(b,id,rk+1,i)>bCap(b))return}meta.essence-=c;meta.mods[id]=rk+1}
  }
  else if(a==='star'){const k=modKind(id),b=build(k==='w'?'w':'h'),m=MODS[id],st=modSt(id),c=starCost(id,st);
    if(!modCanStar(id)||rk<m.max||st>=MOD_ST_MAX||(meta.modCp[id]|0)<c.cp||meta.essence<c.ess)return;
    if(k!=='a'){const i=b.load.indexOf(id);if(i>=0&&bUsed(b)-bDrain(b,id,rk,i)+polD(b,id,i,modDrain(id,rk,st+1))>bCap(b))return}
    meta.modCp[id]-=c.cp;meta.essence-=c.ess;meta.modSt[id]=st+1;SND.play('relic');toast(`<b style="color:${MOD_RAR[m.r].c}">${m.n}</b> surchargé : ${'★'.repeat(st+1)}`)}
  else if(a==='dissolve'){const cp=meta.modCp[id]|0;if(!cp)return;meta.essence+=cp*8*(MODS[id].r+1);meta.modCp[id]=0}
  else if(a==='slotbuy'){const b=build('h');if(b.slots>=HSLOT_MAX)return;const c=HSLOT_COST[b.slots-3];if(fragTotal()<c)return;takeFrags(c);meta.hslots[heroCls]=b.slots+1;toast(`Case ${b.slots+1} du héros débloquée`)}
  else if(a==='alslot'){const i=+ds.i;alSel=alSel&&alSel.i===i?null:{i,p:null}}
  else if(a==='alpol'){if(alSel)alSel.p=ds.p}
  else if(a==='alcancel'){alSel=null}
  else if(a==='alok'){const b=build(modTab);if(!alSel||!alSel.p)return;const cost=bAlignCost(b);if(meta.essence<cost)return;
    meta.essence-=cost;b.pol[alSel.i]=alSel.p;b.alignStore[b.key]=(b.alignStore[b.key]||0)+1;b.mast.r=0;b.mast.xp=0;
    toast(`Case ${alSel.i+1} alignée en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b>. Maîtrise ${b.de} remise à 0.`);alSel=null}
  saveMeta();modsChanged();
}
function modsChanged(){if(started&&G&&!G.over)refreshStats();if(!$('bag').hidden)drawBag();if(!$('camp').hidden)drawCamp()}

/* ---------- Fin de niveau, extraction, mort ---------- */
function lootSummary(){
  const L=G.loot,its=L.items.length,pts=L.parts.length;
  return `<div><span>Or ramassé</span><b style="color:var(--r2)">${G.gold}</b></div><div><span>Équipements</span><b>${its?L.items.map(i=>`<span style="color:${RAR[i.r].c}">◆</span>`).join(''):'0'}</b></div>
    <div><span>Reliques</span><b>${L.relics.length?L.relics.map(id=>`<span style="color:${RTIER[RELICS[id].t].c}">${relicName(id)}</span>`).join(', '):'0'}</b></div>
    ${G.relQ.length?`<div><span>Reliques ouvertes</span><b>${G.opened.length} / ${G.relQ.length}${G.relic?` · ${G.react} / ${REACT_N} réactifs`:''}</b></div>`:''}<div><span>Ennemis abattus</span><b>${G.kills}</b></div><div><span>Temps de survie</span><b>${fmt(G.t)}</b></div>`;
}
function roundDone(){
  if(NET.on){G.hold=true;if(NET.host)netSend({t:'round'})}
  paused=true;resetJoy();$('bag').hidden=true;$('lvlup').hidden=true;
  const nl=G.level+1,unlock=false;
  if(unlock){meta.cp=nl;saveMeta()}
  const r=relicDrop();G.loot.relics.push(r);let extra='';
  if(G.mode==='defense'){const it=genItem(itemLvl(),1);G.loot.items.push(it);extra=` et <span style="color:${RAR[it.r].c}">${it.name}</span>`}
  $('exTitle').textContent=G.mode==='defense'?`Vague ${G.wave} repoussée`:`Niveau ${G.level} terminé`;
  $('exLead').innerHTML=(G.mode==='defense'?'Le cryopode tient. ':'Un portail s\'ouvre. ')+`Récompense de manche : relique <b style="color:${RTIER[RELICS[r].t].c}">${relicName(r)}</b>${extra}. Sors pour tout garder, ou continue : au niveau ${G.level+1}, les monstres seront plus forts.`+(unlock?` Tu peux désormais commencer au niveau ${nl}.`:'');
  $('exSum').innerHTML=lootSummary();
  $('contBtn').textContent=`Continuer · niveau ${G.level+1}`;
  $('extract').hidden=false;
}
function bank(full){
  const g=full?G.gold:Math.floor(G.gold/2);meta.gold+=g;G.run={};
  const gainM=(mt,label)=>{let up=0;if(mt.r<10){mt.xp+=G.kills;while(mt.r<10&&mt.xp>=mastNeed(mt.r)){mt.xp-=mastNeed(mt.r);mt.r++;up++}if(mt.r>=10)mt.xp=0}
    return `Maîtrise ${label} : rang ${mt.r} / 10`+(mt.r<10?` (${mt.xp} / ${mastNeed(mt.r)})`:'')+(up?` · +${up} de capacité`:'')};
  G.mastMsg=gainM(mastOf(G.cls),deCls(G.cls))+'<br>'+gainM(mstOf(meta.wmast,G.wid),deW(wdef(G.wid).n));
  if(full){
    for(const it of G.loot.items)meta.stash.push(it)
    for(const p of G.loot.parts){if(meta.built[p.w])meta.essence+=6;else{const a=meta.parts[p.w]||(meta.parts[p.w]=[0,0,0]);a[p.p]++}}
    for(const id of G.loot.relics){const a=meta.relics[id]||(meta.relics[id]=[0,0]);a[0]++}
  }
  saveMeta();return g;
}
function recordBest(){if(G.t>best){best=G.t;try{localStorage.setItem('crypte-best2',String(best))}catch(e){}}}
function showOver(title,txt,earn,rel){$('overTitle').textContent=title;$('overTxt').textContent=txt;$('earnTxt').innerHTML=earn;$('relicTxt').innerHTML=[rel,G&&G.mastMsg].filter(Boolean).join('<br>');refreshMenus();$('over').hidden=false}
function grantRelic(id,rad){
  const a=meta.relics[id];if(!a||a[rad?1:0]<=0)return null;
  a[rad?1:0]--;const r=rollRelic(id,rad),rar=RW_RAR[RELICS[id].rw.indexOf(r)];
  const [k,v]=r.split(':');let si=null;if(k==='ess')meta.essence+=+v;else if(k==='gold')meta.gold+=+v;else if(k==='sang'){si=sangItem(v,sangLvl());meta.stash.push(si)}else if(k==='aby'){si=abyItem(v,abyLvl());meta.stash.push(si)}else if(v==='*')giveFrag(k);else{const p=meta.parts[k]||(meta.parts[k]=[0,0,0]);p[+v]++}
  relicQFix();
  const frag=k!=='ess'&&k!=='gold'&&k!=='sang'&&k!=='aby';
  return {rar,html:`<b style="color:${MOD_RAR[rar].c}">${rwLabel(r)}</b> (${['commun','peu commun','rare'][rar]})`+(frag?` · fragment ${fragStatus(k)} / 3 de ${bpdef(k).n}, à fabriquer à l'Armurerie`:'')+(si?` · <b style="color:${RAR[si.r].c}">${si.name}</b> niveau ${si.lvl} rejoint ton coffre (${Object.keys(si.aff).map(q=>AFF[q].t(si.aff[q])).join(', ')})`:'')};
}
function resolveRelic(){
  const out=[];
  for(const r of G.opened){const g=grantRelic(r.id,r.rad);if(!g)continue;meta.essence+=25;out.push(`Relique ${relicName(r.id)}${r.rad?' éclatante':''} : ${g.html}. +25 essence.`)}
  const left=G.relQ.length-G.opened.length;
  if(left>0)out.push(`${left} relique${left>1?'s':''} non ouverte${left>1?'s':''} faute de réactifs : ${left>1?'elles restent':'elle reste'} équipée${left>1?'s':''}, sans être consommée${left>1?'s':''}.`);
  return out.join('<br>');
}
function missionSuccess(){SND.play('win');if(NET.host)netSend({t:'exit'});G.hold=false;
  $('extract').hidden=true;$('lvlup').hidden=true;G.over=true;const rel=resolveRelic();const g=bank(true);recordBest();
  const txt=G.mode==='capture'?`Cible capturée en ${fmt(G.t)}, ${G.kills} ennemis abattus.`:G.mode==='defense'?`Tu as tenu ${G.wave} vagues, ${G.kills} ennemis abattus.`:`Tu es sorti au niveau ${G.level} après ${fmt(G.t)}, avec ${G.kills} ennemis abattus.`;
  showOver(G.mode==='capture'?'Capture réussie':'Extraction réussie',txt+' Ton butin t\'attend au Camp.',`<span class="coin"></span>+${g} or · ${meta.gold} au total`,
    rel);
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
function missionToast(){toast(G.mode==='defense'?'<b>Défense.</b> Protège le cryopode.':G.mode==='capture'?'<b>Capture.</b> Suis la flèche dorée jusqu\'à la cible.':'<b>Survie.</b> Le portail s\'ouvre dans 3 minutes.');
  if(G.relic)setTimeout(()=>toast(`Fissure : ${G.relQ.length} relique${G.relQ.length>1?'s':''} équipée${G.relQ.length>1?'s':''}. Abats les ennemis au halo doré : ${REACT_N} réactifs ouvrent ${relicName(G.relic.id)}${G.relic.rad?' éclatante':''}, puis la suivante.`),900)}

