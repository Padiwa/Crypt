// Crypte des Cendres — forge.js : onglet Forge (transfert d'affixe, liste de souhaits, Bonus) et ses actions. Découpé de camp.js en v135.
let forgeSub='up';
let xf={src:'',k:'',dst:'',rep:''},xfJump=false;
const wclsOf=id=>Object.keys(WPN).find(c=>WPN[c].some(w=>w.id===id));
// Clés des objets : s:<id> coffre, g:<emplacement> porté par le héros choisi, o:<id> porté par un autre héros, w:<arme>.
function xfGet(key){if(!key)return null;const t=key[0],v=key.slice(2);
  if(t==='s')return meta.stash.find(i=>String(i.id)===v)||null;if(t==='g')return meta.gear[v]||null;if(t==='o')return allWorn().find(i=>String(i.id)===v)||null;
  if(t==='w'){const c=wclsOf(v);return c&&ownedW(v)?weaponItem(c,v):null}return null}
const afKey=it=>{if(it.wid)return 'w:'+it.wid;const c=wornBy(it);return !c?'s:'+it.id:c===heroCls?'g:'+wornSlot(it,c):'o:'+it.id};
const xfCap=it=>Math.max(RAR[it.r].aff,Object.keys(it.aff).length);
const xfCost=it=>50*(it.r+1);
const FZ_MAX=3,FZ_K=.5,fzCost=(it,n)=>100*(it.r+1)*(n+1);
function fzGet(key,k){if(!key)return 0;if(key[0]==='w'){const o=meta.wfz&&meta.wfz[key.slice(2)];return (o&&o[k])||0}const it=xfGet(key);return (it&&it.fz&&it.fz[k])||0}
function xfState(o=xf){const s=xfGet(o.src),d=xfGet(o.dst);if(!s||!d||!o.k||s.aff[o.k]==null)return null;
  if(AFF[o.k].aby)return {ok:false,msg:'Les pouvoirs abyssaux sont liés à leur objet : impossible de les transférer ou de les fusionner.'};
  if(o.rep&&AFF[o.rep]&&AFF[o.rep].aby)return {ok:false,full:true,msg:'Le pouvoir abyssal ne peut pas être remplacé : choisis une autre affixe.'};
  const k=o.k,ns=!!NOSCALE[k],ve=ns?s.aff[k]:s.aff[k]*upMul(s.up),v=ns?ve:Math.round(ve/upMul(d.up)*10)/10,cur=d.aff[k],ce=cur==null?null:ns?cur:cur*upMul(d.up),cap=xfCap(d),n=Object.keys(d.aff).length,T=x=>xfV(d,k,x),r=o=>Object.assign(o,{nv:v});
  if(cur!=null){const n0=fzGet(o.dst,k),fuseOk=n0<FZ_MAX,canUp=ve>ce+1e-9,hi=Math.max(ce,ve),lo=Math.min(ce,ve),fe=ns?hi+(lo>=1?1:0):hi+lo*FZ_K,fv=ns?fe:Math.round(fe/upMul(d.up)*10)/10;
    if(!fuseOk&&!canUp)return r({ok:false,msg:`${esc(itemName(d))} a déjà ${T(cur)} (fusionnée ${FZ_MAX} fois, le maximum), une valeur égale ou plus forte.`});
    const op=o.op==='up'&&canUp?'up':fuseOk?'fuse':'up';
    if(op==='fuse')return {ok:true,mode:'fuse',nv:fv,n:n0,fuseOk,canUp,cost:fzCost(s,n0),msg:`Fusionne ${T(v)} dans ${T(cur)} : ${T(fv)} sur ${esc(itemName(d))} (fusion ${n0+1} / ${FZ_MAX}).`};
    return r({ok:true,mode:'up',fuseOk,canUp,msg:`Remplace ${T(cur)} par ${T(v)} sur ${esc(itemName(d))}.`})}
  if(n<cap)return r({ok:true,mode:'add',msg:`Ajoute ${T(v)} sur ${esc(itemName(d))} (${n+1} / ${cap} affixes).`});
  if(o.rep&&d.aff[o.rep]!=null)return r({ok:true,mode:'rep',msg:`Remplace ${xfV(d,o.rep,d.aff[o.rep])} par ${T(v)} sur ${esc(itemName(d))}.`});
  return r({ok:false,full:true,msg:`${esc(itemName(d))} a déjà ${cap} affixe${cap>1?'s':''} : choisis celle à remplacer.`})}
const xfV=(it,k,v)=>AFF[k].t(NOSCALE[k]?v:fmtN(v*upMul(it.up)));
let afCat='all',afOpen='';
const AFF_CAT={frz:'off',cold:'off',shard:'off',curse:'off',hex:'off',doom:'off',dmgPct:'off',apsPct:'off',crit:'off',critDmg:'off',novaPct:'off',skillRad:'off',burn:'off',multi:'off',pierce:'off',reach:'off',splash:'off',hp:'def',armor:'def',regen:'def',leech:'def',speed:'uti',cdr:'uti',burnPct:'off',chill:'off',shock:'off',execute:'off',bossDmg:'off',lowDmg:'off',ultPct:'off',fury:'off',lowArmor:'def',potHeal:'def',antidote:'def',auraSlow:'def',skillDur:'uti',dashCd:'uti',magnetPct:'uti',goldPct:'uti',xpPct:'uti',lootPct:'uti',dotPct:'off',ccDmg:'off',thorns:'def'};
const AFF_NAME={frz:'Gel',cold:'Dégâts contre ralentis',shard:'Éclats de glace',curse:'Malédiction',hex:'Dégâts contre maudits',doom:'Malédiction contagieuse',dmgPct:'Dégâts',apsPct:'Vitesse d\'attaque',crit:'Chances de critique',critDmg:'Dégâts critiques',hp:'Points de vie',armor:'Réduction des dégâts',speed:'Vitesse de déplacement',regen:'Régénération',cdr:'Temps de recharge',skillRad:'Portée des compétences',novaPct:'Dégâts de compétence',burn:'Embrasement',multi:'Projectiles par tir',leech:'Vol de vie',reach:'Portée de frappe',splash:'Rayon d\'explosion',pierce:'Transpercement',burnPct:'Embrasement (%)',chill:'Ralentissement',shock:'Éclair en chaîne',execute:'Exécution',bossDmg:'Dégâts contre Gardiens',lowDmg:'Dégâts sous 50 % de vie',ultPct:'Dégâts de l\'ultime',fury:'Charge de l\'ultime',lowArmor:'Protection sous 30 % de vie',potHeal:'Soin des potions',antidote:'Antidote',auraSlow:'Aura de lenteur',skillDur:'Durée des compétences',dashCd:'Recharge de l\'esquive',magnetPct:'Portée de ramassage',goldPct:'Or',xpPct:'Expérience',lootPct:'Chances de butin',dotPct:'Dégâts des statuts',ccDmg:'Brise-garde',thorns:'Épines'};
const AFF_CATN={off:'Offensives',def:'Défensives',uti:'Utilitaires'};
const affShort=(k,v)=>{const pct=!['hp','regen','burn','multi','pierce'].includes(k),neg=['armor','cdr','lowArmor','dashCd','antidote','fury'].includes(k);return `${neg?'−':'+'}${fmtN(v)}${pct?' %':k==='regen'?' PV/s':k==='burn'?' /s':''}`};
const affEff=(it,k)=>NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up);
// Liste de souhaits (affixes recherchées, légendaires) : créée au premier besoin.
const wishOf=()=>{const W=meta.wish||(meta.wish={leg:true,aff:{}});W.aff=W.aff||{};return W};
function wishSection(){const W=wishOf();
  const keys=Object.keys(AFF).filter(k=>!AFF[k].w&&!AFF[k].old),n=keys.filter(k=>W.aff[k]).length;
  const chip=k=>`<button class="cx-chip cx-chip--sm" data-cact="wish" data-arg="${k}" aria-pressed="${!!W.aff[k]}">${AFF_NAME[k]||k}</button>`;
  const grp=c=>{const ks=keys.filter(k=>(AFF_CAT[k]||'uti')===c);return ks.length?`<span class="cx-hint" style="margin:0">${AFF_CATN[c]}</span><div class="cx-chips">${ks.map(chip).join('')}</div>`:''};
  return `<section class="cx-section"><h3 class="cx-section__label">Alertes de butin</h3>
    <p class="cx-hint" style="margin:0">En mission, l'écran s'illumine et l'objet porte un grand faisceau doré quand un objet tombe avec une de ces affixes à une valeur plus haute que celle de ton équipement porté (ou que tu ne portes pas encore)${W.leg?', ou quand une arme que tu n\'as pas encore tombe':''}.</p>
    <div class="cx-chips"><button class="cx-chip cx-chip--sm" data-cact="wishleg" aria-pressed="${!!W.leg}" style="${W.leg?'':'color:var(--rar-legend)'}">Armes nouvelles</button>${n?`<button class="cx-btn cx-btn--ghost cx-btn--sm" data-cact="wishnone" style="margin:0">Tout retirer (${n})</button>`:''}</div>
    ${grp('off')}${grp('def')}${grp('uti')}</section>`}
// Chercher par affixe : chaque objet qui porte l'affixe se choisit comme source (détruite, son affixe est prise) ou comme cible (elle reçoit).
// Tous les objets (équipés, coffre, armes possédées) : [clé, objet, où]
function xfAll(){const eqW=curWid(),ws=Object.keys(WPN).flatMap(c=>WPN[c].filter(w=>ownedW(w.id)).map(w=>['w:'+w.id,weaponItem(c,w.id),w.id===eqW&&c===heroCls?'arme portée':'arme']));
  return [...Object.entries(meta.gear).filter(([k,i])=>i).map(([k,i])=>['g:'+k,i,'équipé']),...allWorn().filter(i=>wornBy(i)!==heroCls).map(i=>['o:'+i.id,i,`porté par le ${CLS[wornBy(i)].n}`]),...meta.stash.map(i=>['s:'+i.id,i,'coffre']),...ws]}
// Cible d'abord (v127) : les affixes que les autres objets peuvent donner à la cible, chacune avec les objets qui la portent (du plus fort au plus faible).
// v133 : seulement les objets qui peuvent servir de source ; un objet verrouillé ou une arme de départ n'est jamais détruit, il n'apparaît pas.
function xfPool(dk){const out={};
  for(const [key,it,w] of xfAll()){if(key===dk||!xfSrcOk(key))continue;for(const k in it.aff){if(!AFF[k]||AFF[k].aby||it.aff[k]==null)continue;(out[k]||(out[k]=[])).push({key,it,w,v:affEff(it,k)})}}
  for(const k in out)out[k].sort((a,b)=>b.v-a.v);return out}
function xfAffSel(d,P){const ks=Object.keys(P),nm=k=>AFF_NAME[k]||k,srt=(a,b)=>nm(a).localeCompare(nm(b)),full=Object.keys(d.aff).length>=xfCap(d);
  const opt=k=>{const L=P[k],mine=d.aff[k]!=null?affShort(k,affEff(d,k)):'';
    return `<option value="${k}"${xf.k===k?' selected':''}>${nm(k)} (${L.length}) · max ${affShort(k,L[0].v)}${mine?` · cible ${mine}`:''}${affOff(k)?' · sans effet':''}</option>`};
  const fu=ks.filter(k=>d.aff[k]!=null).sort(srt),ad=ks.filter(k=>d.aff[k]==null).sort(srt);
  const L=xf.k&&P[xf.k],n=L?L.length:0,av=ks.length;
  return `<label class="xfaff"><span class="xfaff__k">Affixe à donner</span><span class="xfaff__box${xf.k?'':' is-empty'}"><span class="xfaff__v">${xf.k?nm(xf.k):av?'Choisir l\'affixe':'Aucune affixe disponible'}</span>${L?`<span class="xfaff__s">${d.aff[xf.k]!=null?'fusion':'ajout'} · max ${affShort(xf.k,L[0].v)} · ${n} objet${n>1?'s':''}</span>`:av?`<span class="xfaff__s">${av} affixe${av>1?'s':''} sur tes autres objets</span>`:''}<i aria-hidden="true">▾</i><select id="xfAff" aria-label="Affixe à donner à la cible"><option value="">${ks.length?'Choisir l\'affixe… (objets à sacrifier)':'Aucune sur tes autres objets'}</option>${fu.length?`<optgroup label="Déjà sur la cible · fusion">${fu.map(opt).join('')}</optgroup>`:''}${ad.length?`<optgroup label="Nouvelle affixe · ${full?'remplace une affixe':'ajout'}">${ad.map(opt).join('')}</optgroup>`:''}</select></span></label>`}
function xfCands(d,P){const L=P[xf.k];if(!L)return '';const T=v=>affShort(xf.k,NOSCALE[xf.k]?v:v*upMul(d.up));
  const rows=L.map(o=>{const st=xfState({src:o.key,dst:xf.dst,k:xf.k,rep:'',op:''}),on=xf.src===o.key,can=!!(st&&(st.ok||st.full));
    const why=!st?'':st.ok?({fuse:`fusion → ${T(st.nv)}`,up:`remplace → ${T(st.nv)}`,add:'ajout'}[st.mode]||''):st.full?'cible pleine : remplace une affixe':'déjà plus fort sur la cible';
    return `<li><button class="xfc" data-cact="xfsrc" data-arg="${o.key}" aria-pressed="${on}"${can?'':' disabled'}><span class="xfc__nm" style="color:${RARV[o.it.r]}">${esc(itemName(o.it))}</span><span class="xfc__v">${affShort(xf.k,o.v)}</span><span class="xfc__sub">${o.w} · ${RAR[o.it.r].n}${why?` · <b${can?' class="ok"':''}>${why}</b>`:''}</span>${on?'<span class="cx-pin cx-pin--src">Source</span>':''}</button></li>`}).join('');
  return `<section class="cx-section"><h3 class="cx-section__label">${AFF_NAME[xf.k]||xf.k} · ${L.length} objet${L.length>1?'s':''}</h3><p class="cx-hint" style="margin:0">Touche l'objet à sacrifier : il est détruit et son affixe passe sur la cible.</p><ul class="xfcl">${rows}</ul></section>`}
function affFinder(){
  const all=xfAll();
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
// Tout objet peut être source, sauf les objets verrouillés et les armes de départ (elles ne se détruisent pas).
const xfSrcOk=key=>{if(!key||(key[0]==='w'&&(wdef(key.slice(2))||{}).start))return false;const it=xfGet(key);return !!it&&!it.lock};
function xfOk(key,it){if(!it)return false;if(xf.pick==='src')return xfSrcOk(key)&&Object.keys(it.aff).length>0&&!(xf.dst&&xf.k&&it.aff[xf.k]==null);return key!==xf.src}
const xfPin=key=>key===xf.src?'<span class="cx-pin cx-pin--src">Source</span>':key===xf.dst?'<span class="cx-pin cx-pin--dst">Cible</span>':'';
const xfSt=key=>key===xf.src?' is-src':key===xf.dst?' is-dst':'';
function xfCell(key,it){if(afMode()==='fuse')return `<button class="cx-cell${fzSt(key,it)}" data-cact="xfsel" data-arg="${key}" ${fzOk(key,it)?'':'aria-disabled="true"'} style="--rar:${RARV[it.r]}" aria-label="${esc(itemName(it))}${it.lock?', verrouillé':''}">${cellIn(it)}${fzPin(key,it)}</button>`;
  const ok=xfOk(key,it);
  return `<button class="cx-cell${xfSt(key)}" data-cact="xfsel" data-arg="${key}" ${ok?'':'aria-disabled="true"'} style="--rar:${RARV[it.r]}" aria-label="${esc(itemName(it))}${it.lock?', verrouillé':''}${key===xf.src?', source':key===xf.dst?', cible':''}">${cellIn(it)}${xfPin(key)}</button>`}
function xfDiffCard(kind,it,where,lines,gone,top=''){const src=kind==='src';
  return `<div class="cx-diff__card cx-diff__card--${kind}${gone&&src?' is-gone':''}"><span class="cx-diff__lab">${src?'− Source · détruite':gone?'+ Cible · aperçu':'+ Cible'}</span>${top}${it?`<span class="cx-diff__nm" style="color:${RARV[it.r]}">${esc(itemName(it))}</span><span class="cx-diff__sub">${RAR[it.r].n} · ${where}</span>
    <ul><li class="cx-line cx-line--base">${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${lines}</ul>`:`<span class="cx-diff__sub">${src?(top?(xf.k?'Touche l\'objet à sacrifier dans la liste.':'Choisis l\'affixe, puis l\'objet sacrifié.'):'Choisis l\'objet source.'):'Choisis la cible.'}</span>`}</div>`}
// Onglet Forge › Affixes et fusion (v127) : deux opérations sur les mêmes objets, chacune selon son déblocage (forgeSub 'affix' ou 'fuse').
const afMode=()=>forgeSub==='fuse'?'fuse':'affix';
// Bouton ⇄ entre Source et Cible : intervertir les deux rôles si on s'est trompé (désactivé, avec la raison, quand la cible ne peut pas être sacrifiée).
const SWAP_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/></svg>';
const swapBtn=(act,ok,why)=>`<button type="button" class="cx-swap" data-cact="${act}" aria-label="Intervertir source et cible" title="${ok?'Intervertir source et cible':esc(why||'')}" ${ok?'':'disabled'}>${SWAP_SVG}</button>`;
function xfSwapWhy(){if(!xf.src&&!xf.dst)return 'Choisis d\'abord un objet.';if(!xf.dst)return '';const d=xfGet(xf.dst);if(!d)return '';
  if(!xfSrcOk(xf.dst))return d.lock?'La cible est verrouillée : elle ne peut pas devenir la source, qui est détruite.':'Une arme de départ ne peut pas devenir la source, qui est détruite.';
  if(!Object.keys(d.aff).some(k=>AFF[k]&&!AFF[k].aby))return 'La cible n\'a pas d\'affixe à donner.';return ''}
// v130 : Affixes et Fusion sont deux sous-onglets de la Forge ; plus de puces de mode.
// Tous les objets dans une seule grille, avec les onglets du coffre (Tout, Portés, Arme, Armure…) : ceux du héros choisi en tête, ceux des autres héros marqués de leur initiale. Les cases suivent le mode (xfCell).
function afGrids(){const list=invList('affix'),n=list.filter(i=>wornBy(i)).length;
  return `<section class="cx-section"><h3 class="cx-section__label">Tes objets · ${n} porté${n>1?'s':''}, armes et coffre</h3>${invToolbar(list,'affix')}<div id="invGrid">${invGrid(list,'affix')}</div></section>`}
function campAffix(){
  if(!xf.pick)xf.pick=xf.dst&&!xf.src?'src':'dst';
  let s=xfGet(xf.src);if(xf.src&&(!s||!xfSrcOk(xf.src))){xf.src='';xf.k='';s=null}
  if(s&&xf.k&&s.aff[xf.k]==null)xf.k='';
  const d=xfGet(xf.dst),wlab=k=>{if(k[0]==='w')return 'arme';if(k[0]==='g')return 'équipé';if(k[0]==='o'){const c=wornBy(xfGet(k));return c?`porté par le ${CLS[c].n}`:'porté'}return 'coffre'};if(xf.dst&&!d)xf.dst='';
  const P=d?xfPool(xf.dst):null;if(d&&xf.k&&!P[xf.k])xf.k='';
  let h=backChip()+xfSteps();
  h+=`<div class="cx-roles"><button class="cx-role cx-role--src" data-cact="xfpick" data-arg="src" aria-pressed="${xf.pick==='src'}"><span class="cx-role__k"><i>−</i>Source · détruite</span><span class="cx-role__v${s?'':' is-empty'}" ${s?`style="color:${RARV[s.r]}"`:''}>${s?esc(itemName(s)):'Choisir un objet'}</span></button>
    ${(()=>{const w=xfSwapWhy();return swapBtn('xfswap',!w,w)})()}<button class="cx-role cx-role--dst" data-cact="xfpick" data-arg="dst" aria-pressed="${xf.pick==='dst'}"><span class="cx-role__k"><i>+</i>Cible</span><span class="cx-role__v${d?'':' is-empty'}" ${d?`style="color:${RARV[d.r]}"`:''}>${d?esc(itemName(d)):'Choisir un objet'}</span></button></div>`;
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
    h+=`<div class="cx-diff">${xfDiffCard('src',s,s?wlab(xf.src):'',sLines,st&&st.ok,d?xfAffSel(d,P):'')}${xfDiffCard('dst',d,d?wlab(xf.dst):'',tLines,st&&st.ok?true:null)}</div>`;
    if(d&&xf.k)h+=xfCands(d,P);
  }
  h+=afGrids();
  h+=affFinder();
  h+=cxMore('wish','Alertes de butin : un flash quand une affixe recherchée tombe.',wishSection(),'Régler');
  return h;
}
function affixFoot(){const st=xfState(),s=xfGet(xf.src);
  if(!st){const hn=campBack?xfStepHint():'';if(hn)return `<p class="cx-hint">${hn}</p>`;
    const t=!xf.dst&&!xf.src?'Touche l\'objet qui reçoit l\'affixe : la cible.':xf.dst&&!xf.k?(xf.src?'Choisis l\'affixe : sur la source ou dans la liste déroulante.':'Choisis l\'affixe dans la liste déroulante de la source.'):xf.dst&&!xf.src?'Touche l\'objet à sacrifier dans la liste.':xf.src&&!xf.k?'Touche l\'affixe à prendre sur la source.':'';
    return t?`<p class="cx-hint">${t}</p>`:''}
  if(!st.ok)return `<p class="cx-hint">${st.full?'Touche l\'affixe à remplacer sur la cible.':st.msg}</p>`;
  const cost=st.cost||xfCost(s),poor=meta.essence<cost,both=st.fuseOk&&st.canUp;
  return `${both?`<div class="cx-chips" role="radiogroup" aria-label="Mode" style="justify-content:center"><button class="cx-chip cx-chip--sm" role="radio" data-cact="xfop" data-arg="fuse" aria-checked="${st.mode==='fuse'}">Fusionner (additionner)</button><button class="cx-chip cx-chip--sm" role="radio" data-cact="xfop" data-arg="up" aria-checked="${st.mode==='up'}">Remplacer</button></div>`:''}<div class="row"><button class="cx-btn cx-btn--ghost" data-cact="xfcancel">Annuler</button><button class="cx-btn cx-btn--primary cost-btn" data-cact="xfok" ${poor?'disabled':''}><span>${st.mode==='fuse'?'Fusionner':'Transférer'}</span>${costHtml([['ess',cost]])}</button></div>
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
  else for(const c in meta.gearBy){const g=meta.gearBy[c];for(const k in g)if(g[k]===s)g[k]=null}
  meta.essence-=cost;const dn=itemName(xfGet(xf.dst)||{name:'la cible'});toast(`${st.mode==='fuse'?'Affixe fusionnée':'Affixe transférée'} : <b>${xfV(xfGet(xf.dst)||{},k,v)}</b> sur ${esc(dn)}. ${esc(itemName(s))} est détruit.`);
  xf={src:'',k:'',dst:xfGet(xf.dst)?xf.dst:'',rep:'',pick:'src'};campSel=null}
function campForge(){
  const ups=UPG.map(u=>{const l=lv(u.k),mx=l>=u.max,c=upCost(u);
    return `<div class="up${mx?' is-max':''}"><b>${u.n}</b><p>${mx?u.d(l):(l?u.d(l)+' → ':'')+u.d(l+1)}</p><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div>
      <button class="btn buy${mx?'':' cost-btn'}" data-cact="up" data-arg="${u.k}" ${mx||meta.gold<c?'disabled':''}>${mx?'Max':`<span>Améliorer</span>${costHtml([['or',c]])}`}</button></div>`}).join('');
  const nmax=UPG.filter(u=>lv(u.k)>=u.max).length;
  return `<h3>Améliorations permanentes · ${nmax} / ${UPG.length} au maximum</h3><div class="ups">${ups}</div><p class="cx-hint" style="margin:0">Elles valent pour tous tes héros. Toutes au maximum : le prestige s'ouvre (onglet Héros › Prestige). Les talents de chaque héros sont dans l'onglet Héros.</p>`;
}
$('campBody').addEventListener('change',e=>{if(e.target.id==='xfAff'){xf.k=e.target.value;xf.rep='';xf.op='';const s=xfGet(xf.src);if(s&&(!xf.k||s.aff[xf.k]==null))xf.src='';xf.pick='src';drawCamp()}else if(e.target.id==='xfSrc'){xf={src:e.target.value,k:'',dst:xf.dst===e.target.value?'':xf.dst,rep:''};drawCamp()}else if(e.target.id==='xfDst'){xf.dst=e.target.value;xf.rep='';drawCamp()}});

Object.assign(CAMP_ACT,{
  xftake:function(a,arg,b,d){{const sc=$('campBody').parentElement.scrollTop;campBack={tab:campTab,sel:campSel,scroll:sc,label:{equip:'Héros',arsenal:arsView==='coffre'?'Coffre':'Arsenal'}[campTab]||'Héros',mode:a==='xfrecv'?'recv':'take'};
      xf=a==='xftake'?{src:arg,k:'',dst:'',rep:'',pick:'dst'}:{src:'',k:'',dst:arg,rep:'',pick:'src'};campTab='forge';forgeSub='affix';campSel=null;drawCamp();$('campBody').parentElement.scrollTop=0;return}return CAMP_GO},
  xfk:function(a,arg,b,d){{xf.k=arg;xf.rep='';xf.op=''}return CAMP_GO},
  xfpick:function(a,arg,b,d){{xf.pick=arg}return CAMP_GO},
  xfop:function(a,arg,b,d){{xf.op=arg}return CAMP_GO},
  afcat:function(a,arg,b,d){{afCat=arg;afOpen=''}return CAMP_GO},
  wish:function(a,arg,b,d){{const W=wishOf();if(W.aff[arg])delete W.aff[arg];else W.aff[arg]=true}return CAMP_GO},
  wishleg:function(a,arg,b,d){{const W=meta.wish||(meta.wish={leg:true,aff:{}});W.leg=!W.leg}return CAMP_GO},
  wishnone:function(a,arg,b,d){{if(meta.wish)meta.wish.aff={}}return CAMP_GO},
  afopen:function(a,arg,b,d){{afOpen=afOpen===arg?'':arg}return CAMP_GO},
  afdst:function(a,arg,b,d){{const it=xfGet(arg);if(!it||arg===xf.src)return;xf.dst=arg;xf.rep='';xf.op='';xf.pick=xf.src?'dst':'src'}return CAMP_GO},
  afuse:function(a,arg,b,d){{const [k,key]=arg.split('|'),it=xfGet(key);if(!it||!xfSrcOk(key)||it.aff[k]==null||key===xf.dst)return;xf.src=key;xf.k=k;xf.rep='';xf.pick='dst'}return CAMP_GO},
  xfsel:function(a,arg,b,d){if(afMode()==='fuse'){{const it=xfGet(arg);if(!fzOk(arg,it))return;
      if(arg[0]==='w'){fzc=fzc&&fzc.w===arg.slice(2)?null:{w:arg.slice(2)};fzRole='a'}
      else if(fzRole==='b'){if(fzc&&fzc.b===it.id){fzc.b=null;fzc.sel=null}else{fzSetB(it);xfJump=true}}
      else{if(fzc&&fzc.a===it.id){fzc=null;fzRole='a'}else{fzSetA(it);xfJump=true}}}return CAMP_GO}{const it=xfGet(arg);if(!xfOk(arg,it))return;
      if(xf.pick==='src'){if(arg===xf.src){xf.src='';if(!xf.dst)xf.k=''}else{xf.src=arg;if(!(xf.k&&it.aff[xf.k]!=null))xf.k='';if(xf.dst===arg)xf.dst='';xfJump=true}xf.rep='';if(xf.src&&!xf.dst)xf.pick='dst'}
      else{if(arg===xf.dst)xf.dst='';else{xf.dst=arg;xfJump=true}xf.rep='';xf.op='';if(xf.dst&&!xf.src)xf.pick='src'}}return CAMP_GO},
  xfrep:function(a,arg,b,d){{xf.rep=arg}return CAMP_GO},
  xfswap:function(a,arg,b,d){{if(xfSwapWhy())return;const s0=xf.src,d0=xf.dst;xf.src=d0;xf.dst=s0;const ns=xfGet(xf.src);if(xf.k&&!(ns&&ns.aff[xf.k]!=null))xf.k='';xf.rep='';xf.op='';xf.pick=!xf.src?'src':'dst';if(!xf.dst)xf.pick='dst'}return CAMP_GO},
  xfcancel:function(a,arg,b,d){{xf={src:'',k:'',dst:'',rep:'',pick:'dst'}}return CAMP_GO},
  xfsrc:function(a,arg,b,d){{const it=xfGet(arg);if(!it||!xfSrcOk(arg)||arg===xf.dst||!xf.k||it.aff[xf.k]==null)return;xf.src=xf.src===arg?'':arg;xf.rep='';xf.op=''}return CAMP_GO},
  xfok:function(a,arg,b,d){{xfDo()}return CAMP_GO},
  up:function(a,arg,b,d){{const u=UPG.find(x=>x.k===arg),c=upCost(u);if(meta.gold>=c&&lv(u.k)<u.max){meta.gold-=c;meta.up[u.k]=lv(u.k)+1}}return CAMP_GO},
});
CAMP_ACT.xfrecv=CAMP_ACT.xftake;
