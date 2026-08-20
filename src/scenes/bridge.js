import { planetSprite } from '../art/planets.js';
import { drawMotherShip } from '../art/ship.js';
import { drawSpace } from '../art/space.js';
import { App, openModal, setScene } from '../core/app.js';
import { S, crewCap, crewCount, graceMs, heldSites, planetDef, shipMaxHp, siteDef, slotMax } from '../core/state.js';
import { clamp, fmtDur, now } from '../core/util.js';
import { topBar } from './common.js';
import { openCrew } from './crew.js';
import { C, LH, LW, P } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { button, hline, panel, text } from '../ui/widgets.js';

/* ═══ 11. 브리지 ════════════════════════════════════════════════════ */
export function sceneBridge(dt){
  drawSpace(App.clock, App.clock*6);
  const p = planetDef(S.at);
  // 정박 중인 행성
  const d = 240, sp = planetSprite(p, d);
  const px_ = LW-118, py_ = LH-104;
  const halo = P.createRadialGradient(px_+d/2, py_+d/2, d/2-6, px_+d/2, py_+d/2, d/2+18);
  halo.addColorStop(0,'rgba(190,150,100,.16)'); halo.addColorStop(1,'rgba(190,150,100,0)');
  P.fillStyle = halo; P.beginPath(); P.arc(px_+d/2, py_+d/2, d/2+18, 0, 6.29); P.fill();
  P.drawImage(sp, px_, py_);

  drawMotherShip(348, 158, App.clock, 1);

  // 좌측 정보
  panel(10, 28, 160, 70, { fill:'rgba(20,16,11,.86)' });
  text('개척 전함 〈페리그린〉', 18, 34, { size:9, color:C.brassHi });
  text('정박 : ' + p.name, 18, 47, { size:8, color:C.dim });
  text('선체 상태 ' + Math.round(clamp((S.ship.hp||0)/shipMaxHp(),0,1)*100) + '%', 18, 58, { size:8, color:C.dim });
  text('운영 기지 ' + heldSites().length + ' / ' + slotMax(), 18, 69, { size:8, color:C.dim });
  const inj = S.crew.filter(c => c.status === 'injured').length;
  text('승무원 ' + crewCount() + ' / ' + crewCap() + (inj ? ' · 부상 ' + inj + '명' : ''), 18, 80, { size:8, color: inj ? C.rustHi : C.dim });

  // 경보
  const sieged = heldSites().filter(id => S.sites[id].threatAt);
  let ay = 106;
  if (S.pendingShipRaid){
    const blink = Math.sin(App.clock*6) > 0;
    panel(10, ay, 190, 34, { fill: blink ? '#3a1712' : '#2a1310', edge:C.rust });
    icon('skull', 16, ay+10, 2);
    text('모선 요격 경보', 36, ay+6, { size:9, color:C.rustHi });
    button(120, ay+6, 72, 20, '요격 대응', () => openCrew({ mode:'ship', siteId:null }), { primary:true, size:8 });
    ay += 40;
  }
  for (const id of sieged.slice(0,3)){
    const def = siteDef(id), left = graceMs() - (now() - S.sites[id].threatAt);
    panel(10, ay, 190, 32, { fill:'#2a1a12', edge:C.rust });
    icon('skull', 16, ay+9, 2);
    text(def.name + ' 포위', 36, ay+5, { size:9, color:C.rustHi });
    text('남은 ' + fmtDur(left), 36, ay+17, { size:8, color:C.dim });
    button(126, ay+7, 60, 18, '방어 편성', () => openCrew({ mode:'defend', siteId:id }), { primary:true, size:8 });
    ay += 38;
  }

  // 하단 명령 바
  panel(0, LH-40, LW, 40, { fill:'#161009', noRivet:true });
  hline(0, LH-40, LW, C.brass);
  const bw = 118, gap = 8, total = bw*5 + gap*4, bx = (LW-total)/2;
  button(bx, LH-31, bw, 22, '항행 도표', () => setScene('starmap'), { icon:'warp', size:10 });
  button(bx+(bw+gap), LH-31, bw, 22, p.name + ' 지표', () => { App.sel = null; setScene('planet'); }, { icon:'flag', size:10 });
  button(bx+(bw+gap)*2, LH-31, bw, 22, '승무원', () => openCrew(null), { icon:'crew', size:10 });
  button(bx+(bw+gap)*3, LH-31, bw, 22, '함선 개조', () => setScene('tech'), { icon:'gear', size:10 });
  button(bx+(bw+gap)*4, LH-31, bw, 22, '작전 요령', () => openModal({ type:'help' }), { icon:'scan', size:10 });

  topBar('브리지');
}
