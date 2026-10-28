// Crypte des Cendres — audio.js : sons synthétisés (Web Audio), aucun fichier à charger
const SND=(()=>{
  let ac=null,master,sfx,mus,noiseB=null,unlocked=false,musOn=false;const last={};
  function init(){if(ac)return true;const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
    try{ac=new C()}catch{return false}
    master=ac.createDynamicsCompressor();master.threshold.value=-14;master.ratio.value=6;master.connect(ac.destination);
    sfx=ac.createGain();mus=ac.createGain();sfx.connect(master);mus.connect(master);
    noiseB=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noiseB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    vol();return true}
  function vol(){if(!ac)return;sfx.gain.setTargetAtTime(SET.sfx,ac.currentTime,.02);mus.gain.setTargetAtTime(SET.music*.55,ac.currentTime,.2);wake()}
  // Batterie (v134) : musique coupée, le moteur audio s'endort 8 s après le dernier son et se réveille au suivant.
  let idleT=0;function wake(){if(!ac||!unlocked||document.hidden)return;if(ac.state==='suspended')ac.resume();clearTimeout(idleT);if(SET.music<=0)idleT=setTimeout(()=>{if(ac&&SET.music<=0&&!document.hidden)ac.suspend()},8000)}
  function unlock(){if(!init())return;if(ac.state==='suspended')ac.resume();if(!unlocked){unlocked=true;music()}}
  addEventListener('pointerdown',unlock,true);addEventListener('keydown',unlock,true);
  document.addEventListener('visibilitychange',()=>{if(!ac)return;if(document.hidden)ac.suspend();else if(unlocked)ac.resume()});
  const T=()=>ac.currentTime;
  function env(g,t,a,d,v){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(v,0.0002),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d)}
  function tone(o){const t=T()+(o.at||0),os=ac.createOscillator(),g=ac.createGain();os.type=o.type||'sine';os.frequency.setValueAtTime(o.f,t);
    if(o.f2)os.frequency.exponentialRampToValueAtTime(o.f2,t+(o.a||.005)+(o.d||.15));os.detune.value=o.det||0;
    let n=os;if(o.lp){const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;os.connect(f);n=f}
    n.connect(g);g.connect(o.dest||sfx);env(g,t,o.a||.005,o.d||.15,o.v||.2);os.start(t);os.stop(t+(o.a||.005)+(o.d||.15)+.05)}
  function noise(o){const t=T()+(o.at||0),s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noiseB;s.loop=true;
    f.type=o.ft||'lowpass';f.frequency.setValueAtTime(o.f||1500,t);if(o.f2)f.frequency.exponentialRampToValueAtTime(o.f2,t+(o.a||.005)+(o.d||.2));f.Q.value=o.q||.8;
    s.connect(f);f.connect(g);g.connect(o.dest||sfx);env(g,t,o.a||.005,o.d||.2,o.v||.2);s.start(t,Math.random()*.5);s.stop(t+(o.a||.005)+(o.d||.2)+.05)}
  const arp=(notes,step,o)=>notes.forEach((f,i)=>tone(Object.assign({f,at:i*step},o)));
  const LIB={
    ui:()=>tone({f:880,type:'triangle',d:.05,v:.06}),
    hit:()=>noise({f:2600,ft:'bandpass',q:2,d:.04,v:.05}),
    crit:()=>{tone({f:1500,f2:900,type:'square',d:.07,v:.05,lp:4000});noise({f:5000,ft:'highpass',d:.05,v:.05})},
    hurt:()=>{tone({f:150,f2:60,type:'sine',d:.18,v:.45});noise({f:700,d:.12,v:.22})},
    gold:()=>tone({f:1900+Math.random()*300,type:'triangle',d:.05,v:.035}),
    pick:()=>arp([660,990],.04,{type:'triangle',d:.12,v:.08}),
    pick2:()=>arp([660,880,1320],.045,{type:'triangle',d:.16,v:.1}),
    pick3:()=>arp([523,784,1046,1568],.05,{type:'triangle',d:.22,v:.12}),
    leg:()=>{arp([392,523,659,784,1046],.06,{type:'sawtooth',d:.35,v:.07,lp:2600});arp([1568,2093],.12,{type:'sine',d:.5,v:.06,at:.25})},
    wish:()=>{arp([784,988,1175,1568],.05,{type:'sine',d:.4,v:.12});noise({f:6000,ft:'highpass',d:.5,v:.04,a:.05})},
    potion:()=>{for(let i=0;i<4;i++)tone({f:300+i*90+Math.random()*40,f2:600+i*120,type:'sine',d:.07,v:.09,at:i*.05})},
    dash:()=>noise({f:500,f2:2400,ft:'bandpass',q:1.2,d:.18,v:.16}),
    skill_guerrier:()=>{noise({f:300,f2:1800,ft:'bandpass',q:1,a:.03,d:.35,v:.25});tone({f:90,f2:60,d:.3,v:.2})},
    skill_archer:()=>{for(let i=0;i<6;i++)tone({f:700+i*40,f2:300,type:'triangle',d:.08,v:.07,at:i*.025});noise({f:3000,ft:'highpass',d:.15,v:.06})},
    skill_magicien:()=>{arp([1046,1318,1568,2093],.03,{type:'sine',d:.3,v:.08});noise({f:4000,f2:800,ft:'bandpass',q:3,d:.4,v:.08})},
    ult:()=>{tone({f:120,f2:35,type:'sawtooth',d:.8,v:.3,lp:700});noise({f:1200,f2:120,d:.9,v:.35,a:.01});tone({f:55,d:.9,v:.35})},
    boom:()=>{noise({f:900,f2:90,d:.5,v:.3});tone({f:80,f2:40,d:.45,v:.3})},
    rain:()=>noise({f:3500,ft:'bandpass',q:3,d:.05,v:.05}),
    boss:()=>{tone({f:73,type:'sawtooth',a:.2,d:1.2,v:.25,lp:500});tone({f:110,type:'sawtooth',a:.25,d:1.1,v:.15,lp:600,det:8});noise({f:200,a:.2,d:1,v:.1})},
    bossdie:()=>{noise({f:1500,f2:80,d:1.3,v:.35});arp([196,262,330,392],.12,{type:'triangle',d:.6,v:.12,at:.3})},
    elite:()=>{tone({f:220,type:'square',d:.25,v:.07,lp:1500});tone({f:233,type:'square',d:.25,v:.07,lp:1500,at:.02})},
    frenzy:()=>{tone({f:400,f2:1600,type:'sawtooth',d:.35,v:.08,lp:3000});arp([1046,1318],.08,{type:'sine',d:.2,v:.08,at:.2})},
    lvl:()=>arp([523,659,784,1046,1318],.07,{type:'triangle',d:.3,v:.11}),
    relic:()=>{arp([330,415,494,659],.08,{type:'sine',d:.5,v:.12});noise({f:5000,ft:'highpass',a:.1,d:.6,v:.04})},
    win:()=>{arp([523,659,784],.12,{type:'triangle',d:.4,v:.13});arp([1046],.1,{type:'triangle',d:.8,v:.13,at:.38})},
    lose:()=>arp([392,330,262,196],.16,{type:'sawtooth',d:.5,v:.08,lp:900}),
    wave:()=>{tone({f:147,type:'sawtooth',a:.05,d:.6,v:.12,lp:700})},
  };
  const GAP={hit:.045,crit:.07,gold:.22,rain:.06,hurt:.08,boom:.08,pick:.2,pick2:.15,pick3:.12,ui:.03};
  // Sons de ramassage (Réglages) : 'all' = tout, 'imp' = seulement rare et mieux, mods, reliques, fragments, sceaux ; 'off' = aucun
  const PICK={gold:'low',pick:'low',pick2:'imp',pick3:'imp'};
  function play(k){if(!ac||!unlocked||SET.sfx<=0||!LIB[k])return;wake();const pk=PICK[k],pm=SET.pickSnd||'imp';if(pk&&(pm==='off'||(pm==='imp'&&pk==='low')))return;const t=ac.currentTime,g=GAP[k]||.02;if(last[k]&&t-last[k]<g)return;last[k]=t;try{LIB[k]()}catch{}}
  // Musique d'ambiance : bourdon grave filtré + cloches rares en mode mineur
  function music(){if(musOn||!ac)return;musOn=true;
    const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=380;f.Q.value=3;const g=ac.createGain();g.gain.value=.16;f.connect(g);g.connect(mus);
    const lfo=ac.createOscillator(),lg=ac.createGain();lfo.frequency.value=.07;lg.gain.value=160;lfo.connect(lg);lg.connect(f.frequency);lfo.start();
    for(const [fr,dt] of [[55,0],[55,7],[82.4,-5],[110,3]]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.detune.value=dt;o.connect(f);o.start()}
    const scale=[220,261.6,293.7,329.6,392,440,523.3];
    const bell=()=>{if(SET.music>0&&!document.hidden){const n=scale[Math.floor(Math.random()*scale.length)];tone({f:n,type:'sine',a:.01,d:2.6,v:.09,dest:mus});tone({f:n*2.01,type:'sine',a:.01,d:1.6,v:.03,dest:mus})}
      setTimeout(bell,3500+Math.random()*4500)};setTimeout(bell,2500)}
  return {play,vol,unlock};
})();
addEventListener('click',e=>{if(e.target.closest('.btn,.cx-btn,.chip,.cx-chip,.cx-cell,.cell,.cx-role,.cx-pick,.cx-row,.cx-tab,.cx-mod'))SND.play('ui')},true);
