// Crypte des Cendres — pet.js : familiers (œufs, rangs, fusion, niveau) et leur build de mods.
const PETS={
  corbeau:{n:'Corbeau de cendre',role:'Attaque',c:'#e8853b',d:'Pique l\'ennemi le plus proche toutes les 1,2 s.'},
  follet:{n:'Feu follet',role:'Soutien',c:'#7fe08a',d:'Te soigne de 1 % de vie par seconde, le double quand tu ne bouges pas.'},
  golem:{n:'Golem de poche',role:'Défense',c:'#a9bccf',d:'Attire pendant 4 s les monstres proches, qui le frappent au lieu de toi, puis attend 7 s ; blesse ceux qui le touchent.'},
  furet:{n:'Furet pilleur',role:'Butin',c:'#f0cf4a',d:'Attire l\'or, l\'expérience et les objets de plus loin, et +5 % de chances d\'objet (× sa puissance).'},
};
const PET_IDS=Object.keys(PETS),PET_RK=5,PET_LV=20,PET_FUSE=r=>100*r;
const petRkMul=r=>1+.35*(r-1),petLvMul=l=>1+.05*(l-1),petNeed=l=>50*l;
const RKS='★';
meta.pets=meta.pets||[];meta.eggs=meta.eggs|0;meta.pload=meta.pload||{};meta.ppol=meta.ppol||{};meta.palign=meta.palign||{};
if(!meta.petGift){meta.eggs+=1;meta.petGift=1}
let petUid=1+Math.max(0,...meta.pets.map(p=>p.uid|0));
const petEq=()=>meta.pets.find(p=>p.uid===meta.petEq)||null;

/* ---------- Mods de familier (build de l'onglet Familier du Camp) ---------- */
Object.assign(MODS,{
  pcrocs:{type:'p',n:'Crocs',r:0,max:5,drain:3,k:'pDmg',v:15,t:v=>`+${v} % de dégâts du familier`},
  pviv:{type:'p',n:'Vivacité',r:0,max:5,drain:3,k:'pAps',v:10,t:v=>`+${v} % de vitesse d'action du familier`},
  pcara:{type:'p',n:'Carapace',r:0,max:3,drain:2,k:'pHp',v:15,t:v=>`+${v} % d'efficacité défensive du familier (golem : durée d'attirance)`},
  plien:{type:'p',n:'Lien',r:0,max:3,drain:2,k:'pLink',v:12,t:v=>`+${v} % de portée et de vitesse du familier`},
  pbec:{type:'p',pt:'corbeau',n:'Bec acéré',r:1,max:3,drain:3,k:'pCrit',v:8,t:v=>`Corbeau : +${v} % de chances de critique`},
  pnuee:{type:'p',pt:'corbeau',n:'Nuée',r:2,max:1,drain:5,k:'pMulti',v:1,t:v=>`Corbeau : frappe ${v} cible${v>1?'s':''} de plus`},
  plum:{type:'p',pt:'follet',n:'Lumière apaisante',r:1,max:5,drain:3,k:'pHeal',v:20,t:v=>`Follet : +${v} % de soin`},
  ppur:{type:'p',pt:'follet',n:'Purification',r:2,max:0,drain:4,k:'pCleanse',v:1,t:()=>'Follet : retire le poison, la brûlure et la gelure toutes les 6 s'},
  pprov:{type:'p',pt:'golem',n:'Provocation',r:1,max:3,drain:3,k:'pTaunt',v:20,t:v=>`Golem : +${v} % de rayon d'attirance`},
  pepine:{type:'p',pt:'golem',n:'Épines',r:1,max:3,drain:3,k:'pThorns',v:25,t:v=>`Golem : +${v} % de dégâts renvoyés`},
  pflair:{type:'p',pt:'furet',n:'Flair du furet',r:1,max:3,drain:3,k:'pLoot',v:3,t:v=>`Furet : +${v} % de chances d'objet`},
  ppoche:{type:'p',pt:'furet',n:'Poches profondes',r:2,max:0,drain:4,k:'pPocket',v:1,t:()=>'Furet : va chercher les objets, mods et reliques au sol'},
  ppartage:{type:'p',n:'Partage de vie',r:2,max:3,drain:4,k:'pLeech',v:2,t:v=>`Les coups du familier te rendent ${v} % de leurs dégâts en vie`},
  pecho:{type:'p',n:'Écho élémentaire',r:2,max:0,drain:4,k:'pEcho',v:1,t:()=>'Les coups du familier posent les statuts de ton arme à 50 % de leur chance'},
  /* v143 : Instinct (lien avec l'esquive), et un mod Or ou Argent de plus pour le corbeau, le golem et le follet. */
  pinst:{type:'p',n:'Instinct',r:1,max:2,drain:3,k:'pInst',v:1,t:v=>`Quand tu esquives, le familier agit tout de suite (attaque, soin, attirance ou butin), une fois toutes les ${fmtN(petInstCd(v))} s`},
  pmarque:{type:'p',pt:'corbeau',n:'Marque du corbeau',r:2,max:2,drain:5,k:'pMark',b:5,v:5,t:v=>`Corbeau : la cible piquée subit +${v} % de tes dégâts pendant ${PET_MARK_T} s`},
  pseisme:{type:'p',pt:'golem',n:'Séisme',r:2,max:2,drain:5,k:'pSeis',b:.3,v:.3,t:v=>`Golem : à la fin de l'attirance, étourdit ${fmtN(v)} s les ennemis proches (Gardiens : 3 fois moins)`},
  pflamme:{type:'p',pt:'follet',n:'Flamme protectrice',r:1,max:2,drain:4,k:'pFlame',b:5,v:5,t:v=>`Follet : sous 30 % de vie, un bouclier de ${v} % de ta vie (une fois toutes les ${PET_FLAME_CD} s)`},
});
Object.assign(MOD_POL,{pcrocs:'b',pviv:'b',pcara:'r',plien:'s',pbec:'b',pnuee:'b',plum:'r',ppur:'r',pprov:'r',pepine:'b',pflair:'s',ppoche:'s',ppartage:'r',pecho:'s',pinst:'b',pmarque:'b',pseisme:'r',pflamme:'r'});
// Instinct : délai entre deux actions de 6, 5 puis 4 s (2,5 s au moins avec les étoiles) ; Marque 3 s ; Flamme protectrice toutes les 20 s ; Séisme jusqu'à 120 px.
const petInstCd=v=>Math.max(2.5,7-v),PET_MARK_T=3,PET_FLAME_CD=20,PET_SEIS_R=120;
/* v143 : Écho élémentaire, Purification et Poches profondes n'ont qu'une valeur : rang unique, sans étoile. Un rang ou des étoiles déjà achetés
   sont remboursés (essence des rangs et des étoiles), ajoutés au message de conversion (meta.modNote.p). */
if((meta.modV|0)<3){let n=0,ess=0;
  for(const id of ['pecho','ppur','ppoche'])if(meta.mods[id]!=null){const rk=meta.mods[id]|0,st=meta.modSt[id]|0,cp=meta.modCp[id]|0;if(!rk&&!st&&!cp)continue;
    for(let i=0;i<rk;i++)ess+=10*Math.pow(2,i)*(MODS[id].r+1);for(let i=0;i<st;i++)ess+=50*(MODS[id].r+1)*(i+1);ess+=cp*8*(MODS[id].r+1);
    meta.mods[id]=0;delete meta.modSt[id];delete meta.modCp[id];n++}
  if(n){meta.essence=(meta.essence|0)+ess;const o=meta.modNote||{conv:0,ref:0,ess:0};meta.modNote={...o,ess:(o.ess|0)+ess,p:(o.p|0)+n}}
  meta.modV=3;saveMeta()}
/* v139 : chaque familier a son build (cases, mods, alignements), rangé sous son numéro : meta.pload[uid], meta.ppol[uid], meta.palign[uid].
   Sans familier équipé, un build vide qui n'est pas enregistré. */
function petBuild(p=petEq()){const rk=p?p.rk:1,lv=p?p.lv:1,key=p?String(p.uid):null;
  return {kind:'p',key,load:key?arrOf(meta.pload,key,4):Array(4).fill(null),pol:key?arrOf(meta.ppol,key,4):Array(4).fill(null),mast:{r:Math.min(10,Math.floor(lv/2)),xp:0},slots:rk>=3?4:3,alignStore:key?meta.palign:{},cap0:8+2*rk,name:p?PETS[p.t].n:'Familier',de:p?`du ${PETS[p.t].n}`:'du familier'}}
// Retire le build d'un familier disparu (fusion) ; copie un build sur un autre familier.
const petBuildDel=uid=>{const k=String(uid);delete meta.pload[k];delete meta.ppol[k];delete meta.palign[k]};
const petBuildCopy=(from,to)=>{const a=String(from),b=String(to);meta.pload[b]=(meta.pload[a]||[]).slice();meta.ppol[b]=(meta.ppol[a]||[]).slice();if(meta.palign[a])meta.palign[b]=meta.palign[a];else delete meta.palign[b]};
// Sauvegarde d'avant la v139 : un seul build pour tous les familiers ; chaque familier possédé le garde.
if(meta.pload.pet||meta.ppol.pet||meta.palign.pet!=null){for(const q of meta.pets){const k=String(q.uid);meta.pload[k]=(meta.pload.pet||[]).slice();meta.ppol[k]=(meta.ppol.pet||[]).slice();if(meta.palign.pet)meta.palign[k]=meta.palign.pet}
  delete meta.pload.pet;delete meta.ppol.pet;delete meta.palign.pet;saveMeta()}
// Statistiques du familier équipé : rang, niveau et mods actifs.
function petStats(){const p=petEq();if(!p)return null;const o={t:p.t,rk:p.rk,lv:p.lv,mul:petRkMul(p.rk)*petLvMul(p.lv),pDmg:0,pAps:0,pHp:0,pLink:0,pCrit:0,pMulti:0,pHeal:0,pCleanse:0,pTaunt:0,pThorns:0,pLoot:0,pPocket:0,pLeech:0,pEcho:0,pInst:0,pMark:0,pSeis:0,pFlame:0};
  for(const id of bActive(petBuild()))if(!MODS[id].pt||MODS[id].pt===p.t)o[MODS[id].k]+=modVal(id,meta.mods[id]);return o}

/* ---------- En mission ---------- */
function petInit(){const ps=petStats();G.pet=ps?{t:ps.t,x:G.P.x-30,y:G.P.y+20,r:10,cd:1,face:0,taunt:0,tcd:3,clean:6,flap:0,hit:0,inst:0,fp:0}:null;G.petS=ps}
function petTick(dt){const Q=G.pet,ps=G.petS,P=G.P;if(!Q||!ps||G.over)return;
  // suit le héros, un peu en retrait
  const sp=S.speed*1.15*(1+ps.pLink/100),fx=P.dx||0,fy=P.dy==null?-1:P.dy,ox=P.x-fx*34-fy*34,oy=P.y-fy*34+fx*34+(Q.t==='corbeau'?-10:0);
  let tx=ox,ty=oy;
  if(Q.t==='furet'&&ps.pPocket){let best=null,bd=420*420;for(const d of G.drops){if(d.kind==='xp'||d.kind==='gold')continue;const k=(d.x-P.x)**2+(d.y-P.y)**2;if(k<bd&&k>3600){bd=k;best=d}}if(best){tx=best.x;ty=best.y;if(Math.hypot(best.x-Q.x,best.y-Q.y)<20)best.mt=Math.max(best.mt,.01)}}
  const dx=tx-Q.x,dy=ty-Q.y,dd=Math.hypot(dx,dy);if(dd>900){Q.x=P.x;Q.y=P.y}else if(dd>4){const v=Math.min(dd,sp*dt*(dd>120?1.6:1));Q.x+=dx/dd*v;Q.y+=dy/dd*v;Q.face=Math.atan2(dy,dx)}
  Q.flap+=dt*10;Q.hit=Math.max(0,Q.hit-dt*4);if(Q.inst>0)Q.inst-=dt;if(Q.fp>0)Q.fp-=dt;
  const pow=ps.mul*(1+ps.pDmg/100),rate=1+ps.pAps/100;
  // v143 : Écho élémentaire pose les statuts de l'arme (onHit, chances × 0,5) ; Marque du corbeau sur chaque cible piquée
  const hitE=(e,d,mk)=>{const crit=Math.random()*100<5+ps.pCrit;const dmg=d*(crit?S.critDmg/100:1);dmgEnemy(e,dmg,crit);if(ps.pLeech)heal(dmg*ps.pLeech/100);
    if(e.dead||e.downed)return;if(ps.pEcho)onHit(e,dmg,crit,{m:.5});if(mk&&ps.pMark>0){e.mark=PET_MARK_T;e.markV=ps.pMark}};
  if(Q.t==='corbeau'){Q.cd-=dt*rate;if(Q.cd<=0){const R=260*(1+ps.pLink/100),L=[];for(const e of G.en){if(e.dead||e.type==='cible')continue;const k=(e.x-Q.x)**2+(e.y-Q.y)**2;if(k<R*R)L.push([k,e])}
      L.sort((a,b)=>a[0]-b[0]);const n=1+Math.round(ps.pMulti);if(L.length){Q.cd=1.2;Q.hit=1;for(const [,e] of L.slice(0,n)){hitE(e,S.dmg*.6*pow,1);G.zaps.push({x1:Q.x,y1:Q.y,x2:e.x,y2:e.y,t:.1})}const e0=L[0][1];Q.face=Math.atan2(e0.y-Q.y,e0.x-Q.x)}else Q.cd=.3}}
  else if(Q.t==='follet'){if(!P.down){const still=!(inputVec().m>.15);heal(S.hp*.01*ps.mul*(1+ps.pHeal/100)*(still?2:1)*dt)}
    if(ps.pFlame>0&&!P.down&&P.hp<S.hp*.3&&!(Q.fp>0)){Q.fp=PET_FLAME_CD;addShield(S.hp*ps.pFlame/100);G.rings.push({x:P.x,y:P.y,t:0,max:70,col:'127,224,138'});burst(P.x,P.y,16,'#7fe08a',150,2);ftext(P.x,P.y-P.r-10,'bouclier','#7fe08a',13)}
    if(ps.pCleanse){Q.clean-=dt;if(Q.clean<=0){Q.clean=6;if(P.psnT>0||P.brnT>0||P.frzT>0){P.psn=0;P.psnT=0;P.psnD=0;P.brnT=0;P.frzT=0;burst(P.x,P.y,14,'#7fe08a',140,2);ftext(P.x,P.y-P.r-10,'purifié','#7fe08a',13)}}}}
  else if(Q.t==='golem'){if(Q.taunt>0){Q.taunt-=dt;Q.th=(Q.th||0)-dt;if(Q.th<=0){Q.th=.5;const R=46;for(const e of G.en){if(e.dead||e.type==='cible')continue;if((e.x-Q.x)**2+(e.y-Q.y)**2<(R+e.r)**2)hitE(e,S.dmg*.3*pow*(1+ps.pThorns/100))}}
      if(Q.taunt<=0&&ps.pSeis>0)petQuake(Q,ps.pSeis)}
    else{Q.tcd-=dt*rate;if(Q.tcd<=0){Q.tcd=7;Q.taunt=4*(1+ps.pHp/100);G.rings.push({x:Q.x,y:Q.y,t:0,max:petTauntR(ps),col:'169,188,207'})}}}
  else if(Q.t==='furet'){}
}
const petTauntR=ps=>160*(1+(ps.pTaunt||0)/100);
// Séisme (v143) : fin de l'attirance, les ennemis proches du golem sont étourdis (immunité et Gardiens comme un étourdissement d'arme).
function petQuake(Q,t){G.rings.push({x:Q.x,y:Q.y,t:0,max:PET_SEIS_R,col:'169,188,207'});burst(Q.x,Q.y,18,'#a9bccf',170,3);G.hshake=Math.max(G.hshake||0,3);
  for(const e of G.en){if(e.dead||e.downed||e.type==='cible')continue;if(Math.abs(e.x-Q.x)<PET_SEIS_R+e.r&&Math.hypot(e.x-Q.x,e.y-Q.y)<PET_SEIS_R+e.r)stunE(e,t)}}
// Instinct (v143) : à l'esquive, le familier agit aussitôt (corbeau : pique ; follet : 4 s de soin ; golem : attire ; furet : rapporte le butin proche).
function petInst(){const Q=G.pet,ps=G.petS;if(!Q||!ps||!(ps.pInst>0)||Q.inst>0||G.over)return;Q.inst=petInstCd(ps.pInst);
  if(Q.t==='corbeau')Q.cd=0;
  else if(Q.t==='follet'){if(!G.P.down)heal(S.hp*.04*ps.mul*(1+ps.pHeal/100))}
  else if(Q.t==='golem'){if(!(Q.taunt>0))Q.tcd=0}
  else if(Q.t==='furet'){for(const d of G.drops)if(Math.abs(d.x-G.P.x)<360&&Math.hypot(d.x-G.P.x,d.y-G.P.y)<360)d.mt=Math.max(d.mt,.01)}
  const c=PETS[Q.t].c;G.rings.push({x:Q.x,y:Q.y,t:0,max:34,col:[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)).join(',')})}
// Pour l'hôte : un golem qui attire est la cible des monstres proches (le sien ou celui d'un partenaire).
function petLure(e){if(e.type==='cible'||e.tgtPod)return null;const cand=[];if(G.pet&&G.pet.t==='golem'&&G.pet.taunt>0&&G.petS)cand.push([G.pet,petTauntR(G.petS)]);
  for(const q of G.mates||[])if(q.pet&&q.pet.t==='golem'&&q.pet.taunt)cand.push([q.pet,160]);
  for(const [p,R] of cand)if(p.x!=null&&(p.x-e.x)**2+(p.y-e.y)**2<R*R)return p;return null}
const petMagnet=()=>G&&G.pet&&G.pet.t==='furet'&&G.petS?1+.6*G.petS.mul:1;
const petLootPct=()=>G&&G.pet&&G.pet.t==='furet'&&G.petS?5*G.petS.mul+G.petS.pLoot:0;
function petBank(n){const p=petEq();if(!p||!G.pet||!n)return '';let up=0;p.xp=(p.xp|0)+n;while(p.lv<PET_LV&&p.xp>=petNeed(p.lv)){p.xp-=petNeed(p.lv);p.lv++;up++}if(p.lv>=PET_LV)p.xp=0;
  return `${PETS[p.t].n} : niveau ${p.lv} / ${PET_LV}`+(up?` (+${up})`:'')}
// Œufs : chance par relique ouverte, selon son niveau.
function eggFromRelic(id){const t=RELICS[id]?RELICS[id].t:0;if(Math.random()<EGG_CH[t]*BAL.eggMul){meta.eggs++;return true}return false}
// Dessin (2D et WebGL partagent cette forme simple, dessinée au-dessus du sol).
function petDraw2D(Q,alpha){if(!Q)return;const c=PETS[Q.t].c,b=Math.sin((Q.flap||0))*2;ctx.save();ctx.globalAlpha=alpha;ctx.translate(Q.x,Q.y+(Q.t==='corbeau'?b:0));ctx.scale(1.45,1.45);
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,14,9,3.5,0,0,7);ctx.fill();
  if(Q.taunt){ctx.strokeStyle='rgba(169,188,207,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,16+Math.sin(G.t*8)*2,0,7);ctx.stroke()}
  ctx.fillStyle='#1d1822';ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();
  if(Q.t==='corbeau'){ctx.moveTo(-11,0);ctx.lineTo(0,-6-b);ctx.lineTo(11,0);ctx.lineTo(0,5);ctx.closePath()}
  else if(Q.t==='golem'){ctx.rect(-8,-8,16,16)}
  else if(Q.t==='furet'){ctx.ellipse(0,0,11,6,0,0,7)}
  else{ctx.arc(0,0,7+Math.sin(G.t*6),0,7)}
  ctx.fill();ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.arc(2,-1,2,0,7);ctx.fill();ctx.restore()}
function petDrawPx(f,Q,alpha){if(!Q)return;const c=parseInt(PETS[Q.t].c.slice(1),16),b=Math.sin(Q.flap||0)*2,x=Q.x,y=Q.y+(Q.t==='corbeau'?b:0),k=1.45;
  f.lineStyle(0);f.beginFill(0x000000,.35*alpha);f.drawEllipse(x,y+14*k,9*k,3.5*k);f.endFill();
  if(Q.taunt){f.lineStyle(2,0xa9bccf,.5*alpha);f.drawCircle(x,y,(16+Math.sin(G.t*8)*2)*k)}
  f.lineStyle(2.5,c,alpha);f.beginFill(0x1d1822,alpha);
  if(Q.t==='corbeau')f.drawPolygon([x-11*k,y,x,y-(6+b)*k,x+11*k,y,x,y+5*k]);else if(Q.t==='golem')f.drawRect(x-8*k,y-8*k,16*k,16*k);else if(Q.t==='furet')f.drawEllipse(x,y,11*k,6*k);else f.drawCircle(x,y,(7+Math.sin(G.t*6))*k);
  f.endFill();f.lineStyle(0);f.beginFill(c,alpha);f.drawCircle(x+2*k,y-k,2*k);f.endFill()}

/* ---------- Camp › Familier : collection, œufs, fusion ---------- */
let petMsg='';
let petColl=false;
// Onglet Familier : le familier équipé d'abord, puis Œufs et Collection en lignes résumées.
function petPanel(){const eq=petEq();
  const groups={};for(const p of meta.pets){const k=p.t+'|'+p.rk;(groups[k]||(groups[k]=[])).push(p)}
  const fusN=Object.values(groups).filter(g=>g.length>=2&&g[0].rk<PET_RK).length;
  let h='';
  if(eq){const P=PETS[eq.t],ps=petRkMul(eq.rk)*petLvMul(eq.lv),need=petNeed(eq.lv);
    h+=`<article class="cx-card" style="border-color:var(--heal-line)"><div class="cx-card__head"><h4 class="cx-card__title" style="color:${P.c}">${P.n}</h4><span style="color:var(--gold);font-size:13px">${RKS.repeat(eq.rk)}</span><span class="cx-tag cx-tag--heal" style="margin-left:auto">Équipé</span></div>
      <div class="cx-card__meta">${P.role} · puissance ×${fmtN(ps)}</div>
      <div class="cx-meter"><div class="cx-meter__top"><span>Niveau ${eq.lv} / ${PET_LV}${eq.lv<PET_LV?' · expérience':''}</span><b>${eq.lv<PET_LV?`${eq.xp|0} / ${need}`:'max'}</b></div><div class="cx-meter__bar"><i style="--v:${eq.lv<PET_LV?Math.min(100,(eq.xp|0)/need*100):100}%"></i></div></div>
      <p class="cx-hint" style="margin:0">${P.d}</p></article>`}
  else h+=`<p class="cx-hint" style="margin:0">${meta.pets.length?'Aucun familier équipé : choisis-en un dans ta collection.':'Aucun familier : fais éclore ton premier œuf.'}</p>`;
  if(petMsg)h+=`<p class="cx-hint" style="margin:0;color:var(--heal)">${petMsg}</p>`;
  h+=`<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Œufs · ${meta.eggs}<small>Un familier au hasard</small></span><button class="cx-btn cx-btn--sm${meta.eggs?' cx-btn--primary':''}" data-pet="hatch" style="margin:0" ${meta.eggs?'':'disabled'}>Faire éclore</button></div>
    <button class="cx-row" data-pet="coll" aria-expanded="${petColl}"><span class="cx-row__k">Collection</span><span class="cx-row__v">${meta.pets.length} familier${meta.pets.length>1?'s':''}${fusN?` · ${fusN} fusion${fusN>1?'s':''} possible${fusN>1?'s':''}`:''}</span></button></div>`;
  if(petColl&&meta.pets.length)h+=`<ul class="petl">${meta.pets.slice().sort((a,b)=>(b.uid===meta.petEq)-(a.uid===meta.petEq)||b.rk-a.rk||b.lv-a.lv).map(p=>{const P=PETS[p.t],g=groups[p.t+'|'+p.rk],canF=p.rk<PET_RK&&g.length>=2,on=p.uid===meta.petEq,ps=petRkMul(p.rk)*petLvMul(p.lv);
    return `<li class="${on?'on':''}"><span class="petic" style="--pc:${P.c}">${p.t==='corbeau'?'▲':p.t==='golem'?'■':p.t==='furet'?'⬮':'●'}</span><div class="petinfo"><b style="color:${P.c}">${P.n}</b> <span class="pstar">${RKS.repeat(p.rk)}</span><span class="cx-hint" style="margin:0">${P.role} · niveau ${p.lv} / ${PET_LV} · puissance ×${fmtN(ps)}${(()=>{const n=(meta.pload[String(p.uid)]||[]).filter(Boolean).length;return n?` · ${n} mod${n>1?'s':''}`:''})()}</span></div>
      <div class="cx-actions" style="margin:0">${on?`<button class="cx-btn cx-btn--sm cx-btn--ghost" data-pet="uneq">Retirer</button>`:`<button class="cx-btn cx-btn--sm" data-pet="eq" data-arg="${p.uid}">Équiper</button>`}${canF?`<button class="cx-btn cx-btn--sm cost-btn" data-pet="fuse" data-arg="${p.uid}" ${meta.essence<PET_FUSE(p.rk)?'disabled':''}><span>Fusionner → ${RKS.repeat(p.rk+1)}</span>${costHtml([['ess',PET_FUSE(p.rk)]])}</button>`:''}</div></li>`}).join('')}</ul>`;
  return h}
function petAct(a,arg){petMsg='';
  if(a==='coll'){petColl=!petColl;modsChanged();return}
  if(a==='hatch'){if(meta.eggs<=0)return;meta.eggs--;const t=pick(PET_IDS),p={uid:petUid++,t,rk:1,lv:1,xp:0};meta.pets.push(p);if(!meta.petEq)meta.petEq=p.uid;petMsg=`L'œuf éclot : ${PETS[t].n} ${RKS} !`;SND.play('leg')}
  else if(a==='eq'){meta.petEq=+arg}
  else if(a==='uneq'){meta.petEq=null}
  else if(a==='fuse'){const p=meta.pets.find(x=>x.uid===+arg);if(!p||p.rk>=PET_RK)return;const c=PET_FUSE(p.rk);if(meta.essence<c)return;
    const o=meta.pets.filter(x=>x!==p&&x.t===p.t&&x.rk===p.rk).sort((a,b)=>(a.uid===meta.petEq)-(b.uid===meta.petEq)||a.lv-b.lv)[0];if(!o)return;
    meta.essence-=c;const keepEq=meta.petEq===o.uid||meta.petEq===p.uid;p.lv=Math.max(p.lv,o.lv);p.xp=Math.max(p.xp|0,o.xp|0);p.rk++;meta.pets=meta.pets.filter(x=>x!==o);
    // v139 : le familier gardé prend le build de celui qui était équipé
    if(meta.petEq===o.uid)petBuildCopy(o.uid,p.uid);petBuildDel(o.uid);if(keepEq)meta.petEq=p.uid;
    petMsg=`${PETS[p.t].n} passe ${RKS.repeat(p.rk)} : puissance ×${fmtN(petRkMul(p.rk)*petLvMul(p.lv))}.`;SND.play('relic')}
  saveMeta();if(typeof syncEq==='function')syncEq();modsChanged()}
