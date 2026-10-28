// Crypte des Cendres — inv.js : inventaire unique (barre de recherche, tri, filtres), fiche ancrée (cx-dock),
// parcours « Prendre / Recevoir une affixe » avec retour, et toasts « Annuler ».
let invQ='';
const SORT_N={rar:'Rareté',up:'Rang',lvl:'Niveau',new:'Récents'};
const invSortFn={rar:(a,b)=>b.r-a.r||(b.up||0)-(a.up||0)||b.lvl-a.lvl,up:(a,b)=>(b.up||0)-(a.up||0)||b.r-a.r,lvl:(a,b)=>b.lvl-a.lvl||b.r-a.r,new:(a,b)=>b.id-a.id};
const norm=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function invMatch(it,q){if(!q)return true;const n=norm(q);
  if(norm(itemName(it)).includes(n)||norm(it.type||'').includes(n)||norm(SLOT[it.slot]).includes(n)||norm(RAR[it.r].n).includes(n))return true;
  for(const k in it.aff){if(norm(AFF_NAME[k]||k).includes(n)||norm(AFF[k].t(it.aff[k])).includes(n))return true}return false}
// Armes possédées, présentées comme des objets du coffre (verrouillables, fusionnables, recyclables). worn : avec celles que portent les héros.
function invWeapons(worn){const out=[];for(const c of [heroCls,...Object.keys(CLS).filter(x=>x!==heroCls)])for(const w of WPN[c])if(ownedW(w.id)&&(worn||curWid(c)!==w.id))out.push(weaponItem(c,w.id));return out}
// Sélection d'un objet du coffre : dans le coffre, porté par le héros choisi (slot), porté par un autre héros (oth = « classe|emplacement »), ou arme.
const selOf=it=>{if(it.wid)return {wpn:it.wid};const c=wornBy(it);if(c){const k=wornSlot(it,c);return c===heroCls?{slot:k}:{oth:c+'|'+k}}return {stash:it.id}};
const isSel=it=>{if(!campSel)return false;const s=selOf(it);return Object.keys(s).length===Object.keys(campSel).length&&Object.keys(s).every(k=>campSel[k]===s[k])};
// Coffre de l'Arsenal : tout ce que tu possèdes, objets portés compris (marqués du héros qui les porte). Filtre « Portés » : seulement ceux-là.
// kind : 'equip' (coffre, objets portés compris), 'recy' (recyclage : rien de porté), 'affix' (Forge › Affixes et fusion : tout, comme 'equip', les objets du héros choisi en tête).
function invList(kind){const all=kind==='equip'||kind==='affix',F=!all&&stF==='porte'?'all':stF,pool=all?[...meta.stash,...allWorn()]:meta.stash;
  const slotOk=i=>F==='all'||(F==='porte'?!!wornBy(i):i.slot===F);
  const st=pool.filter(i=>slotOk(i)&&invMatch(i,invQ));const ws=!(F==='all'||F==='arme'||F==='porte')?[]:invWeapons(all).filter(i=>(F!=='porte'||!!wornBy(i))&&invMatch(i,invQ));
  const nid=i=>i.wid?-1:i.id;const f=invSortFn[stS]||invSortFn.rar,L=[...st,...ws].sort(stS==='new'?(a,b)=>nid(b)-nid(a):f);
  if(kind!=='affix')return L;const mine=i=>wornBy(i)===heroCls;return [...L.filter(mine),...L.filter(i=>!mine(i))]}
function invCountTxt(list){const nb=list.filter(i=>!wornBy(i)&&better(i)).length,nw=list.filter(i=>wornBy(i)).length;return `${list.length} objet${list.length>1?'s':''}${nw?` · ${nw} porté${nw>1?'s':''}`:''}${nb?` · ▲ ${nb} meilleur${nb>1?'s':''} que ton équipement`:''}`}
// Pastille du héros qui porte l'objet (initiale à sa couleur).
const whoTag=c=>c?`<span class="cwho" style="--wc:${CLS[c].col}" title="Porté : ${CLS[c].n}">${CLS[c].n[0]}</span>`:'';
// Barre collée : recherche, tri, filtres par emplacement, compteur. kind = 'equip' (Héros) ou 'affix' (Forge › Affixes et fusion).
function invToolbar(list,kind){const all=kind==='equip'||kind==='affix',W=invWeapons(all),G2=all?[...meta.stash,...allWorn()]:meta.stash,counts={all:G2.length+W.length,arme:W.length,porte:allWorn().length+W.filter(w=>wornBy(w)).length};for(const it of G2)counts[it.slot]=(counts[it.slot]||0)+1;
  const ch=(k,l)=>`<button class="cx-chip cx-chip--sm" data-cact="sfilter" data-arg="${k}" aria-pressed="${stF===k}">${l} <span class="n">${counts[k]||0}</span></button>`;
  return `<div class="cx-toolbar"><div class="cx-toolbar__row"><label class="cx-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" data-inv="q" value="${esc(invQ)}" placeholder="Chercher une affixe : vitesse, critique…" aria-label="Chercher dans le coffre" enterkeyhint="search"></label>
    <select class="cx-sort" data-inv="sort" aria-label="Trier le coffre">${Object.keys(SORT_N).map(k=>`<option value="${k}"${stS===k?' selected':''}>${SORT_N[k]}</option>`).join('')}</select></div>
    <div class="cx-chips">${ch('all','Tout')}${all?ch('porte','Portés'):''}${ch('arme','Arme')}${['armure','amulette','bottes','anneau',...(counts.dos||stF==='dos'?['dos']:[])].map(k=>ch(k,SLOT[k])).join('')}</div>
    <span class="cx-count" id="invCount">${invCountTxt(list)}</span></div>`}
/* Grilles longues (v135) : 120 cases à la fois ; « Afficher plus » ajoute les suivantes. Retour à 120 quand la vue, le filtre,
   la recherche ou le tri change. L'objet choisi reste toujours affiché. */
const GRID_PAGE=120;let gridMore=0,gridKey='';
function gridCut(list,isOn){const key=[campTab,arsView,forgeSub,stF,invQ,stS,[...recyR].join()].join('|');if(key!==gridKey){gridKey=key;gridMore=0}
  let n=GRID_PAGE*(1+gridMore);const i=isOn?list.findIndex(isOn):-1;if(i>=n)n=Math.ceil((i+1)/GRID_PAGE)*GRID_PAGE;
  return {show:list.length>n?list.slice(0,n):list,rest:Math.max(0,list.length-n)}}
const gridMoreBtn=rest=>rest?`<button class="cx-btn cx-btn--sm cx-btn--block gridmore" data-cact="gridmore">Afficher ${Math.min(GRID_PAGE,rest)} de plus · encore ${rest}</button>`:'';
function invGrid(list,kind){if(!list.length)return `<p class="cx-hint" style="margin:0">${meta.stash.length?(invQ?'Aucun objet ne correspond à ta recherche.':'Aucun objet de ce type.'):'Ton coffre est vide. Sors vivant d\'une mission pour y ramener les objets trouvés.'}</p>`;
  if(kind==='affix'){const C=gridCut(list,it=>{const k=afKey(it);return !!(xfSt(k)||fzSt(k,it))});return `<div class="cx-cells">${C.show.map(it=>xfCell(afKey(it),it).replace('</button>',whoTag(wornBy(it))+'</button>')).join('')}</div>${gridMoreBtn(C.rest)}`}
  const C=gridCut(list,isSel);
  return `<div class="grid">${C.show.map(it=>{const w=wornBy(it),tag=whoTag(w);return (it.wid?cellHtml(it,'wsel',isSel(it),!w&&it.cls===heroCls&&better(it)).replace(`data-wsel="${it.id}"`,`data-wsel="${it.wid}"`):cellHtml(it,'stash',isSel(it),!w&&better(it))).replace('</button>',tag+'</button>')}).join('')}</div>${gridMoreBtn(C.rest)}`}
function invRefresh(){if(drawCache)return invRefresh0();drawCache=new Map();try{return invRefresh0()}finally{drawCache=null}}
function invRefresh0(){const g=$('invGrid');if(!g)return;if(isRecy()){g.innerHTML=recyCells();return}const kind=campTab==='forge'?'affix':'equip',list=invList(kind);g.innerHTML=invGrid(list,kind);const c=$('invCount');if(c)c.textContent=invCountTxt(list)}
$('campBody').addEventListener('input',e=>{if(e.target.dataset.inv==='q'){invQ=e.target.value;invRefresh()}});
$('campBody').addEventListener('change',e=>{if(e.target.dataset.inv==='sort'){stS=e.target.value;drawCamp()}});

/* ---------- Onglet Héros ---------- */
function keyStats(St){return `<div class="cx-keystats"><div><span>Puissance</span><b>${Math.round(power(St))}</b></div><div><span>Vie</span><b>${Math.round(St.hp)}</b></div><div><span>Réduction</span><b>${Math.round(St.armor)} %</b></div></div>`}
// Vues de l'Arsenal qui montrent le coffre (fiche ancrée) ou le recyclage.
const isCoffre=()=>campTab==='arsenal'&&arsView==='coffre',isRecy=()=>campTab==='arsenal'&&arsView==='recy',isHerosV=()=>campTab==='arsenal'&&arsView==='heros';
// Arsenal › Par héros : ce que porte chaque héros, le héros joué en premier. Toucher un objet ouvre sa fiche (le donner au héros joué, le retirer…).
function herosView(){const order=[heroCls,...Object.keys(CLS).filter(c=>c!==heroCls)];
  return order.map(c=>{const g=meta.gearBy[c]||{},wid=curWid(c),w=wdef(wid),ks=Object.keys(SLOT).filter(k=>k!=='arme'&&slotOpen(k,c)),n=ks.filter(k=>g[k]).length,me=c===heroCls;
    const lk=it=>it.lock?`<span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:'';
    const cells=[`<button class="slot${campSel&&campSel.wpn===wid?' sel':''}" data-wsel="${wid}"><span>Arme${(meta.wlv||{})[wid]?' · '+rkTxt(meta.wlv[wid]):''}</span><strong style="color:${RAR[w.r].c}">${esc(w.n)}</strong></button>`,
      ...ks.map(k=>{const it=g[k];
        return it?`<button class="slot${isSel(it)?' sel':''}" data-stash="${it.id}"><span>${SLOT[k]}${it.up?' · '+rkTxt(it.up):''}</span><strong style="color:${RAR[it.r].c}">${esc(itemName(it))}${lk(it)}</strong></button>`:`<div class="slot"><span>${SLOT[k]}</span><strong style="color:var(--muted)">Vide</strong></div>`})];
    return `<section class="cx-section hgear"><h3 class="cx-section__label"><span class="cwho" style="--wc:${CLS[c].col}" aria-hidden="true">${CLS[c].n[0]}</span>${CLS[c].n}${me?' · héros joué':''} · ${n} objet${n>1?'s':''}</h3><div class="slots">${cells.join('')}</div>
      ${n?'':`<p class="cx-hint" style="margin:0">${me?'Rien de porté : touche « Équiper le meilleur » dans l\'onglet Héros.':`Rien de porté : choisis le ${CLS[c].n} en haut de l'onglet Héros, puis « Équiper le meilleur ».`}</p>`}</section>`}).join('')}
const stashN=()=>meta.stash.length+allWorn().length+invWeapons(true).length;
// Porter un objet dans un emplacement : l'objet qu'il remplace retourne au coffre.
const wearGear=(sl,it)=>{const old=meta.gear[sl];if(old)meta.stash.push(old);meta.gear[sl]=it};
// Onglet Héros (v130, v137) : le héros au centre, ses emplacements autour, ses chiffres clés et six tuiles :
// Équipement (heroSub 'gear'), Sorts et talents, Prestige, Mods et Familier (campTab 'mods' et 'pets'), Apparence.
// Toucher un emplacement ouvre Héros › Équipement sur cet emplacement.
function heroSlot(k,eq){const it=eq[k],sel=gearOn()&&gearSlot===k;
  if(!slotOpen(k)){const u=SLOT_U.find(x=>x.k===k),ok=!u.need||slotOpen(u.need),hf=meta.hfrag|0,can=slotCan(u);
    return `<button class="hslot hslot--lock${can?' is-ready':''}" data-cact="gslot" data-arg="${k}" aria-label="${SLOT[k]} verrouillé${ok?` : ${Math.min(hf,u.hf)} fragments de harnais sur ${u.hf}`:''}"><span class="hslot__lk" aria-hidden="true">${LOCK_SVG}</span><small>${ok&&isUnl('slots')?`${Math.min(hf,u.hf)} / ${u.hf}`:SLOT[k]}</small>${can?'<span class="dot" aria-hidden="true"></span>':''}</button>`}
  const up=it&&it.up?`<span class="cx-cell__up">R${it.up+1}</span>`:'',lk=it&&it.lock?`<span class="cx-cell__lock">${LOCK_SVG}</span>`:'';
  return `<button class="hslot${it?'':' is-empty'}${sel?' is-sel':''}" data-cact="gslot" data-arg="${k}" style="--rar:${it?RARV[it.r]:'#5c4a66'}" aria-label="${SLOT[k]} : ${it?esc(itemName(it))+', '+RAR[it.r].n.toLowerCase():'vide'}">${GLYPH[k==='anneau2'?'anneau':k]}${up}${lk}<small>${SLOT[k]}</small></button>`}
// En-tête des vues du héros : choix du héros, retour, titre.
function heroCls3(){return `<div class="cx-tabs hcls" role="tablist" aria-label="Héros">${Object.keys(CLS).map(c=>`<button class="cx-tab" role="tab" data-cact="hcls" data-arg="${c}" aria-selected="${c===heroCls}" style="--hc:${CLS[c].col}">${CLS[c].n}</button>`).join('')}</div>`}
const heroHead=t=>`${heroCls3()}<button class="cx-back" data-cact="hsub" data-arg="main">Retour au héros</button><h3 class="hsub__t">${t}</h3>`;
const HT_SVG={gear:'<svg viewBox="0 0 24 24"><path d="M6 4l6 2 6-2 2.5 5-3 2v9h-11v-9l-3-2z"/><path d="M9.5 11.5h5"/></svg>',
  tal:'<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3L22 9l-5 4.8L18.2 21 12 17.5 5.8 21 7 13.8 2 9l7.1-.7z"/></svg>',
  prest:'<svg viewBox="0 0 24 24"><path d="M3 18h18l-2-10-4 4-3-7-3 7-4-4z"/><path d="M3 21h18"/></svg>',
  mods:'<svg viewBox="0 0 24 24"><path d="M12 2.5 20 12l-8 9.5L4 12z"/><path d="M4 12h16M12 2.5 9 12l3 9.5 3-9.5z"/></svg>',
  pets:'<svg viewBox="0 0 24 24"><circle cx="6.5" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="17.5" cy="10" r="2"/><path d="M8 18.5c0-3.2 1.8-5.5 4-5.5s4 2.3 4 5.5c0 1.6-1.4 2.5-4 2.5s-4-.9-4-2.5z"/></svg>',
  look:'<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-2 0-3 2-1 3-1c2.5 0 4-1.5 4-4 0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.4"/><circle cx="11" cy="7" r="1.4"/><circle cx="16" cy="8" r="1.4"/></svg>'};
function campEquip(){
  const eq=curEq(),St=stats(eq);
  if(heroSub==='tal')return heroHead('Sorts, ultimes et talents')+heroTalents();
  if(heroSub==='prest')return heroHead('Prestige')+prestSection();
  if(heroSub==='look')return heroHead('Apparence')+lookHtml();
  if(heroSub==='gear')return heroHead('Équipement')+gearView();
  const L=['arme','armure','amulette','bottes'],R=['anneau','anneau2','dos'];
  const o=prOf(heroCls),prOn=prOpen()||o.lv>0,pf=prOn?prFree():0,nmax=UPG.filter(u=>lv(u.k)>=u.max).length,tn=TAL[heroCls].filter(t=>hasTal(t.k)).length,tb=isUnl('bonus')?TAL[heroCls].filter(t=>!hasTal(t.k)&&meta.gold>=t.cost).length:0;
  const nw=ks=>ks.some(k=>meta.unlNew.includes(k))?'!':0;
  const tile=(k,t,sm,badge,act='hsub',lock=false)=>`<button class="htile${lock?' is-locked':''}" data-cact="${act}" data-arg="${k}"><span class="htile__i" aria-hidden="true">${lock?LOCK_SVG:HT_SVG[k]}</span><b>${t}</b><small>${sm}</small>${badge?`<span class="cx-tab__badge">${badge}</span>`:''}</button>`;
  const mt=mastOf(heroCls),open=['arme',...GEAR_KEYS()],worn=open.filter(k=>eq[k]).length;
  const gb=nw(['sets','slots','arms'])||(Object.keys(bestPlan(eq,meta.stash,true)).length+SLOT_U.filter(slotCan).length);
  const ml=tabLocked('mods'),pl=tabLocked('pets'),pe=pl?null:petEq();
  const mn=ml?0:['w',...(isUnl('hmods')?['h']:[])].reduce((a,t)=>a+build(t).load.filter(Boolean).length,0);
  return `${campMsg}${heroCls3()}
    <section class="hstage" aria-label="Équipement du ${CLS[heroCls].n.toLowerCase()}">
      <div class="hstage__col">${L.map(k=>heroSlot(k,eq)).join('')}</div>
      <div class="hstage__mid"><canvas id="heroStage" width="360" height="360" aria-hidden="true"></canvas><span class="hstage__name">${CLS[heroCls].n}</span><small>${o.lv?`Prestige ${o.lv} · `:''}maîtrise ${mt.r} / 10</small></div>
      <div class="hstage__col">${R.map(k=>heroSlot(k,eq)).join('')}</div>
    </section>
    ${setsHero()}
    ${keyStats(St)}
    <div class="htiles">${tile('gear','Équipement',`${worn} / ${open.length} portés`,gb)}
      ${tile('tal','Sorts et talents',`talents ${tn} / ${TAL[heroCls].length}`,tb)}
      ${tile('prest','Prestige',prOn?`niveau ${o.lv}${pf?` · ${pf} point${pf>1?'s':''}`:''}`:`Forge ${nmax} / ${UPG.length}`,pf)}
      ${tile('mods','Mods',ml?'verrouillé':`${mn} placé${mn>1?'s':''}`,ml?0:nw(['mods','hmods','align']),'hview',ml)}
      ${tile('pets','Familier',pl?'verrouillé':pe?esc(PETS[pe.t].n):meta.eggs>0?`${meta.eggs} œuf${meta.eggs>1?'s':''}`:'aucun',pl?0:nw(['pets'])||(meta.eggs>0?meta.eggs:0),'hview',pl)}
      ${tile('look','Apparence','couleurs',0)}</div>
    ${cxMore('equip_stats','Toutes les statistiques',`<div class="statgrid">${statRows(St)}</div>`,'Afficher')}
    ${meta.tutOff&&tutStep()>=0?'<div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="tuton">Réafficher le parcours</button></div>':''}`;
}
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
  const e=curEq(),k=gearSlot,open=k==='arme'||slotOpen(k),plan=bestPlan(e,meta.stash,true),n=stashN();
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
// Ligne d'affixe d'une fiche : abyssale mise en avant ; propre à une autre classe que c, barrée et marquée « sans effet ».
const affLi=(k,txt,c=heroCls)=>affOff(k,c)?`<li class="affoff"><s>${txt}</s> <span class="affoff__tag">sans effet · ${affOnly(k)}</span></li>`:`<li${AFF[k]&&AFF[k].aby?' class="abyp"':''}>${txt}</li>`;
const affV=(it,k)=>it&&it.aff[k]!=null?(NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up)):null;
function cmpObjet(eq,it,heroRows=true){
  const tk=slotFor(eq,it)||it.slot,cur=eq[tk];
  // une affixe d'une autre classe est grisée, marquée « sans effet », et ne compte ni en gain ni en perte
  const row=(cls,k,lab,o,n)=>{const off=affOff(k);return `<div class="cx-cmp__row${off?cls.replace(/ is-(gain|lost)/,'')+' is-off':cls}"><span class="k"${off?` data-off="${affOnly(k)}"`:''}>${lab}</span><span class="o">${cmpV(k,o)}</span><span class="n">${cmpV(k,n)}</span>${off?'<span class="d eq">—</span>':cmpD(k,(n||0)-(o||0))}</div>`};
  const bk=it.base.k,bo=cur&&cur.base?cur.base.v*upMul(cur.up):null,bn=it.base.v*upMul(it.up);
  const base=row(' is-base',bk,BASE_N[bk]||AFF_NAME[bk]||bk,bo,bn);
  const ka=Object.keys(it.aff),ko=cur?Object.keys(cur.aff):[];
  const nm=k=>AFF_NAME[k]||k,ab=k=>AFF[k]&&AFF[k].aby?' is-aby':'';
  const rows=[...ka.filter(k=>ko.includes(k)).map(k=>({h:row(ab(k),k,nm(k),affV(cur,k),affV(it,k))})),
    ...ka.filter(k=>!ko.includes(k)).map(k=>({h:row(' is-gain'+ab(k),k,nm(k),null,affV(it,k))})),
    ...ko.filter(k=>!ka.includes(k)).map(k=>({h:row(' is-lost'+ab(k),k,nm(k),affV(cur,k),null),lost:affOff(k)?0:1}))];
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
  const affs=`<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.35"><li>${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${Object.keys(it.aff).map(kk=>affLi(kk,AFF[kk].t(NOSCALE[kk]?it.aff[kk]:fmtN(it.aff[kk]*upMul(it.up))),it.wid?it.cls:heroCls)).join('')}${it.seal&&SEALS[it.seal]?`<li class="sealp">${sealTxt(it.seal)}</li>`:''}</ul>`;
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
