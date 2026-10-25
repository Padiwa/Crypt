import { chromium } from 'playwright';
import fs from 'fs';
const cfgs=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const out=process.argv[3];
const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route('**/pixi.min.js',r=>r.fulfill({status:404,body:''}));
await p.route('**/fonts.googleapis.com/**',r=>r.fulfill({status:404,body:''}));
await p.goto(''+new URL('../../index.html',import.meta.url).href+'');
await p.evaluate(()=>{localStorage.clear()});await p.reload();
await p.addScriptTag({path:new URL('./harness.js',import.meta.url).pathname});
const res=[];// diff : 0 Normal, 1 Difficile, 2 Cauchemar, 3 Tourment (torm 1-10)
for(const c of cfgs){const r=await p.evaluate(c=>SIM.run(c),c);res.push(r);fs.writeFileSync(out,JSON.stringify(res));
  console.log(`${r.cls.padEnd(8)} T${r.tier} L${String(r.level).padStart(2)} D${r.diff}${r.torm?'/'+r.torm:''} dps ${String(r.dps).padStart(6)} hp ${String(r.hp).padStart(5)} | ${r.died?'MORT':'OK  '} ${String(r.t).padStart(3)}s r${r.rounds} kills ${String(r.kills).padStart(4)} kpm ${String(r.kpm).padStart(4)} dtps ${String(r.dtps).padStart(6)} gold ${String(r.gold).padStart(6)} items ${r.items.join('/')} hl ${r.hl} en ${r.enMax} (${r.ms}ms)`)}
if(errs.length)console.log('ERR',errs.slice(0,5));
await b.close();
