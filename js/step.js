// Crypte des Cendres — step.js : grille spatiale et pas de simulation update(dt). Découpé de game.js en v145.
/* ---------- Grille spatiale ---------- */
const CELL=64,GW=Math.ceil(MAP/CELL);let gHead=new Int32Array(GW*GW),gNext=new Int32Array(512);
function gridBuild(){gHead.fill(-1);const L=G.en;if(gNext.length<L.length)gNext=new Int32Array(L.length*2);
  for(let i=0;i<L.length;i++){const e=L[i];if(e.downed)continue;const cx=clamp(e.x/CELL|0,0,GW-1),cy=clamp(e.y/CELL|0,0,GW-1),c=cy*GW+cx;gNext[i]=gHead[c];gHead[c]=i}}
function gridEach(x,y,r,fn){const x0=clamp((x-r)/CELL|0,0,GW-1),x1=clamp((x+r)/CELL|0,0,GW-1),y0=clamp((y-r)/CELL|0,0,GW-1),y1=clamp((y+r)/CELL|0,0,GW-1);
  for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)for(let i=gHead[cy*GW+cx];i>=0;i=gNext[i]){const e=G.en[i];if(e&&fn(e,i)===false)return}}
function compact(arr,alive){let j=0;for(let i=0;i<arr.length;i++){const o=arr[i];if(alive(o))arr[j++]=o}arr.length=j}
/* ---------- Mise à jour ---------- */
function update(dt){
  if(NET.guest)netApplySnap();
  G.t+=dt;if(!lordOn())G.tl+=dt; // v147 : la manche (et l'horloge de mission) attend la fin du combat contre un Boss
  // Tourment : toutes les 2 minutes de séjour, le bonus des reliques grandit (annoncé tant qu'il augmente)
  {const s=sejN();if(s>(G.sejSeen|0)){G.sejSeen=s;const b=tormBoost();if(b.t&&G.relQ.length&&(s*(BAL.sejReact||0)<=(BAL.sejReactMax||0)+1e-9||s*(BAL.sejRelic||0)<=(BAL.sejRelicMax||0)+1e-9))toast(`<b style="color:#ff6a3a">Séjour prolongé.</b> ${reactNeed()} réactifs par relique, reliques +${Math.round(b.relic*100)} %.`,true)}}
  // Séjour après l'objectif : chaque minute, le butin des monstres grandit (annoncé jusqu'au plafond)
  {const m=stayMin();if(m>(G.staySeen|0)){G.staySeen=m;const b=stayBonus();if(b>0&&m*(BAL.stayLoot||0)<=(BAL.stayLootMax||0)+1e-9)toast(`<b style="color:#f0cf4a">Butin des monstres +${Math.round(b*100)} %</b> : tu restes après l'objectif${b>=(BAL.stayLootMax||0)-1e-9?' (c\'est le maximum)':''}.`,true)}}
  if(!NET.guest&&G.mode==='survie'&&G.tl>=LEVEL_T){G.tl=LEVEL_T;roundDone();return}
  if(G.pod)G.pod.flash=Math.max(0,G.pod.flash-dt*6);
  const P=G.P;
  if(!NET.guest){for(const s of G.spawns)s.t-=dt;
  for(const s of G.spawns.filter(s=>s.t<=0))spawnEnemy({...s,fx:!s.split});
  G.spawns=G.spawns.filter(s=>s.t>0);
  spawner(dt);twinTick(dt);lordTick(dt)}
  if(NET.on&&G.mates&&G.mates.length)matesSmooth(dt);
  petTick(dt);
  if(G.oshots){for(const s of G.oshots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt}G.oshots=G.oshots.filter(s=>s.life>0)}
  // joueur
  const iv=inputVec(), moving=iv.m>.15;
  P.inv-=dt;P.flash=Math.max(0,P.flash-dt*5);P.dashCd-=dt;P.novaCd-=dt;P.fire-=dt;ultTick(dt);ultCharge(dt);
  if(P.down)heroDownTick(dt);if(NET.on&&!$('lvlup').hidden)P.inv=Math.max(P.inv,.3);
  if(S.regen&&!P.down)P.hp=Math.min(S.hp,P.hp+S.regen*dt*(P.psnT>0?.5:1));
  if(P.soulT>0){P.soulT-=dt;if(P.soulT<=0)P.soulN=0}
  if(S.abPulse){P.abT=(P.abT==null?5:P.abT)-dt;if(P.abT<=0){P.abT=5;const R=200*(1+S.skillRad/200);G.rings.push({x:P.x,y:P.y,t:0,max:R,col:'176,124,255'});burst(P.x,P.y,20,'#b07cff',220,3);SND.play('boom');
    for(const o of G.en.slice())if(!o.dead&&Math.abs(o.x-P.x)<R+o.r&&Math.hypot(o.x-P.x,o.y-P.y)<R+o.r)dmgEnemy(o,S.dmg*S.abPulse/100,false)}}
  const antiM=1-Math.min(60,S.antidote||0)/100;
  for(const z of G.zones){z.life-=dt;
    if(!P.down&&Math.hypot(P.x-z.x,P.y-z.y)<z.r+P.r*.4){
      if(z.kind==='poison'){z.tick=(z.tick||0)-dt;if(z.tick<=0){z.tick=.6;P.psn=Math.min(5,P.psn+1);P.psnT=8*antiM;P.psnD=Math.max(P.psnD,z.dps*.5)}}
      else{P.brnT=5*antiM;P.brnD=Math.max(P.brnD||0,z.dps*2)}}
    if(G.pod&&Math.hypot(G.pod.x-z.x,G.pod.y-z.y)<z.r+G.pod.r)podHurt(z.dps*(z.kind==='pyro'?2:1.2)*dt*POD_ZONE)}
  compact(G.zones,z=>z.life>0);
  if(P.psnT>0){P.psnT-=dt;dotHurt(P.psn*P.psnD*dt);if(P.psnT<=0){P.psn=0;P.psnD=0}}
  if(P.frzT>0)P.frzT-=dt;
  if(P.elanT>0)P.elanT-=dt;if(P.peauT>0)P.peauT-=dt;if(P.ferT>0)P.ferT-=dt;
  if(P.gaT>0){P.gaT-=dt;if(P.gaT<=0){P.shield=Math.max(0,(P.shield||0)-Math.min(P.gaS||0,P.shield||0));P.gaS=0}}
  if(G.biome===2)sandTick(dt);
  if(G.biome===1&&Math.random()<dt*16&&G.parts.length<420)G.parts.push({x:G.cam.x+rand(-G.vw/2,G.vw/2),y:G.cam.y+rand(-G.vh/2,G.vh/2),vx:rand(-12,12),vy:rand(18,42),life:2.4,max:2.4,col:'#e4f4ff',size:rand(1,2.2)});
  if(P.brnT>0){P.brnT-=dt;dotHurt(P.brnD*dt);if(Math.random()<dt*10)G.parts.push({x:P.x+rand(-8,8),y:P.y+rand(-6,6),vx:0,vy:-60,life:.5,max:.5,col:'#ff8a3a',size:3})}
  if(G.over)return;
  if(NET.guest)for(const l of G.lobs)l.t+=dt;else for(const l of G.lobs){l.t+=dt;if(l.t>=l.T){l.done=true;const life=l.kind==='poison'?5:3;G.zones.push({id:++G.zid,x:l.tx,y:l.ty,r:l.r,life,max:life,kind:l.kind,dps:l.dps});burst(l.tx,l.ty,14,l.kind==='poison'?'#e07ad6':'#ff8a3a',140,3)}}
  compact(G.lobs,l=>!l.done);
  for(const w of G.wells){if(!w.on){w.cd-=dt;if(w.cd<=0)placeWell(w)}
    else if((P.psnT>0||P.brnT>0||P.frzT>0)&&Math.hypot(P.x-w.x,P.y-w.y)<w.r+P.r){P.psn=0;P.psnT=0;P.psnD=0;P.brnT=0;P.frzT=0;w.on=false;w.cd=30;burst(w.x,w.y,24,'#bfeaff',160,3);toast('<b style="color:#9fdcff">Source sacrée</b> : altérations purifiées. Elle réapparaîtra ailleurs.')}}
  if(P.cbT>0){P.cbT-=dt;if(Math.random()<dt*24){const a=rand(0,Math.PI*2);G.parts.push({x:P.x+Math.cos(a)*P.r*1.4,y:P.y+Math.sin(a)*P.r*1.4,vx:Math.cos(a)*30,vy:-50,life:.45,max:.45,col:'#ffd34d',size:3})}if(P.cbT<=0){P.cbT=0;refreshStats()}}
  if(G.cls==='magicien'&&hasTal('m_shield')){P.noHit+=dt;if(P.noHit>4)P.shield=Math.min(S.hp*.25,P.shield+S.hp*.08*dt)}
  if(moving){P.dx=iv.x/iv.m;P.dy=iv.y/iv.m;P.face=Math.atan2(P.dy,P.dx)}
  P._sand=inSand(P)&&!(P.berT>0);if(P._sand&&moving&&!P.down&&Math.random()<dt*14)G.parts.push({x:P.x+rand(-10,10),y:P.y+rand(4,12),vx:rand(-20,20),vy:rand(-25,-5),life:.5,max:.5,col:'#c9a25e',size:rand(1.5,3)});
  let sp=P.down?0:S.speed*iv.m*(P.frzT>0&&!(P.berT>0)?.62:1)*(P._sand?.6:1)*(P.elanT>0?1+S.elan/100:1);
  if(P.dashT>0){P.dashT-=dt;sp=S.speed*3.4;P.x+=P.dx*sp*dt;P.y+=P.dy*sp*dt;if(Math.random()<.6)G.parts.push({x:P.x,y:P.y,vx:0,vy:0,life:.25,max:.25,col:'#9fc2b8',size:P.r*.8})}
  else if(P.leapT>0){P.leapT-=dt;P.x+=P.leapVx*dt;P.y+=P.leapVy*dt;if(Math.random()<.7)G.parts.push({x:P.x,y:P.y,vx:0,vy:0,life:.25,max:.25,col:'#9fc2b8',size:P.r*.8});if(P.leapT<=0){P.leapT=0;P.leapLand=1}}
  else{P.x+=iv.x/(iv.m||1)*sp*dt;P.y+=iv.y/(iv.m||1)*sp*dt}
  resolve(P);lordHold(P);
  if(P.leapLand){P.leapLand=0;leapLand()}
  G.cam.x+=(P.x-G.cam.x)*Math.min(1,dt*8);G.cam.y+=(P.y-G.cam.y)*Math.min(1,dt*8);
  // Capture : décidée par l'hôte (en coopération, n'importe quel héros debout compte pour capturer et pour l'extraction).
  if(G.mode==='capture'&&!NET.guest){
    const t=G.target,heroes=[P,...(G.mates||[])].filter(h=>!h.down),near=(x,y,r)=>heroes.some(h=>Math.hypot(x-h.x,y-h.y)<r);
    if(t&&t.downed){if(near(t.x,t.y,80)){G.capT+=dt;if(G.capT>=2.5){G.en=G.en.filter(e=>e!==t);G.target=null;G.capT=0;G.capN++;burst(t.x,t.y,36,'#f0cf4a',220);
        if(!G.exitPt)G.exitPt=farPoint(1000);G.nextTgt=CAP_NEXT;capReward();if(NET.host)netSend({t:'cap'})}}
      else G.capT=Math.max(0,G.capT-dt)}
    if(!G.target&&G.nextTgt>0){G.nextTgt-=dt;if(G.nextTgt<=0){G.nextTgt=0;spawnTarget()}}
    if(G.exitPt&&!lordOn()){const inZ=near(G.exitPt.x,G.exitPt.y,55);
      if(inZ){if(G.extT===0)toast('Reste <b>3 s</b> dans la zone pour t\'extraire.');G.extT+=dt;if(G.extT>=EXT_T){missionSuccess();return}}
      else G.extT=Math.max(0,G.extT-dt*1.5)}
  }
  if(P.dashT>0&&S.pasEl>0&&P.dashSt)for(const e of G.en)if(!e.dead&&!e.downed&&!P.dashSt.has(e)&&Math.abs(e.x-P.x)<e.r+P.r+14&&Math.hypot(e.x-P.x,e.y-P.y)<e.r+P.r+14){P.dashSt.add(e);onHit(e,S.dmg,false,{m:S.pasEl/100})}
  if(P.dashT>0&&G.cls==='guerrier'&&hasTal('g_charge'))for(const e of G.en)if(!e.dead&&!P.dashHit.has(e)&&Math.hypot(e.x-P.x,e.y-P.y)<e.r+P.r+10){
    P.dashHit.add(e);const a=Math.atan2(e.y-P.y,e.x-P.x),k=e.type==='boss'?40:380;e.kx+=Math.cos(a)*k;e.ky+=Math.sin(a)*k;dmgEnemy(e,S.dmg*1.5,false)}
  // attaque
  if(P.swing){P.swing.t+=dt;if(P.swing.t>.2)P.swing=null}
  if(P.spin>0){P.spin-=dt;P.spinTick-=dt;P.face+=dt*18;
    if(P.spinTick<=0){P.spinTick=.2;const R=130*(1+S.reach/100)*(1+S.skillRad/100);
      for(const e of G.en){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R+e.r){const crit=Math.random()*100<S.crit,dd=S.nova*.22*(crit?S.critDmg/100:1);spellHit(e,dd,crit);if(S.leech)heal(dd*S.leech/100);const k=e.type==='boss'?10:90;e.kx+=dx/d*k;e.ky+=dy/d*k}}}}
  let tgt=null,td=1e9;if(!P.down)for(const e of G.en){if(e.downed)continue;const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<td){td=d;tgt=e}}
  if(G.cls==='guerrier'){
    const R=(78+P.r)*(1+S.reach/100);
    if(tgt&&P.dashT<=0&&P.spin<=0){
      if(td<R+tgt.r+40)P.face=Math.atan2(tgt.y-P.y,tgt.x-P.x);
      if(td<R+tgt.r&&P.fire<=0){
        P.fire=1/S.aps;const a=P.face;P.swing={t:0,a,R};const forceC=!!P.critNext;P.critNext=0;
        for(const e of G.en){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d>R+e.r)continue;
          const da=Math.abs((((Math.atan2(dy,dx)-a)%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI);
          if(da>1.35&&d>e.r+P.r+6)continue;
          const crit=forceC||Math.random()*100<S.crit,dd=hitE(e,S.dmg*(crit?S.critDmg/100:1),crit);
          if(S.leech)heal(dd*S.leech/100);
          const k=e.type==='boss'?30:e.type==='brute'?140:280;e.kx+=dx/d*k;e.ky+=dy/d*k}
        G.shake=Math.max(G.shake,2);
        for(let i=0;i<S.waves;i++){const wa=a+(i-(S.waves-1)/2)*.35;G.shots.push({kind:'wave',x:P.x+Math.cos(wa)*P.r,y:P.y+Math.sin(wa)*P.r,vx:Math.cos(wa)*520,vy:Math.sin(wa)*520,a:wa,d:S.dmg*.6,crit:false,pierce:99,hit:new Set(),life:.5})}
        if(Math.random()*100<S.echo)P.fire=Math.min(P.fire,.12);
        P.swings++;
        if(hasTal('g_quake')&&P.swings%4===0){const R2=160*(1+S.reach/100)*(1+S.skillRad/100);G.rings.push({x:P.x,y:P.y,t:.1,max:R2,col:'255,210,160'});G.shake=Math.max(G.shake,5);
          for(const e of G.en){if(e.dead)continue;const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;if(d<R2+e.r){const k=e.type==='boss'?20:200;e.kx+=dx/d*k;e.ky+=dy/d*k;dmgEnemy(e,S.dmg*.9,false)}}}
      }
    }
  }else if(tgt&&td<560&&P.dashT<=0){
    P.face=Math.atan2(tgt.y-P.y,tgt.x-P.x);
    if(P.fire<=0){
      const slow=moving&&!(G.cls==='archer'&&hasTal('a_move'));
      P.fire=1/S.aps*(slow?1.43:1);const n=1+Math.floor(S.multi)+(Math.random()<S.multi%1?1:0),orb=G.cls==='magicien',sp=(orb?430:640)*(S.shotSpd||1);
      const hawk=P.hawkT>0,cs=hawk||P.critShots>0||!!P.critNext;if(!hawk){if(P.critNext)P.critNext=0;else if(cs)P.critShots--}
      const gap=Math.min(orb?.25:.17,(orb?1.5:1.2)/n);
      for(let i=0;i<n;i++){const a=P.face+(i-(n-1)/2)*gap,crit=cs||Math.random()*100<S.crit;
        G.shots.push({kind:orb?'orb':'bolt',x:P.x,y:P.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a,d:S.dmg*(crit?S.critDmg/100:1),crit,pierce:orb?0:S.pierce,hit:new Set(),life:1.4})}
      if(Math.random()*100<S.echo)P.fire=Math.min(P.fire,.1);
    }
  }
  // projectiles du héros
  gridBuild();
  for(const s of G.shots){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(blocked(s.x,s.y,2)){s.life=0;if(s.kind==='orb')explode(s,null);else burst(s.x,s.y,3,'#e8a76b',80,2);continue}
    gridEach(s.x,s.y,60,e=>{if(e.dead||s.hit.has(e))return;const m=e.r+(s.kind==='orb'?7:4);if(Math.abs(e.x-s.x)>m||Math.abs(e.y-s.y)>m)return;if(Math.hypot(e.x-s.x,e.y-s.y)>=m)return;
      const su=s.ult?1:0,ss=s.sp?1:0;G.inUlt=(G.inUlt|0)+su;G.inSp=(G.inSp|0)+ss;G.hitShot=s;hitE(e,s.d,s.crit,S.diam&&s.pc?{f:1}:null);G.hitShot=null;G.inUlt-=su;G.inSp-=ss;
      const k=e.type==='boss'?20:e.type==='brute'?60:140;e.kx+=Math.cos(s.a)*k;e.ky+=Math.sin(s.a)*k;
      s.hit.add(e);if(s.kind==='orb'){explode(s,e);if(G.cls==='magicien'&&hasTal('m_chain')&&Math.random()<.25)chain(e,s.d*.8);s.life=0;return false}
      if(s.pierce>0){s.pierce--;s.pc=1;return}
      if(G.cls==='archer'&&hasTal('a_rico')&&!s.bounced){s.bounced=true;let nt=null,nd=280;
        for(const o of G.en){if(o.dead||o.downed||s.hit.has(o))continue;const dd=Math.hypot(o.x-s.x,o.y-s.y);if(dd<nd){nd=dd;nt=o}}
        if(nt){const a=Math.atan2(nt.y-s.y,nt.x-s.x);s.a=a;s.vx=Math.cos(a)*640;s.vy=Math.sin(a)*640;s.life=.8}else s.life=0;return false}
      s.life=0;return false});
  }
  compact(G.shots,s=>s.life>0);
  // ennemis
  const farR=Math.hypot(G.vw,G.vh)*1.1;
  if(NET.guest)netGuestEnemies(dt,P);else for(const e of G.en){
    if(e.dead)continue;
    e.flash=Math.max(0,e.flash-dt*7);e.hitCd-=dt;e.shown-=dt;
    dotTick(e,dt);
    if(e.dead)continue;
    stTick(e,dt);const stn=e.stun>0;
    if(e.lord||e.stake){lordStep(e,dt,stn);continue} // Boss et son pieu (v147, boss.js)
    const PT=(!NET.guest&&e.type!=='boss'&&petLure(e))||netNear(e,P),T=(e.tgtPod&&G.pod)?G.pod:PT,dx=T.x-e.x,dy=T.y-e.y,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d;let mx=0,my=0;
    const dP=T===PT?d:Math.hypot(PT.x-e.x,PT.y-e.y);
    if(dP>farR&&e.type!=='boss'&&e.type!=='cible'&&!e.tgtPod){const p=ringPos();e.x=p.x;e.y=p.y;continue}
    if(stn){}
    else if(e.type==='cible'){
      if(!e.downed){
        if(dP<480){mx=-(P.x-e.x)/dP;my=-(P.y-e.y)/dP;e.blink-=dt;
          if(e.blink<=0&&dP<260){e.blink=rand(4,6);burst(e.x,e.y,16,'#f0cf4a',160);const a=Math.atan2(e.y-P.y,e.x-P.x);
            for(let k=0;k<10;k++){const b=a+rand(-1,1),nx=e.x+Math.cos(b)*330,ny=e.y+Math.sin(b)*330;if(!blocked(nx,ny,22)){e.x=nx;e.y=ny;break}}burst(e.x,e.y,16,'#f0cf4a',160)}}
        else{e.wob+=dt*.7;mx=Math.cos(e.wob)*.4;my=Math.sin(e.wob*1.3)*.4}
      }
    }
    else if(e.type==='ghoul'||e.type==='givrin'||e.type==='mummy'||e.type==='mummyR'){mx=ux;my=uy}
    else if(e.type==='slime'){e.timer-=dt;
      if(e.state==='walk'){const h=Math.max(0,Math.sin(G.t*5+e.wob));mx=ux*(.35+1.3*h);my=uy*(.35+1.3*h);
        if(e.timer<=0){if(d<170+e.r){e.state='wind';e.timer=[.45,.38,.3][e.gen];e.ang=Math.atan2(dy,dx)}else e.timer=.4}}
      else if(e.state==='wind'){if(e.timer<=0){e.state='charge';e.timer=.28;burst(e.x,e.y+e.r*.5,6,'#7fe0c8',90,2)}}
      else if(e.state==='charge'){mx=Math.cos(e.ang)*5.2;my=Math.sin(e.ang)*5.2;if(e.timer<=0){e.state='walk';e.timer=rand(1.4,2.4)*[1,.85,.7][e.gen]}}}
    else if(e.type==='bat'){e.wob+=dt*6;mx=ux-uy*Math.sin(e.wob)*.6;my=uy+ux*Math.sin(e.wob)*.6}
    else if(e.type==='scarab'){e.wob+=dt*7;const zz=Math.sin(e.wob)>0?.75:-.75;mx=ux-uy*zz;my=uy+ux*zz}
    else if(e.type==='poison'||e.type==='pyro'){
      e.noLos=(e.noLos||0)-dt;
      if(e.noLos>0){mx=ux;my=uy}else if(d<240){mx=-ux;my=-uy}else if(d>380){mx=ux;my=uy}else{mx=-uy*e.side*.6;my=ux*e.side*.6}
      e.timer-=dt;if(e.timer<=0){e.timer=rand(3,4.2);
        if(!losClear(e,dx,dy))e.noLos=2.5;else if(d<560){const lv=G.level,ds=diff().ds;
          G.lobs.push({x0:e.x,y0:e.y,tx:T.x+rand(-30,30),ty:T.y+rand(-30,30),t:0,T:1,kind:e.type,r:(e.type==='poison'?80:70)*Math.min(1.5,1+.02*(lv-1)),dps:2*ds})}}
    }
    else if(e.type==='archer'){
      e.noLos=(e.noLos||0)-dt;
      const lo=e.tgtPod?110:220,hi=e.tgtPod?170:330;if(e.noLos>0){mx=ux;my=uy}else if(d<lo){mx=-ux;my=-uy}else if(d>hi){mx=ux;my=uy}else{mx=-uy*e.side*.7;my=ux*e.side*.7}
      e.timer-=dt;if(e.timer<=0){e.timer=rand(1.6,2.4);
        if(!losClear(e,dx,dy))e.noLos=2.5;else if(d<520)fireE(e,Math.atan2(dy,dx),250,e.dmg)}
    }else if(e.type==='brute'||e.type==='boss'){
      e.timer-=dt;const boss=e.type==='boss',half=e.hp<e.max/2;
      if(e.state==='walk'){mx=ux*(boss?.7:1);my=uy*(boss?.7:1);
        if(e.timer<=0){
          if(boss){e.cycle++;if(e.cycle%3===0){e.state='wind';e.timer=.75;e.ang=Math.atan2(dy,dx)}else{if(d<700)ring(e,half?20:14,half?220:190);e.timer=half?1.5:2.3}}
          else if(d<380){e.state='wind';e.timer=.55;e.ang=Math.atan2(dy,dx)}else e.timer=.5;
        }
        if(boss&&half){e.sum-=dt;if(e.sum<=0){e.sum=7;const sc=G.biome===2;for(let i=0;i<(sc?5:3);i++)G.spawns.push({type:sc?'scarab':'ghoul',x:clamp(e.x+rand(-90,90),EDGE+40,MAP-EDGE-40),y:clamp(e.y+rand(-90,90),EDGE+40,MAP-EDGE-40),t:.8})}}
      }else if(e.state==='wind'){if(e.timer<=0){e.state='charge';e.timer=boss?.65:.45}}
      else if(e.state==='charge'){mx=Math.cos(e.ang)*(boss?7.5:6.5);my=Math.sin(e.ang)*(boss?7.5:6.5);
        if(Math.random()<.5)G.parts.push({x:e.x,y:e.y+e.r*.6,vx:rand(-30,30),vy:rand(-30,30),life:.4,max:.4,col:'#5b4a52',size:4});
        if(e.timer<=0){e.state='walk';e.timer=boss?1.3:rand(2.5,4)}}
    }
    e.slow-=dt;if(e.frz>0)e.frz-=dt;if(e.curse>0)e.curse-=dt;let sm=e.frz>0||e.root>0||stn?0:e.slow>0?.4:1;if(S.auraSlow&&dP<180)sm*=1-S.auraSlow/100;
    if(e.type!=='scarab'&&e.type!=='boss'&&inSand(e))sm*=.65;
    e.x+=(mx*e.spd*sm+e.kx)*dt;e.y+=(my*e.spd*sm+e.ky)*dt;
    const f=Math.pow(.002,dt);e.kx*=f;e.ky*=f;
    if(resolve(e)&&e.state==='charge'){e.state='walk';e.timer=e.type==='boss'?1.6:e.type==='slime'?1.5:2.5;G.shake=Math.max(G.shake,e.type==='boss'?8:4);burst(e.x,e.y,10,'#6b5a60',150)}
    if(e.type!=='archer'&&e.type!=='cible'&&e.hitCd<=0&&!stn){const cd=(S.terr>0&&dP<180?1-S.terr/100:1)*(e.state==='charge'?e.dmg*1.4:e.dmg);
      if(T===G.pod&&d<e.r+T.r+5){podHurt(cd);e.hitCd=.8}else if(PT===P&&dP<e.r+P.r){thornE(e,hurt(cd));e.hitCd=.8;if(e.type==='givrin'){P.frzT=2.2*(1-Math.min(60,S.antidote||0)/100)}if(e.elite==='vampire'){e.hp=Math.min(e.max,e.hp+e.max*.1);ftext(e.x,e.y-e.r,'+vie','#ff5a6a',13)}}}
  }
  // séparation
  gridBuild();const L=G.en;
  if(!NET.guest)for(let i=0;i<L.length;i++){const a=L[i];gridEach(a.x,a.y,a.r+50,(b,j)=>{if(j<=i)return;const m=a.r+b.r,dx=b.x-a.x;if(dx>m||dx<-m)return;const dy=b.y-a.y;if(dy>m||dy<-m)return;
    const d=Math.hypot(dx,dy)||1;if(d<m){const p=(m-d)/2,wa=a.type==='boss'||a.stake?0:1,wb=b.type==='boss'||b.stake?0:1;a.x-=dx/d*p*wa;a.y-=dy/d*p*wa;b.x+=dx/d*p*wb;b.y+=dy/d*p*wb}})}
  compact(G.en,e=>!e.dead);
  // projectiles ennemis
  for(const b of G.eb){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(G.pod&&Math.hypot(b.x-G.pod.x,b.y-G.pod.y)<b.r+G.pod.r){podHurt(b.d);b.life=0}else if(blocked(b.x,b.y,b.r*.5))b.life=0;else if(!P.down&&Math.hypot(b.x-P.x,b.y-P.y)<b.r+P.r-3){const tk=hurt(b.d*(S.terr>0&&b.src&&!b.src.dead&&Math.hypot(b.src.x-P.x,b.src.y-P.y)<180?1-S.terr/100:1));if(b.src)thornE(b.src,tk);b.life=0;if(NET.guest)NET.ebUsed.add(b.id)}}
  compact(G.eb,b=>b.life>0);
  // butin
  for(const d of G.drops){
    d.t+=dt;d.age+=dt;if(d.kind==='gold'&&d.age>45){d.gone=true;continue}
    const dx=P.x-d.x,dy=P.y-d.y,dist=Math.hypot(dx,dy)||1;
    if(dist<S.magnet*petMagnet()||d.mt>0){d.mt+=dt;const v=Math.min(800,260+d.mt*500);d.x+=dx/dist*v*dt;d.y+=dy/dist*v*dt}
    if(!P.down&&dist<P.r+16){
      d.gone=true;
      if(d.kind==='xp'){G.nxp--;gainXp(d.v)}
      else if(d.kind==='gold'){SND.play('gold');const a=Math.round(d.amt*(1+lv('for')*.15)*(1+S.goldPct/100));G.gold+=a;ftext(P.x+rand(-10,10),P.y-P.r-12,'+'+a,'#f0cf4a',13)}
      else if(d.kind==='mod'){SND.play('pick2');gainMod(d.id);(G.modsGot||(G.modsGot=[])).push(d.id)}
      else if(d.kind==='seal'){SND.play('leg');(G.loot.seals||(G.loot.seals=[])).push(d.id);G.fresh++}
      else if(d.kind==='relic'){SND.play('pick3');G.loot.relics.push(d.id);G.fresh++}
      else if(d.kind==='react'){if(G.relic){G.react++;if(G.react>=reactNeed()){const r=G.relic;G.opened.push(r);relShare(r);G.relI++;G.react=0;G.relic=G.relQ[G.relI]||null;G.shake=6;
          SND.play('relic');}}}
      else if(d.kind==='potion'){if(G.potions<potMax()){SND.play('pick');G.potions++}} // au maximum : la potion disparaît sans compter (v144 ; avant, elle restait au sol, collée au héros)
      else if(d.kind==='item'){SND.play(d.item.r>=3?'pick3':d.item.r>=2?'pick2':'pick');G.loot.items.push(d.item);G.fresh++;if(d.item.r===3)G.shake=6}
      else if(d.kind==='part'){SND.play('pick3');G.loot.parts.push(d.part);G.fresh++}
      else if(d.kind==='key'){SND.play('pick3');G.loot.keys=(G.loot.keys|0)+1;G.fresh++}
    }
  }
  compact(G.drops,d=>!d.gone);
  // particules, textes, anneaux
  for(const p of G.parts){p.x+=p.vx*dt;p.y+=p.vy*dt;if(!p.w&&!p.g){p.vx*=.92;p.vy*=.92}p.life-=dt}
  compact(G.parts,p=>p.life>0);
  for(const t of G.texts)t.t+=dt;compact(G.texts,t=>t.t<.8);
  for(const r of G.rings)r.t+=dt;compact(G.rings,r=>r.t<.45);
  for(const z of G.zaps)z.t+=dt;compact(G.zaps,z=>z.t<.25);
  G.shake=Math.max(0,G.shake-dt*30);G.hshake=Math.max(0,(G.hshake||0)-dt*28);
}

