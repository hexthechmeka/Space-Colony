import { OPT } from './store.js';

/* ═══ 4. 사운드 ═════════════════════════════════════════════════════ */
export const Audio_ = (() => {
  let ctx = null, noise = null;
  function ac(){
    if (!OPT.sfx) return null;
    try{
      if (!ctx){
        ctx = new (window.AudioContext||window.webkitAudioContext)();
        const len = ctx.sampleRate * 0.5;
        noise = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = noise.getChannelData(0);
        for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch(e){ return null; }
  }
  function burst(dur, freq, q, gain, type){
    const c = ac(); if (!c) return;
    const src = c.createBufferSource(); src.buffer = noise;
    const f = c.createBiquadFilter(); f.type = type||'bandpass'; f.frequency.value = freq; f.Q.value = q||1;
    const g = c.createGain(); g.gain.value = gain * (OPT.vol/100);
    src.connect(f); f.connect(g); g.connect(c.destination);
    const t = c.currentTime;
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    src.start(t); src.stop(t+dur);
  }
  function tone(freq, dur, type, gain, slideTo){
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type||'square'; o.frequency.value = freq;
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime+dur);
    g.gain.value = gain * (OPT.vol/100);
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime;
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.start(t); o.stop(t+dur);
  }
  return { burst, tone };
})();
export function sfx(kind){
  switch(kind){
    case 'rifle':   Audio_.burst(0.07, 1500, 1.2, 0.10); break;
    case 'shotgun': Audio_.burst(0.16, 700, 0.7, 0.16); break;
    case 'hmg':     Audio_.burst(0.05, 2100, 1.6, 0.07); break;
    case 'flamer':  Audio_.burst(0.09, 420, 0.5, 0.05); break;
    case 'turret':  Audio_.burst(0.06, 1100, 1.4, 0.07); break;
    case 'hit':     Audio_.burst(0.05, 900, 2.0, 0.06); break;
    case 'kill':    Audio_.burst(0.16, 320, 0.8, 0.10); break;
    case 'boom':    Audio_.burst(0.42, 190, 0.5, 0.24, 'lowpass'); break;
    case 'hurt':    Audio_.tone(180, 0.16, 'sawtooth', 0.10, 90); break;
    case 'click':   Audio_.tone(520, 0.04, 'square', 0.05); break;
    case 'build':   Audio_.tone(300, 0.09, 'square', 0.09); setTimeout(()=>Audio_.tone(450,0.10,'square',0.09), 80); break;
    case 'buy':     Audio_.tone(420, 0.08, 'triangle', 0.11); setTimeout(()=>Audio_.tone(630,0.12,'triangle',0.10), 75); break;
    case 'warp':    Audio_.tone(120, 0.9, 'sawtooth', 0.09, 420); break;
    case 'alert':   Audio_.tone(660, 0.16, 'square', 0.09, 440); setTimeout(()=>Audio_.tone(660,0.16,'square',0.09,440), 220); break;
    case 'wave':    Audio_.tone(200, 0.5, 'sawtooth', 0.10, 150); break;
    case 'win':     [392,523,659,784].forEach((f,i)=>setTimeout(()=>Audio_.tone(f,0.22,'triangle',0.10), i*130)); break;
    case 'lose':    [330,262,196,131].forEach((f,i)=>setTimeout(()=>Audio_.tone(f,0.34,'sawtooth',0.10), i*170)); break;
  }
}
