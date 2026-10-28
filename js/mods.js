// Crypte des Cendres — mods.js : statuts (constantes), mods d'arme et de héros, rangs, étoiles, capacité, conversions v141 et v142. Découpé de data.js en v145.
/* ---------- Mods ---------- */
/* Statuts (v141) : poison (couches), saignement (3 à la fois), étourdir et immobiliser (immunité après), plafonds de chance par coup. */
// BAL.psnPct, BAL.bldPct : réglages d'essai du banc de progression (--bal).
const PSN_PCT=BAL.psnPct||15,PSN_T=4,PSN_MAX=10,BLD_PCT=BAL.bldPct||60,BLD_T=3,BLD_MAX=3,STUN_T=.6,STUN_IMM=1.5,ROOT_T=1.5,ROOT_IMM=2;
const ST_CAP={psnCh:60,bldCh:60,chill:60,shock:40,stunCh:25,rootCh:30,contag:60};
const surtJ=v=>Math.max(1,Math.round(v*10)-1);
const MOD_RAR=[{n:'Bronze',c:'#c98a5a'},{n:'Argent',c:'#cfd8e3'},{n:'Or',c:'#f0cf4a'}];
const MODS={
  /* Mods d'arme (v141) : les statuts posés à l'impact, leur réglage, la frappe ; Or = transformations.
     Rangs 0 à max (comme les autres mods) : valeur (b + v × (rang + 1)) × (1 + 12 % par étoile) ; Venin et Entaille 5 valeurs, les autres 3, Pointe de diamant 1. Les statistiques brutes (dégâts, cadence, critique) sont aux affixes. */
  venin:{n:'Venin',r:0,max:4,drain:3,k:'psnCh',v:8,t:v=>`${v} % de chances d'empoisonner : une couche, ${PSN_PCT} % des dégâts du coup par seconde pendant ${PSN_T} s (${PSN_MAX} couches au plus)`},
  entaille:{n:'Entaille',r:0,max:4,drain:3,k:'bldCh',v:6,t:v=>`${v} % de chances de faire saigner : ${BLD_PCT} % des dégâts du coup en ${BLD_T} s (${BLD_MAX} saignements au plus)`},
  givre:{n:'Morsure du givre',r:0,max:2,drain:3,k:'chill',v:10,t:v=>`${v} % de chances de ralentir 2 s à l'impact`},
  braise:{n:'Braise vive',r:1,max:2,drain:4,k:'burnPct',v:15,t:v=>`Embrase : ${v} % des dégâts par seconde pendant 2,5 s`},
  orage:{n:'Arc électrique',r:1,max:2,drain:4,k:'shock',v:6,t:v=>`${v} % de chances de lancer un éclair en chaîne`},
  coup:{n:'Coup sourd',r:1,max:2,drain:4,k:'stunCh',v:4,t:v=>`${v} % de chances d'étourdir ${fmtN(STUN_T)} s (Gardiens : 3 fois moins)`},
  entrave:{n:'Entrave',r:1,max:2,drain:4,k:'rootCh',v:5,t:v=>`${v} % de chances d'immobiliser ${fmtN(ROOT_T)} s (Gardiens : 2 fois moins)`},
  virulence:{n:'Virulence',r:1,max:2,drain:4,k:'stDur',v:15,t:v=>`+${v} % de durée des statuts posés à l'impact (sauf l'étourdissement)`},
  contagion:{n:'Contagion',r:1,max:2,drain:4,k:'contag',v:10,t:v=>`${v} % de chances qu'un statut posé touche aussi l'ennemi le plus proche`},
  rafale:{n:'Rafale',r:1,max:2,drain:4,k:'echo',v:8,t:v=>`${v} % de chances que l'attaque parte deux fois`},
  oeil:{n:'Œil du chasseur',r:1,max:2,drain:3,k:'critSt',v:6,t:v=>`+${v} % de chances de critique contre un ennemi qui porte un statut`},
  boucherie:{n:'Boucherie',r:1,max:2,drain:3,k:'cdSt',v:25,t:v=>`+${v} % de dégâts critiques contre un ennemi qui porte un statut`},
  embrasement:{n:'Embrasement',r:2,max:2,drain:5,k:'embr',b:60,v:30,t:v=>`Un ennemi qui meurt en brûlant enflamme ceux à moins de ${Math.round(v)} px`},
  peste:{n:'Peste',r:2,max:2,drain:5,k:'peste',b:2,v:1,t:v=>`À ${PSN_MAX} couches, le poison passe aux ennemis proches : ${Math.floor(v)} couches`},
  hemorragie:{n:'Hémorragie',r:2,max:2,drain:5,k:'hemo',v:25,t:v=>`Tes critiques font toujours saigner ; leurs saignements +${v} %`},
  cryogenie:{n:'Cryogénie',r:2,max:2,drain:5,k:'cryo',b:.4,v:.2,t:v=>`Ralentir un ennemi déjà ralenti le gèle ${fmtN(v)} s (Gardiens : ralentis 1 s de plus)`},
  surtension:{n:'Surtension',r:2,max:2,drain:5,k:'surt',b:.1,v:.1,t:v=>`L'éclair en chaîne étourdit ${fmtN(v)} s et touche ${surtJ(v)} ennemi${surtJ(v)>1?'s':''} de plus`},
  catalyse:{n:'Catalyse',r:2,max:2,drain:5,k:'cata',v:10,t:v=>`+${v} % de dégâts contre un ennemi qui porte au moins 2 statuts différents`},
  diamant:{n:'Pointe de diamant',r:2,max:0,drain:5,k:'diam',v:1,cls:['archer'],t:()=>'Un carreau qui transperce pose à coup sûr les statuts de l\'arme sur les ennemis suivants'},
  deflagration:{n:'Déflagration',r:2,max:2,drain:5,k:'defl',b:25,v:25,cls:['magicien'],t:v=>`Les explosions posent les statuts de l'arme à ${v} % de leur chance`},
  soif:{n:'Soif du fer',r:2,max:2,drain:5,k:'soif',v:2,cls:['guerrier'],t:v=>`Tu récupères ${v} % des dégâts de tes saignements en vie`},
  /* Mods de héros (v142) : les capacités (sort, esquive, potion, ultime) ; la vie, la réduction et la vitesse brutes viennent des affixes.
     Rangs 0 à max comme les mods d'arme ; les mods Or montent d'un cran de leur liste (b + v × (rang + 1)). */
  flux:{type:'h',n:'Flux',r:1,max:2,drain:3,k:'flux',v:.2,t:v=>`Chaque ennemi abattu par ton sort retire ${fmtN(v)} s à sa recharge (2 s au plus par lancer)`},
  intensite:{type:'h',n:'Intensité',r:1,max:2,drain:3,k:'intSt',v:20,t:v=>`+${v} % de dégâts du sort contre un ennemi qui porte un statut`},
  etendue:{type:'h',n:'Étendue',r:1,max:4,drain:4,k:'skillRad',v:15,t:v=>`+${v} % de portée des compétences`},
  persist:{type:'h',n:'Persistance',r:1,max:2,drain:4,k:'skillDur',v:12,t:v=>`+${v} % de durée du sort, des ralentissements et des immobilisations`},
  impregnation:{type:'h',n:'Imprégnation',r:2,max:2,drain:5,k:'impr',b:1,v:.5,t:v=>`Les statuts posés par ton sort ont ${fmtN(v)} fois plus de chances (plafonds inchangés)`},
  commotion:{type:'h',n:'Commotion',r:2,max:2,drain:5,k:'comm',b:.2,v:.2,t:v=>`Ton sort étourdit ${fmtN(v)} s (Gardiens : 3 fois moins)`},
  garde:{type:'h',n:'Garde arcanique',r:2,max:2,drain:5,k:'gardA',b:4,v:4,t:v=>`Lancer ton sort donne un bouclier de ${v} % de ta vie pendant 4 s (boucliers à 50 % de ta vie au plus)`},
  fantome:{type:'h',n:'Pas fantôme',r:1,max:2,drain:3,k:'dashCd',v:10,t:v=>`−${v} % de recharge de l'esquive`},
  elan:{type:'h',n:'Élan',r:0,max:4,drain:2,k:'elan',v:8,t:v=>`+${v} % de vitesse pendant 2 s après une esquive`},
  peau:{type:'h',n:'Seconde peau',r:0,max:4,drain:2,k:'peau',v:8,t:v=>`−${v} % de dégâts subis pendant 1,5 s après une esquive`},
  paselem:{type:'h',n:'Pas élémentaire',r:2,max:2,drain:5,k:'pasEl',b:25,v:25,t:v=>`L'esquive pose les statuts de ton arme sur les ennemis traversés, à ${v} % de leur chance`},
  riposte:{type:'h',n:'Riposte',r:2,max:2,drain:5,k:'ripo',b:.3,v:.2,t:v=>`Après une esquive, ton coup suivant étourdit ${fmtN(v)} s`},
  alchimiste:{type:'h',n:'Alchimiste',r:0,max:2,drain:2,k:'potHeal',v:15,t:v=>`+${v} % de soin des potions`},
  econome:{type:'h',n:'Économe',r:1,max:2,drain:3,k:'econ',v:10,t:v=>`${v} % de chances que la potion ne soit pas consommée`},
  elixfer:{type:'h',n:'Élixir de fer',r:2,max:2,drain:5,k:'exFer',b:10,v:10,t:v=>`Boire réduit les dégâts subis de ${v} % pendant 4 s`},
  elixrage:{type:'h',n:'Élixir de rage',r:2,max:2,drain:5,k:'exRage',b:1.5,v:3.5,t:v=>`Boire charge l'ultime de ${Math.floor(v)} points (sur ${ULT_N})`},
  ame:{type:'h',n:'Âme ardente',r:1,max:2,drain:3,k:'fury',v:5,t:v=>`L'ultime se recharge ${v} % plus vite`},
  prolong:{type:'h',n:'Prolongement',r:1,max:2,drain:4,k:'buffDur',v:10,t:v=>`+${v} % de durée des renforts (Œil du faucon, Fureur du berserker, Surcharge, Rempart) et du Blizzard`},
  remanence:{type:'h',n:'Rémanence',r:2,max:2,drain:6,k:'rema',b:5,v:10,t:v=>`Quand tu lances l'ultime, ${v} % de sa jauge revient aussitôt`},
  fleau:{type:'h',n:'Fléau',r:2,max:2,drain:5,k:'flea',b:1,v:.5,t:v=>`Les statuts posés par l'ultime ont ${fmtN(v)} fois plus de chances (plafonds inchangés)`},
  presence:{type:'a',n:'Présence glaciale',r:2,max:2,drain:0,cap:4,k:'auraSlow',v:8,t:v=>`Ennemis à moins de 180 px ralentis de ${v} %`},
  terreur:{type:'a',n:'Terreur',r:2,max:2,drain:0,cap:4,k:'terr',v:5,t:v=>`Ennemis à moins de 180 px : ${v} % de dégâts en moins contre toi`},
  cupidite:{type:'a',n:'Cupidité',r:1,max:2,drain:0,cap:4,k:'goldPct',v:10,t:v=>`+${v} % d'or ramassé`},
};
/* Surcharge des mods : au rang max, des copies du même mod + de l'essence ajoutent des étoiles (5 max), +12 % de la valeur chacune. */
const MOD_ST_MAX=5,MOD_ST_K=.12;
const modSt=id=>(meta.modSt&&meta.modSt[id])|0;
const modCanStar=id=>!['pierce','diam','impr','rema','flea','pCleanse','pPocket','pEcho'].includes(MODS[id].k);
const starCost=(id,st)=>({cp:Math.ceil((st+1)*BAL.starCopies),ess:50*(MODS[id].r+1)*(st+1)});
const modVal=(id,rk,st=modSt(id))=>{const m=MODS[id],x=((m.b||0)+m.v*(rk+1))*(1+MOD_ST_K*st);return x>=10?Math.round(x):x>=1?+x.toFixed(1):+x.toFixed(2)};
const modDrain=(id,rk,st=modSt(id))=>MODS[id].drain+rk+Math.floor(st/2);
const fuseCost=(id,rk)=>10*Math.pow(2,rk)*(MODS[id].r+1);
const POL={b:{n:'Braise',c:'#e8853b',s:'▲'},r:{n:'Rempart',c:'#5fbf7a',s:'■'},s:{n:'Spirale',c:'#b9a6f0',s:'◆'}};
// BAL.modV : réglages d'essai du banc de progression (--bal '{"modV":{"venin":{"v":10}}}'), valeurs d'un mod remplacées.
if(BAL.modV)for(const k in BAL.modV)if(MODS[k])Object.assign(MODS[k],BAL.modV[k]);
const MOD_POL={venin:'s',entaille:'b',givre:'s',braise:'b',orage:'s',coup:'r',entrave:'r',virulence:'s',contagion:'s',rafale:'b',oeil:'b',boucherie:'b',embrasement:'b',peste:'s',hemorragie:'b',cryogenie:'s',surtension:'s',catalyse:'s',diamant:'b',deflagration:'s',soif:'r',
  flux:'s',intensite:'s',etendue:'s',persist:'s',impregnation:'s',commotion:'r',garde:'r',fantome:'r',elan:'b',peau:'r',paselem:'s',riposte:'r',alchimiste:'r',econome:'r',elixfer:'r',elixrage:'b',ame:'b',prolong:'s',remanence:'b',fleau:'s'};
const mastOf=c=>(meta.mast[c]||(meta.mast[c]={r:0,xp:0}));
const mastNeed=r=>100*(r+1);
const deCls=c=>c==='archer'?"de l'Archer":`du ${CLS[c].n}`;
const modOk=(id,c)=>!MODS[id].cls||MODS[id].cls.includes(c);
const modKind=id=>MODS[id].type||'w',bKind=id=>{const k=modKind(id);return k==='w'||k==='p'?k:'h'};
const curWid=(c=heroCls)=>meta.wpn[c]&&ownedW(meta.wpn[c])?meta.wpn[c]:WPN[c][0].id;
const arrOf=(o,k,n)=>{let a=o[k];if(!a)a=o[k]=Array(n).fill(null);while(a.length<n)a.push(null);return a};
const mstOf=(o,k)=>o[k]||(o[k]={r:0,xp:0});
const deW=n=>/^[aeiouyéèêâîôh]/i.test(n)&&!/^h/i.test(n)?`de l'${n}`:`de ${n}`;
const HSLOT_MAX=6,HSLOT_COST=[15,30,50];
const auraCap=id=>id&&meta.mods[id]!=null?MODS[id].cap+meta.mods[id]:0;
function build(kind,c=heroCls){
  if(kind==='p')return petBuild();
  if(kind==='w'){const wid=curWid(c);return {kind,key:wid,load:arrOf(meta.wload,wid,4),pol:arrOf(meta.wpol,wid,4),mast:mstOf(meta.wmast,wid),slots:4,alignStore:meta.walign,cap0:10+lv('cat')*3,name:wdef(wid).n,de:deW(wdef(wid).n)}}
  const au=meta.aura[c]||null;
  return {kind:'h',key:c,load:arrOf(meta.hload,c,HSLOT_MAX),pol:arrOf(meta.pol,c,HSLOT_MAX),mast:mastOf(c),slots:meta.hslots[c]||3,alignStore:meta.align,cap0:10+lv('rea')*3+auraCap(au),name:CLS[c].n,de:deCls(c),aura:au};
}
const bCap=b=>b.cap0+b.mast.r;
const bDrain=(b,id,rk,i)=>{const base=modDrain(id,rk),p=b.pol[i];return !p?base:p===MOD_POL[id]?Math.ceil(base/2):Math.ceil(base*1.25)};
const bUsed=b=>b.load.slice(0,b.slots).reduce((a,id,i)=>a+(id&&meta.mods[id]!=null?bDrain(b,id,meta.mods[id],i):0),0);
function bActive(b,c=heroCls){const out=[];let u=0;const cap=bCap(b);b.load.slice(0,b.slots).forEach((id,i)=>{if(!id||meta.mods[id]==null||!modOk(id,c))return;const d=bDrain(b,id,meta.mods[id],i);if(u+d<=cap){u+=d;out.push(id)}});return out}
function bBest(b,id,rk){let best=-1,bd=1e9;for(let i=0;i<b.slots;i++){if(b.load[i])continue;const d=bDrain(b,id,rk,i);if(d<bd){bd=d;best=i}}return {i:best,d:bd}}
const bAlignCost=b=>200*Math.pow(2,Math.min(3,b.alignStore[b.key]||0));
const fragTotal=()=>Object.values(meta.parts).reduce((a,p)=>a+p.reduce((x,y)=>x+y,0),0);
function takeFrags(n){while(n>0){let bk=null,bi=0,bv=0;for(const k in meta.parts)meta.parts[k].forEach((v,i)=>{if(v>bv){bv=v;bk=k;bi=i}});if(!bk)return false;meta.parts[bk][bi]--;n--}return true}
function allMods(c=heroCls){const out=[...bActive(build('w',c),c),...bActive(build('h',c),c)];const au=meta.aura[c];if(au&&meta.mods[au]!=null)out.push(au);return out}
if(!meta.v4){
  for(const c of Object.keys(CLS)){const old=(meta.load&&meta.load[c])||[],wid=curWid(c),wl=arrOf(meta.wload,wid,4),hl=arrOf(meta.hload,c,HSLOT_MAX);let hi=0;
    old.forEach((id,i)=>{if(!id||!MODS[id])return;if(modKind(id)==='w')wl[i]=id;else if(hi<3)hl[hi++]=id});
    meta.wpol[wid]=meta.pol[c]?meta.pol[c].slice(0,4):[null,null,null,null];meta.walign[wid]=meta.align[c]||0;
    if(meta.mast[c])meta.wmast[wid]={r:meta.mast[c].r,xp:meta.mast[c].xp};
    meta.pol[c]=Array(HSLOT_MAX).fill(null);meta.align[c]=0}
  meta.v4=1;saveMeta();
}
/* v141 : mods d'arme refaits. Chaque ancien mod devient son équivalent (rang, étoiles, copies gardés ; un rang au-delà du nouveau maximum est
   remboursé) ; Férocité, Cadence et Allonge (statistiques des affixes) sont remboursés : toute l'essence de leurs rangs et de leurs étoiles,
   plus 8 × (rareté + 1) par copie. meta.modNote : résumé montré une fois au Camp. */
if((meta.modV|0)<1){
  const OLDR={ferocite:0,cadence:0,allonge:0,deflagration:0,dedoublement:2,sangsue:1,diamant:1,orage:2,givre:0,braise:1,oeil:1,boucherie:1};
  const REN={dedoublement:'rafale',sangsue:'soif'},REF=['ferocite','cadence','allonge'];
  const rankEss=(r,from,to)=>{let e=0;for(let i=from;i<to;i++)e+=10*Math.pow(2,i)*(r+1);return e};
  const starEss=(r,st)=>{let e=0;for(let i=0;i<st;i++)e+=50*(r+1)*(i+1);return e};
  const swap=(L,a,b)=>{if(L)for(let i=0;i<L.length;i++)if(L[i]===a)L[i]=b};
  const everyLoad=f=>{for(const k in meta.wload)f(meta.wload[k]);for(const c in (meta.sets||{}))for(const st of meta.sets[c]||[])if(st&&st.wm)f(st.wm)};
  let conv=0,ref=0,ess=0;
  for(const id of REF)if(meta.mods[id]!=null){const r=OLDR[id];ess+=rankEss(r,0,meta.mods[id]|0)+starEss(r,meta.modSt[id]|0)+(meta.modCp[id]|0)*8*(r+1);
    delete meta.mods[id];delete meta.modSt[id];delete meta.modCp[id];everyLoad(L=>swap(L,id,null));ref++}
  for(const [o,n] of Object.entries(REN))if(meta.mods[o]!=null){const rk=meta.mods[o]|0,mx=MODS[n].max;ess+=rankEss(OLDR[o],mx,rk);
    meta.mods[n]=Math.min(rk,mx);if(meta.modSt[o])meta.modSt[n]=meta.modSt[o];if(meta.modCp[o])meta.modCp[n]=meta.modCp[o];
    delete meta.mods[o];delete meta.modSt[o];delete meta.modCp[o];everyLoad(L=>swap(L,o,n));conv++}
  for(const id of ['givre','braise','oeil','boucherie','orage','diamant','deflagration'])if(meta.mods[id]!=null){const mx=MODS[id].max,rk=meta.mods[id]|0;
    if(rk>mx){ess+=rankEss(OLDR[id],mx,rk);meta.mods[id]=mx}if(!modCanStar(id)&&meta.modSt[id]){ess+=starEss(OLDR[id],meta.modSt[id]);delete meta.modSt[id]}conv++}
  // un ancien joueur reçoit aussi Venin (rang 0), le mod de départ des nouveaux joueurs, pour poser tout de suite un statut
  let ven=0;if((conv||ref)&&meta.mods.venin==null){meta.mods.venin=0;ven=1}
  if(conv||ref){meta.essence=(meta.essence|0)+ess;meta.modNote={conv,ref,ess,ven}}
  meta.modV=1;saveMeta()}
/* v142 : mods de héros refaits. Intensité, Flux, Étendue, Persistance, Pas fantôme, Alchimiste et les auras Présence glaciale et Cupidité
   gardent leur nom (rang ramené au nouveau maximum, l'excédent remboursé) ; Ferveur devient Terreur ; les 8 mods de survie brute
   (Vitalité, Égide, Pas léger, Second souffle, Rapace, Dernier rempart, Rage du survivant, Antidote) sont remboursés comme en v141.
   Le message de conversion s'ajoute à celui de la v141 s'il n'a pas encore été lu. */
if((meta.modV|0)<2){
  const OLDR={vitalite:0,egide:0,pas:0,souffle:0,rapace:0,dernier:1,survivant:2,antidote:0,intensite:0,flux:1,etendue:1,persist:1,fantome:1,alchimiste:0,presence:2,cupidite:1,ferveur:2};
  const REF=['vitalite','egide','pas','souffle','rapace','dernier','survivant','antidote'],REN={ferveur:'terreur'},KEEP=['intensite','flux','etendue','persist','fantome','alchimiste','presence','cupidite'];
  const rankEss=(r,from,to)=>{let e=0;for(let i=from;i<to;i++)e+=10*Math.pow(2,i)*(r+1);return e};
  const starEss=(r,st)=>{let e=0;for(let i=0;i<st;i++)e+=50*(r+1)*(i+1);return e};
  const swap=(L,a,b)=>{if(L)for(let i=0;i<L.length;i++)if(L[i]===a)L[i]=b};
  const everyLoad=f=>{for(const k in meta.hload)f(meta.hload[k]);for(const c in (meta.sets||{}))for(const st of meta.sets[c]||[])if(st&&st.hm)f(st.hm)};
  const auraSwap=(a,b)=>{for(const c in meta.aura)if(meta.aura[c]===a)meta.aura[c]=b;for(const c in (meta.sets||{}))for(const st of meta.sets[c]||[])if(st&&st.au===a)st.au=b};
  let conv=0,ref=0,ess=0;
  for(const id of REF)if(meta.mods[id]!=null){const r=OLDR[id];ess+=rankEss(r,0,meta.mods[id]|0)+starEss(r,meta.modSt[id]|0)+(meta.modCp[id]|0)*8*(r+1);
    delete meta.mods[id];delete meta.modSt[id];delete meta.modCp[id];everyLoad(L=>swap(L,id,null));ref++}
  for(const [o,n] of Object.entries(REN))if(meta.mods[o]!=null){const rk=meta.mods[o]|0,mx=MODS[n].max;ess+=rankEss(OLDR[o],mx,rk);
    meta.mods[n]=Math.min(rk,mx);if(meta.modSt[o])meta.modSt[n]=meta.modSt[o];if(meta.modCp[o])meta.modCp[n]=meta.modCp[o];
    delete meta.mods[o];delete meta.modSt[o];delete meta.modCp[o];auraSwap(o,n);conv++}
  for(const id of KEEP)if(meta.mods[id]!=null){const mx=MODS[id].max,rk=meta.mods[id]|0;if(rk>mx){ess+=rankEss(OLDR[id],mx,rk);meta.mods[id]=mx}conv++}
  // un ancien mod d'aura retiré ne reste pas équipé
  for(const c in meta.aura)if(meta.aura[c]&&!MODS[meta.aura[c]])meta.aura[c]=null;
  if(conv||ref){meta.essence=(meta.essence|0)+ess;const n=meta.modNote||{conv:0,ref:0,ess:0};meta.modNote={...n,conv:(n.conv|0)+conv,ref:(n.ref|0)+ref,ess:(n.ess|0)+ess,h:1}}
  meta.modV=2;saveMeta()}
function rollMod(boss){const x=Math.random()*100,r=x<(boss?30:8)?2:x<(boss?75:38)?1:0;return pick(Object.keys(MODS).filter(id=>MODS[id].r===r&&modOk(id,heroCls)))}

