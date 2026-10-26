// Crypte des Cendres — render.js
/* ---------- Rendu ---------- */
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2)}
function shadow(x,y,r){ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y+r*.75,r*1.05,r*.45,0,0,7);ctx.fill()}
function slimeShape(r,white,a){
  ctx.fillStyle=white?'#fff':'rgba(63,158,140,.88)';ctx.beginPath();ctx.ellipse(0,r*.08,r,r*.9,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=white?'#fff':'#1f5a50';ctx.lineWidth=2;ctx.stroke();if(white)return;
  ctx.fillStyle='rgba(20,60,54,.65)';circle(Math.cos(a)*r*.15,Math.sin(a)*r*.15+r*.12,r*.42);ctx.fill();
  ctx.fillStyle='rgba(200,255,240,.45)';ctx.beginPath();ctx.ellipse(-r*.35,-r*.38,r*.28,r*.16,-.5,0,Math.PI*2);ctx.fill();
  const ex=Math.cos(a)*r*.38,ey=Math.sin(a)*r*.38,px=-Math.sin(a)*r*.28,py=Math.cos(a)*r*.28;ctx.fillStyle='#0d1f1c';circle(ex+px,ey+py,Math.max(1.6,r*.12));ctx.fill();circle(ex-px,ey-py,Math.max(1.6,r*.12));ctx.fill();
  ctx.fillStyle='#d8fff4';circle(ex+px-.8,ey+py-.8,Math.max(.7,r*.045));ctx.fill();circle(ex-px-.8,ey-py-.8,Math.max(.7,r*.045));ctx.fill()}
function drawEnemy(e){
  shadow(e.x,e.y,e.r);
  const fl=e.flash>0, a=Math.atan2(G.P.y-e.y,G.P.x-e.x);
  if(e.type==='cible'){
    if(e.downed){ctx.setLineDash([6,6]);ctx.strokeStyle='rgba(240,207,74,.55)';ctx.lineWidth=2;circle(e.x,e.y,80);ctx.stroke();ctx.setLineDash([])}
    ctx.fillStyle=e.downed?'#5a5040':fl?'#fff':e.col;circle(e.x,e.y,e.r);ctx.fill();ctx.strokeStyle='#f0cf4a';ctx.lineWidth=3;ctx.stroke();
    if(!e.downed){ctx.strokeStyle='rgba(240,207,74,.5)';ctx.lineWidth=2;circle(e.x,e.y,e.r+7+Math.sin(G.t*6)*1.5);ctx.stroke();
      ctx.fillStyle='#2a1e0e';circle(e.x-Math.cos(a)*5,e.y-Math.sin(a)*5,e.r*.5);ctx.fill()}
    if(e.downed&&G.capT>0){ctx.strokeStyle='#f0cf4a';ctx.lineWidth=5;ctx.beginPath();ctx.arc(e.x,e.y,e.r+14,-Math.PI/2,-Math.PI/2+Math.PI*2*G.capT/2.5);ctx.stroke()}
    if(!e.downed){const w=48;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-w/2,e.y-e.r-14,w,5);ctx.fillStyle='#f0cf4a';ctx.fillRect(e.x-w/2,e.y-e.r-14,w*e.hp/e.max,5)}
    return;
  }
  if(e.state==='wind'){ctx.strokeStyle='rgba(220,60,60,.45)';ctx.lineWidth=e.r*1.4;ctx.beginPath();ctx.moveTo(e.x,e.y);{const L=e.type==='boss'?420:e.type==='slime'?150:300;ctx.lineTo(e.x+Math.cos(e.ang)*L,e.y+Math.sin(e.ang)*L)}ctx.stroke()}
  if(e.type==='boss'){
    const t=G.t;ctx.fillStyle=fl?'#fff':e.col;circle(e.x,e.y,e.r);ctx.fill();
    ctx.strokeStyle='#8c5ab0';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=fl?'#fff':'#e8853b';
    for(let i=0;i<7;i++){const b=-Math.PI/2+(i-3)*.32,x=e.x+Math.cos(b)*e.r*.82,y=e.y+Math.sin(b)*e.r*.82;ctx.beginPath();ctx.moveTo(x+6*Math.sin(b),y);ctx.lineTo(e.x+Math.cos(b)*(e.r+14+Math.sin(t*4+i)*2),e.y+Math.sin(b)*(e.r+14));ctx.lineTo(x+6,y+4);ctx.fill()}
    ctx.fillStyle='#ffb04a';circle(e.x+Math.cos(a)*16-Math.sin(a)*12,e.y+Math.sin(a)*16+Math.cos(a)*12,5);ctx.fill();circle(e.x+Math.cos(a)*16+Math.sin(a)*12,e.y+Math.sin(a)*16-Math.cos(a)*12,5);ctx.fill();
    return;
  }
  if(e.type==='bat'){const fw=Math.sin(G.t*22+e.wob)*.5+.5;ctx.fillStyle=fl?'#fff':e.col;
    for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+s*(e.r+8),e.y-4-fw*7);ctx.lineTo(e.x+s*(e.r+3),e.y+3);ctx.fill()}
    circle(e.x,e.y,e.r*.7);ctx.fill();ctx.fillStyle='#ff3b30';circle(e.x-2.5,e.y-1,1.6);ctx.fill();circle(e.x+2.5,e.y-1,1.6);ctx.fill();return}
  if(e.type==='givrin'){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);givrinShape(e.r,fl);ctx.restore();return}
  if(e.type==='slime'){const w=Math.sin(G.t*6+e.wob)*.08;ctx.save();ctx.translate(e.x,e.y);ctx.scale(1+w,1-w);slimeShape(e.r,fl,a);ctx.restore();return}
  ctx.fillStyle=fl?'#fff':e.col;circle(e.x,e.y,e.r);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=2;ctx.stroke();
  if(e.type==='archer'){ctx.strokeStyle='#8a6a45';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(e.x+Math.cos(a)*e.r*.6,e.y+Math.sin(a)*e.r*.6,e.r*.9,a-1.1,a+1.1);ctx.stroke();
    ctx.fillStyle='#1a1418';circle(e.x+Math.cos(a)*5,e.y+Math.sin(a)*5,e.r*.45);ctx.fill()}
  if(e.type==='poison'||e.type==='pyro'){ctx.fillStyle='#1a1418';circle(e.x+Math.cos(a)*4,e.y+Math.sin(a)*4,e.r*.5);ctx.fill();ctx.fillStyle=e.type==='poison'?'#e07ad6':'#ffb04a';circle(e.x+Math.cos(a+.9)*e.r*.9,e.y+Math.sin(a+.9)*e.r*.9,4.5);ctx.fill()}
  if(e.type==='brute'){ctx.fillStyle='#3a1618';circle(e.x+Math.cos(a)*7,e.y+Math.sin(a)*7,e.r*.55);ctx.fill();
    ctx.fillStyle='#d8cfb8';for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(e.x+Math.cos(a+s*.9)*e.r,e.y+Math.sin(a+s*.9)*e.r);ctx.lineTo(e.x+Math.cos(a+s*.6)*(e.r+10),e.y+Math.sin(a+s*.6)*(e.r+10));ctx.lineTo(e.x+Math.cos(a+s*.5)*e.r,e.y+Math.sin(a+s*.5)*e.r);ctx.fill()}}
  const ex=e.x+Math.cos(a)*e.r*.45,ey=e.y+Math.sin(a)*e.r*.45,px=-Math.sin(a)*e.r*.3,py=Math.cos(a)*e.r*.3;
  ctx.fillStyle='#ff3b30';circle(ex+px,ey+py,2.4);ctx.fill();circle(ex-px,ey-py,2.4);ctx.fill();
  if(e.shown>0&&e.hp<e.max){const w=e.r*2;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-w/2,e.y-e.r-10,w,4);ctx.fillStyle='#d9454a';ctx.fillRect(e.x-w/2,e.y-e.r-10,w*Math.max(0,e.hp/e.max),4)}
}
const hpCol=k=>k>.5?[95,191,122]:k>.25?[240,207,74]:[226,72,72];
function hpRing2D(P,MX=S.hp){const k=Math.max(0,Math.min(1,P.hp/MX)),R=P.r+12,c=hpCol(k),a0=-Math.PI/2;
  ctx.save();ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineWidth=9;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.beginPath();ctx.arc(P.x,P.y,R,0,Math.PI*2);ctx.stroke();ctx.lineWidth=6;ctx.strokeStyle='rgba(60,20,24,.9)';ctx.beginPath();ctx.arc(P.x,P.y,R,0,Math.PI*2);ctx.stroke();
  if(k>0){ctx.shadowColor=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.shadowBlur=8;ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${k<.25?.75+.25*Math.sin(G.t*10):.95})`;ctx.beginPath();ctx.arc(P.x,P.y,R,a0,a0+Math.PI*2*k);ctx.stroke();ctx.shadowBlur=0}
  if(P.shield>0){ctx.lineWidth=3;ctx.strokeStyle='rgba(150,210,255,.85)';ctx.beginPath();ctx.arc(P.x,P.y,R+6,a0,a0+Math.PI*2*Math.min(1,P.shield/MX));ctx.stroke()}
  ctx.restore()}
function allyTag2D(Q){ctx.save();ctx.font='700 12px Alegreya Sans, system-ui, sans-serif';ctx.textAlign='center';ctx.fillStyle=Q.down?'#ff8a80':(SLOT_C[Q.slot|0]||'#8fd3e0');ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=3;const t=Q.down?'À terre':`J${(Q.slot|0)+1} · ${CLS[Q.cls].n}`;ctx.strokeText(t,Q.x,Q.y-Q.r-22);ctx.fillText(t,Q.x,Q.y-Q.r-22);ctx.restore()}
const allShots=()=>G.oshots&&NET.on?G.shots.concat(G.oshots):G.shots;
function drawPlayer(P){
  shadow(P.x,P.y,P.r);
  ctx.globalAlpha=P.dashT>0?.55:(P.inv>0&&Math.floor(G.t*20)%2?.6:1);
  const a=P.face,C=CLS[G.cls];ctx.lineCap='round';
  if(G.cls==='archer'){
    ctx.strokeStyle='#d6b17c';ctx.lineWidth=4;
    const bx=P.x+Math.cos(a)*(P.r+9),by=P.y+Math.sin(a)*(P.r+9);
    ctx.beginPath();ctx.moveTo(P.x+Math.cos(a)*P.r*.3,P.y+Math.sin(a)*P.r*.3);ctx.lineTo(bx,by);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx-Math.sin(a)*11-Math.cos(a)*4,by+Math.cos(a)*11-Math.sin(a)*4);ctx.quadraticCurveTo(bx+Math.cos(a)*3,by+Math.sin(a)*3,bx+Math.sin(a)*11-Math.cos(a)*4,by-Math.cos(a)*11-Math.sin(a)*4);ctx.stroke();
  }else if(G.cls==='guerrier'){
    if(P.spin>0){const R=130*(1+S.reach/100);ctx.strokeStyle='rgba(255,225,190,.28)';ctx.lineWidth=12;ctx.beginPath();ctx.arc(P.x,P.y,R*.8,a,a+4.5);ctx.stroke()}
    const hx=P.x+Math.cos(a)*(P.r+1),hy=P.y+Math.sin(a)*(P.r+1),bx=P.x+Math.cos(a)*(P.r+26),by=P.y+Math.sin(a)*(P.r+26);
    ctx.strokeStyle='#cfd6dc';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(bx,by);ctx.stroke();
    ctx.strokeStyle='#8a6a45';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(hx-Math.sin(a)*8,hy+Math.cos(a)*8);ctx.lineTo(hx+Math.sin(a)*8,hy-Math.cos(a)*8);ctx.stroke();
  }else{
    const sx=P.x-Math.sin(a)*12,sy=P.y+Math.cos(a)*12,tx=sx+Math.cos(a)*24,ty=sy+Math.sin(a)*24;
    ctx.strokeStyle='#7a5a3a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(sx-Math.cos(a)*10,sy-Math.sin(a)*10);ctx.lineTo(tx,ty);ctx.stroke();
    const gr=ctx.createRadialGradient(tx,ty,0,tx,ty,14);gr.addColorStop(0,'rgba(170,210,255,.9)');gr.addColorStop(1,'rgba(170,210,255,0)');ctx.fillStyle=gr;circle(tx,ty,14);ctx.fill();
    ctx.fillStyle='#dff0ff';circle(tx,ty,4);ctx.fill();
  }
  ctx.fillStyle=P.flash>0?'#ffdede':C.cloak;circle(P.x,P.y,P.r);ctx.fill();
  ctx.strokeStyle=C.rim;ctx.lineWidth=2;ctx.stroke();
  if(P.shield>0){ctx.strokeStyle=`rgba(150,210,255,${.3+.5*P.shield/(S.hp*.25)})`;ctx.lineWidth=2.5;circle(P.x,P.y,P.r+6);ctx.stroke()}
  if(P.swing){const k=P.swing.t/.2,R=P.swing.R;ctx.strokeStyle=`rgba(255,235,210,${.85*(1-k)})`;ctx.lineWidth=9*(1-k)+2;ctx.beginPath();ctx.arc(P.x,P.y,R*.85,P.swing.a-1.35,P.swing.a-1.35+2.7*Math.min(1,k*2.2));ctx.stroke()}
  ctx.fillStyle=C.inner;circle(P.x+Math.cos(a)*5,P.y+Math.sin(a)*5,P.r*.55);ctx.fill();
  ctx.fillStyle='#e8d9b8';circle(P.x+Math.cos(a)*8,P.y+Math.sin(a)*8,2);ctx.fill();
  ctx.globalAlpha=1;
}
function beam(x,y,h,col,a=.32){const gr=ctx.createLinearGradient(0,y-h,0,y);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,col);ctx.globalAlpha=a;ctx.fillStyle=gr;ctx.fillRect(x-4,y-h,8,h);ctx.globalAlpha=1}
function drawDrop(d){
  const bob=Math.sin(d.t*3)*3;
  if(d.kind==='react'){const k=Math.sin(d.t*6)*.5+.5;ctx.fillStyle=`rgba(255,207,90,${.25+.2*k})`;circle(d.x,d.y,10);ctx.fill();ctx.fillStyle='#ffd77a';circle(d.x,d.y,4.5);ctx.fill();return}
  if(d.kind==='seal'){const c=SEAL_C;beam(d.x,d.y,170,c,.55);ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(G.t*1.5);ctx.fillStyle='#2a1026';ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,rr=i%2?6:13;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();return}
  if(d.kind==='relic'){const c=RTIER[RELICS[d.id].t].c;beam(d.x,d.y,130,c,.4);ctx.save();ctx.translate(d.x,d.y+bob);ctx.fillStyle='#1d1822';ctx.strokeStyle=c;ctx.lineWidth=2.5;
    ctx.beginPath();ctx.ellipse(0,0,8,12,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,3.5,6,0,0,7);ctx.fill();ctx.restore();return}
  if(d.kind==='xp'){const c=d.v>=20?'#ff7a6b':d.v>=5?'#7fe08a':'#7fd0e6',s=d.v>=20?8:d.v>=5?6.5:5;
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(d.x,d.y-s);ctx.lineTo(d.x+s*.65,d.y);ctx.lineTo(d.x,d.y+s);ctx.lineTo(d.x-s*.65,d.y);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(d.x-1,d.y-s*.55,2,s*.5);return}
  if(d.kind==='gold'){ctx.fillStyle='#f0cf4a';circle(d.x,d.y+bob*.6,5);ctx.fill();ctx.strokeStyle='#7a5a10';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#fff6c4';circle(d.x-1.5,d.y+bob*.6-1.5,1.5);ctx.fill();return}
  if(d.kind==='mod'){const c=MOD_RAR[MODS[d.id].r].c;beam(d.x,d.y,90,c,.3);
    ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(Math.sin(d.t*2)*.25);ctx.fillStyle='#1d1822';ctx.fillRect(-8,-11,16,22);
    ctx.strokeStyle=c;ctx.lineWidth=2;ctx.strokeRect(-8,-11,16,22);ctx.fillStyle=c;ctx.fillRect(-4,-6,8,2);ctx.fillRect(-4,-1,8,2);ctx.fillRect(-2,4,4,2);ctx.restore();return}
  if(d.kind==='part'){const c=RAR[bpdef(d.part.w).r].c;beam(d.x,d.y,90,c,.3);
    ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(d.t*.8);ctx.fillStyle='#1d1822';ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=c;circle(0,0,3.5);ctx.fill();ctx.restore();return}
  const col=d.kind==='potion'?'#5fbf7a':RAR[d.item.r].c;
  if(d.kind==='item'){beam(d.x,d.y,d.wish?220:d.item.r>=3?150:d.item.r===2?100:60,d.wish?'#ffe08a':col,d.wish?.6:.35);
    if(d.wish){const k=(G.t*1.6)%1;ctx.strokeStyle=`rgba(255,224,138,${.8*(1-k)})`;ctx.lineWidth=2.5;circle(d.x,d.y,10+k*26);ctx.stroke()}}
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(d.x,d.y+8,8,3,0,0,7);ctx.fill();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(d.x,d.y-10+bob);ctx.lineTo(d.x+7,d.y+bob);ctx.lineTo(d.x,d.y+10+bob);ctx.lineTo(d.x-7,d.y+bob);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1.5;ctx.stroke();
}
const zoom=()=>clamp(Math.min(innerWidth,innerHeight)/620,.62,1.5);
function render2D(){
  const z=zoom(),vw=innerWidth/z,vh=innerHeight/z;G.vw=vw;G.vh=vh;
  const P=G.P,hs_=(G.hshake||0)*SET.shake,sx=hs_?rand(-hs_,hs_):0,sy=hs_?rand(-hs_,hs_):0;
  const ox=G.cam.x-vw/2+sx,oy=G.cam.y-vh/2+sy;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#050307';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr*z,0,0,dpr*z,-ox*dpr*z,-oy*dpr*z);
  const vis=(x,y,m=80)=>x>ox-m&&x<ox+vw+m&&y>oy-m&&y<oy+vh+m;
  const x0=Math.max(0,ox),y0=Math.max(0,oy),x1=Math.min(MAP,ox+vw),y1=Math.min(MAP,oy+vh);
  const BI=biome();if(!floorPat){floorPat=ctx.createPattern(buildTile(G.biome),'repeat');floorPat.__b=G.biome}
  if(x1>x0&&y1>y0){ctx.fillStyle=floorPat;ctx.fillRect(x0,y0,x1-x0,y1-y0)}
  // murs d'enceinte
  ctx.strokeStyle=BI.wall[0];ctx.lineWidth=EDGE*2;ctx.strokeRect(0,0,MAP,MAP);
  ctx.strokeStyle=BI.wall[1];ctx.lineWidth=3;ctx.strokeRect(EDGE,EDGE,MAP-EDGE*2,MAP-EDGE*2);
  // cercles runiques
  ctx.strokeStyle=`rgba(${BI.rune},.10)`;ctx.lineWidth=2;
  for(const r of G.runes){if(!vis(r.x,r.y,r.r))continue;circle(r.x,r.y,r.r);ctx.stroke();circle(r.x,r.y,r.r*.82);ctx.stroke();
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(r.x+Math.cos(a)*r.r*.84,r.y+Math.sin(a)*r.r*.84);ctx.lineTo(r.x+Math.cos(a+.2)*r.r*.98,r.y+Math.sin(a+.2)*r.r*.98);ctx.stroke()}}
  for(const z of G.zones){if(!vis(z.x,z.y,z.r))continue;const al=Math.min(1,z.life/.5)*(z.kind==='poison'?.33:.4),pc=z.kind==='poison'?'200,70,190':'255,120,40';ctx.fillStyle=`rgba(${pc},${al})`;circle(z.x,z.y,z.r*(1+.04*Math.sin(G.t*6)));ctx.fill();ctx.strokeStyle=`rgba(${pc},${al+.3})`;ctx.lineWidth=2;ctx.stroke()}
  for(const l of G.lobs){const k=l.t/l.T,pc=l.kind==='poison'?'200,70,190':'255,120,40';ctx.strokeStyle=`rgba(${pc},${.3+.5*k})`;ctx.lineWidth=2;circle(l.tx,l.ty,l.r*k);ctx.stroke();circle(l.tx,l.ty,l.r);ctx.stroke();
    ctx.fillStyle=`rgb(${pc})`;circle(l.x0+(l.tx-l.x0)*k,l.y0+(l.ty-l.y0)*k-Math.sin(k*Math.PI)*80,6);ctx.fill()}
  for(const w of G.wells){if(!w.on||!vis(w.x,w.y,60))continue;ctx.fillStyle='rgba(120,200,255,.25)';circle(w.x,w.y,w.r+6+Math.sin(G.t*3)*3);ctx.fill();ctx.fillStyle='#2b4f66';circle(w.x,w.y,w.r);ctx.fill();ctx.strokeStyle='#bfeaff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='rgba(200,240,255,.8)';circle(w.x,w.y,w.r*.45);ctx.fill()}
  for(const s of G.spawns)if(s.t<.9&&!s.split){const k=1-s.t/.9;ctx.strokeStyle=`rgba(170,110,220,${.3+k*.6})`;ctx.lineWidth=2;circle(s.x,s.y,20*(.4+k*.6));ctx.stroke()}
  for(const d of G.drops)if(vis(d.x,d.y,150))drawDrop(d);
  if(G.exitPt){const x=G.exitPt,k=Math.sin(G.t*4)*.5+.5;ctx.fillStyle=`rgba(95,191,122,${.12+.15*k})`;circle(x.x,x.y,55);ctx.fill();ctx.strokeStyle='rgba(95,191,122,.9)';ctx.lineWidth=3;ctx.stroke();beam(x.x,x.y,170,'#5fbf7a',.45);if(G.extT>0){ctx.strokeStyle='#bff5cc';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x.x,x.y,64,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,G.extT/EXT_T));ctx.stroke()}}
  if(G.pod&&vis(G.pod.x,G.pod.y)){const p=G.pod,h=p.r*1.15;shadow(p.x,p.y,p.r);ctx.fillStyle='#1e2a30';circle(p.x,p.y,p.r);ctx.fill();ctx.strokeStyle='#5fb8c9';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=p.flash>0?'#fff':'#8fd3e0';ctx.beginPath();ctx.moveTo(p.x,p.y-h-4+Math.sin(G.t*2)*2);ctx.lineTo(p.x+p.r*.5,p.y-4);ctx.lineTo(p.x,p.y+p.r*.55);ctx.lineTo(p.x-p.r*.5,p.y-4);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(143,211,224,.35)';ctx.lineWidth=2;circle(p.x,p.y,p.r+10+Math.sin(G.t*3)*2);ctx.stroke()}
  for(const p of G.pillars){if(p===G.pod||!vis(p.x,p.y))continue;shadow(p.x,p.y,p.r);const gr=ctx.createRadialGradient(p.x-p.r*.3,p.y-p.r*.3,2,p.x,p.y,p.r);gr.addColorStop(0,BI.pil[0]);gr.addColorStop(1,BI.pil[1]);ctx.fillStyle=gr;circle(p.x,p.y,p.r);ctx.fill();ctx.strokeStyle='#0c0a0e';ctx.lineWidth=2;ctx.stroke()}
  for(const b of G.braziers){if(!vis(b.x,b.y))continue;ctx.fillStyle='#2a2228';circle(b.x,b.y,9);ctx.fill();ctx.strokeStyle='#4a3e44';ctx.lineWidth=2;ctx.stroke()}
  for(const e of G.en){if(!vis(e.x,e.y,e.r+40))continue;if(e.corr){ctx.fillStyle='rgba(240,190,60,.22)';circle(e.x,e.y,e.r+9);ctx.fill();ctx.strokeStyle='rgba(255,207,90,.7)';ctx.lineWidth=1.5;ctx.stroke()}if(e.elite){const c=ELITE[e.elite].c,k=Math.sin(G.t*5)*.5+.5;ctx.strokeStyle=c;ctx.globalAlpha=.55+.4*k;ctx.lineWidth=3;circle(e.x,e.y,e.r+8+k*3);ctx.stroke();ctx.globalAlpha=1}drawEnemy(e);if(e.elite){ctx.font='700 11px Alegreya Sans,sans-serif';ctx.textAlign='center';ctx.fillStyle=ELITE[e.elite].c;ctx.fillText('Élite · '+ELITE[e.elite].n,e.x,e.y-e.r-14)}if(e.frz>0){ctx.fillStyle='rgba(215,245,255,.55)';circle(e.x,e.y,e.r+3);ctx.fill();ctx.strokeStyle='rgba(235,250,255,.9)';ctx.lineWidth=2;ctx.stroke()}if(e.slow>0){ctx.fillStyle='rgba(150,210,255,.35)';circle(e.x,e.y,e.r+2);ctx.fill()}}
  if(NET.on)for(const Q of G.mates||[]){const sc=G.cls;G.cls=Q.cls;drawPlayer(Q);G.cls=sc;ctx.globalAlpha=1;if(Q.down){ctx.fillStyle='rgba(10,8,12,.55)';circle(Q.x,Q.y,Q.r+4);ctx.fill()}hpRing2D(Q,Q.max);allyTag2D(Q)}
  if(P.down){ctx.globalAlpha=.4}drawPlayer(P);ctx.globalAlpha=1;hpRing2D(P);
  if(NET.on)for(const Q of G.mates||[])petDraw2D(Q.pet,.85);petDraw2D(G.pet,1);
  ctx.lineCap='round';
  for(const s of allShots()){if(!vis(s.x,s.y,20))continue;
    if(s.kind==='wave'){ctx.strokeStyle=`rgba(255,230,200,${Math.min(1,s.life*2.2)})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x-Math.cos(s.a)*14,s.y-Math.sin(s.a)*14,16,s.a-1,s.a+1);ctx.stroke();continue}
    if(s.kind==='orb'){ctx.fillStyle='rgba(140,190,255,.35)';circle(s.x-s.vx*.025,s.y-s.vy*.025,8);ctx.fill();ctx.fillStyle='#bfe0ff';circle(s.x,s.y,6);ctx.fill();ctx.fillStyle='#fff';circle(s.x,s.y,2.5);ctx.fill();continue}
    ctx.strokeStyle=s.crit?'#ffe07a':'#f0a45a';ctx.lineWidth=s.crit?4:3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.025,s.y-s.vy*.025);ctx.stroke()}
  for(const b of G.eb){if(!vis(b.x,b.y,20))continue;ctx.fillStyle='#b27ae6';circle(b.x,b.y,b.r);ctx.fill();ctx.fillStyle='#f1defd';circle(b.x,b.y,b.r*.45);ctx.fill()}
  for(const p of G.parts){if(!vis(p.x,p.y,10))continue;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;circle(p.x,p.y,p.size);ctx.fill()}
  ctx.globalAlpha=1;
  for(const z2 of G.zaps){ctx.strokeStyle=`rgba(200,230,255,${1-z2.t/.25})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(z2.x1,z2.y1);
    for(let i=1;i<6;i++){const k=i/6;ctx.lineTo(z2.x1+(z2.x2-z2.x1)*k+rand(-9,9),z2.y1+(z2.y2-z2.y1)*k+rand(-9,9))}ctx.lineTo(z2.x2,z2.y2);ctx.stroke()}
  for(const r of G.rings){const k=r.t/.45,R=r.max||175;ctx.strokeStyle=`rgba(${r.col||'255,140,60'},${1-k})`;ctx.lineWidth=14*(1-k)+2;circle(r.x,r.y,R*.17+R*.83*k);ctx.stroke()}
  // obscurité + braseros
  const out=Math.max(vw,vh)*.62,dk=ctx.createRadialGradient(P.x,P.y,150,P.x,P.y,out);dk.addColorStop(0,'rgba(6,4,9,0)');dk.addColorStop(1,'rgba(6,4,9,.74)');
  ctx.fillStyle=dk;ctx.fillRect(ox-20,oy-20,vw+40,vh+40);
  ctx.globalCompositeOperation='lighter';
  for(const b of G.braziers){if(!vis(b.x,b.y,180))continue;const f=1+.06*Math.sin(G.t*11+b.ph)+.04*Math.sin(G.t*23+b.ph*2),gr=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,170*f);gr.addColorStop(0,`rgba(${BI.light},.26)`);gr.addColorStop(1,`rgba(${BI.light},0)`);ctx.fillStyle=gr;ctx.fillRect(b.x-180,b.y-180,360,360);
    ctx.fillStyle=`rgba(${BI.flame},.9)`;ctx.beginPath();ctx.ellipse(b.x,b.y-5,4*f,8*f,0,0,7);ctx.fill()}
  if(G.pod){const p=G.pod,gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,150);gr.addColorStop(0,'rgba(120,210,230,.3)');gr.addColorStop(1,'rgba(120,210,230,0)');ctx.fillStyle=gr;ctx.fillRect(p.x-150,p.y-150,300,300)}
  if(G.exitPt){const x=G.exitPt,gr=ctx.createRadialGradient(x.x,x.y,0,x.x,x.y,140);gr.addColorStop(0,'rgba(95,191,122,.3)');gr.addColorStop(1,'rgba(95,191,122,0)');ctx.fillStyle=gr;ctx.fillRect(x.x-140,x.y-140,280,280)}
  ctx.globalCompositeOperation='source-over';
  ctx.textAlign='center';
  for(const t of G.texts){if(!vis(t.x,t.y,30))continue;ctx.globalAlpha=1-t.t/.8;ctx.font=`700 ${t.size}px 'Alegreya Sans',system-ui,sans-serif`;ctx.fillStyle='#000';ctx.fillText(t.txt,t.x+1,t.y-t.t*40+1);ctx.fillStyle=t.col;ctx.fillText(t.txt,t.x,t.y-t.t*40)}
  ctx.globalAlpha=1;
  // écran : flèches vers les Gardiens, joystick
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const arrow=(wx,wy,col,label)=>{if(vis(wx,wy,-10))return;
    const a=Math.atan2(wy-G.cam.y,wx-G.cam.x),cx=innerWidth/2,cy=innerHeight/2,hw=innerWidth/2-34,hh=innerHeight/2-130;
    const k=Math.min(hw/Math.abs(Math.cos(a)||1e-6),hh/Math.abs(Math.sin(a)||1e-6)),x=cx+Math.cos(a)*k,y=cy+Math.sin(a)*k;
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;ctx.strokeStyle='#120c16';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-3,0);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    if(label){ctx.font="700 12px 'Alegreya Sans',system-ui,sans-serif";ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(label,x-Math.cos(a)*26+1,y-Math.sin(a)*26+5);ctx.fillStyle=col;ctx.fillText(label,x-Math.cos(a)*26,y-Math.sin(a)*26+4)}};
  const m=(x,y)=>`${Math.round(Math.hypot(x-P.x,y-P.y)/10)} m`;
  for(const e of G.en)if(e.type==='boss')arrow(e.x,e.y,'#b06ae0');
  if(G.target)arrow(G.target.x,G.target.y,'#f0cf4a',m(G.target.x,G.target.y));
  if(G.exitPt)arrow(G.exitPt.x,G.exitPt.y,'#5fbf7a',m(G.exitPt.x,G.exitPt.y));
  if(G.pod)arrow(G.pod.x,G.pod.y,'#8fd3e0','Cryopode');
  {let wb=null,wd=1e9;for(const w of G.wells)if(w.on){const dd=Math.hypot(w.x-P.x,w.y-P.y);if(dd<wd){wd=dd;wb=w}}if(wb)arrow(wb.x,wb.y,'#9fdcff',(P.psnT>0||P.brnT>0?'Source ':'')+m(wb.x,wb.y))}
  if(joy.id!==null){ctx.strokeStyle='rgba(237,227,209,.25)';ctx.lineWidth=2;circle(joy.ox,joy.oy,56);ctx.stroke();ctx.fillStyle='rgba(237,227,209,.3)';circle(joy.ox+joy.vx*56,joy.oy+joy.vy*56,22);ctx.fill()}
}
const _el={},el=id=>_el[id]||(_el[id]=$(id));
const setTx=(id,v)=>{const e=el(id);if(e._v!==v){e._v=v;e.textContent=v}};
const setSt=(id,p,v)=>{const e=el(id),k='_s'+p;if(e[k]!==v){e[k]=v;e.style.setProperty(p,v)}};
const setCls=(id,c,on)=>{const e=el(id);if(e.classList.contains(c)!==on)e.classList.toggle(c,on)};
const setHid=(id,h)=>{const e=el(id);if(e.hidden!==h)e.hidden=h};
function hud(){
  const P=G.P,r3=v=>Math.max(0,v).toFixed(3);
  setSt('hpFill','transform',`scaleX(${r3(P.hp/S.hp)})`);
  setTx('hpNum',`${Math.ceil(P.hp)} / ${Math.round(S.hp)}`);setSt('hpShd','transform',`scaleX(${r3(Math.min(1,(P.shield||0)/S.hp))})`);setCls('hpBox','low',P.hp<S.hp*.3&&!G.over);
  setTx('hpTxt',(P.shield>=1?`Bouclier ${Math.floor(P.shield)} · `:'')+`Héros niveau ${G.hl}`);
  setTx('goldTxt',String(G.gold));
  setSt('xpFill','transform',`scaleX(${r3(Math.min(1,G.xp/xpNeed(G.hl)))})`);
  const dm=(x,y)=>`${Math.round(Math.hypot(x-P.x,y-P.y)/10)} m`;let hot=false;
  let ok='',ov='',op=null,oc='#f0cf4a';
  if(G.mode==='survie'){const left=Math.max(0,LEVEL_T-G.tl);hot=left<=15;setTx('lvlTxt',`Niveau ${G.level}`);ok='Survie · portail dans';ov=fmt(left);op=G.tl/LEVEL_T;oc='#5fbf7a';setTx('bossTxt',`Gardien ${fmt(G.bossT)}`)}
  else if(G.mode==='defense'){setTx('lvlTxt',`Vague ${Math.max(1,G.wave)}`);if(G.waveState==='break'){ok='Défense · vague suivante';ov=fmt(G.waveT)}else{ok='Défense · ennemis restants';ov=String(G.toSpawn+G.en.length)}op=G.pod.hp/G.pod.max;oc='#8fd3e0';
    setTx('bossTxt',`Sortie vague ${Math.ceil(Math.max(1,G.wave)/5)*5}`);setSt('objFill','transform',`scaleX(${r3(G.pod.hp/G.pod.max)})`);hot=G.pod.hp<G.pod.max*.3}
  else{setTx('lvlTxt','Capture');const t=G.target;
    if(G.exitPt){ok=G.extT>0?'3/3 · reste dans la zone':'3/3 · rejoins l\'extraction';ov=G.extT>0?`${Math.min(100,Math.round(G.extT/EXT_T*100))} %`:dm(G.exitPt.x,G.exitPt.y);op=G.extT/EXT_T;oc='#5fbf7a';hot=true}
    else if(t&&t.downed){ok='2/3 · capture la cible';ov=`${Math.round(G.capT/2.5*100)} %`;op=G.capT/2.5}
    else if(t){ok='1/3 · mets la cible à terre';ov=dm(t.x,t.y);op=1-t.hp/t.max}
    setTx('bossTxt',`Gardien ${fmt(G.bossT)}`)}
  setTx('objK',ok);setTx('timeTxt',ov);setHid('objBox',!ok);setSt('objFill2','transform',`scaleX(${op==null?0:r3(Math.max(0,Math.min(1,op)))})`);setSt('objFill2','--c',oc);setCls('objBox','hot',hot);
  setHid('relTxt',!G.relQ.length);if(G.relQ.length)setTx('relTxt',G.relic?`Relique ${G.relI+1}/${G.relQ.length} · ${G.react} / ${REACT_N}`:`Reliques ouvertes ${G.opened.length}/${G.relQ.length}`);
  setTx('potN',String(G.potions));
  setHid('stP',!(P.psnT>0));if(P.psnT>0)setTx('stP',`Poison ×${P.psn} · ${Math.ceil(P.psnT)} s`);
  setHid('stF',!(P.frzT>0));if(P.frzT>0)setTx('stF',`Gelure · ${Math.ceil(P.frzT)} s`);
  setHid('stB',!(P.brnT>0));if(P.brnT>0)setTx('stB',`Brûlure · ${Math.ceil(P.brnT)} s`);
  {const n=(G.crits||[]).filter(t=>t>G.t-CS_W).length,on=P.cbT>0;setHid('stC',!(on||n>=3));if(on)setTx('stC',`Frénésie · ${Math.ceil(P.cbT)} s`);else if(n>=3)setTx('stC',`Critiques ${Math.min(n,CS_N)} / ${CS_N}`)}
  setCls('stVig','psn',P.psnT>0&&!(P.brnT>0));setCls('stVig','brn',P.brnT>0);
  setSt('bDash','--cd',r3(P.dashCd/dashCdMax()));
  setSt('bNova','--cd',r3(P.novaCd/(CLS[G.cls].cd*(1-S.cdr/100))));
  setSt('bPot','--cd',G.potions?'0':'1');
  const live=started&&!G.over;
  setCls('bDash','ready',live&&P.dashCd<=0);setCls('bNova','ready',live&&P.novaCd<=0);setCls('bPot','ready',live&&G.potions>0&&P.hp<S.hp);
  {let bh=0,bm=0,bn=0;for(const e of G.en)if(e.type==='boss'&&!e.dead){bh+=Math.max(0,e.hp);bm+=e.max;bn++}
   if(bn){setSt('bossFill','transform',`scaleX(${r3(bh/bm)})`);setTx('bossName',bn>1?`${bn} Gardiens des Cendres`:'Le Gardien des Cendres')}}
  {const un=ultNeed(),ur=Math.min(1,(G.ult||0)/un);setSt('bUlt','--cd',r3(1-ur));setCls('bUlt','ready',live&&ur>=1);setTx('ultN',ur>=1?'':String(un-(G.ult|0)))}
  setHid('badge',!G.fresh);setTx('badge',String(G.fresh));
}

/* ---------- Rendu WebGL (PixiJS) avec repli Canvas ---------- */
let PX=null;
const hexCache=new Map();
function hexc(c){let v=hexCache.get(c);if(v===undefined){let s=c.trim();if(s[0]==='#'){if(s.length===4)s='#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3];v=parseInt(s.slice(1,7),16)}else{const m=s.match(/\d+/g);v=m?((+m[0])<<16)|((+m[1])<<8)|(+m[2]):0xffffff}hexCache.set(c,v)}return v}
function mkTex(w,h,draw,res=3){
  const c=document.createElement('canvas');c.width=Math.ceil(w*res);c.height=Math.ceil(h*res);
  const g=c.getContext('2d');g.scale(res,res);g.translate(w/2,h/2);const old=ctx;ctx=g;try{draw(g)}finally{ctx=old}
  return PIXI.Texture.from(c,{resolution:res});
}
function givrinShape(r,white){ctx.fillStyle=white?'#fff':'#9cc8e8';ctx.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,R=i%2?r*.78:r*1.12;ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R)}ctx.closePath();ctx.fill();
  ctx.strokeStyle=white?'#fff':'#3d6f91';ctx.lineWidth=2;ctx.stroke();if(white)return;ctx.fillStyle='rgba(230,248,255,.6)';circle(-r*.25,-r*.25,r*.3);ctx.fill();ctx.fillStyle='#0f2a3c';circle(r*.42,r*.28,2.6);ctx.fill();circle(r*.42,-r*.28,2.6);ctx.fill()}
function pEnemy(type,white,frame){
  if(type==='givrin'){givrinShape(ETYPE[type].r,white);return}
  const d=ETYPE[type],r=d.r,col=white?'#fff':d.col;
  if(type==='bat'){const fw=frame/2;ctx.fillStyle=col;for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*(r+8),-4-fw*7);ctx.lineTo(s*(r+3),3);ctx.fill()}
    circle(0,0,r*.7);ctx.fill();if(!white){ctx.fillStyle='#ff3b30';circle(-2.5,-1,1.6);ctx.fill();circle(2.5,-1,1.6);ctx.fill()}return}
  if(type==='boss'){ctx.fillStyle=col;circle(0,0,r);ctx.fill();ctx.strokeStyle='#8c5ab0';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=white?'#fff':'#e8853b';
    for(let i=0;i<7;i++){const b=-Math.PI/2+(i-3)*.32,x=Math.cos(b)*r*.82,y=Math.sin(b)*r*.82;ctx.beginPath();ctx.moveTo(x+6*Math.sin(b),y);ctx.lineTo(Math.cos(b)*(r+14),Math.sin(b)*(r+14));ctx.lineTo(x+6,y+4);ctx.fill()}
    if(!white){ctx.fillStyle='#ffb04a';circle(-12,16,5);ctx.fill();circle(12,16,5);ctx.fill()}return}
  if(type==='slime'){slimeShape(r,white,0);return}
  ctx.fillStyle=col;circle(0,0,r);ctx.fill();ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=2;ctx.stroke();
  if(type==='archer'){ctx.strokeStyle='#8a6a45';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(r*.6,0,r*.9,-1.1,1.1);ctx.stroke();ctx.fillStyle='#1a1418';circle(5,0,r*.45);ctx.fill()}
  if(type==='poison'||type==='pyro'){ctx.fillStyle='#1a1418';circle(4,0,r*.5);ctx.fill();if(!white){ctx.fillStyle=type==='poison'?'#e07ad6':'#ffb04a';circle(Math.cos(.9)*r*.9,Math.sin(.9)*r*.9,4.5);ctx.fill()}}
  if(type==='brute'){ctx.fillStyle='#3a1618';circle(7,0,r*.55);ctx.fill();ctx.fillStyle='#d8cfb8';
    for(const s of[-1,1]){ctx.beginPath();ctx.moveTo(Math.cos(s*.9)*r,Math.sin(s*.9)*r);ctx.lineTo(Math.cos(s*.6)*(r+10),Math.sin(s*.6)*(r+10));ctx.lineTo(Math.cos(s*.5)*r,Math.sin(s*.5)*r);ctx.fill()}}
  if(!white){const ex=r*.45,py=r*.3;ctx.fillStyle='#ff3b30';circle(ex,py,2.4);ctx.fill();circle(ex,-py,2.4);ctx.fill()}
}
function pCible(st){const r=18;ctx.fillStyle=st===2?'#5a5040':st===1?'#fff':'#a8874a';circle(0,0,r);ctx.fill();ctx.strokeStyle='#f0cf4a';ctx.lineWidth=3;ctx.stroke();if(st===0){ctx.fillStyle='#2a1e0e';circle(-5,0,r*.5);ctx.fill()}}
function pPlayer(cls,flash){
  const C=CLS[cls],r=17;ctx.lineCap='round';
  if(cls==='archer'){ctx.strokeStyle='#d6b17c';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(r*.3,0);ctx.lineTo(r+9,0);ctx.stroke();
    ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(r+5,11);ctx.quadraticCurveTo(r+12,0,r+5,-11);ctx.stroke()}
  else if(cls==='guerrier'){ctx.strokeStyle='#cfd6dc';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(r+1,0);ctx.lineTo(r+26,0);ctx.stroke();
    ctx.strokeStyle='#8a6a45';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(r+1,8);ctx.lineTo(r+1,-8);ctx.stroke()}
  else{ctx.strokeStyle='#7a5a3a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,12);ctx.lineTo(24,12);ctx.stroke();
    const gr=ctx.createRadialGradient(24,12,0,24,12,14);gr.addColorStop(0,'rgba(170,210,255,.9)');gr.addColorStop(1,'rgba(170,210,255,0)');ctx.fillStyle=gr;circle(24,12,14);ctx.fill();
    ctx.fillStyle='#dff0ff';circle(24,12,4);ctx.fill()}
  ctx.fillStyle=flash?'#ffdede':C.cloak;circle(0,0,r);ctx.fill();ctx.strokeStyle=C.rim;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle=C.inner;circle(5,0,r*.55);ctx.fill();ctx.fillStyle='#e8d9b8';circle(8,0,2);ctx.fill();
}
function initPixi(){
  if(typeof PIXI==='undefined'||!PIXI.Renderer)return false;
  const res=Math.min(devicePixelRatio||1,2);
  const R=new PIXI.Renderer({width:innerWidth,height:innerHeight,resolution:res,autoDensity:true,backgroundColor:0x050307,antialias:true});
  const view=R.view;view.id='pv';view.setAttribute('aria-hidden','true');
  Object.assign(view.style,{position:'fixed',left:'0',top:'0',width:'100%',height:'100%',display:'block'});
  cv.parentNode.insertBefore(view,cv);
  view.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!PX)return;PX.lost=true;noteErr('rendu','contexte WebGL perdu');clearTimeout(PX.lostT);PX.lostT=setTimeout(()=>{if(PX&&PX.lost)dropPixi('contexte WebGL non rétabli')},1500)},false);
  view.addEventListener('webglcontextrestored',()=>{if(!PX)return;PX.lost=false;clearTimeout(PX.lostT);try{if(G)buildStatic()}catch(err){dropPixi(err)}},false);
  const C=()=>new PIXI.Container(),Gr=()=>new PIXI.Graphics();
  const stage=C(),world=C(),top=C(),ui=C();
  const T={};
  T.tiles=BIOMES.map((b,i)=>PIXI.Texture.from(buildTile(i)));T.tile=T.tiles[0];
  T.shadow=mkTex(64,28,()=>{ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,0,32,14,0,0,7);ctx.fill()},1);
  T.en={};T.enW={};
  for(const t of['ghoul','archer','brute','boss','poison','pyro','slime','givrin']){const s=2*(ETYPE[t].r+16);T.en[t]=mkTex(s,s,()=>pEnemy(t,false));T.enW[t]=mkTex(s,s,()=>pEnemy(t,true))}
  T.bat=[0,1,2].map(f=>mkTex(48,40,()=>pEnemy('bat',false,f)));T.batW=mkTex(48,40,()=>pEnemy('bat',true,1));
  T.cible=[0,1,2].map(s=>mkTex(48,48,()=>pCible(s)));
  T.pl={};for(const c in CLS)T.pl[c]=[mkTex(100,100,()=>pPlayer(c,false)),mkTex(100,100,()=>pPlayer(c,true))];
  T.circle=mkTex(16,16,()=>{ctx.fillStyle='#fff';circle(0,0,8);ctx.fill()},2);
  T.aura=mkTex(56,56,()=>{ctx.fillStyle='rgba(240,190,60,.22)';circle(0,0,25);ctx.fill();ctx.strokeStyle='rgba(255,207,90,.7)';ctx.lineWidth=1.5;ctx.stroke()});
  T.bolt=mkTex(22,8,()=>{ctx.strokeStyle='#fff';ctx.lineCap='round';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke()});
  T.boltC=mkTex(22,8,()=>{ctx.strokeStyle='#fff';ctx.lineCap='round';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.stroke()});
  T.orb=mkTex(44,22,()=>{ctx.fillStyle='rgba(140,190,255,.35)';circle(-10.75,0,8);ctx.fill();ctx.fillStyle='#bfe0ff';circle(0,0,6);ctx.fill();ctx.fillStyle='#fff';circle(0,0,2.5);ctx.fill()});
  T.wave=mkTex(44,44,()=>{ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.arc(-14,0,16,-1,1);ctx.stroke()});
  T.eb=mkTex(18,18,()=>{ctx.fillStyle='#b27ae6';circle(0,0,8);ctx.fill();ctx.fillStyle='#f1defd';circle(0,0,3.6);ctx.fill()});
  T.gold=mkTex(14,14,()=>{ctx.fillStyle='#f0cf4a';circle(0,0,5);ctx.fill();ctx.strokeStyle='#7a5a10';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#fff6c4';circle(-1.5,-1.5,1.5);ctx.fill()});
  const dia=(c,s)=>()=>{ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.65,0);ctx.lineTo(0,s);ctx.lineTo(-s*.65,0);ctx.fill();ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(-1,-s*.55,2,s*.5)};
  T.xp=[mkTex(14,14,dia('#7fd0e6',5)),mkTex(16,16,dia('#7fe08a',6.5)),mkTex(20,20,dia('#ff7a6b',8))];
  T.react=mkTex(24,24,()=>{ctx.fillStyle='rgba(255,207,90,.35)';circle(0,0,10);ctx.fill();ctx.fillStyle='#ffd77a';circle(0,0,4.5);ctx.fill()});
  T.mod=MOD_RAR.map(m=>mkTex(22,28,()=>{ctx.fillStyle='#1d1822';ctx.fillRect(-8,-11,16,22);ctx.strokeStyle=m.c;ctx.lineWidth=2;ctx.strokeRect(-8,-11,16,22);ctx.fillStyle=m.c;ctx.fillRect(-4,-6,8,2);ctx.fillRect(-4,-1,8,2);ctx.fillRect(-2,4,4,2)}));
  T.relic=RTIER.map(t=>mkTex(22,30,()=>{ctx.fillStyle='#1d1822';ctx.strokeStyle=t.c;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,8,12,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=t.c;ctx.beginPath();ctx.ellipse(0,0,3.5,6,0,0,7);ctx.fill()}));
  T.seal=mkTex(30,30,()=>{ctx.fillStyle='#2a1026';ctx.strokeStyle='#ff5fd2';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,rr=i%2?6:13;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke()});
  T.part=RAR.map(r=>mkTex(26,26,()=>{ctx.fillStyle='#1d1822';ctx.strokeStyle=r.c;ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=r.c;circle(0,0,3.5);ctx.fill()}));
  const itemT=c=>mkTex(20,30,()=>{ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(0,8,8,3,0,0,7);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,0);ctx.lineTo(0,10);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1.5;ctx.stroke()});
  T.item=RAR.map(r=>itemT(r.c));T.potion=itemT('#5fbf7a');
  T.beam=mkTex(8,128,()=>{const gr=ctx.createLinearGradient(0,-64,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');ctx.fillStyle=gr;ctx.fillRect(-4,-64,8,128)},1);
  T.glow=mkTex(256,256,()=>{const gr=ctx.createRadialGradient(0,0,0,0,0,128);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gr;ctx.fillRect(-128,-128,256,256)},1);
  T.flame=mkTex(12,20,()=>{ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.ellipse(0,0,4,8,0,0,7);ctx.fill()});
  T.pillars=BIOMES.map(B=>mkTex(84,110,()=>{const r=34;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(0,r*.75,r*1.05,r*.45,0,0,7);ctx.fill();
    const gr=ctx.createRadialGradient(-r*.3,-r*.3,2,0,0,r);gr.addColorStop(0,B.pil[0]);gr.addColorStop(1,B.pil[1]);ctx.fillStyle=gr;circle(0,0,r);ctx.fill();ctx.strokeStyle='#0c0a0e';ctx.lineWidth=2;ctx.stroke()},2));T.pillar=T.pillars[0];
  T.brazier=mkTex(24,24,()=>{ctx.fillStyle='#2a2228';circle(0,0,9);ctx.fill();ctx.strokeStyle='#4a3e44';ctx.lineWidth=2;ctx.stroke()});
  T.dark=mkTex(512,512,()=>{const gr=ctx.createRadialGradient(0,0,256*.3/1.3,0,0,256/1.3);gr.addColorStop(0,'rgba(6,4,9,0)');gr.addColorStop(1,'rgba(6,4,9,.74)');ctx.fillStyle=gr;ctx.fillRect(-256,-256,512,512)},1);
  PIXI.BitmapFont.from('dmg',{fontFamily:'Alegreya Sans, system-ui, sans-serif',fontSize:40,fontWeight:'700',fill:'#ffffff',stroke:'#000000',strokeThickness:6},
    {chars:[['a','z'],['A','Z'],['0','9'],' !+-%/.éèêàâçùûôî'],resolution:1});
  const L={};
  L.floor=new PIXI.TilingSprite(T.tile,MAP,MAP);
  L.staticG=Gr();L.underG=Gr();L.beam=C();L.drop=C();L.static=C();L.shadow=C();L.aura=C();L.en=C();
  L.player=new PIXI.Sprite(T.pl.archer[0]);L.player.anchor.set(.5);
  L.fxG=Gr();L.shot=C();L.eb=C();L.part=C();L.glow=C();L.glowStatic=C();L.glow.addChild(L.glowStatic);
  world.addChild(L.floor,L.staticG,L.underG,L.beam,L.drop,L.static,L.shadow,L.aura,L.en,L.player,L.fxG,L.shot,L.eb,L.part,L.glow);
  const dark=new PIXI.Sprite(T.dark);dark.anchor.set(.5);
  L.txt=C();top.addChild(L.txt);L.uiG=Gr();L.uiTxt=C();ui.addChild(L.uiG,L.uiTxt);
  stage.addChild(world,dark,top,ui);
  const pool=(layer,mk)=>({layer,mk,arr:[],n:0});
  const spr=()=>{const s=new PIXI.Sprite(PIXI.Texture.WHITE);s.anchor.set(.5);return s};
  const txt=()=>{const t=new PIXI.BitmapText('',{fontName:'dmg',fontSize:16});t.anchor.set(.5,1);return t};
  const P={sh:pool(L.shadow,spr),aura:pool(L.aura,spr),en:pool(L.en,spr),beam:pool(L.beam,()=>{const s=spr();s.anchor.set(.5,1);return s}),drop:pool(L.drop,spr),
    shot:pool(L.shot,spr),eb:pool(L.eb,spr),part:pool(L.part,spr),glow:pool(L.glow,()=>{const s=spr();s.blendMode=PIXI.BLEND_MODES.ADD;return s}),txt:pool(L.txt,txt),utxt:pool(L.uiTxt,txt)};
  PX={R,stage,world,top,ui,dark,T,L,P,statics:[]};
  cv.width=cv.width;
  return true;
}
function take(p){let s=p.arr[p.n];if(!s){s=p.mk();p.arr.push(s);p.layer.addChild(s)}s.visible=true;p.n++;return s}
function endPools(){for(const k in PX.P){const p=PX.P[k];for(let i=p.n;i<p.arr.length;i++)p.arr[i].visible=false;p.n=0}}
function buildStatic(){
  if(!PX||!G)return;const {L,T}=PX;
  for(const c of L.static.removeChildren())c.destroy();for(const c of L.glowStatic.removeChildren())c.destroy();
  PX.statics=[];
  const BI=biome(),hx=c=>parseInt(c.slice(1),16),rgb=s=>{const [a,b,c]=s.split(',').map(Number);return (a<<16)|(b<<8)|c};L.floor.texture=T.tiles[G.biome]||T.tiles[0];
  const g=L.staticG;g.clear();g.lineStyle(EDGE*2,hx(BI.wall[0]),1);g.drawRect(0,0,MAP,MAP);g.lineStyle(3,hx(BI.wall[1]),1);g.drawRect(EDGE,EDGE,MAP-EDGE*2,MAP-EDGE*2);
  g.lineStyle(2,rgb(BI.rune),.1);
  for(const r of G.runes){g.drawCircle(r.x,r.y,r.r);g.drawCircle(r.x,r.y,r.r*.82);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.moveTo(r.x+Math.cos(a)*r.r*.84,r.y+Math.sin(a)*r.r*.84);g.lineTo(r.x+Math.cos(a+.2)*r.r*.98,r.y+Math.sin(a+.2)*r.r*.98)}}
  for(const p of G.pillars){if(p===G.pod)continue;const s=new PIXI.Sprite(T.pillars[G.biome]||T.pillar);s.anchor.set(.5);s.scale.set(p.r/34);s.position.set(p.x,p.y);L.static.addChild(s);PX.statics.push({s,x:p.x,y:p.y,m:80})}
  for(const b of G.braziers){
    const s=new PIXI.Sprite(T.brazier);s.anchor.set(.5);s.position.set(b.x,b.y);L.static.addChild(s);
    const gl=new PIXI.Sprite(T.glow);gl.anchor.set(.5);gl.blendMode=PIXI.BLEND_MODES.ADD;gl.tint=BI.tint;gl.alpha=.26;gl.position.set(b.x,b.y);gl.width=gl.height=340;
    const fl=new PIXI.Sprite(T.flame);fl.anchor.set(.5);fl.blendMode=PIXI.BLEND_MODES.ADD;fl.tint=rgb(BI.flame);fl.position.set(b.x,b.y-5);
    L.glowStatic.addChild(gl,fl);PX.statics.push({s,x:b.x,y:b.y,m:40},{s:gl,x:b.x,y:b.y,m:180,b,glow:1},{s:fl,x:b.x,y:b.y,m:40,b,flame:1});
  }
}
const EXT_T=3;
function arcLine(g,x,y,r,a0,a1){g.moveTo(x+Math.cos(a0)*r,y+Math.sin(a0)*r);g.arc(x,y,r,a0,a1)}
function renderPixi(){
  const {R,world,top,dark,T,L,P:PP}=PX;
  const z=zoom(),vw=innerWidth/z,vh=innerHeight/z;G.vw=vw;G.vh=vh;
  const P=G.P,hs_=(G.hshake||0)*SET.shake,sx=hs_?rand(-hs_,hs_):0,sy=hs_?rand(-hs_,hs_):0;
  const ox=G.cam.x-vw/2+sx,oy=G.cam.y-vh/2+sy;
  world.scale.set(z);world.position.set(-ox*z,-oy*z);top.scale.set(z);top.position.set(-ox*z,-oy*z);
  const vis=(x,y,m=80)=>x>ox-m&&x<ox+vw+m&&y>oy-m&&y<oy+vh+m;
  for(const o of PX.statics){const v=vis(o.x,o.y,o.m);o.s.visible=v;if(!v)continue;
    if(o.glow){const f=1+.06*Math.sin(G.t*11+o.b.ph)+.04*Math.sin(G.t*23+o.b.ph*2);o.s.width=o.s.height=340*f}
    else if(o.flame){const f=1+.06*Math.sin(G.t*11+o.b.ph)+.04*Math.sin(G.t*23+o.b.ph*2);o.s.scale.set(f)}}
  // sous-couche
  const u=L.underG;u.clear();
  if(G.exitPt){const x=G.exitPt,k=Math.sin(G.t*4)*.5+.5;u.lineStyle(3,0x5fbf7a,.9);u.beginFill(0x5fbf7a,.12+.15*k);u.drawCircle(x.x,x.y,55);u.endFill();if(G.extT>0){u.lineStyle(6,0xbff5cc,1);arcLine(u,x.x,x.y,64,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,G.extT/EXT_T));u.lineStyle(0)}
    const b=take(PP.beam);b.texture=T.beam;b.tint=0x5fbf7a;b.alpha=.45;b.position.set(x.x,x.y);b.width=8;b.height=170;
    const gl=take(PP.glow);gl.texture=T.glow;gl.tint=0x5fbf7a;gl.alpha=.3;gl.position.set(x.x,x.y);gl.width=gl.height=280}
  for(const z of G.zones){if(!vis(z.x,z.y,z.r))continue;const al=Math.min(1,z.life/.5)*(z.kind==='poison'?.33:.4),c=z.kind==='poison'?0xc846be:0xff7828;u.lineStyle(2,c,Math.min(1,al+.3));u.beginFill(c,al);u.drawCircle(z.x,z.y,z.r*(1+.04*Math.sin(G.t*6)));u.endFill()}
  for(const l of G.lobs){const k=l.t/l.T,c=l.kind==='poison'?0xc846be:0xff7828;u.lineStyle(2,c,.3+.5*k);u.drawCircle(l.tx,l.ty,l.r*k);u.drawCircle(l.tx,l.ty,l.r)}
  for(const w of G.wells){if(!w.on||!vis(w.x,w.y,60))continue;u.lineStyle(0);u.beginFill(0x78c8ff,.25);u.drawCircle(w.x,w.y,w.r+6+Math.sin(G.t*3)*3);u.endFill();u.lineStyle(3,0xbfeaff,1);u.beginFill(0x2b4f66,1);u.drawCircle(w.x,w.y,w.r);u.endFill();u.lineStyle(0);u.beginFill(0xc8f0ff,.8);u.drawCircle(w.x,w.y,w.r*.45);u.endFill();
    const gl=take(PP.glow);gl.texture=T.glow;gl.tint=0x78c8ff;gl.alpha=.3;gl.position.set(w.x,w.y);gl.width=gl.height=220}
  for(const s of G.spawns)if(s.t<.9&&!s.split){const k=1-s.t/.9;u.lineStyle(2,0xaa6edc,.3+k*.6);u.drawCircle(s.x,s.y,20*(.4+k*.6))}
  if(G.pod){const p=G.pod,h=p.r*1.15;
    u.lineStyle(3,0x5fb8c9,1);u.beginFill(0x1e2a30,1);u.drawCircle(p.x,p.y,p.r);u.endFill();
    u.lineStyle(0);u.beginFill(p.flash>0?0xffffff:0x8fd3e0,1);u.moveTo(p.x,p.y-h-4+Math.sin(G.t*2)*2);u.lineTo(p.x+p.r*.5,p.y-4);u.lineTo(p.x,p.y+p.r*.55);u.lineTo(p.x-p.r*.5,p.y-4);u.closePath();u.endFill();
    u.lineStyle(2,0x8fd3e0,.35);u.drawCircle(p.x,p.y,p.r+10+Math.sin(G.t*3)*2);
    const gl=take(PP.glow);gl.texture=T.glow;gl.tint=0x78d2e6;gl.alpha=.3;gl.position.set(p.x,p.y);gl.width=gl.height=300}
  for(const e of G.en)if(e.state==='wind'&&vis(e.x,e.y,450)){const len=e.type==='boss'?420:e.type==='slime'?150:300;u.lineStyle(e.r*1.4,0xdc3c3c,.45);u.moveTo(e.x,e.y);u.lineTo(e.x+Math.cos(e.ang)*len,e.y+Math.sin(e.ang)*len)}
  const t=G.target;
  if(t&&t.downed){u.lineStyle(2,0xf0cf4a,.55);for(let i=0;i<24;i+=2)arcLine(u,t.x,t.y,80,i/24*Math.PI*2,(i+1)/24*Math.PI*2)}
  // butin
  for(const d of G.drops){if(!vis(d.x,d.y,150))continue;const bob=Math.sin(d.t*3)*3,s=take(PP.drop);s.rotation=0;s.tint=0xffffff;s.alpha=1;s.scale.set(1);
    let beamC=0,beamH=0,beamA=.3;
    if(d.kind==='gold'){s.texture=T.gold;s.position.set(d.x,d.y+bob*.6)}
    else if(d.kind==='xp'){s.texture=T.xp[d.v>=20?2:d.v>=5?1:0];s.position.set(d.x,d.y)}
    else if(d.kind==='react'){s.texture=T.react;s.position.set(d.x,d.y);s.alpha=.75+.25*Math.sin(d.t*6)}
    else if(d.kind==='mod'){const r=MODS[d.id].r;s.texture=T.mod[r];s.position.set(d.x,d.y+bob);s.rotation=Math.sin(d.t*2)*.25;beamC=MOD_RAR[r].c;beamH=90}
    else if(d.kind==='seal'){s.texture=T.seal;s.position.set(d.x,d.y+bob);s.rotation=G.t*1.5;beamC=SEAL_C;beamH=170;beamA=.55}
    else if(d.kind==='relic'){const r=RELICS[d.id].t;s.texture=T.relic[r];s.position.set(d.x,d.y+bob);beamC=RTIER[r].c;beamH=130;beamA=.4}
    else if(d.kind==='part'){const r=bpdef(d.part.w).r;s.texture=T.part[r];s.position.set(d.x,d.y+bob);s.rotation=d.t*.8;beamC=RAR[r].c;beamH=90}
    else if(d.kind==='potion'){s.texture=T.potion;s.position.set(d.x,d.y+bob)}
    else{s.texture=T.item[d.item.r];s.position.set(d.x,d.y+bob);beamC=d.wish?'#ffe08a':RAR[d.item.r].c;beamH=d.wish?220:d.item.r>=3?150:d.item.r===2?100:60;beamA=d.wish?.6:.35;if(d.wish){const k=(G.t*1.6)%1;s.scale.set(1+.25*Math.sin(G.t*8))}}
    if(beamH){const b=take(PP.beam);b.texture=T.beam;b.tint=hexc(beamC);b.alpha=beamA;b.position.set(d.x,d.y);b.width=8;b.height=beamH}}
  // ennemis
  const shadow=(x,y,r)=>{const s=take(PP.sh);s.texture=T.shadow;s.position.set(x,y+r*.75);s.width=r*2.1;s.height=r*.9;s.alpha=.4;s.rotation=0;s.tint=0};
  for(const e of G.en){if(!vis(e.x,e.y,e.r+40))continue;shadow(e.x,e.y,e.r);
    if(e.corr){const a=take(PP.aura);a.texture=T.aura;a.position.set(e.x,e.y);a.scale.set((e.r+9)/25);a.tint=0xffffff;a.alpha=1;a.rotation=0}
    if(e.elite){const a=take(PP.aura);a.texture=T.aura;a.position.set(e.x,e.y);a.scale.set((e.r+12+Math.sin(G.t*5)*3)/25);a.tint=hexc(ELITE[e.elite].c);a.alpha=1;a.rotation=0}
    const s=take(PP.en);s.alpha=1;s.scale.set(1);s.position.set(e.x,e.y);s.tint=e.frz>0?0xe6f8ff:e.slow>0?0x9fd0ff:0xffffff;
    if(e.type==='bat'){s.texture=e.flash>0?T.batW:T.bat[Math.round((Math.sin(G.t*22+e.wob)*.5+.5)*2)];s.rotation=0}
    else if(e.type==='cible'){s.texture=e.downed?T.cible[2]:e.flash>0?T.cible[1]:T.cible[0];s.rotation=Math.atan2(e.y-P.y,e.x-P.x)+Math.PI}
    else if(e.type==='boss'){s.texture=e.flash>0?T.enW.boss:T.en.boss;s.rotation=0}
    else{s.texture=e.flash>0?T.enW[e.type]:T.en[e.type];const tg=(e.tgtPod&&G.pod)?G.pod:P;s.rotation=Math.atan2(tg.y-e.y,tg.x-e.x);
      if(e.type==='slime'){const k=e.r/ETYPE.slime.r,w=Math.sin(G.t*6+e.wob)*.08;s.scale.set(k*(1+w),k*(1-w))}}}
  // héros
  shadow(P.x,P.y,P.r);
  const pl=L.player;pl.texture=T.pl[G.cls][P.flash>0?1:0];pl.position.set(P.x,P.y);pl.rotation=P.face;pl.alpha=P.down?.4:P.dashT>0?.55:(P.inv>0&&Math.floor(G.t*20)%2?.6:1);
  {const M=NET.on?(G.mates||[]):[];L.mateS=L.mateS||[];
    for(let i=0;i<Math.max(M.length,L.mateS.length);i++){const Q=M[i];let q=L.mateS[i];if(!Q){if(q)q.visible=false;continue}
      if(!q){q=new PIXI.Sprite(T.pl.archer[0]);q.anchor.set(.5);world.addChildAt(q,world.getChildIndex(L.player));L.mateS[i]=q}
      q.visible=true;q.texture=T.pl[Q.cls][Q.flash>0?1:0];q.position.set(Q.x,Q.y);q.rotation=Q.face;q.alpha=Q.down?.35:Q.dashT>0?.6:1;shadow(Q.x,Q.y,Q.r)}}
  // effets
  const f=L.fxG;f.clear();
  if(NET.on)for(const Q of G.mates||[])petDrawPx(f,Q.pet,.85);petDrawPx(f,G.pet,1);
  for(const e of G.en){if(e.type==='cible'||!(e.shown>0&&e.hp<e.max)||!vis(e.x,e.y,e.r+20))continue;const w=e.r*2;
    f.lineStyle(0);f.beginFill(0x000000,.6);f.drawRect(e.x-w/2,e.y-e.r-10,w,4);f.endFill();f.beginFill(0xd9454a,1);f.drawRect(e.x-w/2,e.y-e.r-10,w*Math.max(0,e.hp/e.max),4);f.endFill()}
  if(t){if(!t.downed){f.lineStyle(2,0xf0cf4a,.5);f.drawCircle(t.x,t.y,t.r+7+Math.sin(G.t*6)*1.5);const w=48;f.lineStyle(0);f.beginFill(0,.6);f.drawRect(t.x-w/2,t.y-t.r-14,w,5);f.endFill();f.beginFill(0xf0cf4a,1);f.drawRect(t.x-w/2,t.y-t.r-14,w*t.hp/t.max,5);f.endFill()}
    else if(G.capT>0){f.lineStyle(5,0xf0cf4a,1);arcLine(f,t.x,t.y,t.r+14,-Math.PI/2,-Math.PI/2+Math.PI*2*G.capT/2.5)}}
  if(P.spin>0){const R2=130*(1+S.reach/100);f.lineStyle(12,0xffe1be,.28);arcLine(f,P.x,P.y,R2*.8,P.face,P.face+4.5)}
  for(const l of G.lobs){const k=l.t/l.T;f.lineStyle(0);f.beginFill(l.kind==='poison'?0xc846be:0xff7828,1);f.drawCircle(l.x0+(l.tx-l.x0)*k,l.y0+(l.ty-l.y0)*k-Math.sin(k*Math.PI)*80,6);f.endFill()}
  if(P.shield>0){f.lineStyle(2.5,0x96d2ff,.3+.5*P.shield/(S.hp*.25));f.drawCircle(P.x,P.y,P.r+6)}
  const ringPx=(P,MX)=>{const k=Math.max(0,Math.min(1,P.hp/MX)),R=P.r+12,c=hpCol(k),a0=-Math.PI/2;f.lineStyle(9,0x000000,.75);f.drawCircle(P.x,P.y,R);f.lineStyle(6,0x3c1418,.9);f.drawCircle(P.x,P.y,R);
    if(k>0){f.lineStyle(10,(c[0]<<16)|(c[1]<<8)|c[2],.25);arcLine(f,P.x,P.y,R,a0,a0+Math.PI*2*k);f.lineStyle(6,(c[0]<<16)|(c[1]<<8)|c[2],k<.25?.75+.25*Math.sin(G.t*10):.95);arcLine(f,P.x,P.y,R,a0,a0+Math.PI*2*k)}
    if(P.shield>0){f.lineStyle(3,0x96d2ff,.9);arcLine(f,P.x,P.y,R+6,a0,a0+Math.PI*2*Math.min(1,P.shield/MX))}};
  ringPx(P,S.hp);
  if(NET.on)for(const Q of G.mates||[]){ringPx(Q,Q.max||1);const b=take(PP.txt),lab=Q.down?'à terre':`J${(Q.slot|0)+1} · ${CLS[Q.cls].n}`;if(b.text!==lab)b.text=lab;b.fontSize=12;b.tint=Q.down?0xff8a80:parseInt((SLOT_C[Q.slot|0]||'#8fd3e0').slice(1),16);b.alpha=1;b.position.set(Q.x,Q.y-Q.r-16)}
  if(P.swing){const k=P.swing.t/.2,R2=P.swing.R;f.lineStyle(9*(1-k)+2,0xffebd2,.85*(1-k));arcLine(f,P.x,P.y,R2*.85,P.swing.a-1.35,P.swing.a-1.35+2.7*Math.min(1,k*2.2))}
  for(const r of G.rings){const k=r.t/.45,Rr=r.max||175;f.lineStyle(14*(1-k)+2,hexc('rgb('+(r.col||'255,140,60')+')'),Math.max(0,1-k));f.drawCircle(r.x,r.y,Rr*.17+Rr*.83*k)}
  for(const zp of G.zaps){f.lineStyle(2.5,0xc8e6ff,Math.max(0,1-zp.t/.25));f.moveTo(zp.x1,zp.y1);for(let i=1;i<6;i++){const k=i/6;f.lineTo(zp.x1+(zp.x2-zp.x1)*k+rand(-9,9),zp.y1+(zp.y2-zp.y1)*k+rand(-9,9))}f.lineTo(zp.x2,zp.y2)}
  // projectiles
  for(const s of allShots()){if(!vis(s.x,s.y,20))continue;const sp=take(PP.shot);sp.scale.set(1);
    if(s.kind==='orb'){sp.texture=T.orb;sp.rotation=Math.atan2(s.vy,s.vx);sp.tint=0xffffff;sp.alpha=1;sp.position.set(s.x,s.y)}
    else if(s.kind==='wave'){sp.texture=T.wave;sp.rotation=s.a;sp.tint=0xffe6c8;sp.alpha=Math.min(1,s.life*2.2);sp.position.set(s.x,s.y)}
    else{sp.texture=s.crit?T.boltC:T.bolt;sp.rotation=Math.atan2(s.vy,s.vx);sp.tint=s.crit?0xffe07a:0xf0a45a;sp.alpha=1;sp.position.set(s.x-s.vx*.0125,s.y-s.vy*.0125)}}
  for(const b of G.eb){if(!vis(b.x,b.y,20))continue;const s=take(PP.eb);s.texture=T.eb;s.position.set(b.x,b.y);s.scale.set(b.r/8);s.tint=0xffffff;s.alpha=1}
  for(const p of G.parts){if(!vis(p.x,p.y,10))continue;const s=take(PP.part);s.texture=T.circle;s.position.set(p.x,p.y);s.scale.set(p.size/8);s.tint=hexc(p.col);s.alpha=Math.max(0,p.life/p.max)}
  // obscurité
  const out=Math.max(vw,vh)*.62;dark.position.set((P.x-ox)*z,(P.y-oy)*z);dark.width=dark.height=out*2*1.3*z;
  // textes
  for(const tx of G.texts){if(!vis(tx.x,tx.y,30))continue;const b=take(PP.txt);if(b.text!==tx.txt)b.text=String(tx.txt);b.fontSize=tx.size;b.tint=hexc(tx.col);b.alpha=Math.max(0,1-tx.t/.8);b.position.set(tx.x,tx.y-tx.t*40+4)}
  // interface : flèches, joystick
  const g=L.uiG;g.clear();
  const arrow=(wx,wy,col,label)=>{if(vis(wx,wy,-10))return;const c=hexc(col);
    const a=Math.atan2(wy-G.cam.y,wx-G.cam.x),cx=innerWidth/2,cy=innerHeight/2,hw=innerWidth/2-34,hh=innerHeight/2-130;
    const k=Math.min(hw/Math.abs(Math.cos(a)||1e-6),hh/Math.abs(Math.sin(a)||1e-6)),x=cx+Math.cos(a)*k,y=cy+Math.sin(a)*k,ca=Math.cos(a),sa=Math.sin(a);
    const pt=(px,py)=>[x+px*ca-py*sa,y+px*sa+py*ca];
    g.lineStyle(2,0x120c16,1);g.beginFill(c,1);g.moveTo(...pt(14,0));g.lineTo(...pt(-8,-10));g.lineTo(...pt(-3,0));g.lineTo(...pt(-8,10));g.closePath();g.endFill();
    if(label){const b=take(PP.utxt);if(b.text!==label)b.text=label;b.fontSize=12;b.tint=c;b.alpha=1;b.position.set(x-ca*26,y-sa*26+6)}};
  const m=(x,y)=>`${Math.round(Math.hypot(x-P.x,y-P.y)/10)} m`;
  for(const e of G.en)if(e.type==='boss')arrow(e.x,e.y,'#b06ae0');
  if(G.target)arrow(G.target.x,G.target.y,'#f0cf4a',m(G.target.x,G.target.y));
  if(G.exitPt)arrow(G.exitPt.x,G.exitPt.y,'#5fbf7a',m(G.exitPt.x,G.exitPt.y));
  if(G.pod)arrow(G.pod.x,G.pod.y,'#8fd3e0','Cryopode');
  {let wb=null,wd=1e9;for(const w of G.wells)if(w.on){const dd=Math.hypot(w.x-P.x,w.y-P.y);if(dd<wd){wd=dd;wb=w}}if(wb)arrow(wb.x,wb.y,'#9fdcff',(P.psnT>0||P.brnT>0?'Source ':'')+m(wb.x,wb.y))}
  if(joy.id!==null){g.lineStyle(2,0xede3d1,.25);g.drawCircle(joy.ox,joy.oy,56);g.lineStyle(0);g.beginFill(0xede3d1,.3);g.drawCircle(joy.ox+joy.vx*56,joy.oy+joy.vy*56,22);g.endFill()}
  endPools();
  R.render(PX.stage);
}
function dropPixi(err){
  if(!PX)return;noteErr('WebGL désactivé',err);
  try{clearTimeout(PX.lostT);PX.R.view.remove();PX.R.destroy()}catch(e){}
  PX=null;floorPat=null;resize();toast('Rendu WebGL interrompu : le jeu passe au rendu standard (modifiable dans les réglages).');
}
const glLost=()=>{try{return !!(PX&&(PX.lost||(PX.R.gl&&PX.R.gl.isContextLost&&PX.R.gl.isContextLost())))}catch(e){return false}};
function render(){
  if(PX&&!PX.lost&&glLost())dropPixi('contexte WebGL perdu');
  if(PX){if(PX.lost)return;try{renderPixi();return}catch(err){dropPixi(err)}}
  render2D();
}

