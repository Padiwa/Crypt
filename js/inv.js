// Crypte des Cendres — inv.js : inventaire unique (barre de recherche, tri, filtres, grilles) et onglet Héros.
// Depuis la v145 : Héros › Équipement dans gearview.js, fiche ancrée, comparaison, parcours d'affixe et « Annuler » dans dock.js, recyclage dans recycle.js.
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
