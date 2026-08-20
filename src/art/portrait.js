import { seeded } from './space.js';

/* ═══ 12-c. 승무원 초상 ═════════════════════════════════════════════ */
export const FACE = [
  "...HHHHH...",
  "..HHHHHHH..",
  ".HHHHHHHHH.",
  ".HSSSSSSSH.",
  ".HSVVVVVSH.",
  ".HSSSSSSSH.",
  "..SSSSSSS..",
  "..SBBBBBS..",
  "...SSSSS...",
  "...CCCCC...",
  "..CCCCCCC..",
  ".CC.CCC.CC.",
  ".C...C...C.",
];
export const CLASS_COL = {
  assault:'#c8a24a', marksman:'#8f9c5a', engineer:'#b98f52', heavy:'#8d97a0', pyro:'#a4432c',
  op:'#9fb6c8',
};
export const SKINS = ['#c9976a','#a97448','#8a5c3a','#e0b489','#6f4a30'];
export const portraitCache = new Map();
export function portrait(c, s, isOp){
  const key = c.id+'|'+s+'|'+c.status+'|'+(isOp?'o':'t');
  if (portraitCache.has(key)) return portraitCache.get(key);
  const R = seeded(c.id + c.name);
  const pal = {
    H: isOp ? CLASS_COL.op : CLASS_COL[c.cls],
    S: SKINS[Math.floor(R()*SKINS.length)],
    V: R() > 0.45 ? '#3c4f5c' : '#5a4a2c',
    B: R() > 0.5 ? '#2c2118' : SKINS[0],
    C: isOp ? '#3b4550' : '#4a4327',
  };
  const w = FACE[0].length, h = FACE.length;
  const cv = document.createElement('canvas'); cv.width = w*s; cv.height = h*s;
  const g = cv.getContext('2d');
  for (let r=0;r<h;r++) for (let col=0;col<w;col++){
    const ch = FACE[r][col];
    if (ch === '.' || !pal[ch]) continue;
    g.fillStyle = pal[ch]; g.fillRect(col*s, r*s, s, s);
  }
  if (c.status === 'injured'){          // 붕대
    g.fillStyle = '#d8cdb8'; g.fillRect(1*s, 3*s, 9*s, 1*s); g.fillRect(2*s, 2*s, 2*s, 3*s);
    g.fillStyle = '#a4432c'; g.fillRect(3*s, 3*s, 1*s, 1*s);
  }
  portraitCache.set(key, cv);
  return cv;
}
