// Crypte des Cendres — gearview.js : Héros › Équipement (un emplacement à la fois) et cartes des équipements enregistrés. Découpé de inv.js en v145.
/* ---------- Héros › Équipement (v137) : un emplacement à la fois ---------- */
// Les emplacements en haut ; dessous, l'objet porté puis tous les objets possibles pour cet emplacement (coffre et autres héros ;
// pour l'arme, les armes du héros), classés par Puissance, avec l'écart si on l'équipe. Toucher une ligne ouvre la fiche ancrée.
const GEAR_ALL=['arme','armure','amulette','bottes','anneau','anneau2','dos'],GEAR_PAGE=40;
let gearSlot='arme',gearSort='pow',gearMore=0;
const gearOn=()=>campTab==='equip'&&heroSub==='gear';
// Case visée par la fiche et par « Équiper » : l'emplacement ouvert dans Héros › Équipement s'il convient à l'objet (2e anneau compris), sinon tgtKey.
function slotFor(eq,it){if(it&&!it.wid&&gearOn()&&!$('camp').hidden&&GEAR_KEYS().includes(gearSlot)&&keySlot(gearSlot)===it.slot)return gearSlot;return it?tgtKey(eq,it):null}
// Puissance et survie de l'équipement e avec x dans l'emplacement k (une arme compte avec ses propres mods et sa maîtrise).
const gearVal=(e,k,x)=>k==='arme'?withWeapon(e,x.wid,eqVal):eqVal({...e,[k]:x});
// Objets possibles : armes possédées du héros (sauf la portée) ; objets du coffre et ceux que portent les autres héros.
function gearPool(k){if(k==='arme')return WPN[heroCls].filter(w=>ownedW(w.id)&&w.id!==curWid()).map(w=>weaponItem(heroCls,w.id));
  const s=keySlot(k);return [...meta.stash.filter(i=>i.slot===s),...allWorn().filter(i=>i.slot===s&&wornBy(i)!==heroCls)]}
function gearRows(k){return memo('gr|'+heroCls+'|'+k+'|'+gearSort+'|'+meta.stash.length,()=>{const e=curEq(),b=eqVal(e);
  const L=gearPool(k).map(it=>{const v=gearVal(e,k,it);return {it,v,dp:b.p?v.p/b.p-1:0,dv:b.v?v.v/b.v-1:0,gt:eqGt(v,b)}});
  const f=gearSort==='pow'?(x,y)=>y.v.p-x.v.p||y.v.v-x.v.v:gearSort==='new'?(x,y)=>(y.it.wid?-1:y.it.id)-(x.it.wid?-1:x.it.id):(x,y)=>(invSortFn[gearSort]||invSortFn.rar)(x.it,y.it);
  return {L:L.sort(f),b}})}
const gearList=()=>gearRows(gearSlot).L.map(r=>r.it);
const gPct=x=>`${x>=0?'+':'−'}${fmtN(Math.abs(x*100))} %`;
function gearRow(r){const it=r.it,R=RAR[it.r],w=wornBy(it),eq=Math.abs(r.dp)<5e-4;
  let sub;if(it.wid){const mods=(meta.wload[it.wid]||[]).filter(Boolean).length,mt=(meta.wmast[it.wid]||{r:0}).r,sp=wSpares(it.wid).length;sub=`${R.n} · ${rkTxt(it.up)} · maîtrise ${mt} / 10 · ${mods} mod${mods>1?'s':''}${sp?` · ${sp} double${sp>1?'s':''}`:''}`}
  else sub=`${R.n} · niveau ${it.lvl} · ${rkTxt(it.up)}${w?` · porté ${parCls(w)}`:''}`;
  const dv=Math.abs(r.dv)>=.005?`<small>survie ${gPct(r.dv)}</small>`:'';
  return `<button class="gearr${isSel(it)?' is-sel':''}${r.gt?' is-up':''}" ${it.wid?`data-wsel="${it.wid}"`:`data-stash="${it.id}"`} aria-label="${esc(itemName(it))}, ${R.n.toLowerCase()}${w?', porté '+parCls(w):''} : Puissance ${eq?'égale':gPct(r.dp)}${r.gt?', meilleur que ton équipement':''}">
    <span class="cx-cell gearr__ic" style="--rar:${RARV[it.r]}" aria-hidden="true">${cellIn(it)}${whoTag(w)}</span>
    <span class="gearr__t"><b style="color:${R.c}">${esc(itemName(it))}</b><small>${sub}</small></span>
    <span class="gearr__d ${eq?'is-same':r.dp>0?'is-gain':'is-loss'}" aria-hidden="true"><b>${eq?'=':gPct(r.dp)}</b><small>Puissance</small>${dv}</span></button>`}
// L'objet porté dans l'emplacement k : ce qu'il apporte ; le toucher ouvre sa fiche (Verrouiller, Retirer, Fusionner, affixes).
function gearCur(k,e,b){const it=e[k],G=GLYPH[keySlot(k)];
  if(!it)return `<div class="gearcur is-empty"><span class="cx-cell gearr__ic" style="--rar:#5c4a66" aria-hidden="true">${G}</span><span class="gearr__t"><b>Rien de porté</b><small>Choisis un objet dans la liste.</small></span></div>`;
  const R=RAR[it.r];let gain;
  if(k==='arme'){const mods=(meta.wload[it.wid]||[]).filter(Boolean).length,mt=(meta.wmast[it.wid]||{r:0}).r;gain=`${fmtN(it.base.v*upMul(it.up))} dégâts de base · maîtrise ${mt} / 10 · ${mods} mod${mods>1?'s':''}`}
  else{const v=eqVal({...e,[k]:null}),dp=b.p?1-v.p/b.p:0,dv=b.v?1-v.v/b.v:0;gain=`Apporte ${fmtN(Math.max(0,dp)*100)} % de ta Puissance${dv>=.005?` et ${fmtN(dv*100)} % de ta survie`:''}`}
  const af=Object.keys(it.aff).length;
  return `<button class="gearcur${campSel&&campSel.slot===k?' is-sel':''}" data-slot="${k}" aria-label="${SLOT[k]} : ${esc(itemName(it))}, voir sa fiche">
    <span class="cx-cell gearr__ic" style="--rar:${RARV[it.r]}" aria-hidden="true">${cellIn(it)}</span>
    <span class="gearr__t"><b style="color:${R.c}">${esc(itemName(it))}</b><small>${R.n}${it.wid?'':` · niveau ${it.lvl}`} · ${rkTxt(it.up)} · ${af} affixe${af>1?'s':''}${it.seal?' · sceau':''}</small><small>${gain}</small></span>
    <span class="gearcur__go" aria-hidden="true">Fiche ›</span></button>`}
function gslotBtn(k,e,plan){const on=k===gearSlot,lab=SLOT[k];
  if(k!=='arme'&&!slotOpen(k)){const u=SLOT_U.find(x=>x.k===k),can=slotCan(u);
    return `<button class="gslot gslot--lock" role="tab" aria-selected="${on}" data-cact="gslot" data-arg="${k}" aria-label="${lab} verrouillé"><span class="gslot__i">${LOCK_SVG}</span><small>${lab}</small>${can?'<span class="dot" aria-hidden="true"></span>':''}</button>`}
  const it=e[k],up=!!plan[k];
  return `<button class="gslot${it?'':' is-empty'}${up?' is-up':''}" role="tab" aria-selected="${on}" data-cact="gslot" data-arg="${k}" style="--rar:${it?RARV[it.r]:'#5c4a66'}" aria-label="${lab}${it?' : '+esc(itemName(it)):' : vide'}${up?', meilleur objet disponible':''}"><span class="gslot__i">${GLYPH[keySlot(k)]}</span><small>${lab}</small></button>`}
function gearView(){
  if(!GEAR_ALL.includes(gearSlot))gearSlot='arme';
  const e=curEq(),k=gearSlot,open=k==='arme'||slotOpen(k),plan=bestPlan(e,meta.stash,true);
  const nc=['arms','sets','slots'].map(newCard).join('');
  const more=cxMore('equip_gear','Touche un emplacement, puis un objet pour sa fiche.','<p>La liste montre tous tes objets pour cet emplacement : ceux du coffre et ceux que portent tes autres héros (pastille A, G ou M). Le pourcentage à droite est l\'écart de Puissance si tu l\'équipes à la place de l\'objet porté ; l\'écart de survie (vie, réduction, régénération) s\'affiche quand il compte. Le triangle vert marque un objet meilleur que le tien : plus de Puissance, ou autant de Puissance et plus de survie.</p><p>Touche une ligne : sa fiche le compare affixe par affixe et propose Équiper, Verrouiller, Fusionner, Prendre ou Recevoir une affixe, Recycler. Pour l\'arme, la liste montre les armes de ce héros, chacune avec son rang, sa maîtrise et ses propres mods. Le 2e anneau se remplit depuis son propre emplacement.</p>');
  const strip=`<div class="gslots" role="tablist" aria-label="Emplacements">${GEAR_ALL.map(s=>gslotBtn(s,e,plan)).join('')}</div>`;
  if(!open)return nc+setsHtml()+more+strip+`<p class="cx-hint" style="margin:0">${SLOT[k]} : emplacement verrouillé ${pourCls(heroCls)} ; chaque héros débloque les siens.</p>`+(slotUnlockHtml()||lockedHtml('slots'));
  const {L,b}=gearRows(k),show=L.slice(0,GEAR_PAGE*(1+gearMore)),rest=L.length-show.length;
  const sc=(v,l)=>`<button class="cx-chip cx-chip--sm" role="radio" aria-checked="${gearSort===v}" data-cact="gsort" data-arg="${v}">${l}</button>`;
  const nb=L.filter(r=>r.gt).length,isW=k==='arme';
  const empty=isW?`Aucune autre arme ${deCls(heroCls)}. Les armes communes à rares tombent des monstres ; les légendaires et plus se fabriquent (Arsenal › Recettes).`:`Aucun autre objet pour cet emplacement. Sors vivant d'une mission pour en ramener ; les plus rares se fabriquent (Arsenal › Recettes).`;
  return `${nc}${setsHtml()}${more}${strip}
    <section class="cx-section"><h3 class="cx-section__label">${SLOT[k]} · porté</h3>${gearCur(k,e,b)}</section>
    <section class="cx-section"><h3 class="cx-section__label">${isW?`Tes armes ${deCls(heroCls)}`:'Tes objets'} · ${L.length}${nb?` · ${nb} meilleur${nb>1?'s':''}`:''}</h3>
      ${L.length>1?`<div class="cx-chips" role="radiogroup" aria-label="Trier">${sc('pow','Puissance')}${sc('rar','Rareté')}${isW?'':sc('lvl','Niveau')+sc('new','Récents')}</div>`:''}
      ${L.length?`<div class="gearl">${show.map(gearRow).join('')}</div>${rest?`<button class="cx-btn cx-btn--sm cx-btn--block gridmore" data-cact="gmore">Afficher ${Math.min(GEAR_PAGE,rest)} de plus · encore ${rest}</button>`:''}`:`<p class="cx-hint" style="margin:0">${empty}</p>`}
    </section>
    <div class="cx-actions hacts" style="margin:0"><button class="cx-btn cx-btn--sm" data-cact="gocoffre" data-arg="${keySlot(k)}" aria-label="Ouvrir le coffre, filtré sur ${SLOT[keySlot(k)].toLowerCase()}">Ouvrir le coffre · ${SLOT[keySlot(k)]}</button><button class="cx-btn cx-btn--sm" data-cact="goheros">Par héros</button></div>`;
}
// Héros › Équipements enregistrés : jusqu'à SET_MAX par héros ; toucher un équipement le porte (chaque objet repris dans le coffre ou sur un autre héros).
// v143 : aperçu sous le héros (onglet Héros) et en haut de Héros › Équipement ; l'équipement porté en dernier est « en cours » (act) :
// changé ensuite, il se montre « modifié » et « Mettre à jour » range les changements dedans.
const setOn=(s,eq=curEq())=>{const g=s.g||{};return GEAR_KEYS().every(k=>!(k in g)||(g[k]==null?!eq[k]:eq[k]&&eq[k].id===g[k]))&&s.w===curWid()&&setModsSame(s)};
const setExtra=s=>{if(!('hm' in s))return '';const n=[...(s.wm||[]),...(s.hm||[]),...(s.pm||[]),s.au].filter(Boolean).length,pe=s.pet!=null&&meta.pets.find(p=>p.uid===s.pet);
  return `${n} mod${n>1?'s':''}${pe?' · '+esc(PETS[pe.t].n):s.pet!=null?' · familier introuvable':''}`};
// Aperçu : l'arme puis chaque emplacement enregistré, à la couleur de la rareté (vide estompé, introuvable en pointillés rouges)
function setMinis(s){const w=s.w?`<i class="smini${ownedW(s.w)?'':' miss'}" style="--c:${ownedW(s.w)?RAR[wdef(s.w).r].c:'var(--muted)'}" title="${esc(wdef(s.w).n)}">${GLYPH.arme}</i>`:'';
  const g=s.g||{};return w+GEAR_KEYS().filter(k=>k in g).map(k=>{const id=g[k],it=id==null?null:findItem(id);
    return `<i class="smini${id==null?' is-empty':!it?' miss':''}" style="--c:${it?RAR[it.r].c:'var(--line-strong)'}" title="${SLOT[k]}${it?' : '+esc(itemName(it)):id!=null?' : introuvable':' : vide'}">${GLYPH[keySlot(k)]}</i>`}).join('')}
function setCard(s,i,eq){const on=setOn(s,eq),mod=!on&&s.act,st=on?'porté':mod?'modifié':'';
  return `<button class="scard${on?' is-on':mod?' is-mod':''}" data-cact="setwear" data-arg="${i}" aria-pressed="${on}" aria-label="${esc(s.n)}${on?', porté':mod?', en cours, modifié depuis':', toucher pour le porter'}">
    <span class="scard__h"><b>${esc(s.n)}</b>${st?`<span class="scard__s">${st}</span>`:''}</span><span class="scard__ic" aria-hidden="true">${setMinis(s)}</span>${'hm' in s?`<small>${setExtra(s)}</small>`:''}</button>`}
const setAddCard=()=>`<button class="scard scard--add" data-cact="setsave" data-arg=""><span class="scard__plus" aria-hidden="true">+</span><small>Enregistrer l'équipement porté</small></button>`;
// Onglet Héros : aperçu sous le héros, toucher pour porter
function setsHero(){if(!isUnl('sets'))return '';const L=setsOf(),eq=curEq();
  return `<section class="cx-section hsets" aria-label="Équipements enregistrés"><h3 class="cx-section__label">Équipements enregistrés</h3>
    <div class="scards">${L.map((s,i)=>setCard(s,i,eq)).join('')}${L.length<SET_MAX?setAddCard():''}</div>
    ${L.length?'<div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="hsub" data-arg="gear">Modifier dans Équipement</button></div>':''}</section>`}
// Héros › Équipement, en haut : les équipements, Mettre à jour l'équipement en cours, en enregistrer un nouveau ; renommer, remplacer, supprimer repliés
function setsHtml(){if(!isUnl('sets'))return '';const L=setsOf(),eq=curEq(),ai=L.findIndex(s=>s.act),a=L[ai],mod=a&&!setOn(a,eq);
  const rows=L.map((s,i)=>`<div class="cx-row cx-set${setOn(s,eq)?' is-on':''}"><span class="cx-row__k"><input class="cx-setname" data-setname="${i}" value="${esc(s.n)}" maxlength="24" aria-label="Nom de l'équipement ${i+1}"></span>
      <span class="cx-set__act"><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="setsave" data-arg="${i}" aria-label="Remplacer ${esc(s.n)} par l'équipement porté">Remplacer</button><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="setdel" data-arg="${i}" aria-label="Supprimer ${esc(s.n)}">${XSVG.x}</button></span></div>`).join('');
  return `<section class="cx-section" id="setsSec"><h3 class="cx-section__label">Équipements enregistrés · ${L.length} / ${SET_MAX}</h3>
    ${L.length?`<div class="scards">${L.map((s,i)=>setCard(s,i,eq)).join('')}</div>`:''}
    <div class="cx-actions sacts" style="margin:0">${mod?`<button class="cx-btn cx-btn--sm cx-btn--primary" data-cact="setsave" data-arg="${ai}" aria-label="Mettre à jour ${esc(a.n)} avec l'équipement porté">Mettre à jour « ${esc(a.n)} »</button>`:''}<button class="cx-btn cx-btn--sm" data-cact="setsave" data-arg="" ${L.length>=SET_MAX?'disabled':''}>${L.length?'Enregistrer comme nouveau':'Enregistrer l\'équipement porté'}</button></div>
    ${L.length?cxMore('sets_edit','Touche un équipement pour le porter, puis change ce que tu veux en dessous.',`<p>Porter un équipement reprend chaque objet dans le coffre ou sur un autre héros, et remet l'arme, les mods, l'aura, le familier et ses mods. Il devient l'équipement en cours : si tu changes ensuite un objet ou un mod, sa carte passe à « modifié » et « Mettre à jour » enregistre les changements dedans. Chaque héros a ses équipements, ${SET_MAX} au plus.</p><div class="cx-rows">${rows}</div>`,'Renommer, remplacer'):`<p class="cx-hint" style="margin:0">Enregistre l'arme, les objets portés, les mods du héros et de l'arme, le familier et ses mods, pour tout remettre plus tard d'un geste. Chaque héros a ses équipements.</p>`}</section>`}
// Héros › Emplacements à débloquer (fragments de harnais, lâchés par les Gardiens).
const slotCan=u=>!slotOpen(u.k)&&(!u.need||slotOpen(u.need))&&(meta.hfrag|0)>=u.hf&&meta.gold>=u.gold;
function slotUnlockHtml(){if(!isUnl('slots'))return '';const next=SLOT_U.filter(u=>!slotOpen(u.k));if(!next.length)return '';const hf=meta.hfrag|0;
  return `<section class="cx-section"><h3 class="cx-section__label">Emplacements ${deCls(heroCls)} · ${hf} fragment${hf>1?'s':''} de harnais</h3><div class="cx-rows">${next.map(u=>{const ok=!u.need||slotOpen(u.need),can=ok&&hf>=u.hf&&meta.gold>=u.gold;
    return `<div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">${u.n}<small>${ok?`${u.hf} fragments de harnais et ${u.gold} or · tu as ${hf} fragment${hf>1?'s':''}`:`Après l'${SLOT_U.find(x=>x.k===u.need).n}`}</small></span><button class="cx-btn cx-btn--sm cost-btn${can?' cx-btn--primary':''}" data-cact="slotopen" data-arg="${u.k}" style="margin:0" ${can?'':'disabled'}><span>Débloquer</span>${ok?costHtml([['hf',u.hf],['or',u.gold]]):''}</button></div>`}).join('')}</div>
    <p class="cx-hint" style="margin:0">Chaque héros débloque ses emplacements ; les fragments de harnais sont communs. Ils tombent seulement sur les Gardiens (3 % en Normal, jusqu'à 11 % en Tourment X).</p></section>`}
// Arsenal › Coffre : tout ce que tu possèdes, armes et objets portés compris (pastille du héros qui les porte).
function campCoffre(){const list=invList('equip'),n=stashN();
  return `<section class="cx-section"><h3 class="cx-section__label">Coffre · ${n} objet${n>1?'s':''}</h3>
    ${n?invToolbar(list,'equip'):''}<div id="invGrid">${invGrid(list,'equip')}</div>${n?`<p class="cx-hint" style="margin:0">La pastille A, G ou M montre le héros qui porte l'objet (Archer, Guerrier, Magicien) ; « Par héros », en haut, les range héros par héros.${isUnl('recy')?' Pour recycler : onglet Recycler, en haut de l\'Arsenal.':''}</p>`:''}</section>`}

