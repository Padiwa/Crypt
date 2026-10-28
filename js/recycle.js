// Crypte des Cendres — recycle.js : Arsenal › Recycler. Découpé de inv.js en v145.
/* ---------- Arsenal › Recyclage : le seul endroit où l'on recycle ---------- */
let recySel=new Set(),recyR=new Set(),recyAsk=false;
// Une arme se recycle avec tous ses doubles : essence de chaque exemplaire selon son rang (l'arme au rang de meta.wlv, chaque double au sien).
// Une arme gardée (verrouillée, portée, ou arme de départ) ne se recycle pas : seule une case « doubles » (dup) la représente, et ses doubles partent seuls.
const recyKey=it=>it.dup?'d:'+it.wid:it.wid?'w:'+it.wid:'s:'+it.id;
const wCopies=id=>1+wSpares(id).length;
const wDupEss=id=>{const base=20*(wdef(id).r+1);return wSpares(id).reduce((a,k)=>a+base*2**k,0)};
const wRecyAll=id=>20*(wdef(id).r+1)*2**(meta.wlv[id]|0)+wDupEss(id);
const recyEss=it=>it.dup?wDupEss(it.wid):it.wid?wRecyAll(it.wid):recyGain(it);
const recyCount=it=>it.dup?wSpares(it.wid).length:it.wid?wCopies(it.wid):1;
const recyN=P=>P.reduce((a,it)=>a+recyCount(it),0);
// « 9 objets », ou « 9 objets (32 exemplaires) » quand des armes ont des doubles
const recyTxt=P=>{const n=P.length,c=recyN(P);return `${n} objet${n>1?'s':''}${c>n?` (${c} exemplaires avec les doubles)`:''}`};
const wKept=it=>it.lock||!!wornBy(it)||!!wdef(it.wid).start;
const dupOf=it=>Object.assign({},it,{dup:true,lock:false,up:0});
function recyAll(){const out=[];
  for(const it of invList('recy')){
    if(!it.wid){if(!wornBy(it))out.push(it);continue}
    if(!wKept(it)){out.push(it);continue}
    if(wSpares(it.wid).length)out.push(dupOf(it));else if(it.lock&&!wdef(it.wid).start)out.push(it)}
  // armes portées (absentes de la liste du coffre) : leurs doubles se recyclent aussi
  if(stF==='all'||stF==='arme')for(const c in CLS){const id=curWid(c);if(!id||!ownedW(id)||!wSpares(id).length)continue;const it=weaponItem(c,id);if(invMatch(it,invQ)&&!out.some(x=>x.wid===id))out.push(dupOf(it))}
  return out}
function recyList(){return recyAll().filter(it=>!recyR.size||recyR.has(it.r))}
function recyPicked(){const all=recyAll();return [...recySel].map(k=>all.find(it=>recyKey(it)===k)).filter(it=>it&&!it.lock)}
// Contenu d'une case d'objet : cadenas s'il est verrouillé, glyphe de l'emplacement, rang s'il a été fusionné.
const cellIn=it=>`${it.lock?`<span class="cx-cell__lock">${LOCK_SVG}</span>`:''}${GLYPH[it.slot]}${it.up?`<span class="cx-cell__up">R${it.up+1}</span>`:''}`;
function recyCell(it){const k=recyKey(it),on=recySel.has(k);return `<button class="cx-cell${on?' is-src':''}" data-cact="rcsel" data-arg="${k}" ${it.lock?'aria-disabled="true"':''} style="--rar:${RARV[it.r]}" aria-pressed="${on}" aria-label="${it.dup?`Doubles de ${esc(it.name)} (${recyCount(it)}), l'arme reste`:esc(itemName(it))}${it.lock?', verrouillé':''}${on?', choisi':''}">${it.dup?`<span class="cx-cell__lock">${LOCK_SVG}</span>${GLYPH[it.slot]}`:cellIn(it)}${recyCount(it)>1||it.dup?`<span class="cx-cell__n">×${recyCount(it)}</span>`:''}${on?'<span class="cx-pin cx-pin--src">−</span>':''}</button>`}
function recyCells(){const all=recyAll(),list=recyList(),C=gridCut(list,null);return list.length?`<div class="cx-cells">${C.show.map(recyCell).join('')}</div>${gridMoreBtn(C.rest)}`:`<p class="cx-hint" style="margin:0">${all.length?'Aucun objet pour ce filtre.':'Rien à recycler : ton coffre est vide.'}</p>`}
function campRecycle(){const all=recyAll(),list=recyList();for(const k of [...recySel])if(!all.some(it=>recyKey(it)===k&&!it.lock))recySel.delete(k);
  const rs=[...new Set(all.map(it=>it.r))].sort((a,b)=>a-b),cnt={};for(const it of all)cnt[it.r]=(cnt[it.r]||0)+1;
  const rch=r=>`<button class="cx-chip cx-chip--sm" data-cact="rcr" data-arg="${r}" aria-pressed="${recyR.has(r)}" style="${recyR.has(r)?'':`color:${RAR[r].c}`}">${RAR[r].n} <span class="n">${cnt[r]}</span></button>`;
  const sel=list.filter(it=>!it.lock).length;
  return `${backChip()}<section class="cx-section"><h3 class="cx-section__label">Rareté à recycler</h3><div class="cx-chips"><button class="cx-chip cx-chip--sm" data-cact="rcrall" aria-pressed="${!recyR.size}">Toutes <span class="n">${all.length}</span></button>${rs.map(rch).join('')}</div></section>
    <section class="cx-section"><h3 class="cx-section__label">Objets · ${list.length}</h3>${all.length?invToolbar(list,'recy').replace('<span class="cx-count" id="invCount">','<span class="cx-count">'):''}
    <div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-cact="rcall" ${sel?'':'disabled'}>Tout sélectionner · ${sel}</button><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="rcnone" ${recySel.size?'':'disabled'}>Tout désélectionner</button></div>
    <div id="invGrid">${recyCells()}</div>
    <p class="cx-hint" style="margin:0">Les objets portés ne sont pas listés ; les objets verrouillés (cadenas) ne se recyclent pas. Une arme part avec tous ses doubles (×N sur la case) ; verrouillée ou portée, elle reste et seuls ses doubles se recyclent (case au cadenas).</p></section>`}
function recyFoot(){const P=recyPicked();if(!P.length)return '<p class="cx-hint">Touche les objets à recycler.</p>';
  const e=P.reduce((a,it)=>a+recyEss(it),0),f=0;
  if(recyAsk)return `<p class="cx-hint">Recycler ${recyTxt(P)} ? Ils sont détruits contre ${e} essence${f?` et ${f} fragment${f>1?'s':''}`:''}.</p><div class="row"><button class="cx-btn cx-btn--ghost" data-cact="rcno">Annuler</button><button class="cx-btn cx-btn--danger" data-cact="rcok">Recycler</button></div>`;
  return `<button class="cx-btn cx-btn--danger cx-btn--cost" data-cact="${recyN(P)>1?'rcask':'rcok'}">Recycler · ${P.length} <span class="cx-price ess"><i class="cx-ess"></i>+${e}</span></button>`}
function recyDo(){const P=recyPicked();if(!P.length)return;let e=0,f=0;
  for(const it of P){e+=recyEss(it);
    if(it.dup)delete meta.wcp[it.wid]; // arme gardée : seuls ses doubles partent
    else if(it.wid){delete meta.wcp[it.wid];wDestroy(it.wid)} // l'arme part avec tous ses doubles
    else meta.stash=meta.stash.filter(x=>x!==it)}
  meta.essence+=e;recySel.clear();recyAsk=false;SND.play('pick2');
  toast(`${recyTxt(P)} recyclé${P.length>1?'s':''} · +${e} essence${f?` · ${f} fragment${f>1?'s':''}`:''}`)}

// Actions du Camp de ce fichier (v135, table CAMP_ACT de camp.js)
Object.assign(CAMP_ACT,{
  gorecy1:function(a,arg,b,d){{const B={tab:campTab,sel:campSel,scroll:$('campBody').parentElement.scrollTop,label:campTab==='arsenal'?'Coffre':'Héros'};recySel=new Set([arg]);recyAsk=false;campBack=B;campTab='arsenal';arsView='recy';campSel=null}return CAMP_GO},
  rcsel:function(a,arg,b,d){{if(recySel.has(arg))recySel.delete(arg);else recySel.add(arg);recyAsk=false}return CAMP_GO},
  rcr:function(a,arg,b,d){{const r=+arg;if(recyR.has(r))recyR.delete(r);else recyR.add(r);recyAsk=false}return CAMP_GO},
  rcrall:function(a,arg,b,d){{recyR.clear();recyAsk=false}return CAMP_GO},
  rcall:function(a,arg,b,d){{for(const it of recyList())if(!it.lock)recySel.add(recyKey(it));recyAsk=false}return CAMP_GO},
  rcnone:function(a,arg,b,d){{recySel.clear();recyAsk=false}return CAMP_GO},
  rcask:function(a,arg,b,d){{recyAsk=true}return CAMP_GO},
  rcno:function(a,arg,b,d){{recyAsk=false}return CAMP_GO},
  rcok:function(a,arg,b,d){{recyDo()}return CAMP_GO},
});
