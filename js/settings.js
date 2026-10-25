// Crypte des Cendres — settings.js : réglages propres à l'appareil (son, tremblement, flash, vibrations, chiffres)
const SET_DEF={sfx:.7,music:.35,shake:1,flash:true,vib:true,dmgNum:true};
let SET=Object.assign({},SET_DEF);
try{Object.assign(SET,JSON.parse(localStorage.getItem('crypte-set')||'{}'))}catch(e){}
const saveSet=()=>{try{localStorage.setItem('crypte-set',JSON.stringify(SET))}catch(e){}};
let setFrom=null;
function openSettings(from){setFrom=from;drawSettings();$('settings').hidden=false}
function closeSettings(){$('settings').hidden=true}
function drawSettings(){
  const pct=v=>Math.round(v*100);
  const tog=(k,lab,hint)=>`<div class="setrow"><div><b>${lab}</b>${hint?`<span>${hint}</span>`:''}</div><button class="cx-chip cx-chip--sm" role="switch" aria-checked="${!!SET[k]}" data-set="${k}">${SET[k]?'Activé':'Désactivé'}</button></div>`;
  const sl=(k,lab)=>`<label class="setrow"><div><b>${lab}</b><span id="sv_${k}">${pct(SET[k])} %</span></div><input type="range" min="0" max="100" step="5" value="${pct(SET[k])}" data-vol="${k}" aria-label="${lab}"></label>`;
  const sh=[[1,'Normal'],[.5,'Réduit'],[0,'Désactivé']];
  $('setBody').innerHTML=`<section class="cx-section"><h3 class="cx-section__label">Son</h3>${sl('sfx','Effets sonores')}${sl('music','Musique')}
      <p class="cx-hint" style="margin:0">Le son démarre à ton premier geste dans le jeu (règle des navigateurs).</p></section>
    <section class="cx-section"><h3 class="cx-section__label">Écran</h3>
      <div class="setrow"><div><b>Tremblement</b><span>Coups reçus, compétences, ultime</span></div><div class="cx-chips" role="radiogroup" aria-label="Tremblement">${sh.map(([v,l])=>`<button class="cx-chip cx-chip--sm" role="radio" aria-checked="${SET.shake===v}" data-shake="${v}">${l}</button>`).join('')}</div></div>
      ${tog('flash','Flash de butin','Éclair doré quand une affixe recherchée ou un légendaire tombe')}
      ${tog('dmgNum','Chiffres de dégâts','Nombres au-dessus des ennemis touchés')}
      ${tog('vib','Vibrations','Quand tu es touché ou qu\'un légendaire tombe (téléphones Android)')}</section>
    <section class="cx-section"><h3 class="cx-section__label">Rendu</h3>
      <div class="setrow"><div><b>${PX?'WebGL (PixiJS)':'Standard (Canvas)'}</b><span>WebGL est plus fluide ; le rendu standard sert de secours.</span></div><button class="cx-btn cx-btn--sm" id="setRend">${PX?'Passer au standard':'Essayer WebGL'}</button></div></section>`;
}
document.addEventListener('DOMContentLoaded',()=>{});
(function wireSettings(){
  const body=$('setBody');
  body.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.set){const k=b.dataset.set;SET[k]=!SET[k];if(k==='vib'&&SET.vib&&navigator.vibrate)navigator.vibrate(30)}
    else if(b.dataset.shake!=null){SET.shake=+b.dataset.shake;if(G)G.hshake=6}
    else if(b.id==='setRend'){$('rendBtn').click();return}
    saveSet();drawSettings();SND.play('ui')});
  body.addEventListener('input',e=>{const k=e.target.dataset.vol;if(!k)return;SET[k]=+e.target.value/100;$('sv_'+k).textContent=e.target.value+' %';SND.vol();saveSet()});
  body.addEventListener('change',e=>{if(e.target.dataset.vol==='sfx')SND.play('pick2')});
  $('closeSet').onclick=closeSettings;$('closeSetX').onclick=closeSettings;
  $('setBtn').onclick=()=>openSettings('intro');$('setBtnBag').onclick=()=>openSettings('bag');
})();
/* Bannière : événements importants, un à la fois, au centre en haut */
const BN={q:[],busy:false};
function banner(html,col='#f0cf4a',prio=1){
  if(BN.q.length>=3){const i=BN.q.findIndex(x=>x.prio<prio);if(i<0)return;BN.q.splice(i,1)}
  BN.q.push({html,col,prio});BN.q.sort((a,b)=>b.prio-a.prio);if(!BN.busy)nextBanner()}
function nextBanner(){const m=BN.q.shift(),el=$('banner');if(!m){BN.busy=false;el.hidden=true;return}
  BN.busy=true;el.style.setProperty('--bc',m.col);el.innerHTML=m.html;el.hidden=false;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');
  setTimeout(nextBanner,m.prio>=2?2100:1700)}
let vibT=0;
function vibe(p){if(!SET.vib||!navigator.vibrate)return;const n=performance.now();if(n-vibT<120)return;vibT=n;try{navigator.vibrate(p)}catch(e){}}
