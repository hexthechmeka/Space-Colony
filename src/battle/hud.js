import { blit } from '../art/sprites.js';
import { Battle, opCd } from './state.js';
import { openModal } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { S, opById, siteDef } from '../core/state.js';
import { clamp } from '../core/util.js';
import { DATA } from '../data/index.js';
import { C, LH, LW } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { bar, button, hline, panel, text } from '../ui/widgets.js';

/* ── 전투 HUD ───────────────────────────────────────────────────── */
export function battleHud(dt){
  const B = Battle;
  // 상단
  panel(0, 0, LW, 22, { fill:'rgba(18,13,8,.94)', noRivet:true });
  hline(0, 22, LW, C.brassLo);
  const title = B.mode === 'ship' ? '모선 요격 대응' : siteDef(B.siteId).name + (B.mode === 'defend' ? ' · 방어전' : ' · 개척전');
  text(title, 8, 6, { size:10, color:C.brassHi });
  const phaseTxt = B.phase === 'prep' ? '건설 준비 ' + Math.ceil(B.prepLeft) + '초'
    : B.phase === 'inter' ? '재정비 ' + Math.ceil(B.interLeft) + '초' : '교전 중';
  text(phaseTxt, 190, 6, { size:9, color: B.phase === 'wave' ? C.rustHi : C.ink });
  text('웨이브 ' + Math.min(B.waveIdx+1, B.waveDefs.length) + '/' + B.waveDefs.length, 280, 6, { size:9, color:C.dim, mono:true });
  const cr = clamp(B.core.hp/B.core.max, 0, 1);
  text(B.mode === 'ship' ? '모선' : '거점', 360, 6, { size:9, color:C.dim });
  bar(392, 6, 90, 10, cr, cr < 0.35 ? C.bad : C.ok);
  text(Math.ceil(B.core.hp), 486, 6, { size:9, color:C.ink, mono:true });
  const left = B.enemies.length + B.queue.length;
  icon('skull', 524, 6, 1, left ? C.rustHi : C.fade);
  text(String(left), 536, 6, { size:9, color: left ? C.rustHi : C.fade, mono:true });
  button(LW-52, 3, 48, 16, '철수', () => { B.paused = true; openModal({ type:'pause' }); }, { size:8 });

  // 하단 분대 바
  panel(0, LH-40, LW, 40, { fill:'rgba(18,13,8,.94)', noRivet:true });
  hline(0, LH-40, LW, C.brass);
  B.units.forEach((u,i) => {
    const x = 6 + i*104, y = LH-36;
    panel(x, y, 98, 32, { fill: u.down ? '#241512' : (u.i===0 ? '#2a2216' : C.p2), edge: u.i===0 ? C.brass : C.brassLo });
    blit('trooper', u.pal || 'cmd', x+12, y+16);
    text(u.def.name, x+24, y+4, { size:8, color: u.down ? C.rustHi : C.ink });
    text(u.down ? '전투 불능' : u.w.name, x+24, y+14, { size:8, color:C.fade });
    bar(x+24, y+24, 68, 5, u.hp/u.max, u.down ? C.bad : C.ok);
  });
  // 우측 조작
  const bx = 6 + 4*104 + 8;
  button(bx, LH-36, 86, 15, B.auto ? '자동 전투 켬' : '자동 전투 끔', () => { B.auto = !B.auto; sfx('click'); },
    { size:8, primary:B.auto });
  const canBuild = B.turretLeft > 0 && (B.phase === 'prep' || B.phase === 'inter');
  button(bx, LH-19, 86, 15, B.placing ? '배치 취소' : '포탑 배치 ' + B.turretLeft, () => { B.placing = !B.placing; sfx('click'); },
    { size:8, disabled: !canBuild, primary:B.placing });
  const rx = bx + 92, rw_ = LW - 6 - rx;
  if (B.phase === 'prep' || B.phase === 'inter'){
    button(rx, LH-36, rw_, 32, B.phase === 'inter' ? '즉시 소집 (Space)' : '즉시 개시 (Space)',
      () => { if (B.phase==='prep') B.prepLeft = 0; else B.interLeft = 0; }, { primary:true, size:10 });
  } else {
    const op = opById(S.operator), od = op ? DATA.operators[op.type] : null;
    panel(rx, LH-36, rw_, 32, { fill:C.p1 });
    text(od ? (B.orbCd > 0 ? od.ability + ' 재장전 ' + B.orbCd.toFixed(1) + '초' : od.ability + ' 준비 · Space') : '오퍼레이터 없음',
      rx + rw_/2, LH-31, { size:8, align:'center', color: od && B.orbCd <= 0 ? C.brassHi : C.fade });
    if (od) bar(rx+10, LH-19, rw_-20, 10, B.orbCd > 0 ? 1 - B.orbCd/opCd(od) : 1, C.brass);
    else text('편성에서 관제를 배치하세요', rx + rw_/2, LH-18, { size:7, align:'center', color:C.fade });
  }
}
