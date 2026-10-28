// Crypte des Cendres — arsenal.js : onglet Arsenal (coffre, plans et fragments, fabrication, recyclage) et ses actions. Les armes possédées sont dans Héros › Équipement › Arme depuis la v137. Découpé de camp.js en v135.
// Héros : les objets dont tu as des fragments, avec un lien vers l'Arsenal.
function fragInv(){
  const ids=craftIds().filter(id=>(meta.parts[id]||[]).some(n=>n>0)).sort((a,b)=>fragStatus(b)-fragStatus(a)||bpdef(b).r-bpdef(a).r);
  if(!ids.length)return '<p class="cx-hint" style="margin:0">Aucun fragment. Ouvre des reliques en mission : chacune donne un fragment d\'un objet de sa rareté. Trois fragments d\'un même objet se fabriquent dans Arsenal › Recettes.</p>';
  return `<ul class="partlist">${ids.slice(0,12).map(id=>{const b=bpdef(id),pc=meta.parts[id];
    return `<li><b style="color:${RAR[b.r].c}">${esc(b.n)}</b> <span style="color:var(--muted)">(${fragStatus(id)} / 3)</span> · ${b.frag.map((n,i)=>`<span style="color:${pc[i]?'var(--heal)':'var(--muted)'}">${n}${pc[i]>1?' ×'+pc[i]:''}</span>`).join(', ')}</li>`}).join('')}${ids.length>12?`<li class="cx-hint" style="margin:0">… et ${ids.length-12} autres</li>`:''}</ul>
`;
}
let fuseTgt={};
function giveFrag(id){const pc=meta.parts[id]||(meta.parts[id]=[0,0,0]),miss=[0,1,2].filter(i=>!pc[i]),i=miss.length?pick(miss):ri(0,2);pc[i]++;return i}
// Essence rendue par une arme recyclée : selon sa rareté et son rang (un rang vaut deux exemplaires).
// Où trouver un objet : sa relique et la difficulté où elle tombe.
const srcTxt=b=>b.r>=3?`Relique <b style="color:${RTIER[b.r-3].c}">${RTIER[b.r-3].n}</b> · ${REL_SRC[b.r-3]}`:'Butin des monstres et des Gardiens';
function bpCard(b){
  const pc=meta.parts[b.id]||[0,0,0],isW=b.kind==='arme',r=RAR[b.r],mine=!isW||b.cls===heroCls;
  const own=isW&&ownedW(b.id),eq=isW&&curWid(b.cls)===b.id,craftable=b.r>=3,ready=craftable&&pc.every(x=>x>0),cost=b.craft;
  const lvl=relicItemLvl();
  const baseTxt=isW?`${b.dmg} dégâts de base`:baseTxtOf(b.slot,Math.round(baseRoll(b.slot,lvl)*RB[b.r]));
  const lines=isW?Object.keys(b.aff).map(k=>`<li${AFF[k].aby?' class="abyp"':''}>${AFF[k].t(b.aff[k])}</li>`).join(''):rgAff(b).map(k=>`<li>${AFF_NAME[k]||k}</li>`).join('')+(b.pw?`<li class="abyp">${AFF[b.pw].t(AFF[b.pw].r(lvl))}</li>`:'');
  const sp=isW?wSpares(b.id).length:0;
  let st=isW?(own?`<span class="owned">${eq?'Équipée':'Possédée'} · ${rkTxt(meta.wlv[b.id])}${sp?` · ${sp} double${sp>1?'s':''}`:''}${mine?'':' · '+CLS[b.cls].n}</span>`:''):'';
  let foot='';
  if(craftable)foot=`<div class="parts">${b.frag.map((n,i)=>`<span class="part${pc[i]?' have':''}">${n}${pc[i]>1?' ×'+pc[i]:''}</span>`).join('')}</div>
    <button class="btn main buy cost-btn" data-cact="craft" data-arg="${b.id}" ${ready&&meta.gold>=cost?'':'disabled'}><span>${isW&&own?'Fabriquer un double':'Fabriquer'}</span>${costHtml([['or',cost],['pf',3,pc.filter(x=>x>0).length]])}</button>`;
  if(isW&&own&&!eq&&mine)foot+=`<button class="btn" data-cact="wequip" data-arg="${b.id}">Équiper</button>`;
  return `<div class="wpn${eq&&mine?' on':''}"><div class="nm" style="color:${r.c}">${esc(b.n)}</div><div class="meta">${r.n} · ${isW?'Arme · '+CLS[b.cls].n:SLOT[b.slot]+(b.bio&&BIOMES[b.bio]?` · ${BIOMES[b.bio].ic} ${BIOMES[b.bio].n}`:'')} · ${baseTxt}${!isW?` · niveau ${lvl}`:''}</div>
    <ul>${lines||'<li>Aucun bonus</li>'}</ul>
    <div class="meta">${srcTxt(b)}${isW&&!craftable?'':''}</div>${st}<div class="wfoot">${foot}</div></div>`;
}
let arsAsk=null;
function craftPlan(){const ids=craftIds(),parts={},plan=[];let gold=meta.gold;for(const id of ids)parts[id]=[...(meta.parts[id]||[0,0,0])];
  for(const id of ids){const b=bpdef(id);for(let n=0;n<20;n++){const pc=parts[id];if(!pc.every(x=>x>0)||gold<b.craft)break;parts[id]=pc.map(x=>x-1);gold-=b.craft;plan.push(id)}}
  return {plan,cost:meta.gold-gold}}
function craftOne(id){const b=bpdef(id),pc=meta.parts[id];if(!b||b.r<3||!pc||!pc.every(x=>x>0)||meta.gold<b.craft)return null;
  meta.parts[id]=pc.map(x=>x-1);meta.gold-=b.craft;
  if(b.kind==='arme'){const g=gainWeapon(id);if(g==='new'&&b.cls===heroCls)meta.wpn[heroCls]=id;return g}
  const it=rgItem(id,relicItemLvl());meta.stash.push(it);return it}
function arsBar(){const cp=craftPlan();
  let h=`<div class="actions" style="margin:0"><button class="btn cost-btn${cp.plan.length?' main':''}" data-cact="craftask" ${cp.plan.length?'':'disabled'}><span>Tout fabriquer${cp.plan.length?` · ${cp.plan.length}`:''}</span>${cp.plan.length?costHtml([['or',cp.cost],['pf',cp.plan.length*3]]):''}</button>${isUnl('fuse')?'<button class="btn" data-cact="gofuse">Fusionner à la Forge</button>':''}</div>`;
  if(arsAsk==='craft'&&cp.plan.length){const cnt={};for(const id of cp.plan)cnt[id]=(cnt[id]||0)+1;
    h+=`<div class="card"><p style="margin:0;font-size:14px">Fabriquer ${cp.plan.length} objet${cp.plan.length>1?'s':''} pour <b><span class="coin"></span> ${cp.cost} or</b> : ${Object.keys(cnt).map(id=>`<b style="color:${RAR[bpdef(id).r].c}">${esc(bpdef(id).n)}</b>${cnt[id]>1?' ×'+cnt[id]:''}`).join(', ')}.</p><div class="actions"><button class="btn main cost-btn" data-cact="craftall"><span>Fabriquer</span>${costHtml([['or',cp.cost],['pf',cp.plan.length*3]])}</button><button class="btn" data-cact="arsno">Annuler</button></div></div>`}
  return h}
let arsView='coffre',arsR='w';
function campArsenal2(){
  const nOwn=Object.values(WPN).flat().filter(w=>ownedW(w.id)).length;
  const cur=arsView==='heros'?'coffre':arsView,tv=(k,lab,n)=>`<button class="cx-tab" role="tab" data-cact="arsv" data-arg="${k}" aria-selected="${cur===k}">${lab}${n!=null?` <span class="n">${n}</span>`:''}</button>`;
  const ak={rec:'craft',recy:'recy'},lk=k=>ak[k]&&!isUnl(ak[k]);
  const tv2=(k,lab,n)=>lk(k)?tv(k,`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>${lab}`).replace('class="cx-tab"','class="cx-tab is-locked"'):tv(k,lab,n);
  const tabs=`<div class="cx-tabs" role="tablist" aria-label="Arsenal">${tv('coffre','Coffre')}${tv2('rec','Recettes')}${tv2('recy','Recycler')}</div>`
    +(cur==='coffre'?`<div class="cx-chips ars__sub" role="radiogroup" aria-label="Affichage du coffre"><button class="cx-chip cx-chip--sm" role="radio" data-cact="arsv" data-arg="coffre" aria-checked="${arsView==='coffre'}">Tout le coffre <span class="n">${stashN()}</span></button><button class="cx-chip cx-chip--sm" role="radio" data-cact="arsv" data-arg="heros" aria-checked="${arsView==='heros'}">Par héros</button></div>`:'');
  if(lk(arsView))return `${campMsg}${tabs}${lockedHtml(ak[arsView])}`;
  const nc=ak[arsView]?newCard(ak[arsView]):'';
  if(arsView==='coffre')return `${campMsg}${tabs}${campCoffre()}`;
  if(arsView==='heros')return `${campMsg}${tabs}${herosView()}`;
  if(arsView==='recy')return `${campMsg}${tabs}${nc}${campRecycle()}`;
  const ready=id=>{const pc=meta.parts[id]||[0,0,0];return pc.every(x=>x>0)};
  const nReady=craftIds().filter(ready).length;
  const ch=(k,lab,c,n)=>`<button class="cx-chip cx-chip--sm" data-cact="arsr" data-arg="${k}" aria-pressed="${arsR===k}"${c&&arsR!==k?` style="color:${c}"`:''}>${lab}${n!=null?` <span class="n">${n}</span>`:''}</button>`;
  let h=`${campMsg}${tabs}${arsBar()}<p class="cx-hint" style="margin:0">Les armes communes, magiques et rares tombent des monstres. Tout ce qui est légendaire ou plus rare se fabrique avec 3 fragments, trouvés en ouvrant les reliques de sa rareté. Un objet fabriqué sort au niveau d'objet de ta plus haute mission réussie (niveau ${maxL()} → objet niveau ${relicItemLvl()}).</p>${cxMore('ars_frags','Tes fragments de reliques',fragInv(),'Afficher')}
    <div class="cx-chips">${ch('w','Armes · '+CLS[heroCls].n)}${[3,4,5,6].map(r=>ch(String(r),RAR[r].n,RAR[r].c)).join('')}${ch('ready','Prêts',null,nReady)}${ch('o','Autres classes')}</div>`;
  let list=[];
  if(arsR==='w')list=WPN[heroCls].map(w=>w.id);
  else if(arsR==='o')list=Object.keys(WPN).filter(c=>c!==heroCls).flatMap(c=>WPN[c].filter(w=>w.r>=3||ownedW(w.id))).map(w=>w.id);
  else if(arsR==='ready')list=craftIds().filter(ready);
  else list=Object.keys(RGEAR).filter(id=>RGEAR[id].r===+arsR);
  if(!list.length)h+='<p class="cx-hint" style="margin:0">Rien à fabriquer pour l\'instant : il faut les 3 fragments.</p>';
  return h+list.map(id=>bpCard(bpdef(id))).join('');
}

Object.assign(CAMP_ACT,{
  toarsenal:function(a,arg,b,d){{campTab='arsenal';campSel=null}return CAMP_GO},
  // depuis Héros › Équipement, le coffre s'ouvre filtré sur l'emplacement choisi (arg = arme, armure, anneau…)
  gocoffre:function(a,arg,b,d){{campTab='arsenal';arsView='coffre';campSel=null;if(arg&&(arg==='arme'||SLOT[arg])){stF=arg;campTop=true}}return CAMP_GO},
  goheros:function(a,arg,b,d){{campTab='arsenal';arsView='heros';campSel=null}return CAMP_GO},
  craftask:function(a,arg,b,d){{arsAsk=arsAsk==='craft'?null:'craft'}return CAMP_GO},
  arsno:function(a,arg,b,d){{arsAsk=null}return CAMP_GO},
  craftall:function(a,arg,b,d){{const cp=craftPlan();let n=0;for(const id of cp.plan)if(craftOne(id))n++;arsAsk=null;if(n){SND.play('pick3');toast(`${n} objet${n>1?'s':''} fabriqué${n>1?'s':''}`)}}return CAMP_GO},
  craft:function(a,arg,b,d){{const b=bpdef(arg),g=craftOne(arg);if(g){SND.play('pick3');
        if(g==='new')toast(`<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> fabriquée${b.cls===heroCls?' et équipée':''}`);
        else if(g==='copy')toast(`Double de <b style="color:${RAR[b.r].c}">${esc(b.n)}</b> fabriqué : fusionne-le à la Forge pour monter de rang`);
        else toast(`<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> niveau ${g.lvl} fabriqué, il t'attend au coffre`)}}return CAMP_GO},
  arsr:function(a,arg,b,d){{arsR=arg}return CAMP_GO},
});
