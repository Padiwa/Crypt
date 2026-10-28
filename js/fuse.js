// Crypte des Cendres — fuse.js : fusion de rang (comme les familiers).
// Deux exemplaires du même modèle, de la même rareté et du même rang donnent un seul exemplaire du rang au-dessus, contre de l'or (fuseGold).
// Rang 10 au maximum pour les objets des reliques ; le butin des monstres plafonne plus bas (BAL.mobRankMax, voir rankCap).
// L'exemplaire gardé conserve ses affixes et son niveau ; chaque rang ajoute 10 % à ses statistiques.
const mKey=it=>it.wid?'w:'+it.wid:`${it.slot}|${it.r}|${it.rid||it.type||it.name}`;
// Le coffre et ce que portent tous les héros ; un objet porté (par n'importe quel héros) peut recevoir une fusion, jamais être sacrifié.
const gearAll=()=>drawCache?memo('gearAll',()=>[...meta.stash,...allWorn()]):[...meta.stash,...allWorn()];
const isWorn=it=>drawCache?memo('wornSet',()=>new Set(allWorn())).has(it):allWorn().includes(it);
// Peut être consommé par une fusion : ni porté, ni verrouillé, ni scellé.
const fuseFree=it=>!it.lock&&!isWorn(it)&&!it.seal;
// Doubles d'un objet du coffre ou porté, de même rang.
function fuseMates(it){if(!it||it.wid||(it.up|0)>=rankCap(it))return [];const k=mKey(it)+'#'+(it.up|0);
  if(drawCache){const ix=memo('fzIdx',()=>{const m=new Map();for(const x of gearAll()){if(x.wid)continue;const kk=mKey(x)+'#'+(x.up|0);let a=m.get(kk);if(!a)m.set(kk,a=[]);a.push(x)}return m});return (ix.get(k)||[]).filter(x=>x!==it)}
  return gearAll().filter(x=>x!==it&&mKey(x)+'#'+(x.up|0)===k)}
// Le double sacrifié : le plus faible des exemplaires libres.
function fusePartner(it){return fuseMates(it).filter(fuseFree).sort((a,b)=>(a.lvl-b.lvl)||(Object.keys(a.aff).length-Object.keys(b.aff).length)||(a.id-b.id))[0]||null}
const gFuseCost=it=>fuseGold(it.r,it.up,it.lvl);
/* Choix des affixes (v127) : l'exemplaire gardé a (celui qui est porté, verrouillé ou scellé reste a) reçoit ce qu'on choisit sur les deux.
   sel = {base:'a'|'b', k:{affixe:'a'|'b'|''}} : d'où viennent le niveau, la stat de base et le nom, et chaque affixe ('' = laissée).
   Pas plus d'affixes que la rareté n'en porte (ou que l'un des exemplaires s'il en a plus) ; un pouvoir abyssal est toujours gardé. */
const fzCap=(a,b)=>Math.max(RAR[a.r].aff,Object.keys(a.aff).length,Object.keys(b.aff).length);
const fzKeys=(a,b)=>[...new Set([...Object.keys(a.aff),...Object.keys(b.aff)])];
const fzCount=sel=>Object.values(sel.k).filter(Boolean).length;
// Tout prendre : la meilleure valeur de chaque affixe commune, les affixes du gardé, puis celles du sacrifié tant qu'il reste de la place ; le plus haut niveau.
function fzBest(a,b){const k={},cap=fzCap(a,b);let n=0;
  for(const x of fzKeys(a,b)){const ia=a.aff[x]!=null,ib=b.aff[x]!=null;if(ia&&ib){k[x]=b.aff[x]>a.aff[x]?'b':'a';n++}else if(ia){k[x]='a';n++}}
  for(const x of fzKeys(a,b))if(k[x]==null){if(n<cap||(AFF[x]&&AFF[x].aby)){k[x]='b';n++}else k[x]=''}
  return {base:b.lvl>a.lvl?'b':'a',k}}
// L'exemplaire gardé tel quel (l'ancienne fusion)
const fzKeepA=(a,b)=>{const k={};for(const x of fzKeys(a,b))k[x]=a.aff[x]!=null?'a':(AFF[x]&&AFF[x].aby?'b':'');return {base:'a',k}};
const fzValid=(a,b,sel)=>fzCount(sel)<=fzCap(a,b)&&fzKeys(a,b).every(x=>!(AFF[x]&&AFF[x].aby)||sel.k[x])&&fzKeys(a,b).every(x=>!sel.k[x]||(sel.k[x]==='b'?b:a).aff[x]!=null);
function fzApply(a,b,sel){const aff={},fz={};
  for(const x of fzKeys(a,b)){const s=sel.k[x];if(!s)continue;const it=s==='b'?b:a;if(it.aff[x]==null)continue;aff[x]=it.aff[x];if(it.fz&&it.fz[x])fz[x]=it.fz[x]}
  a.aff=aff;if(Object.keys(fz).length)a.fz=fz;else delete a.fz;
  if(sel.base==='b'){a.lvl=b.lvl;a.base={...b.base};a.name=b.name;if(b.bio)a.bio=b.bio;else delete a.bio}}
// Fusion de deux exemplaires : sans choix (Tout fusionner), la meilleure valeur de chaque affixe.
function fuseGear(keep,eat,sel){if(!keep||!eat||keep===eat||(keep.up|0)>=rankCap(keep)||!fuseFree(eat)||mKey(keep)!==mKey(eat)||(keep.up|0)!==(eat.up|0))return false;const c=gFuseCost(keep);if(meta.gold<c)return false;
  sel=sel||fzBest(keep,eat);if(!fzValid(keep,eat,sel))return false;
  fzApply(keep,eat,sel);meta.gold-=c;meta.stash=meta.stash.filter(x=>x!==eat);keep.up=(keep.up|0)+1;return true}
/* Armes : une seule arme par modèle, plus des doubles (meta.wcp[id] = rangs des doubles, 0 = rang 1). */
const wSpares=id=>meta.wcp[id]||[];
// Plan de fusion d'une arme avec ses doubles, dans la limite de l'or (gold) : rang final, doubles restants, fusions faites, prix.
// need : prix de la prochaine fusion si l'or manque (0 sinon).
function wFusePlan(id,gold=meta.gold){let R=meta.wlv[id]|0,n=0,cost=0,need=0;const sp=[...wSpares(id)].sort((a,b)=>a-b),cap=wRankCap(id),wr=wdef(id).r,wl=relicItemLvl();
  const pay=k=>{const c=fuseGold(wr,k,wl);if(cost+c>gold){need=c;return false}cost+=c;return true};
  for(;;){if(R>=cap)break;const i=sp.indexOf(R);if(i>=0){if(!pay(R))break;sp.splice(i,1);R++;n++;continue}
    let done=false;for(let r=0;r<R;r++){if(sp.filter(x=>x===r).length>=2){if(!pay(r)){done=false;break}sp.splice(sp.indexOf(r),1);sp.splice(sp.indexOf(r),1);sp.push(r+1);sp.sort((a,b)=>a-b);n++;done=true;break}}
    if(!done)break}
  return {R,sp,n,cost,need}}
function wFuse(id){if(!ownedW(id))return 0;const p=wFusePlan(id);if(!p.n)return 0;const from=meta.wlv[id]|0;meta.gold-=p.cost;meta.wlv[id]=p.R;meta.wcp[id]=p.sp;if(!p.sp.length)delete meta.wcp[id];return p.R-from}
// Toutes les fusions possibles du coffre et des armes.
function fuseGroups(){const G2={};for(const it of gearAll()){if((it.up|0)>=rankCap(it))continue;const k=mKey(it)+'#'+(it.up|0);(G2[k]||(G2[k]=[])).push(it)}
  const gear=Object.values(G2).filter(L=>L.length>=2&&L.some(fuseFree));
  const wpn=Object.values(WPN).flat().filter(w=>ownedW(w.id)&&wFusePlan(w.id,1e15).n>0).map(w=>w.id);
  return {gear,wpn,n:gear.length+wpn.length}}
// Garde le meilleur exemplaire (porté, puis le plus haut niveau, puis verrouillé) et sacrifie le plus faible libre.
const keepOrder=(a,b)=>(isWorn(b)-isWorn(a))||(b.lvl-a.lvl)||((!!b.lock)-(!!a.lock))||(Object.keys(b.aff).length-Object.keys(a.aff).length);
function fuseGroup(L){const keep=[...L].sort(keepOrder)[0];
  const eat=L.filter(x=>x!==keep&&fuseFree(x)).sort((a,b)=>(a.lvl-b.lvl)||(a.id-b.id))[0];return fuseGear(keep,eat)?keep:null}
// ok(rareté) : limite « Tout fusionner » aux raretés choisies dans la Forge (toutes par défaut).
// ok(objet) : limite « Tout fusionner » aux objets que montrent les filtres de la Forge (tous par défaut ; le bot du simulateur n'en passe pas).
function fuseAll(ok=()=>true){let n=0;// les moins chères d'abord, tant que l'or suffit
  for(let guard=0;guard<500;guard++){const g=fuseGroups();if(!g.n)break;let any=false;for(const L of g.gear.filter(L=>ok(L[0])).sort((a,b)=>gFuseCost(a[0])-gFuseCost(b[0])))if(fuseGroup(L)){n++;any=true}for(const id of g.wpn.filter(id=>ok({r:wdef(id).r}))){const d=wFuse(id);if(d){n+=d;any=true}}if(!any)break}return n}
/* ---------- Forge › Fusion (sous-onglet depuis v130 ; écran de v127) ----------
   Même écran que le transfert d'affixe (camp.js, campAffix) : rôles Source / Cible, objets équipés, autres armes, coffre avec ses onglets.
   Fusion : la cible (gardée) d'abord ; on ne peut alors choisir comme source qu'un exemplaire qui fusionne avec elle (même modèle, même rareté, même rang).
   La source choisie, ses affixes se prennent à gauche (carte Source) et la carte Cible montre le résultat. Une arme cible fusionne ses doubles.
   fzc = {a: id cible, b: id source, sel} ou {w: id d'arme} ; fzRole = rôle que prend le prochain objet touché ; fuseR = raretés de « Tout fusionner ». */
let fuseR=new Set(),fzc=null,fzRole='a';
const fuseOk=it=>!fuseR.size||fuseR.has(it.r);
const fzItem=id=>id==null?null:gearAll().find(x=>x.id===id)||null;
const fzPair=(a,b)=>!!(a&&b&&a!==b&&fuseFree(b)&&mKey(a)===mKey(b)&&(a.up|0)===(b.up|0)&&(a.up|0)<rankCap(a));
function fzOpen(keep,eat){fzc={a:keep?keep.id:null,b:eat?eat.id:null,sel:null};fzRole=keep?'b':'a';if(fzPair(keep,eat))fzc.sel=fzBest(keep,eat)}
// Cible choisie : la source reste si elle va avec, sinon le double libre le plus faible.
function fzSetA(it){const b=fzc&&fzItem(fzc.b);fzOpen(it,fzPair(it,b)?b:fuseMates(it).filter(fuseFree).sort((x,y)=>(x.lvl-y.lvl)||(x.id-y.id))[0]||null)}
// Source choisie : la cible reste si elle va avec, sinon le meilleur des autres exemplaires (porté, puis plus haut niveau…).
function fzSetB(it){if(!it||!fuseFree(it))return;const a=fzc&&fzItem(fzc.a);fzOpen(fzPair(a,it)?a:[...fuseMates(it)].sort(keepOrder)[0]||null,it);fzRole='b'}
// Case active en mode Fusion : arme qui a des doubles (cible seulement), objet qui a un double libre de même rang ; pour la source, un double de la cible.
function fzOk(key,it){if(!it)return false;
  if(key[0]==='w'){const id=key.slice(2);return fzRole==='a'&&wSpares(id).length>0&&(meta.wlv[id]|0)<wRankCap(id)}
  const a=fzc&&fzItem(fzc.a);if(fzRole==='b')return a?fzPair(a,it):fuseFree(it)&&fuseMates(it).length>0;
  return (it.up|0)<rankCap(it)&&fuseMates(it).some(fuseFree)}
const fzOf=(key,it)=>!fzc||!it?'':key[0]==='w'?(fzc.w===key.slice(2)?'a':''):fzc.a===it.id?'a':fzc.b===it.id?'b':'';
const fzPin=(key,it)=>({a:'<span class="cx-pin cx-pin--dst">Cible</span>',b:'<span class="cx-pin cx-pin--src">Source</span>'})[fzOf(key,it)]||'';
const fzSt=(key,it)=>({a:' is-dst',b:' is-src'})[fzOf(key,it)]||'';
const fzWhy=it=>[isWorn(it)?`porté par le ${CLS[wornBy(it)].n}`:'',it.lock?'verrouillé':'',it.seal?'scellé':''].filter(Boolean).join(', ');
// Un exemplaire en case cliquable (doubles de la cible, où qu'ils soient : coffre ou porté par un autre héros)
// ⇄ : la source devient la cible et l'inverse. Les choix d'affixes suivent (le résultat ne change pas, seul l'exemplaire gardé change) ; la nouvelle source doit être libre.
function fzSwapWhy(){if(!fzc)return 'Choisis d\'abord un objet.';if(fzc.w)return 'Une arme fusionne tous ses doubles : il n\'y a rien à intervertir.';
  const A=fzItem(fzc.a),B=fzItem(fzc.b);if(!A&&!B)return 'Choisis d\'abord un objet.';
  if(A&&!fuseFree(A))return `La cible ne peut pas être sacrifiée (${fzWhy(A)}).`;if(A&&!B&&!fuseMates(A).length)return 'Aucun autre exemplaire pour devenir la cible.';return ''}
const fzMateCell=(it,ok,note)=>`<button class="cx-cell${fzc&&fzc.b===it.id?' is-src':''}" data-cact="fzb" data-arg="${it.id}" ${ok?'':'aria-disabled="true"'} style="--rar:${RARV[it.r]}" aria-label="${esc(itemName(it))}, niveau ${it.lvl}${note?', '+note:''}">${cellIn(it)}<span class="cx-cell__n">niv. ${it.lvl}</span>${fzc&&fzc.b===it.id?'<span class="cx-pin cx-pin--src">Source</span>':''}</button>`;
function campFusion(){const g=fuseGroups();
  if(fzc&&!fzc.w){const a=fzItem(fzc.a),b=fzItem(fzc.b);if(fzPair(a,b)){if(!fzc.sel)fzc.sel=fzBest(a,b)}else{fzc.sel=null;if(!a&&!b){fzc=null;fzRole='a'}}}
  if(fzc&&fzc.w&&!(ownedW(fzc.w)&&wSpares(fzc.w).length)){fzc=null;fzRole='a'}
  let h=backChip();
  const a=fzc&&!fzc.w&&fzItem(fzc.a),b=fzc&&!fzc.w&&fzItem(fzc.b),W=fzc&&fzc.w;
  const role=(side,lab,it,v)=>`<button class="cx-role cx-role--${side==='a'?'dst':'src'}" data-cact="fzpick" data-arg="${side}" aria-pressed="${fzRole===side}"><span class="cx-role__k"><i>${side==='a'?'+':'−'}</i>${lab}</span><span class="cx-role__v${v?'':' is-empty'}" ${it?`style="color:${RARV[it.r]}"`:''}>${v||'Choisir un objet'}</span></button>`;
  h+=`<div class="cx-roles">${role('b','Source · sacrifiée',b,b?esc(itemName(b)):W?'Ses doubles':'')}${(()=>{const w=fzSwapWhy();return swapBtn('fzswap',!w,w)})()}${role('a','Cible · gardée',W?{r:wdef(W).r}:a,W?esc(wdef(W).n):a?esc(itemName(a)):'')}</div>`;
  if(W){const q=wFusePlan(W),p=wFusePlan(W,1e15);
    h+=`<p class="cx-hint" style="margin:0">Une arme ne garde qu'un exemplaire : ses ${wSpares(W).length} double${wSpares(W).length>1?'s':''} n'ont pas d'affixes à eux et fusionnent tous dans l'arme, ${rkTxt(meta.wlv[W])} → ${rkTxt(q.n?q.R:p.R)}.</p>`}
  else if(a){
    const same=gearAll().filter(x=>x!==a&&mKey(x)===mKey(a)),mates=same.filter(x=>(x.up|0)===(a.up|0)),other=same.filter(x=>(x.up|0)!==(a.up|0));
    h+=`<section class="cx-section"><h3 class="cx-section__label">Fusionne avec ${esc(a.name)} · ${rkTxt(a.up)}</h3>${mates.length?`<div class="cx-cells">${mates.map(x=>fzMateCell(x,fuseFree(x),fuseFree(x)?'':fzWhy(x))).join('')}</div>`:'<p class="cx-hint" style="margin:0">Aucun exemplaire de même rang.</p>'}
      ${other.length?`<p class="cx-hint" style="margin:0">Même objet, autre rang (ne fusionnent pas : il faut le même rang) : ${other.map(x=>`niv. ${x.lvl} au ${rkTxt(x.up)}`).join(', ')}.</p>`:''}</section>`;
    if(fzPair(a,b))h+=fzCards(a,b);
  }else h+=`<p class="cx-hint" style="margin:0">Touche l'objet à faire monter de rang (la cible). Seuls les objets qui ont un exemplaire identique de même rang sont actifs.</p>`;
  if(!fzc&&g.n){const rc={};for(const L of g.gear)rc[L[0].r]=(rc[L[0].r]||0)+1;for(const id of g.wpn){const r=wdef(id).r;rc[r]=(rc[r]||0)+1}
    h+=`<section class="cx-section"><h3 class="cx-section__label">Tout fusionner</h3><div class="cx-chips" aria-label="Rareté"><button class="cx-chip cx-chip--sm" data-cact="fzrall" aria-pressed="${!fuseR.size}">Toutes</button>${Object.keys(rc).map(Number).sort((x,y)=>x-y).map(r=>`<button class="cx-chip cx-chip--sm" data-cact="fzr" data-arg="${r}" aria-pressed="${fuseR.has(r)}" style="${fuseR.has(r)?'':`color:${RAR[r].c}`}">${RAR[r].n} <span class="n">${rc[r]}</span></button>`).join('')}</div><p class="cx-hint" style="margin:0">Tout fusionner garde la meilleure valeur de chaque affixe, sans rien demander.</p></section>`}
  else if(!g.n)h+=`<p class="cx-hint" style="margin:0">Aucune fusion pour l'instant : il faut deux exemplaires du même objet (même modèle, même rareté, même rang).</p>`;
  return h+afGrids()}
// Cartes Source (à gauche : ses affixes à prendre) et Cible (le résultat)
function fzCards(a,b){const sel=fzc.sel,cap=fzCap(a,b),n=fzCount(sel),R=(a.up|0)+1,aby=k=>AFF[k]&&AFF[k].aby;
  const bl=it=>`niv. ${it.lvl} · ${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}`;
  const sLines=`<li><button class="cx-line cx-line--base" data-cact="fzbase" data-arg="${sel.base==='b'?'a':'b'}" aria-pressed="${sel.base==='b'}">${bl(b)}</button></li>`+Object.keys(b.aff).map(k=>`<li><button class="cx-line${aby(k)?' is-aby':''}" data-cact="fzk" data-arg="${k}|b" aria-pressed="${sel.k[k]==='b'}">${xfV(b,k,b.aff[k])}${affOff(k)?` <span class="affoff__tag">${affOnly(k)}</span>`:''}</button></li>`).join('');
  let tLines=sel.base==='b'?`<li class="cx-line cx-line--del">${bl(a)}</li><li class="cx-line cx-line--add">${bl(b)}</li>`:`<li class="cx-line cx-line--base">${bl(a)}</li>`;
  for(const k of fzKeys(a,b)){const s=sel.k[k],ha=a.aff[k]!=null;
    if(s==='a')tLines+=`<li><button class="cx-line" data-cact="fzk" data-arg="${k}|a" aria-pressed="true">${xfV(a,k,a.aff[k])}</button></li>`;
    else if(s==='b')tLines+=(ha?`<li class="cx-line cx-line--del">${xfV(a,k,a.aff[k])}</li>`:'')+`<li class="cx-line cx-line--add">${xfV(b,k,b.aff[k])}</li>`;
    else if(ha)tLines+=`<li><button class="cx-line cx-line--del" data-cact="fzk" data-arg="${k}|a" aria-pressed="false">${xfV(a,k,a.aff[k])}</button></li>`}
  return `<div class="cx-chips"><button class="cx-chip cx-chip--sm" data-cact="fzall">Tout prendre</button><button class="cx-chip cx-chip--sm" data-cact="fzkeep">Garder la cible telle quelle</button></div>
    <p class="cx-hint" style="margin:0">À gauche, touche les affixes de la source à prendre ; à droite, touche une affixe de la cible pour la retirer ou la remettre. ${n} affixe${n>1?'s':''} sur ${cap} au plus.</p>
    <div class="cx-diff fzdiff"><div class="cx-diff__card cx-diff__card--src"><span class="cx-diff__lab">− Source · sacrifiée</span><span class="cx-diff__nm" style="color:${RARV[b.r]}">${esc(b.name)}</span><span class="cx-diff__sub">${RAR[b.r].n} · ${fzWhy(b)||'coffre'}</span><ul>${sLines}</ul></div><div class="cx-diff__card cx-diff__card--dst"><span class="cx-diff__lab">+ Cible · ${rkTxt(a.up)} → ${rkTxt(R)}</span><span class="cx-diff__nm" style="color:${RARV[a.r]}">${esc(sel.base==='b'?b.name:a.name)}</span><span class="cx-diff__sub">${RAR[a.r].n} · ${fzWhy(a)||'coffre'} · +10 % au rang suivant</span><ul>${tLines}</ul></div></div>`}
// Pied du mode Fusion : la paire choisie, l'arme choisie, sinon tout fusionner (ou seulement les raretés choisies).
function fusionFoot(){if(fzc&&fzc.w){const W=fzc.w,q=wFusePlan(W),ok=q.n>0;
    return `<div class="row"><button class="cx-btn cx-btn--ghost" data-cact="fzno">Annuler</button><button class="cx-btn cx-btn--primary cost-btn" data-cact="wfuse" data-arg="${W}" ${ok?'':'disabled'}><span>Fusionner</span>${costHtml([['or',ok?q.cost:q.need]])}</button></div><p class="cx-hint">${ok?`${esc(wdef(W).n)} passe au ${rkTxt(q.R)}.`:`Il te manque ${q.need-meta.gold} or.`}</p>`}
  if(fzc){const a=fzItem(fzc.a),b=fzItem(fzc.b);if(fzPair(a,b)&&fzc.sel){const sel=fzc.sel,cost=gFuseCost(a),over=fzCount(sel)-fzCap(a,b),poor=meta.gold<cost,ok=!poor&&fzValid(a,b,sel);
    return `<div class="row"><button class="cx-btn cx-btn--ghost" data-cact="fzno">Annuler</button><button class="cx-btn cx-btn--primary cost-btn" data-cact="fzok" ${ok?'':'disabled'}><span>Fusionner</span>${costHtml([['or',cost]])}</button></div><p class="cx-hint">${over>0?`${over} affixe${over>1?'s':''} de trop : retires-en ${over>1?over:'une'}.`:poor?`Il te manque ${cost-meta.gold} or.`:`${esc(b.name)} niv. ${b.lvl} sera sacrifié.`}</p>`}
    return `<div class="row"><button class="cx-btn cx-btn--ghost" data-cact="fzno">Annuler</button></div><p class="cx-hint">${fzRole==='b'?'Touche le double à sacrifier.':'Touche la cible.'}</p>`}
  const g=fuseGroups();if(!g.n)return '';const n=fuseR.size?g.gear.filter(L=>fuseOk(L[0])).length+g.wpn.filter(id=>fuseOk({r:wdef(id).r})).length:g.n;
  // Le plan exact se calcule juste après l'affichage (un gros coffre le rend lent) ; le bouton attend son prix, puis le pied est redessiné.
  const P=n?fapGet():{n:0,gold:0};
  if(n&&!P)setTimeout(()=>{fuseAllPlan();if(!$('camp').hidden&&campTab==='forge'&&forgeSub==='fuse'&&!fzc){const f=$('campFoot'),ft=campFootHtml();if(f&&ft){f.innerHTML=ft}}},0);
  if(n&&!P)return `<button class="cx-btn cx-btn--primary cost-btn" data-cact="fuseall" disabled><span>${fuseR.size?'Fusionner ces raretés':'Tout fusionner'}</span><span class="cost"><span class="cost__p">calcul du coût…</span></span></button>`;
  return `<button class="cx-btn cx-btn--primary cost-btn" data-cact="fuseall" ${P.n?'':'disabled'}><span>${fuseR.size?'Fusionner ces raretés':'Tout fusionner'} · ${P.n||n} fusion${(P.n||n)>1?'s':''}</span>${P.n?costHtml([['or',P.gold]]):costHtml([['or',fuseAllNext(),meta.gold]])}</button>`}
// Ce que ferait « Tout fusionner » (v134) : nombre de fusions et or dépensé, calculés sur une copie de la sauvegarde (rien n'est modifié).
// Gardé tant que la sauvegarde, l'or et les raretés choisies ne changent pas.
let fapC=null;
const fapKey=()=>[metaVer,meta.gold,[...fuseR].join()].join('|');
const fapGet=()=>fapC&&fapC.key===fapKey()?fapC:null;
function fuseAllPlan(){const key=fapKey();if(fapC&&fapC.key===key)return fapC;
  const real=meta;let n=0,gold=0;try{meta=structuredClone(real);n=fuseAll(fuseOk);gold=real.gold-meta.gold}catch(err){noteErr('fusion',err)}finally{meta=real}
  return fapC={key,n,gold}}
// Or insuffisant pour la moins chère des fusions possibles : son prix.
function fuseAllNext(){const g=fuseGroups();const c=[...g.gear.filter(L=>fuseOk(L[0])).map(L=>gFuseCost(L[0])),...g.wpn.filter(id=>fuseOk({r:wdef(id).r})).map(id=>wFusePlan(id,1e15).n?fuseGold(wdef(id).r,meta.wlv[id]|0,relicItemLvl()):1e15)];return c.length?Math.min(...c):0}

// Actions du Camp de ce fichier (v135, table CAMP_ACT de camp.js)
Object.assign(CAMP_ACT,{
  fzpick:function(a,arg,b,d){{fzRole=arg==='b'?'b':'a'}return CAMP_GO},
  gofuse:function(a,arg,b,d){{campTab='forge';forgeSub='fuse';campSel=null}return CAMP_GO},
  wfuse:function(a,arg,b,d){{const w=wdef(arg),d=wFuse(arg);if(d){SND.play('leg');toast(`<b style="color:${RAR[w.r].c}">${esc(w.n)}</b> passe au ${rkTxt(meta.wlv[arg])}`)}}return CAMP_GO},
  // fusion d'équipement (fuse.js, mode Fusion de l'onglet Affixes et fusion)
  fuse1:function(a,arg,b,d){{const it=xfGet(arg),p=fusePartner(it);if(it&&p){campBack={tab:campTab,sel:campSel,scroll:$('campBody').parentElement.scrollTop,label:campTab==='arsenal'?'Coffre':'Héros'};fzOpen(it,p);campTab='forge';forgeSub='fuse';campSel=null}}return CAMP_GO},
  // une affixe de la source touchée une 2e fois revient à la valeur de la cible ; une affixe de la cible touchée se retire ou revient ; un pouvoir abyssal reste
  fzk:function(a,arg,b,d){if(fzc&&fzc.sel){{const [k,sd]=arg.split('|'),A=fzItem(fzc.a),S=fzc.sel,ab=AFF[k]&&AFF[k].aby,ha=!!A&&A.aff[k]!=null;if(S.k[k]===sd){if(sd==='b')S.k[k]=ha?'a':ab?'b':'';else if(!ab)S.k[k]=''}else S.k[k]=sd}return CAMP_GO}return CAMP_GO},
  fzbase:function(a,arg,b,d){if(fzc){{fzc.sel.base=arg==='b'?'b':'a'}return CAMP_GO}return CAMP_GO},
  fzall:function(a,arg,b,d){if(fzc){{fzc.sel=fzBest(fzItem(fzc.a),fzItem(fzc.b))}return CAMP_GO}return CAMP_GO},
  fzkeep:function(a,arg,b,d){if(fzc){{fzc.sel=fzKeepA(fzItem(fzc.a),fzItem(fzc.b))}return CAMP_GO}return CAMP_GO},
  fzb:function(a,arg,b,d){{const B=fzItem(+arg);if(B&&fuseFree(B))fzSetB(B)}return CAMP_GO},
  fzno:function(a,arg,b,d){{fzc=null;fzRole='a';if(campBack){campRestore();return}}return CAMP_GO},
  fzok:function(a,arg,b,d){if(fzc){{const A=fzItem(fzc.a),B=fzItem(fzc.b);if(A&&B&&fuseGear(A,B,fzc.sel)){SND.play('leg');toast(`<b style="color:${RAR[A.r].c}">${esc(A.name)}</b> passe au ${rkTxt(A.up)} · ${esc(B.name)} sacrifié`);fzc=null;fzRole='a';if(campBack){campRestore(()=>{saveMeta();syncEq()});return}}}return CAMP_GO}return CAMP_GO},
  fzr:function(a,arg,b,d){{const r=+arg;if(fuseR.has(r))fuseR.delete(r);else fuseR.add(r)}return CAMP_GO},
  fzrall:function(a,arg,b,d){{fuseR.clear();}return CAMP_GO},
  fuseall:function(a,arg,b,d){{const n=fuseAll(fuseOk);if(n){SND.play('leg');toast(`${n} fusion${n>1?'s':''} faite${n>1?'s':''}`)}}return CAMP_GO},
  fzswap:function(a,arg,b,d){{const w=fzSwapWhy();if(w)return;const A=fzItem(fzc.a),B=fzItem(fzc.b);
      if(A&&B){const sw=x=>x==='a'?'b':x==='b'?'a':x,S=fzc.sel;fzc={a:B.id,b:A.id,sel:S?{base:sw(S.base),k:Object.fromEntries(Object.entries(S.k).map(([k,v])=>[k,sw(v)]))}:null};fzRole='b'}
      else if(A)fzSetB(A);else fzSetA(B)}return CAMP_GO},
});
