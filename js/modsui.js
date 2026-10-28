// Crypte des Cendres — modsui.js : interface des mods (builds d'arme, de héros et de familier, collection, surcharge). Découpé de ui.js en v145.
/* ---------- Mods (interface) ---------- */
let modSel=null,alSel=null,modTab='h',modPF='all',modSF=null;
const AURA_C='#f0cf4a';
function modDetail(id){
  const m=MODS[id],rk=meta.mods[id],k=modKind(id),isA=k==='a',b=build(bKind(id)),ok=modOk(id,heroCls);
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
  const fuse=maxed?'<span class="owned" style="align-self:center;flex:1;text-align:center">Rang max</span>':`<button class="cx-btn cost-btn" data-act="fuse" ${meta.essence<fc||fuseBlocked?'disabled':''}><span>Monter de rang</span>${costHtml([['ess',fc]])}</button>`;
  if(!why&&fuseBlocked&&!maxed)why='Monter ce mod de rang dépasserait la capacité.';
  return `<span class="cx-dock__meta">${MOD_RAR[m.r].n} · ${costLine} · ${m.max?`rang ${rk} / ${m.max}`:'rang unique'}</span>
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
    <div class="actions"><button class="btn buy cost-btn" data-act="star" ${ok?'':'disabled'}><span>Surcharger</span>${costHtml([['cp',c.cp,cp],['ess',c.ess]])}</button>${dis}</div>${why?`<p class="empty" style="font-size:13px;margin:0">${why}</p>`:''}</div>`}
function alignPanel(b){
  const cost=bAlignCost(b),mt=b.mast;
  let h=`<h3>Alignement · ${b.kind==='w'?'arme':b.kind==='p'?'familier':'héros'}</h3><p class="empty" style="font-size:13px">Aligne une case sur une polarité : un mod de la même polarité y coûte moitié moins, un autre 25 % de plus. Chaque alignement coûte de l'essence (200, 400, 800 puis 1 600)${b.kind==='p'?'.':` et remet la maîtrise ${b.de} à 0.`}</p>
    <div class="alrow">${b.pol.slice(0,b.slots).map((p,i)=>`<button class="chip" data-act="alslot" data-i="${i}" aria-pressed="${!!alSel&&alSel.i===i}">Case ${i+1} · ${p?`<span style="color:${POL[p].c}">${POL[p].s} ${POL[p].n}</span>`:'neutre'}</button>`).join('')}</div>`;
  if(alSel){const cur=b.pol[alSel.i];
    h+=`<div class="alrow">${Object.keys(POL).map(k=>`<button class="chip" data-act="alpol" data-p="${k}" aria-pressed="${alSel.p===k}" ${cur===k?'disabled':''}><span style="color:${POL[k].c}">${POL[k].s}</span> ${POL[k].n}</button>`).join('')}</div>`;
    if(alSel.p)h+=`<div class="card"><p style="margin:0;font-size:14px">Aligner la case ${alSel.i+1} en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b> pour <b>${cost} essence</b>.${b.kind==='p'?'':` La maîtrise ${b.de} repasse du rang ${mt.r} à 0${mt.r?` : −${mt.r} de capacité jusqu'à ce que tu la regagnes en mission`:''}.`}</p>
      <div class="actions"><button class="btn main cost-btn" data-act="alok" ${meta.essence<cost?'disabled':''}><span>Aligner</span>${costHtml([['ess',cost]])}</button><button class="btn" data-act="alcancel">Annuler</button></div>
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
    return `<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Case ${b.slots+1} du héros<small>${c} fragments de relique, pris parmi ceux que tu as en plus grand nombre · tu en as ${have}</small></span><button class="cx-btn cx-btn--sm cost-btn" data-act="slotbuy" style="margin:0" ${have<c?'disabled':''}><span>Débloquer</span>${costHtml([['frag',c,have]])}</button></div></div>`})():'';
  const petTab=inCamp&&campTab==='pets',bn=modTab==='h'?`Build ${deCls(heroCls)}`:`Build ${b.de}`;
  // v139 : sans familier équipé, pas de build à remplir (chaque familier a le sien)
  if(petTab&&!petEq()){root.innerHTML=petPanel();root.querySelectorAll('[data-pet]').forEach(x=>x.onclick=()=>petAct(x.dataset.pet,x.dataset.arg));return}
  const over=u>cap;
  const note=inCamp&&meta.modNote&&!petTab?`<div class="cx-card" style="border-color:var(--gold)"><p style="margin:0;font-size:14px">${modNoteTxt().replace(' Voir Héros › Mods.','')} ${meta.modNote.h?'Les mods de héros règlent maintenant tes capacités (sort, esquive, potion, ultime) ; la vie, la réduction et la vitesse brutes viennent des affixes. ':''}${meta.modNote.conv||meta.modNote.ref?'Les mods de dégâts et de cadence bruts sont devenus des affixes d\'objets ; les mods d\'arme posent des statuts (poison, saignement, étourdissement…). ':''}${meta.modNote.p?'Écho élémentaire, Purification et Poches profondes n\'ont qu\'un rang : l\'essence des rangs et des étoiles en plus est rendue.':''}</p><div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-act="modnote" style="margin:0">Compris</button></div></div>`:'';
  root.innerHTML=`${note}${petTab?petPanel():`<div class="cx-tabs" role="tablist"><button class="cx-tab${isUnl('hmods')?'':' is-locked'}" role="tab" data-act="mtab" data-t="h" aria-selected="${modTab==='h'}">${isUnl('hmods')?'':`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>`}Héros · ${CLS[heroCls].n}</button><button class="cx-tab" role="tab" data-act="mtab" data-t="w" aria-selected="${modTab==='w'}">Arme · ${wdef(curWid()).n}</button>${inCamp?'':`<button class="cx-tab" role="tab" data-act="mtab" data-t="p" aria-selected="${modTab==='p'}">Familier</button>`}</div>`}
    <div class="cx-meter${over?' is-over':''}"><div class="cx-meter__top"><span>Capacité</span><b>${u} / ${cap}</b></div><div class="cx-meter__bar"><i style="--v:${Math.min(100,cap?u/cap*100:0)}%"></i></div></div>
    <p class="cx-hint" style="margin:0">${over?'<span style="color:var(--blood-ink)">Capacité dépassée : les mods en trop sont inactifs (grisés). Retire un mod ou regagne de la maîtrise.</span>':b.kind==='p'?`Build propre à ce familier · bonus de niveau +${mt.r} · capacité qui monte avec son rang et son niveau`:`Maîtrise ${b.kind==='w'?'arme':'héros'} ${mt.r} / 10${mt.r<10?` · ${mt.xp} / ${mastNeed(mt.r)}`:''} · gagne de la capacité en mission`}</p>
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
  else if(a==='modnote'){delete meta.modNote}
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
