// Crypte des Cendres — ui.js
/* ---------- Fiches partagées ---------- */
function statRows(St){
  const rows=[['Dégâts',Math.round(St.dmg)],['Attaques / s',St.aps.toFixed(2)],['Critique',Math.round(St.crit)+' %'],['Dégâts critiques',Math.round(St.critDmg)+' %'],['Puissance',Math.round(power(St))],...(()=>{const W=powerOf(St);return [['· attaques',Math.round(W.atk)],['· sort',Math.round(W.skill)],['· ultime',Math.round(W.ult+W.pulse)],...(W.pet?[['· familier',Math.round(W.pet)]]:[])]})(),['Vie',Math.round(St.hp)],['Réduction',Math.round(St.armor)+' %'],['Vitesse',Math.round(St.speed/2.2)+' %'],['Portée des compétences',Math.round(100+St.skillRad)+' %'],...(heroCls==='magicien'?[['Rayon d\'explosion',Math.round(100+St.splash)+' %']]:[]),heroCls==='guerrier'?['Ondes par coup',St.waves]:['Projectiles par tir',(1+St.multi).toFixed(St.multi%1?2:0)],['Double attaque',St.echo+' %'],['Dégâts de compétence',Math.round(St.nova)],
    // v141 : statuts posés par l'arme (chance par coup) et leurs bonus, montrés seulement s'ils servent
    ...[['Brûlure par seconde',St.burn,''],['Poison',St.psnCh,' %'],['Saignement',St.bldCh,' %'],['Ralentir',St.chill,' %'],['Éclair en chaîne',St.shock,' %'],['Étourdir',St.stunCh,' %'],['Immobiliser',St.rootCh,' %'],
      ['Durée des statuts',St.stDur,' %','+'],['Contagion',St.contag,' %'],['Dégâts des statuts',St.dotPct,' %','+'],['Brise-garde',St.ccDmg,' %','+'],['Épines',St.thorns,' %'],
      // v142 : mods de héros (capacités)
      ['Recharge du sort par ennemi abattu',St.flux,' s','−'],['Sort contre un statut',St.intSt,' %','+'],['Statuts du sort',St.impr,'','×'],['Étourdissement du sort',St.comm,' s'],['Bouclier au lancer du sort',St.gardA,' %'],
      ['Vitesse après une esquive',St.elan,' %','+'],['Protection après une esquive',St.peau,' %','−'],['Statuts à l\'esquive',St.pasEl,' %'],['Riposte (étourdit)',St.ripo,' s'],
      ['Potion gardée',St.econ,' %'],['Élixir de fer',St.exFer,' %','−'],['Élixir de rage',Math.floor(St.exRage||0),'','+'],['Durée des renforts',St.buffDur,' %','+'],['Jauge rendue au lancer',St.rema,' %'],['Statuts de l\'ultime',St.flea,'','×'],['Terreur (dégâts reçus)',St.terr,' %','−']
      ].filter(r=>r[1]>0).map(([a,v,u,sg])=>[a,(sg||'')+(v>=10?Math.round(v):+(+v).toFixed(1)).toString().replace('.',',')+u])];
  return rows.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
}
function slotsHtml(eq,click,selSlot){
  return Object.keys(SLOT).map(k=>{if(!slotOpen(k))return `<div class="slot locked" aria-disabled="true"><span>${SLOT[k]}</span><strong style="color:var(--muted)">Verrouillé</strong></div>`;const it=eq[k],tag=click?'button':'div';
    return `<${tag} class="slot${selSlot===k?' sel':''}"${click?` data-slot="${k}"`:''}><span>${SLOT[k]}</span><strong style="color:${it?RAR[it.r].c:'var(--muted)'}">${it?itemName(it):'Vide'}${it&&it.lock?`<span class="li" aria-label="verrouillé">${LOCK_SVG}</span>`:''}</strong></${tag}>`}).join('');
}
// ▲ : l'objet augmente la Puissance du héros (ou, à Puissance égale, sa survie).
function better(it){return memoOn('better',it,()=>{const e=curEq(),k=tgtKey(e,it);if(!k)return false;return eqGt(eqVal({...e,[k]:it}),eqVal(e))})}
const LOCK_SVG='<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
const cellHtml=(it,attr,sel,up)=>`<button class="cell${sel?' sel':''}${up?' up':''}${it.lock?' locked':''}" data-${attr}="${it.id}" style="border-color:${RAR[it.r].c};color:${RAR[it.r].c}" aria-label="${itemName(it)}${it.lock?', verrouillé':''}">${it.lock?`<span class="lk">${LOCK_SVG}</span>`:''}${it.up?`<span class="cup">R${it.up+1}</span>`:''}${GLYPH[it.slot]}</button>`;
// Clé d'une composition d'équipement (héros, arme, objets) pour le cache d'affichage.
const eqKey=e=>heroCls+'|'+Object.keys(e).map(k=>{const it=e[k];return it?(it.wid?'w'+it.wid+'.'+(meta.wlv[it.wid]|0):it.id+'.'+(it.up|0)):'-'}).join(',');
/* ---------- Puissance (v137) ----------
   Dégâts par seconde estimés dans une horde : attaques + sort + ultime (+ Onde du Vide). Tout y compte : dégâts, cadence, critique
   et dégâts critiques, projectiles, transpercement, portée de frappe, rayon d'explosion, dégâts de compétence, recharge, portée et
   durée des compétences, dégâts et charge de l'ultime, brûlure, éléments, bonus conditionnels et pouvoirs abyssaux.
   C'est le chiffre « Puissance » des fiches, et ce que visent « Équiper le meilleur » et ▲ ; la survie ne fait que départager.
   PW : hypothèses de l'estimation (ennemis touchés par une zone de taille de départ, part des coups concernés par un bonus…).
   kills : ennemis abattus par seconde, pour la charge de l'ultime ; mesuré avec le bot du banc de progression (v137) : 4 à 19 par seconde
   selon le niveau et la classe (1,5 en difficulté), on garde 5.
   v141 : statuts. Poison et saignement en part des dégâts des coups (couches au plus, PW.dot : part touchée avant la mort de l'ennemi),
   part du temps sous contrôle (étourdi, immobilisé, gelé) pour Brise-garde, part des coups sur un ennemi qui porte 1 ou 2 statuts
   pour Œil du chasseur, Boucherie et Catalyse. Le Magicien ne pose les statuts que sur la cible touchée, sauf avec Déflagration. */
// mark : part de tes dégâts sur une cible marquée par le corbeau (par cible piquée) ; dashT : une esquive toutes les 6 s environ (Instinct)
const PW={kills:5,dot:.7,cont:.6,embr:.4,spK:3,low:.1,exec:.25,boss:.15,hunt:.2,shock:1.8,pierce:.5,reachT:1.2,splashT:.3,pulseT:5,shard:.5,doom:.5,mark:.3,dashT:6,
  // c : dégâts d'un lancer en multiples de la puissance de compétence (cibles comprises) ; cr : critique possible ;
  // area : × (1 + portée des compétences) ; rng : × (1 + rng × portée des compétences), carreaux et éclairs qui vont plus loin ;
  // reach : × (1 + portée de frappe) ; splash : × (1 + rayon d'explosion) ; dur : × (1 + durée)
  sk:{volee:{c:24*.35*.4,rng:.5},chasseur:{c:3*1.6*1.5,cr:1,rng:.3},recul:{c:9*.5*.5,cr:1,rng:.3},tourbillon:{c:.22*8*3,cr:1,area:1,reach:1,dur:1},
    bond:{c:1.4*3.5,cr:1,area:1,reach:1},cri:{buff:.2},nova:{c:4,cr:1,area:1},eclair:{c:1.2*5.217,cr:1,rng:.2},transfert:{c:2*.6*2,area:1,splash:1}},
  // ultimes : c (dégâts d'un lancer), ou renfort de t secondes (berserk : × 1,6 ; faucon : cadence × 2 et tout critique ; surcharge : sort toutes les 0,5 s et cadence × 2)
  ul:{titan:{c:ULT_C.titan*8,area:1},rempart:{c:0},berserk:{t:8,x:1.6},pluie:{c:100*ULT_C.pluie,cr:1},faucon:{t:6,hawk:1},tempete:{c:152*ULT_C.tempete*.4,cr:1,rng:.5},
    meteores:{c:3*ULT_C.meteores*5,cr:1,area:1},blizzard:{c:17*ULT_C.blizzard*6,cr:1,area:1},surcharge:{t:6,sur:1}}};
function powerOf(x,cls=heroCls,kit=kitOf(cls)){
  const cr=Math.min(75,x.crit)/100,hits=Math.max(1,x.aps*(1+x.multi*.8));
  // part du temps où une cible porte un effet de durée t, posé à chaque coup avec la chance c
  const upT=(c,t)=>c>0?1-Math.pow(1-Math.min(1,c),Math.max(1,hits*t)):0;
  const dm=1+(x.stDur||0)/100,sd=1+x.skillDur/100;
  const cu=upT(Math.min(60,x.curse||0)/100,5),sl=Math.max(upT((x.chill||0)/100,2*sd*dm),upT((x.frz||0)/100,1.5*sd));
  // attaques : ennemis touchés par coup selon la classe
  const tg=cls==='archer'?1+PW.pierce*x.pierce:cls==='guerrier'?PW.reachT*(1+x.reach/100):1+PW.splashT*(1+x.splash/100);
  // statuts (v141) : chance par coup (Pointe de diamant : à coup sûr sur les ennemis transpercés), couches, temps sous contrôle
  const pf=cls==='archer'&&x.diam&&tg>1?(tg-1)/tg:0,fc=c=>c>0?Math.min(1,c+(1-c)*pf):0;
  const cP=fc((x.psnCh||0)/100),cB0=fc((x.bldCh||0)/100),cB=Math.min(1,cB0+(x.hemo?cr*(1-cB0):0)),cS=fc((x.stunCh||0)/100),cR=fc((x.rootCh||0)/100);
  const rawP=hits*cP*PSN_T*dm,nP=Math.min(PSN_MAX,rawP),nB=Math.min(BLD_MAX,hits*cB*BLD_T*dm);
  const upC=(c,t,imm)=>c>0&&t>0?t/(t+imm+1/(hits*c)):0;
  const stU=Math.max(upC(cS,STUN_T,STUN_IMM),x.surt?upC((x.shock||0)/100*.5,x.surt,STUN_IMM):0),rtU=upC(cR,ROOT_T*sd*dm,ROOT_IMM),
    fzU=x.cryo?upC((x.chill||0)/100*sl,x.cryo,1.5):0,ctl=1-(1-stU)*(1-rtU)*(1-fzU)*(1-upT((x.frz||0)/100,1));
  const pr=[x.burn>0?1:0,upT(cP,PSN_T*dm),upT(cB,BLD_T*dm),sl,stU,rtU,cu];let p0=1,p1=0;for(const q of pr){p1=p1*(1-q)+p0*q;p0*=1-q}
  const pSt=1-p0,p2=Math.max(0,1-p0-p1);
  // critique : Œil du chasseur et Boucherie contre un ennemi qui porte un statut
  const crS=Math.min(1,cr+(x.critSt||0)/100),crE=cr*(1-pSt)+crS*pSt,cm=1+crE*(x.critDmg/100-1)+pSt*crS*(x.cdSt||0)/100;
  // poison et saignement en part des dégâts des coups ; Contagion, Peste
  const dotM=(1+(x.dotPct||0)/100)*PW.dot*(1+PW.cont*(x.contag||0)/100);
  const rP=nP*PSN_PCT/100/hits*(1+(x.peste?(rawP>=PSN_MAX?.12:.05)*x.peste:0)),rB=nB*BLD_PCT/100/BLD_T/hits*(1+(x.hemo&&cB>0?cr/cB*x.hemo/100:0));
  const dotR=(rP+rB)*dotM,stTg=cls==='magicien'?(1+(tg-1)*Math.min(1,Math.max(x.defl||0,EXPL_ST)/100))/tg:1;
  // poison et saignement d'un coup de sort ou d'ultime ; Imprégnation et Fléau (v142) multiplient la chance, plafonds gardés
  const spDotM=k=>(Math.min(.6,cP*k)*PSN_PCT/100*PSN_T*dm+Math.min(.6,cB*k)*BLD_PCT/100*dm)*dotM,spDot=spDotM(x.impr||1),ulDot=spDotM(x.flea||1);
  // chaque coup : bonus conditionnels (part des coups concernés), éléments, pouvoirs abyssaux, Catalyse, Brise-garde
  const hitM=(1+PW.low*x.lowDmg/100)*(1+PW.exec*x.execute/100)*(1+PW.boss*x.bossDmg/100)*(1+PW.hunt*x.abHunt/100)*(1+.06*x.abSoul)*(1+.015*x.abExec)
    *(1+sl*x.cold/100)*(1+cu*(.15+(x.hex||0)/100))*(1+PW.shock*x.shock/100*(x.surt?(3+surtJ(x.surt))/3:1))*(1+cr*x.abRift/100*2.1)*(1+PW.shard*x.shard/100)*(1+cu*PW.doom*(x.doom||0)/100)
    *(1+p2*(x.cata||0)/100)*(1+ctl*(x.ccDmg||0)/100);
  const atk=(x.dmg*x.aps*cm*(1+x.multi*.8)*(1+x.echo/100)*(1+x.waves*.5)*(1+dotR*stTg)+x.burn*(1+PW.embr*(x.embr||0)/150))*tg*hitM;
  // sort
  const sp=SPELLS[cls].s[kit.s]||SPELLS[cls].s[0],K=PW.sk[sp.k],sr=1+x.skillRad/100,cd=Math.max(.5,sp.cd*(1-x.cdr/100)*(x.seals&&x.seals.sablier?.8:1)*(x.seals&&x.seals.vif?.85:1)-Math.min(2,PW.spK*(x.flux||0)));
  let skill=0,buff=1,cast=0;
  if(K.buff)buff=1+K.buff*Math.min(1,6*(1+x.skillDur/100)/cd);
  else{cast=x.nova*K.c*(K.dur?1+x.skillDur/100:1)*(K.area?sr:1)*(K.reach?1+x.reach/100:1)*(K.splash?1+x.splash/100:1)*(K.rng?1+K.rng*x.skillRad/100:1)*(K.cr?cm:1)*(1+spDot)*(1+pSt*(x.intSt||0)/100)*hitM;skill=cast/cd}
  // ultime (v138) : 1 point de charge par seconde, plus les ennemis abattus (PW.kills par seconde, ULT_KILL chacun, au plus ULT_KMAX par seconde)
  const U=SPELLS[cls].u[kit.u]||SPELLS[cls].u[0],Q=PW.ul[U.k],um=1+(x.ultPct||0)/100,uNeed=Math.max(ULT_MIN,Math.round(ULT_N*(1-(Math.min(50,x.fury||0)+(x.seals&&x.seals.cri?20:0))/100))),T=uNeed*(1-(x.rema||0)/100)/(1+Math.min(ULT_KMAX,ULT_KILL*PW.kills)),bd=1+(x.buffDur||0)/100;
  let ult=0;
  if(Q.c)ult=x.nova*Q.c*(U.k==='blizzard'?bd:1)*(Q.area?sr:1)*(Q.rng?1+Q.rng*x.skillRad/100:1)*(Q.cr?cm:1)*(1+ulDot)*um*hitM*(1+PW.boss*(ULT_GX-1))/T;
  else if(Q.hawk)ult=atk*Q.t*bd*(2*(x.critDmg/100)/cm*um-1)/T;
  else if(Q.x)ult=atk*Q.t*bd*(Q.x*um-1)/T;
  else if(Q.sur)ult=(atk*(2*um-1)+(cast?cast*um/.5-skill:0))*Q.t*bd/T;
  const pulse=x.abPulse?x.dmg*x.abPulse/100*PW.pulseT*(1+x.skillRad/200)/5:0;
  // familier : corbeau (piqué toutes les 1,2 s), golem (épines pendant l'attirance, 4 s sur 11, 3 ennemis) ; il frappe avec tes dégâts et tes dégâts critiques
  // v143 : Écho élémentaire (statuts de l'arme à 50 % de leur chance), Instinct (une action de plus à chaque esquive, au plus toutes les 4 à 6 s),
  // Marque du corbeau (tes dégâts × (1 + marque) sur la part de tes coups qui touche une cible marquée)
  const ps=petNow();let pet=0,mk=1;
  if(ps){const pm=ps.mul*(1+ps.pDmg/100),pr=1+ps.pAps/100,pc=1+Math.min(75,5+ps.pCrit)/100*(x.critDmg/100-1),ic=ps.pInst>0?Math.max(petInstCd(ps.pInst),PW.dashT):0,ec=1+(ps.pEcho?spDotM(.5):0);
    if(ps.t==='corbeau'){const n=1+Math.round(ps.pMulti);pet=x.dmg*.6*pm*pc*n*(pr/1.2+(ic?1/ic:0))*hitM*ec;if(ps.pMark>0)mk=1+Math.min(.6,PW.mark*n)*ps.pMark/100}
    else if(ps.t==='golem'){const on=4*(1+ps.pHp/100),off=ic?Math.min(7/pr,ic):7/pr;pet=x.dmg*.3*pm*pc*(1+ps.pThorns/100)*3/.5*on/(on+off)*hitM*ec}}
  const p=(atk+skill+ult+pulse+pet)*buff*mk,b=buff*mk;
  return {p,atk:atk*b,skill:skill*b,ult:ult*b,pulse:pulse*b,pet:pet*b}}
// Familier équipé : celui de la mission en cours, sinon celui du Camp (gardé le temps d'un affichage).
const petNow=()=>(typeof started!=='undefined'&&started&&G&&G.petS)?G.petS:(typeof petStats==='function'?memo('petS',petStats):null);
// Survie apportée par le familier : soin du follet (en PV par seconde, comme la régénération), Flamme protectrice, attirance du golem et Séisme.
function petSurv(x){const ps=petNow();if(!ps)return {hp:0,m:1,hps:0};const ic=ps.pInst>0?Math.max(petInstCd(ps.pInst),PW.dashT):0;
  if(ps.t==='follet')return {hp:x.hp*(ps.pFlame||0)/100*.5,m:1+(ps.pCleanse?.02:0),hps:x.hp*.01*ps.mul*(1+ps.pHeal/100)*1.5+(ic?x.hp*.04*ps.mul*(1+ps.pHeal/100)/ic:0)};
  if(ps.t==='golem'){const on=4*(1+ps.pHp/100),pr=1+ps.pAps/100,off=ic?Math.min(7/pr,ic):7/pr,up=on/(on+off);return {hp:0,m:1+.15*up*(1+ps.pTaunt/100)+.8*(ps.pSeis||0)/(on+off),hps:0}}
  return {hp:0,m:1,hps:0}}
const power=x=>powerOf(x).p;
// Survie (départage) : vie effective, réduction, protections, soins.
const survOf=x=>{const q=petSurv(x);return (x.hp+x.abWard*8+q.hp)/(1-Math.min(60,x.armor)/200)*(1+x.lowArmor*.003+x.potHeal*.001+x.antidote*.001+x.auraSlow*.003+(x.thorns||0)*.002+(x.soif||0)*.01
  +(x.gardA||0)*.012+(x.exFer||0)*.002+(x.peau||0)*.0025+(x.terr||0)*.008+(x.econ||0)*.003+(x.elan||0)*.001)*q.m+(x.regen+q.hps)*15};
// Valeur d'un équipement (gardée le temps d'un affichage) et comparaison : la Puissance d'abord (0,01 % près), puis la survie.
const eqVal=e=>drawCache?memo('ev|'+eqKey(e),()=>eqVal0(e)):eqVal0(e);
function eqVal0(e){const x=stats(e);return {p:power(x),v:survOf(x)}}
const eqGt=(a,b)=>a.p>b.p*(1+1e-4)+1e-9||(a.p>=b.p*(1-1e-4)&&a.v>b.v*(1+1e-4)+1e-9);
// Ancien nom gardé pour les outils (banc de progression) : la Puissance.
const itemScore=e=>eqVal(e).p;
// Meilleur équipement : pour chaque emplacement, l'objet qui donne la plus haute Puissance (puis la meilleure survie).
// wpn (au Camp) : compare aussi les armes possédées du héros, chacune avec ses propres mods et sa maîtrise.
function bestPlan(e,pool,wpn){if(drawCache&&pool===meta.stash)return memo('bp|'+eqKey(e)+'|'+!!wpn,()=>bestPlan0(e,pool,wpn));return bestPlan0(e,pool,wpn)}
function bestPlan0(e,pool,wpn){const cur={...e},pick={};
  for(let pass=0;pass<2;pass++)for(const sl of Object.keys(e).filter(k=>k!=='arme')){let best=cur[sl],bs=eqVal(cur);
    for(const it of pool){if(it.slot!==keySlot(sl)||Object.values(cur).includes(it)&&cur[sl]!==it||Object.values(pick).includes(it)&&pick[sl]!==it)continue;const sc=eqVal({...cur,[sl]:it});if(eqGt(sc,bs)){bs=sc;best=it}}
    if(best!==cur[sl]){cur[sl]=best;pick[sl]=best}}
  if(wpn&&!started){const c=heroCls,bw=bestWeapon(cur);if(bw)pick.arme=weaponItem(c,bw)}
  return pick}
// Valeur avec une autre arme du héros : ses mods et sa maîtrise à elle (meta.wpn changé le temps du calcul).
function withWeapon(e,id,f){const c=heroCls,w0=meta.wpn[c];try{meta.wpn[c]=id;return f({...e,arme:weaponItem(c,id)})}finally{meta.wpn[c]=w0}}
function bestWeapon(e){const c=heroCls,now=curWid(c);let bs=eqVal(e),bw=null;
  for(const w of WPN[c])if(w.id!==now&&ownedW(w.id)){const sc=withWeapon(e,w.id,eqVal0);if(eqGt(sc,bs)){bs=sc;bw=w.id}}
  return bw}
/* ---------- Pause ---------- */
let runSel=null;
function openBag(){if(G.over)return;paused=true;resetJoy();$('bag').hidden=false;runSel=null;modSel=null;quitAsk=false;G.fresh=0;$('bag').querySelectorAll('details[data-more]').forEach(d=>d.open=!!(typeof moreOpen!=='undefined'&&moreOpen[d.dataset.more]));$('rendTxt').textContent=PX?'Rendu WebGL (PixiJS)':'Rendu standard';$('rendBtn').textContent=PX?'Passer au rendu standard':'Essayer WebGL';drawBag()}
function closeBag(){$('bag').hidden=true;paused=false;quitAsk=false;last=performance.now()}
/* ---------- Pause › Retour au Camp : abandonne la mission ----------
   Tout ce qui a été trouvé dans ce niveau est perdu (objets, reliques, armes, or, expérience) ; les reliques équipées ne sont pas consommées.
   En coopération : un invité quitte la mission (les autres continuent) ; l'hôte l'arrête pour tous, les invités gardent leur butin. */
let quitAsk=false;
function abandonRun(){if(!G||G.over)return;
  if(NET.on){if(NET.guest)netSend({t:'leave'});else if(NET.host)netSend({t:'exit'})}
  G.over=true;G.hold=false;started=false;paused=false;quitAsk=false;resetJoy();
  ['bag','lvlup','extract','over'].forEach(id=>$(id).hidden=true);$('bossBar').hidden=true;$('objBar').hidden=true;
  newGame();$('intro').hidden=false;refreshMenus();refreshCoopUi();campTab='equip';openCamp();
  toast('Mission abandonnée : retour au Camp, le butin du niveau est perdu.')}
// Bouton « Retour au Camp » du pied de la pause (recréé si la page en cache est plus ancienne que les scripts).
{let q=$('quitBtnBag');if(!q){q=document.createElement('button');q.className='cx-btn quitbtn';q.id='quitBtnBag';q.textContent='Retour au Camp';const f=$('bagFoot');f&&f.insertBefore(q,$('closeBag'))}
  q.addEventListener('click',()=>{quitAsk=true;drawBag()})}
$('bagBtn').addEventListener('click',()=>{if(started&&!G.over&&$('extract').hidden&&$('lvlup').hidden)$('bag').hidden?openBag():closeBag()});
$('closeBag').addEventListener('click',closeBag);$('closeBagX').addEventListener('click',closeBag);
$('rendBtn').addEventListener('click',()=>{if(PX){dropPixi('choix du joueur');try{localStorage.setItem('crypte-nogl','1')}catch{}}else{try{localStorage.removeItem('crypte-nogl')}catch{}location.reload()}});
function drawBag(){
  {const rq=G.relic?`${G.react|0} / ${reactNeed()}`:`${(G.opened||[]).length} / ${G.relQ.length}`;
    $('bagSum').innerHTML=`<span><b>${G.level}</b><small>niveau</small></span><span><b class="g">${G.gold}</b><small>or</small></span><span><b>${G.kills|0}</b><small>monstres</small></span><span><b class="r">${G.relQ.length?rq:'—'}</b><small>${G.relic?'réactifs':'reliques'}</small></span>`+(()=>{const b=Math.round(stayBonus()*100);return b?`<em class="bagsum__stay">Bonus de séjour · butin des monstres +${b} %</em>`:''})()}
  $('slots').innerHTML=slotsHtml(G.eq,false);
  $('statgrid').innerHTML=statRows(S);
  $('bagKey').innerHTML=typeof keyStats==='function'?keyStats(S):'';
  $('runUpsTitle').textContent=`Bonus de la partie · héros niveau ${G.hl}`;
  const ru=RUP.filter(u=>G.run[u.k]);
  $('runUps').innerHTML=ru.length?ru.map(u=>`<span style="border-color:${u.c}">${u.n} <b>${G.run[u.k]>=u.max?'max':`${G.run[u.k]} / ${u.max}`}</b></span>`).join(''):'<p class="cx-hint" style="margin:0">Ramasse les cristaux d\'expérience pour monter de niveau et choisir des bonus.</p>';
  const L=G.loot,n=L.items.length;
  $('lootTitle').textContent=`Butin de la partie · ${n+L.relics.length+L.parts.length}`;
  const rplan=n?bestPlan(G.eq,L.items):{},rpn=Object.keys(rplan).length;
  if(runSel&&!L.items.some(i=>i.id===runSel))runSel=null;
  $('runLoot').innerHTML=(n||L.parts.length||L.relics.length)
    ?(rpn?`<button class="cx-btn cx-btn--block" id="bestRun" style="margin:0 0 3px">Équiper le meilleur butin · ${rpn}</button>`:'')+(n?`<div class="grid">${L.items.map(it=>cellHtml(it,'run',runSel===it.id,better(it))).join('')}</div><p class="cx-hint" style="margin:0">▲ : meilleur que ce que tu portes. Ce que tu n'équipes pas part au coffre si tu sors, et se perd si tu meurs.</p>`:'')
      +(L.relics.length?(()=>{const g={};for(const id of L.relics)g[id]=(g[id]||0)+1;return `<ul class="partlist">${Object.keys(g).sort((a,b)=>RELICS[b].t-RELICS[a].t).map(id=>`<li>Relique <b style="color:${RTIER[RELICS[id].t].c}">${relicName(id)}</b>${g[id]>1?` ×${g[id]}`:''}</li>`).join('')}</ul>`})():'')
      +(L.parts.length?`<ul class="partlist">${L.parts.map(p=>`<li>${partLabel(p)}</li>`).join('')}</ul>`:'')
    :'<p class="cx-hint" style="margin:0">Rien pour l\'instant. Les monstres lâchent parfois des équipements et des reliques, les Gardiens toujours.</p>';
  $('runLoot').querySelectorAll('[data-run]').forEach(b=>b.onclick=()=>{const id=+b.dataset.run;runSel=runSel===id?null:id;modSel=null;drawBag()});
  if($('bestRun'))$('bestRun').onclick=()=>{const plan=bestPlan(G.eq,G.loot.items);for(const sl in plan){const it=plan[sl];G.loot.items=G.loot.items.filter(i=>i!==it);wearGear(sl,it);G.eq[sl]=it}saveMeta();refreshStats();runSel=null;toast(`${Object.keys(plan).length} objet${Object.keys(plan).length>1?'s':''} équipé${Object.keys(plan).length>1?'s':''}`);drawBag()};
  if(modTab==='p'&&!petEq())modTab='h';
  {const d=$('bagModsT').closest('details');if(d)d.hidden=!isUnl('mods')}
  $('bagModsT').textContent=`Mods · ${bActive(build('w')).length+bActive(build('h')).length} actifs`;
  renderMods('modsBag');
  // fiche ancrée : objet du butin choisi (prioritaire sur le détail d'un mod)
  if(quitAsk){runSel=null;modSel=null}
  if(runSel){const it=L.items.find(i=>i.id===runSel),cur=G.eq[tgtKey(G.eq,it)];
    $('bagDock').innerHTML=`<div class="cx-dock__head"><h3 class="cx-dock__title" style="color:${RAR[it.r].c}">${esc(itemName(it))}</h3><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-bag="close" aria-label="Fermer le détail"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <span class="cx-dock__meta">${RAR[it.r].n} · ${SLOT[it.slot]} · niveau ${it.lvl}</span>
      ${(()=>{const k='r:'+it.id;if(k!==cmpKey){cmpKey=k;cmpPage=0}return cmpObjet(G.eq,it)})()}<button class="cx-btn cx-btn--primary cx-btn--block" data-bag="equip" data-arg="${it.id}" style="margin-top:4px">Équiper maintenant${cur?` · remplace ${esc(itemName(cur))}`:''}</button><p class="cx-hint" style="margin:0">Un objet équipé est gardé même si tu meurs. L'ancien part au coffre du Camp.</p>`;
    $('bagDock').hidden=false;$('bagFoot').hidden=true}
  else if(quitAsk){const L=G.loot,no=L.items.length+L.parts.length,nr=L.relics.length,pl=(n,w)=>`${n} ${w}${n>1?'s':''}`,lostL=[no?pl(no,'objet'):'',nr?pl(nr,'relique'):'',G.gold?`${G.gold} or`:''].filter(Boolean),lost=lostL.length;
    $('bagDock').innerHTML=`<div class="cx-dock__head"><h3 class="cx-dock__title">Retourner au Camp ?</h3></div>
      <p style="margin:0">Tu abandonnes la mission et tu perds tout ce que tu as accumulé dans ce niveau${lost?` (${lostL.join(', ')})`:''}, ainsi que l'expérience. Tes reliques équipées ne sont pas consommées.</p>
      ${NET.on?`<p class="cx-hint" style="margin:0">${NET.host?'Coopération : la mission s\'arrête pour tout le monde, tes partenaires gardent leur butin.':'Coopération : tes partenaires continuent sans toi ; tu les rejoindras à la prochaine mission.'}</p>`:''}
      <div class="cx-actions" style="margin:0"><button class="cx-btn" data-bag="quitno">Continuer la mission</button><button class="cx-btn cx-btn--danger" data-bag="quitok">Retour au Camp</button></div>`;
    $('bagDock').hidden=false;$('bagFoot').hidden=true}
  else if(!modSel){$('bagDock').hidden=true;$('bagFoot').hidden=false}
}
$('bagDock').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.bag==='quitno'){quitAsk=false;drawBag();return}if(b.dataset.bag==='quitok'){abandonRun();return}
  if(b.dataset.bag==='close'){runSel=null;drawBag()}else if(b.dataset.bag==='equip')equipRun(+b.dataset.arg);else if(b.dataset.act)modAct(b.dataset.act,b.dataset)});
/* ---------- Montée de niveau ---------- */
function gainXp(v){
  // En coopération chacun reçoit l'expérience de tous les monstres, plus nombreux : on la divise d'autant pour garder le rythme du solo.
  G.xp+=v*(1+(S.xpPct||0)/100)/(typeof NET!=='undefined'&&NET.on?coopCnt():1);
  while(G.xp>=xpNeed(G.hl)){G.xp-=xpNeed(G.hl);G.hl++;G.pend++}
  if(G.pend&&$('lvlup').hidden&&!G.over)showLevelUp();
}
let luShown=0;
// v139 : sous l'effet d'un bonus, ce qu'il te donne déjà (rang actuel) → ce qu'il donnera si tu le prends ; le plafond est signalé quand la statistique l'atteint.
function luCum(u,rk){
  if(u.k==='fiole'){const n=G.potions|0,m=potMax();return `<span class="choice__cum"><span class="choice__cumk">Potions</span> ${n} → <span class="choice__cumv">${Math.min(m,n+1)}</span> sur ${m}</span>`}
  const f=RUP_CU[u.k];if(!f||!u.max)return '';const cp=RUP_CAP[u.k];let cap='';
  if(cp){const R=G.run;let s1=null;R[u.k]=rk+1;try{s1=stats(G.eq)}catch{}finally{if(rk)R[u.k]=rk;else delete R[u.k]}if(s1&&s1[cp[0]]>=cp[1])cap=` · plafond ${cp[1]} % atteint`}
  return `<span class="choice__cum"><span class="choice__cumk">Cumul</span> ${f(rk)} → <span class="choice__cumv">${f(rk+1)}</span>${cap}</span>`}
function showLevelUp(){SND.play('lvl');
  paused=true;resetJoy();$('bag').hidden=true;
  const capped={crit:S.crit>=75,cdr:S.cdr>=50,refl:S.dashCd>=60,endu:S.antidote>=60};
  const av=RUP.filter(u=>(!u.cls||u.cls.includes(G.cls))&&(G.run[u.k]||0)<u.max&&!capped[u.k]&&(u.k!=='fiole'||G.potions<potMax())),pool=[...av],out=[];
  while(out.length<3&&pool.length)out.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  for(const f of RUP_FILL)if(out.length<3)out.push(f);
  $('luSub').textContent=`Héros niveau ${G.hl-G.pend+1}`;
  // v130 : cartes verticales (catégorie, nom, effet, rangs) ; la couleur de catégorie reste celle du jeu.
  const CAT={[C_ATK]:'Attaque',[C_DEF]:'Défense',[C_UTI]:'Utilité',[C_ELE]:'Élément'};
  $('choices').innerHTML=out.map((u,i)=>{const rk=G.run[u.k]||0;
    const d=u.k==='purse'?`+${20*G.level} or`:u.d,rkt=u.max?(rk+1>=u.max&&rk?`rang ${rk+1} / ${u.max} · dernier`:rk?`rang ${rk} → ${rk+1} / ${u.max}`:`rang 1 / ${u.max}`):'',cum=luCum(u,rk);
    return `<button class="choice${!rk&&u.max?' is-new':''}${cum?' has-cum':''}" data-k="${u.k}" style="--cc:${u.c||'var(--gold2)'}"><span class="k">${i+1}</span>${CAT[u.c]?`<span class="choice__cat">${CAT[u.c]}</span>`:''}${!rk&&u.max?'<span class="choice__new">Nouveau</span>':''}<b>${u.n}</b><p>${d}</p>${cum}${u.max?`<span class="pips" aria-hidden="true">${Array.from({length:u.max},(_,j)=>`<i class="${j<rk?'on':j===rk?'nx':''}"></i>`).join('')}</span><small${rk+1>=u.max&&rk?' class="last"':''}>${rkt}</small>`:''}</button>`}).join('');
  $('choices').querySelectorAll('.choice').forEach(b=>b.onclick=()=>{if(performance.now()-luShown<350)return;pickUp(b.dataset.k)});
  luShown=performance.now();
  $('lvlup').hidden=false;
}
function pickUp(k){
  if(k==='heal')heal(S.hp*.4);
  else if(k==='purse')G.gold+=20*G.level;
  else if(k==='fiole'){G.run.fiole=(G.run.fiole||0)+1;G.potions=Math.min(potMax(),G.potions+1)}
  else{G.run[k]=(G.run[k]||0)+1;refreshStats();if(k==='hp')heal(S.hp*.15)}
  G.pend--;$('lvlup').hidden=true;
  burst(G.P.x,G.P.y,20,'#9fe3f0',160);
  if(G.pend>0)showLevelUp();else{paused=false;last=performance.now()}
}
function equipRun(id){
  const it=G.loot.items.find(i=>i.id===id);if(!it)return;
  G.loot.items=G.loot.items.filter(i=>i!==it);
  const k=tgtKey(G.eq,it);if(!k){G.loot.items.push(it);toast('Emplacement verrouillé');return}
  const old=meta.gear[k];if(old){meta.stash.push(old)}
  meta.gear[k]=it;G.eq[k]=it;saveMeta();refreshStats();runSel=null;
  toast(`<span style="color:${RAR[it.r].c}">${it.name}</span> équipé`);drawBag();
}
function refreshStats(){if(!G)return;const ratio=G.P.hp/S.hp;S=stats(G.eq);G.P.hp=Math.max(1,Math.min(S.hp,ratio*S.hp))}

/* ---------- Mods (interface) ---------- */
let modSel=null,alSel=null,modTab='h',modPF='all',modSF=null;
const AURA_C='#f0cf4a';
function modDetail(id){
  const m=MODS[id],rk=meta.mods[id],k=modKind(id),isA=k==='a',b=build(bKind(id)),ok=modOk(id,heroCls);
  const slot=isA?(b.aura===id?0:-1):b.load.indexOf(id),eq=slot>=0,u=bUsed(b),cap=bCap(b),fc=fuseCost(id,rk),maxed=rk>=m.max;
  let act='',why='',fuseBlocked=false,costLine;
  const where=k==='w'?`l'arme (${b.name})`:k==='p'?'le familier':'le héros';
  if(isA){
    costLine=`Aura du héros · rapporte +${m.cap+rk} de capacité`;
    act=eq?'<button class="cx-btn" data-act="unequip">Retirer</button>':`<button class="cx-btn cx-btn--primary" data-act="equip">${b.aura?'Remplacer l\'aura':'Équiper l\'aura'}</button>`;
    if(eq&&u>cap-(m.cap+rk)){why='Retirer cette aura ferait dépasser la capacité du héros : les mods en trop deviendraient inactifs.'}
  }else{
    const p=POL[MOD_POL[id]],bs0=bBest(b,id,rk),bs=(modSF!=null&&modSF<b.slots&&!b.load[modSF]&&b.kind===bKind(id))?{i:modSF,d:bDrain(b,id,rk,modSF)}:bs0,fits=bs.i>=0&&u+bs.d<=cap;
    costLine=`Mod ${k==='w'?'d\'arme':k==='p'?'de familier':'de héros'} · <span style="color:${p.c}">${p.s} ${p.n}</span> · `+(eq?`coûte ${bDrain(b,id,rk,slot)} dans la case ${slot+1}`:`coûte ${modDrain(id,rk)}, ${Math.ceil(modDrain(id,rk)/2)} dans une case ${p.n}`);
    if(!ok){why=`Réservé à : ${m.cls.map(x=>CLS[x].n).join(', ')}.`}
    else if(m.pt&&!eq&&(!petEq()||petEq().t!==m.pt)){why=`Ne fonctionne qu'avec le ${PETS[m.pt].n}.`;act=`<button class="cx-btn" data-act="equip" ${!fits?'disabled':''}>Équiper quand même</button>`}
    else if(eq)act='<button class="cx-btn" data-act="unequip">Retirer</button>';
    else{act=`<button class="cx-btn cx-btn--primary" data-act="equip" ${!fits?'disabled':''}>Équiper${bs.i>=0?` · case ${bs.i+1}`:''}</button>`;
      why=bs.i<0?`Toutes les cases de ${where} sont prises. Retire un mod d'abord.`:!fits?`Capacité insuffisante : il faut ${bs.d} points, il en reste ${Math.max(0,cap-u)}.`:''}
    fuseBlocked=eq&&u-bDrain(b,id,rk,slot)+bDrain(b,id,rk+1,slot)>cap;
  }
  const fuse=maxed?'<span class="owned" style="align-self:center;flex:1;text-align:center">Rang max</span>':`<button class="cx-btn cost-btn" data-act="fuse" ${meta.essence<fc||fuseBlocked?'disabled':''}><span>Monter de rang</span>${costHtml([['ess',fc]])}</button>`;
  if(!why&&fuseBlocked&&!maxed)why='Monter ce mod de rang dépasserait la capacité.';
  return `<span class="cx-dock__meta">${MOD_RAR[m.r].n} · ${costLine} · ${m.max?`rang ${rk} / ${m.max}`:'rang unique'}</span>
    <p>${m.t(modVal(id,rk))}${maxed?'':` <span style="color:var(--muted)">· rang ${rk+1} : ${m.t(modVal(id,rk+1))}</span>`}</p>
    <div class="cx-actions">${act}${fuse}</div>${why?`<p class="cx-hint" style="margin:0">${why}</p>`:''}${modCanStar(id)?cxMore('star','Surcharge · '+'★'.repeat(modSt(id))+'☆'.repeat(MOD_ST_MAX-modSt(id))+(meta.modCp[id]?` · ${meta.modCp[id]} copie${meta.modCp[id]>1?'s':''}`:''),starBlock(id,b,k,slot),'Ouvrir'):''}`;
}
const polD=(b,id,i,d0)=>{const p=b.pol[i];return !p?d0:p===MOD_POL[id]?Math.ceil(d0/2):Math.ceil(d0*1.25)};
function starBlock(id,b,k,slot){const m=MODS[id],rk=meta.mods[id],st=modSt(id),cp=meta.modCp[id]|0,maxed=rk>=m.max;
  if(!modCanStar(id))return '';
  const stars=`<span class="stars">${'<i class="on">★</i>'.repeat(st)}${'<i>★</i>'.repeat(MOD_ST_MAX-st)}</span>`;
  const dis=cp?`<button class="btn" data-act="dissolve">Dissoudre ${cp} copie${cp>1?'s':''} · +${cp*8*(m.r+1)} essence</button>`:'';
  if(st>=MOD_ST_MAX)return `<div class="surch"><div class="sh"><b>Surcharge</b>${stars}</div><p class="cx-hint" style="margin:0">Surcharge maximale : +${Math.round(MOD_ST_K*st*100)} % de valeur. Les prochains doublons rapportent de l'essence.</p>${dis?`<div class="actions">${dis}</div>`:''}</div>`;
  const c=starCost(id,st),nd=modDrain(id,rk,st+1)-modDrain(id,rk,st);
  const capOk=k==='a'||slot<0||bUsed(b)-bDrain(b,id,rk,slot)+polD(b,id,slot,modDrain(id,rk,st+1))<=bCap(b);
  const ok=maxed&&cp>=c.cp&&meta.essence>=c.ess&&capOk;
  const why=!maxed?`Monte d'abord ce mod au rang ${m.max}.`:cp<c.cp?`Il faut ${c.cp} copie${c.cp>1?'s':''} de ce mod (tu en as ${cp}). Les doublons trouvés en mission deviennent des copies.`:meta.essence<c.ess?`Il manque ${c.ess-meta.essence} essence.`:!capOk?'La surcharge dépasserait la capacité de ce build.':'';
  return `<div class="surch"><div class="sh"><b>Surcharge</b>${stars}<span class="cx-hint" style="margin:0">${cp} copie${cp>1?'s':''}</span></div>
    <p style="margin:0;font-size:14px">Étoile ${st+1} : <b>${m.t(modVal(id,rk,st+1))}</b>${!maxed?` (au rang ${m.max} : ${m.t(modVal(id,m.max,st+1))})`:''}${nd?` · coût en capacité +${nd}`:''}</p>
    <div class="actions"><button class="btn buy cost-btn" data-act="star" ${ok?'':'disabled'}><span>Surcharger</span>${costHtml([['cp',c.cp,cp],['ess',c.ess]])}</button>${dis}</div>${why?`<p class="empty" style="font-size:13px;margin:0">${why}</p>`:''}</div>`}
function alignPanel(b){
  const cost=bAlignCost(b),mt=b.mast;
  let h=`<h3>Alignement · ${b.kind==='w'?'arme':b.kind==='p'?'familier':'héros'}</h3><p class="empty" style="font-size:13px">Aligne une case sur une polarité : un mod de la même polarité y coûte moitié moins, un autre 25 % de plus. Chaque alignement coûte de l'essence (200, 400, 800 puis 1 600)${b.kind==='p'?'.':` et remet la maîtrise ${b.de} à 0.`}</p>
    <div class="alrow">${b.pol.slice(0,b.slots).map((p,i)=>`<button class="chip" data-act="alslot" data-i="${i}" aria-pressed="${!!alSel&&alSel.i===i}">Case ${i+1} · ${p?`<span style="color:${POL[p].c}">${POL[p].s} ${POL[p].n}</span>`:'neutre'}</button>`).join('')}</div>`;
  if(alSel){const cur=b.pol[alSel.i];
    h+=`<div class="alrow">${Object.keys(POL).map(k=>`<button class="chip" data-act="alpol" data-p="${k}" aria-pressed="${alSel.p===k}" ${cur===k?'disabled':''}><span style="color:${POL[k].c}">${POL[k].s}</span> ${POL[k].n}</button>`).join('')}</div>`;
    if(alSel.p)h+=`<div class="card"><p style="margin:0;font-size:14px">Aligner la case ${alSel.i+1} en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b> pour <b>${cost} essence</b>.${b.kind==='p'?'':` La maîtrise ${b.de} repasse du rang ${mt.r} à 0${mt.r?` : −${mt.r} de capacité jusqu'à ce que tu la regagnes en mission`:''}.`}</p>
      <div class="actions"><button class="btn main cost-btn" data-act="alok" ${meta.essence<cost?'disabled':''}><span>Aligner</span>${costHtml([['ess',cost]])}</button><button class="btn" data-act="alcancel">Annuler</button></div>
      ${meta.essence<cost?`<p class="empty" style="font-size:13px">Il te manque ${cost-meta.essence} essence.</p>`:''}</div>`;
    else h+='<p class="empty" style="font-size:13px">Choisis la polarité de cette case.</p>';
  }
  return h;
}
// Tuile de mod (ModCard du design system) : polarité, coût, nom, losanges de rang.
function modTile(id,cls='',i,b){const m=MODS[id],rk=meta.mods[id],isA=modKind(id)==='a',p=isA?{c:AURA_C,s:'✦',n:'Aura'}:POL[MOD_POL[id]];
  const d=isA?`+${MODS[id].cap+rk}`:(b&&i!==undefined?bDrain(b,id,rk,i):modDrain(id,rk)),st=modSt(id);
  return `<button class="cx-mod${cls}" data-mod="${id}" style="--mc:${MOD_RAR[m.r].c}" aria-label="${m.n}, rang ${rk}, ${isA?'aura':'polarité '+p.n}, coût ${d}"><span class="cx-mod__pol" style="color:${p.c}">${p.s}</span><span class="cx-mod__cost">${d}</span><b>${m.n}</b>${st?`<span class="mst">${'★'.repeat(st)}</span>`:''}${meta.modCp[id]?`<span class="mcp" title="Copies">×${meta.modCp[id]}</span>`:''}<span class="cx-mod__pips">${'<i class="on"></i>'.repeat(rk)}${'<i></i>'.repeat(m.max-rk)}</span></button>`}
function renderMods(rootId){
  const root=$(rootId);if(!root)return;const inCamp=rootId==='modsCamp';
  if(modTab==='h'&&!isUnl('hmods')){modTab='w';modSel=null;modSF=null;alSel=null} // mods du héros : débloqués plus tard
  const b=build(modTab),u=bUsed(b),cap=bCap(b),act=bActive(b),mt=b.mast;
  const owned=Object.keys(MODS).filter(id=>meta.mods[id]!=null);
  if(modSel&&meta.mods[modSel]==null)modSel=null;
  const fits=id=>bKind(id)===modTab,ptOff=id=>MODS[id].pt&&(!petEq()||petEq().t!==MODS[id].pt);
  if(modSel&&!fits(modSel))modSel=null;
  if(modSF!=null&&modSF>=b.slots)modSF=null;
  const pool=owned.filter(id=>fits(id)&&!b.load.includes(id)&&b.aura!==id);
  const sp=modSF!=null?b.pol[modSF]:null,polOf=id=>modKind(id)==='a'?'a':MOD_POL[id];
  const pcount={all:pool.length};for(const id of pool){const q=polOf(id);pcount[q]=(pcount[q]||0)+1}
  let rest=pool.filter(id=>modSF!=null?(polOf(id)!=='a'&&(!sp||polOf(id)===sp)):(modPF==='all'||polOf(id)===modPF));
  rest.sort(modSF!=null?(x,y)=>(modOk(y,heroCls)-modOk(x,heroCls))||bDrain(b,x,meta.mods[x],modSF)-bDrain(b,y,meta.mods[y],modSF)||MODS[y].r-MODS[x].r
    :(x,y)=>(modOk(y,heroCls)-modOk(x,heroCls))||(modKind(y)==='a')-(modKind(x)==='a')||MODS[y].r-MODS[x].r);
  const pchip=(k,lab,c)=>`<button class="cx-chip cx-chip--sm" data-act="polf" data-p="${k}" aria-pressed="${modSF==null&&modPF===k}"${c&&!(modSF==null&&modPF===k)?` style="color:${c}"`:''}>${lab} <span class="n">${pcount[k]||0}</span></button>`;
  const filt=`<div class="cx-chips" role="group" aria-label="Filtrer les mods par polarité">${pchip('all','Tous')}${Object.keys(POL).map(k=>pchip(k,`${POL[k].s} ${POL[k].n}`,POL[k].c)).join('')}${modTab==='h'&&pcount.a?pchip('a','✦ Aura',AURA_C):''}</div>
    ${modSF!=null?`<p class="cx-hint" style="margin:0">Case ${modSF+1} · ${sp?`<b style="color:${POL[sp].c}">${POL[sp].s} ${POL[sp].n}</b> : seuls les mods ${POL[sp].n} (coût divisé par 2)`:'neutre : tous les mods'}, du moins cher au plus cher. <button class="cx-btn cx-btn--ghost cx-btn--sm" data-act="slotf" data-i="${modSF}" style="margin:0">Retirer le filtre</button></p>`:''}`;
  const slotsN=modTab==='h'?HSLOT_MAX:4;
  const slotHtml=i=>{if(i>b.slots)return '';if(i>=b.slots){const nx=i===b.slots;return `<div class="cx-modslot"><span class="cx-modslot__pol" style="cursor:default">Verrouillée</span><div class="cx-mod cx-mod--empty cx-mod--locked"><b>${b.kind==='p'?'Familier ★★★':nx?`${HSLOT_COST[b.slots-3]} fragments`:'—'}</b></div></div>`}
    const id=b.load[i],p=b.pol[i];return `<div class="cx-modslot${modSF===i?' fsel':''}"><button class="cx-modslot__pol" data-act="slotf" data-i="${i}" aria-pressed="${modSF===i}" aria-label="Filtrer les mods pour la case ${i+1} (${p?POL[p].n:'neutre'})" style="color:${p?POL[p].c:'var(--muted)'}">${p?POL[p].s+' '+POL[p].n:'Neutre'}</button>${id?modTile(id,(modSel===id?' is-sel':'')+(act.includes(id)?'':' off'),i,b):'<div class="cx-mod cx-mod--empty"><b>Libre</b></div>'}</div>`};
  const buyBox=modTab==='h'&&b.slots<HSLOT_MAX&&inCamp?(()=>{const c=HSLOT_COST[b.slots-3],have=fragTotal();
    return `<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Case ${b.slots+1} du héros<small>${c} fragments de relique, pris parmi ceux que tu as en plus grand nombre · tu en as ${have}</small></span><button class="cx-btn cx-btn--sm cost-btn" data-act="slotbuy" style="margin:0" ${have<c?'disabled':''}><span>Débloquer</span>${costHtml([['frag',c,have]])}</button></div></div>`})():'';
  const petTab=inCamp&&campTab==='pets',bn=modTab==='h'?`Build ${deCls(heroCls)}`:`Build ${b.de}`;
  // v139 : sans familier équipé, pas de build à remplir (chaque familier a le sien)
  if(petTab&&!petEq()){root.innerHTML=petPanel();root.querySelectorAll('[data-pet]').forEach(x=>x.onclick=()=>petAct(x.dataset.pet,x.dataset.arg));return}
  const over=u>cap;
  const note=inCamp&&meta.modNote&&!petTab?`<div class="cx-card" style="border-color:var(--gold)"><p style="margin:0;font-size:14px">${modNoteTxt().replace(' Voir Héros › Mods.','')} ${meta.modNote.h?'Les mods de héros règlent maintenant tes capacités (sort, esquive, potion, ultime) ; la vie, la réduction et la vitesse brutes viennent des affixes. ':''}${meta.modNote.conv||meta.modNote.ref?'Les mods de dégâts et de cadence bruts sont devenus des affixes d\'objets ; les mods d\'arme posent des statuts (poison, saignement, étourdissement…). ':''}${meta.modNote.p?'Écho élémentaire, Purification et Poches profondes n\'ont qu\'un rang : l\'essence des rangs et des étoiles en plus est rendue.':''}</p><div class="cx-actions" style="margin:0"><button class="cx-btn cx-btn--sm" data-act="modnote" style="margin:0">Compris</button></div></div>`:'';
  root.innerHTML=`${note}${petTab?petPanel():`<div class="cx-tabs" role="tablist"><button class="cx-tab${isUnl('hmods')?'':' is-locked'}" role="tab" data-act="mtab" data-t="h" aria-selected="${modTab==='h'}">${isUnl('hmods')?'':`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>`}Héros · ${CLS[heroCls].n}</button><button class="cx-tab" role="tab" data-act="mtab" data-t="w" aria-selected="${modTab==='w'}">Arme · ${wdef(curWid()).n}</button>${inCamp?'':`<button class="cx-tab" role="tab" data-act="mtab" data-t="p" aria-selected="${modTab==='p'}">Familier</button>`}</div>`}
    <div class="cx-meter${over?' is-over':''}"><div class="cx-meter__top"><span>Capacité</span><b>${u} / ${cap}</b></div><div class="cx-meter__bar"><i style="--v:${Math.min(100,cap?u/cap*100:0)}%"></i></div></div>
    <p class="cx-hint" style="margin:0">${over?'<span style="color:var(--blood-ink)">Capacité dépassée : les mods en trop sont inactifs (grisés). Retire un mod ou regagne de la maîtrise.</span>':b.kind==='p'?`Build propre à ce familier · bonus de niveau +${mt.r} · capacité qui monte avec son rang et son niveau`:`Maîtrise ${b.kind==='w'?'arme':'héros'} ${mt.r} / 10${mt.r<10?` · ${mt.xp} / ${mastNeed(mt.r)}`:''} · gagne de la capacité en mission`}</p>
    ${modTab==='h'?`<div class="aurarow"><div class="cx-modslot"><span class="cx-modslot__pol" style="color:${AURA_C};cursor:default">✦ Aura</span>${b.aura?modTile(b.aura,modSel===b.aura?' is-sel':''):'<div class="cx-mod cx-mod--empty"><b>Aura libre</b></div>'}</div><p class="cx-hint" style="margin:0">Une aura rapporte de la capacité au lieu d'en coûter, et donne un effet permanent.</p></div>`:''}
    <section class="cx-section"><h3 class="cx-section__label">${bn} · ${b.load.slice(0,b.slots).filter(Boolean).length} / ${b.slots} cases</h3><div class="cx-build">${Array.from({length:slotsN},(_,i)=>slotHtml(i)).join('')}</div></section>
    ${buyBox}
    <section class="cx-section"><h3 class="cx-section__label">Tes mods · ${pool.length}</h3>${filt}
    <div class="cx-mods">${rest.map(id=>modTile(id,(modSel===id?' is-sel':'')+(modOk(id,heroCls)&&!ptOff(id)?'':' lock'),modSF!=null&&modKind(id)!=='a'?modSF:undefined,modSF!=null?b:undefined)).join('')||`<p class="cx-hint" style="grid-column:1/-1;margin:0">${pool.length?'Aucun mod pour ce filtre.':`Aucun autre mod ${modTab==='w'?'d\'arme':modTab==='p'?'de familier':'de héros'}.`} Les monstres en laissent parfois tomber, les Gardiens toujours.</p>`}</div></section>
    ${inCamp&&isUnl('align')?cxMore('align_'+b.kind,'Alignement des cases',alignPanel(b),'Ouvrir'):''}`;
  root.querySelectorAll('[data-mod]').forEach(x=>x.onclick=()=>{modSel=modSel===x.dataset.mod?null:x.dataset.mod;runSel=null;modsChanged()});
  root.querySelectorAll('[data-act]').forEach(x=>x.onclick=()=>modAct(x.dataset.act,x.dataset));
  root.querySelectorAll('[data-pet]').forEach(x=>x.onclick=()=>petAct(x.dataset.pet,x.dataset.arg));
  if(!inCamp){const dk=$('bagDock');if(dk){const h=modSel?modDock(modSel):'';dk.innerHTML=h;dk.hidden=!h;if($('bagFoot'))$('bagFoot').hidden=!!h||!!runSel}}
}
// Détail d'un mod, ancré en bas de la feuille (cx-dock).
function modDock(id){const html=modDetail(id);return `<div class="cx-dock__head"><h3 class="cx-dock__title" style="color:${MOD_RAR[MODS[id].r].c}">${MODS[id].n}</h3><button class="cx-icon-btn cx-icon-btn--ghost cx-icon-btn--sm" data-act="mclose" aria-label="Fermer le détail"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>${html}`}
function modAct(a,ds){
  const id=modSel,rk=id?meta.mods[id]:0;
  if(a==='mclose'){modSel=null}
  else if(a==='modnote'){delete meta.modNote}
  else if(a==='mtab'){if(ds.t==='h'&&!isUnl('hmods')){toast(`${UNL_BY.hmods.n} : ${UNL_BY.hmods.need.replace(/^./,c=>c.toLowerCase())}`);return}modTab=ds.t;modSel=null;alSel=null;modSF=null;modPF='all'}
  else if(a==='polf'){modPF=ds.p;modSF=null}
  else if(a==='slotf'){const i=+ds.i;modSF=modSF===i?null:i}
  else if(a==='equip'||a==='unequip'||a==='fuse'){
    const k=modKind(id),b=build(bKind(id));
    if(a==='equip'){if(!modOk(id,heroCls))return;if(k==='a')meta.aura[heroCls]=id;else{let bs=bBest(b,id,rk);if(modSF!=null&&modSF<b.slots&&!b.load[modSF]&&bKind(id)===modTab)bs={i:modSF,d:bDrain(b,id,rk,modSF)};if(bs.i<0||bUsed(b)+bs.d>bCap(b))return;b.load[bs.i]=id}}
    else if(a==='unequip'){if(k==='a'){if(meta.aura[heroCls]===id){meta.aura[heroCls]=null;const hc=heroCls;cxUndo(`${MODS[id].n} retiré`,()=>{meta.aura[hc]=id;modSel=id;modsChanged()})}}else{const i=b.load.indexOf(id);if(i>=0){b.load[i]=null;cxUndo(`${MODS[id].n} retiré de la case ${i+1}`,()=>{if(!b.load[i])b.load[i]=id;modSel=id;modsChanged()})}}}
    else{const c=fuseCost(id,rk);if(meta.essence<c||rk>=MODS[id].max)return;if(k!=='a'){const i=b.load.indexOf(id);if(i>=0&&bUsed(b)-bDrain(b,id,rk,i)+bDrain(b,id,rk+1,i)>bCap(b))return}meta.essence-=c;meta.mods[id]=rk+1}
  }
  else if(a==='star'){const k=modKind(id),b=build(bKind(id)),m=MODS[id],st=modSt(id),c=starCost(id,st);
    if(!modCanStar(id)||rk<m.max||st>=MOD_ST_MAX||(meta.modCp[id]|0)<c.cp||meta.essence<c.ess)return;
    if(k!=='a'){const i=b.load.indexOf(id);if(i>=0&&bUsed(b)-bDrain(b,id,rk,i)+polD(b,id,i,modDrain(id,rk,st+1))>bCap(b))return}
    meta.modCp[id]-=c.cp;meta.essence-=c.ess;meta.modSt[id]=st+1;SND.play('relic');toast(`<b style="color:${MOD_RAR[m.r].c}">${m.n}</b> surchargé : ${'★'.repeat(st+1)}`)}
  else if(a==='dissolve'){const cp=meta.modCp[id]|0;if(!cp)return;meta.essence+=cp*8*(MODS[id].r+1);meta.modCp[id]=0}
  else if(a==='slotbuy'){const b=build('h');if(b.slots>=HSLOT_MAX)return;const c=HSLOT_COST[b.slots-3];if(fragTotal()<c)return;takeFrags(c);meta.hslots[heroCls]=b.slots+1;toast(`Case ${b.slots+1} du héros débloquée`)}
  else if(a==='alslot'){const i=+ds.i;alSel=alSel&&alSel.i===i?null:{i,p:null}}
  else if(a==='alpol'){if(alSel)alSel.p=ds.p}
  else if(a==='alcancel'){alSel=null}
  else if(a==='alok'){const b=build(modTab);if(!alSel||!alSel.p)return;const cost=bAlignCost(b);if(meta.essence<cost)return;
    meta.essence-=cost;b.pol[alSel.i]=alSel.p;b.alignStore[b.key]=(b.alignStore[b.key]||0)+1;if(b.kind!=='p'){b.mast.r=0;b.mast.xp=0}
    toast(`Case ${alSel.i+1} alignée en <b style="color:${POL[alSel.p].c}">${POL[alSel.p].n}</b>. ${b.kind==='p'?'':` Maîtrise ${b.de} remise à 0.`}`);alSel=null}
  saveMeta();modsChanged();
}
/* ---------- Coût d'une action (v134) ----------
   Chaque ressource est nommée et a son icône : « 1 200 or », « 50 essence », « 3 fragments de l'objet », « 12 fragments de harnais »…
   Ce qui manque est en rouge, avec ce que tu as. parts : [[sorte, quantité, ce que tu as (facultatif), précision]]. */
const COST_K={
  or:{i:'<span class="coin"></span>',n:()=>'or',h:()=>meta.gold},
  ess:{i:'<i class="cx-ess"></i>',n:()=>'essence',h:()=>meta.essence},
  frag:{i:'<i class="cost__frag"></i>',n:q=>`fragment${q>1?'s':''} d'objet`,h:()=>fragTotal()},
  pf:{i:'<i class="cost__frag"></i>',n:q=>`fragment${q>1?'s':''} de l'objet`,h:null},
  hf:{i:'<i class="cost__hf"></i>',n:q=>`fragment${q>1?'s':''} de harnais`,h:()=>meta.hfrag|0},
  rel:{i:'<i class="cost__rel"></i>',n:(q,x)=>`relique${q>1?'s':''} ${RTIER[x].n}${q>1?'s':''}`,h:null},
  cp:{i:'<i class="cost__cp"></i>',n:q=>`copie${q>1?'s':''} du mod`,h:null},
  sh:{i:'<i class="cost__sh"></i>',n:q=>`éclat${q>1?'s':''} légendaire${q>1?'s':''}`,h:()=>meta.lshard|0}};
function costHtml(parts){return `<span class="cost">${parts.filter(p=>p&&p[1]>0).map(([k,q,have,x])=>{const K=COST_K[k],h=have!=null?have:K.h?K.h():null,short=h!=null&&h<q;
  return `<span class="cost__p${short?' is-short':''}" title="${short?`il te manque ${fmtBig(q-h)}, tu as ${fmtBig(h)}`:''}">${K.i}<b>${fmtBig(q)}</b> ${K.n(q,x)}</span>`}).join('')}</span>`}
function modsChanged(){if(started&&G&&!G.over){refreshStats();if(G.pet||petEq())G.petS=petStats()}if(!$('bag').hidden)drawBag();if(!$('camp').hidden)drawCamp()}

/* ---------- Fin de niveau, extraction, mort ---------- */
function lootSummary(){
  const L=G.loot,its=L.items.length;
  const byR={};for(const i of L.items)byR[i.r]=(byR[i.r]||0)+1;const byT={};for(const id of L.relics){const t=RELICS[id].t;byT[t]=(byT[t]||0)+1}
  const lc=(c,n,lab)=>`<span class="lc" style="--c:${c}" title="${lab}">${n} ${lab}</span>`;
  return `<div><span>Or ramassé</span><b style="color:var(--r2)">${G.gold}</b></div>
    <div><span>Équipements</span><b>${its?`${its} · `+Object.keys(byR).sort((a,b)=>b-a).map(r=>lc(RAR[r].c,byR[r],RAR[r].n.toLowerCase()+(byR[r]>1?'s':''))).join(''):'0'}</b></div>
    <div><span>Reliques</span><b>${L.relics.length?`${L.relics.length} · `+Object.keys(byT).sort((a,b)=>b-a).map(t=>lc(RTIER[t].c,byT[t],RTIER[t].n)).join(''):'0'}</b></div>
    ${(()=>{const W=L.parts.filter(p=>!p.hf),H=L.parts.length-W.length,b={};for(const p of W){const r=wdef(p.w).r;b[r]=(b[r]||0)+1}
      return (W.length?`<div><span>Armes</span><b>${W.length} · `+Object.keys(b).sort((x,y)=>y-x).map(r=>lc(RAR[r].c,b[r],RAR[r].n.toLowerCase()+(b[r]>1?'s':''))).join('')+`</b></div>`:'')+(H?`<div><span>Fragments de harnais</span><b style="color:var(--rar-aby)">${H}</b></div>`:'')})()}
    ${G.relQ.length?`<div><span>Reliques ouvertes</span><b>${G.opened.length} / ${G.relQ.length}${G.relic?` · ${G.react} / ${reactNeed()} réactifs`:''}</b></div>`:''}${(G.shared||[]).length?`<div><span>Partagées par les partenaires</span><b>${G.shared.length}</b></div>`:''}<div><span>Ennemis abattus</span><b>${G.kills}</b></div><div><span>Temps de survie</span><b>${fmt(G.t)}</b></div>`;
}
function roundDone(){
  objDone();
  if(NET.on){G.hold=true;if(NET.host)netSend({t:'round'})}
  paused=true;resetJoy();$('bag').hidden=true;$('lvlup').hidden=true;
  const nl=G.level+1,unlock=false;
  if(unlock){meta.cp=nl;saveMeta()}
  const r=relicDrop();G.loot.relics.push(r);let extra='';
  if(G.mode==='defense'){const it=genItem(itemLvl(),1);G.loot.items.push(it);extra=` et <span style="color:${RAR[it.r].c}">${it.name}</span>`}
  $('exTitle').textContent=G.mode==='defense'?`Vague ${G.wave} repoussée`:`Niveau ${G.level} terminé`;
  $('exLead').innerHTML=(G.mode==='defense'?'Le cryopode tient. ':'Un portail s\'ouvre. ')+`Récompense de manche : relique <b style="color:${RTIER[RELICS[r].t].c}">${relicName(r)}</b>${extra}. Sors pour tout garder, ou continue : au niveau ${G.level+1}, les monstres seront plus forts.`+(unlock?` Tu peux désormais commencer au niveau ${nl}.`:'')
    +(()=>{const n=Math.round((BAL.stayLoot||0)*100),mx=Math.round((BAL.stayLootMax||0)*100),b=Math.round(stayBonus()*100);if(!n)return '';return `<br><span style="color:#f0cf4a">Bonus de séjour</span> : ${b?`butin des monstres +${b} %. `:''}${b>=mx?(b?'C\'est le maximum.':''):`${b?'E':'e'}n continuant, il grandit de ${n} % par minute, jusqu'à +${mx} %.`}`})()
    +(()=>{const b=tormBoost();if(!b.t||!G.relQ.length)return '';return `<br><span style="color:#ff6a3a">Bonus du Tourment</span> : ${reactNeed()} réactifs par relique au lieu de ${REACT_N}${b.relic?`, reliques +${Math.round(b.relic*100)} %`:''}. Il grandit toutes les 2 minutes passées dans la mission.`})();
  $('exSum').innerHTML=lootSummary();
  $('contBtn').textContent=`Continuer · niveau ${G.level+1}`;
  $('extract').hidden=false;
}
function bank(full){
  const g=full?G.gold:Math.floor(G.gold/2);meta.gold+=g;G.run={};
  // maîtrises du héros et de l'arme, niveau du familier : un point par ennemi abattu
  const gainM=mt=>{if(mt.r<10){mt.xp+=G.kills;while(mt.r<10&&mt.xp>=mastNeed(mt.r)){mt.xp-=mastNeed(mt.r);mt.r++}if(mt.r>=10)mt.xp=0}};
  gainM(mastOf(G.cls));gainM(mstOf(meta.wmast,G.wid));petBank(G.kills);
  if(full){tutWin();
    for(const it of G.loot.items)meta.stash.push(it)
    for(const p of G.loot.parts){if(p.hf)meta.hfrag=(meta.hfrag|0)+1;else if(p.full)gainWeapon(p.w);else if(meta.built[p.w])meta.essence+=6;else{const a=meta.parts[p.w]||(meta.parts[p.w]=[0,0,0]);a[p.p]++}}
    meta.maxL=Math.max(meta.maxL|0,G.level);
    for(const id of G.loot.relics){const a=meta.relics[id]||(meta.relics[id]=[0,0]);a[0]++}
  }
  sealBank(full);saveMeta();return g;
}
function recordBest(){if(G.t>best){best=G.t;try{localStorage.setItem('crypte-best2',String(best))}catch{}}}
/* ---------- Écran de fin de mission (v133), style des maquettes « Résultats » et « Défaite » de la refonte ----------
   Huit compteurs : or, Gardiens vaincus, objectifs réalisés, reliques trouvées, reliques ouvertes, fragments, mods, équipements ;
   puis tous les équipements rapportés (ou perdus), 12 par page. En bas : Au Camp (accueil du jeu) et Rejouer ou Réessayer (même mission). */
const OVR_PAGE=12,OVR={eq:[],pg:0,sel:-1,lost:false};
const ovrNum=n=>Math.round(n||0).toLocaleString('fr-FR');
const ovrDur=t=>{t=Math.max(0,Math.round(t));const m=Math.floor(t/60),s=t%60;return m?`${m} min ${String(s).padStart(2,'0')}`:`${s} s`};
const ovrTag=()=>`${MODES[G.mode]?MODES[G.mode].n:'Mission'} · ${esc(dif().n)} · niveau ${G.level} · ${ovrDur(G.t)}`;
// Équipements de la mission : objets et armes entières, les plus rares d'abord
function ovrEqList(){const L=G.loot,E=[];
  for(const it of L.items){const s=it.slot==='anneau2'?'anneau':it.slot;E.push({r:it.r,ico:GLYPH[s]||GLYPH.armure,n:itemName(it),k:SLOT[it.slot]||'Objet'})}
  for(const p of L.parts){if(p.hf||!p.full)continue;const w=wdef(p.w);if(w)E.push({r:w.r,ico:GLYPH.arme,n:w.n,k:'Arme'})}
  return E.map((e,i)=>({...e,i})).sort((a,b)=>b.r-a.r||a.i-b.i)}
function ovrEqHtml(){const E=OVR.eq,np=Math.max(1,Math.ceil(E.length/OVR_PAGE)),pg=OVR.pg=Math.min(Math.max(0,OVR.pg),np-1),s=E[OVR.sel];
  if(!E.length)return `<p class="ovr__none">${OVR.lost?'Aucun équipement perdu.':'Aucun équipement cette fois.'}</p>`;
  return `<div class="ovr__grid${OVR.lost?' is-lost':''}${np>1?' is-paged':''}">${E.slice(pg*OVR_PAGE,pg*OVR_PAGE+OVR_PAGE).map((e,k)=>{const i=pg*OVR_PAGE+k;
      return `<button class="ovr__slot${i===OVR.sel?' is-sel':''}" data-ovi="${i}" style="--rar:${RARV[e.r]}" aria-label="${esc(e.n)}, ${RAR[e.r].n.toLowerCase()}">${e.ico}</button>`}).join('')}</div>
    <p class="ovr__cap" aria-live="polite">${s?`<b style="color:${RAR[s.r].c}">${esc(s.n)}</b> · ${RAR[s.r].n} · ${s.k}`:'Touche un objet pour voir son nom.'}</p>
    ${np>1?`<div class="ovr__pager"><button class="cx-btn cx-btn--sm" data-ovpg="-1" aria-label="Page précédente"${pg?'':' disabled'}>‹</button><span>Page ${pg+1} / ${np}</span><button class="cx-btn cx-btn--sm" data-ovpg="1" aria-label="Page suivante"${pg<np-1?'':' disabled'}>›</button></div>`:''}`}
function ovrEqDraw(){const e=$('ovrEq');if(e)e.innerHTML=ovrEqHtml()}
$('overBody').addEventListener('click',e=>{const pg=e.target.closest('[data-ovpg]'),it=e.target.closest('[data-ovi]');
  if(pg&&!pg.disabled){OVR.pg+=+pg.dataset.ovpg;OVR.sel=-1;ovrEqDraw();SND.play('ui')}
  else if(it){const i=+it.dataset.ovi;OVR.sel=OVR.sel===i?-1:i;ovrEqDraw()}});
// o : {win, gold, relF (trouvées), relO (ouvertes), relSh (dont partagées), frag, title}
function ovrHtml(o){const k=G.bossK|0,mods=(G.modsGot||[]).length,cap=G.mode==='capture',obj=G.objN|0,E=OVR.eq,W=o.win;
  const tile=(key,v,lab,c,cls)=>`<span class="ovr__tile${cls?' '+cls:''}" data-k="${key}"><b${c?` style="color:${c}"`:''}>${v}</b><small>${lab}</small></span>`;
  const head=W?`<header class="ovr__head"><span class="ovr__rays" aria-hidden="true"></span><i class="ovr__ember" style="left:5%;top:58px"></i><i class="ovr__ember" style="right:7%;top:104px"></i><i class="ovr__ember ovr__ember--s" style="left:66%;top:-20px"></i>
      <span class="ovr__tag">${ovrTag()}</span><h2 class="ovr__title" id="overTitle">${o.title}</h2><span class="ovr__ribbon">Réussie</span></header>`
    :`<header class="ovr__head ovr__head--dead"><span class="ovr__fallen" aria-hidden="true"><canvas id="overHero" width="160" height="160"></canvas></span>
      <h2 class="ovr__title ovr__title--dead" id="overTitle">${o.title}</h2><span class="ovr__tag">${ovrTag()}</span></header>`;
  return head+`<div class="ovr__tiles">
      ${tile('gold','+'+ovrNum(o.gold),W?'or':'or gardé · moitié','var(--gold)')}
      ${tile('boss',ovrNum(k),`Gardien${k>1?'s':''} vaincu${k>1?'s':''}`,'#c79bff')}
      ${tile('obj',ovrNum(obj),cap?`cible${obj>1?'s':''} capturée${obj>1?'s':''}`:`objectif${obj>1?'s':''} réalisé${obj>1?'s':''}`,'#7fe08a')}
      ${tile('relF',ovrNum(o.relF),W?`relique${o.relF>1?'s':''} trouvée${o.relF>1?'s':''}`:`relique${o.relF>1?'s':''} perdue${o.relF>1?'s':''}`,'#ff8a24',W?'':'is-lost')}
      ${tile('relO',ovrNum(o.relO),W?`relique${o.relO>1?'s':''} ouverte${o.relO>1?'s':''}${o.relSh?` · dont ${o.relSh} partagée${o.relSh>1?'s':''}`:''}`:`relique${o.relO>1?'s':''} ouverte${o.relO>1?'s':''}`,'#ff5a7a')}
      ${tile('frag',ovrNum(o.frag),W?`fragment${o.frag>1?'s':''}`:`fragment${o.frag>1?'s':''} perdu${o.frag>1?'s':''}`,'#8fd3e0',W?'':'is-lost')}
      ${tile('mods',ovrNum(mods),`mod${mods>1?'s':''}${W?'':` gardé${mods>1?'s':''}`}`,'#f0cf4a')}
      ${tile('eq',ovrNum(E.length),W?`équipement${E.length>1?'s':''}`:`équipement${E.length>1?'s':''} perdu${E.length>1?'s':''}`,'var(--ink)',W?'':'is-lost')}
    </div>
    <section class="ovr__sec"><h3 class="ovr__lab">${W?'Équipements rapportés':'Équipements perdus'} · ${E.length}</h3><div id="ovrEq">${ovrEqHtml()}</div></section>`}
function overShow(o){const el=$('over'),b=$('overBody');OVR.eq=ovrEqList();OVR.pg=0;OVR.sel=-1;OVR.lost=!o.win;
  el.classList.toggle('is-dead',!o.win);b.innerHTML=ovrHtml(o);b.scrollTop=0;$('againLab').textContent=o.win?'Rejouer':'Réessayer';
  unlockCheck(false);refreshMenus();el.hidden=false;if(!o.win)try{heroPaint($('overHero'),G.cls,-Math.PI/2+1.75,1.1)}catch(err){noteErr('fin de mission',err)}}
// Fragments de la mission : fragments d'armes et de harnais ramassés, et ceux donnés par les reliques ouvertes
const ovrFrag=()=>G.loot.parts.filter(p=>p.hf||!p.full).length;
// Ouvre une relique : un fragment d'un objet de sa rareté (deux si éclatante ; la relique forgée vise son objet).
// Ouvre une relique : fragments de sa rareté pour le héros joué. free : relique partagée par un autre joueur, rien n'est dépensé.
function grantRelic(id,rad,free){
  const a=meta.relics[id],R=RELICS[id];if(!R||(!free&&(!a||a[rad?1:0]<=0)))return null;
  if(!free)a[rad?1:0]--;const n=rad?2:1,got=[];
  for(let i=0;i<n;i++){const pool=R.fz?[R.tgt]:relPool(R.t);if(!pool.length)break;
    // les fragments manquants d'un objet presque complet passent un peu avant
    const w=pool.map(x=>1+fragStatus(x)*.5),tot=w.reduce((p,q)=>p+q,0);let x=Math.random()*tot,k=0;while(x>w[k]&&k<pool.length-1){x-=w[k];k++}
    const bid=pool[k],fi=giveFrag(bid);got.push({bid,fi})}
  relicQFix();
  return {got,html:got.map(g=>{const b=bpdef(g.bid),st=fragStatus(g.bid);return `<b style="color:${RAR[b.r].c}">${esc(b.n)}</b> · fragment ${b.frag[g.fi]} (${st} / 3${st>=3?', prêt à fabriquer':''})`}).join(' et ')}}
function resolveRelic(){
  const S={n:0,sh:0,frag:0};
  const one=(r,free)=>{const g=grantRelic(r.id,r.rad,free);if(!g)return;meta.essence+=25;if(free)S.sh++;else S.n++;S.frag+=g.got.length;eggFromRelic(r.id)};
  for(const r of G.opened)one(r,false);
  for(const r of G.shared||[])one(r,true);
  meta.relOpened=(meta.relOpened|0)+S.n;
  return S;
}
function missionSuccess(){SND.play('win');if(NET.host)netSend({t:'exit'});G.hold=false;
  $('extract').hidden=true;$('lvlup').hidden=true;G.over=true;const relF=G.loot.relics.length,frag0=ovrFrag(),R=resolveRelic(),g=bank(true);recordBest();
  overShow({win:true,title:G.mode==='capture'?'Capture':'Extraction',gold:g,relF,relO:R.n+R.sh,relSh:R.sh,frag:frag0+R.frag});
}
function gameOver(reason){
  if(G.over)return;if(NET.host)netSend({t:'fail'});G.hold=false;SND.play('lose');G.over=true;const g=bank(false);recordBest();
  setTimeout(()=>overShow({win:false,title:reason==='pod'?'Cryopode détruit':'Tu es tombé',gold:g,relF:G.loot.relics.length,relO:G.opened.length,relSh:0,frag:ovrFrag()}),700);
}
$('exitBtn').onclick=()=>{if(NET.guest)return;missionSuccess()};
function contRun(){$('extract').hidden=true;G.level++;G.hold=false;
  if(G.mode==='survie')G.tl=0;else{G.waveState='break';G.waveT=5;G.pod.hp=Math.min(G.pod.max,G.pod.hp+G.pod.max*.3)}
  paused=false;last=performance.now();toast(`<b style="color:var(--ember)">Niveau ${G.level}.</b> Les monstres se renforcent.`)}
$('contBtn').onclick=()=>{if(NET.guest)return;if(NET.host)netSend({t:'cont'});contRun()};

