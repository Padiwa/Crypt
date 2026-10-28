// Crypte des Cendres — collection.js : Collection › Reliques (file d'ouverture, reliques forgées, raffinage) et ses actions. Découpé de camp.js en v135.
let relSel=null,relTier='all';
// Filtre : 'all', un type (0–3) ou 'f' (forgées)
const relMatch=(id,f=relTier)=>{const R=RELICS[id];return f==='all'||(f==='f'?!!R.fz:String(R.t)===f&&!R.fz)};
const relToEquip=f=>Object.keys(RELICS).filter(id=>meta.relics[id]&&relMatch(id,f)).reduce((n,id)=>n+[true,false].reduce((m,rad)=>m+Math.max(0,(meta.relics[id][rad?1:0]|0)-relicQN(id,rad)),0),0);
const relInQ=f=>meta.relicQ.filter(q=>RELICS[q.id]&&relMatch(q.id,f)).length;
const FUSE_COST=[20,40,80,150];
// Reliques non forgées d'un type, celles hors de la file d'ouverture d'abord, les intactes avant les éclatantes.
function relAvail(t){const out=[];for(const id in RELICS){if(RELICS[id].t!==t||RELICS[id].fz)continue;const a=meta.relics[id];if(!a)continue;
  for(const rad of [false,true]){const own=Math.max(0,a[rad?1:0]|0),q=Math.min(own,relicQN(id,rad));for(let k=0;k<own;k++)out.push({id,rad,q:k>=own-q})}}
  return out.sort((x,y)=>(x.q-y.q)||(x.rad-y.rad))}
// Objets visés par la fusion : ceux du contenu de la relique, les plus proches d'être complets d'abord.
const fuseTargets=t=>relPool(t).sort((a,b)=>fragStatus(b)-fragStatus(a)||(bpdef(a).kind==='arme'?-1:1));
function fusionSection(){
  let h=`<section class="cx-section"><h3 class="cx-section__label">Reliques forgées</h3><p class="cx-hint" style="margin:0">Fusionne 3 reliques d'un même type en une relique forgée de ce type : elle donne à coup sûr un fragment de l'objet de ton choix. Celles hors de la file d'ouverture partent en premier.</p><div class="fuse">`;
  for(let t=0;t<4;t++){const AV=relAvail(t),av=AV.length,cost=FUSE_COST[t],L=fuseTargets(t);if(!fuseTgt[t]||!L.includes(fuseTgt[t]))fuseTgt[t]=L[0]||null;const ok=av>=3&&meta.essence>=cost&&fuseTgt[t];
    if(!av)continue;
    h+=`<div class="frow"><span class="rgem" style="--tc:${RTIER[t].c}">${RELIC_SVG}</span><div class="fl"><b>3 × <span style="color:${RTIER[t].c}">${RTIER[t].n}</span> → relique forgée</b><span>${av} possédée${av>1?'s':''}${av<3?` · il en faut ${3-av} de plus`:''}${av>=3&&meta.essence<cost?` · il manque ${cost-meta.essence} essence`:''}</span></div>
      <button class="btn buy cost-btn" data-cact="rfuse" data-arg="${t}" ${ok?'':'disabled'}><span>Fusionner</span>${costHtml([['rel',3,av,t],['ess',cost]])}</button></div>`;
    if(av>=3)h+=`<div class="ftgt"><span class="cx-hint" style="margin:0">Objet visé :</span><div class="cx-chips">${L.map(id=>{const b=bpdef(id);return `<button class="cx-chip cx-chip--sm" data-cact="rftgt" data-arg="${t}|${id}" aria-pressed="${fuseTgt[t]===id}">${esc(b.n)} <span class="n">${fragStatus(id)} / 3</span></button>`}).join('')}</div></div>`}
  return h+'</div></section>'}
// File d'ouverture regroupée par type (relique + état), dans l'ordre de la première de chaque groupe.
function relGroups(){const G2=[],ix={};for(const q of meta.relicQ){const k=q.id+'|'+(q.rad?1:0);if(ix[k]==null){ix[k]=G2.length;G2.push({id:q.id,rad:!!q.rad,n:0})}G2[ix[k]].n++}return G2}
const RELIC_SVG='<svg viewBox="0 0 24 24"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 6 3-6M12 9v12"/></svg>';
function campRelics(){
  relicQFix();const all=Object.keys(RELICS),own=all.filter(id=>{const a=meta.relics[id];return a&&(a[0]||a[1])}),Q=meta.relicQ;
  let h=`${campMsg}`;
  const srcRows=`<div class="cx-rows">${RTIER.map((T,t)=>`<div class="cx-row"><span class="cx-row__k"><b style="color:${T.c}">Relique ${T.n}</b><small>${REL_SRC[t]} · fragments ${RAR[T.r].n.toLowerCase()}s</small></span><span class="cx-hint" style="margin:0">${(meta.relics[Object.keys(RELICS)[t]]||[0,0]).reduce((a,b)=>a+b,0)}</span></div>`).join('')}</div>`;
  if(!own.length)return h+'<p class="empty">Aucune relique pour l\'instant. Les monstres en lâchent parfois, et chaque manche réussie en rapporte une. Le type dépend de la difficulté :</p>'+srcRows;
  const tot=own.reduce((n,id)=>n+meta.relics[id][0]+meta.relics[id][1],0);
  const qh=`<section class="cx-section"><h3 class="cx-section__label">Ordre d'ouverture · ${Q.length} / ${tot}</h3>
    ${Q.length?`<div class="rq"><ol>${relGroups().map((g,i,A)=>{const R=RELICS[g.id],c=RTIER[R.t].c,own=(meta.relics[g.id]||[0,0])[g.rad?1:0]|0,k=g.id+'|'+(g.rad?1:0);
      return `<li><span class="rqn">${i+1}.</span><span class="rgem${g.rad?' rad':''}" style="--tc:${c}">${RELIC_SVG}</span><b style="color:${c}">${esc(R.fz?'Forgée · '+bpdef(R.tgt).n:R.n)}${g.rad?' · éclatante':''} <span style="color:var(--ink)">×${g.n}</span></b>
      <button class="btn" data-cact="rgmv" data-arg="${k}|-1" ${i?'':'disabled'} aria-label="Monter">↑</button><button class="btn" data-cact="rgmv" data-arg="${k}|1" ${i<A.length-1?'':'disabled'} aria-label="Descendre">↓</button><button class="btn" data-cact="rqdel" data-arg="${k}" aria-label="Retirer une">−</button><button class="btn" data-cact="rqadd" data-arg="${k}" ${g.n<own?'':'disabled'} aria-label="Équiper une de plus">+</button></li>`}).join('')}</ol></div>`
      :'<p class="cx-hint" style="margin:0">Aucune relique équipée : la prochaine mission n\'en ouvrira aucune.</p>'}
    <div class="actions" style="margin:0"><button class="btn" data-cact="rqall" ${Q.length>=tot?'disabled':''}>Tout équiper</button><button class="btn danger" data-cact="rqnone" ${Q.length?'':'disabled'}>Tout retirer</button></div></section>`;
  const tiers=[...new Set(own.filter(id=>!RELICS[id].fz).map(id=>RELICS[id].t))].sort();
  const tchip=(k,lab,c)=>`<button class="cx-chip cx-chip--sm" data-cact="rtier" data-arg="${k}" aria-pressed="${relTier===String(k)}"${c&&relTier!==String(k)?` style="color:${c}"`:''}>${lab}</button>`;
  const list=own.filter(id=>relMatch(id)).sort((x,y)=>RELICS[x].t-RELICS[y].t||(!!RELICS[x].fz-!!RELICS[y].fz));
  if(relSel&&!own.includes(relSel))relSel=null;
  h+=`<section class="cx-section"><h3 class="cx-section__label">Tes reliques · ${tot}</h3><div class="cx-chips">${tchip('all','Toutes')}${tiers.map(t=>tchip(t,RTIER[t].n,RTIER[t].c)).join('')}${own.some(id=>RELICS[id].fz)?tchip('f','Forgées','var(--ink)'):''}</div>
    ${(()=>{const ne=relToEquip(relTier),nq=relInQ(relTier),sh=relTier==='f'?'Forgées':relTier==='all'?'':RTIER[+relTier].n;return relTier!=='all'&&nq?`<div class="actions" style="margin:0"><button class="btn danger" data-cact="rqtypeoff">Retirer · ${sh} (${nq})</button></div>`:(ne?'':`<p class="cx-hint" style="margin:0">${relTier==='all'?'Toutes tes reliques':sh} : déjà équipées.</p>`)})()}
    <div class="rtiles">${list.map(id=>{const R=RELICS[id],a=meta.relics[id],c=RTIER[R.t].c,nq=relicQN(id,false)+relicQN(id,true),comp=R.fz?fragStatus(R.tgt)===2:relPool(R.t).some(x=>fragStatus(x)===2);
      return `<button class="rtile${relSel===id?' sel':''}" data-cact="rsel" data-arg="${id}" style="--tc:${c}" aria-pressed="${relSel===id}" aria-label="${esc(relicName(id))}, ${a[0]} intacte${a[0]>1?'s':''}, ${a[1]} éclatante${a[1]>1?'s':''}${nq?`, ${nq} équipée${nq>1?'s':''}`:''}">
        <span class="rgem${a[1]?' rad':''}">${RELIC_SVG}</span><b>${esc(R.fz?bpdef(R.tgt).n:R.n)}</b><span class="rt">${R.fz?'Forgée · ':''}${RTIER[R.t].n}</span>
        <span class="rc">${a[0]?`×${a[0]}`:''}${a[1]?`<i>✦×${a[1]}</i>`:''}</span>${nq?`<span class="req">${nq} équipée${nq>1?'s':''}</span>`:''}${comp?'<span class="rcomp" title="Peut compléter un objet">★</span>':''}</button>`}).join('')}</div></section>`;
  if(relSel){const id=relSel,R=RELICS[id],a=meta.relics[id],c=RTIER[R.t].c,pool=R.fz?[R.tgt]:relPool(R.t);
    const ctl=(rad,lab)=>{const n=relicQN(id,rad),ow=a[rad?1:0];return `<div class="rctl"><span>${lab} · <b>${n} / ${ow}</b> équipée${n>1?'s':''}</span><span class="cx-stepper"><button type="button" data-cact="rqdel" data-arg="${id}|${rad?1:0}" ${n?'':'disabled'} aria-label="Retirer une ${lab.toLowerCase()}">−</button><button type="button" data-cact="rqadd" data-arg="${id}|${rad?1:0}" ${n<ow?'':'disabled'} aria-label="Équiper une ${lab.toLowerCase()}">+</button></span></div>`};
    h+=`<section class="cx-card rdet" style="--tc:${c}"><div class="cx-card__head"><span class="rgem big${a[1]?' rad':''}">${RELIC_SVG}</span><div><h4 class="cx-card__title" style="color:${c}">${esc(R.n)}</h4><div class="cx-card__meta">${R.fz?'Relique forgée':'Relique'} ${RTIER[R.t].n} · ${REL_SRC[R.t]} · intacte ×${a[0]} · éclatante ×${a[1]}</div></div></div>
      <p class="cx-hint" style="margin:0">${R.fz?'S\'ouvre en mission et donne à coup sûr un fragment de cet objet (deux si éclatante).':`S'ouvre en mission et donne un fragment d'un de ces ${pool.length} objets ${RAR[RTIER[R.t].r].n.toLowerCase()}s (deux si éclatante). Les fragments manquants d'un objet presque complet sortent un peu plus souvent.`}</p>
      <ul class="rrw">${pool.map(bid=>{const b=bpdef(bid),n=fragStatus(bid),own=b.kind==='arme'&&ownedW(bid);
        const st=n>=3?'<span class="rs ok">✓ prêt à fabriquer</span>':n===2?'<span class="rs comp">★ un fragment de plus</span>':`<span class="rs miss">${n} / 3</span>`;
        return `<li><div class="rrh"><span class="dot" style="background:${RAR[b.r].c}"></span><span class="rl">${esc(b.n)} · ${b.kind==='arme'?'arme':SLOT[b.slot].toLowerCase()}${own?' · possédée':''}</span>${st}</div></li>`}).join('')}</ul>
      <div class="cx-card__foot">${a[0]?ctl(false,'Intactes'):''}${a[1]?ctl(true,'Éclatantes'):''}
        ${a[0]?`<button class="btn buy cost-btn" data-cact="refine" data-arg="${id}" ${meta.essence<50||relicQN(id,false)>=a[0]?'disabled':''}><span>Raffiner en éclatante</span>${costHtml([['ess',50]])}</button>`:''}</div></section>`}
  else h+='<p class="cx-hint" style="margin:0">Touche une relique pour voir les objets qu\'elle contient et tes fragments. ★ : un fragment de plus complète un objet.</p>';
  return h+fusionSection()+qh+cxMore('relsrc','Où tombent les reliques',srcRows,'Afficher');
}

Object.assign(CAMP_ACT,{
  rftgt:function(a,arg,b,d){{const [t,id]=arg.split('|');fuseTgt[+t]=id}return CAMP_GO},
  rfuse:function(a,arg,b,d){{const t=+arg,av=relAvail(t),cost=FUSE_COST[t],tg=fuseTgt[t];if(av.length>=3&&meta.essence>=cost&&tg&&RELICS['F_'+tg]){meta.essence-=cost;
        for(const q of av.slice(0,3))meta.relics[q.id][q.rad?1:0]--;relicQFix();SND.play('relic');
        const fid='F_'+tg,ra=meta.relics[fid]||(meta.relics[fid]=[0,0]);ra[0]++;relSel=fid;
        campMsg=`<div class="card" style="border-color:${RTIER[t].c}"><div class="meta">Fusion réussie</div><p style="margin:0;font-size:15px">Tu obtiens la <b style="color:${RTIER[t].c}">${esc(RELICS[fid].n)}</b>. Équipe-la et ouvre-la en mission : elle donne à coup sûr un fragment de cet objet (${fragStatus(tg)} / 3 aujourd'hui).</p></div>`}}return CAMP_GO},
  rsel:function(a,arg,b,d){{relSel=relSel===arg?null:arg}return CAMP_GO},
  rtier:function(a,arg,b,d){{relTier=arg;relSel=null}return CAMP_GO},
  rqadd:function(a,arg,b,d){{const [id,rd]=arg.split('|'),rad=rd==='1',ow=(meta.relics[id]||[0,0])[rad?1:0];if(relicQN(id,rad)<ow)meta.relicQ.push({id,rad})}return CAMP_GO},
  rqdel:function(a,arg,b,d){{const [id,rd]=arg.split('|'),rad=rd==='1';for(let i=meta.relicQ.length-1;i>=0;i--)if(meta.relicQ[i].id===id&&!!meta.relicQ[i].rad===rad){meta.relicQ.splice(i,1);break}}return CAMP_GO},
  rgmv:function(a,arg,b,d){{const [id,rd,d]=arg.split('|'),Gs=relGroups(),i=Gs.findIndex(g=>g.id===id&&(g.rad?'1':'0')===rd),j=i+(+d);if(i>=0&&j>=0&&j<Gs.length){[Gs[i],Gs[j]]=[Gs[j],Gs[i]];meta.relicQ=Gs.flatMap(g=>Array.from({length:g.n},()=>({id:g.id,rad:g.rad})))}}return CAMP_GO},
  rqnone:function(a,arg,b,d){{meta.relicQ=[]}return CAMP_GO},
  rqtype:function(a,arg,b,d){{const ids=Object.keys(RELICS).filter(id=>meta.relics[id]&&relMatch(id)).sort((x,y)=>RELICS[x].t-RELICS[y].t);for(const id of ids){const r=meta.relics[id];for(const rad of [true,false])while(relicQN(id,rad)<(r[rad?1:0]|0))meta.relicQ.push({id,rad})}}return CAMP_GO},
  rqtypeoff:function(a,arg,b,d){{meta.relicQ=meta.relicQ.filter(q=>!RELICS[q.id]||!relMatch(q.id))}return CAMP_GO},
  rqall:function(a,arg,b,d){{for(const id in RELICS){const r=meta.relics[id];if(!r)continue;for(const rad of [true,false])while(relicQN(id,rad)<r[rad?1:0])meta.relicQ.push({id,rad})}}return CAMP_GO},
  refine:function(a,arg,b,d){{const r=meta.relics[arg];if(r&&r[0]>relicQN(arg,false)&&meta.essence>=50){r[0]--;r[1]++;meta.essence-=50}}return CAMP_GO},
});
