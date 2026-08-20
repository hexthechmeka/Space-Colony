import { drawStarNode, galaxyMap } from '../art/galaxy.js';
import { App } from '../core/app.js';
import { T } from '../core/state.js';
import { toast } from '../core/store.js';
import { DATA } from '../data/index.js';
import { topBar } from './common.js';
import { enterSystemMap } from './starmap.js';
import { C, LH, LW, P } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { MOUSE, addHit, button, inRect, panel, text, tooltipBox } from '../ui/widgets.js';

/* ═══ 12-b. 성간 지도 (전체 화면) ═══════════════════════════════════ */
export const GAL_PAD = { l:70, r:70, t:52, b:64 };
export function galaxyNodePos(sys){
  return {
    x: GAL_PAD.l + sys.x * (LW - GAL_PAD.l - GAL_PAD.r),
    y: GAL_PAD.t + sys.y * (LH - GAL_PAD.t - GAL_PAD.b),
  };
}
export function sceneGalaxy(dt){
  const a = App.mapFade;
  P.drawImage(galaxyMap(LW, LH), 0, 0);
  P.globalAlpha = 1 - a; P.fillStyle = '#07060d'; P.fillRect(0,0,LW,LH); P.globalAlpha = 1;

  const warp = T('ship','warp');
  let hovered = null;
  for (const sys of DATA.galaxy.systems){
    const pos = galaxyNodePos(sys);
    const hov = inRect(MOUSE.x, MOUSE.y, pos.x-22, pos.y-16, 44, 40);
    if (hov) hovered = { sys, pos };
    const reach = sys.current || warp >= (sys.warp || 99);
    if (sys.current){
      const pulse = 8 + Math.sin(App.clock*2.4)*2;
      P.strokeStyle = 'rgba(230,197,109,.85)'; P.lineWidth = 1;
      P.setLineDash([3,3]);
      P.beginPath(); P.arc(pos.x, pos.y, pulse+5, App.clock*0.5, App.clock*0.5+6.28); P.stroke();
      P.setLineDash([]);
      drawStarNode(pos.x, pos.y, 5, '#fff2cf', true);
    } else {
      drawStarNode(pos.x, pos.y, reach ? 4 : 3, reach ? '#e6c56d' : '#9b93b8', false);
      if (!reach){
        P.fillStyle = 'rgba(10,8,14,.75)'; P.fillRect(pos.x-5, pos.y+7, 11, 10);
        icon('lock', pos.x-4, pos.y+8, 1, '#7f7590');
      }
    }
    if (hov){
      P.strokeStyle = C.brassHi; P.lineWidth = 1;
      P.strokeRect(Math.round(pos.x-22)+0.5, Math.round(pos.y-16)+0.5, 44, 40);
    }
    text(sys.name, pos.x, pos.y - 22, {
      size: sys.current ? 10 : 9, align:'center',
      color: sys.current ? C.brassHi : (reach ? C.ink : 'rgba(155,147,184,.9)'),
    });
    if (sys.current) text('작전 중', pos.x, pos.y + 20, { size:8, align:'center', color:C.mossHi });
    else if (!reach) text(sys.note || '미탐사', pos.x, pos.y + 20, { size:8, align:'center', color:'rgba(164,67,44,.95)' });

    addHit(pos.x-22, pos.y-16, 44, 40, () => {
      if (sys.current){ enterSystemMap(); return; }
      if (reach){ toast(sys.name + ' — 성계 간 항행은 준비 중입니다'); return; }
      toast(sys.name + ' — ' + (sys.note || '좌표 미확보') + ' 필요', 'bad');
    }, false, 'sys:'+sys.id);
  }

  // 현재 성계로 이어지는 항로 표시
  const cur = DATA.galaxy.systems.find(x => x.current);
  if (cur){
    const cp = galaxyNodePos(cur);
    P.strokeStyle = 'rgba(230,197,109,.18)'; P.setLineDash([2,5]); P.lineWidth = 1;
    for (const sys of DATA.galaxy.systems){
      if (sys.current) continue;
      const p2 = galaxyNodePos(sys);
      P.beginPath(); P.moveTo(cp.x, cp.y); P.lineTo(p2.x, p2.y); P.stroke();
    }
    P.setLineDash([]);
  }

  if (hovered){
    const sys = hovered.sys;
    tooltipBox(hovered.pos.x + 26, hovered.pos.y - 10, [
      { t:sys.name, s:9, c:C.ink },
      { t: sys.current ? '현재 작전 성계 · 클릭하면 진입' : (sys.note || '미탐사 구역'),
        s:8, c: sys.current ? C.mossHi : C.rustHi },
    ]);
  }

  // 헤더 / 하단 바
  text('성간 지도 · ' + DATA.galaxy.region, LW/2, 26, { size:11, align:'center', color:C.brassHi });
  text('확보한 성계 ' + DATA.galaxy.systems.filter(x=>x.current).length + ' / ' + DATA.galaxy.systems.length,
       LW/2, 40, { size:8, align:'center', color:C.fade });

  panel(6, LH-30, 150, 24, { fill:'rgba(12,9,14,.82)', edge:C.brassLo, noRivet:true });
  button(10, LH-27, 142, 18, '성계 지도로 돌아가기', () => enterSystemMap(), { size:9, icon:'warp', label:'back-system' });
  panel(LW-236, LH-26, 230, 20, { fill:'rgba(12,9,14,.72)', noRivet:true });
  text('휠 확대 또는 성계 선택으로 진입', LW-228, LH-21, { size:8, color:C.fade });

  topBar(null, 'bridge');
}
