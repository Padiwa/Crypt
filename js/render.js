// Crypte des Cendres — render.js : rendu 2D (Canvas) : formes des héros, des monstres et des effets, HUD. Le WebGL est dans rendergl.js (v145).
/* ---------- Rendu ---------- */
// Signes de la police bitmap WebGL (en plus de a-z, A-Z, 0-9) ; les autres sont retirés des noms affichés en WebGL.
const PX_CHARS=" !+-%/.'_éèêàâçùûôîëïüœÉÈÊÀÂÇÔÎ";
const PX_CHARS_NO=new RegExp('[^a-zA-Z0-9'+PX_CHARS.replace(/[\]\\^\-]/g,'\\$&')+']','g');
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2)}
function shadow(x,y,r){ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(x,y+r*.75,r*1.05,r*.45,0,0,7);ctx.fill()}
function slimeShape(r,white,a){
  ctx.fillStyle=white?'#fff':'rgba(63,158,140,.88)';ctx.beginPath();ctx.ellipse(0,r*.08,r,r*.9,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=white?'#fff':'#1f5a50';ctx.lineWidth=2;ctx.stroke();if(white)return;
  ctx.fillStyle='rgba(20,60,54,.65)';circle(Math.cos(a)*r*.15,Math.sin(a)*r*.15+r*.12,r*.42);ctx.fill();
  ctx.fillStyle='rgba(200,255,240,.45)';ctx.beginPath();ctx.ellipse(-r*.35,-r*.38,r*.28,r*.16,-.5,0,Math.PI*2);ctx.fill();
  const ex=Math.cos(a)*r*.38,ey=Math.sin(a)*r*.38,px=-Math.sin(a)*r*.28,py=Math.cos(a)*r*.28;ctx.fillStyle='#0d1f1c';circle(ex+px,ey+py,Math.max(1.6,r*.12));ctx.fill();circle(ex-px,ey-py,Math.max(1.6,r*.12));ctx.fill();
  ctx.fillStyle='#d8fff4';circle(ex+px-.8,ey+py-.8,Math.max(.7,r*.045));ctx.fill();circle(ex-px-.8,ey-py-.8,Math.max(.7,r*.045));ctx.fill()}
/* ---------- Nécropole des Sables (v136) : scarabée, momie, momie à terre, marque de malédiction, sables mouvants, obélisque ---------- */
// Scarabée, tourné vers +x ; f : position des pattes (0 ou 1).
function scarabShape(r,white,f){const c=white?'#fff':null;ctx.lineCap='round';
  ctx.strokeStyle=c||'#1c2010';ctx.lineWidth=1.6;
  for(const s of[-1,1])for(let i=0;i<3;i++){const x0=(i-1)*r*.55,sw=(f?1:-1)*(i%2?1:-1)*r*.25;ctx.beginPath();ctx.moveTo(x0,s*r*.5);ctx.lineTo(x0+sw,s*r*1.25);ctx.stroke()}
  ctx.fillStyle=c||'#1c2010';circle(r*.95,0,r*.42);ctx.fill();
  ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(r*1.25,-r*.22);ctx.lineTo(r*1.6,-r*.08);ctx.moveTo(r*1.25,r*.22);ctx.lineTo(r*1.6,r*.08);ctx.stroke();
  ctx.fillStyle=c||'#3d4a24';ctx.beginPath();ctx.ellipse(-r*.1,0,r*.95,r*.75,0,0,7);ctx.fill();if(white)return;
  ctx.strokeStyle='#141a0a';ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.moveTo(r*.5,0);ctx.lineTo(-r,0);ctx.stroke();
  ctx.fillStyle='rgba(190,210,110,.55)';for(const s of[-1,1]){ctx.beginPath();ctx.ellipse(-r*.15,s*r*.35,r*.45,r*.16,0,0,7);ctx.fill()}
  ctx.fillStyle='#ffb04a';circle(r*1.1,-r*.18,1.1);ctx.fill();circle(r*1.1,r*.18,1.1);ctx.fill()}
// Momie (risen : relevée, bandelettes sombres et défaites, yeux verts), tournée vers +x.
function mummyShape(r,white,risen){const band=risen?'#5e5034':'#9c8a62';
  ctx.fillStyle=white?'#fff':risen?'#8d7a52':'#cdb98c';circle(0,0,r);ctx.fill();if(white)return;
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=2;ctx.stroke();
  ctx.save();ctx.beginPath();ctx.arc(0,0,r-1,0,7);ctx.clip();ctx.strokeStyle=band;ctx.lineWidth=2;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(-r,i*r*.32-r*.3);ctx.lineTo(r,i*r*.32+r*.3);ctx.stroke()}ctx.restore();
  ctx.fillStyle=risen?'#2a2214':'#3a3020';ctx.beginPath();ctx.ellipse(r*.45,0,r*.22,r*.48,0,0,7);ctx.fill();
  ctx.fillStyle=risen?'#7dff8a':'#ffd36a';circle(r*.5,-r*.22,2.4);ctx.fill();circle(r*.5,r*.22,2.4);ctx.fill();
  if(risen){ctx.strokeStyle=band;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.7,-r*.5);ctx.quadraticCurveTo(-r*1.3,-r*.7,-r*1.6,-r*.3);ctx.moveTo(-r*.6,r*.6);ctx.quadraticCurveTo(-r*1.2,r*.9,-r*1.5,r*.6);ctx.stroke()}}
// Momie à terre, avant de se relever.
function fallenShape(){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,4,20,8,0,0,7);ctx.fill();
  ctx.fillStyle='#bfa978';ctx.beginPath();ctx.ellipse(0,0,18,8,0,0,7);ctx.fill();ctx.strokeStyle='#8a7a52';ctx.lineWidth=1.6;
  for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(i*6-3,-7);ctx.lineTo(i*6+3,7);ctx.stroke()}}
// Marque d'un ennemi maudit : un œil doré.
function curseGlyph(){ctx.fillStyle='rgba(20,12,4,.85)';ctx.beginPath();ctx.ellipse(0,0,8,5,0,0,7);ctx.fill();
  ctx.strokeStyle='#e8c25a';ctx.lineWidth=1.6;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-8,0);ctx.quadraticCurveTo(0,-7,8,0);ctx.quadraticCurveTo(0,7,-8,0);ctx.stroke();
  ctx.fillStyle='#e8c25a';circle(0,0,2.4);ctx.fill();ctx.beginPath();ctx.moveTo(-2,4);ctx.lineTo(-4,8);ctx.stroke()}
// Marque du corbeau (v143) : un viseur orange en haut à gauche de l'ennemi marqué.
function markGlyph(){ctx.fillStyle='rgba(20,12,4,.8)';circle(0,0,6.5);ctx.fill();ctx.strokeStyle='#ff9a4a';ctx.lineWidth=1.6;ctx.lineCap='round';circle(0,0,4.6);ctx.stroke();
  ctx.beginPath();for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.moveTo(Math.cos(a)*5.6,Math.sin(a)*5.6);ctx.lineTo(Math.cos(a)*8.2,Math.sin(a)*8.2)}ctx.stroke();ctx.fillStyle='#ffcf8a';circle(0,0,1.6);ctx.fill()}
// Statuts (v141) : étoile d'étourdissement (trois tournent au-dessus de la tête), anneau de racines au sol (immobilisé).
function starGlyph(){ctx.fillStyle='#ffe27a';ctx.strokeStyle='#6a4a10';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,R=i%2?2.2:5.2;ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R)}ctx.closePath();ctx.fill();ctx.stroke()}
function rootRing(r){ctx.lineCap='round';ctx.strokeStyle='#2e2012';ctx.lineWidth=4.2;ctx.beginPath();ctx.ellipse(0,0,r,r*.42,0,0,7);ctx.stroke();ctx.strokeStyle='#7d5a2e';ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.2,x=Math.cos(a)*r,y=Math.sin(a)*r*.42,h=(i%2?8:12)*(y<0?.75:1),b=i%2?3:-3;
    ctx.strokeStyle='#2e2012';ctx.lineWidth=3.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x*1.08,y-h*.55,x*.96+b,y-h);ctx.stroke();ctx.strokeStyle='#8f6a36';ctx.lineWidth=1.4;ctx.stroke()}}
const stunXY=(e,i)=>{const a=G.t*5+i*2.094;return [e.x+Math.cos(a)*e.r*.62,e.y-e.r-7+Math.sin(a)*e.r*.2]};
// Sable mouvant de rayon r centré en (x, y) ; a0 : rotation des remous.
function sandPoolShape(x,y,r,a0){const gr=ctx.createRadialGradient(x,y,r*.1,x,y,r);gr.addColorStop(0,'rgba(70,52,26,.75)');gr.addColorStop(.7,'rgba(150,118,66,.45)');gr.addColorStop(1,'rgba(190,150,90,0)');
  ctx.fillStyle=gr;circle(x,y,r);ctx.fill();ctx.strokeStyle='rgba(225,195,135,.28)';ctx.lineWidth=2;ctx.lineCap='round';
  for(let i=0;i<3;i++){const rr=r*(.3+.2*i);ctx.beginPath();ctx.arc(x,y,rr,a0+i*2.1,a0+i*2.1+2.4);ctx.stroke()}}
// Obélisque vu de haut : octogone de pierre, pyramidion doré.
function obeliskShape(x,y,r,B){const oct=R=>{ctx.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;ctx.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R)}ctx.closePath()};
  const gr=ctx.createLinearGradient(x-r,y-r,x+r,y+r);gr.addColorStop(0,B.pil[0]);gr.addColorStop(1,B.pil[1]);ctx.fillStyle=gr;oct(r);ctx.fill();ctx.strokeStyle='#0c0a0e';ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='rgba(255,230,170,.18)';oct(r*.55);ctx.fill();ctx.strokeStyle='rgba(40,28,12,.6)';ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle='#e8c25a';circle(x,y,Math.max(2,r*.12));ctx.fill()}
// Barre de vie d'un ennemi touché (rendu 2D).
function hpBar2d(e){if(e.shown>0&&e.hp<e.max){const w=e.r*2;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(e.x-w/2,e.y-e.r-10,w,4);ctx.fillStyle='#d9454a';ctx.fillRect(e.x-w/2,e.y-e.r-10,w*Math.max(0,e.hp/e.max),4)}}
function drawEnemy(e){
  shadow(e.x,e.y,e.r);
  const fl=e.flash>0, a=Math.atan2(G.P.y-e.y,G.P.x-e.x);
  if(e.lord||e.stake){ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=lordAlpha(e);if(e.lord){ctx.rotate(a);bourreauShape(e.r,fl)}else stakeShape(e.r,fl);ctx.restore();hpBar2d(e);return} // v147
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
  if(e.type==='scarab'){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);scarabShape(e.r,fl,Math.sin(G.t*30+e.wob)>0?1:0);ctx.restore();return}
  if(e.type==='mummy'||e.type==='mummyR'){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(a);mummyShape(e.r,fl,e.type==='mummyR');ctx.restore();
    hpBar2d(e);return}
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
  hpBar2d(e)
}
const hpCol=k=>k>.5?[95,191,122]:k>.25?[240,207,74]:[226,72,72];
function hpRing2D(P,MX=S.hp){const k=Math.max(0,Math.min(1,P.hp/MX)),R=P.r+12,c=hpCol(k),a0=-Math.PI/2;
  ctx.save();ctx.globalAlpha=1;ctx.lineCap='round';ctx.lineWidth=9;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.beginPath();ctx.arc(P.x,P.y,R,0,Math.PI*2);ctx.stroke();ctx.lineWidth=6;ctx.strokeStyle='rgba(60,20,24,.9)';ctx.beginPath();ctx.arc(P.x,P.y,R,0,Math.PI*2);ctx.stroke();
  if(k>0){ctx.shadowColor=`rgb(${c[0]},${c[1]},${c[2]})`;ctx.shadowBlur=8;ctx.strokeStyle=`rgba(${c[0]},${c[1]},${c[2]},${k<.25?.75+.25*Math.sin(G.t*10):.95})`;ctx.beginPath();ctx.arc(P.x,P.y,R,a0,a0+Math.PI*2*k);ctx.stroke();ctx.shadowBlur=0}
  if(P.shield>0){ctx.lineWidth=3;ctx.strokeStyle='rgba(150,210,255,.85)';ctx.beginPath();ctx.arc(P.x,P.y,R+6,a0,a0+Math.PI*2*Math.min(1,P.shield/MX));ctx.stroke()}
  ctx.restore()}
// Au-dessus des partenaires : niveau de prestige (pastille dorée) puis nom, à la couleur de l'emplacement.
// Une étiquette qui en chevauche une autre monte d'un cran.
function tagStack(L){const out=[];for(const it of L){for(let k=0;k<4;k++){const h=out.find(o=>Math.abs(o.y-it.y)<15&&o.x0<it.x0+it.w+6&&it.x0<o.x0+o.w+6);if(!h)break;it.y=h.y-16}out.push(it)}return out}
function allyTags2D(M){if(!M.length)return;const F1='800 10px Alegreya Sans, system-ui, sans-serif',F2='700 12px Alegreya Sans, system-ui, sans-serif';ctx.save();ctx.textBaseline='middle';
  const L=M.map(Q=>{const w=who(Q.slot),t=w.name+(Q.down?' · à terre':''),pr=String(w.pr|0);ctx.font=F1;const wp=ctx.measureText(pr).width+9;ctx.font=F2;const W=wp+4+ctx.measureText(t).width;return {Q,t,pr,wp,w:W,x0:Q.x-W/2,y:Q.y-Q.r-26}});
  for(const {Q,t,pr,wp,x0,y} of tagStack(L)){
    ctx.fillStyle='rgba(20,14,8,.85)';ctx.strokeStyle='#f0cf4a';ctx.lineWidth=1.2;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x0,y-7,wp,14,4);else ctx.rect(x0,y-7,wp,14);ctx.fill();ctx.stroke();
    ctx.font=F2;ctx.textAlign='left';ctx.strokeStyle='rgba(0,0,0,.8)';ctx.lineWidth=3;ctx.fillStyle=Q.down?'#ff8a80':(SLOT_C[Q.slot|0]||'#8fd3e0');ctx.strokeText(t,x0+wp+4,y);ctx.fillText(t,x0+wp+4,y);
    ctx.font=F1;ctx.textAlign='center';ctx.fillStyle='#f0cf4a';ctx.fillText(pr,x0+wp/2,y+.5)}
  ctx.restore()}
const allShots=()=>G.oshots&&NET.on?G.shots.concat(G.oshots):G.shots;
// Couleurs d'un héros à l'écran : les miennes (Héros › Couleurs), celles qu'un autre joueur a choisies en coopération.
const palOf=(P,cls)=>lookPal(cls,P===G.P?myLook(cls):(typeof who==='function'&&NET.on?who(P.slot).look:null));
function drawPlayer(P){
  shadow(P.x,P.y,P.r);
  ctx.globalAlpha=P.dashT>0?.55:(P.inv>0&&Math.floor(G.t*20)%2?.6:1);
  const a=P.face,C=palOf(P,G.cls);ctx.lineCap='round';
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
// Butin en forme d'icône, dessiné à l'origine : sert au rendu 2D (drawDrop) et aux textures WebGL (rendergl.js).
function sealShape(c){ctx.fillStyle='#2a1026';ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,rr=i%2?6:13;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke();}
function relicShape(c){ctx.fillStyle='#1d1822';ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,8,12,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(0,0,3.5,6,0,0,7);ctx.fill();}
function modShape(c){ctx.fillStyle='#1d1822';ctx.fillRect(-8,-11,16,22);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.strokeRect(-8,-11,16,22);ctx.fillStyle=c;ctx.fillRect(-4,-6,8,2);ctx.fillRect(-4,-1,8,2);ctx.fillRect(-2,4,4,2);}
function partShape(c){ctx.fillStyle='#1d1822';ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<6;i++){const a=i/6*Math.PI*2;ctx.lineTo(Math.cos(a)*10,Math.sin(a)*10)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=c;circle(0,0,3.5);ctx.fill();}
function beam(x,y,h,col,a=.32){const gr=ctx.createLinearGradient(0,y-h,0,y);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,col);ctx.globalAlpha=a;ctx.fillStyle=gr;ctx.fillRect(x-4,y-h,8,h);ctx.globalAlpha=1}
function drawDrop(d){
  const bob=Math.sin(d.t*3)*3;
  if(d.kind==='react'){const k=Math.sin(d.t*6)*.5+.5;ctx.fillStyle=`rgba(255,207,90,${.25+.2*k})`;circle(d.x,d.y,10);ctx.fill();ctx.fillStyle='#ffd77a';circle(d.x,d.y,4.5);ctx.fill();return}
  if(d.kind==='seal'){const c=SEAL_C;beam(d.x,d.y,170,c,.55);ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(G.t*1.5);sealShape(c);ctx.restore();return}
  if(d.kind==='relic'){const c=RTIER[RELICS[d.id].t].c;beam(d.x,d.y,130,c,.4);ctx.save();ctx.translate(d.x,d.y+bob);relicShape(c);ctx.restore();return}
  if(d.kind==='xp'){const c=d.v>=20?'#ff7a6b':d.v>=5?'#7fe08a':'#7fd0e6',s=d.v>=20?8:d.v>=5?6.5:5;
    ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(d.x,d.y-s);ctx.lineTo(d.x+s*.65,d.y);ctx.lineTo(d.x,d.y+s);ctx.lineTo(d.x-s*.65,d.y);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(d.x-1,d.y-s*.55,2,s*.5);return}
  if(d.kind==='gold'){ctx.fillStyle='#f0cf4a';circle(d.x,d.y+bob*.6,5);ctx.fill();ctx.strokeStyle='#7a5a10';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#fff6c4';circle(d.x-1.5,d.y+bob*.6-1.5,1.5);ctx.fill();return}
  if(d.kind==='mod'){const c=MOD_RAR[MODS[d.id].r].c;beam(d.x,d.y,90,c,.3);
    ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(Math.sin(d.t*2)*.25);modShape(c);ctx.restore();return}
  if(d.kind==='key'){beam(d.x,d.y,130,LORD_C,.45);ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(Math.sin(d.t*2)*.3);keyShape(LORD_C);ctx.restore();return}
  if(d.kind==='part'){const c=RAR[d.part.hf?6:bpdef(d.part.w).r].c;beam(d.x,d.y,90,c,.3);
    ctx.save();ctx.translate(d.x,d.y+bob);ctx.rotate(d.t*.8);partShape(c);ctx.restore();return}
  const col=d.kind==='potion'?'#5fbf7a':RAR[d.item.r].c;
  if(d.kind==='item'){beam(d.x,d.y,d.wish?220:d.item.r>=3?150:d.item.r===2?100:60,d.wish?'#ffe08a':col,d.wish?.6:.35);
    if(d.wish){const k=(G.t*1.6)%1;ctx.strokeStyle=`rgba(255,224,138,${.8*(1-k)})`;ctx.lineWidth=2.5;circle(d.x,d.y,10+k*26);ctx.stroke()}}
  ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(d.x,d.y+8,8,3,0,0,7);ctx.fill();
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(d.x,d.y-10+bob);ctx.lineTo(d.x+7,d.y+bob);ctx.lineTo(d.x,d.y+10+bob);ctx.lineTo(d.x-7,d.y+bob);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1.5;ctx.stroke();
}
const zoom=()=>clamp(Math.min(innerWidth,innerHeight)/620,.62,1.5)*(typeof setZoom==='function'?setZoom():1);
// Vue de la caméra, commune aux deux rendus : zoom, taille visible (G.vw, G.vh), coin haut-gauche avec le tremblement, test de visibilité.
function camView(){const z=zoom(),vw=innerWidth/z,vh=innerHeight/z;G.vw=vw;G.vh=vh;
  const hs=(G.hshake||0)*SET.shake,sx=hs?rand(-hs,hs):0,sy=hs?rand(-hs,hs):0,ox=G.cam.x-vw/2+sx,oy=G.cam.y-vh/2+sy;
  return {z,vw,vh,ox,oy,vis:(x,y,m=80)=>x>ox-m&&x<ox+vw+m&&y>oy-m&&y<oy+vh+m}}
// Distance du héros à un point, en mètres affichés (10 unités = 1 m).
const distTxt=(x,y)=>`${Math.round(Math.hypot(x-G.P.x,y-G.P.y)/10)} m`;
// Flèches hors écran vers les Gardiens, la cible, l'extraction, le cryopode et la source la plus proche.
// draw(x,y,angle,couleur,texte) dessine une flèche au bord de l'écran (coordonnées de l'écran).
function offArrows(vis,draw){const P=G.P;
  const arrow=(wx,wy,col,label)=>{if(vis(wx,wy,-10))return;
    const a=Math.atan2(wy-G.cam.y,wx-G.cam.x),cx=innerWidth/2,cy=innerHeight/2,k=arrowK(a,cx,cy);draw(cx+Math.cos(a)*k,cy+Math.sin(a)*k,a,col,label)};
  for(const e of G.en)if(e.type==='boss'&&!(e.lord&&e.ph===2))arrow(e.x,e.y,e.lord?LORD_C:'#b06ae0'); // v147 : le Bourreau dans l'ombre n'a pas de flèche
  if(G.target)arrow(G.target.x,G.target.y,'#f0cf4a',distTxt(G.target.x,G.target.y));
  if(G.exitPt)arrow(G.exitPt.x,G.exitPt.y,'#5fbf7a',distTxt(G.exitPt.x,G.exitPt.y));
  if(G.pod)arrow(G.pod.x,G.pod.y,'#8fd3e0','Cryopode');
  let wb=null,wd=1e9;for(const w of G.wells)if(w.on){const dd=Math.hypot(w.x-P.x,w.y-P.y);if(dd<wd){wd=dd;wb=w}}if(wb)arrow(wb.x,wb.y,'#9fdcff',(P.psnT>0||P.brnT>0?'Source ':'')+distTxt(wb.x,wb.y))}
function render2D(){
  const {z,vw,vh,ox,oy,vis}=camView(),P=G.P;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#050307';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr*z,0,0,dpr*z,-ox*dpr*z,-oy*dpr*z);
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
  for(const q of G.sands||[])if(vis(q.x,q.y,q.r))sandPoolShape(q.x,q.y,q.r,G.t*.25*(q.dir||1));
  for(const z of G.zones){if(!vis(z.x,z.y,z.r))continue;const al=Math.min(1,z.life/.5)*(z.kind==='poison'?.33:.4),pc=z.kind==='poison'?'200,70,190':'255,120,40';ctx.fillStyle=`rgba(${pc},${al})`;circle(z.x,z.y,z.r*(1+.04*Math.sin(G.t*6)));ctx.fill();ctx.strokeStyle=`rgba(${pc},${al+.3})`;ctx.lineWidth=2;ctx.stroke()}
  for(const l of G.lobs){const k=l.t/l.T,pc=l.kind==='poison'?'200,70,190':'255,120,40';ctx.strokeStyle=`rgba(${pc},${.3+.5*k})`;ctx.lineWidth=2;circle(l.tx,l.ty,l.r*k);ctx.stroke();circle(l.tx,l.ty,l.r);ctx.stroke();
    ctx.fillStyle=`rgb(${pc})`;circle(l.x0+(l.tx-l.x0)*k,l.y0+(l.ty-l.y0)*k-Math.sin(k*Math.PI)*80,6);ctx.fill()}
  for(const w of G.wells){if(!w.on||!vis(w.x,w.y,60))continue;ctx.fillStyle='rgba(120,200,255,.25)';circle(w.x,w.y,w.r+6+Math.sin(G.t*3)*3);ctx.fill();ctx.fillStyle='#2b4f66';circle(w.x,w.y,w.r);ctx.fill();ctx.strokeStyle='#bfeaff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='rgba(200,240,255,.8)';circle(w.x,w.y,w.r*.45);ctx.fill()}
  for(const s of G.spawns)if(s.t<.9&&!s.split){const k=1-s.t/.9;ctx.strokeStyle=`rgba(170,110,220,${.3+k*.6})`;ctx.lineWidth=2;circle(s.x,s.y,20*(.4+k*.6));ctx.stroke()}
  for(const s of G.spawns)if(s.rise&&vis(s.x,s.y,40)){ctx.save();ctx.translate(s.x,s.y);fallenShape();ctx.restore();const k=1-s.t/1.8;ctx.fillStyle=`rgba(125,255,138,${(.2+.3*k).toFixed(2)})`;circle(s.x+4,s.y-8-k*14,2.5+k*2);ctx.fill();circle(s.x-6,s.y-4-k*9,2+k*1.5);ctx.fill()}
  for(const d of G.drops)if(vis(d.x,d.y,150))drawDrop(d);
  if(G.exitPt){const x=G.exitPt,k=Math.sin(G.t*4)*.5+.5;ctx.fillStyle=`rgba(95,191,122,${.12+.15*k})`;circle(x.x,x.y,55);ctx.fill();ctx.strokeStyle='rgba(95,191,122,.9)';ctx.lineWidth=3;ctx.stroke();beam(x.x,x.y,170,'#5fbf7a',.45);if(G.extT>0){ctx.strokeStyle='#bff5cc';ctx.lineWidth=6;ctx.beginPath();ctx.arc(x.x,x.y,64,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,G.extT/EXT_T));ctx.stroke()}}
  if(G.pod&&vis(G.pod.x,G.pod.y)){const p=G.pod,h=p.r*1.15;shadow(p.x,p.y,p.r);ctx.fillStyle='#1e2a30';circle(p.x,p.y,p.r);ctx.fill();ctx.strokeStyle='#5fb8c9';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle=p.flash>0?'#fff':'#8fd3e0';ctx.beginPath();ctx.moveTo(p.x,p.y-h-4+Math.sin(G.t*2)*2);ctx.lineTo(p.x+p.r*.5,p.y-4);ctx.lineTo(p.x,p.y+p.r*.55);ctx.lineTo(p.x-p.r*.5,p.y-4);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(143,211,224,.35)';ctx.lineWidth=2;circle(p.x,p.y,p.r+10+Math.sin(G.t*3)*2);ctx.stroke()}
  for(const p of G.pillars){if(p===G.pod||!vis(p.x,p.y))continue;shadow(p.x,p.y,p.r);if(BI.obel){obeliskShape(p.x,p.y,p.r,BI);continue}const gr=ctx.createRadialGradient(p.x-p.r*.3,p.y-p.r*.3,2,p.x,p.y,p.r);gr.addColorStop(0,BI.pil[0]);gr.addColorStop(1,BI.pil[1]);ctx.fillStyle=gr;circle(p.x,p.y,p.r);ctx.fill();ctx.strokeStyle='#0c0a0e';ctx.lineWidth=2;ctx.stroke()}
  for(const b of G.braziers){if(!vis(b.x,b.y))continue;ctx.fillStyle='#2a2228';circle(b.x,b.y,9);ctx.fill();ctx.strokeStyle='#4a3e44';ctx.lineWidth=2;ctx.stroke()}
  for(const e of G.en){if(!vis(e.x,e.y,e.r+40))continue;if(e.corr){ctx.fillStyle='rgba(240,190,60,.22)';circle(e.x,e.y,e.r+9);ctx.fill();ctx.strokeStyle='rgba(255,207,90,.7)';ctx.lineWidth=1.5;ctx.stroke()}if(e.elite){const c=ELITE[e.elite].c,k=Math.sin(G.t*5)*.5+.5;ctx.strokeStyle=c;ctx.globalAlpha=.55+.4*k;ctx.lineWidth=3;circle(e.x,e.y,e.r+8+k*3);ctx.stroke();ctx.globalAlpha=1}if(e.root>0){ctx.save();ctx.translate(e.x,e.y+e.r*.55);rootRing(e.r+6);ctx.restore()}drawEnemy(e);if(e.curse>0){ctx.save();ctx.translate(e.x+e.r*.85,e.y-e.r*.85);curseGlyph();ctx.restore()}if(e.mark>0){ctx.save();ctx.translate(e.x-e.r*.85,e.y-e.r*.85);markGlyph();ctx.restore()}if(e.stun>0)for(let i=0;i<3;i++){const [x,y]=stunXY(e,i);ctx.save();ctx.translate(x,y);starGlyph();ctx.restore()}if(e.elite){ctx.font='700 11px Alegreya Sans,sans-serif';ctx.textAlign='center';ctx.fillStyle=ELITE[e.elite].c;ctx.fillText('Élite · '+ELITE[e.elite].n,e.x,e.y-e.r-14)}if(e.frz>0){ctx.fillStyle='rgba(215,245,255,.55)';circle(e.x,e.y,e.r+3);ctx.fill();ctx.strokeStyle='rgba(235,250,255,.9)';ctx.lineWidth=2;ctx.stroke()}if(e.slow>0){ctx.fillStyle='rgba(150,210,255,.35)';circle(e.x,e.y,e.r+2);ctx.fill()}}
  if(NET.on)for(const Q of G.mates||[]){const sc=G.cls;G.cls=Q.cls;drawPlayer(Q);G.cls=sc;ctx.globalAlpha=1;if(Q.down){ctx.fillStyle='rgba(10,8,12,.55)';circle(Q.x,Q.y,Q.r+4);ctx.fill()}hpRing2D(Q,Q.max)}
  if(NET.on)allyTags2D(G.mates||[]);
  if(P.down){ctx.globalAlpha=.4}drawPlayer(P);ctx.globalAlpha=1;hpRing2D(P);
  if(NET.on)for(const Q of G.mates||[])petDraw2D(Q.pet,.85);petDraw2D(G.pet,1);
  ctx.lineCap='round';
  for(const s of allShots()){if(!vis(s.x,s.y,20))continue;
    if(s.kind==='wave'){ctx.strokeStyle=`rgba(255,230,200,${Math.min(1,s.life*2.2)})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(s.x-Math.cos(s.a)*14,s.y-Math.sin(s.a)*14,16,s.a-1,s.a+1);ctx.stroke();continue}
    if(s.kind==='orb'){ctx.fillStyle='rgba(140,190,255,.35)';circle(s.x-s.vx*.025,s.y-s.vy*.025,8);ctx.fill();ctx.fillStyle='#bfe0ff';circle(s.x,s.y,6);ctx.fill();ctx.fillStyle='#fff';circle(s.x,s.y,2.5);ctx.fill();continue}
    ctx.strokeStyle=s.crit?'#ffe07a':'#f0a45a';ctx.lineWidth=s.crit?4:3;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.025,s.y-s.vy*.025);ctx.stroke()}
  for(const b of G.eb){if(!vis(b.x,b.y,20))continue;ctx.fillStyle='#b27ae6';circle(b.x,b.y,b.r);ctx.fill();ctx.fillStyle='#f1defd';circle(b.x,b.y,b.r*.45);ctx.fill()}
  for(const p of G.parts){if(!vis(p.x,p.y,10))continue;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.col;if(p.w)ctx.fillRect(p.x-p.size*3,p.y-p.size*.5,p.size*6,p.size);else{circle(p.x,p.y,p.size);ctx.fill()}}
  ctx.globalAlpha=1;
  for(const z2 of G.zaps){ctx.strokeStyle=`rgba(200,230,255,${1-z2.t/.25})`;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(z2.x1,z2.y1);
    for(let i=1;i<6;i++){const k=i/6;ctx.lineTo(z2.x1+(z2.x2-z2.x1)*k+rand(-9,9),z2.y1+(z2.y2-z2.y1)*k+rand(-9,9))}ctx.lineTo(z2.x2,z2.y2);ctx.stroke()}
  for(const r of G.rings){const k=r.t/.45,R=r.max||175;ctx.strokeStyle=`rgba(${r.col||'255,140,60'},${1-k})`;ctx.lineWidth=14*(1-k)+2;circle(r.x,r.y,R*.17+R*.83*k);ctx.stroke()}
  // obscurité + braseros
  // tempête de sable (v136) : la lumière se resserre autour du héros et un voile de sable couvre l'écran
  // v147 : la phase d'ombre du Bourreau resserre aussi la lumière (darkK), sans le voile de sable
  const sk=darkK(),sv=stormK(),out=Math.max(vw,vh)*.62*(1-.55*sk),dk=ctx.createRadialGradient(P.x,P.y,150*(1-.5*sk),P.x,P.y,out);dk.addColorStop(0,'rgba(6,4,9,0)');dk.addColorStop(1,sk?`rgba(6,4,9,${(.74+.2*sk).toFixed(3)})`:'rgba(6,4,9,.74)');
  ctx.fillStyle=dk;ctx.fillRect(ox-20,oy-20,vw+40,vh+40);
  if(sv>0){ctx.fillStyle=`rgba(150,112,60,${(.36*sv).toFixed(3)})`;ctx.fillRect(ox-20,oy-20,vw+40,vh+40)}
  ctx.globalCompositeOperation='lighter';
  if(!(G.lordDk>.5))for(const b of G.braziers){if(!vis(b.x,b.y,180))continue;const f=1+.06*Math.sin(G.t*11+b.ph)+.04*Math.sin(G.t*23+b.ph*2),gr=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,170*f);gr.addColorStop(0,`rgba(${BI.light},.26)`);gr.addColorStop(1,`rgba(${BI.light},0)`);ctx.fillStyle=gr;ctx.fillRect(b.x-180,b.y-180,360,360);
    ctx.fillStyle=`rgba(${BI.flame},.9)`;ctx.beginPath();ctx.ellipse(b.x,b.y-5,4*f,8*f,0,0,7);ctx.fill()}
  if(G.pod){const p=G.pod,gr=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,150);gr.addColorStop(0,'rgba(120,210,230,.3)');gr.addColorStop(1,'rgba(120,210,230,0)');ctx.fillStyle=gr;ctx.fillRect(p.x-150,p.y-150,300,300)}
  if(G.exitPt){const x=G.exitPt,gr=ctx.createRadialGradient(x.x,x.y,0,x.x,x.y,140);gr.addColorStop(0,'rgba(95,191,122,.3)');gr.addColorStop(1,'rgba(95,191,122,0)');ctx.fillStyle=gr;ctx.fillRect(x.x-140,x.y-140,280,280)}
  ctx.globalCompositeOperation='source-over';
  lordTop2D();
  ctx.textAlign='center';
  for(const t of G.texts){if(!vis(t.x,t.y,30))continue;ctx.globalAlpha=1-t.t/.8;ctx.font=`700 ${t.size}px 'Alegreya Sans',system-ui,sans-serif`;ctx.fillStyle='#000';ctx.fillText(t.txt,t.x+1,t.y-t.t*40+1);ctx.fillStyle=t.col;ctx.fillText(t.txt,t.x,t.y-t.t*40)}
  ctx.globalAlpha=1;
  // écran : flèches vers les Gardiens, joystick
  ctx.setTransform(dpr,0,0,dpr,0,0);
  offArrows(vis,(x,y,a,col,label)=>{
    ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=col;ctx.strokeStyle='#120c16';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-10);ctx.lineTo(-3,0);ctx.lineTo(-8,10);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    if(label){ctx.font="700 12px 'Alegreya Sans',system-ui,sans-serif";ctx.textAlign='center';ctx.fillStyle='#000';ctx.fillText(label,x-Math.cos(a)*26+1,y-Math.sin(a)*26+5);ctx.fillStyle=col;ctx.fillText(label,x-Math.cos(a)*26,y-Math.sin(a)*26+4)}});
  if(joy.id!==null){ctx.strokeStyle='rgba(237,227,209,.25)';ctx.lineWidth=2;circle(joy.ox,joy.oy,56);ctx.stroke();ctx.fillStyle='rgba(237,227,209,.3)';circle(joy.ox+joy.vx*56,joy.oy+joy.vy*56,22);ctx.fill()}
}
// Éléments du HUD, gardés en mémoire. Un élément absent (page en cache plus ancienne que les scripts) ne bloque pas le reste du HUD.
const NOEL={style:{setProperty(){}},classList:{contains:()=>false,toggle(){}},setAttribute(){},getAttribute:()=>null,querySelector:()=>null,appendChild(){}};
const _el={},el=id=>_el[id]||(_el[id]=$(id))||NOEL;
// Secondes de recharge au centre d'un bouton de compétence (le texte est créé au premier besoin).
// Bouton de compétence utilisé : il s'enfonce un instant et s'éclaire.
const pressFx=b=>{if(b.animate)b.animate([{transform:'scale(.84)',filter:'brightness(2.2)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:260,easing:'ease-out'})};
const skTxt=(id,v)=>{const b=el(id);if(b===NOEL)return;let t=b._t;if(!t){t=b.querySelector('.skt')||document.createElement('b');t.className='skt';t.setAttribute('aria-hidden','true');b.appendChild(t);b._t=t}if(t.textContent!==v)t.textContent=v;if(b.classList.contains('cool')!==!!v)b.classList.toggle('cool',!!v)};
// Compétence utilisée (prête → en recharge) : le bouton s'enfonce et s'éclaire un instant.
const skFire=(id,ready)=>{const b=el(id);if(b===NOEL)return;if(b._rd&&!ready)pressFx(b);b._rd=ready};
const setTx=(id,v)=>{const e=el(id);if(e._v!==v){e._v=v;e.textContent=v}};
const setSt=(id,p,v)=>{const e=el(id),k='_s'+p;if(e[k]!==v){e[k]=v;e.style.setProperty(p,v)}};
const setCls=(id,c,on)=>{const e=el(id);if(e.classList.contains(c)!==on)e.classList.toggle(c,on)};
const setHid=(id,h)=>{const e=el(id);if(e.hidden!==h)e.hidden=h};
// Flèches hors écran (Gardiens, cible, extraction, cryopode, source) : elles restent sous le HUD du haut, mesuré
// (1re ligne, altérations, colonne du milieu, reliques), et au-dessus des boutons, pour ne jamais passer sur le HUD.
let hudBot=0,hudBotAt=-1e9;
function hudBottom(){const now=performance.now();if(now-hudBotAt<400)return hudBot;hudBotAt=now;let b=0;
  for(const s of ['.hud','#hpBox .sts','.hudmid','#relHud']){const e=document.querySelector(s);if(!e||e.hidden)continue;const r=e.getBoundingClientRect();if(r.height>0)b=Math.max(b,r.bottom)}
  return hudBot=b}
function arrowK(a,cx,cy){const T=Math.min(cy-40,Math.max(130,hudBottom()+30)),B=innerHeight-130,c=Math.cos(a),s=Math.sin(a);
  return Math.min(c>0?(innerWidth-34-cx)/c:c<0?(cx-34)/-c:1e9,s<0?(cy-T)/-s:s>0?(B-cy)/s:1e9)}
function hud(){
  const P=G.P,r3=v=>Math.max(0,v).toFixed(3);
  setSt('hpFill','transform',`scaleX(${r3(P.hp/S.hp)})`);
  setTx('hpNum',`${Math.ceil(P.hp)} / ${Math.round(S.hp)}`);setSt('hpShd','transform',`scaleX(${r3(Math.min(1,(P.shield||0)/S.hp))})`);setCls('hpBox','low',P.hp<S.hp*.3&&!G.over);
  setTx('hpTxt',(P.shield>=1?`Bouclier ${Math.floor(P.shield)} · `:'')+`Héros niveau ${G.hl}`);
  setTx('goldTxt',String(G.gold));
  setSt('xpFill','transform',`scaleX(${r3(Math.min(1,G.xp/xpNeed(G.hl)))})`);
  const dm=distTxt;let hot=false;
  let ok='',ov='',op=null,oc='#f0cf4a';
  if(G.mode==='survie'){const left=Math.max(0,LEVEL_T-G.tl);hot=left<=15;setTx('lvlTxt',`Niveau ${G.level}`);ok='Portail dans';ov=fmt(left);op=G.tl/LEVEL_T;oc='#5fbf7a';{const g=G.bossT<=10?'Gardien en approche':'';setTx('bossTxt',g);setHid('bossTxt',!g)}}
  else if(G.mode==='defense'){setTx('lvlTxt',`Vague ${Math.max(1,G.wave)}`);if(G.waveState==='break'){ok='Vague suivante';ov=fmt(G.waveT)}else{ok='Ennemis restants';ov=String(G.toSpawn+G.en.length)}op=G.pod.hp/G.pod.max;oc='#8fd3e0';
    {const g=G.waveState==='break'&&(G.wave+1)%DEF_N===0?'Gardien en approche':`Sortie vague ${Math.ceil(Math.max(1,G.wave+(G.waveState==='break'?1:0))/DEF_N)*DEF_N}`;setTx('bossTxt',g);setHid('bossTxt',false)}setSt('objFill','transform',`scaleX(${r3(G.pod.hp/G.pod.max)})`);hot=G.pod.hp<G.pod.max*.3}
  else{const t=G.target,ex=G.exitPt,c=G.capN|0,n=c+1;setTx('lvlTxt',c?`${c} capture${c>1?'s':''}`:'Capture');
    // Capture en chaîne : la zone d'extraction reste ouverte après la 1re capture, la cible suivante arrive peu après.
    if(ex&&G.extT>0){ok='Reste dans la zone';ov=`${Math.min(100,Math.round(G.extT/EXT_T*100))} %`;op=G.extT/EXT_T;oc='#5fbf7a';hot=true}
    else if(t&&t.downed){ok=`Capture la cible ${n}`;ov=`${Math.round(G.capT/2.5*100)} %`;op=G.capT/2.5}
    else if(t){ok=`Traque la cible ${n}`;ov=dm(t.x,t.y);op=1-t.hp/t.max}
    else if(ex){ok='Vers l\'extraction';ov=dm(ex.x,ex.y);op=0;oc='#5fbf7a'}
    {const g=G.bossT<=10?'Gardien en approche':ex&&t?`Extraction · ${dm(ex.x,ex.y)}`:ex&&G.nextTgt>0?`Cible ${n} dans ${Math.ceil(G.nextTgt)} s`:'';setTx('bossTxt',g);setHid('bossTxt',!g)}}
  setTx('objK',ok);setTx('timeTxt',ov);setHid('objBox',!ok);setSt('objFill2','transform',`scaleX(${op==null?0:r3(Math.max(0,Math.min(1,op)))})`);setSt('objFill2','--c',oc);setCls('objBox','hot',hot);
  // Reliques : icône à la couleur de la relique en cours (anneau = réactifs ramassés) et nombre de reliques ouvertes
  setHid('relHud',!G.relQ.length);if(G.relQ.length){const r=G.relic||G.opened[G.opened.length-1]||G.relQ[0];setTx('relN',String(G.opened.length));
    setSt('relHud','--tc',RTIER[RELICS[r.id].t].c);setSt('relRing','--p',G.relic?Math.min(1,G.react/reactNeed()).toFixed(3):'1');
    const lab=`${G.opened.length} relique${G.opened.length>1?'s':''} ouverte${G.opened.length>1?'s':''} sur ${G.relQ.length}`+(G.relic?`, ${G.react} réactifs sur ${reactNeed()}`:'');const e=el('relHud');if(e.getAttribute('aria-label')!==lab)e.setAttribute('aria-label',lab)}
  setTx('potN',String(G.potions));
  setHid('stP',!(P.psnT>0));if(P.psnT>0)setTx('stP',`Poison ×${P.psn} · ${Math.ceil(P.psnT)} s`);
  setHid('stF',!(P.frzT>0));if(P.frzT>0)setTx('stF',`Gelure · ${Math.ceil(P.frzT)} s`);
  setHid('stQ',!P._sand);if(P._sand)setTx('stQ','Enlisé');
  {const on=G.biome===2&&(G.storm>0||(G.stormIn>0&&G.stormIn<=5));setHid('stT',!on);if(on)setTx('stT',G.storm>0?`Tempête · ${Math.ceil(G.storm)} s`:`Tempête dans ${Math.ceil(G.stormIn)} s`)}
  setHid('stB',!(P.brnT>0));if(P.brnT>0)setTx('stB',`Brûlure · ${Math.ceil(P.brnT)} s`);
  {const n=(G.crits||[]).filter(t=>t>G.t-CS_W).length,on=P.cbT>0;setHid('stC',!(on||n>=3));if(on)setTx('stC',`Frénésie · ${Math.ceil(P.cbT)} s`);else if(n>=3)setTx('stC',`Critiques ${Math.min(n,CS_N)} / ${CS_N}`)}
  setCls('stVig','psn',P.psnT>0&&!(P.brnT>0));setCls('stVig','brn',P.brnT>0);
  setSt('bDash','--cd',r3(P.dashCd/dashCdMax()));
  setSt('bNova','--cd',r3(P.novaMax?P.novaCd/P.novaMax:0));
  setSt('bPot','--cd',G.potions?'0':'1');
  const live=started&&!G.over;
  {const rd=live&&P.dashCd<=0,rn=live&&P.novaCd<=0,rp=live&&G.potions>0&&P.hp<S.hp,sec=v=>live&&v>.05?String(Math.ceil(v)):'';
   setCls('bDash','ready',rd);setCls('bNova','ready',rn);setCls('bPot','ready',rp);skTxt('bDash',sec(P.dashCd));skTxt('bNova',sec(P.novaCd));skFire('bDash',rd);skFire('bNova',rn);{const pb=el('bPot');if(pb!==NOEL){if(pb._n!=null&&G.potions<pb._n)pressFx(pb);pb._n=G.potions}}}
  {let bh=0,bm=0,bn=0;const lo=lordOn()?G.lord:null;for(const e of G.en)if(e.type==='boss'&&!e.dead&&!e.lord){bh+=Math.max(0,e.hp);bm+=e.max;bn++}
   setCls('bossBar','lord',!!lo); // v147 : barre du Boss, crantée à la moitié (phase d'ombre)
   if(lo){setSt('bossFill','transform',`scaleX(${r3(Math.max(0,lo.hp)/lo.max)})`);setTx('bossName',LORDS[lo.lord].n)}
   else if(bn){setSt('bossFill','transform',`scaleX(${r3(bh/bm)})`);setTx('bossName',bn>1?`${bn} Gardiens des Cendres`:'Le Gardien des Cendres')}}
  {const un=ultNeed(),ur=Math.min(1,(G.ult||0)/un);setSt('bUlt','--cd',r3(1-ur));setCls('bUlt','ready',live&&ur>=1);skFire('bUlt',live&&ur>=1);setTx('ultN',ur>=1?'':String(Math.ceil(un-(G.ult||0))))}
  setHid('badge',!G.fresh);setTx('badge',String(G.fresh));
}

