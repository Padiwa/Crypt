// Crypte des Cendres — fuse.js : fusion de rang (comme les familiers).
// Deux exemplaires du même modèle, de la même rareté et du même rang donnent un seul exemplaire du rang au-dessus (rang 10 au maximum).
// L'exemplaire gardé conserve ses affixes et son niveau ; chaque rang ajoute 10 % à ses statistiques.
const mKey=it=>it.wid?'w:'+it.wid:`${it.slot}|${it.r}|${it.rid||it.type||it.name}`;
const gearAll=()=>[...meta.stash,...Object.values(meta.gear).filter(Boolean)];
const isWorn=it=>Object.values(meta.gear).includes(it);
// Peut être consommé par une fusion : ni porté, ni verrouillé, ni scellé.
const fuseFree=it=>!it.lock&&!isWorn(it)&&!it.seal;
// Doubles d'un objet du coffre ou porté, de même rang.
function fuseMates(it){if(!it||it.wid||(it.up|0)>=UP_MAX)return [];const k=mKey(it),u=it.up|0;return gearAll().filter(x=>x!==it&&mKey(x)===k&&(x.up|0)===u)}
// Le double sacrifié : le plus faible des exemplaires libres.
function fusePartner(it){return fuseMates(it).filter(fuseFree).sort((a,b)=>(a.lvl-b.lvl)||(Object.keys(a.aff).length-Object.keys(b.aff).length)||(a.id-b.id))[0]||null}
function fuseGear(keep,eat){if(!keep||!eat||keep===eat||(keep.up|0)>=UP_MAX||!fuseFree(eat))return false;
  meta.stash=meta.stash.filter(x=>x!==eat);keep.up=(keep.up|0)+1;if(!keep.lock&&eat.lock)keep.lock=true;return true}
/* Armes : une seule arme par modèle, plus des doubles (meta.wcp[id] = rangs des doubles, 0 = rang 1). */
const wSpares=id=>meta.wcp[id]||[];
function wFusePlan(id){let R=meta.wlv[id]|0,n=0;const sp=[...wSpares(id)].sort((a,b)=>a-b);
  for(;;){if(R>=UP_MAX)break;const i=sp.indexOf(R);if(i>=0){sp.splice(i,1);R++;n++;continue}
    let done=false;for(let r=0;r<R;r++){if(sp.filter(x=>x===r).length>=2){sp.splice(sp.indexOf(r),1);sp.splice(sp.indexOf(r),1);sp.push(r+1);sp.sort((a,b)=>a-b);n++;done=true;break}}
    if(!done)break}
  return {R,sp,n}}
function wFuse(id){if(!ownedW(id))return 0;const p=wFusePlan(id);if(!p.n)return 0;const from=meta.wlv[id]|0;meta.wlv[id]=p.R;meta.wcp[id]=p.sp;if(!p.sp.length)delete meta.wcp[id];return p.R-from}
// Toutes les fusions possibles du coffre et des armes.
function fuseGroups(){const G2={};for(const it of gearAll()){if((it.up|0)>=UP_MAX)continue;const k=mKey(it)+'#'+(it.up|0);(G2[k]||(G2[k]=[])).push(it)}
  const gear=Object.values(G2).filter(L=>L.length>=2&&L.some(fuseFree));
  const wpn=Object.values(WPN).flat().filter(w=>ownedW(w.id)&&wFusePlan(w.id).n>0).map(w=>w.id);
  return {gear,wpn,n:gear.length+wpn.length}}
// Garde le meilleur exemplaire (porté, puis le plus haut niveau, puis verrouillé) et sacrifie le plus faible libre.
const keepOrder=(a,b)=>(isWorn(b)-isWorn(a))||(b.lvl-a.lvl)||((!!b.lock)-(!!a.lock))||(Object.keys(b.aff).length-Object.keys(a.aff).length);
function fuseGroup(L){const keep=[...L].sort(keepOrder)[0];
  const eat=L.filter(x=>x!==keep&&fuseFree(x)).sort((a,b)=>(a.lvl-b.lvl)||(a.id-b.id))[0];return fuseGear(keep,eat)?keep:null}
function fuseAll(){let n=0;for(let guard=0;guard<500;guard++){const g=fuseGroups();if(!g.n)break;let any=false;for(const L of g.gear)if(fuseGroup(L)){n++;any=true}for(const id of g.wpn){const d=wFuse(id);if(d){n+=d;any=true}}if(!any)break}return n}
/* ---------- Forge › Fusion ---------- */
function campFusion(){const g=fuseGroups();
  let h=`<section class="cx-section"><h3 class="cx-section__label">Fusions possibles · ${g.n}</h3>`;
  if(!g.n)return h+`<p class="cx-hint" style="margin:0">Aucune fusion pour l'instant. Il faut deux exemplaires du même objet (même modèle, même rareté, même rang). Les objets verrouillés, portés ou scellés peuvent recevoir une fusion, mais ne sont jamais sacrifiés.</p></section>`;
  h+='<div class="cx-rows">';
  for(const id of g.wpn){const w=wdef(id),p=wFusePlan(id),c=RAR[w.r].c;
    h+=`<div class="cx-row"><span class="cx-row__k"><b style="color:${c}">${esc(w.n)}</b><small>Arme ${RAR[w.r].n.toLowerCase()} · ${CLS[w.cls].n} · ${wSpares(id).length} double${wSpares(id).length>1?'s':''} · ${rkTxt(meta.wlv[id])} → <b>${rkTxt(p.R)}</b></small></span><button class="cx-btn cx-btn--sm cx-btn--primary" data-cact="wfuse" data-arg="${id}">Fusionner</button></div>`}
  for(const L of g.gear){const it=L[0],keep=[...L].sort(keepOrder)[0],c=RAR[it.r].c;
    h+=`<div class="cx-row"><span class="cx-row__k"><b style="color:${c}">${esc(it.rid?it.name:it.type)}</b><small>${RAR[it.r].n} · ${SLOT[it.slot]} · ${L.length} exemplaires ${rkTxt(it.up)} · garde <b>${esc(keep.name)}</b> niv. ${keep.lvl}${isWorn(keep)?' (porté)':''} → ${rkTxt((it.up|0)+1)}</small></span><button class="cx-btn cx-btn--sm cx-btn--primary" data-cact="gfuse" data-arg="${keep.id}">Fusionner</button></div>`}
  return h+`</div><p class="cx-hint" style="margin:0">L'exemplaire gardé conserve ses affixes et son niveau ; le plus faible des doubles libres est sacrifié. Chaque rang ajoute 10 % aux statistiques de l'objet (rang 10 au maximum).</p></section>`}
function fusionFoot(){const g=fuseGroups();return g.n?`<button class="cx-btn cx-btn--primary" data-cact="fuseall">Tout fusionner · ${g.n}</button>`:''}
