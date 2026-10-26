// Crypte des Cendres — camp.js
/* ---------- Camp ---------- */
let campTab='equip',campSel=null;
function syncEq(){if(G&&(!started||G.over)){G.eq=curEq();S=stats(G.eq);G.P.hp=S.hp}}
let campMsg='',recyConfirm=false;
function fragStatus(id){const pc=meta.parts[id]||[0,0,0];return pc.filter(n=>n>0).length}
let stF='all',stS='rar',stP=0;const ST_PAGE=24;
function stashView(){
  const counts={all:meta.stash.length};for(const it of meta.stash)counts[it.slot]=(counts[it.slot]||0)+1;
  let list=meta.stash.filter(i=>stF==='all'||i.slot===stF);
  const by={rar:(a,b)=>b.r-a.r||(b.up||0)-(a.up||0)||b.lvl-a.lvl,up:(a,b)=>(b.up||0)-(a.up||0)||b.r-a.r,lvl:(a,b)=>b.lvl-a.lvl||b.r-a.r,new:(a,b)=>b.id-a.id};
  list=[...list].sort(by[stS]);
  const pages=Math.max(1,Math.ceil(list.length/ST_PAGE));stP=clamp(stP,0,pages-1);
  const pageItems=list.slice(stP*ST_PAGE,stP*ST_PAGE+ST_PAGE);
  const fChip=(k,lab)=>`<button class="chip" data-cact="sfilter" data-arg="${k}" aria-pressed="${stF===k}">${lab} <span style="color:var(--muted)">${counts[k]||0}</span></button>`;
  const sChip=(k,lab)=>`<button class="chip sm" data-cact="ssort" data-arg="${k}" aria-pressed="${stS===k}">${lab}</button>`;
  return `<div class="alrow">${fChip('all','Tout')}${['armure','amulette','bottes','anneau'].map(k=>fChip(k,SLOT[k])).join('')}</div>
    <div class="alrow" style="align-items:center"><span class="empty" style="font-size:12px">Trier :</span>${sChip('rar','Rareté')}${sChip('up','Amélioration')}${sChip('lvl','Niveau')}${sChip('new','Récents')}</div>
    ${pageItems.length?`<div class="grid">${pageItems.map(it=>cellHtml(it,'stash',campSel&&campSel.stash===it.id,better(it))).join('')}</div>`:`<p class="empty">${meta.stash.length?'Aucun objet de ce type.':'Ton coffre est vide. Sors vivant d\'une mission pour y ramener les objets trouvés.'}</p>`}
    ${pages>1?`<div class="pager"><button class="btn" data-cact="spage" data-arg="-1" ${stP===0?'disabled':''} aria-label="Page précédente">‹</button><span>Page ${stP+1} / ${pages}</span><button class="btn" data-cact="spage" data-arg="1" ${stP>=pages-1?'disabled':''} aria-label="Page suivante">›</button></div>`:''}`;
}
function fragInv(){
  const ids=[...WPN.archer,...WPN.guerrier,...WPN.magicien,...GEAR_BP].map(x=>x.id).filter(id=>(meta.parts[id]||[]).some(n=>n>0));
  if(!ids.length)return '<p class="empty" style="font-size:13px">Aucun fragment. Ouvre des reliques pour en obtenir, puis fabrique l\'équipement à l\'Armurerie.</p>';
  return `<ul class="partlist">${ids.map(id=>{const b=bpdef(id),pc=meta.parts[id];
    return `<li><b style="color:${RAR[b.r].c}">${b.n}</b> <span style="color:var(--muted)">(${fragStatus(id)} / 3)</span> · ${b.frag.map((n,i)=>`<span style="color:${pc[i]?'var(--heal)':'var(--muted)'}">${n}${pc[i]>1?' ×'+pc[i]:''}</span>`).join(', ')}</li>`}).join('')}</ul>
    <button class="btn" data-cact="toarsenal" style="align-self:flex-start">Voir les recettes à l'Armurerie</button>`;
}
function relicBtns(bid){
  return Object.keys(RELICS).filter(id=>RELICS[id].rw.some(x=>x.split(':')[0]===bid)).map(id=>{
    const a=meta.relics[id]||[0,0],tc=RTIER[RELICS[id].t].c,out=[];
    const eqb=(rad,lab)=>{const n=relicQN(id,rad),own=a[rad?1:0];return `<button class="btn relb" data-cact="rqadd" data-arg="${id}|${rad?1:0}" style="--tc:${tc}" ${n>=own?'disabled':''}>${n>=own?`${lab} : tout équipé (${n})`:`Équiper ${lab} · ${n} / ${own}`}</button>`};
    if(a[0])out.push(eqb(false,relicName(id)));
    if(a[1])out.push(eqb(true,relicName(id)+' éclatante'));
    return out.length?out.join(''):`<span class="part" title="Tu n'as pas cette relique">${relicName(id)}</span>`}).join('');
}
// Où trouver les fragments d'un schéma : chaque relique qui en donne, sa tranche de niveaux, ce que tu possèdes, et les autres sources.
const REL_LV=['missions 1 à 10','missions 11 à 25','missions 26 à 40','missions 41 et plus'];
function bpSources(b){const pcs=meta.parts[b.id]||[0,0,0],miss=b.frag.filter((n,i)=>!pcs[i]);
  const rel=Object.keys(RELICS).filter(id=>!RELICS[id].fz&&RELICS[id].rw.some(x=>x.split(':')[0]===b.id));
  const rows=rel.map(id=>{const R=RELICS[id],a=meta.relics[id]||[0,0],tc=RTIER[R.t].c,n=R.rw.filter(x=>x.split(':')[0]===b.id).length;
    const eqb=(rad,lab)=>{const q=relicQN(id,rad),own=a[rad?1:0];return own?`<button class="btn relb" data-cact="rqadd" data-arg="${id}|${rad?1:0}" style="--tc:${tc}" ${q>=own?'disabled':''}>${q>=own?`${lab} : équipée (${q})`:`Équiper ${lab} · ${q} / ${own}`}</button>`:''};
    const btns=eqb(false,'intacte')+eqb(true,'éclatante');
    return `<li><span class="rgem sm" style="--tc:${tc}">${RELIC_SVG}</span><div><b style="color:${tc}">${R.n}</b><span class="cx-hint" style="margin:0">Relique ${RTIER[R.t].n} · ${R.bio?'Abîmes gelés, ':''}${REL_LV[R.t]}${n>1?` · ${n} récompenses sur 6`:''}${a[0]||a[1]?` · tu en as ${a[0]+a[1]}`:' · pas encore trouvée'}</span>${btns?`<div class="actions" style="margin:4px 0 0">${btns}</div>`:''}</div></li>`}).join('');
  const other=[];
  if(b.kind==='arme'&&b.r>=1&&b.r<=2)other.push(`Monstres et Gardiens en mission, dès le niveau 2${b.cls===heroCls?'':` (en jouant le ${CLS[b.cls].n})`}`);
  if(b.r===3)other.push('Relique forgée : fusionne 3 reliques Abysse dans l\'onglet Reliques et choisis ce schéma, puis ouvre-la en mission');
  if(b.relicOnly)other.push('Uniquement dans ces reliques : ni en mission, ni par la fusion');
  return `<div class="bpsrc"><div class="meta">${miss.length?`Il te manque : <b>${miss.join(', ')}</b>. `:'Tu as les 3 fragments. '}Où les trouver :</div><ul class="srcl">${rows}${other.map(t=>`<li><span class="srcdot" aria-hidden="true"></span><div><span class="cx-hint" style="margin:0">${t}</span></div></li>`).join('')}</ul></div>`}
let wRecy=null,fuseTgt=null;
const primeBp=it=>it&&it.type==='Prime'?(it.bp||(GEAR_BP.find(g=>g.n===it.name)||{}).id||null):null;
function giveFrag(id){const pc=meta.parts[id]||(meta.parts[id]=[0,0,0]),miss=[0,1,2].filter(i=>!pc[i]),i=miss.length?pick(miss):ri(0,2);pc[i]++;return i}
const wRecyEss=b=>40*(b.r+1)+Math.floor(upInvested(meta.wlv[b.id]||0)/2);
const primeRecyEss=it=>40*(it.r+1)+Math.floor(upInvested(it.up)/2);
function bpCard(b){
  const pc=meta.parts[b.id]||[0,0,0],isW=b.kind==='arme',r=RAR[b.r],mine=!isW||b.cls===heroCls;
  const own=isW&&ownedW(b.id),eq=isW&&(meta.wpn[b.cls]||WPN[b.cls][0].id)===b.id;
  const cost=isW?Math.round(b.bp/2):b.craft,ready=pc.every(x=>x>0);
  const baseTxt=isW?`${b.dmg} dégâts de base`:baseTxtOf(b.slot,b.base);
  let foot;
  const canRecy=false; // le recyclage se fait dans Forge › Recyclage
  if(own)foot=(eq?`<span class="owned">Équipée${mine?'':' · '+CLS[b.cls].n}</span>`:mine?`<button class="btn main" data-cact="wequip" data-arg="${b.id}">Équiper</button>`:`<span class="owned">Fabriquée · ${CLS[b.cls].n}</span>`)
    +(canRecy?(wRecy===b.id?`<div class="card" style="width:100%;box-sizing:border-box"><p style="margin:0;font-size:14px">Recycler <b style="color:${r.c}">${b.n}</b> ? Tu récupères <b>${wRecyEss(b)} essence</b> et <b>1 fragment</b> de son schéma. L'arme, son niveau d'amélioration et ses affixes ajoutées sont perdus ; ses mods restent dans ta collection.</p><div class="actions"><button class="btn danger" data-cact="wrecyok" data-arg="${b.id}">Recycler</button><button class="btn" data-cact="wrecyno">Annuler</button></div></div>`
      :`<button class="btn danger" data-cact="wrecy" data-arg="${b.id}">Recycler · <span class="essi"></span>${wRecyEss(b)} · 1 fragment</button>`):'');
  else foot=`<div class="parts">${b.frag.map((n,i)=>`<span class="part${pc[i]?' have':''}">${n}${pc[i]>1?' ×'+pc[i]:''}</span>`).join('')}</div>
    <button class="btn main buy" data-cact="craft" data-arg="${b.id}" ${ready&&meta.gold>=cost&&true?'':'disabled'}>Fabriquer · <span class="coin"></span>${cost}</button>`;
  const src=own||b.bp===0?'':bpSources(b);
  return `<div class="wpn${eq&&mine?' on':''}"><div class="nm" style="color:${r.c}">${b.n}</div><div class="meta">${r.n} · ${isW?'Arme · '+CLS[b.cls].n:SLOT[b.slot]+' Prime · toutes classes'+(b.bio?' · ❄ Abîmes gelés':'')} · ${baseTxt}</div>
    <ul>${Object.keys(b.aff).map(k=>`<li>${AFF[k].t(b.aff[k])}</li>`).join('')||'<li>Aucun bonus</li>'}</ul>
    ${src}<div class="wfoot">${foot}</div></div>`;
}
let arsAsk=null;
const bpCost=b=>b.kind==='arme'?Math.round(b.bp/2):b.craft;
function craftPlan(){const ids=[...WPN[heroCls],...Object.keys(WPN).filter(c=>c!==heroCls).flatMap(c=>WPN[c]),...GEAR_BP].map(x=>x.id).filter(id=>bpdef(id).bp!==0||bpdef(id).kind!=='arme');
  const parts={},plan=[];let gold=meta.gold;for(const id of ids)parts[id]=[...(meta.parts[id]||[0,0,0])];
  for(const id of ids){const b=bpdef(id);if(b.kind==='arme'&&(ownedW(id)||b.bp===0))continue;
    for(let n=0;n<(b.kind==='arme'?1:20);n++){const pc=parts[id],c=bpCost(b);if(!pc.every(x=>x>0)||gold<c)break;parts[id]=pc.map(x=>x-1);gold-=c;plan.push(id)}}
  return {plan,cost:meta.gold-gold}}
function recyPlan(){const ws=Object.keys(WPN).flatMap(c=>WPN[c].filter(w=>w.bp>0&&ownedW(w.id)&&!(meta.wlock&&meta.wlock[w.id])&&(meta.wpn[c]||WPN[c][0].id)!==w.id));
  const pr=meta.stash.filter(it=>primeBp(it)&&!it.lock);
  return {ws,pr,ess:ws.reduce((a,w)=>a+wRecyEss(bpdef(w.id)),0)+pr.reduce((a,it)=>a+primeRecyEss(it),0)}}
function craftOne(id){const b=bpdef(id),pc=meta.parts[id],cost=bpCost(b);if(!pc||!pc.every(x=>x>0)||meta.gold<cost)return false;if(b.kind==='arme'&&ownedW(id))return false;
  meta.parts[id]=pc.map(x=>x-1);meta.gold-=cost;
  if(b.kind==='arme'){meta.built[id]=true;if(b.cls===heroCls)meta.wpn[heroCls]=id}
  else meta.stash.push({id:uid++,slot:b.slot,r:b.r,lvl:20,base:{k:BASE_STAT[b.slot],v:b.base},aff:{...b.aff},name:b.n,type:'Prime',bp:b.id});
  return true}
function arsBar(){const cp=craftPlan();
  let h=`<div class="actions" style="margin:0"><button class="btn${cp.plan.length?' main':''}" data-cact="craftask" ${cp.plan.length?'':'disabled'}>Tout fabriquer${cp.plan.length?` · ${cp.plan.length}`:''}</button><button class="btn" data-cact="gorecy">Recycler à la Forge</button></div>`;
  if(!cp.plan.length)h+='<p class="cx-hint" style="margin:0">Rien à fabriquer : il faut les 3 fragments et l\'or. Le recyclage des armes et objets Prime se fait dans Forge › Recyclage.</p>';
  if(arsAsk==='craft'&&cp.plan.length){const cnt={};for(const id of cp.plan)cnt[id]=(cnt[id]||0)+1;
    h+=`<div class="card"><p style="margin:0;font-size:14px">Fabriquer ${cp.plan.length} objet${cp.plan.length>1?'s':''} pour <b><span class="coin"></span> ${cp.cost} or</b> : ${Object.keys(cnt).map(id=>`<b style="color:${RAR[bpdef(id).r].c}">${bpdef(id).n}</b>${cnt[id]>1?' ×'+cnt[id]:''}`).join(', ')}.</p><div class="actions"><button class="btn main" data-cact="craftall">Fabriquer</button><button class="btn" data-cact="arsno">Annuler</button></div></div>`}
  return h}
let arsView='rec';
// Armurerie › Mes armes : toutes les armes possédées, avec leurs valeurs réelles (amélioration et affixes ajoutées comprises).
function myWeapons(){const order=[heroCls,...Object.keys(CLS).filter(c=>c!==heroCls)];
  const all=order.flatMap(c=>WPN[c].filter(w=>ownedW(w.id)).map(w=>({c,w})));const tot=Object.values(WPN).flat().length;
  const base=curEq(),dpsOf=id=>dps(stats({...base,arme:weaponItem(heroCls,id)})),cur=dpsOf(curWid());
  let h=`<p class="cx-hint" style="margin:0">${all.length} arme${all.length>1?'s':''} possédée${all.length>1?'s':''} sur ${tot}. Valeurs avec amélioration et affixes ajoutées. Pour ton héros, la ligne DPS compare chaque arme à celle équipée, avec ton équipement actuel.</p>`;
  for(const c of order){const L=all.filter(x=>x.c===c);if(!L.length)continue;
    h+=`<h3>${CLS[c].n}${c===heroCls?' · ton héros':''} <span class="cx-hint" style="margin:0;font-weight:400">${L.length} / ${WPN[c].length}</span></h3>`;
    h+=L.sort((a,b)=>b.w.r-a.w.r).map(({w})=>{const it=weaponItem(c,w.id),m=upMul(it.up),r=RAR[w.r],eq=curWid(c)===w.id,mine=c===heroCls;
      const mods=(meta.wload[w.id]||[]).filter(Boolean).length,mt=(meta.wmast[w.id]||{r:0}).r;
      const d=mine?dpsOf(w.id):0,diff=mine&&!eq&&cur?Math.round((d/cur-1)*100):0;
      return `<div class="wpn${eq&&mine?' on':''}"><div class="nm" style="color:${r.c}">${w.n}${it.up?` <span style="color:var(--ink)">+${it.up}</span>`:''}</div>
        <div class="meta">${r.n} · ${fmtN(w.dmg*m)} dégâts de base · maîtrise ${mt} / 10 · ${mods} mod${mods>1?'s':''}</div>
        <ul>${Object.keys(it.aff).map(k=>`<li${AFF[k].aby?' class="abyp"':''}>${AFF[k].t(NOSCALE[k]?it.aff[k]:fmtN(it.aff[k]*m))}</li>`).join('')||'<li>Aucun bonus</li>'}</ul>
        ${mine?`<div class="meta">DPS estimé <b style="color:var(--ink)">${fmtN(Math.round(d))}</b>${eq?'':` · <b style="color:${diff>=0?'var(--heal)':'var(--blood)'}">${diff>=0?'+':''}${diff} %</b> par rapport à l'arme équipée`}</div>`:''}
        <div class="wfoot">${eq?`<span class="owned">Équipée${mine?'':' · '+CLS[c].n}</span>`:mine?`<button class="btn main" data-cact="wequip" data-arg="${w.id}">Équiper</button>`:`<span class="owned">${CLS[c].n}</span>`}</div></div>`}).join('')}
  return h}
function campArsenal2(){
  const order=[heroCls,...Object.keys(CLS).filter(c=>c!==heroCls)];
  const nOwn=Object.values(WPN).flat().filter(w=>ownedW(w.id)).length;
  const tabs=`<div class="cx-chips" role="tablist" aria-label="Armurerie"><button class="cx-chip" role="tab" data-cact="arsv" data-arg="rec" aria-pressed="${arsView==='rec'}">Recettes</button><button class="cx-chip" role="tab" data-cact="arsv" data-arg="mine" aria-pressed="${arsView==='mine'}">Mes armes <span class="n">${nOwn}</span></button></div>`;
  if(arsView==='mine')return `${campMsg}${tabs}${myWeapons()}`;
  return `${campMsg}${tabs}${arsBar()}<p class="empty" style="font-size:13px">Toutes les recettes. Chaque équipement se fabrique avec ses 3 fragments de schéma, trouvés dans les reliques. Équipe tes reliques ici ou à l'onglet Reliques : elles s'ouvrent en mission, une par une, tous les 10 réactifs (+25 essence chacune).</p>`
    +order.map(c=>`<h3>Armes · ${CLS[c].n}${c===heroCls?' · ton héros':''}</h3>`+WPN[c].filter((w,i)=>i>0||c===heroCls).map(w=>bpCard(bpdef(w.id))).join('')).join('')
    +`<h3>Équipement Prime · toutes classes</h3>`+GEAR_BP.map(g=>bpCard(bpdef(g.id))).join('');
}
let relSel=null,relTier='all';
// Filtre de type : 'all', un niveau (0–3), 'g' (givre) ou 'f' (forgées)
const relMatch=(id,f=relTier)=>{const R=RELICS[id];return f==='all'||(f==='g'?!!R.bio:f==='f'?!!R.fz:String(R.t)===f)};
const relTypeName=f=>f==='g'?'reliques de givre':f==='f'?'reliques forgées':f==='all'?'reliques':'reliques '+RTIER[+f].n;
const relToEquip=f=>Object.keys(RELICS).filter(id=>meta.relics[id]&&relMatch(id,f)).reduce((n,id)=>n+[true,false].reduce((m,rad)=>m+Math.max(0,(meta.relics[id][rad?1:0]|0)-relicQN(id,rad)),0),0);
const relInQ=f=>meta.relicQ.filter(q=>RELICS[q.id]&&relMatch(q.id,f)).length;
const FUSE_COST=[20,40,80,150];
function relAvail(t){const out=[];for(const id in RELICS){if(RELICS[id].t!==t||RELICS[id].fz)continue;const a=meta.relics[id];if(!a)continue;
  for(const rad of [false,true]){const own=Math.max(0,a[rad?1:0]|0),q=Math.min(own,relicQN(id,rad));for(let k=0;k<own;k++)out.push({id,rad,q:k>=own-q})}}
  return out.sort((x,y)=>(x.q-y.q)||(x.rad-y.rad)||((meta.relics[y.id][0]+meta.relics[y.id][1])-(meta.relics[x.id][0]+meta.relics[x.id][1])))}
const legBps=()=>[...WPN[heroCls].filter(w=>w.r===3&&!ownedW(w.id)),...Object.keys(WPN).filter(c=>c!==heroCls).flatMap(c=>WPN[c].filter(w=>w.r===3&&!ownedW(w.id))),...GEAR_BP.filter(g=>g.r===3)].map(x=>x.id);
function chainPlan(t){const have=[0,1,2,3].map(i=>relAvail(i).length);let cost=0,fus=0;
  const ensure=(k,n)=>{const use=Math.min(n,have[k]);have[k]-=use;let r=n-use;if(!r)return true;if(k===0)return false;if(!ensure(k-1,3*r))return false;cost+=r*FUSE_COST[k-1];fus+=r;return true};
  if(!ensure(t,3))return null;return {cost:cost+FUSE_COST[t],fus}}
function fuseOnce(t){const av=relAvail(t);if(av.length<3)return null;meta.essence-=FUSE_COST[t];for(const q of av.slice(0,3))meta.relics[q.id][q.rad?1:0]--;relicQFix();
  if(t<3){const nid=pick(Object.keys(RELICS).filter(id=>RELICS[id].t===t+1&&!RELICS[id].bio&&!RELICS[id].fz));const a=meta.relics[nid]||(meta.relics[nid]=[0,0]);a[0]++;return nid}return true}
function ensureRel(t){while(relAvail(t).length<3){if(t===0)return false;if(!ensureRel(t-1))return false;fuseOnce(t-1)}return true}
function fusionSection(){
  {const L=legBps();if(!fuseTgt||!L.includes(fuseTgt))fuseTgt=L[0]||null}
  let h=`<section class="cx-section"><h3 class="cx-section__label">Fusion de reliques</h3><p class="cx-hint" style="margin:0">Fusionne 3 reliques d'un même niveau. Celles hors de la file d'ouverture partent en premier, les intactes avant les éclatantes ; si besoin, des reliques de la file sont utilisées et en sont retirées. Trois reliques Abysse donnent une relique forgée du schéma légendaire de ton choix : ouvre-la en mission pour recevoir à coup sûr un de ses fragments.</p><div class="fuse">`;
  for(let t=0;t<4;t++){const AV=relAvail(t),av=AV.length,qn=AV.slice(0,3).filter(q=>q.q).length,inQ=AV.filter(q=>q.q).length,cp=av<3&&t>0?chainPlan(t):null,cost=cp?cp.cost:FUSE_COST[t],ok=(av>=3||cp)&&meta.essence>=cost;
    const res=t<3?`1 relique <b style="color:${RTIER[t+1].c}">${RTIER[t+1].n}</b>`:`1 <b style="color:${RTIER[3].c}">relique forgée</b>`;
    h+=`<div class="frow"><span class="rgem" style="--tc:${RTIER[t].c}">${RELIC_SVG}</span><div class="fl"><b>3 × <span style="color:${RTIER[t].c}">${RTIER[t].n}</span> → ${res}</b><span>${av} possédée${av>1?'s':''}${inQ?` dont ${inQ} dans la file d'ouverture`:''}${av<3?(cp?` · les ${3-av} manquante${3-av>1?'s':''} seront créée${3-av>1?'s':''} avec tes reliques de niveau inférieur (${cp.fus} fusion${cp.fus>1?'s':''} en plus)`:` · il en faut ${3-av} de plus${t>0?`, ou ${3*(3-av)} ${RTIER[t-1].n} pour les créer`:''}`):''}${(av>=3||cp)&&meta.essence<cost?` · il manque ${cost-meta.essence} essence`:''}${ok&&qn?` · ${qn} ${qn>1?'seront retirées':'sera retirée'} de la file`:''}</span></div>
      <button class="btn buy" data-cact="rfuse" data-arg="${t}" ${ok&&(t<3||fuseTgt)?'':'disabled'}>${cp?'Fusionner en chaîne':'Fusionner'} · <span class="essi"></span>${cost}</button></div>`;
    if(t===3){const L=legBps();if(!fuseTgt||!L.includes(fuseTgt))fuseTgt=L[0]||null;
      h+=`<div class="ftgt"><span class="cx-hint" style="margin:0">Schéma visé :</span><div class="cx-chips">${L.map(id=>{const b=bpdef(id);return `<button class="cx-chip cx-chip--sm" data-cact="rftgt" data-arg="${id}" aria-pressed="${fuseTgt===id}">${b.n} <span class="n">${fragStatus(id)} / 3</span></button>`}).join('')||'<span class="cx-hint">Toutes les armes légendaires sont déjà fabriquées.</span>'}</div></div>`}}
  return h+'</div></section>'}
const RELIC_SVG='<svg viewBox="0 0 24 24"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12"/></svg>';
function rwInfo(r){const [k,v]=r.split(':');if(k==='ess'||k==='gold')return {cur:true};if(k==='sang')return {sang:true};if(k==='aby')return {aby:true};const b=bpdef(k),pc=meta.parts[k]||[0,0,0],n=fragStatus(k),have=v==='*'?(n>=3?1:0):(pc[+v]||0),built=b.kind==='arme'&&ownedW(k);
  return {b,have,n,built,completes:!have&&n===2&&!built}}
function campRelics(){
  relicQFix();const all=Object.keys(RELICS),own=all.filter(id=>{const a=meta.relics[id];return a&&(a[0]||a[1])}),Q=meta.relicQ;
  let h=`${campMsg}`;
  if(!own.length)return h+'<p class="empty">Aucune relique pour l\'instant. Les monstres en lâchent parfois, et chaque manche réussie en rapporte une.</p>';
  const tot=own.reduce((n,id)=>n+meta.relics[id][0]+meta.relics[id][1],0);
  // file d'ouverture (affichée après la collection)
  const qh=`<section class="cx-section"><h3 class="cx-section__label">Ordre d'ouverture · ${Q.length} / ${tot}</h3>
    ${Q.length?`<div class="rq"><ol>${Q.map((q,i)=>`<li><span class="rqn">${i+1}.</span><span class="rgem${q.rad?' rad':''}" style="--tc:${RTIER[RELICS[q.id].t].c}">${RELIC_SVG}</span><b style="color:${RTIER[RELICS[q.id].t].c}">${RELICS[q.id].n}${q.rad?' · éclatante':''}</b>
      <button class="btn" data-cact="rqup" data-arg="${i}" ${i?'':'disabled'} aria-label="Monter">↑</button><button class="btn" data-cact="rqdn" data-arg="${i}" ${i<Q.length-1?'':'disabled'} aria-label="Descendre">↓</button><button class="btn" data-cact="rqrm" data-arg="${i}" aria-label="Retirer">✕</button></li>`).join('')}</ol></div>`
      :'<p class="cx-hint" style="margin:0">Aucune relique équipée : la prochaine mission n\'en ouvrira aucune.</p>'}
    <div class="actions" style="margin:0"><button class="btn" data-cact="rqall" ${Q.length>=tot?'disabled':''}>Tout équiper</button><button class="btn danger" data-cact="rqnone" ${Q.length?'':'disabled'}>Tout retirer</button></div></section>`;
  // collection
  const tiers=[...new Set(own.map(id=>RELICS[id].t))].sort();
  const tchip=(k,lab,c)=>`<button class="cx-chip cx-chip--sm" data-cact="rtier" data-arg="${k}" aria-pressed="${relTier===String(k)}"${c&&relTier!==String(k)?` style="color:${c}"`:''}>${lab}</button>`;
  const list=own.filter(id=>relMatch(id)).sort((x,y)=>RELICS[x].t-RELICS[y].t);
  if(relSel&&!own.includes(relSel))relSel=null;
  h+=`<section class="cx-section"><h3 class="cx-section__label">Tes reliques · ${tot}</h3><div class="cx-chips">${tchip('all','Toutes')}${tiers.map(t=>tchip(t,RTIER[t].n,RTIER[t].c)).join('')}${own.some(id=>RELICS[id].bio)?tchip('g','Givre','#9fd0ff'):''}${own.some(id=>RELICS[id].fz)?tchip('f','Forgées',RTIER[3].c):''}</div>
    ${(()=>{const ne=relToEquip(relTier),nq=relInQ(relTier),sh=relTier==='g'?'Givre':relTier==='f'?'Forgées':relTier==='all'?'':RTIER[+relTier].n;return relTier!=='all'&&nq?`<div class="actions" style="margin:0"><button class="btn danger" data-cact="rqtypeoff">Retirer · ${sh} (${nq})</button></div>`:(ne?'':`<p class="cx-hint" style="margin:0">${relTier==='all'?'Toutes tes reliques':sh} : déjà équipées.</p>`)})()}
    <div class="rtiles">${list.map(id=>{const R=RELICS[id],a=meta.relics[id],c=RTIER[R.t].c,nq=relicQN(id,false)+relicQN(id,true),comp=R.rw.some(r=>rwInfo(r).completes);
      return `<button class="rtile${relSel===id?' sel':''}" data-cact="rsel" data-arg="${id}" style="--tc:${c}" aria-pressed="${relSel===id}" aria-label="${relicName(id)}, ${a[0]} intacte${a[0]>1?'s':''}, ${a[1]} éclatante${a[1]>1?'s':''}${nq?`, ${nq} équipée${nq>1?'s':''}`:''}">
        <span class="rgem${a[1]?' rad':''}">${RELIC_SVG}</span><b>${R.n}</b><span class="rt">${RTIER[R.t].n}</span>
        <span class="rc">${a[0]?`×${a[0]}`:''}${a[1]?`<i>✦×${a[1]}</i>`:''}</span>${nq?`<span class="req">${nq} équipée${nq>1?'s':''}</span>`:''}${comp?'<span class="rcomp" title="Contient un fragment qui complète un schéma">★</span>':''}</button>`}).join('')}</div></section>`;
  if(relSel){const id=relSel,R=RELICS[id],a=meta.relics[id],c=RTIER[R.t].c;
    const ctl=(rad,lab)=>{const n=relicQN(id,rad),ow=a[rad?1:0];return `<div class="rctl"><span>${lab} · <b>${n} / ${ow}</b> équipée${n>1?'s':''}</span><span class="cx-stepper"><button type="button" data-cact="rqdel" data-arg="${id}|${rad?1:0}" ${n?'':'disabled'} aria-label="Retirer une ${lab.toLowerCase()}">−</button><button type="button" data-cact="rqadd" data-arg="${id}|${rad?1:0}" ${n<ow?'':'disabled'} aria-label="Équiper une ${lab.toLowerCase()}">+</button></span></div>`};
    h+=`<section class="cx-card rdet" style="--tc:${c}"><div class="cx-card__head"><span class="rgem big${a[1]?' rad':''}">${RELIC_SVG}</span><div><h4 class="cx-card__title" style="color:${c}">${R.n}</h4><div class="cx-card__meta">Relique ${RTIER[R.t].n} · intacte ×${a[0]} · éclatante ×${a[1]}</div></div></div>
      <ul class="rrw">${(R.fz?[R.rw[0]]:R.rw).map((r,i)=>{const rr=R.fz?2:RW_RAR[i],inf=rwInfo(r),c0=R.fz?100:CH[0][rr],c1=R.fz?100:CH[1][rr];
        const st=inf.aby?'<span class="rs aby">abyssal</span>':inf.sang?'<span class="rs sang">exclusif</span>':inf.cur?'<span class="rs cur">monnaie</span>':inf.built?'<span class="rs ok">arme fabriquée</span>':inf.completes?'<span class="rs comp">★ complète le schéma</span>':inf.have?`<span class="rs ok">✓ possédé ×${inf.have}</span>`:`<span class="rs miss">manquant · ${inf.n} / 3</span>`;
        return `<li><div class="rrh"><span class="dot" style="background:${MOD_RAR[rr].c}"></span><span class="rl">${rwLabel(r)}</span>${st}</div>
          <div class="rbars"><span>Intacte</span><div class="rbar"><i style="width:${Math.min(100,c0*3.3)}%"></i></div><em>${fmtN(c0)} %</em><span>Éclatante</span><div class="rbar rad"><i style="width:${Math.min(100,c1*3.3)}%"></i></div><em>${fmtN(c1)} %</em></div></li>`}).join('')}</ul>
      <div class="cx-card__foot">${a[0]?ctl(false,'Intactes'):''}${a[1]?ctl(true,'Éclatantes'):''}
        ${a[0]&&!R.fz?`<button class="btn buy" data-cact="refine" data-arg="${id}" ${meta.essence<50||relicQN(id,false)>=a[0]?'disabled':''}>Raffiner en éclatante · <span class="essi"></span>50</button>`:''}</div></section>`}
  else h+='<p class="cx-hint" style="margin:0">Touche une relique pour voir ses récompenses, tes chances et ce qu\'il te manque. ★ : contient le dernier fragment d\'un schéma.</p>';
  return h+fusionSection()+qh;
}
let saveMode=null,saveDraft='',saveMsg='',savePending=null;
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
// Fichier de sauvegarde prêt à réimporter (bouton « Depuis un fichier » de l'import).
const saveName=()=>`crypte-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;
function saveBlob(){return new Blob([exportCode()],{type:'application/json'})}
function downloadSave(){try{const url=URL.createObjectURL(saveBlob()),a=document.createElement('a');a.href=url;a.download=saveName();a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);saveMsgOk=`Fichier « ${saveName()} » enregistré dans tes téléchargements.`;return true}catch(e){saveMsgOk='';saveMsg='Le téléchargement a échoué : utilise Partager ou Copier le JSON.';return false}}
const canShareFile=()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['{}'],'t.json',{type:'application/json'})]}))}catch(e){return false}};
async function shareSave(){try{await navigator.share({files:[new File([saveBlob()],saveName(),{type:'application/json'})],title:'Sauvegarde Crypte des Cendres'});saveMsgOk='Fichier partagé.'}catch(e){if(e&&e.name!=='AbortError'){saveMsg='Le partage a échoué : utilise Télécharger ou Copier le JSON.'}}drawCamp()}
let saveMsgOk='';
function exportCode(){const data={v:1,meta,cls:heroCls,best,at:new Date().toISOString().slice(0,10)};return JSON.stringify({jeu:'Crypte des Cendres',...data},null,2)}
function parseCode(t){t=(t||'').trim();if(t.startsWith('CRYPTE1:'))t=t.slice(8);let d=null;
  try{d=JSON.parse(decodeURIComponent(escape(atob(t.replace(/\s+/g,'')))))}catch(e){try{d=JSON.parse(t)}catch(e2){return null}}
  if(!d||typeof d!=='object'||!d.meta||typeof d.meta.gold!=='number')return null;return d}
const sumOf=m=>`${m.gold} or, ${m.essence||0} essence, ${Object.keys(m.mods||{}).length} mods, ${Object.values(m.relics||{}).reduce((a,r)=>a+(r[0]||0)+(r[1]||0),0)} reliques`;
function saveSection(){
  let h=`<h3 class="cx-section__label">Sauvegarde</h3><p class="empty" style="font-size:13px;margin:0"><b>Exporter</b> enregistre un fichier .json de ta progression, prêt à réimporter. Pour la restaurer, ici ou sur un autre appareil : <b>Importer</b>, puis <b>Depuis un fichier</b> (ou colle le JSON).</p>
    <div class="actions"><button class="btn${saveMode==='exp'?' main':''}" data-cact="exp">Exporter</button><button class="btn${saveMode==='imp'?' main':''}" data-cact="impopen">Importer</button></div>`;
  if(saveMode==='exp')h+=`${saveMsgOk?`<p class="empty" style="font-size:13px;color:var(--heal)">${esc(saveMsgOk)}</p>`:''}<div class="actions"><button class="btn main" data-cact="savedl">Télécharger le fichier</button>${canShareFile()?'<button class="btn" data-cact="saveshare">Partager le fichier</button>':''}<button class="btn" data-cact="copy">Copier le JSON</button></div>
    <details class="savemore"><summary>Voir le JSON</summary><textarea id="saveOut" class="savebox" readonly rows="8">${esc(exportCode())}</textarea></details>`;
  if(saveMode==='imp'){
    if(savePending)h+=`<div class="card"><p style="margin:0;font-size:14px">Remplacer ta progression actuelle (${sumOf(meta)}) par celle du JSON (${sumOf(savePending.meta)}${savePending.at?`, exportée le ${esc(savePending.at)}`:''}) ?</p><div class="actions"><button class="btn main" data-cact="impok">Remplacer et recharger</button><button class="btn" data-cact="impcancel">Annuler</button></div></div>`;
    else h+=`<textarea id="saveIn" class="savebox" rows="5" placeholder="Colle ici le JSON de ta sauvegarde">${esc(saveDraft)}</textarea>
      <div class="actions"><button class="btn main" data-cact="imp">Restaurer</button><label class="btn" style="text-align:center;cursor:pointer">Depuis un fichier<input type="file" id="saveFile" accept=".txt,.json,text/plain,application/json" hidden></label></div>`;
  }
  if(saveMsg)h+=`<p class="empty" style="font-size:13px;color:var(--blood)">${saveMsg}</p>`;
  return h;
}
let forgeSub='up';
function campForge(){return campForge0()}
let xf={src:'',k:'',dst:'',rep:''};
const wclsOf=id=>Object.keys(WPN).find(c=>WPN[c].some(w=>w.id===id));
function xfGet(key){if(!key)return null;const t=key[0],v=key.slice(2);
  if(t==='s')return meta.stash.find(i=>String(i.id)===v)||null;if(t==='g')return meta.gear[v]||null;
  if(t==='w'){const c=wclsOf(v);return c&&ownedW(v)?weaponItem(c,v):null}return null}
const xfCap=it=>Math.max(RAR[it.r].aff,Object.keys(it.aff).length);
const xfCost=it=>50*(it.r+1);
const FZ_MAX=3,FZ_K=.5,fzCost=(it,n)=>100*(it.r+1)*(n+1);
function fzGet(key,k){if(!key)return 0;if(key[0]==='w'){const o=meta.wfz&&meta.wfz[key.slice(2)];return (o&&o[k])||0}const it=xfGet(key);return (it&&it.fz&&it.fz[k])||0}
const xfLbl=(k,i,w)=>`${esc(itemName(i))} · ${RAR[i.r].n.toLowerCase()} · ${w}`;
function xfState(){const s=xfGet(xf.src),d=xfGet(xf.dst);if(!s||!d||!xf.k||s.aff[xf.k]==null)return null;
  if(AFF[xf.k].aby)return {ok:false,msg:'Les pouvoirs abyssaux sont liés à leur objet : impossible de les transférer ou de les fusionner.'};
  if(xf.rep&&AFF[xf.rep]&&AFF[xf.rep].aby)return {ok:false,full:true,msg:'Le pouvoir abyssal ne peut pas être remplacé : choisis une autre affixe.'};
  const k=xf.k,ns=!!NOSCALE[k],ve=ns?s.aff[k]:s.aff[k]*upMul(s.up),v=ns?ve:Math.round(ve/upMul(d.up)*10)/10,cur=d.aff[k],ce=cur==null?null:ns?cur:cur*upMul(d.up),cap=xfCap(d),n=Object.keys(d.aff).length,T=x=>xfV(d,k,x),r=o=>Object.assign(o,{nv:v});
  if(cur!=null){const n0=fzGet(xf.dst,k),fuseOk=n0<FZ_MAX,canUp=ve>ce+1e-9,hi=Math.max(ce,ve),lo=Math.min(ce,ve),fe=ns?hi+(lo>=1?1:0):hi+lo*FZ_K,fv=ns?fe:Math.round(fe/upMul(d.up)*10)/10;
    if(!fuseOk&&!canUp)return r({ok:false,msg:`${esc(itemName(d))} a déjà ${T(cur)} (fusionnée ${FZ_MAX} fois, le maximum), une valeur égale ou plus forte.`});
    const op=xf.op==='up'&&canUp?'up':fuseOk?'fuse':'up';
    if(op==='fuse')return {ok:true,mode:'fuse',nv:fv,n:n0,fuseOk,canUp,cost:fzCost(s,n0),msg:`Fusionne ${T(v)} dans ${T(cur)} : ${T(fv)} sur ${esc(itemName(d))} (fusion ${n0+1} / ${FZ_MAX}).`};
    return r({ok:true,mode:'up',fuseOk,canUp,msg:`Remplace ${T(cur)} par ${T(v)} sur ${esc(itemName(d))}.`})}
  if(n<cap)return r({ok:true,mode:'add',msg:`Ajoute ${T(v)} sur ${esc(itemName(d))} (${n+1} / ${cap} affixes).`});
  if(xf.rep&&d.aff[xf.rep]!=null)return r({ok:true,mode:'rep',msg:`Remplace ${xfV(d,xf.rep,d.aff[xf.rep])} par ${T(v)} sur ${esc(itemName(d))}.`});
  return r({ok:false,full:true,msg:`${esc(itemName(d))} a déjà ${cap} affixe${cap>1?'s':''} : choisis celle à remplacer.`})}
const xfV=(it,k,v)=>AFF[k].t(NOSCALE[k]?v:fmtN(v*upMul(it.up)));
function xfCard(lab,it,where,lines,extra=''){
  return `<div class="xfc${extra}"><span class="lab">${lab}</span>${it?`<span class="nm" style="color:${RAR[it.r].c}">${esc(itemName(it))}</span><span class="sub">${RAR[it.r].n} · ${where}</span>
    <ul><li class="base">${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${lines}</ul>`:`<span class="sub">${lines}</span>`}</div>`}
let afF='all',afP=0,afCat='all',afOpen='';
const AFF_CAT={frz:'off',cold:'off',shard:'off',dmgPct:'off',apsPct:'off',crit:'off',critDmg:'off',novaPct:'off',skillRad:'off',burn:'off',multi:'off',pierce:'off',reach:'off',splash:'off',hp:'def',armor:'def',regen:'def',leech:'def',speed:'uti',cdr:'uti',burnPct:'off',chill:'off',shock:'off',execute:'off',bossDmg:'off',lowDmg:'off',ultPct:'off',fury:'off',lowArmor:'def',potHeal:'def',antidote:'def',auraSlow:'def',skillDur:'uti',dashCd:'uti',magnetPct:'uti',goldPct:'uti',xpPct:'uti',lootPct:'uti'};
const AFF_NAME={frz:'Gel',cold:'Dégâts contre ralentis',shard:'Éclats de glace',dmgPct:'Dégâts',apsPct:'Vitesse d\'attaque',crit:'Chances de critique',critDmg:'Dégâts critiques',hp:'Points de vie',armor:'Réduction des dégâts',speed:'Vitesse de déplacement',regen:'Régénération',cdr:'Temps de recharge',skillRad:'Portée des compétences',novaPct:'Dégâts de compétence',burn:'Embrasement',multi:'Projectiles par tir',leech:'Vol de vie',reach:'Portée de frappe',splash:'Rayon d\'explosion',pierce:'Transpercement',burnPct:'Embrasement (%)',chill:'Ralentissement',shock:'Éclair en chaîne',execute:'Exécution',bossDmg:'Dégâts contre Gardiens',lowDmg:'Dégâts sous 50 % de vie',ultPct:'Dégâts de l\'ultime',fury:'Charge de l\'ultime',lowArmor:'Protection sous 30 % de vie',potHeal:'Soin des potions',antidote:'Antidote',auraSlow:'Aura de lenteur',skillDur:'Durée des compétences',dashCd:'Recharge de l\'esquive',magnetPct:'Portée de ramassage',goldPct:'Or',xpPct:'Expérience',lootPct:'Chances de butin'};
const AFF_CATN={off:'Offensives',def:'Défensives',uti:'Utilitaires'};
const affShort=(k,v)=>{const pct=!['hp','regen','burn','multi','pierce'].includes(k),neg=['armor','cdr','lowArmor','dashCd','antidote','fury'].includes(k);return `${neg?'−':'+'}${fmtN(v)}${pct?' %':k==='regen'?' PV/s':k==='burn'?' /s':''}`};
const affEff=(it,k)=>NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up);
function wishSection(){const W=meta.wish||(meta.wish={leg:true,aff:{}});W.aff=W.aff||{};
  const keys=Object.keys(AFF).filter(k=>!AFF[k].w),n=keys.filter(k=>W.aff[k]).length;
  const chip=k=>`<button class="cx-chip cx-chip--sm" data-cact="wish" data-arg="${k}" aria-pressed="${!!W.aff[k]}">${AFF_NAME[k]||k}</button>`;
  const grp=c=>{const ks=keys.filter(k=>(AFF_CAT[k]||'uti')===c);return ks.length?`<span class="cx-hint" style="margin:0">${AFF_CATN[c]}</span><div class="cx-chips">${ks.map(chip).join('')}</div>`:''};
  return `<section class="cx-section"><h3 class="cx-section__label">Alertes de butin</h3>
    <p class="cx-hint" style="margin:0">En mission, l'écran s'illumine et l'objet porte un grand faisceau doré quand un objet tombe avec une de ces affixes à une valeur plus haute que celle de ton équipement porté (ou que tu ne portes pas encore)${W.leg?', ou quand un légendaire tombe':''}.</p>
    <div class="cx-chips"><button class="cx-chip cx-chip--sm" data-cact="wishleg" aria-pressed="${!!W.leg}" style="${W.leg?'':'color:var(--rar-legend)'}">Légendaires</button>${n?`<button class="cx-btn cx-btn--ghost cx-btn--sm" data-cact="wishnone" style="margin:0">Tout retirer (${n})</button>`:''}</div>
    ${grp('off')}${grp('def')}${grp('uti')}</section>`}
function affFinder(){
  const srcs=[...Object.entries(meta.gear).filter(([k,i])=>i&&!i.lock).map(([k,i])=>['g:'+k,i,'équipé']),...meta.stash.filter(i=>!i.lock).map(i=>['s:'+i.id,i,'coffre'])];
  const by={};for(const [key,it,w] of srcs)for(const k in it.aff){if(!AFF[k]||AFF[k].aby)continue;(by[k]||(by[k]=[])).push({key,it,w,v:affEff(it,k)})}
  for(const k in by)by[k].sort((a,b)=>b.v-a.v);
  const cnt={all:Object.keys(by).length};for(const k in by){const c=AFF_CAT[k]||'uti';cnt[c]=(cnt[c]||0)+1}
  const keys=Object.keys(by).filter(k=>afCat==='all'||(AFF_CAT[k]||'uti')===afCat).sort((a,b)=>(AFF_CAT[a]||'z').localeCompare(AFF_CAT[b]||'z')||(AFF_NAME[a]||a).localeCompare(AFF_NAME[b]||b));
  const d=xfGet(xf.dst);
  const chip=(k,lab)=>`<button class="cx-chip cx-chip--sm" data-cact="afcat" data-arg="${k}" aria-pressed="${afCat===k}">${lab} <span class="n">${cnt[k]||0}</span></button>`;
  let h=`<section class="cx-section"><h3 class="cx-section__label">Chercher par affixe</h3><div class="cx-chips">${chip('all','Toutes')}${chip('off','Offensives')}${chip('def','Défensives')}${chip('uti','Utilitaires')}</div>`;
  if(!keys.length)return h+`<p class="cx-hint" style="margin:0">${srcs.length?'Aucune affixe de ce type sur tes objets non verrouillés.':'Aucun objet non verrouillé à prendre comme source.'}</p></section>`;
  h+='<ul class="afind">'+keys.map(k=>{const L=by[k],b=L[0],open=afOpen===k,mine=d&&d.aff[k]!=null?affEff(d,k):null;
    const row=`<button class="afrow" data-cact="afopen" data-arg="${k}" aria-expanded="${open}"><span class="afn">${AFF_NAME[k]||k}</span><span class="afv">${affShort(k,b.v)}</span><span class="afs">max · <b style="color:${RARV[b.it.r]}">${esc(itemName(b.it))}</b> · ${b.w}${L.length>1?` · ${L.length} objets`:''}${mine!=null?` · ta cible : ${affShort(k,mine)}`:''}</span><span class="afc" aria-hidden="true">${open?'▴':'▾'}</span></button>`;
    if(!open)return `<li>${row}</li>`;
    return `<li class="open">${row}<ul>${L.slice(0,8).map((o,i)=>{const sel=xf.src===o.key&&xf.k===k,same=o.key===xf.dst;
      return `<li><span><b style="color:${RARV[o.it.r]}">${esc(itemName(o.it))}</b> · ${o.w}<br><span class="afv2">${affShort(k,o.v)}</span>${i===0?' <span class="cx-tag cx-tag--heal">max</span>':''}</span>${same?'<span class="cx-hint" style="margin:0">c\'est ta cible</span>':`<button class="cx-btn cx-btn--sm" data-cact="afuse" data-arg="${k}|${o.key}" ${sel?'disabled':''}>${sel?'Choisi':'Prendre'}</button>`}</li>`}).join('')}${L.length>8?`<li class="cx-hint" style="margin:0">… et ${L.length-8} autres, plus faibles.</li>`:''}</ul></li>`}).join('')+'</ul></section>';
  return h;
}
const RARV=['var(--rar-common)','var(--rar-magic)','var(--rar-rare)','var(--rar-legend)','var(--rar-anc)','var(--rar-sang)','var(--rar-aby)'];
function xfOk(key,it){if(!it)return false;if(xf.pick==='src')return key[0]!=='w'&&!it.lock&&Object.keys(it.aff).length>0;return key!==xf.src}
const xfPin=key=>key===xf.src?'<span class="cx-pin cx-pin--src">Source</span>':key===xf.dst?'<span class="cx-pin cx-pin--dst">Cible</span>':'';
const xfSt=key=>key===xf.src?' is-src':key===xf.dst?' is-dst':'';
function xfSlot(key,it,label,oth){if(!it)return `<div class="cx-slot cx-slot--empty"><span class="cx-slot__k">${label}</span><span class="cx-slot__v">Vide</span></div>`;
  const ok=xfOk(key,it);
  return `<button class="cx-slot${oth?'':' is-equipped'}${xfSt(key)}" data-cact="xfsel" data-arg="${key}" ${ok?'':'aria-disabled="true"'} aria-label="${esc(itemName(it))}, ${label}${oth?'':', équipé'}${key===xf.src?', source':key===xf.dst?', cible':''}"><span class="cx-slot__k">${label}${oth?'':' · équipé'}</span><span class="cx-slot__v" style="color:${RARV[it.r]}">${esc(itemName(it))}${it.lock?`<span class="li" aria-hidden="true">${LOCK_SVG}</span>`:''}</span>${xfPin(key)}</button>`}
function xfCell(key,it){const ok=xfOk(key,it);
  return `<button class="cx-cell${xfSt(key)}" data-cact="xfsel" data-arg="${key}" ${ok?'':'aria-disabled="true"'} style="--rar:${RARV[it.r]}" aria-label="${esc(itemName(it))}${it.lock?', verrouillé':''}${key===xf.src?', source':key===xf.dst?', cible':''}">${it.lock?`<span class="cx-cell__lock">${LOCK_SVG}</span>`:''}${GLYPH[it.slot]}${it.up?`<span class="cx-cell__up">+${it.up}</span>`:''}${xfPin(key)}</button>`}
function xfDiffCard(kind,it,where,lines,gone){const src=kind==='src';
  return `<div class="cx-diff__card cx-diff__card--${kind}${gone&&src?' is-gone':''}"><span class="cx-diff__lab">${src?'− Source · détruite':gone?'+ Cible · aperçu':'+ Cible'}</span>${it?`<span class="cx-diff__nm" style="color:${RARV[it.r]}">${esc(itemName(it))}</span><span class="cx-diff__sub">${RAR[it.r].n} · ${where}</span>
    <ul><li class="cx-line cx-line--base">${baseTxtOf(it.slot,fmtN(it.base.v*upMul(it.up)))}</li>${lines}</ul>`:`<span class="cx-diff__sub">${src?'Choisis l\'objet source.':'Choisis la cible.'}</span>`}</div>`}
function campAffix(){
  if(!xf.pick)xf.pick=xf.src?'dst':'src';
  let s=xfGet(xf.src);if(xf.src&&(!s||s.lock)){xf={src:'',k:'',dst:'',rep:'',pick:'src'};s=null}
  if(s&&xf.k&&s.aff[xf.k]==null)xf.k='';
  const d=xfGet(xf.dst),wlab=k=>k[0]==='w'?'arme':k[0]==='g'?'équipé':'coffre';
  let h=backChip()+xfSteps();
  h+=`<div class="cx-roles"><button class="cx-role cx-role--src" data-cact="xfpick" data-arg="src" aria-pressed="${xf.pick==='src'}"><span class="cx-role__k"><i>−</i>Source · détruite</span><span class="cx-role__v${s?'':' is-empty'}" ${s?`style="color:${RARV[s.r]}"`:''}>${s?esc(itemName(s)):'Choisir un objet'}</span></button>
    <button class="cx-role cx-role--dst" data-cact="xfpick" data-arg="dst" aria-pressed="${xf.pick==='dst'}"><span class="cx-role__k"><i>+</i>Cible</span><span class="cx-role__v${d?'':' is-empty'}" ${d?`style="color:${RARV[d.r]}"`:''}>${d?esc(itemName(d)):'Choisir un objet'}</span></button></div>`;
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
    h+=`<div class="cx-diff">${xfDiffCard('src',s,s?wlab(xf.src):'',sLines,st&&st.ok)}${xfDiffCard('dst',d,d?wlab(xf.dst):'',tLines,st&&st.ok?true:null)}</div>`;
  }
  h+=affFinder();
  const eqW=meta.wpn[heroCls]&&ownedW(meta.wpn[heroCls])?meta.wpn[heroCls]:WPN[heroCls][0].id;
  h+=`<section class="cx-section"><h3 class="cx-section__label">Équipé · ${CLS[heroCls].n}</h3><div class="cx-slots">${xfSlot('w:'+eqW,weaponItem(heroCls,eqW),'Arme')}${['armure','amulette','bottes','anneau'].map(k=>xfSlot('g:'+k,meta.gear[k],SLOT[k])).join('')}</div></section>`;
  const ow=Object.keys(WPN).flatMap(c=>WPN[c].filter(w=>ownedW(w.id)&&w.id!==eqW).map(w=>[c,w]));
  if(ow.length)h+=`<section class="cx-section"><h3 class="cx-section__label">Autres armes</h3><div class="cx-slots">${ow.map(([c,w])=>xfSlot('w:'+w.id,weaponItem(c,w.id),`Arme · ${CLS[c].n}`,true)).join('')}</div></section>`;
  {const list=invList('affix');h+=`<section class="cx-section"><h3 class="cx-section__label">Coffre · ${meta.stash.length} objet${meta.stash.length>1?'s':''}</h3>${meta.stash.length?invToolbar(list,'affix'):''}<div id="invGrid">${invGrid(list,'affix')}</div></section>`}
  h+=cxMore('wish','Alertes de butin : un flash quand une affixe recherchée tombe.',wishSection(),'Régler');
  return h;
}
function affixFoot(){const st=xfState(),s=xfGet(xf.src);
  if(!st){const hn=campBack?xfStepHint():'';return hn?`<p class="cx-hint">${hn}</p>`:xf.src&&xf.dst&&!xf.k?'<p class="cx-hint">Touche l\'affixe à prendre sur la source.</p>':''}
  if(!st.ok)return `<p class="cx-hint">${st.full?'Touche l\'affixe à remplacer sur la cible.':st.msg}</p>`;
  const cost=st.cost||xfCost(s),poor=meta.essence<cost,both=st.fuseOk&&st.canUp;
  return `${both?`<div class="cx-chips" role="radiogroup" aria-label="Mode" style="justify-content:center"><button class="cx-chip cx-chip--sm" role="radio" data-cact="xfop" data-arg="fuse" aria-checked="${st.mode==='fuse'}">Fusionner (additionner)</button><button class="cx-chip cx-chip--sm" role="radio" data-cact="xfop" data-arg="up" aria-checked="${st.mode==='up'}">Remplacer</button></div>`:''}<div class="row"><button class="cx-btn cx-btn--ghost" data-cact="xfcancel">Annuler</button><button class="cx-btn cx-btn--primary cx-btn--cost" data-cact="xfok" ${poor?'disabled':''}>${st.mode==='fuse'?'Fusionner':'Transférer'} <span class="cx-price"><i class="cx-ess"></i>${cost}</span></button></div>
    <p class="cx-hint">${poor?`Il te manque ${cost-meta.essence} essence.`:`${esc(itemName(s))} sera détruit.`}</p>`;
}
function xfDo(){const s=xfGet(xf.src),st=xfState();if(!s||s.lock||!st||!st.ok)return;const cost=st.cost||xfCost(s);if(meta.essence<cost)return;
  const k=xf.k,v=st.nv;
  if(xf.dst[0]==='w'){const wid=xf.dst.slice(2),o=meta.waff[wid]||(meta.waff[wid]={});if(st.mode==='rep')o[xf.rep]=null;o[k]=v;
    if(st.mode==='fuse'){meta.wfz=meta.wfz||{};const f=meta.wfz[wid]||(meta.wfz[wid]={});f[k]=(f[k]||0)+1}}
  else{const d=xfGet(xf.dst);if(st.mode==='rep')delete d.aff[xf.rep];d.aff[k]=v;if(st.mode==='fuse'){d.fz=d.fz||{};d.fz[k]=(d.fz[k]||0)+1}else if(d.fz)delete d.fz[k]}
  if(xf.src[0]==='s'){const i=meta.stash.findIndex(x=>String(x.id)===xf.src.slice(2));if(i>=0)meta.stash.splice(i,1)}else meta.gear[xf.src.slice(2)]=null;
  meta.essence-=cost;const dn=itemName(xfGet(xf.dst)||{name:'la cible'});toast(`${st.mode==='fuse'?'Affixe fusionnée':'Affixe transférée'} : <b>${xfV(xfGet(xf.dst)||{},k,v)}</b> sur ${esc(dn)}. ${esc(itemName(s))} est détruit.`);
  xf={src:'',k:'',dst:'',rep:'',pick:'src'};campSel=null}
function prestSection(){
  const c=heroCls,o=prOf(c),free=prFree(c),op=prOpen(),cost=prCost(o.lv),nmax=UPG.filter(u=>lv(u.k)>=u.max).length;
  let h=`<h3>Prestige · ${CLS[c].n}${o.lv?` · niveau ${o.lv}`:''}</h3>`;
  if(!op&&!o.lv)return h+`<p class="empty" style="font-size:13px">Le prestige se débloque quand toutes les améliorations permanentes sont au maximum (${nmax} / ${UPG.length}). Ensuite, chaque niveau de prestige donne 1 point à placer dans une statistique du ${CLS[c].n.toLowerCase()}, sans limite de niveau.</p>`;
  h+=`<p class="empty" style="font-size:13px">Chaque niveau de prestige donne 1 point à placer dans une statistique. Le prestige est propre à chaque héros et n'a pas de limite. Tu peux redistribuer tes points gratuitement.</p>
  <div class="up"><b>Niveau de prestige ${o.lv} → ${o.lv+1}</b><button class="btn buy" data-cact="prbuy" ${meta.gold<cost.gold||meta.essence<cost.ess?'disabled':''}><span class="coin"></span>${cost.gold} · <span class="essi"></span>${cost.ess}</button>
  <p style="grid-column:1/-1">${free?`<b style="color:var(--ember)">${free} point${free>1?'s':''} à placer</b>`:'Aucun point à placer'} · ${o.lv} au total</p></div><div class="ups">`;
  h+=PREST.map(q=>{const n=prPt(q.k,c),mx=q.max&&n>=q.max,v=n*q.per;
    return `<div class="up"><b>${q.n}${n?` · ${n}`:''}</b><button class="btn" data-cact="pradd" data-arg="${q.k}" ${!free||mx?'disabled':''} aria-label="Placer un point en ${q.n}">${mx?'Max':'+1'}</button>
      <p style="grid-column:1/-1">${q.neg?'−':'+'}${prFmt(q.per)} ${q.t} par point${n?` · actuel ${q.neg?'−':'+'}${prFmt(v)} %`:''}${q.max?` · max ${q.max} points`:''}</p></div>`}).join('');
  h+=`</div>${o.lv-free?'<div class="actions" style="margin:0"><button class="btn" data-cact="prreset">Redistribuer les points</button></div>':''}`;
  return h;
}
function campForge0(){
  const ups=UPG.map(u=>{const l=lv(u.k),mx=l>=u.max,c=upCost(u);
    return `<div class="up"><b>${u.n}</b><p>${mx?u.d(l):(l?u.d(l)+' → ':'')+u.d(l+1)}</p><div class="pips">${Array.from({length:u.max},(_,i)=>`<i class="${i<l?'on':''}"></i>`).join('')}</div>
      <button class="btn buy" data-cact="up" data-arg="${u.k}" ${mx||meta.gold<c?'disabled':''}>${mx?'Max':`<span class="coin"></span>${c}`}</button></div>`}).join('');
  const tals=TAL[heroCls].map(t=>{const own=hasTal(t.k);
    return `<div class="tal${own?' own':''}"><b>${t.n}</b><p>${t.d}</p>${own?'<span class="owned">Acquis</span>':`<button class="btn buy" data-cact="tal" data-arg="${t.k}" ${meta.gold<t.cost?'disabled':''}><span class="coin"></span>${t.cost}</button>`}</div>`}).join('');
  
  return `<h3>Améliorations permanentes</h3><div class="ups">${ups}</div><h3>Talents · ${CLS[heroCls].n}</h3><div class="tals">${tals}</div>`;
}
function tabBadges(){
  const bp=[...Object.values(WPN).flat().filter((w,i)=>!/0$/.test(w.id)),...GEAR_BP];
  const craft=bp.filter(x=>{const b=bpdef(x.id);if(b.kind==='arme'&&ownedW(b.id))return false;const pc=meta.parts[b.id]||[0,0,0],cost=b.kind==='arme'?Math.round(b.bp/2):b.craft;return pc.every(n=>n>0)&&meta.gold>=cost}).length;
  const relTot=Object.values(meta.relics).reduce((n,a)=>n+(a[0]||0)+(a[1]||0),0);relicQFix();const relFree=relTot-meta.relicQ.length;
  const ups=UPG.filter(u=>lv(u.k)<u.max&&meta.gold>=upCost(u)).length+(TAL[heroCls]||[]).filter(t=>!hasTal(t.k)&&meta.gold>=t.cost).length;
  const pr=(prOpen()||prOf().lv)?prFree():0,prBuy=(prOpen()||prOf().lv)&&meta.gold>=prCost(prOf().lv).gold&&meta.essence>=prCost(prOf().lv).ess?1:0;
  const best=Object.keys(bestPlan(curEq(),meta.stash.slice(0,300))).length;
  const B={equip:best?{n:best,t:`${best} amélioration${best>1?'s':''} d'équipement`}:null,arsenal:craft?{n:craft,t:`${craft} objet${craft>1?'s':''} à fabriquer`}:null,
    relics:relFree&&!meta.relicQ.length?{n:relFree,t:`${relFree} relique${relFree>1?'s':''} non équipée${relFree>1?'s':''}`}:null,
    pets:meta.eggs>0?{n:meta.eggs,t:`${meta.eggs} œuf${meta.eggs>1?'s':''} à faire éclore`}:null,
    forge:(ups+pr+prBuy)?{n:pr?pr:ups+prBuy,t:pr?`${pr} point${pr>1?'s':''} de prestige à placer`:`${ups+prBuy} amélioration${ups+prBuy>1?'s':''} achetable${ups+prBuy>1?'s':''}`}:null};
  document.querySelectorAll('.tab').forEach(t=>{let el=t.querySelector('.cx-tab__badge');const b=B[t.dataset.tab];
    if(!b){if(el)el.remove();return}if(!el){el=document.createElement('span');el.className='cx-tab__badge';t.appendChild(el)}el.textContent=b.n>9?'9+':b.n;el.title=b.t;el.setAttribute('aria-label',b.t)})}
// Texte repliable (Disclosure) : une phrase, le détail derrière « En savoir plus ». L'état ouvert est retenu par clé.
let moreOpen={};try{moreOpen=JSON.parse(localStorage.getItem('crypte-more')||'{}')}catch(e){}
function cxMore(key,sentence,body,lab='En savoir plus'){return `<details class="cx-more" data-more="${key}"${moreOpen[key]?' open':''}><summary><span>${sentence}</span><span class="cx-more__toggle"><span class="o">${lab}</span><span class="c">Masquer</span></span></summary><div class="cx-more__body">${body}</div></details>`}
document.addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('details[data-more]'))return;moreOpen[d.dataset.more]=d.open;try{localStorage.setItem('crypte-more',JSON.stringify(moreOpen))}catch(err){}},true);
const subTabs=(items,cur,act)=>`<div class="cx-tabs" role="tablist">${items.map(([k,l,n])=>`<button class="cx-tab" role="tab" data-cact="${act}" data-arg="${k}" aria-selected="${cur===k}">${l}${n?`<span class="cx-tab__badge">${n}</span>`:''}</button>`).join('')}</div>`;
const CAMP_MORE={
  equip:['Touche un objet pour voir sa fiche et l\'équiper.','<p>▲ signale un objet meilleur que celui que tu portes, le cadenas un objet verrouillé (ni recyclé ni utilisé comme source d\'affixe). « Équiper le meilleur » choisit pour chaque emplacement l\'objet qui donne le plus de puissance et de vie.</p><p>Le <b>Prestige</b>, en bas de l\'onglet, s\'ouvre quand toutes les améliorations de la Forge sont au maximum.</p>'],
  arsenal:['Fabrique tes armes et objets Prime avec leurs 3 fragments.','<p>Les fragments viennent des reliques, ouvertes en mission. « Recettes » liste tout ce qui se fabrique, avec où trouver les fragments ; « Mes armes » montre tes armes et leur DPS comparé à celle que tu portes.</p>'],
  relics:['Équipe des reliques : elles s\'ouvrent pendant la mission.',`<p>En mission, ${REACT_N} réactifs (ennemis au halo doré) ouvrent la première relique de la liste, puis la suivante. Chaque relique ouverte rapporte sa récompense et +25 essence, à la réussite de la mission.</p><p>Trois reliques d\'un même niveau fusionnent en une relique du niveau au-dessus. Le raffinage (50 essence) rend une relique éclatante : ses récompenses rares deviennent plus probables.</p>`],
  mods:['Place tes mods dans les cases du héros et de l\'arme.','<p>Chaque mod coûte de la capacité ; la maîtrise, gagnée en mission, en ajoute. Une case alignée sur une polarité divise par deux le coût des mods de cette polarité. Un mod au rang maximum se surcharge avec ses copies (jusqu\'à 5 étoiles).</p>'],
  pets:['Ton familier te suit en mission ; fais éclore tes œufs ici.','<p>Les œufs tombent parfois en ouvrant une relique (Ossuaire 8 %, Sanguine 15 %, Abysse 25 %). Deux familiers identiques de même rang fusionnent en un seul du rang au-dessus (★★★★★ au maximum). Un familier équipé gagne des niveaux (jusqu\'à 20) avec les ennemis abattus.</p>'],
  forge_up:['L\'or du Camp achète des améliorations permanentes et des talents.','<p>Chaque rang s\'applique à tous tes héros ; les talents sont propres au héros. Quand toutes les améliorations sont au maximum, le <b>Prestige</b> s\'ouvre dans l\'onglet Héros.</p><p>La sauvegarde (exporter, importer) se trouve maintenant dans <b>Réglages</b>.</p>'],
  forge_affix:['Touche Source ou Cible, puis un objet, puis l\'affixe à prendre.','<p>La source est détruite ; son affixe passe sur la cible, qui la gagne, la renforce ou la remplace. Le coût en essence dépend de la rareté de la source. Une affixe déjà plus forte sur la cible ne peut pas être remplacée par une plus faible.</p>'],
  forge_recy:['Touche les objets à recycler, puis Recycler en bas.','<p>Recycler détruit un objet contre de l\'essence (selon sa rareté et son amélioration). Une arme ou un objet Prime rend aussi 1 fragment de son schéma. Les objets portés et verrouillés ne se recyclent pas. Filtre par rareté puis « Tout sélectionner » pour recycler un lot d\'un coup.</p>'],
  forge_seals:['Pose un sceau légendaire sur un objet porté.','<p>Les sceaux tombent seulement en Brèche (le mode à plusieurs), sur les Gardiens et les élites ; 100 éclats s\'échangent contre un sceau au hasard. Un sceau par objet, en plus de ses affixes.</p>']};
function drawCamp(){
  if(campTab==='affix'){campTab='forge';forgeSub='affix'}
  const fk=campTab==='forge'?'forge_'+forgeSub:campTab;
  {const h=document.getElementById('campHelp');if(h)h.href='aide/index.html#'+(campTab==='pets'?'familiers':campTab==='forge'?(forgeSub==='affix'?'camp-affix':forgeSub==='seals'?'camp-affix':'camp-forge'):'camp-'+campTab)}
  $('campGold').innerHTML=`<span class="coin"></span>${meta.gold}<span class="e"><span class="essi"></span>${meta.essence}</span>`;
  document.querySelectorAll('.tab').forEach(t=>t.setAttribute('aria-selected',String(t.dataset.tab===campTab)));
  const body=$('campBody'),M=CAMP_MORE[fk],more=M?cxMore(fk,M[0],M[1]):'';
  let h='';
  if(campTab==='forge'){h=subTabs([['up','Améliorations'],['affix','Affixes'],['recy','Recyclage'],['seals','Sceaux',SEAL_IDS.some(id=>meta.seals[id]>0)&&!Object.values(meta.gear).some(i=>i&&i.seal)?1:0]],forgeSub,'fsub')+more+(forgeSub==='affix'?campAffix():forgeSub==='seals'?campSeals():forgeSub==='recy'?campRecycle():campForge())}
  else if(campTab==='mods'||campTab==='pets')h=more+'<div id="modsCamp" class="col"></div>';
  else h=more+(campTab==='equip'?campEquip()+prestSection():campTab==='arsenal'?campArsenal2():campTab==='relics'?campRelics():'');
  body.innerHTML=h;
  if(campTab==='pets'){if(modTab!=='p'){modTab='p';modSel=null;modSF=null;modPF='all';alSel=null}renderMods('modsCamp')}
  else if(campTab==='mods'){if(modTab==='p'){modTab='h';modSel=null;modSF=null;modPF='all';alSel=null}renderMods('modsCamp')}
  tabBadges();
  const dk=typeof campDockHtml==='function'?campDockHtml():'';$('campDock').innerHTML=dk;$('campDock').hidden=!dk;
  const ft=dk?'':campFootHtml();$('campFoot').innerHTML=ft;$('campFoot').hidden=!ft;$('campFoot').className='cx-sheet__foot'+(ft.includes('cx-hint')?' stack':'');
}
// L'action principale de l'onglet, collée en bas de la feuille.
function campFootHtml(){
  if(campTab==='forge'&&forgeSub==='affix')return affixFoot();
  if(campTab==='forge'&&forgeSub==='recy')return recyFoot();
  if(campTab==='equip'){const pn=Object.keys(bestPlan(curEq(),meta.stash)).length;return pn?`<button class="cx-btn cx-btn--primary" data-cact="bestall">Équiper le meilleur · ${pn}</button>`:''}
  if(campTab==='relics'){relicQFix();const ne=relToEquip(relTier);if(!ne)return '';const sh=relTier==='g'?'Givre':relTier==='f'?'Forgées':relTier==='all'?'':RTIER[+relTier].n;return `<button class="cx-btn cx-btn--primary" data-cact="rqtype">Tout équiper${sh?' · '+sh:''} · ${ne}</button>`}
  return '';
}
const campScroll={};
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{const sc=$('campBody').parentElement;campScroll[campTab]=sc.scrollTop;campTab=t.dataset.tab;campSel=null;campBack=null;campMsg='';recyConfirm=false;drawCamp();sc.scrollTop=campScroll[campTab]||0});
$('campSheet').addEventListener('click',e=>{
  {const b=e.target.closest('#campDock [data-act]');if(b&&!b.disabled){modAct(b.dataset.act,b.dataset);return}}
  const b=e.target.closest('button');if(!b||b.disabled||b.closest('#modsCamp')||!b.closest('#campBody,#campFoot,#campDock'))return;campClick(b)});
// Actions du Camp (aussi appelées depuis Réglages pour la sauvegarde).
function campClick(b){
  const d=b.dataset;
  if(d.slot)campSel={slot:d.slot};
  else if(d.stash)campSel={stash:+d.stash};
  else if(d.wsel)campSel={wpn:d.wsel};
  else if(d.cact){
    const a=d.cact,arg=d.arg;
    if(!a.startsWith('recy'))recyConfirm=false;if(a!=='ropen')campMsg='';
    if(a==='ropen'){const [id,rd]=arg.split('|'),g=grantRelic(id,rd==='1');if(g){campMsg=`<div class="card" style="border-color:${MOD_RAR[g.rar].c}"><div class="meta">Relique ${relicName(id)}${rd==='1'?' éclatante':''} ouverte</div><p style="margin:0;font-size:15px">${g.html}</p></div>`;$('campBody').parentElement.scrollTop=0}}
    else if(a==='exp'){saveMsg='';savePending=null;saveMsgOk='';if(saveMode!=='exp'){saveMode='exp';downloadSave()}else saveMode=null}
    else if(a==='savedl'){saveMsg='';downloadSave()}
    else if(a==='saveshare'){saveMsg='';shareSave();return}
    else if(a==='impopen'){saveMode=saveMode==='imp'?null:'imp';saveMsg='';savePending=null}
    else if(a==='copy'){const code=exportCode(),ta=$('saveOut'),sel=()=>{if(ta){ta.focus();ta.select()}};
      try{navigator.clipboard.writeText(code).then(()=>toast('JSON copié'),()=>{sel();toast('Copie refusée : le JSON est sélectionné, copie-le à la main.')})}catch(err){sel();toast('Le JSON est sélectionné, copie-le à la main.')}return}
    else if(a==='imp'){const v=($('saveIn')||{}).value||saveDraft;saveDraft=v;const dd=parseCode(v);if(!dd)saveMsg='Ce JSON n\'est pas une sauvegarde valide. Vérifie qu\'il est complet, de la première accolade à la dernière.';else{savePending=dd;saveMsg=''}}
    else if(a==='impcancel'){savePending=null}
    else if(a==='impok'){const dd=savePending;try{localStorage.setItem('crypte-meta',JSON.stringify(dd.meta));if(dd.cls)localStorage.setItem('crypte-cls',dd.cls);if(dd.best)localStorage.setItem('crypte-best2',String(dd.best));location.reload();return}catch(err){saveMsg='Impossible d\'écrire la sauvegarde : le stockage de ce navigateur est bloqué.'}}
    else if(a==='sfilter'){stF=arg;stP=0}
    else if(a==='ssort'){stS=arg;stP=0}
    else if(a==='spage'){stP+=+arg}
    else if(a==='lock'&&campSel&&(campSel.wpn||campSel.slot==='arme')){const wid=campSel.wpn||curWid();meta.wlock=meta.wlock||{};meta.wlock[wid]=!meta.wlock[wid];const on=meta.wlock[wid];cxUndo(`${esc(wdef(wid).n)} ${on?'verrouillée':'déverrouillée'}`,()=>{meta.wlock[wid]=!on})}
    else if(a==='lock'){const it=campSel&&campSel.stash?meta.stash.find(i=>i.id===campSel.stash):campSel&&campSel.slot?meta.gear[campSel.slot]:null;if(it){it.lock=!it.lock;cxUndo(`${esc(itemName(it))} ${it.lock?'verrouillé':'déverrouillé'}`,()=>{it.lock=!it.lock})}}
    else if(a==='recyask')recyConfirm=true;
    else if(a==='recycancel')recyConfirm=false;
    else if(a==='recyall'){const rec=meta.stash.filter(i=>!(i.type==='Prime'||i.type==='Sanguin'||i.type==='Abyssal'||i.up||i.lock));let e=0;for(const it of rec)e+=RAR[it.r].shard*2;meta.stash=meta.stash.filter(i=>i.type==='Prime'||i.type==='Sanguin'||i.type==='Abyssal'||i.up||i.lock);meta.essence+=e;recyConfirm=false;campSel=null;toast(`${rec.length} objet${rec.length>1?'s':''} recyclé${rec.length>1?'s':''} · +${e} essence`)}
    if(a==='bestall'){const plan=bestPlan(curEq(),meta.stash),names=[];for(const sl in plan){const it=plan[sl];meta.stash=meta.stash.filter(i=>i!==it);const old=meta.gear[sl];if(old)meta.stash.push(old);meta.gear[sl]=it;names.push(`<span style="color:${RAR[it.r].c}">${esc(itemName(it))}</span>`)}campSel=null;if(names.length)toast('Équipé : '+names.join(', '))}
    if(a==='equip'){const it=meta.stash.find(i=>i.id===campSel.stash);if(it){meta.stash=meta.stash.filter(i=>i!==it);const old=meta.gear[it.slot];if(old)meta.stash.push(old);meta.gear[it.slot]=it;campSel={slot:it.slot}}}
    else if(a==='recycle'){const it=meta.stash.find(i=>i.id===campSel.stash);if(it&&!it.lock){const L=invList(),li=L.indexOf(it),nx=L[li+1]||L[li-1];meta.stash=meta.stash.filter(i=>i!==it);const pb=primeBp(it),e=recyGain(it);meta.essence+=e;let fi=-1;
      if(pb)fi=giveFrag(pb);campSel=nx?{stash:nx.id}:null;
      cxUndo(`<b>${esc(itemName(it))}</b> recyclé · +${e} essence${pb?` · fragment ${bpdef(pb).frag[fi]}`:''}`,()=>{meta.stash.push(it);meta.essence-=e;if(pb&&fi>=0&&meta.parts[pb])meta.parts[pb][fi]=Math.max(0,meta.parts[pb][fi]-1);campSel={stash:it.id}})}}
    else if(a==='upg'){const k=+arg;let it=null,isW=false,wid=null;
      if(campSel&&campSel.wpn){isW=true;wid=campSel.wpn}
      else if(campSel&&campSel.slot==='arme'){isW=true;wid=meta.wpn[heroCls]&&ownedW(meta.wpn[heroCls])?meta.wpn[heroCls]:WPN[heroCls][0].id}
      else if(campSel&&campSel.slot)it=meta.gear[campSel.slot];else if(campSel&&campSel.stash)it=meta.stash.find(i=>i.id===campSel.stash);
      const n=isW?(meta.wlv[wid]||0):it?(it.up||0):null;
      if(n!==null&&n<UP_MAX){const kk=Math.min(k,UP_MAX-n),c=upCostRange(n,kk);if(meta.essence>=c){meta.essence-=c;if(isW)meta.wlv[wid]=n+kk;else it.up=n+kk;toast(`Amélioré à +${n+kk}`)}}}
    else if(a==='unequip'){const s=campSel.slot,it=meta.gear[s];if(it){meta.stash.push(it);meta.gear[s]=null;campSel={stash:it.id}}}
    else if(a==='toarsenal'){campTab='arsenal';campSel=null}
    else if(a==='wequip'){if(ownedW(arg)&&wclsOf(arg)===heroCls){meta.wpn[heroCls]=arg;if(campTab==='equip')campSel={slot:'arme'}}}
    else if(a==='arsv'){arsView=arg}
    else if(a==='fsub'){forgeSub=arg;campSel=null}
    else if(a==='gorecy'){campTab='forge';forgeSub='recy';campSel=null}
    else if(a==='gorecy1'){const B={tab:campTab,sel:campSel,scroll:$('campBody').parentElement.scrollTop,label:'Héros'};recySel=new Set([arg]);recyAsk=false;campBack=B;campTab='forge';forgeSub='recy';campSel=null}
    else if(a==='rcsel'){if(recySel.has(arg))recySel.delete(arg);else recySel.add(arg);recyAsk=false}
    else if(a==='rcr'){const r=+arg;if(recyR.has(r))recyR.delete(r);else recyR.add(r);recyAsk=false}
    else if(a==='rcrall'){recyR.clear();recyAsk=false}
    else if(a==='rcall'){for(const it of recyList())if(!it.lock)recySel.add(recyKey(it));recyAsk=false}
    else if(a==='rcnone'){recySel.clear();recyAsk=false}
    else if(a==='rcask'){recyAsk=true}
    else if(a==='rcno'){recyAsk=false}
    else if(a==='rcok'){recyDo()}
    else if(a==='dclose'){campSel=null}
    else if(a==='dmore'){dockMore=!dockMore}
    else if(a==='dall'){dockAll=!dockAll}
    else if(a==='dnav'){const L=invList('equip'),i=L.findIndex(isSel),n=L[i+(+arg)];if(n)campSel=selOf(n)}
    else if(a==='xftake'||a==='xfrecv'){const sc=$('campBody').parentElement.scrollTop;campBack={tab:campTab,sel:campSel,scroll:sc,label:{equip:'Héros',arsenal:'Armurerie'}[campTab]||'Héros',mode:a==='xfrecv'?'recv':'take'};
      xf=a==='xftake'?{src:arg,k:'',dst:'',rep:'',pick:'dst'}:{src:'',k:'',dst:arg,rep:'',pick:'src'};campTab='forge';forgeSub='affix';campSel=null;drawCamp();$('campBody').parentElement.scrollTop=0;return}
    else if(a==='goback'){const B=campBack;campBack=null;if(B){campTab=B.tab;campSel=B.sel;drawCamp();$('campBody').parentElement.scrollTop=B.scroll||0;return}}
    else if(a==='wrecy'){wRecy=arg}
    else if(a==='wrecyq'){const b=bpdef(arg);if(b&&ownedW(arg)&&b.bp>0&&!(meta.wlock&&meta.wlock[arg])&&(meta.wpn[b.cls]||WPN[b.cls][0].id)!==arg){const L=invList('equip'),li=L.findIndex(isSel),nx=L[li+1]||L[li-1];
      const e=wRecyEss(b),sv={lv:meta.wlv[arg],af:meta.waff&&meta.waff[arg],fz:meta.wfz&&meta.wfz[arg]};delete meta.built[arg];delete meta.wlv[arg];if(meta.waff)delete meta.waff[arg];if(meta.wfz)delete meta.wfz[arg];meta.essence+=e;const fi=giveFrag(arg);
      campSel=nx&&!(nx.wid===arg)?selOf(nx):null;
      cxUndo(`<b>${esc(b.n)}</b> recyclée · +${e} essence · fragment ${b.frag[fi]}`,()=>{meta.built[arg]=true;if(sv.lv)meta.wlv[arg]=sv.lv;if(sv.af){meta.waff=meta.waff||{};meta.waff[arg]=sv.af}if(sv.fz){meta.wfz=meta.wfz||{};meta.wfz[arg]=sv.fz}meta.essence-=e;if(meta.parts[arg])meta.parts[arg][fi]=Math.max(0,meta.parts[arg][fi]-1);campSel={wpn:arg}})}}
    else if(a==='wrecyno'){wRecy=null}
    else if(a==='wrecyok'){const b=bpdef(arg);if(b&&ownedW(arg)&&b.bp>0&&!(meta.wlock&&meta.wlock[arg])&&(meta.wpn[b.cls]||WPN[b.cls][0].id)!==arg){const e=wRecyEss(b);delete meta.built[arg];delete meta.wlv[arg];if(meta.waff)delete meta.waff[arg];meta.essence+=e;const i=giveFrag(arg);
      toast(`<b style="color:${RAR[b.r].c}">${b.n}</b> recyclée : +${e} essence et le fragment ${b.frag[i]}`)}wRecy=null}
    else if(a==='craftask'){arsAsk=arsAsk==='craft'?null:'craft'}
    else if(a==='arecyask'){arsAsk=arsAsk==='recy'?null:'recy'}
    else if(a==='arsno'){arsAsk=null}
    else if(a==='craftall'){const cp=craftPlan();let n=0;for(const id of cp.plan)if(craftOne(id))n++;arsAsk=null;if(n){SND.play('pick3');toast(`${n} objet${n>1?'s':''} fabriqué${n>1?'s':''}`)}}
    else if(a==='arecyall'){const rp=recyPlan();let e=0,n=0;for(const w of rp.ws){const b=bpdef(w.id);e+=wRecyEss(b);delete meta.built[w.id];delete meta.wlv[w.id];if(meta.waff)delete meta.waff[w.id];giveFrag(w.id);n++}
      for(const it of rp.pr){e+=primeRecyEss(it);meta.stash=meta.stash.filter(x=>x!==it);giveFrag(primeBp(it));n++}meta.essence+=e;arsAsk=null;campSel=null;if(n)toast(`${n} objet${n>1?'s':''} recyclé${n>1?'s':''} · +${e} essence et ${n} fragment${n>1?'s':''}`)}
    else if(a==='craft'){const b=bpdef(arg),pc=meta.parts[arg],cost=b.kind==='arme'?Math.round(b.bp/2):b.craft;
      if(pc&&pc.every(x=>x>0)&&meta.gold>=cost){
        if(b.kind==='arme'){meta.parts[arg]=pc.map(x=>x-1);meta.gold-=cost;meta.built[arg]=true;if(b.cls===heroCls)meta.wpn[heroCls]=arg;toast(`<b style="color:${RAR[b.r].c}">${b.n}</b> fabriquée et équipée`)}
        else{meta.parts[arg]=pc.map(x=>x-1);meta.gold-=cost;meta.stash.push({id:uid++,slot:b.slot,r:b.r,lvl:20,base:{k:BASE_STAT[b.slot],v:b.base},aff:{...b.aff},name:b.n,type:'Prime',bp:b.id});toast(`<b style="color:${RAR[b.r].c}">${b.n}</b> fabriqué, il t'attend au coffre`)}}}
    else if(a==='rftgt'){fuseTgt=arg}
    else if(a==='rfuse'){const t=+arg,cp=relAvail(t).length<3&&t>0?chainPlan(t):null,cost=cp?cp.cost:FUSE_COST[t];if((relAvail(t).length>=3||cp)&&meta.essence>=cost&&(t<3||fuseTgt)&&ensureRel(t)){const av=relAvail(t);meta.essence-=FUSE_COST[t];
        for(const q of av.slice(0,3))meta.relics[q.id][q.rad?1:0]--;relicQFix();SND.play('relic');
        if(t<3){const ids=Object.keys(RELICS).filter(id=>RELICS[id].t===t+1&&!RELICS[id].fz),nid=pick(ids);const a=meta.relics[nid]||(meta.relics[nid]=[0,0]);a[0]++;relSel=nid;
          campMsg=`<div class="card" style="border-color:${RTIER[t+1].c}"><div class="meta">Fusion réussie</div><p style="margin:0;font-size:15px">Tu obtiens la relique <b style="color:${RTIER[t+1].c}">${relicName(nid)}</b>.</p></div>`}
        else{const fid='F_'+fuseTgt,a=meta.relics[fid]||(meta.relics[fid]=[0,0]);a[0]++;relSel=fid;campMsg=`<div class="card" style="border-color:${RTIER[3].c}"><div class="meta">Fusion réussie</div><p style="margin:0;font-size:15px">Tu obtiens la <b style="color:${RTIER[3].c}">${RELICS[fid].n}</b>. Équipe-la et ouvre-la en mission : elle donne à coup sûr un fragment de ce schéma (${fragStatus(fuseTgt)} / 3 aujourd'hui).</p></div>`}}}
    else if(a==='rsel'){relSel=relSel===arg?null:arg}
    else if(a==='rtier'){relTier=arg;relSel=null}
    else if(a==='rqadd'){const [id,rd]=arg.split('|'),rad=rd==='1',ow=(meta.relics[id]||[0,0])[rad?1:0];if(relicQN(id,rad)<ow)meta.relicQ.push({id,rad})}
    else if(a==='rqdel'){const [id,rd]=arg.split('|'),rad=rd==='1';for(let i=meta.relicQ.length-1;i>=0;i--)if(meta.relicQ[i].id===id&&!!meta.relicQ[i].rad===rad){meta.relicQ.splice(i,1);break}}
    else if(a==='rqrm'){meta.relicQ.splice(+arg,1)}
    else if(a==='rqup'||a==='rqdn'){const i=+arg,j=a==='rqup'?i-1:i+1,Q=meta.relicQ;if(j>=0&&j<Q.length)[Q[i],Q[j]]=[Q[j],Q[i]]}
    else if(a==='rqnone'){meta.relicQ=[]}
    else if(a==='rqtype'){const ids=Object.keys(RELICS).filter(id=>meta.relics[id]&&relMatch(id)).sort((x,y)=>RELICS[x].t-RELICS[y].t);for(const id of ids){const r=meta.relics[id];for(const rad of [true,false])while(relicQN(id,rad)<(r[rad?1:0]|0))meta.relicQ.push({id,rad})}}
    else if(a==='rqtypeoff'){meta.relicQ=meta.relicQ.filter(q=>!RELICS[q.id]||!relMatch(q.id))}
    else if(a==='rqall'){for(const id in RELICS){const r=meta.relics[id];if(!r)continue;for(const rad of [true,false])while(relicQN(id,rad)<r[rad?1:0])meta.relicQ.push({id,rad})}}
    else if(a==='xfk'){xf.k=arg;xf.rep='';xf.op=''}
    else if(a==='xfpick'){xf.pick=arg}
    else if(a==='xfop'){xf.op=arg}
    else if(a==='afcat'){afCat=arg;afOpen=''}
    else if(a==='wish'){const W=meta.wish||(meta.wish={leg:true,aff:{}});W.aff=W.aff||{};if(W.aff[arg])delete W.aff[arg];else W.aff[arg]=true}
    else if(a==='wishleg'){const W=meta.wish||(meta.wish={leg:true,aff:{}});W.leg=!W.leg}
    else if(a==='wishnone'){if(meta.wish)meta.wish.aff={}}
    else if(a==='afopen'){afOpen=afOpen===arg?'':arg}
    else if(a==='afuse'){const [k,key]=arg.split('|'),it=xfGet(key);if(!it||it.lock||it.aff[k]==null||key===xf.dst)return;xf.src=key;xf.k=k;xf.rep='';xf.pick='dst'}
    else if(a==='afilter'){afF=arg;afP=0}
    else if(a==='apage'){afP+=+arg}
    else if(a==='xfsel'){const it=xfGet(arg);if(!xfOk(arg,it))return;
      if(xf.pick==='src'){if(arg===xf.src){xf.src='';xf.k=''}else{xf.src=arg;xf.k='';if(xf.dst===arg)xf.dst=''}xf.rep='';if(xf.src&&!xf.dst)xf.pick='dst'}
      else{if(arg===xf.dst)xf.dst='';else xf.dst=arg;xf.rep='';if(xf.dst&&!xf.src)xf.pick='src'}}
    else if(a==='xfrep'){xf.rep=arg}
    else if(a==='xfcancel'){xf={src:'',k:'',dst:'',rep:'',pick:'src'}}
    else if(a==='xfok'){xfDo()}
    else if(a==='refine'){const r=meta.relics[arg];if(r&&r[0]>relicQN(arg,false)&&meta.essence>=50){r[0]--;r[1]++;meta.essence-=50}}
    else if(a==='prbuy'){const o=prOf(),c=prCost(o.lv);if((prOpen()||o.lv)&&meta.gold>=c.gold&&meta.essence>=c.ess){meta.gold-=c.gold;meta.essence-=c.ess;o.lv++;toast(`Prestige du ${CLS[heroCls].n} : niveau ${o.lv}. Place ton point.`)}}
    else if(a==='pradd'){const o=prOf(),q=PREST.find(x=>x.k===arg);if(q&&prFree()>0&&!(q.max&&prPt(q.k)>=q.max))o.pts[q.k]=prPt(q.k)+1}
    else if(a==='prreset'){prOf().pts={}}
    else if(a==='up'){const u=UPG.find(x=>x.k===arg),c=upCost(u);if(meta.gold>=c&&lv(u.k)<u.max){meta.gold-=c;meta.up[u.k]=lv(u.k)+1}}
    else if(a==='tal'){const t=TAL[heroCls].find(x=>x.k===arg);if(meta.gold>=t.cost){meta.gold-=t.cost;meta.tal[t.k]=true}}
    else if(a==='start'){meta.start=+arg}
    saveMeta();syncEq();
  }
  drawCamp();if(!$('settings').hidden)drawSettings();
}
$('campBody').addEventListener('input',e=>{if(e.target.id==='saveIn')saveDraft=e.target.value});
$('campBody').addEventListener('change',e=>{if(e.target.id==='xfSrc'){xf={src:e.target.value,k:'',dst:xf.dst===e.target.value?'':xf.dst,rep:''};drawCamp()}else if(e.target.id==='xfDst'){xf.dst=e.target.value;xf.rep='';drawCamp()}});
$('campBody').addEventListener('change',e=>{if(e.target.id!=='saveFile'||!e.target.files[0])return;const r=new FileReader();
  r.onload=()=>{saveDraft=String(r.result);const dd=parseCode(saveDraft);if(dd){savePending=dd;saveMsg=''}else saveMsg='Ce fichier ne contient pas de sauvegarde JSON valide.';drawCamp()};r.readAsText(e.target.files[0])});
function openCamp(){$('camp').hidden=false;campSel=null;campMsg='';recyConfirm=false;drawCamp()}
function closeCamp(){$('camp').hidden=true;if(!started)newGame();refreshMenus()}
// Accueil : lignes résumées (Biome, Niveau, Difficulté, Reliques) ; Lancer et le Camp restent en bas.
function diffLine(i){const D=i===3?dif3():DIFF[i],iv=Math.round(D.iv*(meta.mode==='capture'?1.5:1));
  return (i===3?`Monstres : vie ×${fmtN(D.hp)}, dégâts ×${fmtN(D.dm)} · affixes +${Math.round(D.aq*100)} % · `:'')+`${D.cnt>1?`${D.cnt} Gardiens`:'1 Gardien'} toutes les ${iv} s · ${D.loot?`butin et or +${Math.round(D.loot*100)} %`:'butin normal'}`}
const dif3=()=>{const sv=meta.diff;meta.diff=3;const D=dif();meta.diff=sv;return D};
function refreshMenus(){
  $('introGold').textContent=meta.gold;
  {let n=0;try{tabBadges();document.querySelectorAll('#camp .cx-tab__badge').forEach(b=>{n+=parseInt(b.textContent)||0})}catch(e){}const cb=$('campBadge');if(cb){cb.hidden=!n;cb.textContent=n>9?'9+':n;cb.setAttribute('aria-label',`${n} à voir`)}}
  const st=clamp(meta.start|0||1,1,LV_MAX);$('startBtn').textContent=`Lancer · ${MODES[meta.mode].n} · niveau ${st}`;
  if(document.activeElement!==$('lvIn'))$('lvIn').value=st;$('lvMinus').disabled=st<=1;$('lvPlus').disabled=st>=LV_MAX;
  const lm=lootMul(st);$('lvDesc').textContent=st===1?'Plus haut : plus de butin, monstres plus forts':`Butin ×${lm.toFixed(2).replace(/\.?0+$/,'').replace('.',',')} · or ×${goldMul(st).toFixed(1).replace('.',',')} · monstres plus forts`;
  $('bestTxt').textContent=best?`Meilleure survie : ${fmt(best)}`:'';
  document.querySelectorAll('.cx-pick[data-m]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.m===meta.mode)));
  $('modeDesc').textContent=MODES[meta.mode].d;
  {const bi=Math.max(0,Math.min(BIOMES.length-1,meta.biome|0));$('bioVal').textContent=(bi?'❄ ':'')+BIOMES[bi].n}
  relicQFix();const rn=meta.relicQ.length,rt=Object.values(meta.relics).reduce((n,a)=>n+(a[0]||0)+(a[1]||0),0);
  $('relicVal').textContent=rn?`${rn} équipée${rn>1?'s':''}`:'Aucune';$('relicVal').style.color=rn?'':'var(--muted)';
  const D=dif(),di=Math.max(0,Math.min(3,meta.diff|0));
  $('diffVal').textContent=D.n;$('diffVal').style.color=di?DIFF[di].c:'';
  $('diffDesc').textContent=di?diffLine(di):'';
}
// Feuille de choix (SettingRow → Sheet + Choice) : toucher une option la choisit et ferme la feuille.
let pickOnClose=null;
function openPick(title,opts,onPick,extra){$('pickTitle').textContent=title;
  $('pickBody').innerHTML=`<div class="cx-choices" role="radiogroup" aria-label="${title}">${opts.map((o,i)=>`<button class="cx-choice" role="radio" data-pick="${i}" aria-checked="${!!o.on}" style="--cc:${o.c||'var(--ink)'}"><span class="cx-choice__key">${i+1}</span><span class="cx-choice__name">${o.n}</span><p class="cx-choice__desc">${o.d||''}</p><span class="cx-choice__go" aria-hidden="true">›</span></button>`).join('')}</div>${extra?extra():''}`;
  $('pickBody').onclick=e=>{const b=e.target.closest('[data-pick]');if(b){const keep=onPick(+b.dataset.pick);if(keep)openPick(title,keep.opts||opts,onPick,extra);else closePick();return}
    const t=e.target.closest('[data-torm]');if(t){setTorm((meta.torm|0||1)+(+t.dataset.torm));openPick(title,diffOpts(),onPick,extra)}};
  $('pickSheet').hidden=false}
function closePick(){$('pickSheet').hidden=true}
$('pickClose').onclick=closePick;$('pickSheet').addEventListener('click',e=>{if(e.target.id==='pickSheet')closePick()});
const diffOpts=()=>DIFF.map((d,i)=>({n:i===3?`${d.n} · ${dif3().n.replace('Tourment ','palier ')}`:d.n,d:diffLine(i),c:i?d.c:'var(--ink)',on:i===(meta.diff|0)}));
const tormExtra=()=>(meta.diff|0)===3?`<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Palier de Tourment<small>Plus haut : monstres plus forts, plus d'objets ancestraux</small></span><span class="cx-stepper"><button type="button" data-torm="-1" ${dif().tier<=1?'disabled':''} aria-label="Baisser le palier">−</button><b style="min-width:3.2em;display:grid;place-items:center;font:700 16px/1 var(--font-body);color:#ff6a3a">${ROM[dif().tier-1]}</b><button type="button" data-torm="1" ${dif().tier>=10?'disabled':''} aria-label="Monter le palier">+</button></span></div></div>`:'<p class="cx-hint" style="margin:0">Toucher une difficulté la choisit et ferme la feuille.</p>';
$('rowDiff').onclick=()=>openPick('Difficulté',diffOpts(),i=>{meta.diff=i;saveMeta();newGame();refreshMenus();return i===3?{opts:diffOpts()}:null},tormExtra);
$('rowBio').onclick=()=>openPick('Biome',BIOMES.map((b,i)=>({n:(i?'❄ ':'')+b.n,d:b.d,c:i?'#9fd0ff':'var(--ink)',on:i===(meta.biome|0)})),i=>{meta.biome=i;saveMeta();newGame();refreshMenus()});
const setLv=v=>{meta.start=clamp(Math.round(+v)||1,1,LV_MAX);saveMeta();newGame();refreshMenus()};
$('lvMinus').onclick=()=>setLv((meta.start|0||1)-1);$('lvPlus').onclick=()=>setLv((meta.start|0||1)+1);
$('lvIn').addEventListener('change',e=>{setLv(e.target.value);e.target.value=meta.start});
$('relicBtn').onclick=()=>{campTab='relics';openCamp()};
const setTorm=v=>{meta.torm=Math.max(1,Math.min(10,v));saveMeta();newGame();refreshMenus()};
document.querySelectorAll('.cx-pick[data-m]').forEach(b=>b.onclick=()=>{meta.mode=b.dataset.m;saveMeta();newGame();refreshMenus()});

