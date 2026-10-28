// Crypte des Cendres — save.js : Réglages › Sauvegarde (exporter, importer, recommencer à zéro) et ses actions. Découpé de camp.js en v135.
let saveMode=null,saveDraft='',saveMsg='',savePending=null;
// Fichier de sauvegarde prêt à réimporter (bouton « Depuis un fichier » de l'import).
const saveName=()=>`crypte-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;
function saveBlob(){return new Blob([exportCode()],{type:'application/json'})}
function downloadSave(){try{const url=URL.createObjectURL(saveBlob()),a=document.createElement('a');a.href=url;a.download=saveName();a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);saveMsgOk=`Fichier « ${saveName()} » enregistré dans tes téléchargements.`;return true}catch{saveMsgOk='';saveMsg='Le téléchargement a échoué : utilise Partager ou Copier le JSON.';return false}}
const canShareFile=()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File(['{}'],'t.json',{type:'application/json'})]}))}catch{return false}};
async function shareSave(){try{await navigator.share({files:[new File([saveBlob()],saveName(),{type:'application/json'})],title:'Sauvegarde Crypte des Cendres'});saveMsgOk='Fichier partagé.'}catch(e){if(e&&e.name!=='AbortError'){saveMsg='Le partage a échoué : utilise Télécharger ou Copier le JSON.'}}drawCamp()}
let saveMsgOk='';
function exportCode(){const data={v:1,meta,cls:heroCls,best,at:new Date().toISOString().slice(0,10)};return JSON.stringify({jeu:'Crypte des Cendres',...data},null,2)}
function parseCode(t){t=(t||'').trim();if(t.startsWith('CRYPTE1:'))t=t.slice(8);let d=null;
  try{d=JSON.parse(decodeURIComponent(escape(atob(t.replace(/\s+/g,'')))))}catch{try{d=JSON.parse(t)}catch{return null}}
  if(!d||typeof d!=='object'||!d.meta||typeof d.meta.gold!=='number')return null;return d}
const sumOf=m=>`${m.gold} or, ${m.essence||0} essence, ${Object.keys(m.mods||{}).length} mods, ${Object.values(m.relics||{}).reduce((a,r)=>a+(r[0]||0)+(r[1]||0),0)} reliques`;
function saveSection(){
  let h=`<h3 class="cx-section__label">Sauvegarde</h3><p class="empty" style="font-size:13px;margin:0"><b>Exporter</b> enregistre un fichier .json de ta progression, prêt à réimporter. Pour la restaurer, ici ou sur un autre appareil : <b>Importer</b>, puis <b>Depuis un fichier</b> (ou colle le JSON).</p>
    <div class="actions"><button class="btn${saveMode==='exp'?' main':''}" data-cact="exp">Exporter</button><button class="btn${saveMode==='imp'?' main':''}" data-cact="impopen">Importer</button></div>`;
  const tail=resetHtml();
  if(saveMode==='exp')h+=`${saveMsgOk?`<p class="empty" style="font-size:13px;color:var(--heal)">${esc(saveMsgOk)}</p>`:''}<div class="actions"><button class="btn main" data-cact="savedl">Télécharger le fichier</button>${canShareFile()?'<button class="btn" data-cact="saveshare">Partager le fichier</button>':''}<button class="btn" data-cact="copy">Copier le JSON</button></div>
    <details class="savemore"><summary>Voir le JSON</summary><textarea id="saveOut" class="savebox" readonly rows="8">${esc(exportCode())}</textarea></details>`;
  if(saveMode==='imp'){
    if(savePending)h+=`<div class="card"><p style="margin:0;font-size:14px">Remplacer ta progression actuelle (${sumOf(meta)}) par ${savePending.bak?`la progression effacée le ${esc(savePending.at)}`:'celle du JSON'} (${sumOf(savePending.meta)}${savePending.at&&!savePending.bak?`, exportée le ${esc(savePending.at)}`:''}) ?</p><div class="actions"><button class="btn main" data-cact="impok">Remplacer et recharger</button><button class="btn" data-cact="impcancel">Annuler</button></div></div>`;
    else h+=`<textarea id="saveIn" class="savebox" rows="5" placeholder="Colle ici le JSON de ta sauvegarde">${esc(saveDraft)}</textarea>
      <div class="actions"><button class="btn main" data-cact="imp">Restaurer</button><label class="btn" style="text-align:center;cursor:pointer">Depuis un fichier<input type="file" id="saveFile" accept=".txt,.json,text/plain,application/json" hidden></label></div>`;
  }
  if(saveMsg)h+=`<p class="empty" style="font-size:13px;color:var(--blood)">${saveMsg}</p>`;
  return h+tail;
}
/* Recommencer à zéro (v135) : efface la progression (sauvegarde, dernier héros, meilleur temps, partie de coopération retenue)
   et recharge le jeu ; les réglages restent. Une copie de secours (crypte-reset-bak) reste sur l'appareil jusqu'à la réinitialisation suivante. */
const RESET_KEYS=['crypte-meta','crypte-cls','crypte-best2','crypte-coop'];
function resetBak(){try{const b=JSON.parse(localStorage.getItem('crypte-reset-bak')||'null');return b&&b.meta?b:null}catch{return null}}
const atFr=iso=>{try{return new Date(iso).toLocaleString('fr-FR',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}catch{return iso}};
function resetHtml(){const bak=resetBak();let h=`<div class="savereset"><div class="setrow"><div><b>Recommencer à zéro</b><span>Efface toute ta progression sur cet appareil : héros, objets, armes, mods, familiers, reliques, or, essence, déblocages. Tes réglages (son, écran) restent.</span></div>${saveMode==='rst'?'':'<button class="cx-btn cx-btn--sm cx-btn--danger" data-cact="rstask">Recommencer</button>'}</div>`;
  if(saveMode==='rst')h+=`<div class="card"><p style="margin:0;font-size:14px"><b>Tout effacer et recommencer du début ?</b> Ta progression actuelle (${sumOf(meta)}) sera remplacée par une partie neuve. Exporte-la d'abord si tu veux pouvoir la reprendre sur un autre appareil ; une copie de secours reste aussi sur celui-ci, jusqu'à la prochaine réinitialisation.</p>
    <div class="actions"><button class="btn" data-cact="exp">Exporter d'abord</button><button class="cx-btn cx-btn--danger" data-cact="rstok">Effacer et recommencer</button><button class="btn" data-cact="rstcancel">Annuler</button></div></div>`;
  if(bak&&saveMode!=='rst')h+=`<p class="cx-hint" style="margin:0">Copie de secours de la progression effacée le ${esc(atFr(bak.at))} : <button class="cx-btn cx-btn--sm cx-btn--ghost" data-cact="rstback">Restaurer</button></p>`;
  return h+'</div>'}
function resetSave(){try{localStorage.setItem('crypte-reset-bak',JSON.stringify({at:new Date().toISOString(),meta:JSON.stringify(meta),cls:heroCls,best}));
    saveLock=true;for(const k of RESET_KEYS)localStorage.removeItem(k);location.reload();return true}catch{saveLock=false;saveMsg='Impossible d\'effacer la sauvegarde : le stockage de ce navigateur est bloqué.';return false}}

Object.assign(CAMP_ACT,{
  exp:function(a,arg,b,d){{saveMsg='';savePending=null;saveMsgOk='';if(saveMode!=='exp'){saveMode='exp';downloadSave()}else saveMode=null}return CAMP_GO},
  savedl:function(a,arg,b,d){{saveMsg='';downloadSave()}return CAMP_GO},
  saveshare:function(a,arg,b,d){{saveMsg='';shareSave();return}return CAMP_GO},
  impopen:function(a,arg,b,d){{saveMode=saveMode==='imp'?null:'imp';saveMsg='';savePending=null}return CAMP_GO},
  copy:function(a,arg,b,d){{const code=exportCode(),ta=$('saveOut'),sel=()=>{if(ta){ta.focus();ta.select()}};
      try{navigator.clipboard.writeText(code).then(()=>toast('JSON copié'),()=>{sel();toast('Copie refusée : le JSON est sélectionné, copie-le à la main.')})}catch{sel();toast('Le JSON est sélectionné, copie-le à la main.')}return}return CAMP_GO},
  imp:function(a,arg,b,d){{const v=($('saveIn')||{}).value||saveDraft;saveDraft=v;const dd=parseCode(v);if(!dd)saveMsg='Ce JSON n\'est pas une sauvegarde valide. Vérifie qu\'il est complet, de la première accolade à la dernière.';else{savePending=dd;saveMsg=''}}return CAMP_GO},
  impcancel:function(a,arg,b,d){{savePending=null}return CAMP_GO},
  rstask:function(a,arg,b,d){{saveMode='rst';saveMsg='';savePending=null}return CAMP_GO},
  rstcancel:function(a,arg,b,d){{saveMode=null}return CAMP_GO},
  rstok:function(a,arg,b,d){{if(resetSave())return}return CAMP_GO},
  rstback:function(a,arg,b,d){{const b=resetBak();if(b){try{savePending={meta:JSON.parse(b.meta),cls:b.cls,best:b.best,at:atFr(b.at),bak:true};saveMode='imp';saveMsg=''}catch{saveMsg='La copie de secours est illisible.'}}}return CAMP_GO},
  impok:function(a,arg,b,d){{const dd=savePending;try{localStorage.setItem('crypte-meta',JSON.stringify(dd.meta));if(dd.cls)localStorage.setItem('crypte-cls',dd.cls);if(dd.best)localStorage.setItem('crypte-best2',String(dd.best));location.reload();return}catch{saveMsg='Impossible d\'écrire la sauvegarde : le stockage de ce navigateur est bloqué.'}}return CAMP_GO},
});
