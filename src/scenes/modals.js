import { Battle } from '../battle/state.js';
import { App, closeModal, openModal, setScene } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { gain } from '../core/economy.js';
import { S, freshState, saveGame, setS, siteDef } from '../core/state.js';
import { DEFAULT_OPT, KEY, OPT, Store, saveOpt, setOpt, toast } from '../core/store.js';
import { clamp, fmt, fmtDur } from '../core/util.js';
import { DATA } from '../data/index.js';
import { C, LH, LW, P, U } from '../ui/canvas.js';
import { MOUSE, addHit, bar, button, hline, panel, resetHits, text } from '../ui/widgets.js';

/* ═══ 15. 모달 ══════════════════════════════════════════════════════ */
export function drawModal(){
  resetHits();                       // 모달 아래 요소는 클릭 불가
  P.fillStyle = 'rgba(8,6,10,.86)'; P.fillRect(0,0,LW,LH);
  U.clearRect(0, 0, LW, LH);
  const m = App.modal;
  if (m.type === 'help') return modalHelp();
  if (m.type === 'opt') return modalOpt();
  if (m.type === 'confirm') return modalConfirm(m);
  if (m.type === 'result') return modalResult(m);
  if (m.type === 'report') return modalReport(m);
  if (m.type === 'pause') return modalPause();
}
export function modalFrame(w,h,title){
  const x = LW/2-w/2, y = LH/2-h/2;
  panel(x, y, w, h, { fill:'#1b160f', edge:C.brass });
  P.fillStyle = C.brass; P.fillRect(Math.round(x), Math.round(y), Math.round(w), 2);
  text(title, LW/2, y+10, { size:12, align:'center', color:C.brassHi });
  return { x, y };
}
export function kvLine(x, y, w, k, v, col){
  hline(x, y+13, w, 'rgba(107,82,39,.5)');
  text(k, x, y, { size:9, color:C.dim });
  text(v, x+w, y, { size:9, align:'right', color:col||C.ink });
}
export function resLine(obj){
  return Object.entries(obj||{}).filter(([,v]) => v > 0)
    .map(([k,v]) => DATA.res[k].icon + ' ' + fmt(v)).join('   ');
}
export function modalHelp(){
  const { x, y } = modalFrame(400, 226, '작전 요령');
  const rows = [
    ['1. 항행', '도표에서 행성을 골라 이동'],
    ['2. 강하', '지표의 후보지를 선택해 개척'],
    ['3. 건설', '준비 시간에 자동 포탑 배치'],
    ['4. 방어', '지정 웨이브를 버티면 확보'],
    ['5. 회수', '확보 후 시간당 자원 축적 (접속 종료 중에도)'],
    ['6. 위협', '포위되면 채굴 정지 — 방치하면 상실'],
  ];
  rows.forEach((r,i) => kvLine(x+24, y+34+i*22, 352, r[0], r[1]));
  text('WASD 이동 · 마우스 조준 · 좌클릭 사격 · Space 궤도 포격', LW/2, y+172, { size:8, align:'center', color:C.fade });
  text('T 자동 전투(4인 전원 AI) · Esc 일시정지', LW/2, y+184, { size:8, align:'center', color:C.fade });
  button(LW/2-50, y+196, 100, 20, '알겠다', () => { closeModal(); S.seenHelp = true; }, { primary:true, size:10 });
}
export function modalOpt(){
  const { x, y } = modalFrame(340, 216, '설정');
  const rows = [
    ['효과음', 'sfx'], ['화면 흔들림', 'shake'], ['주사선 필터', 'scan'], ['자동 전투 기본값', 'autoDefault'],
  ];
  rows.forEach((r,i) => {
    const ry = y+34+i*24;
    text(r[0], x+24, ry+3, { size:9, color:C.dim });
    const on = OPT[r[1]];
    button(x+236, ry, 60, 18, on ? '켬' : '끔', () => {
      OPT[r[1]] = !OPT[r[1]]; saveOpt();
      document.getElementById('scan').style.display = OPT.scan ? '' : 'none';
    }, { primary:on, size:9 });
  });
  const vy = y+34+4*24;
  text('음량', x+24, vy+3, { size:9, color:C.dim });
  bar(x+140, vy+4, 156, 10, OPT.vol/100, C.brass);
  addHit(x+140, vy, 156, 18, () => {
    OPT.vol = Math.round(clamp((MOUSE.x - (x+140))/156, 0, 1)*100); saveOpt(); sfx('buy');
  }, false, 'vol');
  text(OPT.vol+'%', x+300, vy+3, { size:8, color:C.fade, mono:true });
  text(Store.available ? '진행 상황은 이 브라우저에 자동 저장됩니다'
                       : '저장소가 차단되어 새로고침 시 기록이 사라집니다',
       LW/2, y+148, { size:8, align:'center', color: Store.available ? C.fade : C.rustHi });
  button(x+24, y+168, 130, 22, '기록 전체 삭제', () => openModal({ type:'confirm', wipe:true }), { size:9 });
  button(x+186, y+168, 130, 22, '닫기', () => closeModal(), { primary:true, size:10 });
}
export function modalConfirm(m){
  const { x, y } = modalFrame(320, 130, m.wipe ? '기록 삭제' : '기지 철수');
  const def = m.id ? siteDef(m.id) : null;
  text(m.wipe ? '모든 진행 기록이 사라집니다. 계속할까요?'
              : def.name + ' 전초기지를 철수합니다.',
       LW/2, y+40, { size:9, align:'center', color:C.ink });
  if (!m.wipe) text('건설비의 ' + Math.round(DATA.meta.abandonRefund*100) + '%를 회수합니다.',
       LW/2, y+56, { size:8, align:'center', color:C.dim });
  button(x+24, y+88, 128, 24, '취소', () => closeModal(), { size:10 });
  button(x+168, y+88, 128, 24, m.wipe ? '삭제' : '철수', () => {
    if (m.wipe){
      Store.del(KEY.save); Store.del(KEY.opt);
      setOpt(structuredClone(DEFAULT_OPT)); setS(freshState()); saveGame();
      closeModal(); setScene('bridge'); toast('기록을 삭제했습니다');
    } else {
      const d = siteDef(m.id);
      for (const k in d.cost) gain(k, Math.floor(d.cost[k]*DATA.meta.abandonRefund));
      S.sites[m.id].status = 'open'; S.sites[m.id].store = 0; S.sites[m.id].threatAt = 0;
      saveGame(); closeModal(); App.sel = null; toast(d.name + ' 철수 완료');
    }
  }, { primary:true, size:10 });
}
export function modalResult(m){
  const r = m.rep;
  const { x, y } = modalFrame(380, 250, r.won ? '작전 성공' : '작전 실패');
  text(r.lead, LW/2, y+30, { size:9, align:'center', color: r.won ? C.mossHi : C.rustHi });
  let ly = y+52;
  kvLine(x+30, ly, 320, '처치', String(r.kills)); ly += 24;
  if (resLine(r.drops)){ kvLine(x+30, ly, 320, '전리품', resLine(r.drops), C.brassHi); ly += 24; }
  if (resLine(r.bonus)){ kvLine(x+30, ly, 320, '작전 보상', resLine(r.bonus), C.brassHi); ly += 24; }
  if (resLine(r.loss)){ kvLine(x+30, ly, 320, '손실', resLine(r.loss), C.rustHi); ly += 24; }
  if (r.unlocked){ kvLine(x+30, ly, 320, '새 좌표 확보', r.unlocked, C.mossHi); ly += 24; }
  if (r.injured && r.injured.length){ kvLine(x+30, ly, 320, '부상', r.injured.join(', '), C.rustHi); ly += 24; }
  if (r.dead && r.dead.length){ kvLine(x+30, ly, 320, '전사', r.dead.join(', '), C.bad); ly += 24; }
  if (r.draft && r.draft.length){ kvLine(x+30, ly, 320, '긴급 충원', r.draft.join(', '), C.mossHi); ly += 24; }
  button(LW/2-60, y+214, 120, 24, '귀환', () => closeModal(), { primary:true, size:10 });
}
export function modalReport(m){
  const r = m.rep;
  const { x, y } = modalFrame(400, 210, '귀환 보고');
  text(fmtDur(r.rawMs) + ' 만에 복귀했습니다' + (r.capped ? ' (정산 상한 '+DATA.meta.offlineCapH+'시간)' : ''),
       LW/2, y+30, { size:9, align:'center', color:C.dim });
  const direct = {}, stored = {};
  for (const k in r.gained){ if (k.startsWith('_store_')) stored[k.slice(7)] = r.gained[k]; else direct[k] = r.gained[k]; }
  let ly = y+52;
  if (resLine(direct)){ kvLine(x+30, ly, 340, '자동 전송 수령', resLine(direct), C.brassHi); ly += 24; }
  if (resLine(stored)){ kvLine(x+30, ly, 340, '저장고 적재', resLine(stored), C.ink); ly += 24; }
  if (r.threats.length){ kvLine(x+30, ly, 340, '포위 (채굴 정지)', r.threats.join(', '), C.rustHi); ly += 24; }
  if (r.healed && r.healed.length){ kvLine(x+30, ly, 340, '복귀', r.healed.join(', '), C.mossHi); ly += 24; }
  if (r.lost.length){ kvLine(x+30, ly, 340, '상실', r.lost.join(', '), C.rustHi); ly += 24; }
  if (r.shipRaid && resLine(r.shipRaid)){ kvLine(x+30, ly, 340, '모선 피탈', resLine(r.shipRaid), C.rustHi); ly += 24; }
  if (ly === y+52) kvLine(x+30, ly, 340, '변동 없음', '—');
  button(LW/2-60, y+172, 120, 24, '확인', () => closeModal(), { primary:true, size:10 });
}
export function modalPause(){
  const { x, y } = modalFrame(300, 150, '작전 일시 중지');
  text('철수하면 이번 작전의 진행은 사라집니다', LW/2, y+34, { size:9, align:'center', color:C.dim });
  button(x+40, y+58, 220, 24, '계속', () => { closeModal(); Battle.paused = false; }, { primary:true, size:10 });
  button(x+40, y+90, 220, 24, '철수하고 브리지로', () => {
    closeModal(); Battle.paused = false; Battle.active = false;
    setScene('bridge'); toast('작전을 중단하고 귀환했습니다');
  }, { size:10 });
}
