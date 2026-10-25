// Banc d'essai : bot + profils, exécuté dans la page du jeu (portée globale partagée)
window.SIM={};
SIM.profile=function(cls,tier){
  heroCls=cls;
  const T=[
    {up:0,gear:null,w:0,wlv:0,mods:0,mrk:0,pres:0,mast:0},
    {up:2,gear:{l:8,r:1,u:5},w:1,wlv:5,mods:3,mrk:1,pres:0,mast:3},
    {up:5,gear:{l:25,r:2,u:25},w:2,wlv:25,mods:5,mrk:2,pres:0,mast:8},
    {up:9,gear:{l:60,r:3,u:60},w:4,wlv:60,mods:8,mrk:9,pres:20,mast:10},
    {up:9,gear:{l:100,r:4,u:100},w:4,wlv:100,mods:9,mrk:9,pres:60,mast:10},
  ][tier];
  meta.up={};for(const u of UPG)meta.up[u.k]=Math.min(u.max,T.up);
  meta.tal={};meta.gear={armure:null,amulette:null,bottes:null,anneau:null};meta.stash=[];
  if(T.gear){const save=meta.diff;meta.diff=0;for(const sl of ['armure','amulette','bottes','anneau']){let it;for(let k=0;k<40;k++){it=genItem(T.gear.l,T.gear.r);if(it.slot===sl&&it.r===T.gear.r)break}it.slot=sl;it.base.k=BASE_STAT[sl];it.up=T.gear.u;meta.gear[sl]=it}meta.diff=save}
  const w=WPN[cls][T.w];meta.built={};if(T.w)meta.built[w.id]=1;meta.wpn[cls]=w.id;meta.wlv={};meta.wlv[w.id]=T.wlv;
  meta.mods={};meta.hload={};meta.wload={};meta.hslots={};meta.hslots[cls]=3+Math.min(3,Math.floor(T.mods/3));meta.aura={};
  meta.mast={};meta.mast[cls]={r:T.mast,xp:0};meta.wmast={};meta.wmast[w.id]={r:T.mast,xp:0};meta.pol={};meta.wpol={};
  meta.up.cat=Math.min(4,T.up);meta.up.rea=Math.min(4,T.up);
  // mods : les meilleurs possibles dans la capacité
  if(T.mods){const ids=Object.keys(MODS).filter(id=>modOk(id,cls)).sort((a,b)=>MODS[b].r-MODS[a].r);
    for(const id of ids)meta.mods[id]=Math.min(MODS[id].max-1,T.mrk);
    const pref=['ferocite','cadence','oeil','boucherie','dedoublement','orage','vitalite','egide','souffle','intensite','flux','etendue','pas','survivant','diamant','allonge','sangsue','deflagration'];
    for(const kind of ['w','h']){const b=build(kind,cls);for(const id of pref){if(meta.mods[id]==null)continue;if((modKind(id)==='w')!==(kind==='w'))continue;const bs=bBest(b,id,meta.mods[id]);if(bs.i>=0&&bUsed(b)+bs.d<=bCap(b))b.load[bs.i]=id}}
    if(T.mods>=5){const au=['ferveur','presence','cupidite'].find(a=>meta.mods[a]!=null);meta.aura[cls]=au||null}}
  meta.prest={};meta.prest[cls]={lv:T.pres,pts:T.pres?{dmg:Math.floor(T.pres*.4),hp:Math.floor(T.pres*.3),aps:Math.floor(T.pres*.15),crit:Math.floor(T.pres*.15)}:{}};
  meta.relicQ=[];
};
SIM.PICK={guerrier:['dmg','aps','wave','reach','hp','leech','crit','cdmg','nova','regen','spd','echo'],archer:['multi','dmg','aps','fan','pierce','crit','cdmg','hp','echo','regen','spd'],magicien:['multi','dmg','splash','aps','fan','crit','cdmg','hp','nova','regen','echo']};
SIM.bot=function(){
  const P=G.P,cls=G.cls,ranged=cls!=='guerrier';let rx=0,ry=0,near=0,near2=0,boss=null,nd=1e9,ne=null;
  for(const e of G.en){if(e.dead||e.type==='cible')continue;const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
    if(d<nd){nd=d;ne=e}if(d<200)near++;if(d<120)near2++;if(e.type==='boss'&&d<500)boss=e;
    const R=ranged?300:(e.type==='boss'||e.state==='charge'||e.state==='wind'?220:95);
    if(d<R){const w=(e.type==='boss'?3:e.type==='brute'?2:1)*(e.state==='charge'||e.state==='wind'?3:1);rx+=dx/d*w*(R-d)/R;ry+=dy/d*w*(R-d)/R}}
  for(const b of G.eb){const dx=P.x-b.x,dy=P.y-b.y,d=Math.hypot(dx,dy)||1;if(d<140){rx+=dx/d*1.5*(140-d)/140;ry+=dy/d*1.5*(140-d)/140}}
  for(const z of G.zones){const dx=P.x-z.x,dy=P.y-z.y,d=Math.hypot(dx,dy)||1;if(d<z.r+40){rx+=dx/d*3;ry+=dy/d*3}}
  for(const l of G.lobs){const dx=P.x-l.tx,dy=P.y-l.ty,d=Math.hypot(dx,dy)||1;if(d<l.r+30){rx+=dx/d*3;ry+=dy/d*3}}
  let mx=rx,my=ry;
  // corps à corps : va au contact si la vie le permet
  if(!ranged&&ne&&P.hp>S.hp*.45&&near2<7){const dx=ne.x-P.x,dy=ne.y-P.y,d=Math.hypot(dx,dy)||1;if(d>55){mx+=dx/d*1.2;my+=dy/d*1.2}}
  // altération : va à la source sacrée
  if((P.psnT>0||P.brnT>0)&&G.wells){let w=null,wd=1e9;for(const s of G.wells)if(s.on){const d=Math.hypot(s.x-P.x,s.y-P.y);if(d<wd){wd=d;w=s}}if(w&&wd<900){mx+=(w.x-P.x)/wd*1.5;my+=(w.y-P.y)/wd*1.5}}
  // calme : ramasse le butin proche, sinon reste au centre
  if(Math.hypot(mx,my)<.15){let dr=null,dd=420;for(const d of G.drops){const q=Math.hypot(d.x-P.x,d.y-P.y);if(q<dd){dd=q;dr=d}}
    if(dr){mx+=(dr.x-P.x)/dd;my+=(dr.y-P.y)/dd}else{const cx=MAP/2-P.x,cy=MAP/2-P.y,c=Math.hypot(cx,cy)||1;if(c>500){mx+=cx/c*.6;my+=cy/c*.6}else if(ranged&&nd>380&&ne){mx+=(ne.x-P.x)/nd*.5;my+=(ne.y-P.y)/nd*.5}}}
  // bords et obstacles
  const ed=260;if(P.x<ed)mx+=(ed-P.x)/ed*2;if(P.x>MAP-ed)mx-=(P.x-MAP+ed)/ed*2;if(P.y<ed)my+=(ed-P.y)/ed*2;if(P.y>MAP-ed)my-=(P.y-MAP+ed)/ed*2;
  let m=Math.hypot(mx,my);
  if(m>.05){let ux=mx/m,uy=my/m;for(let k=0;k<8&&blocked(P.x+ux*40,P.y+uy*40,P.r);k++){const a=Math.atan2(uy,ux)+(k%2?1:-1)*(.5+k*.3);ux=Math.cos(a);uy=Math.sin(a)}
    joy.vx=ux;joy.vy=uy}else{joy.vx=0;joy.vy=0}
  // actions
  if(P.novaCd<=0&&(near>=4||(boss&&nd<230)||(cls==='guerrier'&&near2>=3)))doNova();
  if((G.ult||0)>=ultNeed()&&(near>=7||boss))doUlt();
  if(P.dashCd<=0&&(P.hp<S.hp*.5&&near2>=3||G.eb.some(b=>Math.hypot(b.x-P.x,b.y-P.y)<55)||G.en.some(e=>e.state==='charge'&&Math.hypot(e.x-P.x,e.y-P.y)<130)))doDash();
  if(G.potions>0&&P.hp<S.hp*.42)doPotion();
};
SIM.run=function(o){
  const t0=performance.now();SIM.profile(o.cls,o.tier);meta.mode='survie';meta.start=o.level;meta.diff=o.diff;meta.torm=o.torm||1;meta.biome=o.biome||0;meta.wish={leg:false,aff:{}};
  newGame();started=false;paused=true;$('intro').hidden=true;
  const S0=stats(G.eq),dps0=dps(S0),R={cls:o.cls,tier:o.tier,level:o.level,diff:o.diff,torm:o.torm||0,dps:Math.round(dps0),hp:Math.round(S0.hp),armor:Math.round(S0.armor),rounds:0,died:false,t:0,kills:0,gold:0,items:[0,0,0,0,0],dmgTaken:0,hl:1,potions:0,bossT:[],enMax:0,maxRounds:o.rounds||1};
  const ess0=meta.essence;let hp=G.P.hp,bossSeen={};
  const maxSteps=(o.rounds||1)*LEVEL_T*60+600;
  for(let i=0;i<maxSteps;i++){
    SIM.bot();const hb=G.P.hp;update(STEP);if(G.P.hp<hb)R.dmgTaken+=hb-G.P.hp;
    if(G.en.length>R.enMax)R.enMax=G.en.length;
    for(const e of G.en)if(e.type==='boss'&&!bossSeen[e.__id||(e.__id=Math.random())]){bossSeen[e.__id]=G.t}
    if(i%30===0)for(const k in bossSeen){}
    if(!$('lvlup').hidden){const ks=[...document.querySelectorAll('#choices .choice')].map(b=>b.dataset.k),pr=SIM.PICK[o.cls];let k=pr.find(x=>ks.includes(x))||ks[0];$('lvlup').hidden=true;pickUp(k);paused=true;$('lvlup').hidden=true}
    if(G.over){R.died=!!(G.P.hp<=0);break}
    if(!$('extract').hidden){R.rounds++;if(R.rounds>=(o.rounds||1)){break}$('contBtn').click();paused=true}
  }
  R.t=Math.round(G.t);R.kills=G.kills;R.gold=G.gold;R.hl=G.hl;R.ess=meta.essence-ess0;R.potions=2+lv('alc')-G.potions;
  for(const it of G.loot.items)R.items[it.r]++;R.loot=G.loot.items.length;R.relics=G.loot.relics.length;
  R.ms=Math.round(performance.now()-t0);R.dtps=+(R.dmgTaken/Math.max(1,G.t)).toFixed(1);R.kpm=Math.round(G.kills/Math.max(1,G.t)*60);
  $('over').hidden=true;$('extract').hidden=true;
  return R;
};
