// Crypte des Cendres — camp.js
/* ---------- Camp ---------- */
let campTab='equip',campSel=null;
function syncEq(){if(G&&(!started||G.over)){G.eq=curEq();S=stats(G.eq);G.P.hp=S.hp}}
let campMsg='';
function fragStatus(id){const pc=meta.parts[id]||[0,0,0];return pc.filter(n=>n>0).length}
let stF='all',stS='rar';
// Héros : les objets dont tu as des fragments, avec un lien vers l'Armurerie.
function fragInv(){
  const ids=craftIds().filter(id=>(meta.parts[id]||[]).some(n=>n>0)).sort((a,b)=>fragStatus(b)-fragStatus(a)||bpdef(b).r-bpdef(a).r);
  if(!ids.length)return '<p class="cx-hint" style="margin:0">Aucun fragment. Ouvre des reliques en mission : chacune donne un fragment d\'un objet de sa rareté. Trois fragments d\'un même objet se fabriquent à l\'Armurerie.</p>';
  return `<ul class="partlist">${ids.slice(0,12).map(id=>{const b=bpdef(id),pc=meta.parts[id];
    return `<li><b style="color:${RAR[b.r].c}">${esc(b.n)}</b> <span style="color:var(--muted)">(${fragStatus(id)} / 3)</span> · ${b.frag.map((n,i)=>`<span style="color:${pc[i]?'var(--heal)':'var(--muted)'}">${n}${pc[i]>1?' ×'+pc[i]:''}</span>`).join(', ')}</li>`}).join('')}${ids.length>12?`<li class="cx-hint" style="margin:0">… et ${ids.length-12} autres</li>`:''}</ul>
    <button class="btn" data-cact="toarsenal" style="align-self:flex-start">Fabriquer à l'Armurerie</button>`;
}
let fuseTgt={};
function giveFrag(id){const pc=meta.parts[id]||(meta.parts[id]=[0,0,0]),miss=[0,1,2].filter(i=>!pc[i]),i=miss.length?pick(miss):ri(0,2);pc[i]++;return i}
// Essence rendue par une arme recyclée : selon sa rareté et son rang (un rang vaut deux exemplaires).
const wRecyEss=b=>20*(b.r+1)*2**(meta.wlv[b.id]|0);
// Où trouver un objet : sa relique et la difficulté où elle tombe.
const srcTxt=b=>b.r>=3?`Relique <b style="color:${RTIER[b.r-3].c}">${RTIER[b.r-3].n}</b> · ${REL_SRC[b.r-3]}`:'Butin des monstres et des Gardiens';
function bpCard(b){
  const pc=meta.parts[b.id]||[0,0,0],isW=b.kind==='arme',r=RAR[b.r],mine=!isW||b.cls===heroCls;
  const own=isW&&ownedW(b.id),eq=isW&&curWid(b.cls)===b.id,craftable=b.r>=3,ready=craftable&&pc.every(x=>x>0),cost=b.craft;
  const lvl=relicItemLvl();
  const baseTxt=isW?`${b.dmg} dégâts de base`:baseTxtOf(b.slot,Math.round(baseRoll(b.slot,lvl)*RB[b.r]));
  const lines=isW?Object.keys(b.aff).map(k=>`<li${AFF[k].aby?' class="abyp"':''}>${AFF[k].t(b.aff[k])}</li>`).join(''):rgAff(b).map(k=>`<li>${AFF_NAME[k]||k}</li>`).join('')+(b.pw?`<li class="abyp">${AFF[b.pw].t(AFF[b.pw].r(lvl))}</li>`:'');
  const sp=isW?wSpares(b.id).length:0;
  let st=isW?(own?`<span class="owned">${eq?'Équipée':'Possédée'} · ${rkTxt(meta.wlv[b.id])}${sp?` · ${sp} double${sp>1?'s':''}`:''}${mine?'':' · '+CLS[b.cls].n}</span>`:''):'';
  let foot='';
  if(craftable)foot=`<div class="parts">${b.frag.map((n,i)=>`<span class="part${pc[i]?' have':''}">${n}${pc[i]>1?' ×'+pc[i]:''}</span>`).join('')}</div>
    <button class="btn main buy" data-cact="craft" data-arg="${b.id}" ${ready&&meta.gold>=cost?'':'disabled'}>${isW&&own?'Fabriquer un double':'Fabriquer'} · <span class="coin"></span>${cost}</button>`;
  if(isW&&own&&!eq&&mine)foot+=`<button class="btn" data-cact="wequip" data-arg="${b.id}">Équiper</button>`;
  return `<div class="wpn${eq&&mine?' on':''}"><div class="nm" style="color:${r.c}">${esc(b.n)}</div><div class="meta">${r.n} · ${isW?'Arme · '+CLS[b.cls].n:SLOT[b.slot]+(b.bio?' · ❄ Abîmes gelés':'')} · ${baseTxt}${!isW?` · niveau ${lvl}`:''}</div>
    <ul>${lines||'<li>Aucun bonus</li>'}</ul>
    <div class="meta">${srcTxt(b)}${isW&&!craftable?'':''}</div>${st}<div class="wfoot">${foot}</div></div>`;
}
let arsAsk=null;
function craftPlan(){const ids=craftIds(),parts={},plan=[];let gold=meta.gold;for(const id of ids)parts[id]=[...(meta.parts[id]||[0,0,0])];
  for(const id of ids){const b=bpdef(id);for(let n=0;n<20;n++){const pc=parts[id];if(!pc.every(x=>x>0)||gold<b.craft)break;parts[id]=pc.map(x=>x-1);gold-=b.craft;plan.push(id)}}
  return {plan,cost:meta.gold-gold}}
function craftOne(id){const b=bpdef(id),pc=meta.parts[id];if(!b||b.r<3||!pc||!pc.every(x=>x>0)||meta.gold<b.craft)return null;
  meta.parts[id]=pc.map(x=>x-1);meta.gold-=b.craft;
  if(b.kind==='arme'){const g=gainWeapon(id);if(g==='new'&&b.cls===heroCls)meta.wpn[heroCls]=id;return g}
  const it=rgItem(id,relicItemLvl());meta.stash.push(it);return it}
function arsBar(){const cp=craftPlan();
  let h=`<div class="actions" style="margin:0"><button class="btn${cp.plan.length?' main':''}" data-cact="craftask" ${cp.plan.length?'':'disabled'}>Tout fabriquer${cp.plan.length?` · ${cp.plan.length}`:''}</button>${isUnl('fuse')?'<button class="btn" data-cact="gofuse">Fusionner à la Forge</button>':''}</div>`;
  if(arsAsk==='craft'&&cp.plan.length){const cnt={};for(const id of cp.plan)cnt[id]=(cnt[id]||0)+1;
    h+=`<div class="card"><p style="margin:0;font-size:14px">Fabriquer ${cp.plan.length} objet${cp.plan.length>1?'s':''} pour <b><span class="coin"></span> ${cp.cost} or</b> : ${Object.keys(cnt).map(id=>`<b style="color:${RAR[bpdef(id).r].c}">${esc(bpdef(id).n)}</b>${cnt[id]>1?' ×'+cnt[id]:''}`).join(', ')}.</p><div class="actions"><button class="btn main" data-cact="craftall">Fabriquer</button><button class="btn" data-cact="arsno">Annuler</button></div></div>`}
  return h}
let arsView='coffre',arsR='w';
// Armurerie › Mes armes : toutes les armes possédées, avec leurs valeurs réelles (rang et affixes ajoutées comprises).
function myWeapons(){const order=[heroCls,...Object.keys(CLS).filter(c=>c!==heroCls)];
  const all=order.flatMap(c=>WPN[c].filter(w=>ownedW(w.id)).map(w=>({c,w})));const tot=Object.values(WPN).flat().length;
  const base=curEq(),dpsOf=id=>dps(stats({...base,arme:weaponItem(heroCls,id)})),cur=dpsOf(curWid());
  let h=`<p class="cx-hint" style="margin:0">${all.length} arme${all.length>1?'s':''} possédée${all.length>1?'s':''} sur ${tot}. Valeurs avec rang et affixes ajoutées. Pour ton héros, la ligne DPS compare chaque arme à celle équipée, avec ton équipement actuel.</p>`;
  for(const c of order){const L=all.filter(x=>x.c===c);if(!L.length)continue;
    h+=`<h3>${CLS[c].n}${c===heroCls?' · ton héros':''} <span class="cx-hint" style="margin:0;font-weight:400">${L.length} / ${WPN[c].length}</span></h3>`;
    h+=L.sort((a,b)=>b.w.r-a.w.r).map(({w})=>{const it=weaponItem(c,w.id),m=upMul(it.up),r=RAR[w.r],eq=curWid(c)===w.id,mine=c===heroCls;
      const mods=(meta.wload[w.id]||[]).filter(Boolean).length,mt=(meta.wmast[w.id]||{r:0}).r,sp=wSpares(w.id).length,fp=wFusePlan(w.id);
      const d=mine?dpsOf(w.id):0,diff=mine&&!eq&&cur?Math.round((d/cur-1)*100):0;
      return `<div class="wpn${eq&&mine?' on':''}"><div class="nm" style="color:${r.c}">${esc(w.n)} <span style="color:var(--ink)">${rkTxt(it.up)}</span></div>
        <div class="meta">${r.n} · ${fmtN(w.dmg*m)} dégâts de base · maîtrise ${mt} / 10 · ${mods} mod${mods>1?'s':''}${sp?` · ${sp} double${sp>1?'s':''}`:''}</div>
        <ul>${Object.keys(it.aff).map(k=>`<li${AFF[k].aby?' class="abyp"':''}>${AFF[k].t(NOSCALE[k]?it.aff[k]:fmtN(it.aff[k]*m))}</li>`).join('')||'<li>Aucun bonus</li>'}</ul>
        ${mine?`<div class="meta">DPS estimé <b style="color:var(--ink)">${fmtN(Math.round(d))}</b>${eq?'':` · <b style="color:${diff>=0?'var(--heal)':'var(--blood)'}">${diff>=0?'+':''}${diff} %</b> par rapport à l'arme équipée`}</div>`:''}
        <div class="wfoot">${eq?`<span class="owned">Équipée${mine?'':' · '+CLS[c].n}</span>`:mine?`<button class="btn main" data-cact="wequip" data-arg="${w.id}">Équiper</button>`:`<span class="owned">${CLS[c].n}</span>`}${fp.n?`<button class="btn" data-cact="wfuse" data-arg="${w.id}">Fusionner · ${rkTxt(fp.R)} · <span class="coin"></span>${fp.cost}</button>`:fp.need?`<button class="btn" disabled>Fusionner · <span class="coin"></span>${fp.need}</button>`:''}</div></div>`}).join('')}
  return h}
function campArsenal2(){
  const nOwn=Object.values(WPN).flat().filter(w=>ownedW(w.id)).length;
  const tv=(k,lab,n)=>`<button class="cx-chip" role="tab" data-cact="arsv" data-arg="${k}" aria-pressed="${arsView===k}">${lab}${n!=null?` <span class="n">${n}</span>`:''}</button>`;
  const ak={rec:'craft',mine:'arms',recy:'recy'},lk=k=>ak[k]&&!isUnl(ak[k]);
  const tv2=(k,lab,n)=>lk(k)?tv(k,`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>${lab}`).replace('class="cx-chip"','class="cx-chip is-locked"'):tv(k,lab,n);
  const tabs=`<div class="cx-chips" role="tablist" aria-label="Armurerie">${tv('coffre','Coffre',stashN())}${tv('heros','Par héros')}${tv2('rec','Recettes')}${tv2('mine','Mes armes',nOwn)}${tv2('recy','Recyclage')}</div>`;
  if(lk(arsView))return `${campMsg}${tabs}${lockedHtml(ak[arsView])}`;
  const nc=ak[arsView]?newCard(ak[arsView]):'';
  if(arsView==='mine')return `${campMsg}${tabs}${nc}${myWeapons()}`;
  if(arsView==='coffre')return `${campMsg}${tabs}${campCoffre()}`;
  if(arsView==='heros')return `${campMsg}${tabs}${herosView()}`;
  if(arsView==='recy')return `${campMsg}${tabs}${nc}${campRecycle()}`;
  const ready=id=>{const pc=meta.parts[id]||[0,0,0];return pc.every(x=>x>0)};
  const nReady=craftIds().filter(ready).length;
  const ch=(k,lab,c,n)=>`<button class="cx-chip cx-chip--sm" data-cact="arsr" data-arg="${k}" aria-pressed="${arsR===k}"${c&&arsR!==k?` style="color:${c}"`:''}>${lab}${n!=null?` <span class="n">${n}</span>`:''}</button>`;
  let h=`${campMsg}${tabs}${arsBar()}<p class="cx-hint" style="margin:0">Les armes communes, magiques et rares tombent des monstres. Tout ce qui est légendaire ou plus rare se fabrique avec 3 fragments, trouvés en ouvrant les reliques de sa rareté. Un objet fabriqué sort au niveau d'objet de ta plus haute mission réussie (niveau ${maxL()} → objet niveau ${relicItemLvl()}).</p>
    <div class="cx-chips">${ch('w','Armes · '+CLS[heroCls].n)}${[3,4,5,6].map(r=>ch(String(r),RAR[r].n,RAR[r].c)).join('')}${ch('ready','Prêts',null,nReady)}${ch('o','Autres classes')}</div>`;
  let list=[];
  if(arsR==='w')list=WPN[heroCls].map(w=>w.id);
  else if(arsR==='o')list=Object.keys(WPN).filter(c=>c!==heroCls).flatMap(c=>WPN[c].filter(w=>w.r>=3||ownedW(w.id))).map(w=>w.id);
  else if(arsR==='ready')list=craftIds().filter(ready);
  else list=Object.keys(RGEAR).filter(id=>RGEAR[id].r===+arsR);
  if(!list.length)h+='<p class="cx-hint" style="margin:0">Rien à fabriquer pour l\'instant : il faut les 3 fragments.</p>';
  return h+list.map(id=>bpCard(bpdef(id))).join('');
}
let relSel=null,relTier='all';
// Filtre : 'all', un type (0–3) ou 'f' (forgées)
const relMatch=(id,f=relTier)=>{const R=RELICS[id];return f==='all'||(f==='f'?!!R.fz:String(R.t)===f&&!R.fz)};
const relToEquip=f=>Object.keys(RELICS).filter(id=>meta.relics[id]&&relMatch(id,f)).reduce((n,id)=>n+[true,false].reduce((m,rad)=>m+Math.max(0,(meta.relics[id][rad?1:0]|0)-relicQN(id,rad)),0),0);
const relInQ=f=>meta.relicQ.filter(q=>RELICS[q.id]&&relMatch(q.id,f)).length;
const FUSE_COST=[20,40,80,150];
// Reliques non forgées d'un type, celles hors de la file d'ouverture d'abord, les intactes avant les éclatantes.
function relAvail(t){const out=[];for(const id in RELICS){if(RELICS[id].t!==t||RELICS[id].fz)continue;const a=meta.relics[id];if(!a)continue;
  for(const rad of [false,true]){const own=Math.max(0,a[rad?1:0]|0),q=Math.min(own,relicQN(id,rad));for(let k=0;k<own;k++)out.push({id,rad,q:k>=own-q})}}
  return out.sort((x,y)=>(x.q-y.q)||(x.rad-y.rad))}
// Objets visés par la fusion : ceux du contenu de la relique, les plus proches d'être complets d'abord.
const fuseTargets=t=>relPool(t).sort((a,b)=>fragStatus(b)-fragStatus(a)||(bpdef(a).kind==='arme'?-1:1));
function fusionSection(){
  let h=`<section class="cx-section"><h3 class="cx-section__label">Reliques forgées</h3><p class="cx-hint" style="margin:0">Fusionne 3 reliques d'un même type en une relique forgée de ce type : elle donne à coup sûr un fragment de l'objet de ton choix. Celles hors de la file d'ouverture partent en premier.</p><div class="fuse">`;
  for(let t=0;t<4;t++){const AV=relAvail(t),av=AV.length,cost=FUSE_COST[t],L=fuseTargets(t);if(!fuseTgt[t]||!L.includes(fuseTgt[t]))fuseTgt[t]=L[0]||null;const ok=av>=3&&meta.essence>=cost&&fuseTgt[t];
    if(!av)continue;
    h+=`<div class="frow"><span class="rgem" style="--tc:${RTIER[t].c}">${RELIC_SVG}</span><div class="fl"><b>3 × <span style="color:${RTIER[t].c}">${RTIER[t].n}</span> → relique forgée</b><span>${av} possédée${av>1?'s':''}${av<3?` · il en faut ${3-av} de plus`:''}${av>=3&&meta.essence<cost?` · il manque ${cost-meta.essence} essence`:''}</span></div>
      <button class="btn buy" data-cact="rfuse" data-arg="${t}" ${ok?'':'disabled'}>Fusionner · <span class="essi"></span>${cost}</button></div>`;
    if(av>=3)h+=`<div class="ftgt"><span class="cx-hint" style="margin:0">Objet visé :</span><div class="cx-chips">${L.map(id=>{const b=bpdef(id);return `<button class="cx-chip cx-chip--sm" data-cact="rftgt" data-arg="${t}|${id}" aria-pressed="${fuseTgt[t]===id}">${esc(b.n)} <span class="n">${fragStatus(id)} / 3</span></button>`}).join('')}</div></div>`}
  return h+'</div></section>'}
// File d'ouverture regroupée par type (relique + état), dans l'ordre de la première de chaque groupe.
function relGroups(){const G2=[],ix={};for(const q of meta.relicQ){const k=q.id+'|'+(q.rad?1:0);if(ix[k]==null){ix[k]=G2.length;G2.push({id:q.id,rad:!!q.rad,n:0})}G2[ix[k]].n++}return G2}
const RELIC_SVG='<svg viewBox="0 0 24 24"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12"/></svg>';
function campRelics(){
  relicQFix();const all=Object.keys(RELICS),own=all.filter(id=>{const a=meta.relics[id];return a&&(a[0]||a[1])}),Q=meta.relicQ;
  let h=`${campMsg}`;
  const srcRows=`<div class="cx-rows">${RTIER.map((T,t)=>`<div class="cx-row"><span class="cx-row__k"><b style="color:${T.c}">Relique ${T.n}</b><small>${REL_SRC[t]} · fragments ${RAR[T.r].n.toLowerCase()}s</small></span><span class="cx-hint" style="margin:0">${(meta.relics[Object.keys(RELICS)[t]]||[0,0]).reduce((a,b)=>a+b,0)}</span></div>`).join('')}</div>`;
  if(!own.length)return h+'<p class="empty">Aucune relique pour l\'instant. Les monstres en lâchent parfois, et chaque manche réussie en rapporte une. Le type dépend de la difficulté :</p>'+srcRows;
  const tot=own.reduce((n,id)=>n+meta.relics[id][0]+meta.relics[id][1],0);
  const qh=`<section class="cx-section"><h3 class="cx-section__label">Ordre d'ouverture · ${Q.length} / ${tot}</h3>
    ${Q.length?`<div class="rq"><ol>${relGroups().map((g,i,A)=>{const R=RELICS[g.id],c=RTIER[R.t].c,own=(meta.relics[g.id]||[0,0])[g.rad?1:0]|0,k=g.id+'|'+(g.rad?1:0);
      return `<li><span class="rqn">${i+1}.</span><span class="rgem${g.rad?' rad':''}" style="--tc:${c}">${RELIC_SVG}</span><b style="color:${c}">${esc(R.fz?'Forgée · '+bpdef(R.tgt).n:R.n)}${g.rad?' · éclatante':''} <span style="color:var(--ink)">×${g.n}</span></b>
      <button class="btn" data-cact="rgmv" data-arg="${k}|-1" ${i?'':'disabled'} aria-label="Monter">↑</button><button class="btn" data-cact="rgmv" data-arg="${k}|1" ${i<A.length-1?'':'disabled'} aria-label="Descendre">↓</button><button class="btn" data-cact="rqdel" data-arg="${k}" aria-label="Retirer une">−</button><button class="btn" data-cact="rqadd" data-arg="${k}" ${g.n<own?'':'disabled'} aria-label="Équiper une de plus">+</button></li>`}).join('')}</ol></div>`
      :'<p class="cx-hint" style="margin:0">Aucune relique équipée : la prochaine mission n\'en ouvrira aucune.</p>'}
    <div class="actions" style="margin:0"><button class="btn" data-cact="rqall" ${Q.length>=tot?'disabled':''}>Tout équiper</button><button class="btn danger" data-cact="rqnone" ${Q.length?'':'disabled'}>Tout retirer</button></div></section>`;
  const tiers=[...new Set(own.filter(id=>!RELICS[id].fz).map(id=>RELICS[id].t))].sort();
  const tchip=(k,lab,c)=>`<button class="cx-chip cx-chip--sm" data-cact="rtier" data-arg="${k}" aria-pressed="${relTier===String(k)}"${c&&relTier!==String(k)?` style="color:${c}"`:''}>${lab}</button>`;
  const list=own.filter(id=>relMatch(id)).sort((x,y)=>RELICS[x].t-RELICS[y].t||(!!RELICS[x].fz-!!RELICS[y].fz));
  if(relSel&&!own.includes(relSel))relSel=null;
  h+=`<section class="cx-section"><h3 class="cx-section__label">Tes reliques · ${tot}</h3><div class="cx-chips">${tchip('all','Toutes')}${tiers.map(t=>tchip(t,RTIER[t].n,RTIER[t].c)).join('')}${own.some(id=>RELICS[id].fz)?tchip('f','Forgées','var(--ink)'):''}</div>
    ${(()=>{const ne=relToEquip(relTier),nq=relInQ(relTier),sh=relTier==='f'?'Forgées':relTier==='all'?'':RTIER[+relTier].n;return relTier!=='all'&&nq?`<div class="actions" style="margin:0"><button class="btn danger" data-cact="rqtypeoff">Retirer · ${sh} (${nq})</button></div>`:(ne?'':`<p class="cx-hint" style="margin:0">${relTier==='all'?'Toutes tes reliques':sh} : déjà équipées.</p>`)})()}
    <div class="rtiles">${list.map(id=>{const R=RELICS[id],a=meta.relics[id],c=RTIER[R.t].c,nq=relicQN(id,false)+relicQN(id,true),comp=R.fz?fragStatus(R.tgt)===2:relPool(R.t).some(x=>fragStatus(x)===2);
      return `<button class="rtile${relSel===id?' sel':''}" data-cact="rsel" data-arg="${id}" style="--tc:${c}" aria-pressed="${relSel===id}" aria-label="${esc(relicName(id))}, ${a[0]} intacte${a[0]>1?'s':''}, ${a[1]} éclatante${a[1]>1?'s':''}${nq?`, ${nq} équipée${nq>1?'s':''}`:''}">
        <span class="rgem${a[1]?' rad':''}">${RELIC_SVG}</span><b>${esc(R.fz?bpdef(R.tgt).n:R.n)}</b><span class="rt">${R.fz?'Forgée · ':''}${RTIER[R.t].n}</span>
        <span class="rc">${a[0]?`×${a[0]}`:''}${a[1]?`<i>✦×${a[1]}</i>`:''}</span>${nq?`<span class="req">${nq} équipée${nq>1?'s':''}</span>`:''}${comp?'<span class="rcomp" title="Peut compléter un objet">★</span>':''}</button>`}).join('')}</div></section>`;
  if(relSel){const id=relSel,R=RELICS[id],a=meta.relics[id],c=RTIER[R.t].c,pool=R.fz?[R.tgt]:relPool(R.t);
    const ctl=(rad,lab)=>{const n=relicQN(id,rad),ow=a[rad?1:0];return `<div class="rctl"><span>${lab} · <b>${n} / ${ow}</b> équipée${n>1?'s':''}</span><span class="cx-stepper"><button type="button" data-cact="rqdel" data-arg="${id}|${rad?1:0}" ${n?'':'disabled'} aria-label="Retirer une ${lab.toLowerCase()}">−</button><button type="button" data-cact="rqadd" data-arg="${id}|${rad?1:0}" ${n<ow?'':'disabled'} aria-label="Équiper une ${lab.toLowerCase()}">+</button></span></div>`};
    h+=`<section class="cx-card rdet" style="--tc:${c}"><div class="cx-card__head"><span class="rgem big${a[1]?' rad':''}">${RELIC_SVG}</span><div><h4 class="cx-card__title" style="color:${c}">${esc(R.n)}</h4><div class="cx-card__meta">${R.fz?'Relique forgée':'Relique'} ${RTIER[R.t].n} · ${REL_SRC[R.t]} · intacte ×${a[0]} · éclatante ×${a[1]}</div></div></div>
      <p class="cx-hint" style="margin:0">${R.fz?'S\'ouvre en mission et donne à coup sûr un fragment de cet objet (deux si éclatante).':`S'ouvre en mission et donne un fragment d'un de ces ${pool.length} objets ${RAR[RTIER[R.t].r].n.toLowerCase()}s (deux si éclatante). Les fragments manquants d'un objet presque complet sortent un peu plus souvent.`}</p>
      <ul class="rrw">${pool.map(bid=>{const b=bpdef(bid),n=fragStatus(bid),own=b.kind==='arme'&&ownedW(bid);
        const st=n>=3?'<span class="rs ok">✓ prêt à fabriquer</span>':n===2?'<span class="rs comp">★ un fragment de plus</span>':`<span class="rs miss">${n} / 3</span>`;
        return `<li><div class="rrh"><span class="dot" style="background:${RAR[b.r].c}"></span><span class="rl">${esc(b.n)} · ${b.kind==='arme'?'arme':SLOT[b.slot].toLowerCase()}${own?' · possédée':''}</span>${st}</div></li>`}).join('')}</ul>
      <div class="cx-card__foot">${a[0]?ctl(false,'Intactes'):''}${a[1]?ctl(true,'Éclatantes'):''}
        ${a[0]?`<button class="btn buy" data-cact="refine" data-arg="${id}" ${meta.essence<50||relicQN(id,false)>=a[0]?'disabled':''}>Raffiner en éclatante · <span class="essi"></span>50</button>`:''}</div></section>`}
  else h+='<p class="cx-hint" style="margin:0">Touche une relique pour voir les objets qu\'elle contient et tes fragments. ★ : un fragment de plus complète un objet.</p>';
  return h+fusionSection()+qh+cxMore('relsrc','Où tombent les reliques',srcRows,'Afficher');
}
let saveMode=null,saveDraft='',saveMsg='',savePending=null;
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
// Fichier de sauvegarde prêt à réimporter (bouton « Depuis un fichier » de l'import).
const saveName=()=>`crypte-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;
function saveBlob(){return new Blob([exportCode()],{type:'application/json'})}
function downloadSave(){try{const url=URL.createObjectURL(saveBlob()),a=document.createElement('a');a.href=url;a.download=saveName();a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);saveMsgOk=`Fichier « ${saveName()} » enregistré dans tes téléchargements.`;return true}catch{saveMsgOk='';saveMsg='Le téléchargement a échoué : utilise Partager ou Copier le JSON.';return false}}
const canShareFile=()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['{}'],'t.json',{type:'application/json'})]}))}catch{return false}};
async function shareSave(){try{await navigator.share({files:[new File([saveBlob()],saveName(),{type:'application/json'})],title:'Sauvegarde Crypte des Cendres'});saveMsgOk='Fichier partagé.'}catch(e){if(e&&e.name!=='AbortError'){saveMsg='Le partage a échoué : utilise Télécharger ou Copier le JSON.'}}drawCamp()}
let saveMsgOk='';
function exportCode(){const data={v:1,meta,cls:heroCls,best,at:new Date().toISOString().slice(0,10)};return JSON.stringify({jeu:'Crypte des Cendres',...data},null,2)}
function parseCode(t){t=(t||'').trim();if(t.startsWith('CRYPTE1:'))t=t.slice(8);let d=null;
  try{d=JSON.parse(decodeURIComponent(escape(atob(t.replace(/\s+/g,'')))))}catch{try{d=JSON.parse(t)}catch{return null}}
  if(!d||typeof d!=='object'||!d.meta||typeof d.meta.gold!=='number')return null;return d}
const sumOf=m=>`${m.gold} or, ${m.essence||0} essence, ${Object.keys(m.mods||{}).length} mods, ${Object.values(m.relics||{}).reduce((a,r)=>a+(r[0]||0)+(r[1]||0),0)} reliques`;
function saveSection(){
  let h=`<h3 class="cx-section__label">Sauvegarde</h3><p class="empty" style="font-size:13px;margin:0"><b>Exporter</b> enregistre un fichier .json de ta progression, prêt à réimporter. Pour la restaurer, ici ou sur un autre appareil : <b>Importer</b>, puis <b>Depuis un fichier</b> (ou colle le JSON).</p>
    <div class="actions"><button class="btn${saveMode==='exp'?' main':''}" data-cact="exp">Exporter</button><button class="btn${saveMode==='imp'?' main':''}" data-cact="impopen">Importer</button></div>`;
  if(saveMode==='exp')h+=`${saveMsgOk?`<p class="empty" style="font-size:13px;color:var(--heal)">${esc(saveMsgOk)}</p>`:''}<div class="actions"><button class="btn main" data-cact="savedl">Télécharger le fichier</button>${canShareFile()?'<button class="btn" data-cact="saveshare">Partager le fichier</button>':''}<button class="btn" data-cact="copy">Copier le JSON</button></div>
    <details class="savemore"><summary>Voir le JSON</summary><textarea id="saveOut" class="savebox" readonly rows="8">${esc(exportCode())}</textarea></details>`;
  if(saveMode==='imp'){
    if(savePending)h+=`<div class="card"><p style="margin:0;font-size:14px">Remplacer ta progression actuelle (${sumOf(meta)}) par celle du JSON (${sumOf(savePending.meta)}${savePending.at?`, exportée le ${esc(savePending.at)}`:''}) ?</p><div class="actions"><button class="btn main" data-cact="impok">Remplacer et recharger</button><button class="btn" data-cact="impcancel">Annuler</button></div></div>`;
    else h+=`<textarea id="saveIn" class="savebox" rows="5" placeholder="Colle ici le JSON de ta sauvegarde">${esc(saveDraft)}</textarea>
      <div class="actions"><button class="btn main" data-cact="imp">Restaurer</button><label class="btn" style="text-align:center;cursor:pointer">Depuis un fichier<input type="file" id="saveFile" accept=".txt,.json,text/plain,application/json" hidden></label></div>`;
  }
  if(saveMsg)h+=`<p class="empty" style="font-size:13px;color:var(--blood)">${saveMsg}</p>`;
  return h;
}
let forgeSub='up';
function campForge(){return campForge0()}
let xf={src:'',k:'',dst:'',rep:''};
const wclsOf=id=>Object.keys(WPN).find(c=>WPN[c].some(w=>w.id===id));
function xfGet(key){if(!key)return null;const t=key[0],v=key.slice(2);
  if(t==='s')return meta.stash.find(i=>String(i.id)===v)||null;if(t==='g')return meta.gear[v]||null;
  if(t==='w'){const c=wclsOf(v);return c&&ownedW(v)?weaponItem(c,v):null}return null}
const xfCap=it=>Math.max(RAR[it.r].aff,Object.keys(it.aff).length);
const xfCost=it=>50*(it.r+1);
const FZ_MAX=3,FZ_K=.5,fzCost=(it,n)=>100*(it.r+1)*(n+1);
function fzGet(key,k){if(!key)return 0;if(key[0]==='w'){const o=meta.wfz&&meta.wfz[key.slice(2)];return (o&&o[k])||0}const it=xfGet(key);return (it&&it.fz&&it.fz[k])||0}
function xfState(){const s=xfGet(xf.src),d=xfGet(xf.dst);if(!s||!d||!xf.k||s.aff[xf.k]==null)return null;
  if(AFF[xf.k].aby)return {ok:false,msg:'Les pouvoirs abyssaux sont liés à leur objet : impossible de les transférer ou de les fusionner.'};
  if(xf.rep&&AFF[xf.rep]&&AFF[xf.rep].aby)return {ok:false,full:true,msg:'Le pouvoir abyssal ne peut pas être remplacé : choisis une autre affixe.'};
  const k=xf.k,ns=!!NOSCALE[k],ve=ns?s.aff[k]:s.aff[k]*upMul(s.up),v=ns?ve:Math.round(ve/upMul(d.up)*10)/10,cur=d.aff[k],ce=cur==null?null:ns?cur:cur*upMul(d.up),cap=xfCap(d),n=Object.keys(d.aff).length,T=x=>xfV(d,k,x),r=o=>Object.assign(o,{nv:v});
  if(cur!=null){const n0=fzGet(xf.dst,k),fuseOk=n0<FZ_MAX,canUp=ve>ce+1e-9,hi=Math.max(ce,ve),lo=Math.min(ce,ve),fe=ns?hi+(lo>=1?1:0):hi+lo*FZ_K,fv=ns?fe:Math.round(fe/upMul(d.up)*10)/10;
    if(!fuseOk&&!canUp)return r({ok:false,msg:`${esc(itemName(d))} a déjà ${T(cur)} (fusionnée ${FZ_MAX} fois, le maximum), une valeur égale ou plus forte.`});
    const op=xf.op==='up'&&canUp?'up':fuseOk?'fuse':'up';
    if(op==='fuse')return {ok:true,mode:'fuse',nv:fv,n:n0,fuseOk,canUp,cost:fzCost(s,n0),msg:`Fusionne ${T(v)} dans ${T(cur)} : ${T(fv)} sur ${esc(itemName(d))} (fusion ${n0+1} / ${FZ_MAX}).`};
    return r({ok:true,mode:'up',fuseOk,canUp,msg:`Remplace ${T(cur)} par ${T(v)} sur ${esc(itemName(d))}.`})}
  if(n<cap)return r({ok:true,mode:'add',msg:`Ajoute ${T(v)} sur ${esc(itemName(d))} (${n+1} / ${cap} affixes).`});
  if(xf.rep&&d.aff[xf.rep]!=null)return r({ok:true,mode:'rep',msg:`Remplace ${xfV(d,xf.rep,d.aff[xf.rep])} par ${T(v)} sur ${esc(itemName(d))}.`});
  return r({ok:false,full:true,msg:`${esc(itemName(d))} a déjà ${cap} affixe${cap>1?'s':''} : choisis celle à remplacer.`})}
const xfV=(it,k,v)=>AFF[k].t(NOSCALE[k]?v:fmtN(v*upMul(it.up)));
let afCat='all',afOpen='';
const AFF_CAT={frz:'off',cold:'off',shard:'off',dmgPct:'off',apsPct:'off',crit:'off',critDmg:'off',novaPct:'off',skillRad:'off',burn:'off',multi:'off',pierce:'off',reach:'off',splash:'off',hp:'def',armor:'def',regen:'def',leech:'def',speed:'uti',cdr:'uti',burnPct:'off',chill:'off',shock:'off',execute:'off',bossDmg:'off',lowDmg:'off',ultPct:'off',fury:'off',lowArmor:'def',potHeal:'def',antidote:'def',auraSlow:'def',skillDur:'uti',dashCd:'uti',magnetPct:'uti',goldPct:'uti',xpPct:'uti',lootPct:'uti'};
const AFF_NAME={frz:'Gel',cold:'Dégâts contre ralentis',shard:'Éclats de glace',dmgPct:'Dégâts',apsPct:'Vitesse d\'attaque',crit:'Chances de critique',critDmg:'Dégâts critiques',hp:'Points de vie',armor:'Réduction des dégâts',speed:'Vitesse de déplacement',regen:'Régénération',cdr:'Temps de recharge',skillRad:'Portée des compétences',novaPct:'Dégâts de compétence',burn:'Embrasement',multi:'Projectiles par tir',leech:'Vol de vie',reach:'Portée de frappe',splash:'Rayon d\'explosion',pierce:'Transpercement',burnPct:'Embrasement (%)',chill:'Ralentissement',shock:'Éclair en chaîne',execute:'Exécution',bossDmg:'Dégâts contre Gardiens',lowDmg:'Dégâts sous 50 % de vie',ultPct:'Dégâts de l\'ultime',fury:'Charge de l\'ultime',lowArmor:'Protection sous 30 % de vie',potHeal:'Soin des potions',antidote:'Antidote',auraSlow:'Aura de lenteur',skillDur:'Durée des compétences',dashCd:'Recharge de l\'esquive',magnetPct:'Portée de ramassage',goldPct:'Or',xpPct:'Expérience',lootPct:'Chances de butin'};
const AFF_CATN={off:'Offensives',def:'Défensives',uti:'Utilitaires'};
const affShort=(k,v)=>{const pct=!['hp','regen','burn','multi','pierce'].includes(k),neg=['armor','cdr','lowArmor','dashCd','antidote','fury'].includes(k);return `${neg?'−':'+'}${fmtN(v)}${pct?' %':k==='regen'?' PV/s':k==='burn'?' /s':''}`};
const affEff=(it,k)=>NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up);
// Liste de souhaits (affixes recherchées, légendaires) : créée au premier besoin.
const wishOf=()=>{const W=meta.wish||(meta.wish={leg:true,aff:{}});W.aff=W.aff||{};return W};
function wishSection(){const W=wishOf();
  const keys=Object.keys(AFF).filter(k=>!AFF[k].w),n=keys.filter(k=>W.aff[k]).length;
  const chip=k=>`<button class="cx-chip cx-chip--sm" data-cact="wish" data-arg="${k}" aria-pressed="${!!W.aff[k]}">${AFF_NAME[k]||k}</button>`;
  const grp=c=>{const ks=keys.filter(k=>(AFF_CAT[k]||'uti')===c);return ks.length?`<span class="cx-hint" style="margin:0">${AFF_CATN[c]}</span><div class="cx-chips">${ks.map(chip).join('')}</div>`:''};
  return `<section class="cx-section"><h3 class="cx-section__label">Alertes de butin</h3>
    <p class="cx-hint" style="margin:0">En mission, l'écran s'illumine et l'objet porte un grand faisceau doré quand un objet tombe avec une de ces affixes à une valeur plus haute que celle de ton équipement porté (ou que tu ne portes pas encore)${W.leg?', ou quand une arme que tu n\'as pas encore tombe':''}.</p>
    <div class="cx-chips"><button class="cx-chip cx-chip--sm" data-cact="wishleg" aria-pressed="${!!W.leg}" style="${W.leg?'':'color:var(--rar-legend)'}">Armes nouvelles</button>${n?`<button class="cx-btn cx-btn--ghost cx-btn--sm" data-cact="wishnone" style="margin:0">Tout retirer (${n})</button>`:''}</div>
    ${grp('off')}${grp('def')}${grp('uti')}</section>`}
// Chercher par affixe : chaque objet qui porte l'affixe se choisit comme source (détruite, son affixe est prise) ou comme cible (elle reçoit).
function affFinder(){
  const eqW=curWid(),ws=Object.keys(WPN).flatMap(c=>WPN[c].filter(w=>ownedW(w.id)).map(w=>['w:'+w.id,weaponItem(c,w.id),w.id===eqW&&c===heroCls?'arme portée':'arme']));
  const all=[...Object.entries(meta.gear).filter(([k,i])=>i).map(([k,i])=>['g:'+k,i,'équipé']),...meta.stash.map(i=>['s:'+i.id,i,'coffre']),...ws];
  const by={};for(const [key,it,w] of all)for(const k in it.aff){if(!AFF[k]||AFF[k].aby)continue;(by[k]||(by[k]=[])).push({key,it,w,v:affEff(it,k)})}
  for(const k in by)by[k].sort((a,b)=>b.v-a.v);
  const cnt={all:Object.keys(by).length};for(const k in by){const c=AFF_CAT[k]||'uti';cnt[c]=(cnt[c]||0)+1}
  const keys=Object.keys(by).filter(k=>afCat==='all'||(AFF_CAT[k]||'uti')===afCat).sort((a,b)=>(AFF_CAT[a]||'z').localeCompare(AFF_CAT[b]||'z')||(AFF_NAME[a]||a).localeCompare(AFF_NAME[b]||b));
  const d=xfGet(xf.dst);
  const chip=(k,lab)=>`<button class="cx-chip cx-chip--sm" data-cact="afcat" data-arg="${k}" aria-pressed="${afCat===k}">${lab} <span class="n">${cnt[k]||0}</span></button>`;
  let h=`<section class="cx-section"><h3 class="cx-section__label">Chercher par affixe</h3><p class="cx-hint" style="margin:0">Ouvre une affixe, puis choisis pour chaque objet : <b>Source</b> (détruite, on prend cette affixe) ou <b>Cible</b> (elle reçoit l'affixe).</p><div class="cx-chips">${chip('all','Toutes')}${chip('off','Offensives')}${chip('def','Défensives')}${chip('uti','Utilitaires')}</div>`;
  if(!keys.length)return h+`<p class="cx-hint" style="margin:0">${all.length?'Aucune affixe de ce type sur tes objets.':'Aucun objet.'}</p></section>`;
  h+='<ul class="afind">'+keys.map(k=>{const L=by[k],b=L[0],open=afOpen===k,mine=d&&d.aff[k]!=null?affEff(d,k):null;
    const row=`<button class="afrow" data-cact="afopen" data-arg="${k}" aria-expanded="${open}"><span class="afn">${AFF_NAME[k]||k}${affOff(k)?` <span class="affoff__tag">${affOnly(k)}</span>`:''}</span><span class="afv">${affShort(k,b.v)}</span><span class="afs">max · <b style="color:${RARV[b.it.r]}">${esc(itemName(b.it))}</b> · ${b.w}${L.length>1?` · ${L.length} objets`:''}${mine!=null?` · ta cible : ${affShort(k,mine)}`:''}</span><span class="afc" aria-hidden="true">${open?'▴':'▾'}</span></button>`;
    if(!open)return `<li>${row}</li>`;
    return `<li class="open">${row}<ul>${L.map((o,i)=>{const isS=xf.src===o.key&&xf.k===k,isD=xf.dst===o.key,canS=xfSrcOk(o.key)&&!isD;
      return `<li><span><b style="color:${RARV[o.it.r]}">${esc(itemName(o.it))}</b>${o.it.lock?` <span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:''} · ${o.w}<br><span class="afv2">${affShort(k,o.v)}</span>${i===0?' <span class="cx-tag cx-tag--heal">max</span>':''}</span>
        <span style="display:flex;gap:6px;flex-shrink:0">${isS?'<span class="cx-pin cx-pin--src" style="position:static">Source</span>':!canS&&!isD?'':`<button class="cx-btn cx-btn--sm" data-cact="afuse" data-arg="${k}|${o.key}" ${!canS?'disabled':''} title="${canS?'':'Arme de départ : elle ne peut pas être détruite'}">Source</button>`}${isD?'<span class="cx-pin cx-pin--dst" style="position:static">Cible</span>':`<button class="cx-btn cx-btn--sm" data-cact="afdst" data-arg="${o.key}" ${xf.src===o.key?'disabled':''}>Cible</button>`}</span></li>`}).join('')}</ul></li>`}).join('')+'</ul></section>';
  return h;
}
const RARV=['var(--rar-common)','var(--rar-magic)','var(--rar-rare)','var(--rar-legend)','var(--rar-anc)','var(--rar-sang)','var(--rar-aby)'];
// Tout objet peut être source, sauf les objets verrouillés et les armes de départ (elles ne se détruisent pas).
const xfSrcOk=key=>{if(!key||(key[0]==='w'&&(wdef(key.slice(2))||{}).start))return false;const it=xfGet(key);return !!it&&!it.lock};
function xfOk(key,it){if(!it)return false;if(xf.pick==='src')return xfSrcOk(key)&&Object.keys(it.aff).length>0;return key!==xf.src}
const xfPin=key=>key===xf.src?'<span class="cx-pin cx-pin--src">Source</span>':key===xf.dst?'<span class="cx-pin cx-pin--dst">Cible</span>':'';
const xfSt=key=>key===xf.src?' is-src':key===xf.dst?' is-dst':'';
function xfSlot(key,it,label,oth){if(!it)return `<div class="cx-slot cx-slot--empty"><span class="cx-slot__k">${label}</span><span class="cx-slot__v">Vide</span></div>`;
  const ok=xfOk(key,it);
  return `<button class="cx-slot${oth?'':' is-equipped'}${xfSt(key)}" data-cact="xfsel" data-arg="${key}" ${ok?'':'aria-disabled="true"'} aria-label="${esc(itemName(it))}, ${label}${oth?'':', équipé'}${key===xf.src?', source':key===xf.dst?', cible':''}"><span class="cx-slot__k">${label}${oth?'':' · équipé'}</span><span class="cx-slot__v" style="color:${RARV[it.r]}">${esc(itemName(it))}${it.lock?`<span class="li" aria-hidden="true">${LOCK_SVG}</span>`:''}</span>${xfPin(key)}</button>`}
function xfCell(key,it){const ok=xfOk(key,it);
  return `<button class="cx-cell${xfSt(key)}" data-cact="xfsel" data-arg="${key}" ${ok?'':'aria-disabled="true"'} style="--rar:${RARV[it.r]}" aria-label="${esc(itemName(it))}${it.lock?', verrouillé':''}${key===xf.src?', source':key===xf.dst?', cible':''}">${cellIn(it)}${xfPin(key)}</button>`}
function xfDiffCard(kind,it,where,lines,gone){const src=kind==='src';
  return `<div class="cx-diff__card cx-diff__card--${kind}${gone&&src?' is-gone':''}"><span class="cx-diff__lab">${src?'− Source · détruite':gone?'+ Cible · aperçu':'+ Cible'}</span>${it?`<span class="cx-diff__nm" style="color:${RARV[it.r]}">${esc(itemName(it))}</span><span class="cx-diff__sub">${RAR[it.r].n} · ${where}</span>
    <ul><li class="cx-line cx-line--base">${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${lines}</ul>`:`<span class="cx-diff__sub">${src?'Choisis l\'objet source.':'Choisis la cible.'}</span>`}</div>`}
function campAffix(){
  if(!xf.pick)xf.pick=xf.src?'dst':'src';
  let s=xfGet(xf.src);if(xf.src&&(!s||!xfSrcOk(xf.src))){xf={src:'',k:'',dst:'',rep:'',pick:'src'};s=null}
  if(s&&xf.k&&s.aff[xf.k]==null)xf.k='';
  const d=xfGet(xf.dst),wlab=k=>k[0]==='w'?'arme':k[0]==='g'?'équipé':'coffre';
  let h=backChip()+xfSteps();
  h+=`<div class="cx-roles"><button class="cx-role cx-role--src" data-cact="xfpick" data-arg="src" aria-pressed="${xf.pick==='src'}"><span class="cx-role__k"><i>−</i>Source · détruite</span><span class="cx-role__v${s?'':' is-empty'}" ${s?`style="color:${RARV[s.r]}"`:''}>${s?esc(itemName(s)):'Choisir un objet'}</span></button>
    <button class="cx-role cx-role--dst" data-cact="xfpick" data-arg="dst" aria-pressed="${xf.pick==='dst'}"><span class="cx-role__k"><i>+</i>Cible</span><span class="cx-role__v${d?'':' is-empty'}" ${d?`style="color:${RARV[d.r]}"`:''}>${d?esc(itemName(d)):'Choisir un objet'}</span></button></div>`;
  const st=xfState();
  if(s||d){
    const sLines=s?Object.keys(s.aff).map(k=>`<li><button class="cx-line" data-cact="xfk" data-arg="${k}" aria-pressed="${xf.k===k}">${xfV(s,k,s.aff[k])}</button></li>`).join(''):'';
    let tLines='';
    if(d){const v=s&&xf.k?s.aff[xf.k]:null,full=st&&(st.full||st.mode==='rep'),nv=st?st.nv:null;
      tLines=Object.keys(d.aff).map(k=>{
        if(v!=null&&st){
          if(k===xf.k&&st.mode==='up')return `<li class="cx-line cx-line--del">${xfV(d,k,d.aff[k])}</li><li class="cx-line cx-line--add">${xfV(d,k,nv)}</li>`;
          if(k===xf.k&&st.mode==='fuse')return `<li class="cx-line cx-line--del">${xfV(d,k,d.aff[k])}</li><li class="cx-line cx-line--add">${xfV(d,k,nv)} <span style="font-weight:500;opacity:.8">· fusion ${st.n+1} / ${FZ_MAX}</span></li>`;
          if(k===xf.k&&!st.ok)return `<li class="cx-line cx-line--no">${xfV(d,k,d.aff[k])} · déjà plus fort</li>`;
          if(full){const sel=xf.rep===k;return sel?`<li><button class="cx-line cx-line--del" data-cact="xfrep" data-arg="${k}" aria-pressed="true">${xfV(d,k,d.aff[k])}</button></li><li class="cx-line cx-line--add">${xfV(d,xf.k,nv)}</li>`:`<li><button class="cx-line" data-cact="xfrep" data-arg="${k}" aria-pressed="false">${xfV(d,k,d.aff[k])}</button></li>`}
        }
        return `<li class="cx-line">${xfV(d,k,d.aff[k])}</li>`}).join('');
      if(v!=null&&st&&st.mode==='add')tLines+=`<li class="cx-line cx-line--add">${xfV(d,xf.k,nv)}</li>`;
      if(!Object.keys(d.aff).length&&!(st&&st.mode==='add'))tLines+='<li class="cx-line cx-line--base">Aucune affixe</li>';}
    h+=`<div class="cx-diff">${xfDiffCard('src',s,s?wlab(xf.src):'',sLines,st&&st.ok)}${xfDiffCard('dst',d,d?wlab(xf.dst):'',tLines,st&&st.ok?true:null)}</div>`;
  }
  h+=affFinder();
  const eqW=meta.wpn[heroCls]&&ownedW(meta.wpn[heroCls])?meta.wpn[heroCls]:WPN[heroCls][0].id;
  h+=`<section class="cx-section"><h3 class="cx-section__label">Équipé · ${CLS[heroCls].n}</h3><div class="cx-slots">${xfSlot('w:'+eqW,weaponItem(heroCls,eqW),'Arme')}${GEAR_KEYS().map(k=>xfSlot('g:'+k,meta.gear[k],SLOT[k])).join('')}</div></section>`;
  const ow=Object.keys(WPN).flatMap(c=>WPN[c].filter(w=>ownedW(w.id)&&w.id!==eqW).map(w=>[c,w]));
  if(ow.length)h+=`<section class="cx-section"><h3 class="cx-section__label">Autres armes</h3><div class="cx-slots">${ow.map(([c,w])=>xfSlot('w:'+w.id,weaponItem(c,w.id),`Arme · ${CLS[c].n}`,true)).join('')}</div></section>`;
  {const list=invList('affix');h+=`<section class="cx-section"><h3 class="cx-section__label">Coffre · ${meta.stash.length} objet${meta.stash.length>1?'s':''}</h3>${meta.stash.length?invToolbar(list,'affix'):''}<div id="invGrid">${invGrid(list,'affix')}</div></section>`}
  h+=cxMore('wish','Alertes de butin : un flash quand une affixe recherchée tombe.',wishSection(),'Régler');
  return h;
}
function affixFoot(){const st=xfState(),s=xfGet(xf.src);
  if(!st){const hn=campBack?xfStepHint():'';return hn?`<p class="cx-hint">${hn}</p>`:xf.src&&xf.dst&&!xf.k?'<p class="cx-hint">Touche l\'affixe à prendre sur la source.</p>':''}
  if(!st.ok)return `<p class="cx-hint">${st.full?'Touche l\'affixe à remplacer sur la cible.':st.msg}</p>`;
  const cost=st.cost||xfCost(s),poor=meta.essence<cost,both=st.fuseOk&&st.canUp;
  return `${both?`<div class="cx-chips" role="radiogroup" aria-label="Mode" style="justify-content:center"><button class="cx-chip cx-chip--sm" role="radio" data-cact="xfop" data-arg="fuse" aria-checked="${st.mode==='fuse'}">Fusionner (additionner)</button><button class="cx-chip cx-chip--sm" role="radio" data-cact="xfop" data-arg="up" aria-checked="${st.mode==='up'}">Remplacer</button></div>`:''}<div class="row"><button class="cx-btn cx-btn--ghost" data-cact="xfcancel">Annuler</button><button class="cx-btn cx-btn--primary cx-btn--cost" data-cact="xfok" ${poor?'disabled':''}>${st.mode==='fuse'?'Fusionner':'Transférer'} <span class="cx-price"><i class="cx-ess"></i>${cost}</span></button></div>
    <p class="cx-hint">${poor?`Il te manque ${cost-meta.essence} essence.`:`${esc(itemName(s))} sera détruit.`}</p>`;
}
// Détruit une arme utilisée comme source : un double prend sa place s'il y en a ; sinon elle disparaît, et le héros reprend son arme de départ s'il la portait.
function wDestroy(w){const sp=wSpares(w);
  if(sp.length){const hi=Math.max(...sp);sp.splice(sp.indexOf(hi),1);meta.wlv[w]=hi;if(!sp.length)delete meta.wcp[w];return}
  const c=wclsOf(w);delete meta.built[w];delete meta.wlv[w];if(meta.waff)delete meta.waff[w];if(meta.wfz)delete meta.wfz[w];if(meta.wlock)delete meta.wlock[w];
  if(c&&meta.wpn[c]===w)meta.wpn[c]=WPN[c][0].id}
function xfDo(){const s=xfGet(xf.src),st=xfState();if(!s||!xfSrcOk(xf.src)||!st||!st.ok)return;const cost=st.cost||xfCost(s);if(meta.essence<cost)return;
  const k=xf.k,v=st.nv;
  if(xf.dst[0]==='w'){const wid=xf.dst.slice(2),o=meta.waff[wid]||(meta.waff[wid]={});if(st.mode==='rep')o[xf.rep]=null;o[k]=v;
    if(st.mode==='fuse'){meta.wfz=meta.wfz||{};const f=meta.wfz[wid]||(meta.wfz[wid]={});f[k]=(f[k]||0)+1}}
  else{const d=xfGet(xf.dst);if(st.mode==='rep')delete d.aff[xf.rep];d.aff[k]=v;if(st.mode==='fuse'){d.fz=d.fz||{};d.fz[k]=(d.fz[k]||0)+1}else if(d.fz)delete d.fz[k]}
  if(xf.src[0]==='s'){const i=meta.stash.findIndex(x=>String(x.id)===xf.src.slice(2));if(i>=0)meta.stash.splice(i,1)}
  else if(xf.src[0]==='w')wDestroy(xf.src.slice(2));
  else meta.gear[xf.src.slice(2)]=null;
  meta.essence-=cost;const dn=itemName(xfGet(xf.dst)||{name:'la cible'});toast(`${st.mode==='fuse'?'Affixe fusionnée':'Affixe transférée'} : <b>${xfV(xfGet(xf.dst)||{},k,v)}</b> sur ${esc(dn)}. ${esc(itemName(s))} est détruit.`);
  xf={src:'',k:'',dst:'',rep:'',pick:'src'};campSel=null}
// Héros › Couleurs du héros : cape, bordure et capuche de chaque classe, avec un aperçu. Nuancier + couleur libre.
let lookCls=null;
const lookC=()=>CLS[lookCls]?lookCls:heroCls;
function lookHtml(){const c=lookC(),a=myLook(c),d=lookDef(c),same=a.every((x,i)=>x===d[i]),cn=CLS[c].n.toLowerCase();
  const chip=k=>`<button class="cx-chip cx-chip--sm" data-cact="lookcls" data-arg="${k}" aria-pressed="${k===c}">${CLS[k].n}</button>`;
  const row=(p,i)=>{const L=LOOK_SW[p.k],free=!L.includes(a[i]);
    return `<div class="lookrow"><span class="lookk">${p.n}</span><div class="looksw" role="radiogroup" aria-label="${p.n} du ${cn}">${L.map(col=>`<button class="lsw" role="radio" aria-checked="${col===a[i]}" data-cact="look" data-arg="${i}|${col}" style="--sw:${col}" aria-label="${p.n} ${col}${col===d[i]?', couleur d\'origine':''}"></button>`).join('')}<label class="lsw lsw--free${free?' is-on':''}" style="--sw:${a[i]}"><input type="color" value="${a[i]}" data-look="${i}" aria-label="${p.n} : autre couleur"></label></div></div>`};
  return `<section class="cx-section" id="lookSec"><h3 class="cx-section__label">Couleurs du héros</h3>
    <div class="lookhead"><canvas class="lookprev" id="lookPrev" width="240" height="240" role="img" aria-label="Aperçu du ${cn}"></canvas>
      <div class="lookside"><div class="cx-chips" aria-label="Classe">${Object.keys(CLS).map(chip).join('')}</div>
      <button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="lookreset" data-arg="${c}" ${same?'disabled':''}>Couleurs d'origine</button></div></div>
    <div class="lookrows">${LOOK_PARTS.map(row).join('')}</div>
    <p class="cx-hint" style="margin:0">Chaque classe garde ses couleurs. En coopération, les autres joueurs les voient.</p></section>`}
function lookSet(c,i,col){const a=myLook(c).slice();a[i]=col.toLowerCase();meta.look=meta.look||{};const d=lookDef(c);if(a.every((x,j)=>x===d[j]))delete meta.look[c];else meta.look[c]=a}
function lookPaint(){const el=document.getElementById('lookPrev');if(!el)return;const c=lookC(),g=el.getContext('2d'),W=el.width,k=W/66;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,el.height);g.setTransform(k,0,0,k,W/2-11*k,el.height/2);g.rotate(-.35);
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(2,6,19,15,0,0,7);g.fill();
  const old=ctx;ctx=g;try{pPlayer(c,false,lookPal(c,myLook(c)))}finally{ctx=old}}
function prestSection(){
  const c=heroCls,o=prOf(c),free=prFree(c),op=prOpen(),cost=prCost(o.lv),nmax=UPG.filter(u=>lv(u.k)>=u.max).length;
  let h=`<h3>Prestige · ${CLS[c].n}${o.lv?` · niveau ${o.lv}`:''}</h3>`;
  if(!op&&!o.lv)return h+`<p class="empty" style="font-size:13px">Le prestige se débloque quand toutes les améliorations permanentes sont au maximum (${nmax} / ${UPG.length}). Ensuite, chaque niveau de prestige donne 1 point à placer dans une statistique du ${CLS[c].n.toLowerCase()}, sans limite de niveau.</p>`;
  h+=`<p class="empty" style="font-size:13px">Chaque niveau de prestige donne 1 point à placer dans une statistique. Le prestige est propre à chaque héros et n'a pas de limite. Tu peux redistribuer tes points gratuitement.</p>
  <div class="up"><b>Niveau de prestige ${o.lv} → ${o.lv+1}</b><button class="btn buy" data-cact="prbuy" ${meta.gold<cost.gold||meta.essence<cost.ess?'disabled':''}><span class="coin"></span>${cost.gold} · <span class="essi"></span>${cost.ess}</button>
  <p style="grid-column:1/-1">${free?`<b style="color:var(--ember)">${free} point${free>1?'s':''} à placer</b>`:'Aucun point à placer'} · ${o.lv} au total</p></div><div class="ups">`;
  h+=PREST.map(q=>{const n=prPt(q.k,c),mx=q.max&&n>=q.max,v=n*q.per;
    return `<div class="up"><b>${q.n}${n?` · ${n}`:''}</b><button class="btn" data-cact="pradd" data-arg="${q.k}" ${!free||mx?'disabled':''} aria-label="Placer un point en ${q.n}">${mx?'Max':'+1'}</button>
      <p style="grid-column:1/-1">${q.neg?'−':'+'}${prFmt(q.per)} ${q.t} par point${n?` · actuel ${q.neg?'−':'+'}${prFmt(v)} %`:''}${q.max?` · max ${q.max} points`:''}</p></div>`}).join('');
  h+=`</div>${o.lv-free?'<div class="actions" style="margin:0"><button class="btn" data-cact="prreset">Redistribuer les points</button></div>':''}`;
  return h;
}
function campForge0(){
  const ups=UPG.map(u=>{const l=lv(u.k),mx=l>=u.max,c=upCost(u);
    return `<div class="up"><b>${u.n}</b><p>${mx?u.d(l):(l?u.d(l)+' → ':'')+u.d(l+1)}</p><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div>
      <button class="btn buy" data-cact="up" data-arg="${u.k}" ${mx||meta.gold<c?'disabled':''}>${mx?'Max':`<span class="coin"></span>${c}`}</button></div>`}).join('');
  const tals=TAL[heroCls].map(t=>{const own=hasTal(t.k);
    return `<div class="tal${own?' own':''}"><b>${t.n}</b><p>${t.d}</p>${own?'<span class="owned">Acquis</span>':`<button class="btn buy" data-cact="tal" data-arg="${t.k}" ${meta.gold<t.cost?'disabled':''}><span class="coin"></span>${t.cost}</button>`}</div>`}).join('');
  
  return `<h3>Améliorations permanentes</h3><div class="ups">${ups}</div><h3>Talents · ${CLS[heroCls].n}</h3><div class="tals">${tals}</div>`;
}
function tabBadges(){
  const craft=isUnl('craft')?craftIds().filter(id=>{const b=bpdef(id),pc=meta.parts[id]||[0,0,0];return pc.every(n=>n>0)&&meta.gold>=b.craft}).length:0,fz=isUnl('fuse')?fuseGroups().n:0;
  const relTot=Object.values(meta.relics).reduce((n,a)=>n+(a[0]||0)+(a[1]||0),0);relicQFix();const relFree=relTot-meta.relicQ.length;
  const ups=UPG.filter(u=>lv(u.k)<u.max&&meta.gold>=upCost(u)).length+(TAL[heroCls]||[]).filter(t=>!hasTal(t.k)&&meta.gold>=t.cost).length;
  const pr=(prOpen()||prOf().lv)?prFree():0,prBuy=(prOpen()||prOf().lv)&&meta.gold>=prCost(prOf().lv).gold&&meta.essence>=prCost(prOf().lv).ess?1:0;
  const best=Object.keys(bestPlan(curEq(),meta.stash.slice(0,300),true)).length;
  const su=SLOT_U.filter(slotCan).length;
  const B={equip:best||su?{n:best+su,t:su?`${su} emplacement${su>1?'s':''} à débloquer`:`${best} amélioration${best>1?'s':''} d'équipement`}:null,arsenal:craft?{n:craft,t:`${craft} objet${craft>1?'s':''} à fabriquer`}:null,
    relics:relFree&&!meta.relicQ.length?{n:relFree,t:`${relFree} relique${relFree>1?'s':''} non équipée${relFree>1?'s':''}`}:null,
    pets:meta.eggs>0?{n:meta.eggs,t:`${meta.eggs} œuf${meta.eggs>1?'s':''} à faire éclore`}:null,
    forge:(ups+pr+prBuy+fz)?{n:pr?pr:fz?fz:ups+prBuy,t:pr?`${pr} point${pr>1?'s':''} de prestige à placer`:fz?`${fz} fusion${fz>1?'s':''} possible${fz>1?'s':''}`:`${ups+prBuy} amélioration${ups+prBuy>1?'s':''} achetable${ups+prBuy>1?'s':''}`}:null};
  // onglets verrouillés : pas de pastille ; nouveautés débloquées : « ! » jusqu'à « Compris »
  const TN={equip:['sets','slots'],arsenal:['craft','arms','recy'],relics:['relics'],mods:['mods','hmods','align'],pets:['pets'],forge:['bonus','affix','fuse','seals']};
  for(const t in TN){if(tabLocked(t)){B[t]=null;continue}const nw=TN[t].filter(k=>meta.unlNew.includes(k));if(nw.length)B[t]={n:'!',t:`Nouveau : ${nw.map(k=>UNL_BY[k].n).join(', ')}`}}
  if(!isUnl('fuse')&&B.forge&&!isUnl('bonus'))B.forge=null;
  document.querySelectorAll('.tab').forEach(t=>{let el=t.querySelector('.cx-tab__badge');const b=B[t.dataset.tab];
    if(!b){if(el)el.remove();return}if(!el){el=document.createElement('span');el.className='cx-tab__badge';t.appendChild(el)}el.textContent=b.n>9?'9+':b.n;el.title=b.t;el.setAttribute('aria-label',b.t)})}
// Texte repliable (Disclosure) : une phrase, le détail derrière « En savoir plus ». L'état ouvert est retenu par clé.
let moreOpen={};try{moreOpen=JSON.parse(localStorage.getItem('crypte-more')||'{}')}catch{}
function cxMore(key,sentence,body,lab='En savoir plus'){return `<details class="cx-more" data-more="${key}"${moreOpen[key]?' open':''}><summary><span>${sentence}</span><span class="cx-more__toggle"><span class="o">${lab}</span><span class="c">Masquer</span></span></summary><div class="cx-more__body">${body}</div></details>`}
document.addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('details[data-more]'))return;moreOpen[d.dataset.more]=d.open;try{localStorage.setItem('crypte-more',JSON.stringify(moreOpen))}catch{}},true);
const subTabs=(items,cur,act)=>`<div class="cx-tabs" role="tablist">${items.map(([k,l,n])=>`<button class="cx-tab" role="tab" data-cact="${act}" data-arg="${k}" aria-selected="${cur===k}">${l}${n?`<span class="cx-tab__badge">${n}</span>`:''}</button>`).join('')}</div>`;
const CAMP_MORE={
  ars_heros:['Ce que porte chaque héros. Touche un objet pour voir sa fiche.','<p>Le héros joué vient en premier. Touche un objet porté par un autre héros pour le lui reprendre et l\'équiper sur le héros joué (« Équiper sur… »). Pour équiper un autre héros, choisis-le sur l\'écran d\'accueil. Un objet n\'est porté que par un héros à la fois.</p>'],
  ars_coffre:['Touche un objet pour voir sa fiche et l\'équiper.','<p>Le coffre montre aussi ce que portent tes héros : la pastille A, G ou M indique l\'Archer, le Guerrier ou le Magicien, et le filtre « Portés » n\'affiche qu\'eux. ▲ signale un objet meilleur que celui que tu portes, le cadenas un objet verrouillé (ni recyclé, ni sacrifié par une fusion, ni utilisé comme source d\'affixe). « Équiper le meilleur », en bas, choisit pour chaque emplacement l\'objet qui donne le plus de puissance et de vie, et la meilleure arme de ton héros.</p>'],
  equip:['L\'équipement de ce héros et ses statistiques. Touche un emplacement pour voir sa fiche.','<p>Chaque héros a son équipement ; un objet n\'est porté que par un héros à la fois. « Enregistrer l\'équipement porté » le garde pour le remettre plus tard. Le coffre (tout ce que tu possèdes, objets portés compris) est dans l\'Armurerie, comme le recyclage. « Équiper le meilleur », en bas, choisit pour chaque emplacement l\'objet du coffre qui donne le plus de puissance et de vie.</p><p>Le <b>Prestige</b>, en bas de l\'onglet, s\'ouvre quand toutes les améliorations de la Forge sont au maximum.</p>'],
  arsenal:['Fabrique les objets légendaires et plus rares avec leurs 3 fragments.','<p>Les fragments viennent des reliques, ouvertes en mission : Ossuaire (légendaires), Ancestrale (ancestraux), Sanguine (sanguins), Abyssale (abyssaux). Un objet sort au niveau d\'objet de ta plus haute mission réussie. Fabriquer une arme que tu as déjà donne un double, à fusionner à la Forge.</p><p>« Mes armes » montre tes armes, leur rang et leur DPS comparé à celle que tu portes.</p>'],
  relics:['Équipe des reliques : elles s\'ouvrent pendant la mission.',`<p>En mission, ${REACT_N} réactifs (ennemis au halo doré) ouvrent la première relique de la liste, puis la suivante. En Tourment il en faut moins : ${Math.round((BAL.tormReact||0)*100)} % de moins par palier, et encore moins à mesure que tu restes dans la mission, où les reliques tombent aussi plus souvent. Chaque relique ouverte donne un fragment d\'un objet de sa rareté et +25 essence, à la réussite de la mission.</p><p>Le type de relique dépend de la difficulté et du niveau de mission : Ossuaire en Normal, Difficile et Cauchemar ; Ancestrale en Tourment I et plus, dès le niveau ${BAL.relicLv[0]} ; Sanguine et Abyssale en Tourment VI et plus, dès les niveaux ${BAL.relicLv[1]} et ${BAL.relicLv[2]}. Sous le niveau requis, c'est la relique du dessous. Trois reliques d\'un même type donnent une relique forgée qui vise l\'objet de ton choix. Le raffinage (50 essence) rend une relique éclatante : elle donne deux fragments.</p>`],
  mods:['Place tes mods dans les cases du héros et de l\'arme.','<p>Chaque mod coûte de la capacité ; la maîtrise, gagnée en mission, en ajoute. Une case alignée sur une polarité divise par deux le coût des mods de cette polarité. Un mod au rang maximum se surcharge avec ses copies (jusqu\'à 5 étoiles).</p>'],
  pets:['Ton familier te suit en mission ; fais éclore tes œufs ici.',`<p>Les œufs tombent parfois en ouvrant une relique (${EGG_CH.map((c,t)=>`${RTIER[t].n} ${fmtN(c*BAL.eggMul*100)} %`).join(', ')}). Deux familiers identiques de même rang fusionnent en un seul du rang au-dessus (★★★★★ au maximum). Un familier équipé gagne des niveaux (jusqu\'à 20) avec les ennemis abattus.</p>`],
  forge_up:['L\'or du Camp achète des améliorations permanentes et des talents.','<p>Chaque rang s\'applique à tous tes héros ; les talents sont propres au héros. Quand toutes les améliorations sont au maximum, le <b>Prestige</b> s\'ouvre dans l\'onglet Héros.</p><p>La sauvegarde (exporter, importer) se trouve maintenant dans <b>Réglages</b>.</p>'],
  forge_affix:['Touche Source ou Cible, puis un objet, puis l\'affixe à prendre.','<p>La source est détruite ; son affixe passe sur la cible, qui la gagne, la renforce ou la remplace. Le coût en essence dépend de la rareté de la source. Une affixe déjà plus forte sur la cible ne peut pas être remplacée par une plus faible.</p>'],
  ars_recy:['Touche les objets à recycler, puis Recycler en bas.','<p>Recycler détruit un objet contre de l\'essence, selon sa rareté et son rang. Les objets portés et verrouillés ne se recyclent pas. Filtre par rareté puis « Tout sélectionner » pour recycler un lot d\'un coup.</p>'],
  forge_fuse:[`Deux exemplaires identiques de même rang fusionnent en un seul du rang au-dessus.`,`<p>Identique : même modèle (le nom de base pour le butin, le nom exact pour les objets des reliques), même rareté et même rang. L\'exemplaire gardé conserve ses affixes et son niveau ; chaque rang ajoute 10 % à ses statistiques, jusqu\'au rang 10 pour les objets des reliques (butin des monstres : rang ${BAL.mobRankMax.join(', ')} en commun, magique, rare). Chaque fusion coûte de l\'or : ${BAL.fuseGold} × 2 par rang atteint × (rareté + 1) × (1 + niveau de l\'objet / 20). Pour une arme, les doubles (trouvés ou fabriqués) se fusionnent avec celle que tu possèdes.</p>`],
  forge_seals:['Pose un sceau légendaire sur un objet porté.','<p>Les sceaux tombent seulement en Brèche (le mode à plusieurs), sur les Gardiens et les élites ; 100 éclats s\'échangent contre un sceau au hasard. Un sceau par objet, en plus de ses affixes.</p>']};
// Clé de déblocage de chaque onglet du Camp et de chaque sous-onglet de la Forge.
const TAB_UNL={relics:'relics',mods:'mods',pets:'pets',forge:'bonus'},FSUB_UNL={up:'bonus',affix:'affix',fuse:'fuse',seals:'seals'};
const tabLocked=t=>t==='forge'?!['bonus','affix','fuse','seals'].some(isUnl):!!TAB_UNL[t]&&!isUnl(TAB_UNL[t]);
// Cartes « Nouveau » propres à une vue.
const viewNew=()=>campTab==='equip'?['sets','slots']:campTab==='mods'?['mods','hmods','align']:campTab==='pets'?['pets']:campTab==='relics'?['relics']:campTab==='forge'?[FSUB_UNL[forgeSub]]:[];
function drawCamp(){
  unlockCheck(false);
  if(campTab==='affix'){campTab='forge';forgeSub='affix'}
  if(campTab==='forge'&&forgeSub==='recy'){campTab='arsenal';arsView='recy'}
  const fk=campTab==='forge'?'forge_'+forgeSub:campTab==='arsenal'?(arsView==='recy'?'ars_recy':arsView==='coffre'?'ars_coffre':arsView==='heros'?'ars_heros':'arsenal'):campTab;
  {const h=document.getElementById('campHelp');if(h)h.href='aide/index.html#'+(campTab==='arsenal'&&(arsView==='coffre'||arsView==='recy'||arsView==='heros')?'camp-coffre':campTab==='pets'?'familiers':campTab==='forge'?(forgeSub==='affix'?'camp-affix':forgeSub==='seals'?'camp-affix':forgeSub==='fuse'?'camp-fusion':'camp-forge'):'camp-'+campTab)}
  $('campGold').innerHTML=`<span class="coin"></span>${meta.gold}<span class="e"><span class="essi"></span>${meta.essence}</span>`;
  document.querySelectorAll('.tab').forEach(t=>{t.setAttribute('aria-selected',String(t.dataset.tab===campTab));const lk=tabLocked(t.dataset.tab);t.classList.toggle('is-locked',lk);if(lk)t.setAttribute('aria-description','verrouillé');else t.removeAttribute('aria-description')});
  const NC=viewNew().map(newCard).join('');
  const body=$('campBody'),M=CAMP_MORE[fk],more=M?cxMore(fk,M[0],M[1]):'';
  let h='';
  if(tabLocked(campTab))h=lockedHtml(TAB_UNL[campTab]);
  else if(campTab==='forge'){const fl=k=>!isUnl(FSUB_UNL[k]),lab=(k,l)=>fl(k)?`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>${l}`:l;
    h=subTabs([['up',lab('up','Bonus')],['affix',lab('affix','Affixes')],['fuse',lab('fuse','Fusion'),fl('fuse')?0:fuseGroups().n],['seals',lab('seals','Sceaux'),!fl('seals')&&SEAL_IDS.some(id=>meta.seals[id]>0)&&!Object.values(meta.gear).some(i=>i&&i.seal)?1:0]],forgeSub,'fsub')+(fl(forgeSub)?lockedHtml(FSUB_UNL[forgeSub]):NC+more+(forgeSub==='affix'?campAffix():forgeSub==='seals'?campSeals():forgeSub==='fuse'?campFusion():campForge()))}
  else if(campTab==='mods'||campTab==='pets')h=NC+more+'<div id="modsCamp" class="col"></div>';
  else h=NC+more+(campTab==='equip'?campEquip()+lookHtml()+prestSection():campTab==='arsenal'?campArsenal2():campTab==='relics'?campRelics():'');
  body.innerHTML=h;
  if(campTab==='equip')lookPaint();
  if(tabLocked(campTab)){}
  else if(campTab==='pets'){if(modTab!=='p'){modTab='p';modSel=null;modSF=null;modPF='all';alSel=null}renderMods('modsCamp')}
  else if(campTab==='mods'){if(modTab==='p'||(modTab==='h'&&!isUnl('hmods'))){modTab=isUnl('hmods')?'h':'w';modSel=null;modSF=null;modPF='all';alSel=null}renderMods('modsCamp')}
  tabBadges();
  const dk=typeof campDockHtml==='function'?campDockHtml():'';$('campDock').innerHTML=dk;$('campDock').hidden=!dk;
  const ft=dk?'':campFootHtml();$('campFoot').innerHTML=ft;$('campFoot').hidden=!ft;$('campFoot').className='cx-sheet__foot'+(ft.includes('cx-hint')?' stack':'');
}
// L'action principale de l'onglet, collée en bas de la feuille.
function campFootHtml(){
  if(tabLocked(campTab)||(campTab==='forge'&&!isUnl(FSUB_UNL[forgeSub]))||(campTab==='arsenal'&&({rec:'craft',mine:'arms',recy:'recy'})[arsView]&&!isUnl(({rec:'craft',mine:'arms',recy:'recy'})[arsView])))return '';
  if(campTab==='forge'&&forgeSub==='affix')return affixFoot();
  if(isRecy())return recyFoot();
  if(campTab==='forge'&&forgeSub==='fuse')return fusionFoot();
  if(campTab==='equip'||isCoffre()){const pn=Object.keys(bestPlan(curEq(),meta.stash,true)).length;return pn?`<button class="cx-btn cx-btn--primary" data-cact="bestall">Équiper le meilleur · ${pn}</button>`:''}
  if(campTab==='relics'){relicQFix();const ne=relToEquip(relTier);if(!ne)return '';const sh=relTier==='g'?'Givre':relTier==='f'?'Forgées':relTier==='all'?'':RTIER[+relTier].n;return `<button class="cx-btn cx-btn--primary" data-cact="rqtype">Tout équiper${sh?' · '+sh:''} · ${ne}</button>`}
  return '';
}
const campScroll={};
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{const sc=$('campBody').parentElement;campScroll[campTab]=sc.scrollTop;campTab=t.dataset.tab;campSel=null;campBack=null;campMsg='';drawCamp();sc.scrollTop=campScroll[campTab]||0});
$('campSheet').addEventListener('click',e=>{
  {const b=e.target.closest('#campDock [data-act]');if(b&&!b.disabled){modAct(b.dataset.act,b.dataset);return}}
  const b=e.target.closest('button');if(!b||b.disabled||b.closest('#modsCamp')||!b.closest('#campBody,#campFoot,#campDock'))return;campClick(b)});
// Actions du Camp (aussi appelées depuis Réglages pour la sauvegarde).
function campClick(b){
  const d=b.dataset;
  if(d.slot)campSel={slot:d.slot};
  else if(d.stash){const it=findItem(+d.stash);campSel=it?selOf(it):{stash:+d.stash}}
  else if(d.wsel)campSel={wpn:d.wsel};
  else if(d.cact){
    const a=d.cact,arg=d.arg;
    campMsg='';
    if(a==='exp'){saveMsg='';savePending=null;saveMsgOk='';if(saveMode!=='exp'){saveMode='exp';downloadSave()}else saveMode=null}
    else if(a==='savedl'){saveMsg='';downloadSave()}
    else if(a==='saveshare'){saveMsg='';shareSave();return}
    else if(a==='impopen'){saveMode=saveMode==='imp'?null:'imp';saveMsg='';savePending=null}
    else if(a==='copy'){const code=exportCode(),ta=$('saveOut'),sel=()=>{if(ta){ta.focus();ta.select()}};
      try{navigator.clipboard.writeText(code).then(()=>toast('JSON copié'),()=>{sel();toast('Copie refusée : le JSON est sélectionné, copie-le à la main.')})}catch{sel();toast('Le JSON est sélectionné, copie-le à la main.')}return}
    else if(a==='imp'){const v=($('saveIn')||{}).value||saveDraft;saveDraft=v;const dd=parseCode(v);if(!dd)saveMsg='Ce JSON n\'est pas une sauvegarde valide. Vérifie qu\'il est complet, de la première accolade à la dernière.';else{savePending=dd;saveMsg=''}}
    else if(a==='impcancel'){savePending=null}
    else if(a==='impok'){const dd=savePending;try{localStorage.setItem('crypte-meta',JSON.stringify(dd.meta));if(dd.cls)localStorage.setItem('crypte-cls',dd.cls);if(dd.best)localStorage.setItem('crypte-best2',String(dd.best));location.reload();return}catch{saveMsg='Impossible d\'écrire la sauvegarde : le stockage de ce navigateur est bloqué.'}}
    else if(a==='sfilter'){stF=arg}
    else if(a==='lock'&&campSel&&(campSel.wpn||campSel.slot==='arme')){const wid=campSel.wpn||curWid();meta.wlock=meta.wlock||{};meta.wlock[wid]=!meta.wlock[wid];const on=meta.wlock[wid];cxUndo(`${esc(wdef(wid).n)} ${on?'verrouillée':'déverrouillée'}`,()=>{meta.wlock[wid]=!on})}
    else if(a==='lock'){const it=campSel&&campSel.stash?meta.stash.find(i=>i.id===campSel.stash):campSel&&campSel.slot?meta.gear[campSel.slot]:campSel&&campSel.oth?(meta.gearBy[campSel.oth.split('|')[0]]||{})[campSel.oth.split('|')[1]]:null;if(it){it.lock=!it.lock;cxUndo(`${esc(itemName(it))} ${it.lock?'verrouillé':'déverrouillé'}`,()=>{it.lock=!it.lock})}}
    if(a==='bestall'){const plan=bestPlan(curEq(),meta.stash,true),names=[];for(const sl in plan){const it=plan[sl];
      if(sl==='arme'){meta.wpn[heroCls]=it.wid;names.push(`<span style="color:${RAR[it.r].c}">${esc(wdef(it.wid).n)}</span>`);continue}meta.stash=meta.stash.filter(i=>i!==it);wearGear(sl,it);names.push(`<span style="color:${RAR[it.r].c}">${esc(itemName(it))}</span>`)}campSel=null;if(names.length)toast('Équipé : '+names.join(', '))}
    if(a==='equip'){const it=meta.stash.find(i=>i.id===campSel.stash),k=it&&tgtKey(curEq(),it);if(it&&k){meta.stash=meta.stash.filter(i=>i!==it);wearGear(k,it);campSel={slot:k}}}
    else if(a==='equipoth'&&campSel&&campSel.oth){const [c,k]=campSel.oth.split('|'),it=(meta.gearBy[c]||{})[k],t=it&&tgtKey(curEq(),it);if(it&&t){meta.gearBy[c][k]=null;wearGear(t,it);campSel={slot:t};toast(`<span style="color:${RAR[it.r].c}">${esc(itemName(it))}</span> équipé sur ${esc(CLS[heroCls].n)}, retiré ${parCls(c).replace('par ','à ').replace("à le ","au ")}`)}}
    else if(a==='setsave'){const i=arg===''||arg==null?-1:+arg;if(i<0&&setsOf().length>=SET_MAX)return;const s=setSave(i<0?setsOf().length:i);toast(`<b>${esc(s.n)}</b> enregistré`)}
    else if(a==='setwear'){const r=setWear(+arg),s=setsOf()[+arg];if(r){campSel=null;toast(`<b>${esc(s.n)}</b> porté`+(r.from.length?` · pris ${r.from.map(c=>parCls(c).replace('par ','à ').replace("à le ","au ")).join(' et ')}`:'')+(r.miss?` · ${r.miss} objet${r.miss>1?'s':''} introuvable${r.miss>1?'s':''} (recyclé ou fusionné)`:''))}}
    else if(a==='setdel'){const L=setsOf(),i=+arg,s=L[i];if(s){L.splice(i,1);cxUndo(`<b>${esc(s.n)}</b> supprimé`,()=>{setsOf().splice(i,0,s)})}}
    else if(a==='unequip'){const s=campSel.slot,it=meta.gear[s];if(it){meta.stash.push(it);meta.gear[s]=null;campSel={stash:it.id}}}
    else if(a==='toarsenal'){campTab='arsenal';campSel=null}
    else if(a==='wequip'){if(ownedW(arg)&&wclsOf(arg)===heroCls){meta.wpn[heroCls]=arg;if(campTab==='equip'||isCoffre())campSel={slot:'arme'}}}
    else if(a==='unlok'){meta.unlNew=meta.unlNew.filter(k=>k!==arg)}
    else if(a==='arsv'){arsView=arg;campSel=null;campBack=null}
    else if(a==='fsub'){forgeSub=arg;campSel=null}
    else if(a==='slotopen'){const u=SLOT_U.find(x=>x.k===arg);if(u&&slotCan(u)){meta.hfrag-=u.hf;meta.gold-=u.gold;meta.slotU[u.k]=true;meta.gear[u.k]=null;SND.play('leg');toast(`Emplacement <b>${u.n}</b> débloqué`)}}
    else if(a==='tutoff'){meta.tutOff=true;toast('Parcours masqué : « Réafficher le parcours » en bas de l\'onglet Héros.')}
    else if(a==='tuton'){meta.tutOff=false}
    else if(a==='gocoffre'){campTab='arsenal';arsView='coffre';campSel=null}
    else if(a==='goheros'){campTab='arsenal';arsView='heros';campSel=null}
    else if(a==='gorecy1'){const B={tab:campTab,sel:campSel,scroll:$('campBody').parentElement.scrollTop,label:campTab==='arsenal'?'Coffre':'Héros'};recySel=new Set([arg]);recyAsk=false;campBack=B;campTab='arsenal';arsView='recy';campSel=null}
    else if(a==='rcsel'){if(recySel.has(arg))recySel.delete(arg);else recySel.add(arg);recyAsk=false}
    else if(a==='rcr'){const r=+arg;if(recyR.has(r))recyR.delete(r);else recyR.add(r);recyAsk=false}
    else if(a==='rcrall'){recyR.clear();recyAsk=false}
    else if(a==='rcall'){for(const it of recyList())if(!it.lock)recySel.add(recyKey(it));recyAsk=false}
    else if(a==='rcnone'){recySel.clear();recyAsk=false}
    else if(a==='rcask'){recyAsk=true}
    else if(a==='rcno'){recyAsk=false}
    else if(a==='rcok'){recyDo()}
    else if(a==='dclose'){campSel=null}
    else if(a==='dmore'){dockMore=!dockMore}
    else if(a==='dall'){dockAll=!dockAll}
    else if(a==='dnav'){const L=invList('equip'),i=L.findIndex(isSel),n=L[i+(+arg)];if(n)campSel=selOf(n)}
    else if(a==='xftake'||a==='xfrecv'){const sc=$('campBody').parentElement.scrollTop;campBack={tab:campTab,sel:campSel,scroll:sc,label:{equip:'Héros',arsenal:arsView==='coffre'?'Coffre':'Armurerie'}[campTab]||'Héros',mode:a==='xfrecv'?'recv':'take'};
      xf=a==='xftake'?{src:arg,k:'',dst:'',rep:'',pick:'dst'}:{src:'',k:'',dst:arg,rep:'',pick:'src'};campTab='forge';forgeSub='affix';campSel=null;drawCamp();$('campBody').parentElement.scrollTop=0;return}
    else if(a==='goback'){const B=campBack;campBack=null;if(B){campTab=B.tab;campSel=B.sel;drawCamp();$('campBody').parentElement.scrollTop=B.scroll||0;return}}
    else if(a==='craftask'){arsAsk=arsAsk==='craft'?null:'craft'}
    else if(a==='arsno'){arsAsk=null}
    else if(a==='craftall'){const cp=craftPlan();let n=0;for(const id of cp.plan)if(craftOne(id))n++;arsAsk=null;if(n){SND.play('pick3');toast(`${n} objet${n>1?'s':''} fabriqué${n>1?'s':''}`)}}
    else if(a==='craft'){const b=bpdef(arg),g=craftOne(arg);if(g){SND.play('pick3');
        if(g==='new')toast(`<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> fabriquée${b.cls===heroCls?' et équipée':''}`);
        else if(g==='copy')toast(`Double de <b style="color:${RAR[b.r].c}">${esc(b.n)}</b> fabriqué : fusionne-le à la Forge pour monter de rang`);
        else toast(`<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> niveau ${g.lvl} fabriqué, il t'attend au coffre`)}}
    else if(a==='rftgt'){const [t,id]=arg.split('|');fuseTgt[+t]=id}
    else if(a==='rfuse'){const t=+arg,av=relAvail(t),cost=FUSE_COST[t],tg=fuseTgt[t];if(av.length>=3&&meta.essence>=cost&&tg&&RELICS['F_'+tg]){meta.essence-=cost;
        for(const q of av.slice(0,3))meta.relics[q.id][q.rad?1:0]--;relicQFix();SND.play('relic');
        const fid='F_'+tg,ra=meta.relics[fid]||(meta.relics[fid]=[0,0]);ra[0]++;relSel=fid;
        campMsg=`<div class="card" style="border-color:${RTIER[t].c}"><div class="meta">Fusion réussie</div><p style="margin:0;font-size:15px">Tu obtiens la <b style="color:${RTIER[t].c}">${esc(RELICS[fid].n)}</b>. Équipe-la et ouvre-la en mission : elle donne à coup sûr un fragment de cet objet (${fragStatus(tg)} / 3 aujourd'hui).</p></div>`}}
    else if(a==='arsr'){arsR=arg}
    else if(a==='gofuse'){campTab='forge';forgeSub='fuse';campSel=null}
    else if(a==='wfuse'){const w=wdef(arg),d=wFuse(arg);if(d){SND.play('leg');toast(`<b style="color:${RAR[w.r].c}">${esc(w.n)}</b> passe au ${rkTxt(meta.wlv[arg])}`)}}
    else if(a==='gfuse'){const it=gearAll().find(x=>x.id===+arg),L=it?gearAll().filter(x=>mKey(x)===mKey(it)&&(x.up|0)===(it.up|0)):[],k=L.length>=2?fuseGroup(L):null;if(k){SND.play('leg');toast(`<b style="color:${RAR[k.r].c}">${esc(k.name)}</b> passe au ${rkTxt(k.up)}`)}}
    else if(a==='fuse1'){const it=xfGet(arg),p=fusePartner(it);if(it&&p&&fuseGear(it,p)){SND.play('leg');toast(`<b style="color:${RAR[it.r].c}">${esc(it.name)}</b> passe au ${rkTxt(it.up)} · ${esc(p.name)} sacrifié`)}}
    else if(a==='fuseall'){const n=fuseAll();if(n){SND.play('leg');toast(`${n} fusion${n>1?'s':''} faite${n>1?'s':''}`)}}
    else if(a==='lookcls'){lookCls=arg}
    else if(a==='look'){const [i,col]=arg.split('|');lookSet(lookC(),+i,col);if(typeof netMe==='function')netMe()}
    else if(a==='lookreset'){if(meta.look)delete meta.look[arg];if(typeof netMe==='function')netMe()}
    else if(a==='rsel'){relSel=relSel===arg?null:arg}
    else if(a==='rtier'){relTier=arg;relSel=null}
    else if(a==='rqadd'){const [id,rd]=arg.split('|'),rad=rd==='1',ow=(meta.relics[id]||[0,0])[rad?1:0];if(relicQN(id,rad)<ow)meta.relicQ.push({id,rad})}
    else if(a==='rqdel'){const [id,rd]=arg.split('|'),rad=rd==='1';for(let i=meta.relicQ.length-1;i>=0;i--)if(meta.relicQ[i].id===id&&!!meta.relicQ[i].rad===rad){meta.relicQ.splice(i,1);break}}
    else if(a==='rgmv'){const [id,rd,d]=arg.split('|'),Gs=relGroups(),i=Gs.findIndex(g=>g.id===id&&(g.rad?'1':'0')===rd),j=i+(+d);if(i>=0&&j>=0&&j<Gs.length){[Gs[i],Gs[j]]=[Gs[j],Gs[i]];meta.relicQ=Gs.flatMap(g=>Array.from({length:g.n},()=>({id:g.id,rad:g.rad})))}}
    else if(a==='rqnone'){meta.relicQ=[]}
    else if(a==='rqtype'){const ids=Object.keys(RELICS).filter(id=>meta.relics[id]&&relMatch(id)).sort((x,y)=>RELICS[x].t-RELICS[y].t);for(const id of ids){const r=meta.relics[id];for(const rad of [true,false])while(relicQN(id,rad)<(r[rad?1:0]|0))meta.relicQ.push({id,rad})}}
    else if(a==='rqtypeoff'){meta.relicQ=meta.relicQ.filter(q=>!RELICS[q.id]||!relMatch(q.id))}
    else if(a==='rqall'){for(const id in RELICS){const r=meta.relics[id];if(!r)continue;for(const rad of [true,false])while(relicQN(id,rad)<r[rad?1:0])meta.relicQ.push({id,rad})}}
    else if(a==='xfk'){xf.k=arg;xf.rep='';xf.op=''}
    else if(a==='xfpick'){xf.pick=arg}
    else if(a==='xfop'){xf.op=arg}
    else if(a==='afcat'){afCat=arg;afOpen=''}
    else if(a==='wish'){const W=wishOf();if(W.aff[arg])delete W.aff[arg];else W.aff[arg]=true}
    else if(a==='wishleg'){const W=meta.wish||(meta.wish={leg:true,aff:{}});W.leg=!W.leg}
    else if(a==='wishnone'){if(meta.wish)meta.wish.aff={}}
    else if(a==='afopen'){afOpen=afOpen===arg?'':arg}
    else if(a==='afdst'){const it=xfGet(arg);if(!it||arg===xf.src)return;xf.dst=arg;xf.rep='';xf.op='';xf.pick=xf.src?'dst':'src'}
    else if(a==='afuse'){const [k,key]=arg.split('|'),it=xfGet(key);if(!it||!xfSrcOk(key)||it.aff[k]==null||key===xf.dst)return;xf.src=key;xf.k=k;xf.rep='';xf.pick='dst'}
    else if(a==='xfsel'){const it=xfGet(arg);if(!xfOk(arg,it))return;
      if(xf.pick==='src'){if(arg===xf.src){xf.src='';xf.k=''}else{xf.src=arg;xf.k='';if(xf.dst===arg)xf.dst=''}xf.rep='';if(xf.src&&!xf.dst)xf.pick='dst'}
      else{if(arg===xf.dst)xf.dst='';else xf.dst=arg;xf.rep='';if(xf.dst&&!xf.src)xf.pick='src'}}
    else if(a==='xfrep'){xf.rep=arg}
    else if(a==='xfcancel'){xf={src:'',k:'',dst:'',rep:'',pick:'src'}}
    else if(a==='xfok'){xfDo()}
    else if(a==='refine'){const r=meta.relics[arg];if(r&&r[0]>relicQN(arg,false)&&meta.essence>=50){r[0]--;r[1]++;meta.essence-=50}}
    else if(a==='prbuy'){const o=prOf(),c=prCost(o.lv);if((prOpen()||o.lv)&&meta.gold>=c.gold&&meta.essence>=c.ess){meta.gold-=c.gold;meta.essence-=c.ess;o.lv++;toast(`Prestige du ${CLS[heroCls].n} : niveau ${o.lv}. Place ton point.`);if(typeof netMe==='function')netMe()}}
    else if(a==='pradd'){const o=prOf(),q=PREST.find(x=>x.k===arg);if(q&&prFree()>0&&!(q.max&&prPt(q.k)>=q.max))o.pts[q.k]=prPt(q.k)+1}
    else if(a==='prreset'){prOf().pts={}}
    else if(a==='up'){const u=UPG.find(x=>x.k===arg),c=upCost(u);if(meta.gold>=c&&lv(u.k)<u.max){meta.gold-=c;meta.up[u.k]=lv(u.k)+1}}
    else if(a==='tal'){const t=TAL[heroCls].find(x=>x.k===arg);if(meta.gold>=t.cost){meta.gold-=t.cost;meta.tal[t.k]=true}}
    saveMeta();syncEq();
  }
  drawCamp();if(!$('settings').hidden)drawSettings();
}
$('campBody').addEventListener('input',e=>{const i=e.target.dataset.look;if(i!=null){lookSet(lookC(),+i,e.target.value);const l=e.target.parentElement;l.style.setProperty('--sw',e.target.value);l.classList.add('is-on');lookPaint()}});
// couleur libre : enregistrée et envoyée aux autres joueurs quand le choix est fait
$('campBody').addEventListener('change',e=>{if(e.target.dataset.look==null)return;lookSet(lookC(),+e.target.dataset.look,e.target.value);saveMeta();if(typeof netMe==='function')netMe();drawCamp()});
$('campBody').addEventListener('change',e=>{if(e.target.id==='xfSrc'){xf={src:e.target.value,k:'',dst:xf.dst===e.target.value?'':xf.dst,rep:''};drawCamp()}else if(e.target.id==='xfDst'){xf.dst=e.target.value;xf.rep='';drawCamp()}});
// Héros › Équipements enregistrés : renommer
$('campBody').addEventListener('change',e=>{const i=e.target.dataset.setname;if(i==null)return;const s=setsOf()[+i];if(s){s.n=e.target.value.trim().slice(0,24)||s.n;saveMeta()}});
function openCamp(){$('camp').hidden=false;campSel=null;campMsg='';drawCamp()}
function closeCamp(){$('camp').hidden=true;if(!started)newGame();refreshMenus()}
// Accueil : lignes résumées (Biome, Niveau, Difficulté, Reliques) ; Lancer et le Camp restent en bas.
function diffLine(i){const D=i===3?dif3():DIFF[i],iv=Math.round(D.iv*(meta.mode==='capture'?1.5:1));
  return (i===3?`Monstres : vie ×${fmtN(D.hp)}, dégâts ×${fmtN(D.dm)} · affixes +${Math.round(D.aq*100)} % · réactifs −${Math.round(Math.min(BAL.reactCutMax||0,Math.max(1,meta.torm|0)*(BAL.tormReact||0))*100)} %, plus en restant · `:'')+`${D.cnt>1?`${D.cnt} Gardiens`:'1 Gardien'} toutes les ${iv} s · ${D.loot?`butin et or +${Math.round(D.loot*100)} %`:'butin normal'}`}
const dif3=()=>{const sv=meta.diff;meta.diff=3;const D=dif();meta.diff=sv;return D};
function refreshMenus(){
  $('introGold').textContent=meta.gold;
  {let n=0;try{tabBadges();document.querySelectorAll('#camp .cx-tab__badge').forEach(b=>{n+=parseInt(b.textContent)||0})}catch{}const cb=$('campBadge');if(cb){cb.hidden=!n;cb.textContent=n>9?'9+':n;cb.setAttribute('aria-label',`${n} à voir`)}}
  const st=clamp(meta.start|0||1,1,LV_MAX);$('startBtn').textContent=`Lancer · ${MODES[meta.mode].n} · niveau ${st}`;
  if(document.activeElement!==$('lvIn'))$('lvIn').value=st;$('lvMinus').disabled=st<=1;$('lvPlus').disabled=st>=LV_MAX;
  const lm=lootMul(st);$('lvDesc').textContent=st===1?'Plus haut : plus de butin, monstres plus forts':`Butin ×${lm.toFixed(2).replace(/\.?0+$/,'').replace('.',',')} · or ×${goldMul(st).toFixed(1).replace('.',',')} · monstres plus forts`;
  $('bestTxt').textContent=best?`Meilleure survie : ${fmt(best)}`:'';
  // La Brèche ne se joue qu'à plusieurs : choisissable par l'hôte dès qu'un joueur est connecté.
  {const coopOk=typeof NET!=='undefined'&&NET.host&&NET.peers.some(p=>p.state==='open');if(meta.mode==='breche'&&!coopOk){meta.mode='survie';saveMeta()}
    const mLock=m=>MODES[m].coop?!coopOk:!!UNL_BY[m]&&!isUnl(m);if(mLock(meta.mode)){meta.mode='survie';saveMeta()}
    document.querySelectorAll('.cx-pick[data-m]').forEach(b=>{b.setAttribute('aria-checked',String(b.dataset.m===meta.mode));const lock=mLock(b.dataset.m);b.setAttribute('aria-disabled',String(lock));b.classList.toggle('is-locked',lock)});
    const nxt=['defense','capture'].find(mLock);
    $('modeDesc').textContent=MODES[meta.mode].d+(nxt?` ${UNL_BY[nxt].n.replace('Mission ','')} : ${UNL_BY[nxt].need.replace(/^./,c=>c.toLowerCase())}`:'')+(coopOk?'':' Brèche : à plusieurs seulement, héberge une partie (bouton Coop) pour la choisir.')}
  if(!diffOk(meta.diff|0)){meta.diff=0;saveMeta()}if((meta.diff|0)===3&&(meta.torm|0)>tormMax()){meta.torm=Math.max(1,tormMax());saveMeta()}
  if(meta.biome&&!isUnl('givre')){meta.biome=0;saveMeta()}
  if(!started)unlockHomeSeen();
  if(typeof NET!=='undefined'&&NET.host&&NET.on)sendRoster();
  {const bi=Math.max(0,Math.min(BIOMES.length-1,meta.biome|0));$('bioVal').textContent=(bi?'❄ ':'')+BIOMES[bi].n}
  relicQFix();const rn=meta.relicQ.length;
  $('relicVal').textContent=rn?`${rn} équipée${rn>1?'s':''}`:'Aucune';$('relicVal').style.color=rn?'':'var(--muted)';
  const D=dif(),di=Math.max(0,Math.min(3,meta.diff|0));
  $('diffVal').textContent=D.n;$('diffVal').style.color=di?DIFF[di].c:'';
  $('diffDesc').textContent=di?diffLine(di):'';
}
// Feuille de choix (SettingRow → Sheet + Choice) : toucher une option la choisit et ferme la feuille.
// Une option verrouillée (o.lock = condition) reste visible, grisée, avec ce qu'il faut faire pour l'obtenir.
function openPick(title,opts,onPick,extra){$('pickTitle').textContent=title;
  $('pickBody').innerHTML=`<div class="cx-choices" role="radiogroup" aria-label="${title}">${opts.map((o,i)=>`<button class="cx-choice${o.lock?' is-locked':''}" role="radio" data-pick="${i}" aria-checked="${!!o.on}" ${o.lock?'aria-disabled="true"':''} style="--cc:${o.c||'var(--ink)'}"><span class="cx-choice__key">${o.lock?`<span class="lockmini">${LOCK_SVG}</span>`:i+1}</span><span class="cx-choice__name">${o.n}</span><p class="cx-choice__desc">${o.lock?`<b>Verrouillé</b> : ${o.lock}`:o.d||''}</p><span class="cx-choice__go" aria-hidden="true">›</span></button>`).join('')}</div>${extra?extra():''}`;
  $('pickBody').onclick=e=>{const b=e.target.closest('[data-pick]');if(b){const o=opts[+b.dataset.pick];if(o&&o.lock){toast(o.lock);return}const keep=onPick(+b.dataset.pick);if(keep)openPick(title,keep.opts||opts,onPick,extra);else closePick();return}
    const t=e.target.closest('[data-torm]');if(t){setTorm((meta.torm|0||1)+(+t.dataset.torm));openPick(title,diffOpts(),onPick,extra)}};
  $('pickSheet').hidden=false}
function closePick(){$('pickSheet').hidden=true}
$('pickClose').onclick=closePick;$('pickSheet').addEventListener('click',e=>{if(e.target.id==='pickSheet')closePick()});
const diffOpts=()=>DIFF.map((d,i)=>({n:i===3?`${d.n} · ${dif3().n.replace('Tourment ','palier ')}`:d.n,d:diffLine(i),c:i?d.c:'var(--ink)',on:i===(meta.diff|0),lock:diffOk(i)?null:UNL_BY['diff'+i].need}));
const tormExtra=()=>(meta.diff|0)===3?`<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Palier de Tourment<small>Plus haut : monstres plus forts, plus de Rares ; reliques Sanguines et Abyssales dès VI</small></span><span class="cx-stepper"><button type="button" data-torm="-1" ${dif().tier<=1?'disabled':''} aria-label="Baisser le palier">−</button><b style="min-width:3.2em;display:grid;place-items:center;font:700 16px/1 var(--font-body);color:#ff6a3a">${ROM[dif().tier-1]}</b><button type="button" data-torm="1" ${dif().tier>=tormMax()?'disabled':''} aria-label="Monter le palier">+</button></span></div>${tormMax()<10?`<p class="cx-hint" style="margin:0;padding:0 var(--space-4) 8px">Palier ${ROM[tormMax()]} : réussis d'abord une mission au palier ${ROM[tormMax()-1]}.</p>`:''}</div>`:'<p class="cx-hint" style="margin:0">Toucher une difficulté la choisit et ferme la feuille.</p>';
$('rowDiff').onclick=()=>openPick('Difficulté',diffOpts(),i=>{meta.diff=i;saveMeta();newGame();refreshMenus();return i===3?{opts:diffOpts()}:null},tormExtra);
$('rowBio').onclick=()=>openPick('Biome',BIOMES.map((b,i)=>({n:(i?'❄ ':'')+b.n,d:b.d,c:i?'#9fd0ff':'var(--ink)',on:i===(meta.biome|0),lock:i&&!isUnl('givre')?UNL_BY.givre.need:null})),i=>{meta.biome=i;saveMeta();newGame();refreshMenus()});
const setLv=v=>{meta.start=clamp(Math.round(+v)||1,1,LV_MAX);saveMeta();newGame();refreshMenus()};
$('lvMinus').onclick=()=>setLv((meta.start|0||1)-1);$('lvPlus').onclick=()=>setLv((meta.start|0||1)+1);
$('lvIn').addEventListener('change',e=>{setLv(e.target.value);e.target.value=meta.start});
$('relicBtn').onclick=()=>{campTab='relics';openCamp()};
const setTorm=v=>{meta.torm=Math.max(1,Math.min(tormMax()||1,v));saveMeta();newGame();refreshMenus()};
document.querySelectorAll('.cx-pick[data-m]').forEach(b=>b.onclick=()=>{if(b.getAttribute('aria-disabled')==='true'){toast(MODES[b.dataset.m].coop?'La Brèche se joue à plusieurs : héberge une partie (bouton Coop) puis choisis-la.':`${UNL_BY[b.dataset.m].n} : ${UNL_BY[b.dataset.m].need.replace(/^./,c=>c.toLowerCase())}`);return}meta.mode=b.dataset.m;saveMeta();newGame();refreshMenus()});

