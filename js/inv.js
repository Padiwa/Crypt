// Crypte des Cendres — inv.js : inventaire unique (barre de recherche, tri, filtres, grilles) et onglet Héros.
// Depuis la v145 : Héros › Équipement dans gearview.js, fiche ancrée, comparaison, parcours d'affixe et « Annuler » dans dock.js, recyclage dans recycle.js.
let invQ='';
const SORT_N={rar:'Rareté',up:'Rang',lvl:'Niveau',new:'Récents',aff:'Valeur des affixes'};
/* ---------- Filtre commun (v151) ----------
   Le même filtre sert partout où l'on choisit un objet : Coffre, Héros › Équipement, Forge (Fusion, Affixes, Recycler). Il reste le même d'un onglet
   à l'autre (choix de l'auteur) ; les pastilles des filtres actifs et « Effacer » le retirent. fR : raretés ; fW : porté par (all, une classe, none) ;
   fO : afficher seulement (all, better = meilleurs que le porté, lock = verrouillés) ; fA : affixes cherchées, fAM : toutes (all) ou au moins une (any). */
let fR=new Set(),fW='all',fO='all',fA=[],fAM='all';
const F_ONLY={better:'Meilleurs que le porté',lock:'Verrouillés',sub:'Avec une affixe Sublime'};
const filtN=()=>fR.size+(fW!=='all'?1:0)+(fO!=='all'?1:0)+fA.length;
const filtKey=()=>[[...fR].join(),fW,fO,fA.join(),fAM].join('/');
const affName=k=>AFF_NAME[k]||k;
function invPass(it){if(fR.size&&!fR.has(it.r))return false;
  if(fW!=='all'){const w=wornBy(it);if(fW==='none'?!!w:w!==fW)return false}
  if(fO==='lock'&&!it.lock)return false;
  if(fO==='sub'&&!subN(it))return false; // v155
  if(fO==='better'&&(wornBy(it)||!better(it)))return false;
  if(fA.length){const has=k=>!!it.aff&&it.aff[k]!=null;if(fAM==='any'?!fA.some(has):!fA.every(has))return false}
  return true}
// Valeur des affixes : la somme des affixes cherchées, rang compris (affV de dock.js) ; toutes ses affixes si aucune n'est cherchée.
const affSum=it=>(fA.length?fA:Object.keys(it.aff||{})).reduce((a,k)=>a+(+affV(it,k)||0),0);
const invSortFn={rar:(a,b)=>b.r-a.r||(b.up||0)-(a.up||0)||b.lvl-a.lvl,up:(a,b)=>(b.up||0)-(a.up||0)||b.r-a.r,lvl:(a,b)=>b.lvl-a.lvl||b.r-a.r,new:(a,b)=>b.id-a.id,aff:(a,b)=>affSum(b)-affSum(a)||b.r-a.r};
const norm=t=>String(t).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
function invMatch(it,q){if(!q)return true;const n=norm(q);
  if(norm(itemName(it)).includes(n)||norm(it.type||'').includes(n)||norm(SLOT[it.slot]).includes(n)||norm(RAR[it.r].n).includes(n))return true;
  for(const k in it.aff){if(norm(AFF_NAME[k]||k).includes(n)||norm(AFF[k].t(it.aff[k])).includes(n))return true}return false}
// Armes possédées, présentées comme des objets du coffre (verrouillables, fusionnables, recyclables). worn : avec celles que portent les héros.
function invWeapons(worn){const out=[];for(const c of [heroCls,...Object.keys(CLS).filter(x=>x!==heroCls)])for(const w of WPN[c])if(ownedW(w.id)&&(worn||curWid(c)!==w.id))out.push(weaponItem(c,w.id));return out}
// Sélection d'un objet du coffre : dans le coffre, porté par le héros choisi (slot), porté par un autre héros (oth = « classe|emplacement »), ou arme.
const selOf=it=>{if(it.wid)return {wpn:it.wid};const c=wornBy(it);if(c){const k=wornSlot(it,c);return c===heroCls?{slot:k}:{oth:c+'|'+k}}return {stash:it.id}};
const isSel=it=>{if(!campSel)return false;const s=selOf(it);return Object.keys(s).length===Object.keys(campSel).length&&Object.keys(s).every(k=>campSel[k]===s[k])};
// Coffre : tout ce que tu possèdes, objets portés compris (marqués du héros qui les porte). Filtre « Portés » : seulement ceux-là.
// kind : 'equip' (coffre, objets portés compris), 'recy' (recyclage : rien de porté), 'affix' (Forge › Affixes et fusion : tout, comme 'equip', les objets du héros choisi en tête).
function invList(kind){const all=kind==='equip'||kind==='affix',F=!all&&stF==='porte'?'all':stF,pool=all?[...meta.stash,...allWorn()]:meta.stash;
  const slotOk=i=>F==='all'||(F==='porte'?!!wornBy(i):i.slot===F);
  const st=pool.filter(i=>slotOk(i)&&invMatch(i,invQ)&&invPass(i));const ws=!(F==='all'||F==='arme'||F==='porte')?[]:invWeapons(all).filter(i=>(F!=='porte'||!!wornBy(i))&&invMatch(i,invQ)&&invPass(i));
  const nid=i=>i.wid?-1:i.id;const f=invSortFn[stS]||invSortFn.rar,L=[...st,...ws].sort(stS==='new'?(a,b)=>nid(b)-nid(a):f);
  if(kind!=='affix')return L;const mine=i=>wornBy(i)===heroCls;return [...L.filter(mine),...L.filter(i=>!mine(i))]}
function invCountTxt(list){const nb=list.filter(i=>!wornBy(i)&&better(i)).length,nw=list.filter(i=>wornBy(i)).length;return `${list.length} objet${list.length>1?'s':''}${nw?` · ${nw} porté${nw>1?'s':''}`:''}${nb?` · ▲ ${nb} meilleur${nb>1?'s':''} que ton équipement`:''}`}
// Pastille du héros qui porte l'objet (initiale à sa couleur).
const whoTag=c=>c?`<span class="cwho" style="--wc:${CLS[c].col}" title="Porté : ${CLS[c].n}">${CLS[c].n[0]}</span>`:'';
// Barre collée : recherche, tri et filtres (panneau « Trier et filtrer »), filtres actifs, emplacements, compteur.
// kind = 'equip' (Coffre), 'affix' (Forge › Affixes et Fusion), 'recy' (Recycler).
function filtBar(sortLab){const n=filtN();
  return `<div class="cx-toolbar__row fbar"><button class="cx-chip cx-chip--sm fbar__b" data-cact="fopen" aria-label="Trier : ${sortLab}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/></svg>${sortLab}</button><button class="cx-chip cx-chip--sm fbar__b" data-cact="fopen" aria-pressed="${n>0}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>Filtres${n?` · ${n}`:''}</button>${n?'<button class="fbar__clr" data-cact="freset">Effacer</button>':''}</div>${filtChips()}`}
function filtChips(){const L=[...fA.map(k=>['a:'+k,affName(k)]),...[...fR].sort((x,y)=>x-y).map(r=>['r:'+r,RAR[r].n]),...(fW!=='all'?[['w','Porté : '+(fW==='none'?'personne':CLS[fW].n)]]:[]),...(fO!=='all'?[['o',F_ONLY[fO]]]:[])];
  return L.length?`<div class="fchips">${L.map(([k,l])=>`<button class="fchip" data-cact="fdel" data-arg="${k}" aria-label="Retirer le filtre ${esc(l)}">${esc(l)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`).join('')}</div>`:''}
function invToolbar(list,kind){const all=kind==='equip'||kind==='affix',W=invWeapons(all),G2=all?[...meta.stash,...allWorn()]:meta.stash,counts={all:G2.length+W.length,arme:W.length,porte:allWorn().length+W.filter(w=>wornBy(w)).length};for(const it of G2)counts[it.slot]=(counts[it.slot]||0)+1;
  const ch=(k,l)=>`<button class="cx-chip cx-chip--sm" data-cact="sfilter" data-arg="${k}" aria-pressed="${stF===k}">${l} <span class="n">${counts[k]||0}</span></button>`;
  return `<div class="cx-toolbar"><div class="cx-toolbar__row"><label class="cx-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" data-inv="q" value="${esc(invQ)}" placeholder="Chercher un objet ou une affixe" aria-label="Chercher dans le coffre" enterkeyhint="search"></label></div>
    ${filtBar(SORT_N[stS]||SORT_N.rar)}
    <div class="cx-chips">${ch('all','Tout')}${all?ch('porte','Portés'):''}${ch('arme','Arme')}${['armure','amulette','bottes','anneau',...(counts.dos||stF==='dos'?['dos']:[])].map(k=>ch(k,SLOT[k])).join('')}</div>
    <span class="cx-count" id="invCount">${invCountTxt(list)}</span></div>`}
// Panneau « Trier et filtrer » (feuille de choix, v151) : chaque réglage s'applique tout de suite à la liste ouverte derrière.
const GEAR_SORT_N={pow:'Puissance',rar:'Rareté',lvl:'Niveau',new:'Récents',aff:'Valeur des affixes'};
function filtCount(){if(campTab==='uniq')return document.querySelectorAll('#campBody .uqr[data-stash]').length;if(gearOn())return gearRows(gearSlot).L.length;if(isRecy())return recyAll().length;return invList(campTab==='forge'?'affix':'equip').length}
// Affixes proposées : celles de tes objets (coffre, objets portés, armes), plus celles déjà cherchées.
function filtAffKeys(){const ks=new Set(fA);for(const it of [...meta.stash,...allWorn(),...invWeapons(true)])for(const k in (it.aff||{}))ks.add(k);return [...ks].sort((a,b)=>affName(a).localeCompare(affName(b),'fr'))}
function filtHtml(){const g=gearOn(),S=g?GEAR_SORT_N:SORT_N,cur=g?gearSort:stS,n=filtCount();
  const chip=(f,v,l,on,st='')=>`<button class="cx-chip cx-chip--sm" data-f="${f}" data-v="${v}" aria-pressed="${on}"${st}>${l}</button>`;
  const sec=(t,h,extra='')=>`<section class="cx-section fsec"><div class="fsec__h"><h3 class="cx-section__label">${t}</h3>${extra}</div><div class="cx-chips fwrap">${h}</div></section>`;
  const ak=filtAffKeys();
  return sec('Trier par',Object.keys(S).map(k=>chip('sort',k,S[k],cur===k)).join(''))
    +sec('Affixes',ak.length?ak.map(k=>chip('a',k,esc(affName(k)),fA.includes(k))).join(''):'<p class="cx-hint" style="margin:0">Aucune affixe dans tes objets.</p>',`<span class="fsec__mode" role="radiogroup" aria-label="Affixes cherchées">${chip('am','all','Toutes',fAM==='all')}${chip('am','any','Au moins une',fAM==='any')}</span>`)
    +(g?'':sec('Emplacement',[['all','Tout'],['arme','Arme'],...['armure','amulette','bottes','anneau','dos'].map(k=>[k,SLOT[k]])].map(([k,l])=>chip('slot',k,l,stF===k)).join('')))
    +sec('Rareté',RAR.map((r,i)=>chip('r',i,r.n,fR.has(i),fR.has(i)?'':` style="color:${r.c}"`)).join(''))
    +sec('Porté par',[['all','Tous'],...Object.keys(CLS).map(c=>[c,CLS[c].n]),['none','Personne']].map(([k,l])=>chip('w',k,l,fW===k)).join(''))
    +sec('Afficher seulement',[['all','Tout'],['better',F_ONLY.better],['lock',F_ONLY.lock],...(TORM_TOP>10?[['sub',F_ONLY.sub]]:[])].map(([k,l])=>chip('o',k,l,fO===k)).join(''))
    +`<div class="cx-actions fsheet__foot"><button class="cx-btn" data-f="reset">Tout effacer</button><button class="cx-btn cx-btn--primary" data-f="close">Voir ${n} objet${n>1?'s':''}</button></div>`}
function openFilt(){$('pickTitle').textContent='Trier et filtrer';$('pickBody').innerHTML=filtHtml();$('pickBody').onclick=filtClick;$('pickSheet').hidden=false}
// Effacer : les filtres du panneau ; « Tout effacer » remet aussi l'emplacement sur Tout.
function filtReset(slot){fR.clear();fW='all';fO='all';fA=[];fAM='all';if(slot)stF='all'}
function filtClick(e){const b=e.target.closest('[data-f]');if(!b)return;const f=b.dataset.f,v=b.dataset.v;
  if(f==='close'){closePick();return}
  if(f==='reset')filtReset(true);
  else if(f==='sort'){if(gearOn())gearSort=v;else stS=v}
  else if(f==='a')fA=fA.includes(v)?fA.filter(x=>x!==v):[...fA,v];
  else if(f==='am')fAM=v;else if(f==='slot')stF=v;
  else if(f==='r'){const r=+v;if(fR.has(r))fR.delete(r);else fR.add(r)}
  else if(f==='w')fW=v;else if(f==='o')fO=v;
  campSel=null;drawCamp();const pb=$('pickBody'),sc=pb.scrollTop;pb.innerHTML=filtHtml();pb.scrollTop=sc}
Object.assign(CAMP_ACT,{
  fopen:function(){openFilt()},
  freset:function(){filtReset(false);campSel=null;return CAMP_GO},
  fdel:function(a,arg){const [k,v]=arg.split(':');if(k==='a')fA=fA.filter(x=>x!==v);else if(k==='r')fR.delete(+v);else if(k==='w')fW='all';else if(k==='o')fO='all';campSel=null;return CAMP_GO},
});
/* Grilles longues (v135) : 120 cases à la fois ; « Afficher plus » ajoute les suivantes. Retour à 120 quand la vue, le filtre,
   la recherche ou le tri change. L'objet choisi reste toujours affiché. */
const GRID_PAGE=120;let gridMore=0,gridKey='';
function gridCut(list,isOn){const key=[campTab,arsView,forgeSub,stF,invQ,stS,filtKey()].join('|');if(key!==gridKey){gridKey=key;gridMore=0}
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
// Vues qui montrent le coffre (fiche ancrée) ou le recyclage.
const isCoffre=()=>campTab==='arsenal'&&arsView==='coffre',isRecy=()=>campTab==='arsenal'&&arsView==='recy';
const stashN=()=>meta.stash.length+allWorn().length+invWeapons(true).length;
// Porter un objet dans un emplacement : l'objet qu'il remplace retourne au coffre.
const wearGear=(sl,it)=>{const old=meta.gear[sl];if(old)meta.stash.push(old);meta.gear[sl]=it};
// Onglet Héros (v130, v137, v149) : une rangée d'onglets (Équipement, Sorts, Mods, Familier, Prestige) ; le héros se change par les flèches du titre.
// Équipement : le héros au centre, ses emplacements autour, ses équipements enregistrés et ses chiffres clés ; toucher un emplacement ouvre
// Héros › Équipement sur cet emplacement (heroSub gear). L'onglet Apparence ouvre les couleurs du héros (heroSub look).
function heroSlot(k,eq){const it=eq[k],sel=gearOn()&&gearSlot===k;
  if(!slotOpen(k)){const u=SLOT_U.find(x=>x.k===k),ok=!u.need||slotOpen(u.need),hf=meta.hfrag|0,can=slotCan(u);
    return `<button class="hslot hslot--lock${can?' is-ready':''}" data-cact="gslot" data-arg="${k}" aria-label="${SLOT[k]} verrouillé${ok?` : ${Math.min(hf,u.hf)} fragments de harnais sur ${u.hf}`:''}"><span class="hslot__lk" aria-hidden="true">${LOCK_SVG}</span><small>${ok&&isUnl('slots')?`${Math.min(hf,u.hf)} / ${u.hf}`:SLOT[k]}</small>${can?'<span class="dot" aria-hidden="true"></span>':''}</button>`}
  const up=it&&it.up?`<span class="cx-cell__up">R${it.up+1}</span>`:'',lk=it&&it.lock?`<span class="cx-cell__lock">${LOCK_SVG}</span>`:'';
  return `<button class="hslot${it?'':' is-empty'}${sel?' is-sel':''}" data-cact="gslot" data-arg="${k}" style="--rar:${it?RARV[it.r]:'#5c4a66'}" aria-label="${SLOT[k]} : ${it?esc(itemName(it))+', '+RAR[it.r].n.toLowerCase():'vide'}">${GLYPH[k==='anneau2'?'anneau':k]}${up}${lk}<small>${SLOT[k]}</small></button>`}
// v149 : onglets du héros (Apparence en 6e onglet depuis la v151, demande de l'auteur). Un point seulement quand une action attend (meilleur objet, talent à acheter, point de prestige, œuf, nouveauté).
const HTABS=[['gear','Équipement'],['tal','Sorts'],['mods','Mods'],['pets','Familier'],['prest','Prestige'],['look','Apparence']];
const heroTabOf=()=>campTab==='mods'||campTab==='pets'?campTab:heroSub==='tal'||heroSub==='prest'||heroSub==='look'?heroSub:'gear';
function heroDots(){const eq=curEq(),nw=ks=>ks.some(k=>meta.unlNew.includes(k)),o=prOf(heroCls),prOn=prOpen()||o.lv>0;
  return {gear:nw(['sets','slots','arms'])||Object.keys(bestPlan(eq,meta.stash,true)).length>0||SLOT_U.some(slotCan),
    tal:isUnl('bonus')&&TAL[heroCls].some(t=>!hasTal(t.k)&&meta.gold>=t.cost),
    mods:!tabLocked('mods')&&nw(['mods','hmods','align']),
    pets:!tabLocked('pets')&&(nw(['pets'])||meta.eggs>0),
    prest:prOn&&prFree()>0}}
function heroTabs(){const D=heroDots(),cur=heroTabOf();
  return tabRow('htabs','Vues du héros',HTABS.map(([k,l])=>{const pv=k==='mods'||k==='pets';return [pv?'hview':'hsub',k==='gear'?'main':k,l,cur===k,pv&&tabLocked(k),D[k]]}))}
// Titre de l'onglet Héros : le héros joué, entre deux flèches qui changent de héros.
function heroTitle(){const L=Object.keys(CLS),i=L.indexOf(heroCls),pv=L[(i+L.length-1)%L.length],nx=L[(i+1)%L.length];
  return `<span class="htitle"><button class="htitle__a" data-cact="hcls" data-arg="${pv}" aria-label="Héros précédent : ${CLS[pv].n}"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button><span class="htitle__n" style="--hc:${CLS[heroCls].col}">${CLS[heroCls].n}</span><button class="htitle__a" data-cact="hcls" data-arg="${nx}" aria-label="Héros suivant : ${CLS[nx].n}"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button></span>`}
function campEquip(){
  const eq=curEq(),St=stats(eq);
  if(heroSub==='tal')return heroTabs()+heroTalents();
  if(heroSub==='prest')return heroTabs()+prestSection();
  if(heroSub==='look')return heroTabs()+lookHtml();
  if(heroSub==='gear')return heroTabs()+gearView();
  const L=['arme','armure','amulette','bottes'],R=['anneau','anneau2','dos'];
  const o=prOf(heroCls),mt=mastOf(heroCls);
  return `${campMsg}${heroTabs()}
    <section class="hstage" aria-label="Équipement du ${CLS[heroCls].n.toLowerCase()}">
      <div class="hstage__col">${L.map(k=>heroSlot(k,eq)).join('')}</div>
      <div class="hstage__mid"><canvas id="heroStage" width="360" height="360" aria-hidden="true"></canvas><small>${o.lv?`Prestige ${o.lv} · `:''}maîtrise ${mt.r} / 10</small></div>
      <div class="hstage__col">${R.map(k=>heroSlot(k,eq)).join('')}</div>
    </section>
    ${keyStats(St)}
    ${setsHero()}
    ${cxMore('equip_stats','Toutes les statistiques',`<div class="statgrid">${statRows(St)}</div>`,'Afficher')}
    ${meta.tutOff&&tutStep()>=0?'<div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="tuton">Réafficher le parcours</button></div>':''}`;
}
