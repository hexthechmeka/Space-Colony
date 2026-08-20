import { LH, LW, P } from '../ui/canvas.js';

/* ═══ 9. 우주 · 행성 아트 ═══════════════════════════════════════════ */
export function seeded(str){
  let s = 0; for (const ch of str) s = (s*31 + ch.charCodeAt(0)) % 2147483647;
  return () => (s = (s*1103515245 + 12345) % 2147483648) / 2147483648;
}
export const STARS = (() => {
  const R = seeded('starfield'), out = [];
  for (let i=0;i<170;i++) out.push({ x:R()*LW, y:R()*LH, z:R(), t:R()*6.28 });
  return out;
})();
export function drawSpace(t, driftX){
  P.fillStyle = '#0a0812'; P.fillRect(0,0,LW,LH);
  // 성운
  const neb = P.createRadialGradient(LW*0.72, LH*0.3, 10, LW*0.72, LH*0.3, 260);
  neb.addColorStop(0,'rgba(90,60,110,.22)'); neb.addColorStop(1,'rgba(20,14,30,0)');
  P.fillStyle = neb; P.fillRect(0,0,LW,LH);
  const neb2 = P.createRadialGradient(LW*0.18, LH*0.78, 8, LW*0.18, LH*0.78, 200);
  neb2.addColorStop(0,'rgba(120,70,40,.16)'); neb2.addColorStop(1,'rgba(20,14,30,0)');
  P.fillStyle = neb2; P.fillRect(0,0,LW,LH);
  for (const s of STARS){
    const x = ((s.x - (driftX||0)*(0.3+s.z)) % LW + LW) % LW;
    const tw = 0.55 + 0.45*Math.sin(t*1.6 + s.t);
    const c = s.z > 0.8 ? 255 : 200;
    P.fillStyle = 'rgba('+c+','+(c-10)+','+(c-40)+','+(0.25 + s.z*0.6*tw).toFixed(3)+')';
    P.fillRect(Math.round(x), Math.round(s.y), s.z > 0.85 ? 2 : 1, s.z > 0.85 ? 2 : 1);
  }
}
