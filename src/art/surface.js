import { mix, shade } from './planets.js';
import { seeded } from './space.js';
import { dist } from '../core/util.js';
import { LH, LW } from '../ui/canvas.js';

/* 행성 지표(탑다운) 배경 */
export const surfaceCache = new Map();
export function surfaceMap(p){
  if (surfaceCache.has(p.id)) return surfaceCache.get(p.id);
  const c = document.createElement('canvas'); c.width = LW; c.height = LH;
  const g = c.getContext('2d');
  const R = seeded(p.id+'surf');
  g.fillStyle = shade(mix(p.sky, p.ground, 0.55), 0.85); g.fillRect(0,0,LW,LH);
  // 지형 얼룩
  for (let i=0;i<420;i++){
    const x = R()*LW, y = R()*LH, w = 3+R()*18, h = 2+R()*8;
    g.fillStyle = R() > 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,230,190,.055)';
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  for (let i=0;i<900;i++){
    const x = Math.round(R()*LW), y = Math.round(R()*LH);
    g.fillStyle = R() > 0.5 ? 'rgba(0,0,0,.14)' : 'rgba(255,235,200,.06)';
    g.fillRect(x, y, 1, 1);
  }
  // 협곡·균열
  for (let i=0;i<7;i++){
    let x = R()*LW, y = R()*LH;
    g.fillStyle = 'rgba(0,0,0,.28)';
    for (let k=0;k<70;k++){
      x += (R()-0.5)*14; y += (R()-0.3)*9;
      g.fillRect(Math.round(x), Math.round(y), 3, 2);
    }
  }
  // 바위
  for (let i=0;i<90;i++){
    const x = Math.round(R()*LW), y = Math.round(R()*LH), w = 2+Math.round(R()*4);
    g.fillStyle = 'rgba(0,0,0,.30)'; g.fillRect(x, y+2, w+2, 2);
    g.fillStyle = 'rgba(255,235,200,.10)'; g.fillRect(x, y, w, 3);
  }
  surfaceCache.set(p.id, c);
  return c;
}
/* 후보지 위치: 행성마다 결정적으로 흩뿌린다 */
export const sitePosCache = new Map();
export function sitePos(p){
  if (sitePosCache.has(p.id)) return sitePosCache.get(p.id);
  const R = seeded(p.id+'pos'), pts = [];
  for (const s of p.sites){
    let x, y, tries = 0;
    do {
      x = 86 + R()*(LW-176); y = 74 + R()*(LH-186); tries++;
    } while (tries < 40 && pts.some(q => dist(q.x,q.y,x,y) < 92));
    pts.push({ id:s.id, x:Math.round(x), y:Math.round(y) });
  }
  sitePosCache.set(p.id, pts);
  return pts;
}
