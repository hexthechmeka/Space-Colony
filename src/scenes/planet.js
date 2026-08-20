import { sitePos, surfaceMap } from '../art/surface.js';
import { App, openModal, setScene } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { canPay, gain, pay } from '../core/economy.js';
import { S, drillMul, graceMs, heldSites, planetDef, relayEff, saveGame, siteCap, siteDef, slotMax } from '../core/state.js';
import { toast } from '../core/store.js';
import { fmt, fmtDur, now } from '../core/util.js';
import { DATA } from '../data/index.js';
import { topBar } from './common.js';
import { openCrew } from './crew.js';
import { C, LH, LW, P, RES_COLOR } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { MOUSE, addHit, bar, button, inRect, panel, text } from '../ui/widgets.js';

/* ═══ 13. 행성 지표 ═════════════════════════════════════════════════ */
export function siteIcon(st){
  if (st.status === 'locked') return { ic:'lock', col:'#6b6152' };
  if (st.status === 'held')   return st.threatAt ? { ic:'skull', col:C.rustHi } : { ic:'flag', col:C.mossHi };
  return { ic:'pick', col:C.brass };
}
export function scenePlanet(dt){
  const p = planetDef(S.at);
  P.drawImage(surfaceMap(p), 0, 0);
  const vg = P.createRadialGradient(LW/2, LH/2, 120, LW/2, LH/2, 400);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)');
  P.fillStyle = vg; P.fillRect(0,0,LW,LH);

  const pts = sitePos(p);
  for (const pt of pts){
    const def = siteDef(pt.id), st = S.sites[pt.id], vis = siteIcon(st);
    const hov = inRect(MOUSE.x, MOUSE.y, pt.x-16, pt.y-16, 32, 32);
    const selected = App.sel === pt.id;
    // 착륙 표식
    P.strokeStyle = selected ? C.brassHi : (hov ? C.brass : 'rgba(200,162,74,.35)');
    P.setLineDash([3,3]); P.lineWidth = 1;
    P.beginPath(); P.arc(pt.x, pt.y, 15 + (selected?2:0), App.clock*(selected?0.8:0.25), App.clock*(selected?0.8:0.25)+6.28); P.stroke();
    P.setLineDash([]);
    P.fillStyle = 'rgba(0,0,0,.5)'; P.beginPath(); P.arc(pt.x, pt.y, 11, 0, 6.29); P.fill();
    if (st.status === 'held'){
      // 세워진 기지 도트
      P.fillStyle = '#3a2f22'; P.fillRect(pt.x-7, pt.y-4, 14, 9);
      P.fillStyle = '#4a3a28'; P.fillRect(pt.x-7, pt.y-6, 14, 2);
      P.fillStyle = C.brass;   P.fillRect(pt.x-3, pt.y-9, 6, 3);
      if (!st.threatAt && Math.random() < 0.06) P.fillRect(pt.x+4, pt.y-12, 1, 2);
    }
    const blink = st.threatAt ? (Math.sin(App.clock*6) > 0) : true;
    if (blink) icon(vis.ic, pt.x-7, pt.y-(st.status==='held'?22:7), 2, vis.col);
    text(def.name, pt.x, pt.y+18, { size:9, align:'center', color: st.status==='locked' ? C.fade : C.ink });
    text(st.status==='locked' ? '미탐사' : (st.threatAt ? '포위됨' : st.status==='held' ? '가동 중' : '위험도 '+def.risk),
         pt.x, pt.y+29, { size:8, align:'center', color: st.threatAt ? C.rustHi : st.status==='held' ? C.mossHi : C.dim });
    addHit(pt.x-16, pt.y-16, 32, 32, () => { App.sel = App.sel === pt.id ? null : pt.id; sfx('click'); }, false, 'site:'+pt.id);
  }

  // 선택 패널
  if (App.sel) sitePanel(siteDef(App.sel), S.sites[App.sel]);
  else {
    panel(LW/2-150, LH-30, 300, 22, { fill:'rgba(20,16,11,.8)' });
    text('후보지를 선택하세요', LW/2, LH-24, { size:9, align:'center', color:C.dim });
  }
  topBar(p.name + ' · ' + p.sub, 'starmap');
  button(LW-124, 2, 42, 16, '브리지', () => setScene('bridge'), { size:8 });
}

export function sitePanel(def, st){
  const w = 420, h = 76, x = LW/2 - w/2, y = LH - h - 6;
  panel(x, y, w, h, { fill:'rgba(22,17,11,.95)', edge:C.brass });
  text(def.name, x+12, y+8, { size:11, color:C.brassHi });
  text('위험도 ' + def.risk + ' · 방어 ' + def.waves + '웨이브 · 적 강도 ×' + DATA.tierMul[def.tier].toFixed(1),
       x+12, y+23, { size:8, color:C.dim });
  icon(def.res, x+12, y+38, 1);
  text((def.rate*drillMul()).toFixed(1) + ' /분', x+24, y+38, { size:9, color:RES_COLOR[def.res], mono:true });

  if (st.status === 'locked'){
    text('이전 후보지를 확보하면 좌표가 열립니다', x+12, y+56, { size:8, color:C.fade });
  } else if (st.status === 'open'){
    const ok = canPay(def.cost), slots = heldSites().length < slotMax();
    let cx = x+120;
    text('건설비', x+120, y+38, { size:8, color:C.dim });
    cx = x+160;
    for (const [k,v] of Object.entries(def.cost)){
      icon(k, cx, y+37, 1);
      text(fmt(v), cx+10, y+38, { size:9, color: (S.res[k]||0) >= v ? RES_COLOR[k] : C.rustHi, mono:true });
      cx += 54;
    }
    if (!slots) text('격납고 한도 초과 — 기존 기지를 철수하세요', x+12, y+56, { size:8, color:C.rustHi });
    else if (!ok) text('자원이 부족합니다', x+12, y+56, { size:8, color:C.rustHi });
    else text(st.lostOnce ? '이전에 상실한 지점입니다' : '강하 준비 완료', x+12, y+56, { size:8, color:C.fade });
    button(x+w-116, y+44, 104, 24, st.lostOnce ? '재개척 편성' : '개척 편성',
      () => { if (pay(def.cost)){ saveGame(); openCrew({ mode:'claim', siteId:def.id }); } },
      { primary:true, size:10, disabled: !ok || !slots });
  } else {
    if (st.threatAt){
      const left = graceMs() - (now() - st.threatAt);
      text('습격대와 교전 중 — 채굴 정지 · 남은 시간 ' + fmtDur(left), x+12, y+56, { size:8, color:C.rustHi });
      button(x+w-116, y+44, 104, 24, '방어 편성', () => openCrew({ mode:'defend', siteId:def.id }), { primary:true, size:10 });
    } else if (relayEff() > 0){
      text('자동 전송 가동 — 모선으로 직송 중 (효율 ' + Math.round(relayEff()*100) + '%)', x+12, y+56, { size:8, color:C.mossHi });
      button(x+w-116, y+44, 104, 24, '기지 철수', () => openModal({ type:'confirm', id:def.id }), { size:10 });
    } else {
      const cap = siteCap(def.id);
      text('저장고', x+120, y+38, { size:8, color:C.dim });
      bar(x+156, y+37, 120, 9, st.store/cap, C.moss);
      text(fmt(st.store) + ' / ' + fmt(cap), x+282, y+38, { size:8, color:C.dim, mono:true });
      text(st.store >= cap ? '저장고가 가득 차 채굴이 멈췄습니다' : '자동 전송을 연구하면 회수가 필요 없습니다',
           x+12, y+56, { size:8, color: st.store >= cap ? C.rustHi : C.fade });
      button(x+w-224, y+44, 100, 24, '자원 회수', () => {
        const amt = Math.floor(st.store);
        if (amt < 1) return;
        gain(def.res, amt); st.store -= amt; sfx('buy');
        toast(DATA.res[def.res].name + ' ' + fmt(amt) + ' 회수'); saveGame();
      }, { primary:st.store >= 1, size:10, disabled: st.store < 1 });
      button(x+w-116, y+44, 104, 24, '기지 철수', () => openModal({ type:'confirm', id:def.id }), { size:10 });
    }
  }
}
