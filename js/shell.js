// Crypte des Cendres — shell.js : navigation de la refonte (v130).
// Barre des 5 onglets en bas (Héros, Arsenal, Combat, Forge, Collection), accueil Combat, écran Mission, feuille du Parcours.
// Les onglets du Camp restent ceux de camp.js (campTab : equip, arsenal, forge, mods, pets, relics) ; Collection regroupe les trois derniers.

/* ---------- Dessin du héros et du familier (mêmes dessins qu'en mission) ---------- */
// rot : orientation du dessin (le héros regarde vers la droite à 0) ; k : taille du héros dans le cadre.
function heroPaint(el,cls,rot=-Math.PI/2,k=1){if(!el||!el.getContext)return;const g=el.getContext('2d'),W=el.width,H=el.height,s=W/66*k;
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,H);g.setTransform(s,0,0,s,W/2,H/2+W*.04);g.rotate(rot);
  g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(2,6,19,15,0,0,7);g.fill();
  const old=ctx;ctx=g;try{pPlayer(cls,false,lookPal(cls,myLook(cls)))}catch(err){noteErr('aperçu',err)}finally{ctx=old}}
function petPaint(el,p){if(!el||!el.getContext)return;const g=el.getContext('2d'),W=el.width;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,W,el.height);if(!p)return;
  const s=W/40;g.setTransform(s/1.45,0,0,s/1.45,W/2,el.height/2);const old=ctx;ctx=g;try{petDraw2D({t:p.t,x:0,y:0,flap:0},1)}catch(err){noteErr('aperçu',err)}finally{ctx=old}}

/* ---------- Barre des onglets ---------- */
const NAV_TAB={heros:'equip',arsenal:'arsenal',forge:'forge'};
const navOf=t=>t==='equip'?'heros':t==='arsenal'?'arsenal':t==='forge'?'forge':['mods','pets','relics'].includes(t)?'coll':'heros';
const COLL=['mods','pets','relics'];
let collLast='mods',heroSub='main';
// Collection : la dernière vue ouverte, sinon la première débloquée.
const collFirst=()=>!tabLocked(collLast)?collLast:COLL.find(t=>!tabLocked(t))||collLast;
// Onglet verrouillé (Forge, ou Collection dont les trois vues sont fermées) : grisé avec un cadenas, mais il s'ouvre et dit comment le débloquer.
const navLocked=k=>k==='forge'?tabLocked('forge'):k==='coll'?COLL.every(tabLocked):false;
function navSync(){const cur=!$('camp').hidden?navOf(campTab):'combat';
  document.querySelectorAll('#tabbar [data-nav]').forEach(b=>{const on=b.dataset.nav===cur,lk=navLocked(b.dataset.nav);b.classList.toggle('is-on',on);b.classList.toggle('is-locked',lk);if(lk)b.setAttribute('aria-description','verrouillé');else b.removeAttribute('aria-description');if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')})}
function navGo(k){
  if(!$('mission').hidden)$('mission').hidden=true;
  if(k==='combat'){if(!$('camp').hidden)closeCamp();else refreshMenus();navSync();return}
  const t=NAV_TAB[k]||collFirst(),sc=$('campBody').parentElement,open=!$('camp').hidden;
  if(open)campScroll[campTab]=sc.scrollTop;
  const same=open&&navOf(campTab)===k;
  campTab=t;campSel=null;campBack=null;campMsg='';fzc=null;fzRole='a';gridMore=0;if(k==='heros')heroSub='main';
  if(!open)openCamp();else drawCamp();
  sc.scrollTop=same?0:campScroll[campTab]||0;navSync()}
$('tabbar').addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b)navGo(b.dataset.nav)});
// Pastilles de la barre : une par onglet (Collection additionne Reliques, Mods et Familier).
function navBadges(B){const N={heros:[B.equip],arsenal:[B.arsenal],forge:[B.forge],coll:[B.relics,B.mods,B.pets]};
  document.querySelectorAll('#tabbar [data-nav]').forEach(b=>{const L=(N[b.dataset.nav]||[]).filter(Boolean);let el=b.querySelector('.tabbar__badge');
    if(!L.length){if(el)el.remove();return}
    const nw=L.some(x=>x.n==='!'),n=L.reduce((a,x)=>a+(x.n==='!'?0:+x.n||0),0),txt=nw?'!':n>9?'9+':String(n);
    if(!el){el=document.createElement('span');el.className='tabbar__badge';b.appendChild(el)}
    el.textContent=txt;const t=L.map(x=>x.t).join(' · ');el.title=t;el.setAttribute('aria-label',t)})}

/* ---------- Accueil Combat ---------- */
const MODE_SVG={survie:'<path d="M6 3h12M6 21h12M7 3c0 5 10 6 10 9s-10 4-10 9M17 3c0 5-10 6-10 9"/>',defense:'<path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/><path d="M12 7l3 5-3 5-3-5z"/>',
  capture:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v5M12 18v5M1 12h5M18 12h5"/>',breche:'<circle cx="8.5" cy="12" r="5"/><circle cx="15.5" cy="12" r="5"/><path d="M12 8.2v7.6"/>'};
const MODE_C={survie:'#f39a3e',defense:'#8fd3e0',capture:'#f0cf4a',breche:'#ff5fd2'};
const heroOrder=()=>Object.keys(CLS);
// Rareté des reliques de la mission choisie (comme relicTierNow, sans le tirage Sanguine ou Abyssale).
function homeRelTier(L){const D=dif();if(!D.tier)return 0;let t=D.tier<=5?1:2;while(t>0&&L<BAL.relicLv[t-1])t--;return t}
function homeDraw(){
  $('homeName').textContent=myName();$('homeSub').textContent=`Mission max · niveau ${maxL()}`;
  const pl=prOf(heroCls).lv|0;$('avaLvl').textContent=pl?'P'+pl:'';$('avaLvl').hidden=!pl;
  $('introGold').textContent=fmtBig(meta.gold);$('introEss').textContent=fmtBig(meta.essence);
  $('homeGold').title=`${(meta.gold|0).toLocaleString('fr-FR')} or`;$('homeEss').title=`${(meta.essence|0).toLocaleString('fr-FR')} essence`;
  heroPaint($('avaCv'),heroCls,-Math.PI/2,1.25);heroPaint($('heroCv'),heroCls,-Math.PI/2,1.12);
  const C=CLS[heroCls];$('heroName').textContent=C.n;$('heroCv').setAttribute('aria-label',`${C.n} : ${kitS().n}, ultime ${kitU().n}`);
  document.documentElement.style.setProperty('--hero-c',C.col);
  $('heroDots').innerHTML=heroOrder().map(c=>`<i class="${c===heroCls?'on':''}" style="--c:${CLS[c].col}"></i>`).join('');
  // Parcours
  {const i=meta.tutOff?-1:tutStep(),b=$('tutBtn');b.hidden=i<0;if(i>=0){const S=TUT[i],done=S.o.filter(([,f])=>f()).length,nx=S.o.find(([,f])=>!f());
    b.innerHTML=`<span class="home__tuti" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 21V4l8 3 8-3v17l-8-3z"/><path d="M12 7v11"/></svg></span><span class="home__tutt"><span class="home__tutk"><span>Parcours ${i+1} · ${esc(S.n)}</span><b>${done} / ${S.o.length}</b></span><span class="cx-meter__bar home__tutbar"><i style="width:${Math.round(done/S.o.length*100)}%"></i></span><small>${nx?esc(nx[0]):''}</small></span><span class="home__chev" aria-hidden="true">›</span>`;
    b.setAttribute('aria-label',`Parcours, étape ${i+1} sur ${TUT.length} : ${S.n}, ${done} objectif${done>1?'s':''} sur ${S.o.length}`)}}
  // Familier et reliques
  {const ok=isUnl('pets'),p=ok?petEq():null;$('petBtn').hidden=!ok;if(ok){petPaint($('petCv'),p);$('petTxt').textContent=p?RKS.repeat(p.rk):(meta.eggs>0?`${meta.eggs} œuf${meta.eggs>1?'s':''}`:'Familier');
    $('petBtn').classList.toggle('is-empty',!p);$('petBtn').setAttribute('aria-label',p?`Familier : ${PETS[p.t].n}, rang ${p.rk}`:'Familier : aucun équipé')}}
  {const ok=isUnl('relics'),n=meta.relicQ.length,b=$('relicHomeN');$('relicHomeBtn').hidden=!ok;b.hidden=!n;b.textContent=n;
    const t=n?RTIER[RELICS[meta.relicQ[0].id].t]:null;$('relicHomeBtn').style.setProperty('--tc',t?t.c:'#8f8494');$('relicHomeBtn').classList.toggle('is-empty',!n);
    $('relicHomeBtn').setAttribute('aria-label',n?`Reliques : ${n} équipée${n>1?'s':''}`:'Reliques : aucune équipée')}
  // Carte de mission
  {const m=MODES[meta.mode]?meta.mode:'survie',st=clamp(meta.start|0||1,1,LV_MAX),D=dif(),di=Math.max(0,Math.min(3,meta.diff|0)),bi=Math.max(0,Math.min(BIOMES.length-1,meta.biome|0));
    const iv=Math.round(D.iv*(m==='capture'?1.5:1)),rq=meta.relicQ.length,tt=homeRelTier(st),rt=RTIER[tt];
    const relTag=m==='breche'?'':`<span class="home__tag" style="--c:${rt.c}">Relique ${rt.n}${tt===2?' ou Abyssale':''}</span>`;
    $('missionCard').style.setProperty('--mc',MODE_C[m]);
    $('missionCard').innerHTML=`<span class="home__mico"><svg viewBox="0 0 24 24">${MODE_SVG[m]}</svg><b>${MODES[m].n}</b></span>
      <span class="home__minfo"><span class="home__mlv"><b>Niveau ${st}</b><span class="home__pill" style="--c:${di?DIFF[di].c:'#bdb6a8'}">${esc(D.n)}</span></span>
      <small>${BIOMES[bi].ic?BIOMES[bi].ic+' ':''}${esc(BIOMES[bi].n)} · ${D.cnt>1?D.cnt+' Gardiens':'1 Gardien'} toutes les ${iv} s</small>
      <span class="home__tags">${relTag}<span class="home__tag">${rq?`${rq} relique${rq>1?'s':''} équipée${rq>1?'s':''}`:'Aucune relique équipée'}</span></span></span>
      <span class="home__chev" aria-hidden="true">›</span>`;
    $('missionCard').setAttribute('aria-label',`Mission : ${MODES[m].n}, niveau ${st}, ${D.n}, ${BIOMES[bi].n}. Toucher pour changer.`)}
}
$('heroPrev').onclick=()=>{const o=heroOrder();pickCls(o[(o.indexOf(heroCls)+o.length-1)%o.length])};
$('heroNext').onclick=()=>{const o=heroOrder();pickCls(o[(o.indexOf(heroCls)+1)%o.length])};
// Glisser sur le héros change de héros.
{let x0=null;const st=$('heroCv');st.addEventListener('pointerdown',e=>{x0=e.clientX});st.addEventListener('pointerup',e=>{if(x0==null)return;const d=e.clientX-x0;x0=null;if(Math.abs(d)>40)(d<0?$('heroNext'):$('heroPrev')).click()})}
$('petBtn').onclick=()=>{collLast='pets';navGo('coll')};
$('relicHomeBtn').onclick=()=>{collLast='relics';navGo('coll')};

/* ---------- Écran Mission ---------- */
function openMission(){$('mission').hidden=false;refreshMenus();$('mission').querySelector('.cx-screen__body').scrollTop=0}
function closeMission(){$('mission').hidden=true;refreshMenus()}
$('missionCard').onclick=openMission;$('msnBack').onclick=closeMission;
function missionDraw(){
  const bi=Math.max(0,Math.min(BIOMES.length-1,meta.biome|0));
  $('bioCards').innerHTML=BIOMES.map((b,i)=>{const lock=!!b.unl&&!isUnl(b.unl);
    return `<button class="msn__bio${i?' msn__bio--'+b.id:''}${lock?' is-locked':''}" role="radio" data-bio="${i}" aria-checked="${i===bi}" ${lock?'aria-disabled="true"':''}><b>${b.ic?b.ic+' ':''}${esc(b.n)}</b><small>${lock?`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>${esc(UNL_BY[b.unl].need)}`:b.tag}</small></button>`}).join('');
  const di=Math.max(0,Math.min(3,meta.diff|0));
  $('diffSeg').innerHTML=DIFF.map((d,i)=>{const lock=!diffOk(i);return `<button class="cx-tab${lock?' is-locked':''}" role="radio" data-diff="${i}" aria-checked="${i===di}" aria-selected="${i===di}" ${lock?'aria-disabled="true"':''} style="--dc:${i?d.c:'#d8d0c4'}">${lock?`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>`:''}${d.n}</button>`}).join('');
  const tm=di===3;$('tormRow').hidden=!tm;
  if(tm){const t=dif().tier;$('tormVal').textContent=ROM[t-1];$('tormMinus').disabled=t<=1;$('tormPlus').disabled=t>=tormMax();
    $('tormDesc').textContent=tormMax()<10?`Palier ${ROM[tormMax()]} : réussis d'abord le palier ${ROM[tormMax()-1]}.`:'Plus haut : monstres plus forts, reliques plus rares'}
  $('diffDesc').textContent=diffLine(di);
  const st=clamp(meta.start|0||1,1,LV_MAX),m=MODES[meta.mode]||MODES.survie;
  $('startBtn2').innerHTML=`Lancer<small>${esc(m.n)} · niveau ${st} · ${esc(dif().n)}</small>`}
$('bioCards').addEventListener('click',e=>{const b=e.target.closest('[data-bio]');if(!b)return;const i=+b.dataset.bio;
  if(b.getAttribute('aria-disabled')==='true'){const u=UNL_BY[BIOMES[i].unl];toast(`${u.n} : ${u.need.replace(/^./,c=>c.toLowerCase())}`);return}
  meta.biome=i;saveMeta();newGame();refreshMenus()});
$('diffSeg').addEventListener('click',e=>{const b=e.target.closest('[data-diff]');if(!b)return;const i=+b.dataset.diff;
  if(b.getAttribute('aria-disabled')==='true'){toast(`${UNL_BY['diff'+i].n} : ${UNL_BY['diff'+i].need.replace(/^./,c=>c.toLowerCase())}`);return}
  meta.diff=i;if(i===3&&!(meta.torm|0))meta.torm=1;saveMeta();newGame();refreshMenus()});
$('tormMinus').onclick=()=>setTorm((meta.torm|0||1)-1);$('tormPlus').onclick=()=>setTorm((meta.torm|0||1)+1);

/* ---------- Parcours (feuille) ---------- */
function openTut(){const i=tutStep();if(i<0)return;
  const track=`<ol class="tutrack" aria-label="Étapes du parcours">${TUT.map((s,j)=>`<li class="${j<i?'done':j===i?'cur':''}"${j===i?' aria-current="step"':''}><span>${j<i?'✓':j+1}</span><small>${esc(s.n)}</small></li>`).join('')}</ol>`;
  $('pickTitle').textContent='Parcours';$('pickBody').innerHTML=track+tutCard();
  $('pickBody').onclick=e=>{const b=e.target.closest('[data-cact="tutoff"]');if(b){meta.tutOff=true;saveMeta();closePick();refreshMenus();toast('Parcours masqué : « Réafficher le parcours » en bas de l\'onglet Héros.')}};
  $('pickSheet').hidden=false}
$('tutBtn').onclick=openTut;

// Taille du héros de l'accueil (v131) : il prend la hauteur libre de la scène, plus grand quand la bannière Parcours a disparu
// (entre 160 et 340 px, 80 % de la largeur au plus ; 112 px restent pour le nom, les flèches et les points).
(function(){const st=document.querySelector('.home__stage');if(!st)return;
  const fit=()=>{const h=st.clientHeight,w=st.clientWidth;if(!h||!w)return;st.style.setProperty('--hs',Math.round(Math.max(160,Math.min(340,w*.8,h-112)))+'px')};
  if(typeof ResizeObserver==='function')new ResizeObserver(fit).observe(st);addEventListener('resize',fit);fit()})();
