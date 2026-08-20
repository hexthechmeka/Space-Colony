import { seeded } from './space.js';
import { clamp, lerp } from '../core/util.js';

export const planetCache = new Map();
export function planetSprite(p, d){
  const key = p.id+'|'+d;
  if (planetCache.has(key)) return planetCache.get(key);
  const c = document.createElement('canvas'); c.width = d; c.height = d;
  const g = c.getContext('2d');
  const R = seeded(p.id), r = d/2;
  const base = p.ground, sky = p.sky;
  // 위도별 띠 색 (같은 행성은 항상 같은 무늬)
  const bands = [];
  for (let i=0;i<d;i++) bands.push(0.78 + 0.3*Math.sin(i*0.42 + R()*0.8) + R()*0.12);
  const LX = -0.46, LY = -0.55, LZ = 0.70;
  for (let y=0;y<d;y++) for (let x=0;x<d;x++){
    const nx = (x-r+0.5)/r, ny = (y-r+0.5)/r;
    const q = nx*nx + ny*ny;
    if (q > 1) continue;
    const nz = Math.sqrt(1-q);
    let lam = nx*LX + ny*LY + nz*LZ;
    lam = clamp(lam, 0, 1);
    const lit = 0.12 + 0.98*Math.pow(lam, 0.85);       // 램버트 + 약한 앰비언트
    const col = mix(sky, base, clamp(bands[y]*0.75 + 0.2, 0, 1));
    // 가장자리 대기 산란
    const rim = Math.pow(1-nz, 3) * 0.5;
    g.fillStyle = shade(col, clamp(lit + rim, 0.06, 1.45));
    g.fillRect(x, y, 1, 1);
  }
  // 밝은 쪽 테두리 광
  g.globalCompositeOperation = 'source-atop';
  const rim = g.createRadialGradient(r*0.62, r*0.56, r*0.15, r*0.62, r*0.56, r*1.25);
  rim.addColorStop(0,'rgba(255,244,220,.12)'); rim.addColorStop(0.6,'rgba(0,0,0,0)'); rim.addColorStop(1,'rgba(0,0,0,.35)');
  g.fillStyle = rim; g.fillRect(0,0,d,d);
  g.globalCompositeOperation = 'source-over';
  planetCache.set(key, c);
  return c;
}
export function hex(c){ return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)]; }
export function mix(a,b,t){
  const A = hex(a), B = hex(b);
  return 'rgb('+Math.round(lerp(A[0],B[0],t))+','+Math.round(lerp(A[1],B[1],t))+','+Math.round(lerp(A[2],B[2],t))+')';
}
export function shade(rgb, f){
  const m = rgb.match(/\d+/g).map(n => clamp(Math.round(n*f), 0, 255));
  return 'rgb('+m[0]+','+m[1]+','+m[2]+')';
}
