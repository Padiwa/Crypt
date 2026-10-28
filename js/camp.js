// Crypte des Cendres — camp.js : cœur du Camp (état, affichage des onglets, pied, table d'actions CAMP_ACT, accueil, feuille de choix).
// Les onglets sont dans heros.js, arsenal.js, forge.js, collection.js, inv.js (coffre, recyclage), fuse.js (fusion), seal.js, pet.js ; la sauvegarde dans save.js.
/* ---------- Camp ---------- */
let campTab='equip',campSel=null;
function syncEq(){if(G&&(!started||G.over)){G.eq=curEq();S=stats(G.eq);G.P.hp=S.hp}}
let campMsg='';
function fragStatus(id){const pc=meta.parts[id]||[0,0,0];return pc.filter(n=>n>0).length}
let stF='all',stS='rar';
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const RARV=['var(--rar-common)','var(--rar-magic)','var(--rar-rare)','var(--rar-legend)','var(--rar-anc)','var(--rar-sang)','var(--rar-aby)'];
let campB={};
function tabBadges(){
  const craft=isUnl('craft')?craftIds().filter(id=>{const b=bpdef(id),pc=meta.parts[id]||[0,0,0];return pc.every(n=>n>0)&&meta.gold>=b.craft}).length:0,fz=isUnl('fuse')?fuseGroups().n:0;
  const relTot=Object.values(meta.relics).reduce((n,a)=>n+(a[0]||0)+(a[1]||0),0);relicQFix();const relFree=relTot-meta.relicQ.length;
  const ups=isUnl('bonus')?UPG.filter(u=>lv(u.k)<u.max&&meta.gold>=upCost(u)).length:0,tal=isUnl('bonus')?(TAL[heroCls]||[]).filter(t=>!hasTal(t.k)&&meta.gold>=t.cost).length:0;
  const prOn=prOpen()||prOf().lv>0,pr=prOn?prFree():0,prBuy=prOn&&meta.gold>=prCost(prOf().lv).gold&&meta.essence>=prCost(prOf().lv).ess?1:0;
  const best=Object.keys(bestPlan(curEq(),meta.stash.slice(0,300),true)).length;
  const su=SLOT_U.filter(slotCan).length,pl=(n,w)=>`${n} ${w}${n>1?'s':''}`;
  const hn=best+su+tal+pr+prBuy,ht=[best?pl(best,'amélioration')+' d\'équipement':'',su?pl(su,'emplacement')+' à débloquer':'',tal?pl(tal,'talent')+' à apprendre':'',pr?pl(pr,'point')+' de prestige à placer':'',prBuy?'prestige achetable':''].filter(Boolean).join(', ');
  const B={equip:hn?{n:hn,t:ht}:null,arsenal:craft?{n:craft,t:`${pl(craft,'objet')} à fabriquer`}:null,
    relics:relFree&&!meta.relicQ.length?{n:relFree,t:`${relFree} relique${relFree>1?'s':''} non équipée${relFree>1?'s':''}`}:null,
    pets:meta.eggs>0?{n:meta.eggs,t:`${meta.eggs} œuf${meta.eggs>1?'s':''} à faire éclore`}:null,
    forge:(ups+fz)?{n:fz||ups,t:fz?`${fz} fusion${fz>1?'s':''} possible${fz>1?'s':''}`:`${ups} amélioration${ups>1?'s':''} achetable${ups>1?'s':''}`}:null};
  // onglets verrouillés : pas de pastille ; nouveautés débloquées : « ! » jusqu'à « Compris »
  const TN={equip:['sets','slots'],arsenal:['craft','arms','recy'],relics:['relics'],mods:['mods','hmods','align'],pets:['pets'],forge:['bonus','affix','fuse','seals']};
  for(const t in TN){if(tabLocked(t)){B[t]=null;continue}const nw=TN[t].filter(k=>meta.unlNew.includes(k));if(nw.length)B[t]={n:'!',t:`Nouveau : ${nw.map(k=>UNL_BY[k].n).join(', ')}`}}
  if(!isUnl('fuse')&&B.forge&&!isUnl('bonus'))B.forge=null;
  campB=B;if(typeof navBadges==='function')navBadges(B);return B}
// Texte repliable (Disclosure) : une phrase, le détail derrière « En savoir plus ». L'état ouvert est retenu par clé.
let moreOpen={};try{moreOpen=JSON.parse(localStorage.getItem('crypte-more')||'{}')}catch{}
function cxMore(key,sentence,body,lab='En savoir plus'){return `<details class="cx-more" data-more="${key}"${moreOpen[key]?' open':''}><summary><span>${sentence}</span><span class="cx-more__toggle"><span class="o">${lab}</span><span class="c">Masquer</span></span></summary><div class="cx-more__body">${body}</div></details>`}
document.addEventListener('toggle',e=>{const d=e.target;if(!d.matches||!d.matches('details[data-more]'))return;moreOpen[d.dataset.more]=d.open;try{localStorage.setItem('crypte-more',JSON.stringify(moreOpen))}catch{}},true);
const subTabs=(items,cur,act)=>`<div class="cx-tabs" role="tablist">${items.map(([k,l,n,lk])=>`<button class="cx-tab${lk?' is-locked':''}" role="tab" data-cact="${act}" data-arg="${k}" aria-selected="${cur===k}">${l}${n?`<span class="cx-tab__badge">${n}</span>`:''}</button>`).join('')}</div>`;
const CAMP_MORE={
  ars_heros:['Ce que porte chaque héros. Touche un objet pour voir sa fiche.','<p>Le héros joué vient en premier. Touche un objet porté par un autre héros pour le lui reprendre et l\'équiper sur le héros joué (« Équiper sur… »). Pour équiper un autre héros, choisis-le en haut de l\'onglet Héros (ou avec les flèches de l\'accueil). Un objet n\'est porté que par un héros à la fois.</p>'],
  ars_coffre:['Touche un objet pour voir sa fiche et l\'équiper.','<p>Le coffre montre aussi ce que portent tes héros : la pastille A, G ou M indique l\'Archer, le Guerrier ou le Magicien, et le filtre « Portés » n\'affiche qu\'eux. ▲ signale un objet meilleur que celui que tu portes, le cadenas un objet verrouillé (ni recyclé, ni sacrifié par une fusion, ni utilisé comme source d\'affixe). « Équiper le meilleur », en bas, choisit pour chaque emplacement l\'objet qui donne le plus de puissance et de vie, et la meilleure arme de ton héros.</p>'],
  equip:['L\'équipement de ce héros et ses statistiques. Touche un emplacement pour voir sa fiche.','<p>Chaque héros a son équipement ; un objet n\'est porté que par un héros à la fois. « Enregistrer l\'équipement porté » le garde pour le remettre plus tard. Le coffre (tout ce que tu possèdes, objets portés compris) est dans l\'onglet Arsenal, comme le recyclage. « Équiper le meilleur », en bas, choisit pour chaque emplacement l\'objet du coffre qui donne le plus de puissance et de vie.</p><p>Les tuiles Sorts et talents, Prestige et Apparence ouvrent les réglages propres à ce héros : choix du sort et de l\'ultime, talents, prestige, couleurs. Le prestige s\'ouvre quand toutes les améliorations de la Forge sont au maximum.</p>'],
  ars_mine:['Tes armes, leur rang et leur maîtrise. Touche « Équiper » pour changer celle de ton héros.','<p>Les armes communes, magiques et rares tombent des monstres ; les légendaires et plus rares se fabriquent (Recettes). Un double se fusionne avec l\'arme pour la faire monter de rang (Forge › Fusion).</p>'],
  arsenal:['Fabrique les objets légendaires et plus rares avec leurs 3 fragments.','<p>Les fragments viennent des reliques, ouvertes en mission : Ossuaire (légendaires), Ancestrale (ancestraux), Sanguine (sanguins), Abyssale (abyssaux). Un objet sort au niveau d\'objet de ta plus haute mission réussie. Fabriquer une arme que tu as déjà donne un double, à fusionner à la Forge.</p><p>L\'onglet « Armes » montre tes armes, leur rang et leur DPS comparé à celle que tu portes.</p>'],
  relics:['Équipe des reliques : elles s\'ouvrent pendant la mission.',`<p>En mission, ${REACT_N} réactifs (ennemis au halo doré) ouvrent la première relique de la liste, puis la suivante. En Tourment il en faut moins : ${Math.round((BAL.tormReact||0)*100)} % de moins par palier, et encore moins à mesure que tu restes dans la mission, où les reliques tombent aussi plus souvent. Chaque relique ouverte donne un fragment d\'un objet de sa rareté et +25 essence, à la réussite de la mission.</p><p>Le type de relique dépend de la difficulté et du niveau de mission : Ossuaire en Normal, Difficile et Cauchemar ; Ancestrale en Tourment I et plus, dès le niveau ${BAL.relicLv[0]} ; Sanguine et Abyssale en Tourment VI et plus, dès les niveaux ${BAL.relicLv[1]} et ${BAL.relicLv[2]}. Sous le niveau requis, c'est la relique du dessous. Trois reliques d\'un même type donnent une relique forgée qui vise l\'objet de ton choix. Le raffinage (50 essence) rend une relique éclatante : elle donne deux fragments.</p>`],
  mods:['Place tes mods dans les cases du héros et de l\'arme.','<p>Chaque mod coûte de la capacité ; la maîtrise, gagnée en mission, en ajoute. Une case alignée sur une polarité divise par deux le coût des mods de cette polarité. Un mod au rang maximum se surcharge avec ses copies (jusqu\'à 5 étoiles).</p>'],
  pets:['Ton familier te suit en mission ; fais éclore tes œufs ici.',`<p>Les œufs tombent parfois en ouvrant une relique (${EGG_CH.map((c,t)=>`${RTIER[t].n} ${fmtN(c*BAL.eggMul*100)} %`).join(', ')}). Deux familiers identiques de même rang fusionnent en un seul du rang au-dessus (★★★★★ au maximum). Un familier équipé gagne des niveaux (jusqu\'à 20) avec les ennemis abattus.</p>`],
  forge_up:['L\'or du Camp achète des améliorations permanentes pour tous tes héros.','<p>Chaque rang s\'applique à tous tes héros. Les talents, propres à chaque héros, sont dans l\'onglet Héros › Sorts et talents. Quand toutes les améliorations sont au maximum, le <b>Prestige</b> s\'ouvre (onglet Héros › Prestige).</p><p>La sauvegarde (exporter, importer) se trouve dans <b>Réglages</b> : touche ton portrait sur l\'accueil.</p>'],
  forge_affix:['Touche l\'objet qui reçoit l\'affixe (la cible), choisis l\'affixe, puis l\'objet sacrifié.','<p>La liste déroulante de la source montre les affixes que tes autres objets peuvent donner à la cible : celles qu\'elle a déjà (fusion) et les nouvelles (ajout). Choisis-en une : tous les objets qui la portent s\'affichent, avec ce que la cible obtiendrait. La source est détruite ; son affixe passe sur la cible, qui la gagne, la renforce ou la remplace. Le coût en essence dépend de la rareté de la source. Une affixe déjà plus forte sur la cible ne peut pas être remplacée par une plus faible.</p>'],
  ars_recy:['Touche les objets à recycler, puis Recycler en bas.','<p>Recycler détruit un objet contre de l\'essence, selon sa rareté et son rang. Les objets portés et verrouillés ne se recyclent pas. Filtre par rareté puis « Tout sélectionner » pour recycler un lot d\'un coup.</p>'],
  forge_fuse:[`Deux exemplaires identiques de même rang fusionnent en un seul du rang au-dessus.`,`<p>Identique : même modèle (le nom de base pour le butin, le nom exact pour les objets des reliques), même rareté et même rang. L\'exemplaire gardé conserve ses affixes et son niveau ; chaque rang ajoute 10 % à ses statistiques, jusqu\'au rang 10 pour les objets des reliques (butin des monstres : rang ${BAL.mobRankMax.join(', ')} en commun, magique, rare). Chaque fusion coûte de l\'or : ${BAL.fuseGold} × 2 par rang atteint × (rareté + 1) × (1 + niveau de l\'objet / 20). Pour une arme, les doubles (trouvés ou fabriqués) se fusionnent avec celle que tu possèdes.</p>`],
  forge_seals:['Pose un sceau légendaire sur un objet porté.','<p>Les sceaux tombent seulement en Brèche (le mode à plusieurs), sur les Gardiens et les élites ; 100 éclats s\'échangent contre un sceau au hasard. Un sceau par objet, en plus de ses affixes.</p>']};
// Clé de déblocage de chaque onglet du Camp et de chaque sous-onglet de la Forge.
const TAB_UNL={relics:'relics',mods:'mods',pets:'pets',forge:'bonus'},FSUB_UNL={up:'bonus',affix:'affix',fuse:'fuse',seals:'seals'};
const tabLocked=t=>t==='forge'?!['bonus','affix','fuse','seals'].some(isUnl):!!TAB_UNL[t]&&!isUnl(TAB_UNL[t]);
// Cartes « Nouveau » propres à une vue.
const viewNew=()=>campTab==='equip'?['sets','slots']:campTab==='mods'?['mods','hmods','align']:campTab==='pets'?['pets']:campTab==='relics'?['relics']:campTab==='forge'?[FSUB_UNL[forgeSub]]:[];
function drawCamp(){if(drawCache)return drawCamp0();drawCache=new Map();try{return drawCamp0()}finally{drawCache=null}}
function drawCamp0(){
  unlockCheck(false);
  if(campTab==='affix'){campTab='forge';forgeSub='affix'}
  if(COLL.includes(campTab))collLast=campTab;
  $('campTitle').textContent={equip:'Héros',arsenal:'Arsenal',forge:'Forge'}[campTab]||'Collection';
  if(campTab==='forge'&&forgeSub==='recy'){campTab='arsenal';arsView='recy'}
  const fk=campTab==='forge'?'forge_'+forgeSub:campTab==='arsenal'?(arsView==='recy'?'ars_recy':arsView==='coffre'?'ars_coffre':arsView==='heros'?'ars_heros':arsView==='mine'?'ars_mine':'arsenal'):campTab;
  {const h=document.getElementById('campHelp');if(h)h.href='aide/index.html#'+(campTab==='arsenal'&&(arsView==='coffre'||arsView==='recy'||arsView==='heros')?'camp-coffre':campTab==='pets'?'familiers':campTab==='forge'?(forgeSub==='affix'?'camp-affix':forgeSub==='seals'?'camp-affix':forgeSub==='fuse'?'camp-fusion':'camp-forge'):'camp-'+campTab)}
  // montants courts : sur téléphone, l'en-tête garde la place de l'aide et de la croix ; le montant exact reste en info-bulle
  $('campGold').innerHTML=`<span class="g"><span class="coin"></span>${fmtBig(meta.gold)}</span><span class="e"><span class="essi"></span>${fmtBig(meta.essence)}</span>`;$('campGold').title=`${(meta.gold|0).toLocaleString('fr-FR')} or · ${(meta.essence|0).toLocaleString('fr-FR')} essence`;
  const NC=viewNew().map(newCard).join('');
  const body=$('campBody'),M=CAMP_MORE[fk],more=M?cxMore(fk,M[0],M[1]):'';
  let h='';
  const LK=l=>`<span class="lockmini" aria-hidden="true">${LOCK_SVG}</span>${l}`,cb=k=>campB[k]&&campB[k].n?campB[k].n:0;
  const collTabs=COLL.includes(campTab)?subTabs(COLL.map(k=>[k,tabLocked(k)?LK({mods:'Mods',pets:'Familiers',relics:'Reliques'}[k]):{mods:'Mods',pets:'Familiers',relics:'Reliques'}[k],tabLocked(k)?0:cb(k),tabLocked(k)]),campTab,'coll'):'';
  if(campTab==='forge'&&tabLocked('forge'))h=lockedHtml('bonus');
  else if(campTab==='forge'){const fl=k=>!isUnl(FSUB_UNL[k]),lab=(k,l)=>fl(k)?LK(l):l;
    h=subTabs([['affix',lab('affix','Affixes'),0,fl('affix')],['fuse',lab('fuse','Fusion'),fl('fuse')?0:fuseGroups().n,fl('fuse')],['up',lab('up','Bonus'),0,fl('up')],['seals',lab('seals','Sceaux'),!fl('seals')&&SEAL_IDS.some(id=>meta.seals[id]>0)&&!Object.values(meta.gear).some(i=>i&&i.seal)?1:0,fl('seals')]],forgeSub,'fsub')
      +(fl(forgeSub)?lockedHtml(FSUB_UNL[forgeSub]):NC+more+(forgeSub==='affix'?campAffix():forgeSub==='seals'?campSeals():forgeSub==='fuse'?campFusion():campForge()))}
  else if(tabLocked(campTab))h=collTabs+lockedHtml(TAB_UNL[campTab]);
  else if(campTab==='mods'||campTab==='pets')h=collTabs+NC+more+'<div id="modsCamp" class="col"></div>';
  else h=collTabs+NC+(campTab==='equip'?campEquip():more+(campTab==='arsenal'?campArsenal2():campTab==='relics'?campRelics():''));
  body.innerHTML=h;
  if(campTab==='equip'){lookPaint();heroPaint(document.getElementById('heroStage'),heroCls,-Math.PI/2,.9)}
  if(tabLocked(campTab)){}
  else if(campTab==='pets'){if(modTab!=='p'){modTab='p';modSel=null;modSF=null;modPF='all';alSel=null}renderMods('modsCamp')}
  else if(campTab==='mods'){if(modTab==='p'||(modTab==='h'&&!isUnl('hmods'))){modTab=isUnl('hmods')?'h':'w';modSel=null;modSF=null;modPF='all';alSel=null}renderMods('modsCamp')}
  tabBadges();navSync();
  const dk=typeof campDockHtml==='function'?campDockHtml():'';$('campDock').innerHTML=dk;$('campDock').hidden=!dk;
  const ft=dk?'':campFootHtml();$('campFoot').innerHTML=ft;$('campFoot').hidden=!ft;$('campFoot').className='cx-sheet__foot'+(ft.includes('cx-hint')?' stack':'');
}
// L'action principale de l'onglet, collée en bas de la feuille.
function campFootHtml(){
  if(tabLocked(campTab)||(campTab==='forge'&&!isUnl(FSUB_UNL[forgeSub]))||(campTab==='arsenal'&&({rec:'craft',mine:'arms',recy:'recy'})[arsView]&&!isUnl(({rec:'craft',mine:'arms',recy:'recy'})[arsView])))return '';
  if(campTab==='forge'&&forgeSub==='affix')return affixFoot();
  if(isRecy())return recyFoot();
  if(campTab==='forge'&&forgeSub==='fuse')return fusionFoot();
  if(campTab==='equip'&&heroSub!=='main')return '';
  if(campTab==='equip'||isCoffre()){const pn=Object.keys(bestPlan(curEq(),meta.stash,true)).length;return pn?`<button class="cx-btn cx-btn--primary" data-cact="bestall">Équiper le meilleur · ${pn}</button>`:''}
  if(campTab==='relics'){relicQFix();const ne=relToEquip(relTier);if(!ne)return '';const sh=relTier==='g'?'Givre':relTier==='f'?'Forgées':relTier==='all'?'':RTIER[+relTier].n;return `<button class="cx-btn cx-btn--primary" data-cact="rqtype">Tout équiper${sh?' · '+sh:''} · ${ne}</button>`}
  return '';
}
const campScroll={};
$('campSheet').addEventListener('click',e=>{
  {const b=e.target.closest('#campDock [data-act]');if(b&&!b.disabled){modAct(b.dataset.act,b.dataset);return}}
  const b=e.target.closest('button');if(!b||b.disabled||b.closest('#modsCamp')||!b.closest('#campBody,#campFoot,#campDock'))return;campClick(b)});
// Actions du Camp (v135 : table d'actions). CAMP_ACT[nom](a, arg, bouton, dataset) ; chaque fichier du Camp ajoute les siennes
// (Object.assign(CAMP_ACT,{…})). Une action qui ne renvoie pas CAMP_GO s'arrête là : ni enregistrement ni nouvel affichage.
// Aussi appelées depuis Réglages pour la sauvegarde.
const CAMP_GO=1,CAMP_ACT={};
function campClick(b){
  const d=b.dataset;
  if(d.slot)campSel={slot:d.slot};
  else if(d.stash){const it=findItem(+d.stash);campSel=it?selOf(it):{stash:+d.stash}}
  else if(d.wsel)campSel={wpn:d.wsel};
  else if(d.cact){const a=d.cact,arg=d.arg;campMsg='';const f=CAMP_ACT[a];if(f&&f(a,arg,b,d)!==CAMP_GO)return;saveMeta();syncEq()}
  drawCamp();if(!$('settings').hidden)drawSettings();
  if(xfJump){xfJump=false;const e=$('campBody').querySelector('.cx-roles'),c=$('campBody').parentElement;if(e&&e.getBoundingClientRect().top<c.getBoundingClientRect().top)e.scrollIntoView({block:'start'})}
}

// Navigation du Camp
Object.assign(CAMP_ACT,{
  sfilter:function(a,arg,b,d){{stF=arg}return CAMP_GO},
  gridmore:function(a,arg,b,d){{gridMore++}return CAMP_GO},
  unlok:function(a,arg,b,d){{meta.unlNew=meta.unlNew.filter(k=>k!==arg)}return CAMP_GO},
  arsv:function(a,arg,b,d){{arsView=arg;campSel=null;campBack=null}return CAMP_GO},
  fsub:function(a,arg,b,d){{forgeSub=arg;campSel=null;fzc=null;fzRole='a'}return CAMP_GO},
  coll:function(a,arg,b,d){{campTab=arg;campSel=null;campBack=null}return CAMP_GO},
  hsub:function(a,arg,b,d){{heroSub=arg;campSel=null}return CAMP_GO},
  hcls:function(a,arg,b,d){{if(CLS[arg]&&arg!==heroCls){campSel=null;pickCls(arg);return}}return CAMP_GO},
  tutoff:function(a,arg,b,d){{meta.tutOff=true;toast('Parcours masqué : « Réafficher le parcours » en bas de l\'onglet Héros.')}return CAMP_GO},
  tuton:function(a,arg,b,d){{meta.tutOff=false}return CAMP_GO},
  gosets:function(a,arg,b,d){{const e=$('setsSec');if(e)e.scrollIntoView({behavior:'smooth',block:'start'});return}return CAMP_GO},
  goback:function(a,arg,b,d){{const B=campBack;campBack=null;if(B){campTab=B.tab;campSel=B.sel;drawCamp();$('campBody').parentElement.scrollTop=B.scroll||0;return}}return CAMP_GO},
});
function openCamp(){$('camp').hidden=false;campSel=null;campMsg='';fzc=null;fzRole='a';drawCamp();navSync()}
function closeCamp(){$('camp').hidden=true;if(!started)newGame();refreshMenus()}
// Accueil : lignes résumées (Biome, Niveau, Difficulté, Reliques) ; Lancer et le Camp restent en bas.
function diffLine(i){const D=i===3?dif3():DIFF[i],iv=Math.round(D.iv*(meta.mode==='capture'?1.5:1));
  return (i===3?`Monstres : vie ×${fmtN(D.hp)}, dégâts ×${fmtN(D.dm)} · affixes +${Math.round(D.aq*100)} % · réactifs −${Math.round(Math.min(BAL.reactCutMax||0,Math.max(1,meta.torm|0)*(BAL.tormReact||0))*100)} %, plus en restant · `:'')+`${D.cnt>1?`${D.cnt} Gardiens`:'1 Gardien'} toutes les ${iv} s · ${D.loot?`butin et or +${Math.round(D.loot*100)} %`:'butin normal'}`}
const dif3=()=>{const sv=meta.diff;meta.diff=3;const D=dif();meta.diff=sv;return D};
function refreshMenus(){
  try{tabBadges()}catch(err){noteErr('pastilles',err)}
  const st=clamp(meta.start|0||1,1,LV_MAX);
  if(document.activeElement!==$('lvIn'))$('lvIn').value=st;$('lvMinus').disabled=st<=1;$('lvPlus').disabled=st>=LV_MAX;
  const lm=lootMul(st);$('lvDesc').textContent=st===1?'Plus haut : plus de butin, monstres plus forts':`Butin ×${lm.toFixed(2).replace(/\.?0+$/,'').replace('.',',')} · or ×${goldMul(st).toFixed(1).replace('.',',')} · monstres plus forts`;
  $('bestTxt').textContent=best?`Meilleure survie : ${fmt(best)}`:'';
  // La Brèche ne se joue qu'à plusieurs : choisissable par l'hôte dès qu'un joueur est connecté.
  {const coopOk=typeof NET!=='undefined'&&NET.host&&NET.peers.some(p=>p.state==='open');if(meta.mode==='breche'&&!coopOk){meta.mode='survie';saveMeta()}
    const mLock=m=>MODES[m].coop?!coopOk:!!UNL_BY[m]&&!isUnl(m);if(mLock(meta.mode)){meta.mode='survie';saveMeta()}
    document.querySelectorAll('.cx-pick[data-m]').forEach(b=>{b.setAttribute('aria-checked',String(b.dataset.m===meta.mode));const lock=mLock(b.dataset.m);b.setAttribute('aria-disabled',String(lock));b.classList.toggle('is-locked',lock)});
    const nxt=['defense','capture'].find(mLock);
    $('modeDesc').textContent=MODES[meta.mode].d+(nxt?` ${UNL_BY[nxt].n.replace('Mission ','')} : ${UNL_BY[nxt].need.replace(/^./,c=>c.toLowerCase())}`:'')+(coopOk?'':' Brèche : à plusieurs seulement, héberge une partie (bouton Coop de l\'accueil) pour la choisir.')}
  if(!diffOk(meta.diff|0)){meta.diff=0;saveMeta()}if((meta.diff|0)===3&&(meta.torm|0)>tormMax()){meta.torm=Math.max(1,tormMax());saveMeta()}
  {const B=BIOMES[meta.biome|0];if(meta.biome&&(!B||(B.unl&&!isUnl(B.unl)))){meta.biome=0;saveMeta()}}
  if(!started)unlockHomeSeen();
  if(typeof NET!=='undefined'&&NET.host&&NET.on)sendRoster();
  relicQFix();const rn=meta.relicQ.length;
  $('relicVal').textContent=rn?`${rn} équipée${rn>1?'s':''}`:'Aucune';$('relicVal').style.color=rn?'':'var(--muted)';
  const D=dif(),di=Math.max(0,Math.min(3,meta.diff|0));
  $('diffVal').textContent=D.n;$('diffVal').style.color=di?DIFF[di].c:'';
  const sb=$('startBtn');if(!sb.disabled)sb.innerHTML=`Combattre<small>${esc(MODES[meta.mode].n)} · niveau ${st} · ${esc(D.n)}</small>`;
  try{homeDraw();missionDraw()}catch(err){noteErr('accueil',err)}
  navSync();
}
// Feuille de choix (SettingRow → Sheet + Choice) : toucher une option la choisit et ferme la feuille.
// Une option verrouillée (o.lock = condition) reste visible, grisée, avec ce qu'il faut faire pour l'obtenir.
function openPick(title,opts,onPick,extra){$('pickTitle').textContent=title;
  $('pickBody').innerHTML=`<div class="cx-choices" role="radiogroup" aria-label="${title}">${opts.map((o,i)=>`<button class="cx-choice${o.lock?' is-locked':''}" role="radio" data-pick="${i}" aria-checked="${!!o.on}" ${o.lock?'aria-disabled="true"':''} style="--cc:${o.c||'var(--ink)'}"><span class="cx-choice__key">${o.lock?`<span class="lockmini">${LOCK_SVG}</span>`:i+1}</span><span class="cx-choice__name">${o.n}</span><p class="cx-choice__desc">${o.lock?`<b>Verrouillé</b> : ${o.lock}`:o.d||''}</p><span class="cx-choice__go" aria-hidden="true">›</span></button>`).join('')}</div>${extra?extra():''}`;
  $('pickBody').onclick=e=>{const b=e.target.closest('[data-pick]');if(b){const o=opts[+b.dataset.pick];if(o&&o.lock){toast(o.lock);return}const keep=onPick(+b.dataset.pick);if(keep)openPick(title,keep.opts||opts,onPick,extra);else closePick();return}
    const t=e.target.closest('[data-torm]');if(t){setTorm((meta.torm|0||1)+(+t.dataset.torm));openPick(title,diffOpts(),onPick,extra)}};
  $('pickSheet').hidden=false}
function closePick(){$('pickSheet').hidden=true}
$('pickClose').onclick=closePick;$('pickSheet').addEventListener('click',e=>{if(e.target.id==='pickSheet')closePick()});
const diffOpts=()=>DIFF.map((d,i)=>({n:i===3?`${d.n} · ${dif3().n.replace('Tourment ','palier ')}`:d.n,d:diffLine(i),c:i?d.c:'var(--ink)',on:i===(meta.diff|0),lock:diffOk(i)?null:UNL_BY['diff'+i].need}));
const tormExtra=()=>(meta.diff|0)===3?`<div class="cx-rows"><div class="cx-row"><span class="cx-row__k" style="color:var(--ink)">Palier de Tourment<small>Plus haut : monstres plus forts, plus de Rares ; reliques Sanguines et Abyssales dès VI</small></span><span class="cx-stepper"><button type="button" data-torm="-1" ${dif().tier<=1?'disabled':''} aria-label="Baisser le palier">−</button><b style="min-width:3.2em;display:grid;place-items:center;font:700 16px/1 var(--font-body);color:#ff6a3a">${ROM[dif().tier-1]}</b><button type="button" data-torm="1" ${dif().tier>=tormMax()?'disabled':''} aria-label="Monter le palier">+</button></span></div>${tormMax()<10?`<p class="cx-hint" style="margin:0;padding:0 var(--space-4) 8px">Palier ${ROM[tormMax()]} : réussis d'abord une mission au palier ${ROM[tormMax()-1]}.</p>`:''}</div>`:'<p class="cx-hint" style="margin:0">Toucher une difficulté la choisit et ferme la feuille.</p>';
$('rowDiff').onclick=()=>openPick('Difficulté',diffOpts(),i=>{meta.diff=i;saveMeta();newGame();refreshMenus();return i===3?{opts:diffOpts()}:null},tormExtra);
const setLv=v=>{meta.start=clamp(Math.round(+v)||1,1,LV_MAX);saveMeta();newGame();refreshMenus()};
$('lvMinus').onclick=()=>setLv((meta.start|0||1)-1);$('lvPlus').onclick=()=>setLv((meta.start|0||1)+1);
$('lvIn').addEventListener('change',e=>{setLv(e.target.value);e.target.value=meta.start});
$('relicBtn').onclick=()=>{$('mission').hidden=true;collLast='relics';navGo('coll')};
const setTorm=v=>{meta.torm=Math.max(1,Math.min(tormMax()||1,v));saveMeta();newGame();refreshMenus()};
document.querySelectorAll('.cx-pick[data-m]').forEach(b=>b.onclick=()=>{if(b.getAttribute('aria-disabled')==='true'){toast(MODES[b.dataset.m].coop?'La Brèche se joue à plusieurs : héberge une partie (bouton Coop) puis choisis-la.':`${UNL_BY[b.dataset.m].n} : ${UNL_BY[b.dataset.m].need.replace(/^./,c=>c.toLowerCase())}`);return}meta.mode=b.dataset.m;saveMeta();newGame();refreshMenus()});

