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
// Coffre de l'Armurerie : tout ce que tu possèdes, objets portés compris (marqués du héros qui les porte). Filtre « Portés » : seulement ceux-là.
// kind : 'equip' (coffre, objets portés compris), 'recy' (recyclage : rien de porté), 'affix' (Forge › Affixes : le coffre seul).
function invList(kind){const all=kind==='equip',F=!all&&stF==='porte'?'all':stF,pool=all?[...meta.stash,...allWorn()]:meta.stash;
  const slotOk=i=>F==='all'||(F==='porte'?!!wornBy(i):i.slot===F);
  const st=pool.filter(i=>slotOk(i)&&invMatch(i,invQ));const ws=kind==='affix'||!(F==='all'||F==='arme'||F==='porte')?[]:invWeapons(all).filter(i=>(F!=='porte'||!!wornBy(i))&&invMatch(i,invQ));
  const nid=i=>i.wid?-1:i.id;const f=invSortFn[stS]||invSortFn.rar;return [...st,...ws].sort(stS==='new'?(a,b)=>nid(b)-nid(a):f)}
function invCountTxt(list){const nb=list.filter(i=>!wornBy(i)&&better(i)).length,nw=list.filter(i=>wornBy(i)).length;return `${list.length} objet${list.length>1?'s':''}${nw?` · ${nw} porté${nw>1?'s':''}`:''}${nb?` · ▲ ${nb} meilleur${nb>1?'s':''} que ton équipement`:''}`}
// Pastille du héros qui porte l'objet (initiale à sa couleur).
const whoTag=c=>c?`<span class="cwho" style="--wc:${CLS[c].col}" title="Porté : ${CLS[c].n}">${CLS[c].n[0]}</span>`:'';
// Barre collée : recherche, tri, filtres par emplacement, compteur. kind = 'equip' (Héros) ou 'affix' (Forge › Affixes).
function invToolbar(list,kind){const all=kind==='equip',W=kind==='affix'?[]:invWeapons(all),G2=all?[...meta.stash,...allWorn()]:meta.stash,counts={all:G2.length+W.length,arme:W.length,porte:allWorn().length+W.filter(w=>wornBy(w)).length};for(const it of G2)counts[it.slot]=(counts[it.slot]||0)+1;
  const ch=(k,l)=>`<button class="cx-chip cx-chip--sm" data-cact="sfilter" data-arg="${k}" aria-pressed="${stF===k}">${l} <span class="n">${counts[k]||0}</span></button>`;
  return `<div class="cx-toolbar"><div class="cx-toolbar__row"><label class="cx-search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input type="search" data-inv="q" value="${esc(invQ)}" placeholder="Chercher une affixe : vitesse, critique…" aria-label="Chercher dans le coffre" enterkeyhint="search"></label>
    <select class="cx-sort" data-inv="sort" aria-label="Trier le coffre">${Object.keys(SORT_N).map(k=>`<option value="${k}"${stS===k?' selected':''}>${SORT_N[k]}</option>`).join('')}</select></div>
    <div class="cx-chips">${ch('all','Tout')}${all?ch('porte','Portés'):''}${kind==='affix'?'':ch('arme','Arme')}${['armure','amulette','bottes','anneau',...(counts.dos?['dos']:[])].map(k=>ch(k,SLOT[k])).join('')}</div>
    <span class="cx-count" id="invCount">${invCountTxt(list)}</span></div>`}
function invGrid(list,kind){if(!list.length)return `<p class="cx-hint" style="margin:0">${meta.stash.length?(invQ?'Aucun objet ne correspond à ta recherche.':'Aucun objet de ce type.'):'Ton coffre est vide. Sors vivant d\'une mission pour y ramener les objets trouvés.'}</p>`;
  if(kind==='affix')return `<div class="cx-cells">${list.map(it=>xfCell('s:'+it.id,it)).join('')}</div>`;
  return `<div class="grid">${list.map(it=>{const w=wornBy(it),tag=whoTag(w);return (it.wid?cellHtml(it,'wsel',isSel(it),!w&&it.cls===heroCls&&better(it)).replace(`data-wsel="${it.id}"`,`data-wsel="${it.wid}"`):cellHtml(it,'stash',isSel(it),!w&&better(it))).replace('</button>',tag+'</button>')}).join('')}</div>`}
function invRefresh(){const g=$('invGrid');if(!g)return;if(isRecy()){g.innerHTML=recyCells();return}const kind=campTab==='forge'?'affix':'equip',list=invList(kind);g.innerHTML=invGrid(list,kind);const c=$('invCount');if(c)c.textContent=invCountTxt(list)}
$('campBody').addEventListener('input',e=>{if(e.target.dataset.inv==='q'){invQ=e.target.value;invRefresh()}});
$('campBody').addEventListener('change',e=>{if(e.target.dataset.inv==='sort'){stS=e.target.value;drawCamp()}});

/* ---------- Onglet Héros ---------- */
function keyStats(St){return `<div class="cx-keystats"><div><span>Puissance</span><b>${Math.round(dps(St))}</b></div><div><span>Vie</span><b>${Math.round(St.hp)}</b></div><div><span>Réduction</span><b>${Math.round(St.armor)} %</b></div></div>`}
// Vues de l'Armurerie qui montrent le coffre (fiche ancrée) ou le recyclage.
const isCoffre=()=>campTab==='arsenal'&&arsView==='coffre',isRecy=()=>campTab==='arsenal'&&arsView==='recy',isHerosV=()=>campTab==='arsenal'&&arsView==='heros';
// Armurerie › Par héros : ce que porte chaque héros, le héros joué en premier. Toucher un objet ouvre sa fiche (le donner au héros joué, le retirer…).
function herosView(){const order=[heroCls,...Object.keys(CLS).filter(c=>c!==heroCls)];
  return order.map(c=>{const g=meta.gearBy[c]||{},wid=curWid(c),w=wdef(wid),ks=Object.keys(SLOT).filter(k=>k!=='arme'&&slotOpen(k)),n=ks.filter(k=>g[k]).length,me=c===heroCls;
    const lk=it=>it.lock?`<span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:'';
    const cells=[`<button class="slot${campSel&&campSel.wpn===wid?' sel':''}" data-wsel="${wid}"><span>Arme${(meta.wlv||{})[wid]?' · '+rkTxt(meta.wlv[wid]):''}</span><strong style="color:${RAR[w.r].c}">${esc(w.n)}</strong></button>`,
      ...ks.map(k=>{const it=g[k];
        return it?`<button class="slot${isSel(it)?' sel':''}" data-stash="${it.id}"><span>${SLOT[k]}${it.up?' · '+rkTxt(it.up):''}</span><strong style="color:${RAR[it.r].c}">${esc(itemName(it))}${lk(it)}</strong></button>`:`<div class="slot"><span>${SLOT[k]}</span><strong style="color:var(--muted)">Vide</strong></div>`})];
    return `<section class="cx-section hgear"><h3 class="cx-section__label"><span class="cwho" style="--wc:${CLS[c].col}" aria-hidden="true">${CLS[c].n[0]}</span>${CLS[c].n}${me?' · héros joué':''} · ${n} objet${n>1?'s':''}</h3><div class="slots">${cells.join('')}</div>
      ${n?'':`<p class="cx-hint" style="margin:0">${me?'Rien de porté : touche « Équiper le meilleur » dans l\'onglet Héros.':`Rien de porté : choisis le ${CLS[c].n} sur l'écran d'accueil, puis « Équiper le meilleur » dans l'onglet Héros.`}</p>`}</section>`}).join('')}
const stashN=()=>meta.stash.length+allWorn().length+invWeapons(true).length;
// Porter un objet dans un emplacement : l'objet qu'il remplace retourne au coffre.
const wearGear=(sl,it)=>{const old=meta.gear[sl];if(old)meta.stash.push(old);meta.gear[sl]=it};
function campEquip(){
  const eq=curEq(),St=stats(eq),pn=Object.keys(bestPlan(eq,meta.stash,true)).length,n=stashN();
  return `${campMsg}${tutCard()}<section class="cx-section"><h3 class="cx-section__label">${CLS[heroCls].n} · équipement</h3><div class="slots">${slotsHtml(eq,true,campSel&&campSel.slot)}</div>
    ${pn?'':'<p class="cx-hint" style="margin:0">Ton équipement est déjà le meilleur que tu possèdes.</p>'}
    <div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-cact="gocoffre">Ouvrir le coffre · ${n} objet${n>1?'s':''}</button><button class="cx-btn cx-btn--sm" data-cact="goheros">Équipement des héros</button></div></section>
    ${setsHtml()}${slotUnlockHtml()}
    ${keyStats(St)}${cxMore('equip_stats','Toutes les statistiques',`<div class="statgrid">${statRows(St)}</div>`,'Afficher')}
    <section class="cx-section"><h3 class="cx-section__label">Fragments des reliques</h3>${fragInv()}</section>${meta.tutOff&&tutStep()>=0?'<div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="tuton">Réafficher le parcours</button></div>':''}`;
}
// Héros › Équipements enregistrés : jusqu'à SET_MAX par héros ; « Porter » reprend chaque objet dans le coffre ou sur un autre héros.
function setsHtml(){if(!isUnl('sets'))return '';const L=setsOf(),eq=curEq();
  const same=s=>GEAR_KEYS().every(k=>!(k in s.g)||(s.g[k]==null?!eq[k]:eq[k]&&eq[k].id===s.g[k]))&&s.w===curWid();
  const dots=s=>[s.w?`<i class="sdot" style="--c:${ownedW(s.w)?RAR[wdef(s.w).r].c:'var(--muted)'}" title="${esc(wdef(s.w).n)}"></i>`:'',...GEAR_KEYS().filter(k=>k in s.g).map(k=>{const it=s.g[k]==null?null:findItem(s.g[k]);return `<i class="sdot${s.g[k]!=null&&!it?' miss':''}" style="--c:${it?RAR[it.r].c:'var(--line)'}" title="${SLOT[k]}${it?' : '+esc(itemName(it)):s.g[k]!=null?' : introuvable':' : vide'}"></i>`})].join('');
  const rows=L.map((s,i)=>{const on=same(s),wb=[...new Set(GEAR_KEYS().map(k=>s.g[k]!=null?findItem(s.g[k]):null).filter(Boolean).map(wornBy).filter(c=>c&&c!==heroCls))];
    return `<div class="cx-row cx-set${on?' is-on':''}"><span class="cx-row__k"><input class="cx-setname" data-setname="${i}" value="${esc(s.n)}" maxlength="24" aria-label="Nom de l'équipement ${i+1}"><small><span class="sdots">${dots(s)}</span>${on?' · porté':wb.length?` · objets portés ${wb.map(parCls).join(' et ')}`:''}</small></span>
      <span class="cx-set__act"><button class="cx-btn cx-btn--sm${on?'':' cx-btn--primary'}" data-cact="setwear" data-arg="${i}" ${on?'disabled':''}>Porter</button><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="setsave" data-arg="${i}" aria-label="Remplacer ${esc(s.n)} par l'équipement actuel">Remplacer</button><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="setdel" data-arg="${i}" aria-label="Supprimer ${esc(s.n)}">${XSVG.x}</button></span></div>`}).join('');
  return `<section class="cx-section"><h3 class="cx-section__label">Équipements enregistrés · ${L.length} / ${SET_MAX}</h3>${rows?`<div class="cx-rows">${rows}</div>`:''}
    <div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-cact="setsave" data-arg="" ${L.length>=SET_MAX?'disabled':''}>Enregistrer l'équipement porté</button></div>
    <p class="cx-hint" style="margin:0">${L.length?'Chaque héros a ses équipements. « Porter » prend les objets dans le coffre ou sur un autre héros ; touche le nom pour le changer.':'Enregistre l\'arme et les objets portés pour les remettre plus tard en un geste. Chaque héros a ses équipements.'}</p></section>`}
// Héros › Emplacements à débloquer (fragments de harnais, lâchés par les Gardiens).
const slotCan=u=>!slotOpen(u.k)&&(!u.need||slotOpen(u.need))&&(meta.hfrag|0)>=u.hf&&meta.gold>=u.gold;
function slotUnlockHtml(){if(!isUnl('slots'))return '';const next=SLOT_U.filter(u=>!slotOpen(u.k));if(!next.length)return '';const hf=meta.hfrag|0;
  return `<section class="cx-section"><h3 class="cx-section__label">Emplacements · ${hf} fragment${hf>1?'s':''} de harnais</h3><div class="cx-rows">${next.map(u=>{const ok=!u.need||slotOpen(u.need),can=ok&&hf>=u.hf&&meta.gold>=u.gold;
    return `<div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">${u.n}<small>${ok?`${u.hf} fragments de harnais et ${u.gold} or · tu as ${hf} fragment${hf>1?'s':''}`:`Après l'${SLOT_U.find(x=>x.k===u.need).n}`}</small></span><button class="cx-btn cx-btn--sm${can?' cx-btn--primary':''}" data-cact="slotopen" data-arg="${u.k}" style="margin:0" ${can?'':'disabled'}>Débloquer</button></div>`}).join('')}</div>
    <p class="cx-hint" style="margin:0">Les fragments de harnais tombent seulement sur les Gardiens (3 % en Normal, jusqu'à 11 % en Tourment X).</p></section>`}
// Armurerie › Coffre : tout ce que tu possèdes, armes et objets portés compris (pastille du héros qui les porte).
function campCoffre(){const list=invList('equip'),n=stashN();
  return `<section class="cx-section"><h3 class="cx-section__label">Coffre · ${n} objet${n>1?'s':''}</h3>
    ${n?invToolbar(list,'equip'):''}<div id="invGrid">${invGrid(list,'equip')}</div>${n?`<p class="cx-hint" style="margin:0">La pastille A, G ou M montre le héros qui porte l'objet (Archer, Guerrier, Magicien) ; « Par héros », en haut, les range héros par héros.${isUnl('recy')?' Pour recycler : puce Recyclage, en haut de l\'Armurerie.':''}</p>`:''}</section>`}

/* ---------- Fiche ancrée (cx-dock) ---------- */
const XSVG={x:'<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',prev:'<svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',lock:'<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  take:'<svg viewBox="0 0 24 24"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',recy:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',out:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>'};
const recyGain=it=>RAR[it.r].shard*2*2**(it.up|0);
// Statistiques du héros comparées (avant, après) : [libellé, avant, après, décimales, unité] ; les trois premières dans la fiche.
const statPairs=(a,b)=>[['Puissance',dps(a),dps(b),0,''],['Vie',a.hp,b.hp,0,''],['Réduction',a.armor,b.armor,1,' %'],['Dégâts',a.dmg,b.dmg,1,''],['Critique',a.crit,b.crit,1,' %'],['Attaques / s',a.aps,b.aps,2,''],['Vitesse',a.speed/2.2,b.speed/2.2,0,' %'],['Recharge',a.cdr,b.cdr,1,' %']];
const fmtDc=(v,dc)=>(Math.round(v*10**dc)/10**dc).toLocaleString('fr-FR',{maximumFractionDigits:dc});
function cmpRows(e,it){const tk=tgtKey(e,it)||it.slot,a=stats(e),b=stats({...e,[tk]:it});
  const R=statPairs(a,b),f=fmtDc;
  const rows=R.filter(([,x,y,dc])=>Math.abs(y-x)>=.5/10**dc).slice(0,6).map(([l,x,y,dc,u])=>{const d=y-x,up=d>0;return `<div><span>${l}</span><b style="color:${up?'var(--heal)':'var(--blood-ink)'}">${up?'▲ +':'▼ −'}${f(Math.abs(d),dc)}${u}</b></div>`}).join('');
  return rows?`<div class="cx-stats">${rows}</div>`:'<p class="cx-hint" style="margin:0">Aucun changement de statistique.</p>'}

/* ---------- CompareObjet : l'objet choisi face à l'objet équipé du même emplacement, affixe par affixe ---------- */
let cmpPage=0,cmpKey='',dockMore=false,dockAll=false;
const BASE_N={dmg:'Dégâts de base',hp:'Vie',crit:'Critique',speed:'Vitesse',dmgPct:'Dégâts'};
const CMP_PCT=k=>!['hp','regen','burn','multi','pierce','dmg','abWard'].includes(k);
const cmpV=(k,v)=>v==null?'—':fmtN(v)+(CMP_PCT(k)?' %':'');
const cmpD=(k,d)=>Math.abs(d)<1e-9?'<span class="d eq">=</span>':`<span class="d ${d>0?'up':'dn'}">${d>0?'▲ +':'▼ −'}${fmtN(Math.abs(d))}${CMP_PCT(k)?' %':''}</span>`;
const affV=(it,k)=>it&&it.aff[k]!=null?(NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up)):null;
function cmpObjet(eq,it,heroRows=true){
  const tk=tgtKey(eq,it)||it.slot,cur=eq[tk];
  const row=(cls,k,lab,o,n)=>`<div class="cx-cmp__row${cls}"><span class="k">${lab}</span><span class="o">${cmpV(k,o)}</span><span class="n">${cmpV(k,n)}</span>${cmpD(k,(n||0)-(o||0))}</div>`;
  const bk=it.base.k,bo=cur&&cur.base?cur.base.v*upMul(cur.up):null,bn=it.base.v*upMul(it.up);
  const base=row(' is-base',bk,BASE_N[bk]||AFF_NAME[bk]||bk,bo,bn);
  const ka=Object.keys(it.aff),ko=cur?Object.keys(cur.aff):[];
  const nm=k=>AFF_NAME[k]||k,ab=k=>AFF[k]&&AFF[k].aby?' is-aby':'';
  const rows=[...ka.filter(k=>ko.includes(k)).map(k=>({h:row(ab(k),k,nm(k),affV(cur,k),affV(it,k))})),
    ...ka.filter(k=>!ko.includes(k)).map(k=>({h:row(' is-gain'+ab(k),k,nm(k),null,affV(it,k))})),
    ...ko.filter(k=>!ka.includes(k)).map(k=>({h:row(' is-lost'+ab(k),k,nm(k),affV(cur,k),null),lost:1}))];
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
  const list=invList('equip'),idx=!isHerosV()&&(isCoffre()||campSel.stash||campSel.wpn)?list.findIndex(isSel):-1,r=RAR[it.r];
  const wc=it.wid?wornBy(it):null,whoW=othC||(wc&&wc!==heroCls?wc:null);
  const nav=idx>=0?`<span class="cx-dock__nav"><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dnav" data-arg="-1" ${idx>0?'':'disabled'} aria-label="Objet précédent">${XSVG.prev}</button><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dnav" data-arg="1" ${idx<list.length-1?'':'disabled'} aria-label="Objet suivant">${XSVG.next}</button></span>`:'';
  const n=it.up||0;
  const affs=`<ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.35"><li>${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${Object.keys(it.aff).map(kk=>`<li${AFF[kk].aby?' class="abyp"':''}>${AFF[kk].t(NOSCALE[kk]?it.aff[kk]:fmtN(it.aff[kk]*upMul(it.up)))}</li>`).join('')}${it.seal&&SEALS[it.seal]?`<li class="sealp">${sealTxt(it.seal)}</li>`:''}</ul>`;
  const tk=it.wid?'arme':tgtKey(eq,it),cur=tk?eq[tk]:null;
  let main='',more=[];
  const btn=(cls,act,arg,svg,lab,dis)=>`<button class="cx-btn${cls}" data-cact="${act}"${arg!=null?` data-arg="${arg}"`:''} ${dis?'disabled':''}>${svg}${lab}</button>`;
  const other=it.wid&&it.cls!==heroCls,wb=it.wid?bpdef(it.wid):null;
  if(!worn&&it.wid)main=other?`<p class="cx-hint" style="margin:0">Arme ${deCls(it.cls)} : change de héros pour l'équiper.</p>`:`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="wequip" data-arg="${it.wid}">Équiper · remplace ${esc(itemName(cur))}</button>`;
  else if(othC)main=tk?`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="equipoth">Équiper sur ${esc(CLS[heroCls].n)} · retiré ${parCls(othC).replace('par ','à ').replace("à le ","au ")}</button>`:`<p class="cx-hint" style="margin:0">Emplacement ${SLOT[it.slot]} verrouillé.</p>`;
  else if(!worn&&!tk)main=`<p class="cx-hint" style="margin:0">Emplacement ${SLOT[it.slot]} verrouillé : débloque-le dans l'onglet Héros (fragments de harnais).</p>`;
  else if(!worn)main=`<button class="cx-btn cx-btn--primary cx-btn--block" data-cact="equip">Équiper${cur?` · remplace ${esc(itemName(cur))}`:''}</button>`;
  // Fusion de rang : un double identique libre (objet) ou les doubles de l'arme.
  let fuse='';
  const gp=c=>` <span class="cx-price"><span class="coin"></span>${c}</span>`,cap=rankCap(it);
  if(!isUnl('fuse'))fuse='';
  else if(n>=cap)fuse=`<p class="cx-hint" style="margin:0">${rkTxt(n)} : rang maximum${cap<UP_MAX?` pour un objet ${RAR[it.r].n.toLowerCase()} (rang ${cap+1}). Les objets des reliques et les armes légendaires et au-dessus montent jusqu'au rang 10.`:'.'}</p>`;
  else if(it.wid){const p=wFusePlan(it.wid),sp=wSpares(it.wid).length;if(p.n)fuse=btn(' cx-btn--block','wfuse',it.wid,XSVG.up,`Fusionner ${sp} double${sp>1?'s':''} · ${rkTxt(n)} → ${rkTxt(p.R)}`+gp(p.cost));else if(p.need)fuse=btn(' cx-btn--block','wfuse',it.wid,XSVG.up,`Fusionner · or insuffisant`+gp(p.need),true);else fuse=`<p class="cx-hint" style="margin:0">${rkTxt(n)} · ${sp?`${sp} double${sp>1?'s':''} de rang trop bas pour fusionner`:'aucun double'} : trouve ou fabrique la même arme pour monter de rang.</p>`}
  else{const p=fusePartner(it),c=fuseGold(it.r,n,it.lvl);if(p)fuse=btn(' cx-btn--block','fuse1',key,XSVG.up,`Fusionner avec un double · ${rkTxt(n)} → ${rkTxt(n+1)}`+gp(c),meta.gold<c);else fuse=`<p class="cx-hint" style="margin:0">${rkTxt(n)} · un exemplaire identique (${esc(it.rid?it.name:it.type)}, ${RAR[it.r].n.toLowerCase()}, ${rkTxt(n)}) le fait monter de rang, pour <span class="coin"></span>${c} or.</p>`}
  more.push(btn('','lock',null,XSVG.lock,it.lock?'Déverrouiller':'Verrouiller'));
  if(worn&&it.slot!=='arme')more.push(btn('','unequip',null,XSVG.out,'Retirer au coffre'));
  if(!othC&&isUnl('affix')){if(xfSrcOk(key)&&Object.keys(it.aff).length)more.push(btn('','xftake',key,XSVG.take,'Prendre une affixe'));
    more.push(btn('','xfrecv',key,XSVG.take,'Recevoir une affixe'))}
  if(isUnl('recy')&&!worn&&!othC&&!whoW&&(!it.wid||(wb&&!wb.start)))more.push(btn('','gorecy1',key,XSVG.recy,'Recycler',it.lock));
  const sk=key;if(sk!==cmpKey){cmpKey=sk;cmpPage=0}
  return `<div class="cx-dock__head"><h3 class="cx-dock__title" style="color:${r.c}">${esc(itemName(it))}${it.lock?` <span class="lockchip">${LOCK_SVG}</span>`:''}</h3>${nav}<button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-cact="dclose" aria-label="Fermer la fiche">${XSVG.x}</button></div>
    <span class="cx-dock__meta">${r.n} · ${SLOT[it.slot]}${it.wid?' · fabriquée':` · niveau ${it.lvl}`}${` · ${rkTxt(n)}`}${worn?' · <b style="color:var(--heal)">Porté</b>':''}${whoW?` · <b style="color:${CLS[whoW].col}">Porté ${parCls(whoW)}</b>`:''}${idx>=0?` · ${idx+1} / ${list.length}`:''}</span>
    ${worn||other?affs:cmpObjet(eq,it)}${main}${fuse}${othC?`<p class="cx-hint" style="margin:0">Un objet n'est porté que par un héros à la fois : l'équiper ici le retire ${parCls(othC).replace('par ','à ').replace("à le ","au ")}.</p>`:''}
    <div class="cx-actions" style="gap:6px"><button class="cx-btn cx-btn--sm" data-cact="dmore" aria-expanded="${dockMore}">${dockMore?'Moins d\'actions':'Plus d\'actions'}</button>${worn?'':`<button class="cx-btn cx-btn--sm" data-cact="dall" aria-pressed="${dockAll}">${dockAll?'Masquer les statistiques':'Toutes les statistiques'}</button>`}</div>
    ${dockMore?`<div class="cx-dock__more">${more.join('')}</div>`:''}${it.lock&&!worn?'<p class="cx-hint" style="margin:0">Verrouillé : ni recyclé, ni sacrifié par une fusion, ni utilisé comme source d\'affixe.</p>':''}`;
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

/* ---------- Armurerie › Recyclage : le seul endroit où l'on recycle ---------- */
let recySel=new Set(),recyR=new Set(),recyAsk=false;
const recyKey=it=>it.wid?'w:'+it.wid:'s:'+it.id;
const recyEss=it=>it.wid?wRecyEss(bpdef(it.wid)):recyGain(it);
function recyAll(){return invList('recy').filter(it=>!wornBy(it)&&(!it.wid||!wdef(it.wid).start))}
function recyList(){return recyAll().filter(it=>!recyR.size||recyR.has(it.r))}
function recyPicked(){const all=recyAll();return [...recySel].map(k=>all.find(it=>recyKey(it)===k)).filter(it=>it&&!it.lock)}
// Contenu d'une case d'objet : cadenas s'il est verrouillé, glyphe de l'emplacement, rang s'il a été fusionné.
const cellIn=it=>`${it.lock?`<span class="cx-cell__lock">${LOCK_SVG}</span>`:''}${GLYPH[it.slot]}${it.up?`<span class="cx-cell__up">R${it.up+1}</span>`:''}`;
function recyCell(it){const k=recyKey(it),on=recySel.has(k);return `<button class="cx-cell${on?' is-src':''}" data-cact="rcsel" data-arg="${k}" ${it.lock?'aria-disabled="true"':''} style="--rar:${RARV[it.r]}" aria-pressed="${on}" aria-label="${esc(itemName(it))}${it.lock?', verrouillé':''}${on?', choisi':''}">${cellIn(it)}${on?'<span class="cx-pin cx-pin--src">−</span>':''}</button>`}
function recyCells(){const all=recyAll(),list=recyList();return list.length?`<div class="cx-cells">${list.map(recyCell).join('')}</div>`:`<p class="cx-hint" style="margin:0">${all.length?'Aucun objet pour ce filtre.':'Rien à recycler : ton coffre est vide.'}</p>`}
function campRecycle(){const all=recyAll(),list=recyList();for(const k of [...recySel])if(!all.some(it=>recyKey(it)===k&&!it.lock))recySel.delete(k);
  const rs=[...new Set(all.map(it=>it.r))].sort((a,b)=>a-b),cnt={};for(const it of all)cnt[it.r]=(cnt[it.r]||0)+1;
  const rch=r=>`<button class="cx-chip cx-chip--sm" data-cact="rcr" data-arg="${r}" aria-pressed="${recyR.has(r)}" style="${recyR.has(r)?'':`color:${RAR[r].c}`}">${RAR[r].n} <span class="n">${cnt[r]}</span></button>`;
  const sel=list.filter(it=>!it.lock).length;
  return `${backChip()}<section class="cx-section"><h3 class="cx-section__label">Rareté à recycler</h3><div class="cx-chips"><button class="cx-chip cx-chip--sm" data-cact="rcrall" aria-pressed="${!recyR.size}">Toutes <span class="n">${all.length}</span></button>${rs.map(rch).join('')}</div></section>
    <section class="cx-section"><h3 class="cx-section__label">Objets · ${list.length}</h3>${all.length?invToolbar(list,'recy').replace('<span class="cx-count" id="invCount">','<span class="cx-count">'):''}
    <div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-cact="rcall" ${sel?'':'disabled'}>Tout sélectionner · ${sel}</button><button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="rcnone" ${recySel.size?'':'disabled'}>Tout désélectionner</button></div>
    <div id="invGrid">${recyCells()}</div>
    <p class="cx-hint" style="margin:0">Les objets portés ne sont pas listés ; les objets verrouillés (cadenas) ne se recyclent pas.</p></section>`}
function recyFoot(){const P=recyPicked();if(!P.length)return '<p class="cx-hint">Touche les objets à recycler.</p>';
  const e=P.reduce((a,it)=>a+recyEss(it),0),f=0;
  if(recyAsk)return `<p class="cx-hint">Recycler ${P.length} objet${P.length>1?'s':''} ? Ils sont détruits contre ${e} essence${f?` et ${f} fragment${f>1?'s':''}`:''}.</p><div class="row"><button class="cx-btn cx-btn--ghost" data-cact="rcno">Annuler</button><button class="cx-btn cx-btn--danger" data-cact="rcok">Recycler</button></div>`;
  return `<button class="cx-btn cx-btn--danger cx-btn--cost" data-cact="${P.length>1?'rcask':'rcok'}">Recycler · ${P.length} <span class="cx-price ess"><i class="cx-ess"></i>+${e}</span></button>`}
function recyDo(){const P=recyPicked();if(!P.length)return;let e=0,f=0;
  for(const it of P){e+=recyEss(it);
    if(it.wid)wDestroy(it.wid); // un double prend la place de l'arme recyclée (le plus haut rang) ; sinon l'arme disparaît
    else meta.stash=meta.stash.filter(x=>x!==it)}
  meta.essence+=e;recySel.clear();recyAsk=false;SND.play('pick2');
  toast(`${P.length} objet${P.length>1?'s':''} recyclé${P.length>1?'s':''} · +${e} essence${f?` · ${f} fragment${f>1?'s':''}`:''}`)}
