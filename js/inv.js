// Crypte des Cendres — inv.js : inventaire unique (barre de recherche, tri, filtres), fiche ancrée (cx-dock),
// parcours « Prendre / Recevoir une affixe » avec retour, et toasts « Annuler ».
let invQ='';
const SORT_N={rar:'Rareté',up:'Amélioration',lvl:'Niveau',new:'Récents'};
const invSortFn={rar:(a,b)=>b.r-a.r||(b.up||0)-(a.up||0)||b.lvl-a.lvl,up:(a,b)=>(b.up||0)-(a.up||0)||b.r-a.r,lvl:(a,b)=>b.lvl-a.lvl||b.r-a.r,new:(a,b)=>b.id-a.id};
const norm=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function invMatch(it,q){if(!q)return true;const n=norm(q);
  if(norm(itemName(it)).includes(n)||norm(it.type||'').includes(n)||norm(SLOT[it.slot]).includes(n)||norm(RAR[it.r].n).includes(n))return true;
  for(const k in it.aff){if(norm(AFF_NAME[k]||k).includes(n)||norm(AFF[k].t(it.aff[k])).includes(n))return true}return false}
function invList(){return meta.stash.filter(i=>(stF==='all'||i.slot===stF)&&invMatch(i,invQ)).sort(invSortFn[stS]||invSortFn.rar)}
function invCountTxt(list){const nb=list.filter(better).length;return `${list.length} objet${list.length>1?'s':''}${nb?` · ▲ ${nb} meilleur${nb>1?'s':''} que ton équipement`:''}`}
// Barre collée : recherche, tri, filtres par emplacement, compteur. kind = 'equip' (Héros) ou 'affix' (Forge › Affixes).
function invToolbar(list,kind){const counts={all:meta.stash.length};for(const it of meta.stash)counts[it.slot]=(counts[it.slot]||0)+1;
  const ch=(k,l)=>`<button class="cx-chip cx-chip--sm" data-cact="sfilter" data-arg="${k}" aria-pressed="${stF===k}">${l} <span class="n">${counts[k]||0}</span></button>`;
  return `<div class="cx-toolbar"><div class="cx-toolbar__row"><label class="cx-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" data-inv="q" value="${esc(invQ)}" placeholder="Chercher une affixe : vitesse, critique…" aria-label="Chercher dans le coffre" enterkeyhint="search"></label>
    <select class="cx-sort" data-inv="sort" aria-label="Trier le coffre">${Object.keys(SORT_N).map(k=>`<option value="${k}"${stS===k?' selected':''}>${SORT_N[k]}</option>`).join('')}</select></div>
    <div class="cx-chips">${ch('all','Tout')}${['armure','amulette','bottes','anneau'].map(k=>ch(k,SLOT[k])).join('')}</div>
    <span class="cx-count" id="invCount">${invCountTxt(list)}</span></div>`}
function invGrid(list,kind){if(!list.length)return `<p class="cx-hint" style="margin:0">${meta.stash.length?(invQ?'Aucun objet ne correspond à ta recherche.':'Aucun objet de ce type.'):'Ton coffre est vide. Sors vivant d\'une mission pour y ramener les objets trouvés.'}</p>`;
  if(kind==='affix')return `<div class="cx-cells">${list.map(it=>xfCell('s:'+it.id,it)).join('')}</div>`;
  return `<div class="grid">${list.map(it=>cellHtml(it,'stash',campSel&&campSel.stash===it.id,better(it))).join('')}</div>`}
function invRefresh(){const kind=campTab==='forge'?'affix':'equip',list=invList(),g=$('invGrid');if(!g)return;g.innerHTML=invGrid(list,kind);const c=$('invCount');if(c)c.textContent=invCountTxt(list)}
$('campBody').addEventListener('input',e=>{if(e.target.dataset.inv==='q'){invQ=e.target.value;invRefresh()}});
$('campBody').addEventListener('change',e=>{if(e.target.dataset.inv==='sort'){stS=e.target.value;drawCamp()}});

/* ---------- Onglet Héros ---------- */
function keyStats(St){return `<div class="cx-keystats"><div><span>Puissance</span><b>${Math.round(dps(St))}</b></div><div><span>Vie</span><b>${Math.round(St.hp)}</b></div><div><span>Réduction</span><b>${Math.round(St.armor)} %</b></div></div>`}
function campEquip(){
  const eq=curEq(),St=stats(eq),rec=meta.stash.filter(i=>!(i.type==='Prime'||i.type==='Sanguin'||i.type==='Abyssal'||i.up||i.lock)),ess=rec.reduce((a,i)=>a+RAR[i.r].shard*2,0);
  const recBtn=!rec.length?'':recyConfirm
    ?`<div class="card"><p class="empty" style="font-size:13px">Recycler ${rec.length} objet${rec.length>1?'s':''} du coffre contre ${ess} essence ? Les objets verrouillés, améliorés, Prime, Sanguins et Abyssaux sont gardés.</p><div class="cx-actions"><button class="cx-btn cx-btn--danger" data-cact="recyall">Tout recycler</button><button class="cx-btn cx-btn--ghost" data-cact="recycancel">Annuler</button></div></div>`
    :`<button class="cx-btn cx-btn--danger cx-btn--sm" data-cact="recyask" style="align-self:flex-start">Tout recycler · ${rec.length} · +${ess} essence</button>`;
  const list=invList(),pn=Object.keys(bestPlan(eq,meta.stash)).length;
  return `${campMsg}<section class="cx-section"><h3 class="cx-section__label">${CLS[heroCls].n} · équipement</h3><div class="slots">${slotsHtml(eq,true,campSel&&campSel.slot)}</div>
    ${pn?'':'<p class="cx-hint" style="margin:0">Ton équipement est déjà le meilleur que tu possèdes.</p>'}</section>
    ${keyStats(St)}${cxMore('equip_stats','Toutes les statistiques',`<div class="statgrid">${statRows(St)}</div>`,'Afficher')}
    <section class="cx-section"><h3 class="cx-section__label">Coffre · ${meta.stash.length} objet${meta.stash.length>1?'s':''}</h3>
    ${meta.stash.length?invToolbar(list,'equip'):''}<div id="invGrid">${invGrid(list,'equip')}</div>${recBtn}</section>
    <section class="cx-section"><h3 class="cx-section__label">Fragments de schéma</h3>${fragInv()}</section>`;
}

/* ---------- Fiche ancrée (cx-dock) ---------- */
const XSVG={x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',prev:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',lock:'<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  take:'<svg viewBox="0 0 24 24"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',recy:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',out:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'};
const recyGain=it=>primeBp(it)?primeRecyEss(it):RAR[it.r].shard*2+Math.floor(upInvested(it.up)/2);
function cmpRows(e,it){const a=stats(e),b=stats({...e,[it.slot]:it});
  const R=[['Puissance',dps(a),dps(b),0,''],['Vie',a.hp,b.hp,0,''],['Réduction',a.armor,b.armor,1,' %'],['Dégâts',a.dmg,b.dmg,1,''],['Critique',a.crit,b.crit,1,' %'],['Attaques / s',a.aps,b.aps,2,''],['Vitesse',a.speed/2.2,b.speed/2.2,0,' %'],['Recharge',a.cdr,b.cdr,1,' %']];
  const f=(v,dc)=>(Math.round(v*10**dc)/10**dc).toLocaleString('fr-FR',{maximumFractionDigits:dc});
  const rows=R.filter(([,x,y,dc])=>Math.abs(y-x)>=.5/10**dc).slice(0,6).map(([l,x,y,dc,u])=>{const d=y-x,up=d>0;return `<div><span>${l}</span><b style="color:${up?'var(--heal)':'var(--blood-ink)'}">${up?'▲ +':'▼ −'}${f(Math.abs(d),dc)}${u}</b></div>`}).join('');
  return rows?`<div class="cx-stats">${rows}</div>`:'<p class="cx-hint" style="margin:0">Aucun changement de statistique.</p>'}
function campDockHtml(){
  if((campTab==='mods'||campTab==='pets')&&modSel&&meta.mods[modSel]!=null)return modDock(modSel);
  if(campTab!=='equip'||!campSel)return '';
  const eq=curEq();let it=null,key='',worn=false;
  if(campSel.stash){it=meta.stash.find(i=>i.id===campSel.stash);key='s:'+campSel.stash}
  else if(campSel.slot){it=eq[campSel.slot];worn=true;key=campSel.slot==='arme'?'w:'+curWid():'g:'+campSel.slot}
  if(!it)return '';
  const list=invList(),idx=campSel.stash?list.findIndex(i=>i.id===campSel.stash):-1,r=RAR[it.r];
  const nav=idx>=0?`<span class="cx-dock__nav"><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dnav" data-arg="-1" ${idx>0?'':'disabled'} aria-label="Objet précédent">${XSVG.prev}</button><span class="cx-count" style="align-self:center">${idx+1} / ${list.length}</span><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dnav" data-arg="1" ${idx<list.length-1?'':'disabled'} aria-label="Objet suivant">${XSVG.next}</button></span>`:'';
  const n=it.up||0,c1=n<UP_MAX?upCostRange(n,1):0,k=Math.min(10,UP_MAX-n),ck=k>1?upCostRange(n,k):0;
  const affs=`<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.35"><li>${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${Object.keys(it.aff).map(kk=>`<li${AFF[kk].aby?' class="abyp"':''}>${AFF[kk].t(NOSCALE[kk]?it.aff[kk]:fmtN(it.aff[kk]*upMul(it.up)))}</li>`).join('')}${it.seal&&SEALS[it.seal]?`<li class="sealp">${sealTxt(it.seal)}</li>`:''}</ul>`;
  const cur=eq[it.slot];
  let main='',more=[];
  const btn=(cls,act,arg,svg,lab,dis)=>`<button class="cx-btn${cls}" data-cact="${act}"${arg!=null?` data-arg="${arg}"`:''} ${dis?'disabled':''}>${svg}${lab}</button>`;
  if(!worn){main=`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="equip">Équiper${cur?` · remplace ${esc(itemName(cur))}`:''}</button>`}
  else if(it.slot==='arme')main=`<button class="cx-btn cx-btn--block" data-cact="toarsenal">Changer d'arme à l'Armurerie</button>`;
  if(n<UP_MAX)more.push(btn(' cx-btn--cost','upg',1,XSVG.up,`Améliorer +1 <span class="cx-price ess"><i class="cx-ess"></i>${c1}</span>`,meta.essence<c1));
  if(n<UP_MAX&&k>1)more.push(btn(' cx-btn--cost','upg',k,XSVG.up,`+${k} <span class="cx-price ess"><i class="cx-ess"></i>${ck}</span>`,meta.essence<ck));
  if(it.slot!=='arme')more.push(btn('','lock',null,XSVG.lock,it.lock?'Déverrouiller':'Verrouiller'));
  if(worn&&it.slot!=='arme')more.push(btn('','unequip',null,XSVG.out,'Retirer au coffre'));
  if(key[0]!=='w'&&Object.keys(it.aff).length)more.push(btn('','xftake',key,XSVG.take,'Prendre une affixe',it.lock));
  more.push(btn('','xfrecv',key,XSVG.take,'Recevoir une affixe'));
  if(!worn)more.push(btn(' cx-btn--danger','recycle',null,XSVG.recy,`Recycler · +${recyGain(it)} essence${primeBp(it)?' · 1 fragment':''}`,it.lock));
  return `<div class="cx-dock__head">${nav}<h3 class="cx-dock__title" style="color:${r.c}">${esc(itemName(it))}${it.lock?` <span class="lockchip">${LOCK_SVG}</span>`:''}</h3><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dclose" aria-label="Fermer la fiche">${XSVG.x}</button></div>
    <span class="cx-dock__meta">${r.n} · ${SLOT[it.slot]}${it.wid?' · fabriquée':` · niveau ${it.lvl}`}${worn?' · porté':cur?'':' · emplacement vide'}</span>
    ${affs}${worn?'':cmpRows(eq,it)}${main}<div class="cx-dock__more">${more.join('')}</div>${it.lock&&!worn?'<p class="cx-hint" style="margin:0">Verrouillé : ni recyclé, ni utilisé comme source d\'affixe.</p>':''}`;
}

/* ---------- Parcours affixe : départ depuis la fiche, puce de retour ---------- */
let campBack=null; // {tab, sel, scroll, f, q, label}
function backChip(){return campBack?`<button class="cx-back" data-cact="goback">Retour à ${campBack.label}</button>`:''}
function xfSteps(){if(!campBack)return '';const rev=campBack.mode==='recv',s=!!xf.src,k=!!xf.k,d=!!xf.dst;
  const L=rev?[['Cible',d],['Source',s],['Affixe',k]]:[['Source',s],['Affixe',k],['Cible',d]];let now=L.findIndex(x=>!x[1]);
  return `<ol class="cx-steps">${L.map(([l,ok],i)=>`<li class="${ok?'is-done':i===now?'is-now':''}"><span>${i+1} ${l}${ok?' ✓':''}</span></li>`).join('')}</ol>`}
function xfStepHint(){const s=!!xf.src,k=!!xf.k,d=!!xf.dst;
  if(!s)return `Étape ${campBack&&campBack.mode==='recv'?2:1} sur 3 : touche l'objet source (il sera détruit).`;
  if(!k)return `Étape ${campBack&&campBack.mode==='recv'?3:2} sur 3 : touche l'affixe à prendre sur la source.`;
  if(!d)return 'Étape 3 sur 3 : touche l\'objet qui reçoit l\'affixe.';return ''}

/* ---------- Toast « Annuler » ---------- */
let undoT=null;
function cxUndo(html,undo){let el=$('undoToast');if(!el){el=document.createElement('div');el.id='undoToast';el.className='cx-undo';document.body.appendChild(el)}
  clearTimeout(undoT);el.innerHTML=`<div class="cx-toast" role="status"><span>${html}</span>${undo?'<button type="button">Annuler</button>':''}<div class="cx-toast__time"><i></i></div></div>`;el.hidden=false;
  const b=el.querySelector('button');if(b)b.onclick=()=>{el.hidden=true;clearTimeout(undoT);undo();saveMeta();syncEq();if(!$('camp').hidden)drawCamp();if(!$('bag').hidden)drawBag()};
  undoT=setTimeout(()=>{el.hidden=true},5000)}
