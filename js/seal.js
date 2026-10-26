// Crypte des Cendres — seal.js : sceaux légendaires (affixes très rares de la Brèche, mode coopératif).
// Un sceau par objet, en plus des affixes ; la même affixe ne compte qu'une fois sur l'équipement porté.
const SEALS={
  sablier:{n:'Sablier brisé',d:'−20 % de recharge de la compétence, au-delà du plafond de 50 %',g:0},
  vif:{n:'Esprit vif',d:'−15 % de recharge de la compétence pour toi et les alliés proches',g:1},
  gourde:{n:'Gourde sans fond',d:'+2 potions au départ, et 6 potions au maximum au lieu de 5',g:0},
  alch:{n:'Alchimie partagée',d:'Boire une potion soigne aussi de 25 % les alliés proches',g:1},
  esq:{n:'Seconde esquive',d:'+1 charge d\'esquive : deux esquives de suite avant la recharge',g:0},
  cri:{n:'Cri de ralliement',d:'L\'ultime se recharge 20 % plus vite pour toi et les alliés proches',g:1},
  main:{n:'Main tendue',d:'Les alliés à terre près de toi se relèvent 2 fois plus vite',g:1},
  soin:{n:'Aura de soin',d:'Ta compétence rend 5 % de vie aux alliés dans sa zone',g:1},
  ombre:{n:'Pas de l\'ombre',d:'Après une esquive, ton coup suivant est un critique garanti',g:0},
  fort:{n:'Fortune d\'équipe',d:'+10 % de chances d\'objet pour toi et les alliés proches',g:1},
};
const SEAL_IDS=Object.keys(SEALS),SEAL_C='#ff5fd2',SEAL_R=300,SEAL_SHARDS=100,SEAL_DROP=.003,SEAL_UNSEAT=300;
meta.seals=meta.seals||{};meta.lshard=meta.lshard|0;
const sealOn=id=>!!(S&&S.seals&&S.seals[id]);
const sealMask=()=>SEAL_IDS.reduce((m,id,i)=>m|(sealOn(id)&&SEALS[id].g?1<<i:0),0);
// Effet de groupe : porté par toi, ou par un partenaire debout à moins de 300 px.
function mateNearSeal(id){const i=SEAL_IDS.indexOf(id),P=G&&G.P;if(!P||!G.mates)return false;
  for(const q of G.mates)if(!q.down&&((q.aur|0)&(1<<i))&&(q.x-P.x)**2+(q.y-P.y)**2<SEAL_R*SEAL_R)return true;return false}
const teamHas=id=>sealOn(id)||(typeof NET!=='undefined'&&NET.on&&mateNearSeal(id));
const potMax=()=>5+(sealOn('gourde')?1:0);
// Soins de groupe : envoyés aux partenaires, appliqués par chacun s'il est dans la zone.
function netFx(k,x,y,r){if(typeof NET==='undefined'||!NET.on)return;const m={t:'fx',k,x:x|0,y:y|0,r:r|0,s:NET.host?0:NET.slot};netSend(m)}
function fxApply(m){const P=G&&G.P;if(!P||P.down||G.over)return;if((P.x-m.x)**2+(P.y-m.y)**2>m.r*m.r)return;
  const h=S.hp*(m.k==='pot'?.25:.05);P.hp=Math.min(S.hp,P.hp+h);ftext(P.x,P.y-P.r-10,'+'+Math.round(h),'#7fe08a',14);if(m.k==='pot')burst(P.x,P.y,10,'#7fe08a',120,2)}
// Butin de la Brèche, calculé par chaque joueur pour lui-même.
function sealLoot(e,push){if(!G||!G.breche||e.noLoot||!(e.type==='boss'||e.elite))return;
  G.loot.lsh=(G.loot.lsh||0)+1;
  if(Math.random()<SEAL_DROP){const id=pick(SEAL_IDS);push({kind:'seal',id},30);SND.play('leg');banner(`<span style="color:${SEAL_C}">Sceau légendaire</span> · ${SEALS[id].n}`,SEAL_C,3)}}
function sealBank(full){const L=G.loot;if(full){for(const id of L.seals||[])meta.seals[id]=(meta.seals[id]|0)+1;meta.lshard+=L.lsh|0}else meta.lshard+=Math.floor((L.lsh|0)/2)}
const sealTxt=id=>`<b style="color:${SEAL_C}">Sceau · ${SEALS[id].n}</b> : ${SEALS[id].d}`;

/* ---------- Camp › Affixes : sceaux ---------- */
let sealSel=null,sealMsg='';
function sealTargets(){const out=[];for(const sl of GEAR_KEYS()){const it=meta.gear[sl];if(it)out.push({it,w:'porté'})}
  for(const it of meta.stash)if(it&&it.slot!=='arme')out.push({it,w:'coffre'});
  return out.sort((a,b)=>(a.w==='porté'?0:1)-(b.w==='porté'?0:1)||b.it.r-a.it.r||b.it.lvl-a.it.lvl)}
function campSeals(){const inv=SEAL_IDS.filter(id=>meta.seals[id]>0),sh=meta.lshard|0,worn=new Set(Object.values(meta.gear).filter(i=>i&&i.seal).map(i=>i.seal));
  let h=`<section class="cx-section sealsec"><h3 class="cx-section__label" style="color:${SEAL_C}">Sceaux légendaires</h3>
    <p class="cx-hint" style="margin:0">Très rares, ils tombent seulement en <b>Brèche</b>, le mode à plusieurs, sur les Gardiens et les élites. Un sceau s'ajoute à un objet en plus de ses affixes (un par objet), et fonctionne aussi en solo. Chaque Gardien ou élite de Brèche donne aussi un éclat : ${SEAL_SHARDS} éclats valent un sceau au hasard.</p>
    <div class="shardbar"><span style="width:${Math.min(100,sh/SEAL_SHARDS*100)}%"></span></div>
    <div class="actions" style="margin:0;align-items:center"><span class="cx-hint" style="margin:0;flex:1">Éclats : <b>${sh}</b> / ${SEAL_SHARDS}</span><button class="btn${sh>=SEAL_SHARDS?' main':''}" data-seal="trade" ${sh>=SEAL_SHARDS?'':'disabled'}>Échanger ${SEAL_SHARDS} éclats</button></div>`;
  if(sealMsg)h+=`<p class="empty" style="font-size:13px;color:${SEAL_C}">${sealMsg}</p>`;
  if(!inv.length)h+=`<p class="cx-hint" style="margin:0">Aucun sceau en réserve pour l'instant.</p>`;
  else h+=`<ul class="seall">${inv.map(id=>`<li><button class="sealb${sealSel===id?' sel':''}" data-seal="sel" data-arg="${id}" aria-pressed="${sealSel===id}"><b>${SEALS[id].n}${meta.seals[id]>1?` ×${meta.seals[id]}`:''}</b><span>${SEALS[id].d}${SEALS[id].g?' · effet de groupe':''}</span>${worn.has(id)?'<em>déjà porté</em>':''}</button></li>`).join('')}</ul>`;
  if(sealSel&&meta.seals[sealSel]>0){const T=sealTargets();
    h+=`<p class="cx-hint" style="margin:0">Choisis l'objet qui reçoit <b style="color:${SEAL_C}">${SEALS[sealSel].n}</b>${worn.has(sealSel)?' (un objet porté l\'a déjà : un second exemplaire ne compterait pas)':''}. Un objet qui a déjà un sceau le rend à ta réserve.</p>
      <div class="sealtg">${T.slice(0,30).map(({it,w})=>`<button class="btn" data-seal="put" data-arg="${it.id}" style="color:${RAR[it.r].c}">${esc(itemName(it))}<span class="cx-hint" style="margin:0"> · ${SLOT[it.slot]} · ${w}${it.seal?' · '+SEALS[it.seal].n:''}</span></button>`).join('')||'<span class="cx-hint">Aucun équipement (armure, amulette, bottes, anneau).</span>'}</div>`}
  const sealed=sealTargets().filter(x=>x.it.seal);
  if(sealed.length)h+=`<h3 class="cx-section__label">Objets scellés</h3><ul class="seall">${sealed.map(({it,w})=>`<li><div class="sealrow"><span><b style="color:${RAR[it.r].c}">${esc(itemName(it))}</b> · ${w}<br><span style="color:${SEAL_C}">${SEALS[it.seal].n}</span></span><button class="btn" data-seal="off" data-arg="${it.id}" ${meta.essence<SEAL_UNSEAT?'disabled':''}>Retirer · <span class="essi"></span>${SEAL_UNSEAT}</button></div></li>`).join('')}</ul>`;
  return h+'</section>'}
const sealItem=id=>{for(const k in meta.gear)if(meta.gear[k]&&String(meta.gear[k].id)===String(id))return meta.gear[k];return meta.stash.find(i=>String(i.id)===String(id))};
$('campBody').addEventListener('click',e=>{const b=e.target.closest('[data-seal]');if(!b)return;const a=b.dataset.seal,arg=b.dataset.arg;sealMsg='';
  if(a==='sel')sealSel=sealSel===arg?null:arg;
  else if(a==='trade'){if((meta.lshard|0)<SEAL_SHARDS)return;meta.lshard-=SEAL_SHARDS;const id=pick(SEAL_IDS);meta.seals[id]=(meta.seals[id]|0)+1;sealSel=id;sealMsg=`Tu obtiens le sceau ${SEALS[id].n}.`;SND.play('leg')}
  else if(a==='put'){const it=sealItem(arg);if(!it||!sealSel||!(meta.seals[sealSel]>0))return;if(it.seal)meta.seals[it.seal]=(meta.seals[it.seal]|0)+1;it.seal=sealSel;meta.seals[sealSel]--;sealMsg=`${SEALS[sealSel].n} posé sur ${itemName(it)}.`;sealSel=null;SND.play('relic')}
  else if(a==='off'){const it=sealItem(arg);if(!it||!it.seal||meta.essence<SEAL_UNSEAT)return;meta.essence-=SEAL_UNSEAT;meta.seals[it.seal]=(meta.seals[it.seal]|0)+1;sealMsg=`${SEALS[it.seal].n} retiré de ${itemName(it)}, rendu à ta réserve.`;delete it.seal}
  saveMeta();if(typeof syncEq==='function')syncEq();drawCamp()});
