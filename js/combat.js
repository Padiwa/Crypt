// Crypte des Cendres — combat.js : dégâts, statuts, explosions, mort d'un ennemi et butin, coups reçus. Découpé de game.js en v145.
/* ---------- Combat ---------- */
const CS_N=8,CS_W=5;
const CB_TXT={archer:'projectiles +50 % plus rapides, +1 transpercement',magicien:'+50 % de rayon d\'explosion',guerrier:'+30 % de portée de frappe, +25 % de vitesse d\'attaque'};
function critTick(){const P=G.P;if(!P||G.over)return;G.crits=(G.crits||[]).filter(t=>t>G.t-CS_W);
  if(P.cbT>0)return;G.crits.push(G.t);
  if(G.crits.length>=CS_N&&G.t>=(P.cbCd||0)){P.cbT=5*(1+(S.skillDur||0)/100);G.crits=[];P.cbCd=G.t+P.cbT+3;refreshStats();
    G.rings.push({x:P.x,y:P.y,t:0,max:120,col:'255,211,77'});burst(P.x,P.y,24,'#ffd34d',200,3);G.hshake=Math.max(G.hshake||0,3);
    SND.play('frenzy');banner(`Frénésie critique · <span style="font-weight:500">${CB_TXT[G.cls]}</span>`,'#ffd34d',1)}}
function dmgEnemy(e,d,crit,dot){
  if(e.downed)return; // Capture : la cible à terre n'est plus touchée
  if(!dot&&S.lowDmg&&G.P.hp<S.hp*.5)d*=1+S.lowDmg/100;
  if(!dot&&S.execute&&e.hp<e.max*.3)d*=1+S.execute/100;
  if(S.bossDmg&&e.type==='boss')d*=1+S.bossDmg/100;
  if(G.inUlt>0&&e.type==='boss')d*=ULT_GX;
  if(e.elite==='bouclier'&&e.hp>e.max*.5)d*=.5;
  if(S.cold&&(e.slow>0||e.frz>0))d*=1+S.cold/100;
  if(e.curse>0)d*=1+(15+(S.hex||0))/100;
  if(S.cata>0&&stN(e)>=2)d*=1+S.cata/100;
  if(S.ccDmg>0&&(e.stun>0||e.root>0||e.frz>0))d*=1+S.ccDmg/100;
  if(e.mark>0)d*=1+e.markV/100; // Marque du corbeau (v143)
  if(S.abHunt&&(e.type==='boss'||e.elite))d*=1+S.abHunt/100;
  if(S.abSoul&&G.P.soulN)d*=1+G.P.soulN*S.abSoul/100;
  if(NET.guest){if(dot)return;if(S.abExec&&e.type!=='boss'&&e.hp-d<e.max*S.abExec/100)d=Math.max(d,e.hp);if(e.hp-d<=0)fluxKill();
    netHit(e,d,crit);e.hp=Math.max(1,e.hp-d);e.shown=2;if(crit)critTick();hitFx(e,d,crit);
    if(crit)riftTry(e,d);return}
  e.hp-=d;e.shown=2;
  if(S.abExec&&e.hp>0&&e.type!=='boss'&&e.type!=='cible'&&e.hp<e.max*S.abExec/100){e.hp=0;ftext(e.x,e.y-e.r-6,'jugé','#b07cff',14);burst(e.x,e.y,10,'#b07cff',140,3)}
  if(!dot&&crit)riftTry(e,d);
  if(!dot&&crit)critTick();
  if(!dot)hitFx(e,d,crit);
  else if(SET.dmgNum&&Math.random()<.25)ftext(e.x,e.y-e.r,Math.round(d),typeof dot==='string'?dot:'#ff9a4a',12);
  if(e.type==='cible'){if(e.hp<=0){e.hp=0;if(!e.downed){e.downed=true;burst(e.x,e.y,20,'#f0cf4a',160);toast('<b style="color:var(--r2)">La cible est à terre.</b> Reste près d\'elle pour la capturer.')}}}
  else if(e.hp<=0&&!e.dead)kill(e);
}
function podHurt(d){const p=G.pod;if(!p||G.over||GOD||NET.guest)return;d*=.6;p.hp-=d;p.flash=1;if(p.hp<=0){p.hp=0;gameOver('pod')}}
const itemLvl=()=>1+(G.level-1)*4+Math.floor(G.tl/45);
function wishBest(k){let b=null;const eq=(G&&G.eq)||curEq();for(const x of Object.values(eq))if(x&&x.aff&&x.aff[k]!=null){const v=NOSCALE[k]?x.aff[k]:x.aff[k]*upMul(x.up);if(b==null||v>b)b=v}return b}
function wishMatch(it){const W=meta.wish||{},hit=Object.keys(it.aff).filter(k=>{if(!(W.aff&&W.aff[k]))return false;const cur=wishBest(k),v=NOSCALE[k]?it.aff[k]:it.aff[k]*upMul(it.up);return cur==null||v>cur+1e-9});
  if(hit.length)return {aff:hit};if(it.r>=3&&W.leg)return {leg:1};return null}
let lfT=0;
function lootFlash(w,it){const now=performance.now(),el=$('lootFlash');
  if(now-lfT>350){lfT=now;SND.play(w.leg?'leg':'wish');vibe([30,40,30]);if(SET.flash){el.className='';void el.offsetWidth;el.className='on'+(w.leg?' leg':'')}}
}
function shatter(e){G.rings.push({x:e.x,y:e.y,t:0,max:95,col:'170,225,255'});burst(e.x,e.y,14,'#cfefff',180,3);SND.play('crit');G._sh=(G._sh||0)+1;
  if(G._sh<4)for(const o of G.en){if(!o.dead&&o!==e&&Math.abs(o.x-e.x)<120&&Math.hypot(o.x-e.x,o.y-e.y)<85+o.r){slowE(o,1.5);dmgEnemy(o,S.dmg*1.5,false)}}G._sh--}
// Momie (v136) : la première mort la fait seulement tomber ; elle se relève 1,8 s plus tard (momie relevée, plus rapide, moins de vie).
// Pas de butin ni d'expérience à la première mort. L'hôte décide ; l'invité ne montre que la chute.
function mummyFall(e){burst(e.x,e.y,16,'#cdb98c',150,3);burst(e.x,e.y,8,'#7dff8a',90,2);if(NET.guest)return;
  if(NET.host)netSend({t:'kill',id:e.id,type:'mummy',x:e.x|0,y:e.y|0,elite:0,corr:0,gen:0,nl:1});
  G.spawns.push({type:'mummyR',x:e.x,y:e.y,t:1.8,split:1,rise:1,tgtPod:!!e.tgtPod,corr:!!e.corr})}
// Malédiction contagieuse (v136) : l'ennemi maudit tué maudit ses voisins et leur inflige 150 % des dégâts.
function doomBurst(e){G.rings.push({x:e.x,y:e.y,t:0,max:95,col:'214,170,80'});burst(e.x,e.y,16,'#d8b060',180,3);SND.play('crit');G._dm=(G._dm||0)+1;
  if(G._dm<4)for(const o of G.en){if(!o.dead&&o!==e&&Math.abs(o.x-e.x)<120&&Math.hypot(o.x-e.x,o.y-e.y)<85+o.r){o.curse=Math.max(o.curse||0,slowT(5));dmgEnemy(o,S.dmg*1.5,false)}}G._dm--}
function kill(e){
  if(e.type==='mummy'){e.dead=true;mummyFall(e);return}
  e.dead=true;G.kills++;if(e.type==='boss')G.bossK=(G.bossK|0)+1;
  if(NET.host)netSend({t:'kill',id:e.id,type:e.type,x:e.x|0,y:e.y|0,elite:e.elite||0,corr:e.corr?1:0,gen:e.gen||0,nl:e.noLoot?1:0});
  if(S.abSoul){G.P.soulN=Math.min(10,(G.P.soulN||0)+1);G.P.soulT=5}
  if(S.abWard)G.P.shield=Math.max(G.P.shield||0,Math.min(S.hp*.3,(G.P.shield||0)+S.abWard));
  if(S.shard&&Math.random()*100<S.shard)shatter(e);
  if(S.doom&&e.curse>0&&Math.random()*100<S.doom)doomBurst(e);
  if(S.embr&&e.burnT>0)embrE(e);
  fluxKill();
  if(e.type==='slime'&&e.gen<2&&!NET.guest){burst(e.x,e.y,14,'#7fe0c8',150,3);
    for(const sd of[-1,1]){const a=rand(0,Math.PI*2)*0+Math.atan2(e.y-G.P.y,e.x-G.P.x)+sd*Math.PI/2+rand(-.4,.4);
      G.spawns.push({type:'slime',gen:e.gen+1,split:1,tgtPod:e.tgtPod,x:clamp(e.x+Math.cos(a)*e.r*.6,EDGE+30,MAP-EDGE-30),y:clamp(e.y+Math.sin(a)*e.r*.6,EDGE+30,MAP-EDGE-30),kx:Math.cos(a)*260,ky:Math.sin(a)*260,t:.12})}}
  if(e.twin&&!NET.guest)twinDied(e);
  const boss=e.type==='boss'&&!e.noLoot,L=G.level,DL=dif().loot,dl=1+DL*.5,lm=lootMul(L)*(1+(S.lootPct||0)/100)*(1+DL*.15)*biome().loot*(teamHas('fort')?1.1:1)*(1+petLootPct()/100),st=1+stayBonus();
  // v138 : un ennemi tué par l'ultime ne la recharge pas ; les autres remplissent une réserve versée peu à peu (ultCharge)
  if(!(G.inUlt>0)){if(boss)G.ult=Math.min(ultNeed(),(G.ult||0)+ULT_BOSS);else G.ultQ=Math.min(ULT_POOL,(G.ultQ||0)+ULT_KILL)}
  burst(e.x,e.y,boss?60:10,e.col,boss?320:150,4);burst(e.x,e.y,boss?20:4,'#e8853b',120);
  const push=(o,s=20)=>{const d=Object.assign({x:e.x+rand(-s,s),y:e.y+rand(-s,s),t:rand(0,6),age:0,mt:0},o);G.drops.push(d);if(o.kind==='item'){const w=wishMatch(o.item);if(w){d.wish=1;lootFlash(w,o.item)}}else if(o.kind==='part'&&o.part.full&&meta.wish&&meta.wish.leg&&!ownedW(o.part.w)){d.wish=1;lootFlash({leg:1},null)}};
  sealLoot(e,push);
  if(boss){
    push({kind:'item',item:genItem(itemLvl(),2)},40);push({kind:'item',item:genItem(itemLvl(),1)},40);push({kind:'relic',id:relicDrop()},40);push({kind:'potion'},40);
    for(let i=0;i<Math.floor((L-1)/10);i++)push({kind:'item',item:genItem(itemLvl(),1)},50);
    if(BAL.bossRelicEvery)for(let i=0;i<Math.floor((L-1)/BAL.bossRelicEvery);i++)push({kind:'relic',id:relicDrop()},50);
    if(Math.random()<Math.min(1,.15*lm*st))push({kind:'part',part:rollPart()},40);
    if(Math.random()<hfChance())push({kind:'part',part:{hf:1}},40);
    for(let i=0;i<2;i++)push({kind:'mod',id:rollMod(true)},40);
    meta.essence+=25;saveMeta();G.shake=14;SND.play('bossdie');banner('Gardien vaincu · son butin est à toi','#e8853b',2);
    if(!G.en.some(o=>o.type==='boss'&&!o.dead))$('bossBar').hidden=true;
  }else{
    const t=e.type;
    if(Math.random()<({ghoul:.006,bat:.002,archer:.008,poison:.008,pyro:.008,brute:.035,slime:.0035,givrin:.007,scarab:.002,mummyR:.009})[t]*lm*st)push({kind:'item',item:genItem(itemLvl())});
    if(Math.random()<({ghoul:.003,bat:.001,archer:.004,poison:.004,pyro:.004,brute:.025,slime:.0018,givrin:.0035,scarab:.001,mummyR:.0045})[t]*BAL.relicMob*(1+tormBoost().relic)*st)push({kind:'relic',id:relicDrop()});
    if(L>1&&Math.random()<({ghoul:.0015,bat:.0005,archer:.002,poison:.002,pyro:.002,brute:.012,slime:.0009,givrin:.0018,scarab:.0005,mummyR:.0022})[t]*(lm-1)*st)push({kind:'part',part:rollPart()});
    if(e.corr)push({kind:'react'},6);
    if(Math.random()<({ghoul:.006,bat:.002,archer:.008,poison:.008,pyro:.008,brute:.06,slime:.004,givrin:.007,scarab:.002,mummyR:.009})[t]*st)push({kind:'mod',id:rollMod(false)});
    if(Math.random()<(t==='brute'?.05:.005))push({kind:'potion'});
  }
  if(e.elite){push({kind:'item',item:genItem(itemLvl(),1)},30);if(Math.random()<.4*st)push({kind:'item',item:genItem(itemLvl(),1)},30);if(Math.random()<BAL.relicElite*(1+tormBoost().relic)*st)push({kind:'relic',id:relicDrop()},30);
    if(e.elite==='explosif'&&!NET.guest)G.lobs.push({x0:e.x,y0:e.y,tx:e.x,ty:e.y,t:0,T:.7,kind:'pyro',r:95,dps:2*diff().ds});
    burst(e.x,e.y,30,ELITE[e.elite].c,240,4);SND.play('bossdie');toast(`<b style="color:${ELITE[e.elite].c}">Élite ${ELITE[e.elite].n} vaincue</b>`)}
  const gv=({ghoul:1,bat:.6,archer:1.5,poison:1.5,pyro:1.5,brute:5,boss:50,slime:.8,givrin:1.2,scarab:.6,mummyR:1.6})[e.type]*goldMul(L)*dl*(e.elite?5:1),n=boss?8:e.elite?5:(Math.random()<Math.min(1,(e.type==='bat'||e.type==='scarab'?.35:.65)*(1+.05*(L-1)))?1:0);
  for(let i=0;i<n;i++)push({kind:'gold',amt:Math.max(1,Math.round(gv/(boss?8:1)*rand(.7,1.3)))},boss?45:15);
  const xv=({ghoul:1,bat:1,archer:2,poison:2,pyro:2,brute:5,boss:30,slime:1,givrin:1,scarab:1,mummyR:2})[e.type]*(e.elite?6:1);
  if(G.nxp>220){for(let k=0;k<12;k++){const o=G.drops[Math.floor(Math.random()*G.drops.length)];if(o&&o.kind==='xp'){o.v+=xv;break}}}
  else{push({kind:'xp',v:xv},6);G.nxp++}
  if(G.cls==='guerrier'&&hasTal('g_blood'))heal(S.hp*.02);
}
function dotHurt(d){if(GOD||G.over||d<=0||G.P.down)return;const P=G.P;d*=1-S.armor/200;P.hp-=d;P.noHit=0;if(P.hp<=0){P.hp=0;NET.on?heroDown():gameOver()}}
function hurt(d){
  const P=G.P;if(P.inv>0||P.dashT>0||P.leapT>0||GOD||P.down)return 0;const d0=d;
  if(P.wallT>0)wallReflect(d);
  d*=1-S.armor/100;if(P.hp<S.hp*.3)d*=1-S.lowArmor/100;if(P.spin>0)d*=.5;if(P.criT>0)d*=.7;if(P.peauT>0)d*=1-S.peau/100;if(P.ferT>0)d*=1-S.exFer/100;P.noHit=0;
  if(P.shield>0){const ab=Math.min(P.shield,d);P.shield-=ab;d-=ab;if(d<=0){P.inv=.35;ftext(P.x,P.y-P.r,'bloqué','#9fd0ff',13);return d0}}
  P.hp-=d;P.flash=1;P.inv=.35;SND.play('hurt');vibe(d/S.hp>.15?60:25);G.hshake=Math.max(G.hshake||0,Math.min(12,4+d/S.hp*45));
  ftext(P.x,P.y-P.r,'-'+Math.round(d),'#ff5a5a',16);
  if(P.hp<=0){P.hp=0;NET.on?heroDown():gameOver()}
  return d0;
}
function heal(v){G.P.hp=Math.min(S.hp,G.P.hp+v)}
// Épines (affixe) : renvoie une part des dégâts reçus à l'attaquant.
const thornE=(e,v)=>{if(S.thorns>0&&e&&!e.dead&&!e.downed&&v>0)dmgEnemy(e,v*S.thorns/100,false)};
// Durée d'un ralentissement : allongée par la durée des compétences (affixe, Persistance, Prolongation) ; un ralentissement plus long en cours est gardé.
const slowT=t=>t*(1+(S.skillDur||0)/100),slowE=(e,t)=>{e.slow=Math.max(e.slow||0,slowT(t))};
/* Statuts (v141) : feu, poison (couches), saignement (3 à la fois), givre, étourdir et immobiliser (immunité après), éclair en chaîne.
   Posés à l'impact par onHit (attaque, sort, ultime ; explosions avec Déflagration). Les dégâts sur la durée ne déclenchent pas les effets à l'impact.
   Coopération : l'invité pose ses statuts sur sa copie et les envoie à l'hôte (NET.sa), qui tient les statuts de tous les monstres. */
const stDurM=()=>1+(S.stDur||0)/100;
const stN=e=>(e.burnT>0)+(e.psnT>0)+(e.bldT>0)+(e.slow>0||e.frz>0)+(e.stun>0)+(e.root>0)+(e.curse>0);
const netSA=(e,k,v,t,n)=>{if(NET.guest&&e.id!=null)(NET.sa||(NET.sa=[])).push([e.id,k,Math.round(v*10)/10,Math.round(t*100)/100,n||1])};
function burnE(e,v){if(!(v>0)||e.downed)return;e.burnDps=e.burnT>0?Math.max(e.burnDps||0,v):v;e.burnT=Math.max(e.burnT||0,2.5*stDurM())}
function psnAdd(e,v,n,t){const N=e.psnT>0?e.psnN|0:0,M=Math.min(PSN_MAX,N+n),s0=N?e.psnS||0:0;
  e.psnS=M>N?(s0*N+v*(M-N))/M:Math.max(s0,(s0*(M-1)+v)/M);e.psnN=M;e.psnT=Math.max(e.psnT>0?e.psnT:0,t)}
function psnE(e,d,n=1){const v=d*PSN_PCT/100*(1+(S.dotPct||0)/100),t=PSN_T*stDurM();psnAdd(e,v,n,t);netSA(e,1,v,t,n);
  // Peste : à 10 couches, le poison passe aux ennemis proches (une fois par seconde et par ennemi)
  if(S.peste&&e.psnN>=PSN_MAX&&!(e.pstT>0)){e.pstT=1;G.rings.push({x:e.x,y:e.y,t:.1,max:120,col:'140,225,100'});
    for(const o of G.en){if(o===e||o.dead||o.downed||o.type==='cible'||Math.abs(o.x-e.x)>120+o.r||Math.hypot(o.x-e.x,o.y-e.y)>120+o.r)continue;psnAdd(o,e.psnS,S.peste,t);netSA(o,1,e.psnS,t,S.peste)}}}
function bldAdd(e,v,t){const B=e.bld||(e.bld=[]);if(!(e.bldT>0))B.length=0;
  if(B.length<BLD_MAX)B.push({v,t});else{let w=0;for(let i=1;i<B.length;i++)if(B[i].v*B[i].t<B[w].v*B[w].t)w=i;if(v*t>B[w].v*B[w].t)B[w]={v,t}}
  e.bldT=Math.max(e.bldT>0?e.bldT:0,t)}
function bldE(e,d,crit){let v=d*BLD_PCT/100/BLD_T*(1+(S.dotPct||0)/100);if(crit&&S.hemo)v*=1+S.hemo/100;const t=BLD_T*stDurM();bldAdd(e,v,t);netSA(e,2,v,t);
  if(S.soif)heal(Math.min(v*t,Math.max(0,e.hp))*S.soif/100)}
// Étourdi : ne bouge plus et n'attaque plus. Immobilisé : ne bouge plus mais attaque encore. Immunité courte après ; Gardiens : durée ÷ 3 et ÷ 2.
function stunE(e,t,raw){if(e.type==='cible'||e.downed||e.stunI>0)return false;if(!raw&&e.type==='boss')t/=3;e.stun=Math.max(e.stun||0,t);e.stunI=t+STUN_IMM;netSA(e,3,0,t);return true}
function rootE(e,t,raw){if(e.type==='cible'||e.downed||e.rootI>0)return false;if(!raw&&e.type==='boss')t/=2;e.root=Math.max(e.root||0,t);e.rootI=t+ROOT_IMM;netSA(e,4,0,t);return true}
// Givre : ralentit ; Cryogénie gèle un ennemi déjà ralenti (Gardiens : ralentis 1 s de plus), puis courte immunité au gel.
function chillE(e){const was=e.slow>0;slowE(e,2*stDurM());if(S.cryo&&was&&!(e.cryI>0)){e.cryI=S.cryo+1.5;if(e.type==='boss')e.slow+=1;else e.frz=Math.max(e.frz||0,S.cryo)}}
// o : {f:1} pose à coup sûr (Pointe de diamant), {m:x} multiplie les chances (Déflagration).
function onHit(e,d,crit,o){const f=o&&o.f,ul=G.inUlt>0,m=((o&&o.m)||1)*(ul&&S.flea>0?S.flea:1)*(!ul&&G.inSp>0&&S.impr>0?S.impr:1),ch=(c,cap=60)=>c>0&&(f||Math.random()*100<Math.min(Math.max(c,cap),c*m));
  if(S.shock&&Math.random()*100<Math.min(Math.max(S.shock,ST_CAP.shock),S.shock*m))chain(e,d*.6);
  if(e.dead||e.downed)return;
  if(S.curse&&Math.random()*100<Math.min(Math.max(S.curse,60),S.curse*m))e.curse=Math.max(e.curse||0,slowT(5));if(S.frz&&e.type!=='boss'&&Math.random()*100<Math.min(Math.max(S.frz,40),S.frz*m)){e.frz=1;slowE(e,1.5)}
  const ap=[];
  if(S.burn>0){burnE(e,S.burn);ap.push(0)}
  if(ch(S.chill)){chillE(e);ap.push(1)}
  if(ch(S.psnCh)){psnE(e,d);ap.push(2)}
  if(ch(S.bldCh)||(crit&&S.hemo)){bldE(e,d,crit);ap.push(3)}
  if(ch(S.stunCh,ST_CAP.stunCh)&&stunE(e,STUN_T))ap.push(4);
  if(ch(S.rootCh,ST_CAP.rootCh)&&rootE(e,slowT(ROOT_T)*stDurM()))ap.push(5);
  if(ap.length&&S.contag&&Math.random()*100<S.contag)contagE(e,d,crit,ap)}
// Contagion : les statuts posés touchent aussi l'ennemi le plus proche (120 px).
function contagE(e,d,crit,ap){let o=null,od=120;for(const x of G.en){if(x===e||x.dead||x.downed||x.type==='cible')continue;const dd=Math.hypot(x.x-e.x,x.y-e.y)-x.r;if(dd<od){od=dd;o=x}}if(!o)return;
  const T=.3;for(let i=0;i<6;i++)G.parts.push({x:e.x,y:e.y,vx:(o.x-e.x)/T+rand(-40,40),vy:(o.y-e.y)/T+rand(-40,40),life:T,max:T,col:'#c6e36a',size:2.4,g:1});
  for(const k of ap){if(k===0)burnE(o,S.burn);else if(k===1)chillE(o);else if(k===2)psnE(o,d);else if(k===3)bldE(o,d,crit);else if(k===4)stunE(o,STUN_T);else if(k===5)rootE(o,slowT(ROOT_T)*stDurM())}}
// Coup direct (attaque, projectile, sort) : critique conditionnel (Œil du chasseur, Boucherie) contre un ennemi qui porte un statut, puis dégâts et statuts.
function hitE(e,d,crit,o){const sp=G.inSp>0&&!(G.inUlt>0),hs=(S.critSt>0||S.cdSt>0)&&stN(e)>0;
  if(sp&&S.intSt>0&&stN(e)>0)d*=1+S.intSt/100;
  if(hs&&!crit&&S.critSt>0&&Math.random()*(100-S.crit)<S.critSt){crit=true;d*=S.critDmg/100}
  if(hs&&crit&&S.cdSt>0)d*=(S.critDmg+S.cdSt)/S.critDmg;
  dmgEnemy(e,d,crit);onHit(e,d,crit,o);
  if(!e.dead&&!e.downed){if(sp&&S.comm>0)stunE(e,S.comm);else if(!sp&&!(G.inUlt>0)&&G.P.ripoN&&S.ripo>0){G.P.ripoN=0;stunE(e,S.ripo)}}
  return d}
// Flux (v142) : un ennemi abattu par le sort retire du temps à sa recharge, 2 s au plus par lancer.
function fluxKill(){const P=G.P;if(!(S.flux>0)||!(G.inSp>0)||G.inUlt>0||!(P.fluxB>0))return;const r=Math.min(P.fluxB,S.flux);P.fluxB-=r;P.novaCd=Math.max(0,P.novaCd-r)}
// Bouclier ajouté par un mod : jamais au-delà de 50 % de la vie (un bouclier plus grand déjà là est gardé).
function addShield(v){const P=G.P;P.shield=Math.max(P.shield||0,Math.min(S.hp*.5,(P.shield||0)+v))}
// Embrasement : un ennemi qui meurt en brûlant enflamme ses voisins.
function embrE(e){G.rings.push({x:e.x,y:e.y,t:.1,max:S.embr,col:'255,140,60'});
  for(const o of G.en){if(o===e||o.dead||o.downed||o.type==='cible')continue;if(Math.abs(o.x-e.x)<S.embr+o.r&&Math.hypot(o.x-e.x,o.y-e.y)<S.embr+o.r)burnE(o,e.burnDps)}}
// Dégâts sur la durée (hôte et partie seule) : feu, poison, saignement.
function dotTick(e,dt){
  if(e.burnT>0){e.burnT-=dt;e.burnAcc+=e.burnDps*dt;if(e.burnAcc>=1){const d=Math.floor(e.burnAcc);e.burnAcc-=d;dmgEnemy(e,d,false,true)}
    if(Math.random()<dt*8)G.parts.push({x:e.x+rand(-e.r,e.r)*.6,y:e.y+rand(-e.r,e.r)*.4,vx:0,vy:-50,life:.5,max:.5,col:'#ff8a3a',size:2.5})}
  if(e.dead)return;
  if(e.psnT>0){e.psnT-=dt;e.psnAcc=(e.psnAcc||0)+e.psnN*e.psnS*dt;if(e.psnAcc>=1){const d=Math.floor(e.psnAcc);e.psnAcc-=d;dmgEnemy(e,d,false,'#9be36a')}if(e.psnT<=0){e.psnN=0;e.psnAcc=0}}
  if(e.dead)return;
  if(e.bldT>0){e.bldT-=dt;let v=0,x=0;for(const b of e.bld){if(b.t>0){v+=b.v;b.t-=dt}else x=1}if(x)e.bld=e.bld.filter(b=>b.t>0);
    e.bldAcc=(e.bldAcc||0)+v*dt;if(e.bldAcc>=1){const d=Math.floor(e.bldAcc);e.bldAcc-=d;dmgEnemy(e,d,false,'#ff6a6a')}if(e.bldT<=0){e.bld.length=0;e.bldAcc=0}}}
// Minuteries des contrôles et visuels des nouveaux statuts (hôte et invité) : gouttes vertes qui montent (poison), gouttes rouges qui tombent (saignement).
function stTick(e,dt){
  if(e.mark>0)e.mark-=dt;if(e.stun>0)e.stun-=dt;if(e.stunI>0)e.stunI-=dt;if(e.root>0)e.root-=dt;if(e.rootI>0)e.rootI-=dt;if(e.cryI>0)e.cryI-=dt;if(e.pstT>0)e.pstT-=dt;
  if(e.psnT>0&&Math.random()<dt*10)G.parts.push({x:e.x+rand(-e.r,e.r)*.7,y:e.y-e.r*.2+rand(-e.r,e.r)*.3,vx:rand(-6,6),vy:-36,life:.8,max:.8,col:'#b6f24a',size:3,g:1});
  if(e.bldT>0&&Math.random()<dt*10)G.parts.push({x:e.x+rand(-e.r,e.r)*.6,y:e.y,vx:rand(-6,6),vy:66,life:.5,max:.5,col:'#ff3b48',size:2.8,g:1})}
function gainMod(id){
  const m=MODS[id],c=MOD_RAR[m.r].c;
  if(meta.mods[id]==null){
    meta.mods[id]=0;let msg=`Nouveau mod : <span style="color:${c}">${m.n}</span>`;
    const kd=modKind(id);
    if(kd==='a'){if(!meta.aura[heroCls]){meta.aura[heroCls]=id;refreshStats();msg+=' · aura équipée'}}
    else if(modOk(id,heroCls)&&(kd!=='p'||petEq()&&(!m.pt||m.pt===petEq().t))){const b=build(kd),bs=bBest(b,id,0);if(bs.i>=0&&bUsed(b)+bs.d<=bCap(b)){b.load[bs.i]=id;refreshStats();if(kd==='p'&&G.pet)G.petS=petStats();msg+=kd==='w'?' · équipé sur l\'arme':kd==='p'?' · équipé sur le familier':' · équipé sur le héros'}}
  }else if(modCanStar(id)&&modSt(id)<MOD_ST_MAX){meta.modCp[id]=(meta.modCp[id]|0)+1}
  else{const e=8*(m.r+1);meta.essence+=e}
  saveMeta();
}
function chain(src,d){
  const t=G.en.filter(o=>o!==src&&!o.dead&&!o.downed).map(o=>[o,Math.hypot(o.x-src.x,o.y-src.y)]).filter(a=>a[1]<240).sort((a,b)=>a[1]-b[1]).slice(0,3+(S.surt>0?surtJ(S.surt):0));
  let px=src.x,py=src.y;for(const [o] of t){G.zaps.push({x1:px,y1:py,x2:o.x,y2:o.y,t:0});px=o.x;py=o.y;dmgEnemy(o,d,false);if(S.surt>0&&!o.dead)stunE(o,S.surt)}
}
function explode(s,primary,frost){
  const R=(frost?85*(1+S.skillRad/100):55)*(1+S.splash/100);
  G.rings.push({x:s.x,y:s.y,t:.22,max:R,col:'140,190,255'});burst(s.x,s.y,8,'#9fc8ff',140,3);
  const sp=G.inSp>0&&!(G.inUlt>0);
  for(const e of G.en){if(e===primary||e.dead)continue;if(Math.abs(e.x-s.x)<R+e.r&&Math.hypot(e.x-s.x,e.y-s.y)<R+e.r){const ist=sp&&S.intSt>0&&stN(e)>0;if(frost)slowE(e,2.5);let dd=s.d*(frost?1:.6);if(ist)dd*=1+S.intSt/100;dmgEnemy(e,dd,false);if(S.defl>0)onHit(e,dd,false,{m:S.defl/100});else burnE(e,S.burn);if(sp&&S.comm>0&&!e.dead&&!e.downed)stunE(e,S.comm)}}
}
function fireE(e,a,sp,d,r=7){G.eb.push({id:++G.bid,x:e.x+Math.cos(a)*e.r,y:e.y+Math.sin(a)*e.r,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,d,r,life:4,src:e})}
function ring(e,n,sp){e.rot+=.27;for(let i=0;i<n;i++)fireE(e,e.rot+i/n*Math.PI*2,sp,e.dmg*.55,8)}
// Retour d'un coup sur un monstre : son, éclat blanc, chiffre de dégâts (critique en doré).
const hitFx=(e,d,crit)=>{SND.play(crit?'crit':'hit');e.flash=1;if(SET.dmgNum&&(crit||G.en.length<60))ftext(e.x+rand(-8,8),e.y-e.r,Math.round(d)+(crit?'!':''),crit?'#ffd34d':'#f1e8d6',crit?20:15)};
// Faille (abyssal) : un critique peut lancer des éclairs en chaîne (70 % des dégâts) ; pas de chaîne depuis une chaîne.
const riftTry=(e,d)=>{if(S.abRift&&!G._rift&&Math.random()*100<S.abRift){G._rift=1;chain(e,d*.7);G._rift=0}};
// Coup qui peut être critique : les dégâts critiques s'appliquent (Pluie d'acier, météores).
// Récompense de capture (chaque joueur reçoit la sienne).
function capReward(){objDone();const r=relicDrop(true);G.loot.relics.push(r);G.fresh++;G.gold+=60*G.level;
  toast(`<b style="color:var(--r2)">Cible capturée.</b> ${relicName(r)} et ${60*G.level} or. Rejoins l'extraction, ou traque la cible suivante.`)}
// Ligne de tir dégagée entre un monstre et sa cible (5 points testés sur le trajet).
const losClear=(e,dx,dy)=>{for(let k=1;k<6;k++)if(blocked(e.x+dx*k/6,e.y+dy*k/6,4))return false;return true};
function blocked(x,y,r){
  if(x<EDGE+r||x>MAP-EDGE-r||y<EDGE+r||y>MAP-EDGE-r)return true;
  for(const p of G.pillars){if(p===G.pod)continue;const m=p.r+r;if(Math.abs(p.x-x)<m&&Math.abs(p.y-y)<m&&Math.hypot(p.x-x,p.y-y)<m)return true}
  return false;
}
function resolve(o){
  let hit=false;const lo=EDGE+o.r,hi=MAP-EDGE-o.r;
  if(o.x<lo){o.x=lo;hit=true} if(o.x>hi){o.x=hi;hit=true} if(o.y<lo){o.y=lo;hit=true} if(o.y>hi){o.y=hi;hit=true}
  for(const p of G.pillars){const m=p.r+o.r;if(Math.abs(o.x-p.x)>m||Math.abs(o.y-p.y)>m)continue;const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy)||1;if(d<m){o.x=p.x+dx/d*m;o.y=p.y+dy/d*m;hit=true}}
  return hit;
}

