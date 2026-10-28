// Crypte des Cendres — equip.js : migrations v91 et v139, équipement par héros (v106), équipements enregistrés. Découpé de data.js en v145.
/* ---------- Migration v91 : rangs, reliques par rareté, fin des objets Prime ---------- */
if(!meta.v5){
  const oldInv=n=>{let c=0;for(let i=0;i<(n||0);i++)c+=5+3*i+Math.floor(i*i/10);return c},rk=n=>Math.min(9,Math.floor((n||0)/11));let ess=0;
  const fixIt=it=>{if(!it)return it;if(it.type==='Prime'){ess+=40*(it.r+1)+Math.floor(oldInv(it.up)/2);return null}
    if(it.up){ess+=Math.floor(oldInv(it.up)/2);it.up=rk(it.up)}
    if(it.sang&&!it.rid)it.rid='S'+it.sang.slice(1);if(it.aby&&!it.rid)it.rid='B'+it.aby.slice(1);return it};
  meta.stash=(meta.stash||[]).map(fixIt).filter(Boolean);for(const k in meta.gear)meta.gear[k]=fixIt(meta.gear[k]);
  for(const id in (meta.wlv||{})){ess+=Math.floor(oldInv(meta.wlv[id])/2);meta.wlv[id]=rk(meta.wlv[id])}
  const ok=new Set(craftIds());for(const id in (meta.parts||{}))if(!ok.has(id)){ess+=10*(meta.parts[id]||[]).reduce((a,b)=>a+(b|0),0);delete meta.parts[id]}
  const map=id=>RELICS[id]?id:/^F_/.test(id)?'ab':/^(l|m|fA|fB)/.test(id)?'os':/^(n|fC)/.test(id)?'sa':'ab';
  const nr={};for(const id in (meta.relics||{})){const a=meta.relics[id]||[0,0],n=map(id),b=nr[n]||(nr[n]=[0,0]);b[0]+=a[0]|0;b[1]+=a[1]|0}meta.relics=nr;
  meta.relicQ=(meta.relicQ||[]).map(q=>({id:map(q.id),rad:!!q.rad}));
  meta.essence=(meta.essence|0)+ess;meta.maxL=Math.max(meta.maxL|0,meta.start|0,meta.cp|0,1);meta.wcp=meta.wcp||{};meta.v5=1;saveMeta();
}
meta.wcp=meta.wcp||{};meta.slotU=meta.slotU||{};meta.hfrag=meta.hfrag|0;
// v139 : emplacements par héros. Une sauvegarde d'avant ({anneau2, dos} pour tous) les garde ouverts pour chaque héros.
if(SLOT_U.some(u=>u.k in meta.slotU)){const o=meta.slotU,n={};for(const c in CLS){n[c]={};for(const u of SLOT_U)if(o[u.k])n[c][u.k]=true}meta.slotU=n;saveMeta()}
for(const c in CLS)if(!meta.slotU[c]||typeof meta.slotU[c]!=='object')meta.slotU[c]={};
/* ---------- v106 : chaque héros a son équipement ----------
   meta.gearBy[classe] = ses emplacements ; meta.gear désigne toujours celui du héros choisi (propriété calculée, non sauvegardée).
   Une ancienne sauvegarde donne son équipement au dernier héros joué. Un objet n'est porté que par un héros à la fois. */
const curCls=()=>{try{if(typeof heroCls!=='undefined'&&CLS[heroCls])return heroCls}catch{}let c=null;try{c=localStorage.getItem('crypte-cls')}catch{}return CLS[c]?c:'archer'};
function defGear(m){
  if(!m.gearBy){const d=Object.getOwnPropertyDescriptor(m,'gear'),old=d&&'value' in d?d.value:null;m.gearBy={[curCls()]:old||{}}}
  for(const c in CLS)m.gearBy[c]=m.gearBy[c]||{};
  delete m.gear;
  Object.defineProperty(m,'gear',{get(){return m.gearBy[curCls()]},set(v){m.gearBy[curCls()]=v||{}},enumerable:false,configurable:true});
  m.sets=m.sets||{};
}
defGear(meta);
// Qui porte cet objet (classe), à quel emplacement ; tous les objets portés, tous héros confondus.
const wornBy=it=>{if(!it)return null;if(it.wid){const c=wclsOfD(it.wid);return c&&curWid(c)===it.wid?c:null}for(const c in CLS){const g=meta.gearBy[c];for(const k in g)if(g[k]===it)return c}return null};
const wornSlot=(it,c)=>{const g=meta.gearBy[c]||{};for(const k in g)if(g[k]===it)return k;return null};
const allWorn=()=>Object.keys(CLS).flatMap(c=>Object.values(meta.gearBy[c]||{}).filter(Boolean));
// « par l'Archer », « par le Guerrier »…
const parCls=c=>/^[AEIOUÉ]/.test(CLS[c].n)?`par l'${CLS[c].n}`:`par le ${CLS[c].n}`;
const pourCls=c=>parCls(c).replace(/^par /,'pour ');
const findItem=id=>meta.stash.find(i=>i.id===id)||allWorn().find(i=>i.id===id)||null;
// Retire l'objet au héros qui le porte (s'il en a un) ; renvoie la classe du héros dépouillé.
function unwear(it){const c=wornBy(it);if(!c||it.wid)return null;const k=wornSlot(it,c);meta.gearBy[c][k]=null;return c}
/* Équipements enregistrés : meta.sets[classe] = [{n, g:{emplacement: id d'objet ou null}, w: arme, wm: mods de l'arme, hm: mods du héros,
   au: aura, pet: familier (uid ou null), pm: mods du familier}], 6 par héros au plus. Mods, aura et familier : depuis la v134
   (un équipement enregistré avant n'a pas ces champs, « Porter » laisse alors les mods et le familier tels quels). act : l'équipement en cours (v143). */
const SET_MAX=6;
const setsOf=(c=heroCls)=>meta.sets[c]||(meta.sets[c]=[]);
function setSave(i,c=heroCls){const L=setsOf(c),g={};for(const k of GEAR_KEYS(c))g[k]=meta.gearBy[c][k]?meta.gearBy[c][k].id:null;
  const s={n:L[i]?L[i].n:`Équipement ${L.length+1}`,g,w:curWid(c),wm:build('w',c).load.slice(),hm:build('h',c).load.slice(),au:meta.aura[c]||null,
    pet:meta.petEq==null?null:meta.petEq,pm:petBuild().load.slice()};
  // v143 : l'équipement enregistré ou porté en dernier est l'équipement en cours (act) ; ses changements se rangent par « Mettre à jour »
  for(const x of L)delete x.act;s.act=1;
  if(L[i])L[i]=s;else if(L.length<SET_MAX)L.push(s);return s}
// Remet des mods enregistrés dans une configuration (arme, héros ou familier) : seulement les mods possédés, permis au héros et du bon type,
// dans les cases ouvertes, tant que la capacité suit. Renvoie le nombre de mods laissés de côté.
function setMods(b,ids,c){let miss=0;for(let i=0;i<b.load.length;i++)b.load[i]=null;
  (ids||[]).forEach((id,i)=>{if(!id)return;const rk=meta.mods[id];
    if(rk==null||!MODS[id]||!modOk(id,c)||bKind(id)!==b.kind||modKind(id)==='a'||i>=b.slots||bUsed(b)+bDrain(b,id,rk,i)>bCap(b)){miss++;return}b.load[i]=id});
  return miss}
// Mods, aura et familier d'un équipement enregistré sont-ils ceux d'aujourd'hui ?
function setModsSame(s,c=heroCls){if(!('hm' in s))return true;const eq=(a,b)=>a.length>=b.length?a.every((x,i)=>(x||null)===(b[i]||null)):eq(b,a);
  return eq(build('w',c).load,s.wm||[])&&eq(build('h',c).load,s.hm||[])&&(meta.aura[c]||null)===(s.au||null)&&(meta.petEq==null?null:meta.petEq)===s.pet&&eq(petBuild().load,s.pm||[])}
// Porte un équipement enregistré : chaque objet est pris dans le coffre ou sur un autre héros. Renvoie {done, miss, from}.
function setWear(i,c=heroCls){const s=setsOf(c)[i];if(!s)return null;const g=meta.gearBy[c];let done=0,miss=0;const from=new Set();
  for(const x of setsOf(c))delete x.act;s.act=1;
  const sg=s.g||{};for(const k of GEAR_KEYS(c)){if(!(k in sg))continue;const id=sg[k],cur=g[k]||null;if(cur&&cur.id===id)continue;
    if(id==null){if(cur){meta.stash.push(cur);g[k]=null;done++}continue}
    const it=findItem(id);if(!it||keySlot(k)!==it.slot){miss++;continue}
    const o=unwear(it);if(o)from.add(o);meta.stash=meta.stash.filter(x=>x!==it);if(cur)meta.stash.push(cur);g[k]=it;done++}
  const wOk=!s.w||ownedW(s.w)&&wclsOfD(s.w)===c;
  if(s.w&&wOk&&meta.wpn[c]!==s.w){meta.wpn[c]=s.w;done++}else if(s.w&&!wOk)miss++;
  // v134 : mods de l'arme (si c'est bien l'arme enregistrée), aura et mods du héros, familier et ses mods
  let mm=0,petMiss=false;
  if('hm' in s){
    if(wOk)mm+=setMods(build('w',c),s.wm,c);
    if(s.au==null||meta.mods[s.au]!=null&&modOk(s.au,c))meta.aura[c]=s.au||null;else mm++;
    mm+=setMods(build('h',c),s.hm,c);
    if(s.pet==null)meta.petEq=null;else if(meta.pets.some(p=>p.uid===s.pet))meta.petEq=s.pet;else petMiss=true;
    mm+=setMods(petBuild(),s.pm,c)}
  return {done,miss,from:[...from],mm,petMiss}}

