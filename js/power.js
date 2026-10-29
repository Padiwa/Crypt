// Crypte des Cendres — power.js : Puissance et survie (powerOf, survOf), « Équiper le meilleur ». Découpé de ui.js en v145.
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
  const dotR=(rP+rB)*dotM,stTg=cls==='magicien'?(1+(tg-1)*Math.min(1,(x.defl||0)/100))/tg:1;
  // poison et saignement d'un coup de sort ou d'ultime ; Imprégnation et Fléau (v142) multiplient la chance, plafonds gardés
  const spDotM=k=>(Math.min(.6,cP*k)*PSN_PCT/100*PSN_T*dm+Math.min(.6,cB*k)*BLD_PCT/100*dm)*dotM,spDot=spDotM(x.impr||1),ulDot=spDotM(x.flea||1);
  // chaque coup : bonus conditionnels (part des coups concernés), éléments, pouvoirs abyssaux, Catalyse, Brise-garde
  // v146 : bonus sous condition additionnés et plafonnés à COND_CAP, comme dans dmgEnemy
  const cond=PW.low*x.lowDmg/100+PW.exec*x.execute/100+PW.boss*x.bossDmg/100+PW.hunt*x.abHunt/100+.06*x.abSoul+sl*x.cold/100+cu*(.15+(x.hex||0)/100)+p2*(x.cata||0)/100+ctl*(x.ccDmg||0)/100;
  const hitM=(1+Math.min(COND_CAP/100,cond))*(1+.015*x.abExec)*(1+PW.shock*x.shock/100*(x.surt?(3+surtJ(x.surt))/3:1))*(1+cr*x.abRift/100*2.1)*(1+PW.shard*x.shard/100)*(1+cu*PW.doom*(x.doom||0)/100);
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
