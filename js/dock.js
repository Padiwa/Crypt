// Crypte des Cendres — dock.js : fiche ancrée d'un objet, comparaison, départ d'un transfert d'affixe, message « Annuler ». Découpé de inv.js en v145.
/* ---------- Fiche ancrée (cx-dock) ---------- */
const XSVG={x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',prev:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',lock:'<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  take:'<svg viewBox="0 0 24 24"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',recy:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',out:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'};
const recyGain=it=>RAR[it.r].shard*2*2**(it.up|0);
// Statistiques du héros comparées (avant, après) : [libellé, avant, après, décimales, unité] ; les trois premières dans la fiche.
const statPairs=(a,b)=>[['Puissance',power(a),power(b),0,''],['Vie',a.hp,b.hp,0,''],['Réduction',a.armor,b.armor,1,' %'],['Dégâts',a.dmg,b.dmg,1,''],['Critique',a.crit,b.crit,1,' %'],['Attaques / s',a.aps,b.aps,2,''],['Vitesse',a.speed/2.2,b.speed/2.2,0,' %'],['Recharge',a.cdr,b.cdr,1,' %']];
const fmtDc=(v,dc)=>(Math.round(v*10**dc)/10**dc).toLocaleString('fr-FR',{maximumFractionDigits:dc});
function cmpRows(e,it){const tk=slotFor(e,it)||it.slot,a=stats(e),b=stats({...e,[tk]:it});
  const R=statPairs(a,b),f=fmtDc;
  const rows=R.filter(([,x,y,dc])=>Math.abs(y-x)>=.5/10**dc).slice(0,6).map(([l,x,y,dc,u])=>{const d=y-x,up=d>0;return `<div><span>${l}</span><b style="color:${up?'var(--heal)':'var(--blood-ink)'}">${up?'▲ +':'▼ −'}${f(Math.abs(d),dc)}${u}</b></div>`}).join('');
  return rows?`<div class="cx-stats">${rows}</div>`:'<p class="cx-hint" style="margin:0">Aucun changement de statistique.</p>'}

/* ---------- CompareObjet : l'objet choisi face à l'objet équipé du même emplacement, affixe par affixe ---------- */
let cmpPage=0,cmpKey='',dockMore=false,dockAll=false;
const BASE_N={dmg:'Dégâts de base',hp:'Vie',crit:'Critique',speed:'Vitesse',dmgPct:'Dégâts'};
const CMP_PCT=k=>!['hp','regen','burn','multi','pierce','dmg','abWard'].includes(k);
const cmpV=(k,v)=>v==null?'—':fmtN(v)+(CMP_PCT(k)?' %':'');
const cmpD=(k,d)=>Math.abs(d)<1e-9?'<span class="d eq">=</span>':`<span class="d ${d>0?'up':'dn'}">${d>0?'▲ +':'▼ −'}${fmtN(Math.abs(d))}${CMP_PCT(k)?' %':''}</span>`;
// Ligne d'affixe d'une fiche : abyssale mise en avant ; propre à une autre classe que c, ou Projectiles et Transpercement hors arme (v146),
// barrée et marquée « sans effet ».
const affLi=(k,txt,c=heroCls,it)=>affOff(k,c,it)?`<li class="affoff"><s>${txt}</s> <span class="affoff__tag">sans effet · ${affOnly(k,it,c)}</span></li>`:`<li${AFF[k]&&AFF[k].aby?' class="abyp"':''}>${txt}</li>`;
const affV=(it,k)=>it&&it.aff[k]!=null?(NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up)):null;
function cmpObjet(eq,it,heroRows=true){
  const tk=slotFor(eq,it)||it.slot,cur=eq[tk];
  // une affixe d'une autre classe est grisée, marquée « sans effet », et ne compte ni en gain ni en perte
  const row=(cls,k,lab,o,n)=>{const off=affOff(k,heroCls,it);return `<div class="cx-cmp__row${off?cls.replace(/ is-(gain|lost)/,'')+' is-off':cls}"><span class="k"${off?` data-off="${affOnly(k,it)}"`:''}>${lab}</span><span class="o">${cmpV(k,o)}</span><span class="n">${cmpV(k,n)}</span>${off?'<span class="d eq">—</span>':cmpD(k,(n||0)-(o||0))}</div>`};
  const bk=it.base.k,bo=cur&&cur.base?cur.base.v*upMul(cur.up):null,bn=it.base.v*upMul(it.up);
  const base=row(' is-base',bk,BASE_N[bk]||AFF_NAME[bk]||bk,bo,bn);
  const ka=Object.keys(it.aff),ko=cur?Object.keys(cur.aff):[];
  const nm=k=>AFF_NAME[k]||k,ab=k=>AFF[k]&&AFF[k].aby?' is-aby':'';
  const rows=[...ka.filter(k=>ko.includes(k)).map(k=>({h:row(ab(k),k,nm(k),affV(cur,k),affV(it,k))})),
    ...ka.filter(k=>!ko.includes(k)).map(k=>({h:row(' is-gain'+ab(k),k,nm(k),null,affV(it,k))})),
    ...ko.filter(k=>!ka.includes(k)).map(k=>({h:row(' is-lost'+ab(k),k,nm(k),affV(cur,k),null),lost:affOff(k,heroCls,cur)?0:1}))];
  const so=cur&&cur.seal,sn=it.seal;
  if(so||sn){if(so&&sn&&so===sn)rows.push({h:`<div class="cx-cmp__row is-seal"><span class="k">${SEALS[sn].n}</span><span class="o">sceau</span><span class="n">sceau</span><span class="d eq">=</span></div>`});
    else{if(sn)rows.push({h:`<div class="cx-cmp__row is-seal is-gain"><span class="k">${SEALS[sn].n}</span><span class="o">—</span><span class="n">sceau</span><span class="d up">nouveau</span></div>`});
      if(so)rows.push({h:`<div class="cx-cmp__row is-seal is-lost"><span class="k">${SEALS[so].n}</span><span class="o">sceau</span><span class="n">—</span><span class="d dn">perdu</span></div>`,lost:1})}}
  const PG=4,pages=Math.max(1,Math.ceil(rows.length/PG));cmpPage=Math.max(0,Math.min(cmpPage,pages-1));
  const vis=rows.slice(cmpPage*PG,cmpPage*PG+PG),later=rows.slice((cmpPage+1)*PG).filter(r=>r.lost).length;
  const pager=rows.length>PG?`<div class="cx-cmp__pager"><span>Affixes ${cmpPage*PG+1}–${Math.min(rows.length,cmpPage*PG+PG)} sur ${rows.length}${later?` <em>· ${later} perte${later>1?'s':''} ensuite</em>`:''}</span><div><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cmp="-1" ${cmpPage?'':'disabled'} aria-label="Affixes précédentes">${XSVG.prev}</button><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cmp="1" ${cmpPage<pages-1?'':'disabled'} aria-label="Affixes suivantes">${XSVG.next}</button></div></div>`:'';
  let h=`<div class="cx-cmp"><p class="cx-cmp__vs" style="margin:0">${cur?`Face à ce que tu portes : <b style="color:${RAR[cur.r].c}">${esc(itemName(cur))}</b> · ${RAR[cur.r].n}${cur.wid?'':` · niv. ${cur.lvl||1}`}`:'Face à : rien de porté ici'}</p>
    <div class="cx-cmp__rows"><div class="cx-cmp__row is-head"><span>Affixes</span><span>Porté</span><span>Choisi</span><span>Écart</span></div>${base}${vis.map(r=>r.h).join('')}${pager}</div>`;
  if(heroRows){const a=stats(eq),b=stats({...eq,[tk]:it});
    const rd=(v,dc)=>Math.round(v*10**dc)/10**dc;
    const H=statPairs(a,b).slice(0,3).map(([l,x,y,dc,u])=>[l,rd(x,dc),rd(y,dc),dc,u]).filter(([,x,y])=>x!==y),f=fmtDc;
    if(H.length)h+=`<div class="cx-cmp__rows"><div class="cx-cmp__row is-head"><span>Ton héros</span><span>Porté</span><span>Choisi</span><span>Écart</span></div>${H.map(([l,x,y,dc,u])=>{const d=y-x;return `<div class="cx-cmp__row"><span class="k">${l}</span><span class="o">${f(x,dc)}${u}</span><span class="n">${f(y,dc)}${u}</span><span class="d ${d>0?'up':'dn'}">${d>0?'▲ +':'▼ −'}${f(Math.abs(d),dc)}${u}</span></div>`}).join('')}</div>`;
    if(dockAll)h+=cmpRows(eq,it)}
  return h+'</div>'}
// Clics de pagination dans n'importe quelle fiche ancrée
document.addEventListener('click',e=>{const b=e.target.closest('[data-cmp]');if(!b||b.disabled)return;e.stopPropagation();cmpPage+=+b.dataset.cmp;if(!$('camp').hidden)drawCamp();if(!$('bag').hidden)drawBag()},true);
function campDockHtml(){
  if((campTab==='mods'||campTab==='pets')&&modSel&&meta.mods[modSel]!=null)return modDock(modSel);
  if(!(campTab==='equip'||isCoffre()||isHerosV())||!campSel)return '';
  const eq=curEq();let it=null,key='',worn=false,othC=null;
  if(campSel.wpn){const c=wclsOf(campSel.wpn);if(c&&ownedW(campSel.wpn)){it=weaponItem(c,campSel.wpn);key='w:'+campSel.wpn;if(curWid(heroCls)===campSel.wpn){worn=true}}}
  else if(campSel.stash){it=meta.stash.find(i=>i.id===campSel.stash);key='s:'+campSel.stash}
  else if(campSel.slot){it=eq[campSel.slot];worn=true;key=campSel.slot==='arme'?'w:'+curWid():'g:'+campSel.slot}
  else if(campSel.oth){const [c,k]=campSel.oth.split('|');it=(meta.gearBy[c]||{})[k]||null;othC=c;key='o:'+(it&&it.id)}
  if(!it)return '';
  const list=gearOn()?gearList():invList('equip'),idx=!isHerosV()&&(isCoffre()||campSel.stash||campSel.wpn)?list.findIndex(isSel):-1,r=RAR[it.r];
  const wc=it.wid?wornBy(it):null,whoW=othC||(wc&&wc!==heroCls?wc:null);
  const nav=idx>=0?`<span class="cx-dock__nav"><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dnav" data-arg="-1" ${idx>0?'':'disabled'} aria-label="Objet précédent">${XSVG.prev}</button><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dnav" data-arg="1" ${idx<list.length-1?'':'disabled'} aria-label="Objet suivant">${XSVG.next}</button></span>`:'';
  const n=it.up||0;
  const affs=`<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.35"><li>${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${Object.keys(it.aff).map(kk=>affLi(kk,AFF[kk].t(NOSCALE[kk]?it.aff[kk]:fmtN(it.aff[kk]*upMul(it.up))),it.wid?it.cls:heroCls,it)).join('')}${it.seal&&SEALS[it.seal]?`<li class="sealp">${sealTxt(it.seal)}</li>`:''}</ul>`;
  const tk=it.wid?'arme':slotFor(eq,it),cur=tk?eq[tk]:null;
  let main='',more=[];
  const btn=(cls,act,arg,svg,lab,dis)=>`<button class="cx-btn${cls}" data-cact="${act}"${arg!=null?` data-arg="${arg}"`:''} ${dis?'disabled':''}>${svg}${lab}</button>`;
  const other=it.wid&&it.cls!==heroCls,wb=it.wid?bpdef(it.wid):null;
  if(!worn&&it.wid)main=other?`<p class="cx-hint" style="margin:0">Arme ${deCls(it.cls)} : change de héros pour l'équiper.</p>`:`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="wequip" data-arg="${it.wid}">Équiper · remplace ${esc(itemName(cur))}</button>`;
  else if(othC)main=tk?`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="equipoth">Équiper sur ${esc(CLS[heroCls].n)} · retiré ${parCls(othC).replace('par ','à ').replace("à le ","au ")}</button>`:`<p class="cx-hint" style="margin:0">Emplacement ${SLOT[it.slot]} verrouillé.</p>`;
  else if(!worn&&!tk)main=`<p class="cx-hint" style="margin:0">Emplacement ${SLOT[it.slot]} verrouillé : débloque-le dans Héros › Équipement (fragments de harnais).</p>`;
  else if(!worn)main=`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="equip">Équiper${cur?` · remplace ${esc(itemName(cur))}`:''}</button>`;
  // Fusion de rang : un double identique libre (objet) ou les doubles de l'arme.
  let fuse='';
  const gp=c=>costHtml([['or',c]]);const L=t=>`<span>${t}</span>`;const cap=rankCap(it);
  if(!isUnl('fuse'))fuse='';
  else if(n>=cap)fuse=`<p class="cx-hint" style="margin:0">${rkTxt(n)} : rang maximum${cap<UP_MAX?` pour un objet ${RAR[it.r].n.toLowerCase()} (rang ${cap+1}). Les objets des reliques et les armes légendaires et au-dessus montent jusqu'au rang 10.`:'.'}</p>`;
  else if(it.wid){const p=wFusePlan(it.wid),sp=wSpares(it.wid).length;if(p.n)fuse=btn(' cx-btn--block cost-btn','wfuse',it.wid,'',L(`${XSVG.up} Fusionner ${sp} double${sp>1?'s':''} · ${rkTxt(n)} → ${rkTxt(p.R)}`)+gp(p.cost));else if(p.need)fuse=btn(' cx-btn--block cost-btn','wfuse',it.wid,'',L(`${XSVG.up} Fusionner`)+gp(p.need),true);else fuse=`<p class="cx-hint" style="margin:0">${rkTxt(n)} · ${sp?`${sp} double${sp>1?'s':''} de rang trop bas pour fusionner`:'aucun double'} : trouve ou fabrique la même arme pour monter de rang.</p>`}
  else{const p=fusePartner(it),c=fuseGold(it.r,n,it.lvl);if(p)fuse=btn(' cx-btn--block cost-btn','fuse1',key,'',L(`${XSVG.up} Fusionner avec un double · ${rkTxt(n)} → ${rkTxt(n+1)}`)+gp(c),meta.gold<c);else fuse=`<p class="cx-hint" style="margin:0">${rkTxt(n)} · un exemplaire identique (${esc(it.rid?it.name:it.type)}, ${RAR[it.r].n.toLowerCase()}, ${rkTxt(n)}) le fait monter de rang, pour <span class="coin"></span>${c} or.</p>`}
  more.push(btn('','lock',null,XSVG.lock,it.lock?'Déverrouiller':'Verrouiller'));
  if(worn&&it.slot!=='arme')more.push(btn('','unequip',null,XSVG.out,'Retirer au coffre'));
  if(!othC&&isUnl('affix')){if(xfSrcOk(key)&&Object.keys(it.aff).length)more.push(btn('','xftake',key,XSVG.take,'Prendre une affixe'));
    more.push(btn('','xfrecv',key,XSVG.take,'Recevoir une affixe'))}
  // arme gardée (verrouillée, portée, de départ) qui a des doubles : on peut recycler les doubles seuls
  const dupN=it.wid?wSpares(it.wid).length:0,kept=it.wid&&(it.lock||worn||whoW||(wb&&wb.start));
  if(isUnl('recy')&&kept&&dupN)more.push(btn('','gorecy1','d:'+it.wid,XSVG.recy,`Recycler les doubles · ${dupN}`,false));
  else if(isUnl('recy')&&!worn&&!othC&&!whoW&&(!it.wid||(wb&&!wb.start)))more.push(btn('','gorecy1',key,XSVG.recy,'Recycler',it.lock));
  const sk=key;if(sk!==cmpKey){cmpKey=sk;cmpPage=0}
  return `<div class="cx-dock__head"><h3 class="cx-dock__title" style="color:${r.c}">${esc(itemName(it))}${it.lock?` <span class="lockchip">${LOCK_SVG}</span>`:''}</h3>${nav}<button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dclose" aria-label="Fermer la fiche">${XSVG.x}</button></div>
    <span class="cx-dock__meta">${r.n} · ${SLOT[it.slot]}${it.wid?' · fabriquée':` · niveau ${it.lvl}`}${` · ${rkTxt(n)}`}${worn?' · <b style="color:var(--heal)">Porté</b>':''}${whoW?` · <b style="color:${CLS[whoW].col}">Porté ${parCls(whoW)}</b>`:''}${idx>=0?` · ${idx+1} / ${list.length}`:''}</span>
    ${worn||other?affs:cmpObjet(eq,it)}${main}${fuse}${othC?`<p class="cx-hint" style="margin:0">Un objet n'est porté que par un héros à la fois : l'équiper ici le retire ${parCls(othC).replace('par ','à ').replace("à le ","au ")}.</p>`:''}
    <div class="cx-actions" style="gap:6px"><button class="cx-btn cx-btn--sm" data-cact="dmore" aria-expanded="${dockMore}">${dockMore?'Moins d\'actions':'Plus d\'actions'}</button>${worn?'':`<button class="cx-btn cx-btn--sm" data-cact="dall" aria-pressed="${dockAll}">${dockAll?'Masquer les statistiques':'Toutes les statistiques'}</button>`}</div>
    ${dockMore?`<div class="cx-dock__more">${more.join('')}</div>`:''}${it.lock&&!worn?`<p class="cx-hint" style="margin:0">${it.wid?'Verrouillée : l\'arme n\'est ni recyclée ni utilisée comme source d\'affixe ; ses doubles peuvent être recyclés.':'Verrouillé : ni recyclé, ni sacrifié par une fusion, ni utilisé comme source d\'affixe.'}</p>`:''}`;
}

/* ---------- Parcours affixe : départ depuis la fiche, puce de retour ---------- */
let campBack=null; // {tab, sel, scroll, f, q, label}
// Revient là où campBack a été posé (onglet, objet choisi, défilement) ; pre() s'exécute avant de redessiner.
function campRestore(pre){const B=campBack;campBack=null;campTab=B.tab;campSel=B.sel;if(pre)pre();drawCamp();$('campBody').parentElement.scrollTop=B.scroll||0}
function backChip(){return campBack?`<button class="cx-back" data-cact="goback">Retour ${({'Héros':'au Héros','Coffre':'au Coffre','Arsenal':'à l\'Arsenal'})[campBack.label]||'à '+campBack.label}</button>`:''}
function xfSteps(){if(!campBack)return '';const rev=campBack.mode==='recv',s=!!xf.src,k=!!xf.k,d=!!xf.dst;
  const L=rev?[['Cible',d],['Affixe',k],['Source',s]]:[['Source',s],['Affixe',k],['Cible',d]];let now=L.findIndex(x=>!x[1]);
  return `<ol class="cx-steps">${L.map(([l,ok],i)=>`<li class="${ok?'is-done':i===now?'is-now':''}"><span>${i+1} ${l}${ok?' ✓':''}</span></li>`).join('')}</ol>`}
function xfStepHint(){const s=!!xf.src,k=!!xf.k,d=!!xf.dst;
  if(campBack&&campBack.mode==='recv'){if(!d)return 'Étape 1 sur 3 : touche l\'objet qui reçoit l\'affixe.';if(!k)return 'Étape 2 sur 3 : choisis l\'affixe dans la liste déroulante de la source.';if(!s)return 'Étape 3 sur 3 : touche l\'objet à sacrifier dans la liste.';return ''}
  if(!s)return 'Étape 1 sur 3 : touche l\'objet source (il sera détruit).';
  if(!k)return 'Étape 2 sur 3 : touche l\'affixe à prendre sur la source.';
  if(!d)return 'Étape 3 sur 3 : touche l\'objet qui reçoit l\'affixe.';return ''}

/* ---------- Toast « Annuler » ---------- */
let undoT=null;
function cxUndo(html,undo){let el=$('undoToast');if(!el){el=document.createElement('div');el.id='undoToast';el.className='cx-undo';document.body.appendChild(el)}
  clearTimeout(undoT);el.innerHTML=`<div class="cx-toast" role="status"><span>${html}</span>${undo?'<button type="button">Annuler</button>':''}<div class="cx-toast__time"><i></i></div></div>`;el.hidden=false;
  const b=el.querySelector('button');if(b)b.onclick=()=>{el.hidden=true;clearTimeout(undoT);undo();saveMeta();syncEq();if(!$('camp').hidden)drawCamp();if(!$('bag').hidden)drawBag()};
  undoT=setTimeout(()=>{el.hidden=true},5000)}

