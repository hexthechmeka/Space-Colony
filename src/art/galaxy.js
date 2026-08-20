import { seeded } from './space.js';
import { DATA } from '../data/index.js';
import { P } from '../ui/canvas.js';

/* ── 은하(성간) 지도 배경 ───────────────────────────────────────── */
export const galaxyCache = new Map();
export function galaxyMap(w, h){
  const key = w+'x'+h;
  if (galaxyCache.has(key)) return galaxyCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const R = seeded('galaxy'), cx = w/2, cy = h/2;
  g.fillStyle = '#07060d'; g.fillRect(0,0,w,h);
  // 배경 별
  for (let i=0;i<Math.round(w*h/900);i++){
    const b = R();
    g.fillStyle = 'rgba(220,214,240,'+(0.10+b*0.35).toFixed(2)+')';
    g.fillRect(Math.round(R()*w), Math.round(R()*h), 1, 1);
  }
  // 은하 헤일로
  const halo = g.createRadialGradient(cx, cy, 4, cx, cy, w*0.5);
  halo.addColorStop(0,'rgba(160,130,200,.32)'); halo.addColorStop(0.45,'rgba(84,62,124,.14)'); halo.addColorStop(1,'rgba(16,12,26,0)');
  g.fillStyle = halo; g.beginPath(); g.ellipse(cx, cy, w*0.5, h*0.62, 0, 0, 6.29); g.fill();
  // 나선 팔
  const arms = DATA.galaxy.arms, spin = DATA.galaxy.spin;
  const pts = Math.round(w*1.7);
  for (let a=0; a<arms; a++){
    const off = a/arms * Math.PI*2;
    for (let i=0; i<pts; i++){
      const t = Math.pow(i/pts, 0.85);
      const rr = t * w*0.47;
      const ang = off + t*spin + (R()-0.5)*0.30;
      const sx = cx + Math.cos(ang)*rr;
      const sy = cy + Math.sin(ang)*rr*0.60;
      const br = 0.16 + (1-t)*0.55 + R()*0.28;
      if (R() > 0.90){
        g.fillStyle = 'rgba(240,228,255,'+Math.min(1,br+0.2).toFixed(2)+')';
        g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
        if (R() > 0.7) g.fillRect(Math.round(sx)+1, Math.round(sy), 1, 1);
      } else {
        g.fillStyle = R() > 0.55
          ? 'rgba(186,170,224,'+(br*0.55).toFixed(2)+')'
          : 'rgba(214,150,120,'+(br*0.42).toFixed(2)+')';
        g.fillRect(Math.round(sx), Math.round(sy), 1, 1);
      }
    }
  }
  // 암흑 성운 띠
  for (let i=0;i<Math.round(w*0.9);i++){
    const t = R();
    const ang = R()*6.29, rr = (0.18 + t*0.3) * w;
    g.fillStyle = 'rgba(10,7,16,.5)';
    g.fillRect(Math.round(cx+Math.cos(ang)*rr), Math.round(cy+Math.sin(ang)*rr*0.6), 2+Math.round(R()*3), 1);
  }
  // 은하핵
  const core = g.createRadialGradient(cx, cy, 1, cx, cy, w*0.15);
  core.addColorStop(0,'rgba(255,244,214,.8)'); core.addColorStop(0.4,'rgba(242,192,124,.3)'); core.addColorStop(1,'rgba(200,140,80,0)');
  g.fillStyle = core; g.beginPath(); g.ellipse(cx, cy, w*0.16, h*0.13, 0, 0, 6.29); g.fill();
  galaxyCache.set(key, c);
  return c;
}
/** 성계 노드(작은 별) */
export function drawStarNode(x, y, size, col, bright){
  P.fillStyle = col;
  P.fillRect(Math.round(x-size/2), Math.round(y-size/2), size, size);
  if (bright){
    P.fillStyle = 'rgba(255,244,214,.9)';
    P.fillRect(Math.round(x)-1, Math.round(y-size), 2, size*2+1);
    P.fillRect(Math.round(x-size), Math.round(y)-1, size*2+1, 2);
    const g2 = P.createRadialGradient(x, y, 1, x, y, size*4);
    g2.addColorStop(0,'rgba(255,230,170,.5)'); g2.addColorStop(1,'rgba(255,200,120,0)');
    P.fillStyle = g2; P.beginPath(); P.arc(x, y, size*4, 0, 6.29); P.fill();
  }
}
