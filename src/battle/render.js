import { FOE_SPRITE, blit } from '../art/sprites.js';
import { battleHud } from './hud.js';
import { ACX, ACY, AH, AW, Battle } from './state.js';
import { planetOf } from '../core/state.js';
import { OPT } from '../core/store.js';
import { clamp, dist, rnd } from '../core/util.js';
import { DATA } from '../data/index.js';
import { C, P } from '../ui/canvas.js';
import { MOUSE } from '../ui/widgets.js';

/* ═══ 19. 전투 렌더 ═════════════════════════════════════════════════ */
export function drawCore(c, isShip){
  const x = Math.round(c.x), y = Math.round(c.y);
  if (isShip){
    P.fillStyle = 'rgba(0,0,0,.4)'; P.fillRect(x-44, y+18, 88, 5);
    P.fillStyle = '#2b2f34'; P.fillRect(x-44, y+2, 88, 16);
    P.fillStyle = '#4a5057'; P.fillRect(x-38, y-12, 76, 15);
    P.fillStyle = '#6f7a80'; P.fillRect(x-26, y-20, 48, 9);
    P.fillStyle = '#8d97a0'; P.fillRect(x-13, y-28, 24, 9);
    P.fillStyle = '#1e2226'; P.fillRect(x-9, y-25, 6, 4); P.fillRect(x+1, y-25, 6, 4);
    P.fillStyle = '#c8a24a'; P.fillRect(x-38, y-3, 76, 3);
    P.fillStyle = '#a4432c'; P.fillRect(x-44, y+10, 88, 2);
    P.fillStyle = '#3a3f45'; P.fillRect(x+28, y-29, 8, 18);
    P.fillStyle = '#e6c56d'; P.fillRect(x-52, y+4, 8, 9); P.fillRect(x-52, y-9, 8, 9);
    if (Math.floor(Battle.time*2)%2===0){ P.fillStyle='#ff8f6b'; P.fillRect(x+40,y-16,3,3); P.fillRect(x-42,y-16,3,3); }
    if (Math.random()<0.3) Battle.parts.push({ x:x+32, y:y-31, vx:rnd(-5,5), vy:-rnd(8,18), life:rnd(0.5,1.0), color:'rgba(180,175,165,.45)' });
  } else {
    P.fillStyle = 'rgba(0,0,0,.35)'; P.fillRect(x-26, y+16, 52, 4);
    P.fillStyle = '#3a2f22'; P.fillRect(x-24, y-14, 48, 30);
    P.fillStyle = '#4a3a28'; P.fillRect(x-24, y-18, 48, 5);
    P.fillStyle = '#2a231a'; P.fillRect(x-24, y-18, 48, 2);
    P.fillStyle = '#c8a24a'; P.fillRect(x-11, y-25, 22, 8);
    P.fillStyle = '#e6c56d'; P.fillRect(x-7, y-28, 14, 4);
    P.fillStyle = '#1e1912'; P.fillRect(x-18, y-6, 9, 7); P.fillRect(x+9, y-6, 9, 7);
    P.fillStyle = '#6f7a45'; P.fillRect(x-6, y+2, 12, 14);
    P.fillStyle = '#8d97a0'; P.fillRect(x+15, y-32, 5, 12); P.fillRect(x-20, y-30, 4, 10);
    P.fillStyle = '#a4432c'; P.fillRect(x-24, y+10, 48, 2);
    if (Math.random()<0.35) Battle.parts.push({ x:x+17, y:y-34, vx:rnd(-6,6), vy:-rnd(10,22), life:rnd(0.6,1.2), color:'rgba(200,190,170,.5)' });
  }
}
export function drawBattle(dt){
  const B = Battle;
  const p = B.mode === 'ship' ? { ground:'#20242c', sky:'#0e1116' } : planetOf(B.siteId);
  P.save();
  if (B.shake > 0.2 && OPT.shake) P.translate(Math.round(rnd(-B.shake,B.shake)/2), Math.round(rnd(-B.shake,B.shake)/2));

  P.fillStyle = p.ground; P.fillRect(-8,-8,AW+16,AH+16);
  P.fillStyle = 'rgba(0,0,0,.18)'; P.beginPath(); P.arc(ACX,ACY,70,0,6.29); P.fill();
  P.strokeStyle = 'rgba(200,162,74,.18)'; P.lineWidth = 2;
  P.beginPath(); P.arc(ACX,ACY,70,0,6.29); P.stroke();
  for (const d of B.decor){
    if (d.t < 0.5){
      P.fillStyle = 'rgba(0,0,0,.26)'; P.fillRect(d.x, d.y+d.h, d.w*3, 2);
      P.fillStyle = 'rgba(255,238,200,.10)'; P.fillRect(d.x, d.y, d.w*3, d.h*2);
    } else if (d.t < 0.8){ P.fillStyle = 'rgba(0,0,0,.22)'; P.fillRect(d.x, d.y, d.w*2, d.h); }
    else { P.fillStyle = 'rgba(141,151,160,.30)'; P.fillRect(d.x, d.y, d.w*2, 2);
           P.fillStyle = 'rgba(164,67,44,.30)'; P.fillRect(d.x, d.y+2, d.w, 2); }
  }
  const vg = P.createRadialGradient(ACX,ACY,140,ACX,ACY,380);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.4)');
  P.fillStyle = vg; P.fillRect(0,0,AW,AH);

  if (B.phase === 'prep' || B.phase === 'inter'){
    P.strokeStyle = 'rgba(200,162,74,.32)'; P.setLineDash([3,4]); P.lineWidth = 1;
    P.beginPath(); P.arc(ACX,ACY,140,0,6.29); P.stroke(); P.setLineDash([]);
  }
  drawCore(B.core, B.mode === 'ship');

  for (const t of B.turrets){
    blit('turret','turret', t.x, t.y);
    P.strokeStyle = '#3a3128'; P.lineWidth = 2;
    P.beginPath(); P.moveTo(t.x,t.y); P.lineTo(t.x+Math.cos(t.aim)*11, t.y+Math.sin(t.aim)*11); P.stroke();
    if (t.muzzle > 0){ P.fillStyle = '#e6c56d'; P.fillRect(Math.round(t.x+Math.cos(t.aim)*12)-1, Math.round(t.y+Math.sin(t.aim)*12)-1, 3, 3); }
    const hr = clamp(t.hp/(t.max||DATA.turret.hp),0,1);
    if (hr < 1){ P.fillStyle='#181209'; P.fillRect(t.x-6,t.y-12,12,2); P.fillStyle='#7f9c4a'; P.fillRect(t.x-6,t.y-12,12*hr,2); }
  }
  if (B.placing){
    P.globalAlpha = 0.55; blit('turret','turret', MOUSE.x, MOUSE.y); P.globalAlpha = 1;
    const d = dist(MOUSE.x,MOUSE.y,ACX,ACY), okz = d < 140 && d > 30;
    P.strokeStyle = okz ? C.moss : C.bad; P.lineWidth = 1;
    P.strokeRect(Math.round(MOUSE.x)-8.5, Math.round(MOUSE.y)-8.5, 17, 17);
  }
  for (const e of B.enemies){
    blit(FOE_SPRITE[e.type], e.type, e.x, e.y, e.flash > 0);
    if (e.hp < e.max){
      const w = Math.max(10, e.r*2);
      P.fillStyle = '#181209'; P.fillRect(Math.round(e.x-w/2), Math.round(e.y-e.r-7), w, 2);
      P.fillStyle = e.def.boss ? '#c1452f' : '#a4432c';
      P.fillRect(Math.round(e.x-w/2), Math.round(e.y-e.r-7), Math.round(w*e.hp/e.max), 2);
    }
  }
  for (const u of B.units){
    if (u.down){ P.fillStyle = '#3a2a20'; P.fillRect(Math.round(u.x)-5, Math.round(u.y)+2, 11, 3); continue; }
    blit('trooper', u.pal || 'cmd', u.x, u.y, u.flash > 0);
    P.strokeStyle = '#2a231a'; P.lineWidth = 2;
    P.beginPath(); P.moveTo(u.x,u.y); P.lineTo(u.x+Math.cos(u.aim)*9, u.y+Math.sin(u.aim)*9); P.stroke();
    if (u.muzzle > 0){ P.fillStyle = '#ffd98a'; P.fillRect(Math.round(u.x+Math.cos(u.aim)*11)-1, Math.round(u.y+Math.sin(u.aim)*11)-1, 3, 3); }
    if (u.i === 0 && !B.auto){
      P.fillStyle = C.brassHi;
      P.fillRect(Math.round(u.x)-1, Math.round(u.y)-15, 2, 4);
      P.fillRect(Math.round(u.x)-3, Math.round(u.y)-12, 6, 1);
    }
  }
  if (B.flare){
    const fg = P.createRadialGradient(B.flare.x, B.flare.y, 4, B.flare.x, B.flare.y, 78);
    fg.addColorStop(0,'rgba(200,220,255,.25)'); fg.addColorStop(1,'rgba(160,190,255,0)');
    P.fillStyle = fg; P.beginPath(); P.arc(B.flare.x, B.flare.y, 78, 0, 6.29); P.fill();
  }
  P.fillStyle = '#ffe7a8'; for (const b of B.bullets) P.fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
  P.fillStyle = '#ff9a6b'; for (const b of B.eb) P.fillRect(Math.round(b.x), Math.round(b.y), 2, 2);
  for (const pt of B.parts){
    P.globalAlpha = clamp(pt.life*2, 0, 1);
    if (pt.ring){ P.strokeStyle = pt.color; P.lineWidth = 2; P.beginPath(); P.arc(pt.x,pt.y,pt.r,0,6.29); P.stroke(); }
    else { P.fillStyle = pt.color; P.fillRect(Math.round(pt.x), Math.round(pt.y), 2, 2); }
  }
  P.globalAlpha = 1;
  if (!B.auto && !B.units[0].down && !B.placing){
    P.strokeStyle = 'rgba(230,197,109,.7)'; P.lineWidth = 1;
    P.strokeRect(Math.round(MOUSE.x)-3.5, Math.round(MOUSE.y)-3.5, 7, 7);
    P.fillStyle = 'rgba(230,197,109,.7)';
    P.fillRect(Math.round(MOUSE.x)-6, Math.round(MOUSE.y), 2, 1); P.fillRect(Math.round(MOUSE.x)+5, Math.round(MOUSE.y), 2, 1);
  }
  P.restore();
  battleHud(dt);
}
