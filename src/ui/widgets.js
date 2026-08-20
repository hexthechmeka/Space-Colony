import { clamp, fmt } from '../core/util.js';
import { C, LH, LW, P, RES_COLOR, U } from './canvas.js';
import { icon } from './icons.js';

/* ═══ 8. UI 툴킷 (즉시 모드) ════════════════════════════════════════ */
export let HITS = [], HOVER = null, PRESS = null, MOUSE = { x:0, y:0, down:false };
export function resetHits(){ HITS = []; }
export function addHit(x,y,w,h,onClick,dis,label){ HITS.push({x,y,w,h,onClick,dis,label}); }
export function inRect(mx,my,x,y,w,h){ return mx>=x && mx<x+w && my>=y && my<y+h; }
export function hitAt(mx,my){
  for (let i=HITS.length-1;i>=0;i--){ const b = HITS[i]; if (inRect(mx,my,b.x,b.y,b.w,b.h)) return b; }
  return null;
}

/** 리벳 박힌 금속 패널 */
export function panel(x,y,w,h,opt={}){
  x=Math.round(x); y=Math.round(y); w=Math.round(w); h=Math.round(h);
  if (opt.clear !== false) U.clearRect(x, y, w, h);      // 아래 깔린 글자를 지운다
  const fill = opt.fill || C.p2, edge = opt.edge || C.brassLo;
  P.fillStyle = 'rgba(0,0,0,.45)'; P.fillRect(x+2, y+3, w, h);
  P.fillStyle = fill; P.fillRect(x, y, w, h);
  if (!opt.flat){
    const g = P.createLinearGradient(0,y,0,y+h);
    g.addColorStop(0,'rgba(255,230,180,.07)'); g.addColorStop(1,'rgba(0,0,0,.22)');
    P.fillStyle = g; P.fillRect(x, y, w, h);
  }
  P.fillStyle = edge;
  P.fillRect(x, y, w, 1); P.fillRect(x, y+h-1, w, 1);
  P.fillRect(x, y, 1, h); P.fillRect(x+w-1, y, 1, h);
  // 모서리 리벳
  if (!opt.noRivet){
    P.fillStyle = opt.rivet || C.brass;
    for (const [rx,ry] of [[x+2,y+2],[x+w-4,y+2],[x+2,y+h-4],[x+w-4,y+h-4]]) P.fillRect(rx, ry, 2, 2);
  }
  if (opt.accent){ P.fillStyle = opt.accent; P.fillRect(x, y, w, 2); }
}
export function hline(x,y,w,col){ P.fillStyle = col||C.brassLo; P.fillRect(Math.round(x), Math.round(y), Math.round(w), 1); }
export function bar(x,y,w,h,ratio,col,bg){
  x=Math.round(x); y=Math.round(y); w=Math.round(w); h=Math.round(h);
  P.fillStyle = bg || '#120d08'; P.fillRect(x, y, w, h);
  P.fillStyle = col; P.fillRect(x+1, y+1, Math.max(0, Math.round((w-2)*clamp(ratio,0,1))), h-2);
  P.fillStyle = 'rgba(255,255,255,.14)'; P.fillRect(x+1, y+1, Math.max(0, Math.round((w-2)*clamp(ratio,0,1))), 1);
  P.strokeStyle = C.brassLo; P.lineWidth = 1; P.strokeRect(x+0.5, y+0.5, w-1, h-1);
}
/** 텍스트는 선명한 오버레이 레이어에 논리 좌표로 그린다 */
export function text(str, x, y, o={}){
  const size = o.size || 9;
  U.font = (o.weight || 600) + ' ' + size + 'px ' + (o.mono ? 'ui-monospace,monospace' : '"Pretendard","Apple SD Gothic Neo",system-ui,sans-serif');
  U.textAlign = o.align || 'left';
  U.textBaseline = o.baseline || 'top';
  if (o.shadow !== false){ U.fillStyle = o.shadowCol || 'rgba(0,0,0,.75)'; U.fillText(str, x+0.7, y+0.7); }
  U.fillStyle = o.color || C.ink;
  U.fillText(str, x, y);
}
export function textW(str, o={}){
  U.font = (o.weight || 600) + ' ' + (o.size||9) + 'px ' + (o.mono ? 'ui-monospace,monospace' : '"Pretendard","Apple SD Gothic Neo",system-ui,sans-serif');
  return U.measureText(str).width;
}

export function button(x,y,w,h,label,onClick,o={}){
  x=Math.round(x); y=Math.round(y); w=Math.round(w); h=Math.round(h);
  const dis = !!o.disabled;
  const hov = !dis && inRect(MOUSE.x,MOUSE.y,x,y,w,h);
  const prs = hov && MOUSE.down;
  const prim = o.primary && !dis;
  let fill = prim ? (hov ? '#8a6b28' : '#6f5520') : (hov ? C.p3 : C.p2);
  if (dis) fill = '#1c1710';
  panel(x, y + (prs?1:0), w, h, { fill, edge: dis ? '#2e2519' : (prim ? C.brassHi : (hov ? C.brass : C.brassLo)), noRivet:h<14 });
  const ty = y + (prs?1:0) + Math.round((h - (o.size||9))/2) - 1;
  let tx = x + w/2, align = 'center';
  if (o.icon){
    const iw = 7*(o.iscale||1);
    const total = iw + 4 + textW(label, o);
    const sx = x + Math.round((w-total)/2);
    icon(o.icon, sx, y + (prs?1:0) + Math.round((h-iw)/2), o.iscale||1, dis ? '#4a4034' : null);
    tx = sx + iw + 4; align = 'left';
  }
  text(label, tx, ty, { size:o.size||9, color: dis ? '#5c5245' : (prim ? '#1b1509' : (hov ? C.brassHi : C.ink)), align, weight:o.weight||700 });
  addHit(x, y, w, h, onClick, dis, o.label || label);
  return hov;
}
/** 자원 표시용 작은 칩 */
export function resChip(x, y, key, value, w){
  panel(x, y, w, 16, { fill:C.p1 });
  icon(key, x+3, y+4, 1);
  text(fmt(value), x+w-4, y+4, { size:9, align:'right', color:RES_COLOR[key], mono:true });
}
export function tooltipBox(x,y,lines,o={}){
  const wdt = Math.max(...lines.map(l => textW(l.t, {size:l.s||8}))) + 12;
  const hgt = lines.length*11 + 8;
  const px_ = clamp(x, 2, LW-wdt-2), py_ = clamp(y, 2, LH-hgt-2);
  panel(px_, py_, wdt, hgt, { fill:'#1d1811', edge:C.brass });
  lines.forEach((l,i) => text(l.t, px_+6, py_+5+i*11, { size:l.s||8, color:l.c||C.dim }));
}
