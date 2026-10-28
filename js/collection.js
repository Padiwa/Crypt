// Crypte des Cendres — collection.js : Collection › Reliques (tableau par rareté, cartes par type, file d’ouverture, reliques forgées, raffinage en nombre) et ses actions. Découpé de camp.js en v135, gestion refaite en v140.
// Reliques possédées qui ne sont pas encore dans la file d'ouverture (bouton « Tout équiper »).
const relToEquip=()=>Object.keys(RELICS).filter(id=>meta.relics[id]).reduce((n,id)=>n+[true,false].reduce((m,rad)=>m+Math.max(0,(meta.relics[id][rad?1:0]|0)-relicQN(id,rad)),0),0);
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
/* v140 : gestion des reliques. Un tableau par rareté (simples, éclatantes, équipées), puis une carte par type : pour les simples et pour les
   éclatantes, une case à cocher (toutes ou aucune), le nombre à équiper (−, saisie, +) ; le raffinage en nombre ; le contenu et les fragments.
   Les reliques forgées ont leurs lignes dans la carte de leur rareté. Puis la file d'ouverture et la fusion. */
const REFINE_COST=50;
const relRef={}; // nombre à raffiner choisi, par relique
const relOwn=(id,rad)=>Math.max(0,((meta.relics[id]||[0,0])[rad?1:0])|0);
const relRefMax=id=>Math.min(relOwn(id,false),Math.floor((meta.essence|0)/REFINE_COST));
// Règle le nombre de reliques (id, état) dans la file : les nouvelles rejoignent la fin de leur groupe (ou la fin de la file),
// les retirées partent de la fin de leur groupe.
function relSetN(id,rad,n){const own=relOwn(id,rad);n=Math.max(0,Math.min(own,Math.round(+n||0)));let c=relicQN(id,rad);const same=q=>q.id===id&&!!q.rad===rad;
  while(c<n){let at=-1;for(let i=meta.relicQ.length-1;i>=0;i--)if(same(meta.relicQ[i])){at=i;break}meta.relicQ.splice(at<0?meta.relicQ.length:at+1,0,{id,rad});c++}
  while(c>n){for(let i=meta.relicQ.length-1;i>=0;i--)if(same(meta.relicQ[i])){meta.relicQ.splice(i,1);break}c--}
  return n}
// Raffine n reliques simples (REFINE_COST essence chacune) : celles hors de la file d'abord ; une relique équipée raffinée reste à sa place, éclatante.
function relRefine(id,n){const r=meta.relics[id];if(!r)return 0;n=Math.max(0,Math.min(relRefMax(id),Math.round(+n||0)));let free=relOwn(id,false)-relicQN(id,false);
  for(let k=0;k<n;k++){if(free>0)free--;else for(let i=meta.relicQ.length-1;i>=0;i--){const q=meta.relicQ[i];if(q.id===id&&!q.rad){q.rad=true;break}}
    r[0]--;r[1]++;meta.essence-=REFINE_COST}
  return n}
// Totaux d'une rareté (forgées comprises).
function relTierSum(t){let s=0,e=0,q=0;for(const id in RELICS){if(RELICS[id].t!==t)continue;s+=relOwn(id,false);e+=relOwn(id,true);q+=relicQN(id,false)+relicQN(id,true)}return {s,e,q}}
const RCHK_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ok" d="M5 12.5l4.5 4.5L19 7.5"/><path class="mx" d="M6 12h12"/></svg>';
const relLab=(id,rad)=>`${RELICS[id].fz?'relique forgée '+bpdef(RELICS[id].tgt).n:RELICS[id].n.toLowerCase()} ${rad?'éclatante':'simple'}`;
// Une ligne : case à cocher (toutes ou aucune), état et nombre possédé, nombre à équiper.
function relRow(id,rad){const own=relOwn(id,rad);if(!own)return '';const n=relicQN(id,rad),r=rad?1:0,all=n>=own,lab=relLab(id,rad);
  return `<div class="rrow${rad?' is-rad':''}"><button class="rchk" role="checkbox" aria-checked="${all?'true':n?'mixed':'false'}" data-cact="rqset" data-arg="${id}|${r}|${all?0:own}" aria-label="${all?'Retirer':'Équiper'} toutes les reliques ${esc(lab)}s">${RCHK_SVG}</button>
    <span class="rrow__k"><span class="rrow__n">${rad?'<i class="rstar" aria-hidden="true">✦</i>Éclatantes':'Simples'}</span><small><b>×${own}</b> · ${n?`${n} équipée${n>1?'s':''}`:'aucune équipée'}</small></span>
    <span class="cx-stepper rnum"><button type="button" data-cact="rqset" data-arg="${id}|${r}|${n-1}" ${n?'':'disabled'} aria-label="Une ${esc(lab)} de moins">−</button><input type="number" inputmode="numeric" min="0" max="${own}" step="1" value="${n}" data-rnum="${id}|${r}" aria-label="Nombre de reliques ${esc(lab)}s à équiper"><button type="button" data-cact="rqset" data-arg="${id}|${r}|${n+1}" ${n<own?'':'disabled'} aria-label="Une ${esc(lab)} de plus">+</button></span></div>`}
// Raffinage en nombre : simple → éclatante.
function relRefRow(id){const s=relOwn(id,false);if(!s)return '';const mx=relRefMax(id);let v=relRef[id]==null?1:relRef[id];v=Math.max(mx?1:0,Math.min(mx,v));relRef[id]=v;
  return `<div class="rrow rref"><span class="rrow__k">Raffiner${mx<s?`<small>${mx?`${mx} au plus (essence)`:'pas assez d\'essence'}</small>`:''}</span>
    <span class="rref__c"><span class="cx-stepper rnum"><button type="button" data-cact="rrefn" data-arg="${id}|${v-1}" ${v>1?'':'disabled'} aria-label="Raffiner une de moins">−</button><input type="number" inputmode="numeric" min="${mx?1:0}" max="${mx}" step="1" value="${v}" data-rref="${id}" ${mx?'':'disabled'} aria-label="Nombre de reliques ${esc(relLab(id,false))}s à raffiner"><button type="button" data-cact="rrefn" data-arg="${id}|${v+1}" ${v<mx?'':'disabled'} aria-label="Raffiner une de plus">+</button></span>
    <button class="cx-btn cx-btn--sm cost-btn" data-cact="refine" data-arg="${id}|${v}" style="margin:0" ${v&&mx?'':'disabled'}><span>Raffiner${v>1?` ${v}`:''}</span>${costHtml([['ess',REFINE_COST*Math.max(1,v)]])}</button></span></div>`}
// Contenu d'une rareté : les objets et tes fragments.
function relContent(t){return `<p class="cx-hint" style="margin:0">Une relique ${RTIER[t].n} donne un fragment d'un de ces objets ${RAR[RTIER[t].r].n.toLowerCase()}s (deux si éclatante) ; les fragments manquants d'un objet presque complet sortent un peu plus souvent. Une relique forgée donne à coup sûr un fragment de son objet.</p>
  <ul class="rrw">${relPool(t).map(bid=>{const b=bpdef(bid),n=fragStatus(bid),own=b.kind==='arme'&&ownedW(bid);
    const st=n>=3?'<span class="rs ok">✓ prêt à fabriquer</span>':n===2?'<span class="rs comp">★ un fragment de plus</span>':`<span class="rs miss">${n} / 3</span>`;
    return `<li><div class="rrh"><span class="dot" style="background:${RAR[b.r].c}"></span><span class="rl">${esc(b.n)} · ${b.kind==='arme'?'arme':SLOT[b.slot].toLowerCase()}${own?' · possédée':''}</span>${st}</div></li>`}).join('')}</ul>`}
function relCard(t){const T=RTIER[t],base=Object.keys(RELICS).find(id=>RELICS[id].t===t&&!RELICS[id].fz),fz=Object.keys(RELICS).filter(id=>RELICS[id].fz&&RELICS[id].t===t&&(relOwn(id,false)||relOwn(id,true)));
  const S=relTierSum(t);if(!S.s&&!S.e)return '';const comp=relPool(t).some(x=>fragStatus(x)===2);
  return `<article class="cx-card rcard" id="rc${t}" style="--tc:${T.c}"><div class="rcard__head"><span class="rgem${S.e?' rad':''}">${RELIC_SVG}</span><div class="rcard__t"><h4 style="color:${T.c}">Relique ${T.n}</h4><small>${S.s+S.e} · ${S.e} éclatante${S.e>1?'s':''} · ${S.q} équipée${S.q>1?'s':''}</small></div>${comp?'<span class="rcomp" title="Un fragment de plus complète un objet">★</span>':''}</div>
    ${relRow(base,false)}${relRow(base,true)}${relRefRow(base)}
    ${fz.map(id=>{const g=RELICS[id].tgt;return `<div class="rsub"><b>Forgée · ${esc(bpdef(g).n)}</b><small>fragment garanti · ${fragStatus(g)} / 3</small></div>${relRow(id,false)}${relRow(id,true)}${relRefRow(id)}`}).join('')}
    ${cxMore('relc'+t,'Contenu et fragments',relContent(t),'Afficher')}</article>`}
function campRelics(){
  relicQFix();const all=Object.keys(RELICS),own=all.filter(id=>relOwn(id,false)||relOwn(id,true)),Q=meta.relicQ;
  let h=`${campMsg}`;
  const srcRows=`<div class="cx-rows">${RTIER.map((T,t)=>`<div class="cx-row"><span class="cx-row__k"><b style="color:${T.c}">Relique ${T.n}</b><small>${REL_SRC[t]} · fragments ${RAR[T.r].n.toLowerCase()}s</small></span></div>`).join('')}</div>`;
  if(!own.length)return h+'<p class="empty">Aucune relique pour l\'instant. Les monstres en lâchent parfois, et chaque manche réussie en rapporte une. Le type dépend de la difficulté :</p>'+srcRows;
  const SUM=RTIER.map((T,t)=>({T,t,...relTierSum(t)})),tot=SUM.reduce((n,x)=>n+x.s+x.e,0),te=SUM.reduce((n,x)=>n+x.e,0),ts=tot-te;
  // Tableau par rareté
  h+=`<section class="cx-section"><h3 class="cx-section__label">Tes reliques · ${tot}</h3>
    <div class="rsum" role="table" aria-label="Reliques par rareté"><div class="rsum__r rsum__h" role="row"><span role="columnheader">Rareté</span><span role="columnheader">Simples</span><span role="columnheader">Éclatantes</span><span role="columnheader">Équipées</span></div>
    ${SUM.map(x=>`<div class="rsum__r${x.s+x.e?'':' is-none'}" role="row" style="--tc:${x.T.c}"><span role="cell"><b>${x.T.n}</b></span><span role="cell">${x.s}</span><span role="cell" class="e">✦ ${x.e}</span><span role="cell">${x.q} / ${x.s+x.e}</span></div>`).join('')}
    <div class="rsum__r rsum__t" role="row"><span role="cell">Total</span><span role="cell">${ts}</span><span role="cell" class="e">✦ ${te}</span><span role="cell">${Q.length} / ${tot}</span></div></div>
    <div class="cx-actions rsum__a" style="margin:0"><button class="cx-btn cx-btn--sm" data-cact="rqrad" ${SUM.some(x=>x.e)&&all.some(id=>relicQN(id,true)<relOwn(id,true))?'':'disabled'}>Équiper les éclatantes</button><button class="cx-btn cx-btn--sm" data-cact="rqsimple" ${all.some(id=>relicQN(id,false)<relOwn(id,false))?'':'disabled'}>Équiper les simples</button><button class="cx-btn cx-btn--sm cx-btn--danger" data-cact="rqnone" ${Q.length?'':'disabled'}>Tout retirer</button></div>
    <p class="cx-hint" style="margin:0">Coche une ligne pour équiper toutes les reliques de ce type, décoche pour les retirer, ou saisis le nombre à équiper. Raffiner rend une relique simple éclatante (deux fragments au lieu d'un) pour ${REFINE_COST} essence ; une relique équipée le reste.</p></section>`;
  h+=RTIER.map((T,t)=>relCard(t)).join('');
  // File d'ouverture
  h+=`<section class="cx-section"><h3 class="cx-section__label">Ordre d'ouverture · ${Q.length} / ${tot}</h3>
    ${Q.length?`<div class="rq"><ol>${relGroups().map((g,i,A)=>{const R=RELICS[g.id],c=RTIER[R.t].c,ow=relOwn(g.id,g.rad),k=g.id+'|'+(g.rad?1:0);
      return `<li><span class="rqn">${i+1}.</span><span class="rgem${g.rad?' rad':''}" style="--tc:${c}">${RELIC_SVG}</span><b style="color:${c}">${esc(R.fz?'Forgée · '+bpdef(R.tgt).n:R.n)}${g.rad?' · éclatante':''} <span style="color:var(--ink)">×${g.n}</span></b>
      <button class="btn" data-cact="rgmv" data-arg="${k}|-1" ${i?'':'disabled'} aria-label="Monter">↑</button><button class="btn" data-cact="rgmv" data-arg="${k}|1" ${i<A.length-1?'':'disabled'} aria-label="Descendre">↓</button><button class="btn" data-cact="rqdel" data-arg="${k}" aria-label="Retirer une">−</button><button class="btn" data-cact="rqadd" data-arg="${k}" ${g.n<ow?'':'disabled'} aria-label="Équiper une de plus">+</button></li>`}).join('')}</ol></div>
      <p class="cx-hint" style="margin:0">En mission, les reliques s'ouvrent dans cet ordre ; ↑ ↓ déplacent tout un groupe.</p>`
      :'<p class="cx-hint" style="margin:0">Aucune relique équipée : la prochaine mission n\'en ouvrira aucune.</p>'}</section>`;
  return h+fusionSection()+cxMore('relsrc','Où tombent les reliques',srcRows,'Afficher');
}
// Saisie d'un nombre (équiper, raffiner) : appliqué à la validation (Entrée ou sortie du champ).
$('campSheet').addEventListener('change',e=>{const x=e.target;if(!x||!x.matches||campTab!=='relics')return;
  if(x.matches('input[data-rnum]')){const [id,rd]=x.dataset.rnum.split('|');relSetN(id,rd==='1',x.value);relicQFix();saveMeta();drawCamp()}
  else if(x.matches('input[data-rref]')){relRef[x.dataset.rref]=Math.max(0,Math.round(+x.value||0));drawCamp()}});
$('campSheet').addEventListener('keydown',e=>{const x=e.target;if(e.key==='Enter'&&x&&x.matches&&x.matches('input[data-rnum],input[data-rref]')){e.preventDefault();x.blur()}});

Object.assign(CAMP_ACT,{
  rftgt:function(a,arg,b,d){{const [t,id]=arg.split('|');fuseTgt[+t]=id}return CAMP_GO},
  rfuse:function(a,arg,b,d){{const t=+arg,av=relAvail(t),cost=FUSE_COST[t],tg=fuseTgt[t];if(av.length>=3&&meta.essence>=cost&&tg&&RELICS['F_'+tg]){meta.essence-=cost;
        for(const q of av.slice(0,3))meta.relics[q.id][q.rad?1:0]--;relicQFix();SND.play('relic');
        const fid='F_'+tg,ra=meta.relics[fid]||(meta.relics[fid]=[0,0]);ra[0]++;
        campMsg=`<div class="card" style="border-color:${RTIER[t].c}"><div class="meta">Fusion réussie</div><p style="margin:0;font-size:15px">Tu obtiens la <b style="color:${RTIER[t].c}">${esc(RELICS[fid].n)}</b>. Équipe-la et ouvre-la en mission : elle donne à coup sûr un fragment de cet objet (${fragStatus(tg)} / 3 aujourd'hui).</p></div>`}}return CAMP_GO},
  // v140 : nombre à équiper d'une relique dans un état (case à cocher, −, +)
  rqset:function(a,arg,b,d){{const [id,rd,n]=arg.split('|');if(RELICS[id])relSetN(id,rd==='1',+n)}return CAMP_GO},
  rqadd:function(a,arg,b,d){{const [id,rd]=arg.split('|'),rad=rd==='1';relSetN(id,rad,relicQN(id,rad)+1)}return CAMP_GO},
  rqdel:function(a,arg,b,d){{const [id,rd]=arg.split('|'),rad=rd==='1';relSetN(id,rad,relicQN(id,rad)-1)}return CAMP_GO},
  rgmv:function(a,arg,b,d){{const [id,rd,d]=arg.split('|'),Gs=relGroups(),i=Gs.findIndex(g=>g.id===id&&(g.rad?'1':'0')===rd),j=i+(+d);if(i>=0&&j>=0&&j<Gs.length){[Gs[i],Gs[j]]=[Gs[j],Gs[i]];meta.relicQ=Gs.flatMap(g=>Array.from({length:g.n},()=>({id:g.id,rad:g.rad})))}}return CAMP_GO},
  rqnone:function(a,arg,b,d){{meta.relicQ=[]}return CAMP_GO},
  rqrad:function(a,arg,b,d){{for(const id in RELICS)relSetN(id,true,relOwn(id,true))}return CAMP_GO},
  rqsimple:function(a,arg,b,d){{for(const id in RELICS)relSetN(id,false,relOwn(id,false))}return CAMP_GO},
  rqall:function(a,arg,b,d){{const ids=Object.keys(RELICS).filter(id=>meta.relics[id]).sort((x,y)=>RELICS[x].t-RELICS[y].t);for(const id of ids)for(const rad of [true,false])relSetN(id,rad,relOwn(id,rad))}return CAMP_GO},
  rrefn:function(a,arg,b,d){{const [id,n]=arg.split('|');relRef[id]=Math.max(0,+n||0)}return CAMP_GO},
  // Raffinage en nombre (v140) : « id|n » ; « id » seul = une relique
  refine:function(a,arg,b,d){{const [id,n]=arg.split('|'),k=relRefine(id,n==null?1:+n);if(k){SND.play('relic');toast(`${k} relique${k>1?'s':''} ${RELICS[id].fz?'forgée'+(k>1?'s':''):RTIER[RELICS[id].t].n} raffinée${k>1?'s':''} : éclatante${k>1?'s':''}`)}}return CAMP_GO},
});
