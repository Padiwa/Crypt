// Crypte des Cendres — heros.js : onglet Héros (couleurs, prestige, sorts et talents) et ses actions. Découpé de camp.js en v135.
// Héros › Couleurs du héros : cape, bordure et capuche de chaque classe, avec un aperçu. Nuancier + couleur libre.
let lookCls=null;
const lookC=()=>CLS[lookCls]?lookCls:heroCls;
function lookHtml(){const c=lookC(),a=myLook(c),d=lookDef(c),same=a.every((x,i)=>x===d[i]),cn=CLS[c].n.toLowerCase();
  const chip=k=>`<button class="cx-chip cx-chip--sm" data-cact="lookcls" data-arg="${k}" aria-pressed="${k===c}">${CLS[k].n}</button>`;
  const row=(p,i)=>{const L=LOOK_SW[p.k],free=!L.includes(a[i]);
    return `<div class="lookrow"><span class="lookk">${p.n}</span><div class="looksw" role="radiogroup" aria-label="${p.n} du ${cn}">${L.map(col=>`<button class="lsw" role="radio" aria-checked="${col===a[i]}" data-cact="look" data-arg="${i}|${col}" style="--sw:${col}" aria-label="${p.n} ${col}${col===d[i]?', couleur d\'origine':''}"></button>`).join('')}<label class="lsw lsw--free${free?' is-on':''}" style="--sw:${a[i]}"><input type="color" value="${a[i]}" data-look="${i}" aria-label="${p.n} : autre couleur"></label></div></div>`};
  return `<section class="cx-section" id="lookSec"><h3 class="cx-section__label">Couleurs du héros</h3>
    <div class="lookhead"><canvas class="lookprev" id="lookPrev" width="240" height="240" role="img" aria-label="Aperçu du ${cn}"></canvas>
      <div class="lookside"><div class="cx-chips" aria-label="Classe">${Object.keys(CLS).map(chip).join('')}</div>
      <button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="lookreset" data-arg="${c}" ${same?'disabled':''}>Couleurs d'origine</button></div></div>
    <div class="lookrows">${LOOK_PARTS.map(row).join('')}</div>
    <p class="cx-hint" style="margin:0">Chaque classe garde ses couleurs. En coopération, les autres joueurs les voient.</p></section>`}
function lookSet(c,i,col){const a=myLook(c).slice();a[i]=col.toLowerCase();meta.look=meta.look||{};const d=lookDef(c);if(a.every((x,j)=>x===d[j]))delete meta.look[c];else meta.look[c]=a}
function lookPaint(){const el=document.getElementById('lookPrev');if(!el)return;const c=lookC(),g=el.getContext('2d'),W=el.width,k=W/66;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,el.height);g.setTransform(k,0,0,k,W/2-11*k,el.height/2);g.rotate(-.35);
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(2,6,19,15,0,0,7);g.fill();
  const old=ctx;ctx=g;try{pPlayer(c,false,lookPal(c,myLook(c)))}finally{ctx=old}}
function prestSection(){
  const c=heroCls,o=prOf(c),free=prFree(c),op=prOpen(),cost=prCost(o.lv),nmax=UPG.filter(u=>lv(u.k)>=u.max).length;
  let h=`<h3>Prestige · ${CLS[c].n}${o.lv?` · niveau ${o.lv}`:''}</h3>`;
  if(!op&&!o.lv)return h+`<p class="empty" style="font-size:13px">Le prestige se débloque quand toutes les améliorations permanentes sont au maximum (${nmax} / ${UPG.length}). Ensuite, chaque niveau de prestige donne 1 point à placer dans une statistique du ${CLS[c].n.toLowerCase()}, sans limite de niveau.</p>`;
  h+=`<p class="empty" style="font-size:13px">Chaque niveau de prestige donne 1 point à placer dans une statistique. Le prestige est propre à chaque héros et n'a pas de limite. Tu peux redistribuer tes points gratuitement.</p>
  <div class="up"><b>Niveau de prestige ${o.lv} → ${o.lv+1}</b><button class="btn buy cost-btn" data-cact="prbuy" ${meta.gold<cost.gold||meta.essence<cost.ess?'disabled':''}><span>Monter</span>${costHtml([['or',cost.gold],['ess',cost.ess]])}</button>
  <p style="grid-column:1/-1">${free?`<b style="color:var(--ember)">${free} point${free>1?'s':''} à placer</b>`:'Aucun point à placer'} · ${o.lv} au total</p></div><div class="ups">`;
  h+=PREST.map(q=>{const n=prPt(q.k,c),mx=q.max&&n>=q.max,v=n*q.per;
    return `<div class="up"><b>${q.n}${n?` · ${n}`:''}</b><button class="btn" data-cact="pradd" data-arg="${q.k}" ${!free||mx?'disabled':''} aria-label="Placer un point en ${q.n}">${mx?'Max':'+1'}</button>
      <p style="grid-column:1/-1">${q.neg?'−':'+'}${prFmt(q.per)} ${q.t} par point${n?` · actuel ${q.neg?'−':'+'}${prFmt(v)} %`:''}${q.max?` · max ${q.max} points`:''}</p></div>`}).join('');
  h+=`</div>${o.lv-free?'<div class="actions" style="margin:0"><button class="btn" data-cact="prreset">Redistribuer les points</button></div>':''}`;
  return h;
}
// Héros › Sorts et talents (v132) : un sort et un ultime au choix parmi 3 (le 2e au rang 3 de maîtrise, le 3e au rang 6), puis les 3 talents (achetés avec l'or du Camp).
function heroKit(){const c=heroCls,K=kitOf(c),mr=mastOf(c).r;
  const card=(t,i,sp)=>{const on=(t==='s'?K.s:K.u)===i,lock=i>0&&!kitOk(c,i);
    return `<button class="kitc${on?' is-on':''}${lock?' is-locked':''}" data-cact="kit" data-arg="${t}|${i}" aria-pressed="${on}" ${lock?'disabled':''}><span class="kitc__i" aria-hidden="true"><svg viewBox="0 0 24 24">${sp.icon}</svg></span><span class="kitc__t"><b>${sp.n}</b>${t==='s'?`<small>recharge ${fmtN(sp.cd)} s</small>`:''}</span><span class="kitc__d">${sp.d}</span>${lock?`<span class="kitc__st">${LOCK_SVG} Maîtrise rang ${KIT_MAST[i]}</span>`:on?'<span class="kitc__st is-on">Choisi</span>':''}</button>`};
  return `<section class="cx-section"><h3 class="cx-section__label">Sort · touche E</h3><div class="kitl">${SPELLS[c].s.map((sp,i)=>card('s',i,sp)).join('')}</div></section>
    <section class="cx-section"><h3 class="cx-section__label">Ultime · touche F</h3><div class="kitl">${SPELLS[c].u.map((sp,i)=>card('u',i,sp)).join('')}</div></section>
    <p class="cx-hint" style="margin:0">Maîtrise du ${CLS[c].n.toLowerCase()} : rang ${mr} / 10. Le 2e sort et le 2e ultime s'ouvrent au rang 3, les 3es au rang 6 ; la maîtrise monte avec les ennemis abattus. Les dégâts suivent les dégâts de compétence, la portée et la durée des compétences, la recharge et les dégâts de l'ultime.</p>`}
function heroTalents(){const C=CLS[heroCls];
  const tals=TAL[heroCls].map(t=>{const own=hasTal(t.k);
    return `<div class="tal${own?' own':''}"><b>${t.n}</b><p>${t.d}</p>${own?'<span class="owned">Acquis</span>':`<button class="btn buy cost-btn" data-cact="tal" data-arg="${t.k}" ${meta.gold<t.cost||!isUnl('bonus')?'disabled':''}><span>Acheter</span>${costHtml([['or',t.cost]])}</button>`}</div>`}).join('');
  const n=TAL[heroCls].filter(t=>hasTal(t.k)).length;
  return `<p style="margin:0">${C.desc}</p>${heroKit()}
    <h3>Talents · ${C.n} · ${n} / ${TAL[heroCls].length}</h3><div class="tals">${tals}</div>${isUnl('bonus')?'':`<p class="cx-hint" style="margin:0">${UNL_BY.bonus.need} pour acheter des talents.</p>`}`}
$('campBody').addEventListener('input',e=>{const i=e.target.dataset.look;if(i!=null){lookSet(lookC(),+i,e.target.value);const l=e.target.parentElement;l.style.setProperty('--sw',e.target.value);l.classList.add('is-on');lookPaint()}});
// couleur libre : enregistrée et envoyée aux autres joueurs quand le choix est fait
$('campBody').addEventListener('change',e=>{if(e.target.dataset.look==null)return;lookSet(lookC(),+e.target.dataset.look,e.target.value);saveMeta();if(typeof netMe==='function')netMe();drawCamp()});
// Héros › Équipements enregistrés : renommer
$('campBody').addEventListener('change',e=>{const i=e.target.dataset.setname;if(i==null)return;const s=setsOf()[+i];if(s){s.n=e.target.value.trim().slice(0,24)||s.n;saveMeta()}});

Object.assign(CAMP_ACT,{
  lock:function(a,arg,b,d){if(campSel&&(campSel.wpn||campSel.slot==='arme')){{const wid=campSel.wpn||curWid();meta.wlock=meta.wlock||{};meta.wlock[wid]=!meta.wlock[wid];const on=meta.wlock[wid];cxUndo(`${esc(wdef(wid).n)} ${on?'verrouillée':'déverrouillée'}`,()=>{meta.wlock[wid]=!on})}return CAMP_GO}{const it=campSel&&campSel.stash?meta.stash.find(i=>i.id===campSel.stash):campSel&&campSel.slot?meta.gear[campSel.slot]:campSel&&campSel.oth?(meta.gearBy[campSel.oth.split('|')[0]]||{})[campSel.oth.split('|')[1]]:null;if(it){it.lock=!it.lock;cxUndo(`${esc(itemName(it))} ${it.lock?'verrouillé':'déverrouillé'}`,()=>{it.lock=!it.lock})}}return CAMP_GO},
  bestall:function(a,arg,b,d){{const plan=bestPlan(curEq(),meta.stash,true),names=[];for(const sl in plan){const it=plan[sl];
      if(sl==='arme'){meta.wpn[heroCls]=it.wid;names.push(`<span style="color:${RAR[it.r].c}">${esc(wdef(it.wid).n)}</span>`);continue}meta.stash=meta.stash.filter(i=>i!==it);wearGear(sl,it);names.push(`<span style="color:${RAR[it.r].c}">${esc(itemName(it))}</span>`)}campSel=null;if(names.length)toast('Équipé : '+names.join(', '))}return CAMP_GO},
  equip:function(a,arg,b,d){{const it=meta.stash.find(i=>i.id===campSel.stash),k=it&&slotFor(curEq(),it);if(it&&k){meta.stash=meta.stash.filter(i=>i!==it);wearGear(k,it);campSel={slot:k}}}return CAMP_GO},
  equipoth:function(a,arg,b,d){if(campSel&&campSel.oth){{const [c,k]=campSel.oth.split('|'),it=(meta.gearBy[c]||{})[k],t=it&&slotFor(curEq(),it);if(it&&t){meta.gearBy[c][k]=null;wearGear(t,it);campSel={slot:t};toast(`<span style="color:${RAR[it.r].c}">${esc(itemName(it))}</span> équipé sur ${esc(CLS[heroCls].n)}, retiré ${parCls(c).replace('par ','à ').replace("à le ","au ")}`)}}return CAMP_GO}return CAMP_GO},
  setsave:function(a,arg,b,d){{const i=arg===''||arg==null?-1:+arg;if(i<0&&setsOf().length>=SET_MAX)return;const s=setSave(i<0?setsOf().length:i);toast(`<b>${esc(s.n)}</b> enregistré`)}return CAMP_GO},
  setwear:function(a,arg,b,d){{const r=setWear(+arg),s=setsOf()[+arg];if(r){campSel=null;toast(`<b>${esc(s.n)}</b> porté`+(r.from.length?` · pris ${r.from.map(c=>parCls(c).replace('par ','à ').replace("à le ","au ")).join(' et ')}`:'')+(r.miss?` · ${r.miss} objet${r.miss>1?'s':''} introuvable${r.miss>1?'s':''} (recyclé ou fusionné)`:'')+(r.mm?` · ${r.mm} mod${r.mm>1?'s':''} non remis (absent ou capacité dépassée)`:'')+(r.petMiss?' · familier introuvable (fusionné)':''))}}return CAMP_GO},
  setdel:function(a,arg,b,d){{const L=setsOf(),i=+arg,s=L[i];if(s){L.splice(i,1);cxUndo(`<b>${esc(s.n)}</b> supprimé`,()=>{setsOf().splice(i,0,s)})}}return CAMP_GO},
  unequip:function(a,arg,b,d){{const s=campSel.slot,it=meta.gear[s];if(it){meta.stash.push(it);meta.gear[s]=null;campSel={stash:it.id}}}return CAMP_GO},
  wequip:function(a,arg,b,d){{if(ownedW(arg)&&wclsOf(arg)===heroCls){meta.wpn[heroCls]=arg;if(campTab==='equip'||isCoffre())campSel={slot:'arme'}}}return CAMP_GO},
  slotopen:function(a,arg,b,d){{const u=SLOT_U.find(x=>x.k===arg);if(u&&slotCan(u)){meta.hfrag-=u.hf;meta.gold-=u.gold;meta.slotU[u.k]=true;meta.gear[u.k]=null;SND.play('leg');toast(`Emplacement <b>${u.n}</b> débloqué`)}}return CAMP_GO},
  dclose:function(a,arg,b,d){{campSel=null}return CAMP_GO},
  dmore:function(a,arg,b,d){{dockMore=!dockMore}return CAMP_GO},
  dall:function(a,arg,b,d){{dockAll=!dockAll}return CAMP_GO},
  dnav:function(a,arg,b,d){{const L=gearOn()?gearList():invList('equip'),i=L.findIndex(isSel),n=L[i+(+arg)];if(n)campSel=selOf(n)}return CAMP_GO},
  lookcls:function(a,arg,b,d){{lookCls=arg}return CAMP_GO},
  look:function(a,arg,b,d){{const [i,col]=arg.split('|');lookSet(lookC(),+i,col);if(typeof netMe==='function')netMe()}return CAMP_GO},
  lookreset:function(a,arg,b,d){{if(meta.look)delete meta.look[arg];if(typeof netMe==='function')netMe()}return CAMP_GO},
  prbuy:function(a,arg,b,d){{const o=prOf(),c=prCost(o.lv);if((prOpen()||o.lv)&&meta.gold>=c.gold&&meta.essence>=c.ess){meta.gold-=c.gold;meta.essence-=c.ess;o.lv++;toast(`Prestige du ${CLS[heroCls].n} : niveau ${o.lv}. Place ton point.`);if(typeof netMe==='function')netMe()}}return CAMP_GO},
  pradd:function(a,arg,b,d){{const o=prOf(),q=PREST.find(x=>x.k===arg);if(q&&prFree()>0&&!(q.max&&prPt(q.k)>=q.max))o.pts[q.k]=prPt(q.k)+1}return CAMP_GO},
  prreset:function(a,arg,b,d){{prOf().pts={}}return CAMP_GO},
  tal:function(a,arg,b,d){{const t=TAL[heroCls].find(x=>x.k===arg);if(meta.gold>=t.cost){meta.gold-=t.cost;meta.tal[t.k]=true}}return CAMP_GO},
  kit:function(a,arg,b,d){{const [t,i]=arg.split('|'),n=+i;if((t==='s'||t==='u')&&(n===0||kitOk(heroCls,n))){meta.kit=meta.kit||{};const K=meta.kit[heroCls]||(meta.kit[heroCls]={s:0,u:0});K[t]=n;const sp=SPELLS[heroCls][t][n];toast(`${t==='s'?'Sort':'Ultime'} : <b>${sp.n}</b>`)}}return CAMP_GO},
});
