// Crypte des Cendres — rendergl.js : rendu WebGL (PixiJS), textures tirées des formes 2D, repli sur le Canvas. Découpé de render.js en v145.
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
  if(type==='scarab'){scarabShape(ETYPE.scarab.r,white,frame|0);return}
  if(type==='mummy'||type==='mummyR'){mummyShape(ETYPE[type].r,white,type==='mummyR');return}
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
function pPlayer(cls,flash,C=lookPal(cls)){
  const r=17;ctx.lineCap='round';
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
  const res=SET.eco?1:Math.min(devicePixelRatio||1,2);
  const R=new PIXI.Renderer({width:innerWidth,height:innerHeight,resolution:res,autoDensity:true,backgroundColor:0x050307,antialias:true});
  const view=R.view;view.id='pv';view.setAttribute('aria-hidden','true');
  Object.assign(view.style,{position:'fixed',left:'0',top:'0',width:'100%',height:'100%',display:'block'});
  cv.parentNode.insertBefore(view,cv);
  // v133 : seul le moteur en service écoute son canevas. Détruire l'ancien moteur perd son contexte un peu plus tard ; sans ce garde,
  // l'événement marquait le nouveau moteur comme perdu (écran noir 1,5 s, puis rendu standard) à chaque retour dans l'appli.
  const mine=()=>!!PX&&PX.R.view===view;
  view.addEventListener('webglcontextlost',e=>{e.preventDefault();if(!mine())return;PX.lost=true;noteErr('rendu','contexte WebGL perdu');clearTimeout(PX.lostT);PX.lostT=setTimeout(()=>{if(PX&&PX.lost)dropPixi('contexte WebGL non rétabli')},1500)},false);
  view.addEventListener('webglcontextrestored',()=>{if(!mine())return;PX.lost=false;clearTimeout(PX.lostT);try{if(G)buildStatic()}catch(err){dropPixi(err)}},false);
  const C=()=>new PIXI.Container(),Gr=()=>new PIXI.Graphics();
  const stage=C(),world=C(),top=C(),ui=C();
  const T={};
  T.tiles=BIOMES.map((b,i)=>PIXI.Texture.from(buildTile(i)));T.tile=T.tiles[0];
  T.shadow=mkTex(64,28,()=>{ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,0,32,14,0,0,7);ctx.fill()},1);
  T.en={};T.enW={};
  T.scarab=[0,1].map(f=>mkTex(50,50,()=>pEnemy('scarab',false,f)));T.scarabW=mkTex(50,50,()=>pEnemy('scarab',true,0));
  T.curse=mkTex(22,20,curseGlyph);T.mark=mkTex(20,20,markGlyph);T.star=mkTex(12,12,starGlyph);T.root=mkTex(66,52,()=>rootRing(26));T.fallen=mkTex(48,30,fallenShape);T.sand=mkTex(256,256,()=>sandPoolShape(0,0,120,0),1);
  for(const t of['ghoul','archer','brute','boss','poison','pyro','slime','givrin','mummy','mummyR']){const s=2*(ETYPE[t].r+16);T.en[t]=mkTex(s,s,()=>pEnemy(t,false));T.enW[t]=mkTex(s,s,()=>pEnemy(t,true))}
  {const s=LORD_TEX(54);T.lord=mkTex(s,s,()=>bourreauShape(54,false));T.lordW=mkTex(s,s,()=>bourreauShape(54,true))} // v147 : Bourreau, pieu, fragment de clé
  T.stake=[0,1].map(w=>mkTex(48,48,()=>stakeShape(16,!!w)));T.key=mkTex(34,24,()=>keyShape(LORD_C));
  T.bat=[0,1,2].map(f=>mkTex(48,40,()=>pEnemy('bat',false,f)));T.batW=mkTex(48,40,()=>pEnemy('bat',true,1));
  T.cible=[0,1,2].map(s=>mkTex(48,48,()=>pCible(s)));
  T.pl={};for(const c in CLS)T.pl[c]=[mkTex(100,100,()=>pPlayer(c,false)),mkTex(100,100,()=>pPlayer(c,true))];T.plc=new Map();
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
  T.mod=MOD_RAR.map(m=>mkTex(22,28,()=>modShape(m.c)));
  T.relic=RTIER.map(t=>mkTex(22,30,()=>relicShape(t.c)));
  T.seal=mkTex(30,30,()=>sealShape('#ff5fd2'));
  T.part=RAR.map(r=>mkTex(26,26,()=>partShape(r.c)));
  const itemT=c=>mkTex(20,30,()=>{ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(0,8,8,3,0,0,7);ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,0);ctx.lineTo(0,10);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=1.5;ctx.stroke()});
  T.item=RAR.map(r=>itemT(r.c));T.potion=itemT('#5fbf7a');
  T.beam=mkTex(8,128,()=>{const gr=ctx.createLinearGradient(0,-64,0,64);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');ctx.fillStyle=gr;ctx.fillRect(-4,-64,8,128)},1);
  T.glow=mkTex(256,256,()=>{const gr=ctx.createRadialGradient(0,0,0,0,0,128);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gr;ctx.fillRect(-128,-128,256,256)},1);
  T.flame=mkTex(12,20,()=>{ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.ellipse(0,0,4,8,0,0,7);ctx.fill()});
  T.pillars=BIOMES.map(B=>mkTex(84,110,()=>{const r=34;ctx.fillStyle='rgba(0,0,0,.4)';ctx.beginPath();ctx.ellipse(0,r*.75,r*1.05,r*.45,0,0,7);ctx.fill();
    if(B.obel){obeliskShape(0,0,r,B);return}const gr=ctx.createRadialGradient(-r*.3,-r*.3,2,0,0,r);gr.addColorStop(0,B.pil[0]);gr.addColorStop(1,B.pil[1]);ctx.fillStyle=gr;circle(0,0,r);ctx.fill();ctx.strokeStyle='#0c0a0e';ctx.lineWidth=2;ctx.stroke()},2));T.pillar=T.pillars[0];
  T.brazier=mkTex(24,24,()=>{ctx.fillStyle='#2a2228';circle(0,0,9);ctx.fill();ctx.strokeStyle='#4a3e44';ctx.lineWidth=2;ctx.stroke()});
  T.dark=mkTex(512,512,()=>{const gr=ctx.createRadialGradient(0,0,256*.3/1.3,0,0,256/1.3);gr.addColorStop(0,'rgba(6,4,9,0)');gr.addColorStop(1,'rgba(6,4,9,.74)');ctx.fillStyle=gr;ctx.fillRect(-256,-256,512,512)},1);
  // Obscurité de la tempête de sable (v137) : même taille que l'obscurité normale (tout l'écran), lumière resserrée au centre.
  T.darkS=mkTex(512,512,()=>{const gr=ctx.createRadialGradient(0,0,256*.3/1.3*.5,0,0,256/1.3*.45);gr.addColorStop(0,'rgba(6,4,9,0)');gr.addColorStop(1,'rgba(6,4,9,.94)');ctx.fillStyle=gr;ctx.fillRect(-256,-256,512,512)},1);
  PIXI.BitmapFont.from('dmg',{fontFamily:'Alegreya Sans, system-ui, sans-serif',fontSize:40,fontWeight:'700',fill:'#ffffff',stroke:'#000000',strokeThickness:6},
    {chars:[['a','z'],['A','Z'],['0','9'],PX_CHARS],resolution:1});
  const L={};
  L.floor=new PIXI.TilingSprite(T.tile,MAP,MAP);
  L.staticG=Gr();L.sand=C();L.underG=Gr();L.beam=C();L.drop=C();L.static=C();L.shadow=C();L.aura=C();L.en=C();
  L.player=new PIXI.Sprite(T.pl.archer[0]);L.player.anchor.set(.5);
  L.fxG=Gr();L.shot=C();L.eb=C();L.part=C();L.glow=C();L.glowStatic=C();L.glow.addChild(L.glowStatic);
  world.addChild(L.floor,L.staticG,L.sand,L.underG,L.beam,L.drop,L.static,L.shadow,L.aura,L.en,L.player,L.fxG,L.shot,L.eb,L.part,L.glow);
  const dark=new PIXI.Sprite(T.dark);dark.anchor.set(.5);
  const darkS=new PIXI.Sprite(T.darkS);darkS.anchor.set(.5);darkS.visible=false;
  const veil=new PIXI.Sprite(PIXI.Texture.WHITE);veil.tint=0x96703c;veil.visible=false; // voile de la tempête de sable (v136)
  // topG (v147) : au-dessus de l'obscurité (arène, Sentence, chaîne du Bourreau)
  L.topG=Gr();L.txt=C();top.addChild(L.topG,L.txt);L.uiG=Gr();L.uiTxt=C();ui.addChild(L.uiG,L.uiTxt);
  stage.addChild(world,dark,darkS,veil,top,ui);
  const pool=(layer,mk)=>({layer,mk,arr:[],n:0});
  const spr=()=>{const s=new PIXI.Sprite(PIXI.Texture.WHITE);s.anchor.set(.5);return s};
  const txt=()=>{const t=new PIXI.BitmapText('',{fontName:'dmg',fontSize:16});t.anchor.set(.5,1);return t};
  const P={sh:pool(L.shadow,spr),aura:pool(L.aura,spr),en:pool(L.en,spr),beam:pool(L.beam,()=>{const s=spr();s.anchor.set(.5,1);return s}),drop:pool(L.drop,spr),
    shot:pool(L.shot,spr),eb:pool(L.eb,spr),part:pool(L.part,spr),glow:pool(L.glow,()=>{const s=spr();s.blendMode=PIXI.BLEND_MODES.ADD;return s}),txt:pool(L.txt,txt),utxt:pool(L.uiTxt,txt)};
  PX={R,stage,world,top,ui,dark,darkS,veil,T,L,P,statics:[]};
  cv.width=cv.width;
  return true;
}
function take(p){let s=p.arr[p.n];if(!s){s=p.mk();p.arr.push(s);p.layer.addChild(s)}s.visible=true;p.n++;return s}
function endPools(){for(const k in PX.P){const p=PX.P[k];for(let i=p.n;i<p.arr.length;i++)p.arr[i].visible=false;p.n=0}}
function buildStatic(){
  if(!PX||!G)return;const {L,T}=PX;
  for(const c of L.static.removeChildren())c.destroy();for(const c of L.glowStatic.removeChildren())c.destroy();for(const c of L.sand.removeChildren())c.destroy();
  PX.statics=[];
  const BI=biome(),hx=c=>parseInt(c.slice(1),16),rgb=s=>{const [a,b,c]=s.split(',').map(Number);return (a<<16)|(b<<8)|c};L.floor.texture=T.tiles[G.biome]||T.tiles[0];
  const g=L.staticG;g.clear();g.lineStyle(EDGE*2,hx(BI.wall[0]),1);g.drawRect(0,0,MAP,MAP);g.lineStyle(3,hx(BI.wall[1]),1);g.drawRect(EDGE,EDGE,MAP-EDGE*2,MAP-EDGE*2);
  g.lineStyle(2,rgb(BI.rune),.1);
  for(const r of G.runes){g.drawCircle(r.x,r.y,r.r);g.drawCircle(r.x,r.y,r.r*.82);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;g.moveTo(r.x+Math.cos(a)*r.r*.84,r.y+Math.sin(a)*r.r*.84);g.lineTo(r.x+Math.cos(a+.2)*r.r*.98,r.y+Math.sin(a+.2)*r.r*.98)}}
  for(const q of G.sands||[]){const s=new PIXI.Sprite(T.sand);s.anchor.set(.5);s.scale.set(q.r/120);s.position.set(q.x,q.y);L.sand.addChild(s);PX.statics.push({s,x:q.x,y:q.y,m:q.r,sand:q})}
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
  const {z,vw,vh,ox,oy,vis}=camView(),P=G.P;
  world.scale.set(z);world.position.set(-ox*z,-oy*z);top.scale.set(z);top.position.set(-ox*z,-oy*z);
  const bz=G.lordDk>.5; // v147 : braseros éteints pendant la phase d'ombre du Bourreau
  for(const o of PX.statics){const v=vis(o.x,o.y,o.m)&&!(bz&&(o.glow||o.flame));o.s.visible=v;if(!v)continue;
    if(o.glow){const f=1+.06*Math.sin(G.t*11+o.b.ph)+.04*Math.sin(G.t*23+o.b.ph*2);o.s.width=o.s.height=340*f}
    else if(o.flame){const f=1+.06*Math.sin(G.t*11+o.b.ph)+.04*Math.sin(G.t*23+o.b.ph*2);o.s.scale.set(f)}
    else if(o.sand)o.s.rotation=G.t*.25*(o.sand.dir||1)}
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
  for(const s of G.spawns)if(s.rise&&vis(s.x,s.y,40)){const h=take(PP.aura);h.texture=T.fallen;h.position.set(s.x,s.y);h.scale.set(1);h.tint=0xffffff;h.alpha=1;h.rotation=0;
    const gl=take(PP.glow);gl.texture=T.glow;gl.tint=0x7dff8a;gl.alpha=.12+.3*(1-s.t/1.8);gl.position.set(s.x,s.y-6);gl.width=gl.height=90}
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
    else if(d.kind==='part'){const r=d.part.hf?6:bpdef(d.part.w).r;s.texture=T.part[r];s.position.set(d.x,d.y+bob);s.rotation=d.t*.8;beamC=RAR[r].c;beamH=90}
    else if(d.kind==='potion'){s.texture=T.potion;s.position.set(d.x,d.y+bob)}
    else if(d.kind==='key'){s.texture=T.key;s.position.set(d.x,d.y+bob);s.rotation=Math.sin(d.t*2)*.3;beamC=LORD_C;beamH=130;beamA=.45}
    else{s.texture=T.item[d.item.r];s.position.set(d.x,d.y+bob);beamC=d.wish?'#ffe08a':RAR[d.item.r].c;beamH=d.wish?220:d.item.r>=3?150:d.item.r===2?100:60;beamA=d.wish?.6:.35;if(d.wish)s.scale.set(1+.25*Math.sin(G.t*8))}
    if(beamH){const b=take(PP.beam);b.texture=T.beam;b.tint=hexc(beamC);b.alpha=beamA;b.position.set(d.x,d.y);b.width=8;b.height=beamH}}
  // ennemis
  const shadow=(x,y,r)=>{const s=take(PP.sh);s.texture=T.shadow;s.position.set(x,y+r*.75);s.width=r*2.1;s.height=r*.9;s.alpha=.4;s.rotation=0;s.tint=0};
  for(const e of G.en){if(!vis(e.x,e.y,e.r+40))continue;shadow(e.x,e.y,e.r);
    if(e.root>0){const a=take(PP.aura);a.texture=T.root;a.position.set(e.x,e.y+e.r*.55);a.scale.set((e.r+6)/26);a.tint=0xffffff;a.alpha=1;a.rotation=0}
    if(e.corr){const a=take(PP.aura);a.texture=T.aura;a.position.set(e.x,e.y);a.scale.set((e.r+9)/25);a.tint=0xffffff;a.alpha=1;a.rotation=0}
    if(e.elite){const a=take(PP.aura);a.texture=T.aura;a.position.set(e.x,e.y);a.scale.set((e.r+12+Math.sin(G.t*5)*3)/25);a.tint=hexc(ELITE[e.elite].c);a.alpha=1;a.rotation=0}
    const s=take(PP.en);s.alpha=1;s.scale.set(1);s.position.set(e.x,e.y);s.tint=e.frz>0?0xe6f8ff:e.slow>0?0x9fd0ff:0xffffff;
    if(e.lord){s.texture=e.flash>0?T.lordW:T.lord;s.rotation=Math.atan2(P.y-e.y,P.x-e.x);s.alpha=lordAlpha(e)}
    else if(e.stake){s.texture=T.stake[e.flash>0?1:0];s.rotation=0}
    else if(e.type==='bat'){s.texture=e.flash>0?T.batW:T.bat[Math.round((Math.sin(G.t*22+e.wob)*.5+.5)*2)];s.rotation=0}
    else if(e.type==='scarab'){s.texture=e.flash>0?T.scarabW:T.scarab[Math.sin(G.t*30+e.wob)>0?1:0];const tg=(e.tgtPod&&G.pod)?G.pod:P;s.rotation=Math.atan2(tg.y-e.y,tg.x-e.x)}
    else if(e.type==='cible'){s.texture=e.downed?T.cible[2]:e.flash>0?T.cible[1]:T.cible[0];s.rotation=Math.atan2(e.y-P.y,e.x-P.x)+Math.PI}
    else if(e.type==='boss'){s.texture=e.flash>0?T.enW.boss:T.en.boss;s.rotation=0}
    else{s.texture=e.flash>0?T.enW[e.type]:T.en[e.type];const tg=(e.tgtPod&&G.pod)?G.pod:P;s.rotation=Math.atan2(tg.y-e.y,tg.x-e.x);
      if(e.type==='slime'){const k=e.r/ETYPE.slime.r,w=Math.sin(G.t*6+e.wob)*.08;s.scale.set(k*(1+w),k*(1-w))}}
    if(e.curse>0){const c=take(PP.part);c.texture=T.curse;c.position.set(e.x+e.r*.85,e.y-e.r*.85);c.scale.set(1);c.tint=0xffffff;c.alpha=1}
    if(e.mark>0){const c=take(PP.part);c.texture=T.mark;c.position.set(e.x-e.r*.85,e.y-e.r*.85);c.scale.set(1);c.tint=0xffffff;c.alpha=1;c.rotation=0}
    if(e.stun>0)for(let i=0;i<3;i++){const c=take(PP.part),[x,y]=stunXY(e,i);c.texture=T.star;c.position.set(x,y);c.scale.set(1);c.tint=0xffffff;c.alpha=1;c.rotation=0}}
  // héros
  shadow(P.x,P.y,P.r);
  const pl=L.player;pl.texture=plTex(G.cls,palOf(P,G.cls))[P.flash>0?1:0];pl.position.set(P.x,P.y);pl.rotation=P.face;pl.alpha=P.down?.4:P.dashT>0?.55:(P.inv>0&&Math.floor(G.t*20)%2?.6:1);
  {const M=NET.on?(G.mates||[]):[];L.mateS=L.mateS||[];
    for(let i=0;i<Math.max(M.length,L.mateS.length);i++){const Q=M[i];let q=L.mateS[i];if(!Q){if(q)q.visible=false;continue}
      if(!q){q=new PIXI.Sprite(T.pl.archer[0]);q.anchor.set(.5);world.addChildAt(q,world.getChildIndex(L.player));L.mateS[i]=q}
      q.visible=true;q.texture=plTex(Q.cls,palOf(Q,Q.cls))[Q.flash>0?1:0];q.position.set(Q.x,Q.y);q.rotation=Q.face;q.alpha=Q.down?.35:Q.dashT>0?.6:1;shadow(Q.x,Q.y,Q.r)}}
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
  // partenaires : pastille de prestige puis nom (la police bitmap n'a que les lettres latines courantes)
  if(NET.on){const M=G.mates||[];for(const Q of M)ringPx(Q,Q.max||1);
    const L=M.map(Q=>{const w=who(Q.slot),b=take(PP.txt),lab=(w.name.replace(PX_CHARS_NO,'')||'Joueur '+((Q.slot|0)+1))+(Q.down?' - à terre':'');if(b.text!==lab)b.text=lab;b.fontSize=12;b.tint=Q.down?0xff8a80:parseInt((SLOT_C[Q.slot|0]||'#8fd3e0').slice(1),16);b.alpha=1;
      const pb=take(PP.txt),ps=String(w.pr|0);if(pb.text!==ps)pb.text=ps;pb.fontSize=11;pb.tint=0xf0cf4a;pb.alpha=1;const wn=b.textWidth,wp=pb.textWidth+9,W=wp+4+wn;return {b,pb,wn,wp,w:W,x0:Q.x-W/2,y:Q.y-Q.r-16}});
    for(const {b,pb,wn,wp,x0,y} of tagStack(L)){b.position.set(x0+wp+4+wn/2,y);pb.position.set(x0+wp/2,y-.5);f.lineStyle(1.2,0xf0cf4a,.95);f.beginFill(0x140e08,.85);f.drawRoundedRect(x0,y-13.5,wp,14,4);f.endFill();f.lineStyle(0)}}
  if(P.swing){const k=P.swing.t/.2,R2=P.swing.R;f.lineStyle(9*(1-k)+2,0xffebd2,.85*(1-k));arcLine(f,P.x,P.y,R2*.85,P.swing.a-1.35,P.swing.a-1.35+2.7*Math.min(1,k*2.2))}
  for(const r of G.rings){const k=r.t/.45,Rr=r.max||175;f.lineStyle(14*(1-k)+2,hexc('rgb('+(r.col||'255,140,60')+')'),Math.max(0,1-k));f.drawCircle(r.x,r.y,Rr*.17+Rr*.83*k)}
  for(const zp of G.zaps){f.lineStyle(2.5,0xc8e6ff,Math.max(0,1-zp.t/.25));f.moveTo(zp.x1,zp.y1);for(let i=1;i<6;i++){const k=i/6;f.lineTo(zp.x1+(zp.x2-zp.x1)*k+rand(-9,9),zp.y1+(zp.y2-zp.y1)*k+rand(-9,9))}f.lineTo(zp.x2,zp.y2)}
  // projectiles
  for(const s of allShots()){if(!vis(s.x,s.y,20))continue;const sp=take(PP.shot);sp.scale.set(1);
    if(s.kind==='orb'){sp.texture=T.orb;sp.rotation=Math.atan2(s.vy,s.vx);sp.tint=0xffffff;sp.alpha=1;sp.position.set(s.x,s.y)}
    else if(s.kind==='wave'){sp.texture=T.wave;sp.rotation=s.a;sp.tint=0xffe6c8;sp.alpha=Math.min(1,s.life*2.2);sp.position.set(s.x,s.y)}
    else{sp.texture=s.crit?T.boltC:T.bolt;sp.rotation=Math.atan2(s.vy,s.vx);sp.tint=s.crit?0xffe07a:0xf0a45a;sp.alpha=1;sp.position.set(s.x-s.vx*.0125,s.y-s.vy*.0125)}}
  for(const b of G.eb){if(!vis(b.x,b.y,20))continue;const s=take(PP.eb);s.texture=T.eb;s.position.set(b.x,b.y);s.scale.set(b.r/8);s.tint=0xffffff;s.alpha=1}
  for(const p of G.parts){if(!vis(p.x,p.y,10))continue;const s=take(PP.part);s.texture=T.circle;s.position.set(p.x,p.y);if(p.w)s.scale.set(p.size*3/8,p.size*.5/8);else s.scale.set(p.size/8);s.tint=hexc(p.col);s.alpha=Math.max(0,p.life/p.max)}
  // obscurité
  // tempête (v137) : l'obscurité garde sa taille (elle couvre tout l'écran, quel que soit le zoom) ; on passe en fondu à la version resserrée
  // v147 : phase d'ombre du Bourreau comprise (darkK), voile de sable seulement en tempête (stormK)
  const sk=darkK(),sv=stormK(),out=Math.max(vw,vh)*.62,ds=PX.darkS;dark.position.set((P.x-ox)*z,(P.y-oy)*z);dark.width=dark.height=out*2*1.3*z;dark.alpha=1-sk;
  ds.visible=sk>0;if(sk>0){ds.position.set(dark.position.x,dark.position.y);ds.width=ds.height=dark.width;ds.alpha=sk}
  {const v=PX.veil;v.visible=sv>0;if(sv>0){v.position.set(0,0);v.width=innerWidth;v.height=innerHeight;v.alpha=.38*sv}}
  lordTopGL(L.topG);
  // textes
  for(const tx of G.texts){if(!vis(tx.x,tx.y,30))continue;const b=take(PP.txt);if(b.text!==tx.txt)b.text=String(tx.txt);b.fontSize=tx.size;b.tint=hexc(tx.col);b.alpha=Math.max(0,1-tx.t/.8);b.position.set(tx.x,tx.y-tx.t*40+4)}
  // interface : flèches, joystick
  const g=L.uiG;g.clear();
  offArrows(vis,(x,y,a,col,label)=>{const c=hexc(col),ca=Math.cos(a),sa=Math.sin(a);
    const pt=(px,py)=>[x+px*ca-py*sa,y+px*sa+py*ca];
    g.lineStyle(2,0x120c16,1);g.beginFill(c,1);g.moveTo(...pt(14,0));g.lineTo(...pt(-8,-10));g.lineTo(...pt(-3,0));g.lineTo(...pt(-8,10));g.closePath();g.endFill();
    if(label){const b=take(PP.utxt);if(b.text!==label)b.text=label;b.fontSize=12;b.tint=c;b.alpha=1;b.position.set(x-ca*26,y-sa*26+6)}});
  if(joy.id!==null){g.lineStyle(2,0xede3d1,.25);g.drawCircle(joy.ox,joy.oy,56);g.lineStyle(0);g.beginFill(0xede3d1,.3);g.drawCircle(joy.ox+joy.vx*56,joy.oy+joy.vy*56,22);g.endFill()}
  endPools();
  R.render(PX.stage);
}
// Libère le moteur WebGL (v133) : objets de la scène, police des dégâts, textures (PIXI les garde dans un cache global tant qu'on ne les
// détruit pas : environ 11 Mo de plus à chaque reconstruction), puis le contexte et le canevas.
function pxFree(){const X=PX;PX=null;if(!X)return;try{clearTimeout(X.lostT)}catch{}
  try{X.stage.destroy({children:true})}catch{}
  try{if(PIXI.BitmapFont&&PIXI.BitmapFont.available&&PIXI.BitmapFont.available.dmg)PIXI.BitmapFont.uninstall('dmg')}catch{}
  const seen=new Set(),walk=v=>{if(!v||typeof v!=='object'||seen.has(v))return;seen.add(v);
    if(v instanceof PIXI.Texture){if(v!==PIXI.Texture.WHITE&&v!==PIXI.Texture.EMPTY)try{v.destroy(true)}catch{}return}
    if(v instanceof Map)v.forEach(walk);else for(const k in v)walk(v[k])};
  try{walk(X.T)}catch{}
  try{X.R.view.remove();X.R.destroy()}catch{}}
function dropPixi(err){
  if(!PX)return;noteErr('WebGL désactivé',err);
  pxFree();floorPat=null;resize();toast('Rendu WebGL interrompu : le jeu passe au rendu standard (modifiable dans les réglages).',true);
}
// Retour au premier plan : un téléphone peut avoir effacé ou perdu le rendu WebGL pendant l'absence (écran noir).
// On reconstruit le moteur de rendu à neuf (nouveau contexte, textures refaites) ; s'il n'y arrive pas, le jeu passe au rendu standard.
function renewRender(){floorPat=null;
  if(!PX){resize();return}
  pxFree();let ok=false;try{ok=initPixi()}catch(err){noteErr('rendu',err)}
  resize();if(ok){try{if(G)buildStatic()}catch(err){dropPixi(err)}}else toast('Rendu WebGL indisponible au retour : le jeu passe au rendu standard.',true)}
// Textures d'un héros à ses couleurs (normale, touchée), faites à la demande et gardées (au plus 24 jeux de couleurs).
function plTex(cls,pal){const T=PX.T,k=cls+pal.cloak+pal.rim+pal.inner;let t=T.plc.get(k);
  if(!t){if(T.plc.size>=24){const [k0,t0]=T.plc.entries().next().value;T.plc.delete(k0);for(const x of t0)try{x.destroy(true)}catch{}}
    t=[mkTex(100,100,()=>pPlayer(cls,false,pal)),mkTex(100,100,()=>pPlayer(cls,true,pal))];T.plc.set(k,t)}
  return t}
const glLost=()=>{try{return !!(PX&&(PX.lost||(PX.R.gl&&PX.R.gl.isContextLost&&PX.R.gl.isContextLost())))}catch{return false}};
function render(){
  if(PX&&!PX.lost&&glLost())dropPixi('contexte WebGL perdu');
  if(PX){if(PX.lost)return;try{renderPixi();return}catch(err){dropPixi(err)}}
  render2D();
}

