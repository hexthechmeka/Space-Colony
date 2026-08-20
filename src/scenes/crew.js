import { portrait } from '../art/portrait.js';
import { drawSpace } from '../art/space.js';
import { startBattle } from '../battle/state.js';
import { App } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { canPay, pay } from '../core/economy.js';
import { PN, S, T, clsOf, crewById, crewCap, crewCount, crewMaxHp, fillSquad, gearUnlocked, makeCrew, makeOp, opById, saveGame, siteDef, squadList, weaponUnlocked } from '../core/state.js';
import { toast } from '../core/store.js';
import { clamp, fmt, fmtDur, now } from '../core/util.js';
import { DATA } from '../data/index.js';
import { topBar } from './common.js';
import { C, LH, LW, P, RES_COLOR } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { addHit, button, hline, panel, text, textW } from '../ui/widgets.js';

/* ═══ 12-d. 승무원 · 출격 편성 ══════════════════════════════════════ */

export function openCrew(pending){
  App.pending = pending || null;
  fillSquad();
  App.selc = App.selc && (crewById(App.selc) || opById(App.selc)) ? App.selc : (S.squad[0] || (S.crew[0] && S.crew[0].id));
  App.rosterTop = 0;
  App.scene = 'crew';
  sfx('click');
}
export const rosterAll = () => [...S.crew, ...S.ops];
export const isOpId = id => !!opById(id);

export function sceneCrew(dt){
  P.fillStyle = '#151016'; P.fillRect(0,0,LW,LH);
  drawSpace(App.clock*0.1, 0);
  P.fillStyle = 'rgba(14,10,14,.78)'; P.fillRect(0,0,LW,LH);

  drawRoster();
  drawSquadSlots();
  drawLoadout();
  drawCrewFooter();
  topBar(App.pending ? '출격 편성' : '승무원 명부', App.pending ? null : 'bridge');
}

/* ── 좌측 명부 ──────────────────────────────────────────────────── */
export function drawRoster(){
  const x = 6, y = 26, w = 204, h = LH - 62;
  panel(x, y, w, h, { fill:'rgba(20,16,11,.9)' });
  text('명부', x+8, y+6, { size:9, color:C.brassHi });
  text(crewCount() + ' / ' + crewCap() + '명', x+w-8, y+6, { size:8, align:'right',
       color: crewCount() >= crewCap() ? C.rustHi : C.fade, mono:true });
  hline(x+6, y+18, w-12);

  const list = rosterAll();
  const rowH = 30, view = Math.floor((h - 26)/rowH);
  App.rosterTop = clamp(App.rosterTop, 0, Math.max(0, list.length - view));
  const shown = list.slice(App.rosterTop, App.rosterTop + view);

  shown.forEach((c, i) => {
    const ry = y + 22 + i*rowH, op = isOpId(c.id);
    const inSquad = op ? S.operator === c.id : S.squad.includes(c.id);
    const sel = App.selc === c.id;
    const dead = c.status === 'dead';
    panel(x+5, ry, w-10, rowH-2, {
      fill: sel ? '#2e2417' : (inSquad ? '#232a1c' : C.p2),
      edge: sel ? C.brassHi : (inSquad ? C.moss : C.brassLo), noRivet:true,
    });
    P.drawImage(portrait(c, 2, op), x+9, ry+2);
    text(c.name, x+34, ry+3, { size:9, color: dead ? C.fade : C.ink });
    const sub = op ? DATA.operators[c.type].name
      : clsOf(c).name + (c.status === 'injured' ? ' · 부상' : '');
    text(sub, x+34, ry+15, { size:8, color: c.status === 'injured' ? C.rustHi : (op ? C.steel : C.fade) });
    if (c.status === 'injured'){
      const left = Math.max(0, c.healAt - now());
      text(fmtDur(left), x+w-14, ry+15, { size:7, align:'right', color:C.rustHi, mono:true });
    }
    if (inSquad){ P.fillStyle = C.mossHi; P.fillRect(x+w-11, ry+4, 4, 4); }
    addHit(x+5, ry, w-10, rowH-2, () => { App.selc = c.id; sfx('click'); }, false, 'crew:'+c.id);
  });

  if (list.length > view){
    button(x+w-42, y+4, 16, 12, '▲', () => { App.rosterTop = Math.max(0, App.rosterTop-1); }, { size:7, label:'roster-up' });
    button(x+w-24, y+4, 16, 12, '▼', () => { App.rosterTop++; }, { size:7, label:'roster-dn' });
  }
}

/* ── 편성 슬롯 ──────────────────────────────────────────────────── */
export function drawSquadSlots(){
  const x0 = 216, y = 26, sw = 80, sh = 88, gap = 4;
  for (let i=0;i<4;i++){
    const x = x0 + i*(sw+gap);
    const c = crewById(S.squad[i]);
    const sel = c && App.selc === c.id;
    panel(x, y, sw, sh, { fill: c ? (sel ? '#2e2417' : '#20261a') : 'rgba(20,16,11,.7)',
                          edge: sel ? C.brassHi : (c ? C.moss : C.brassLo) });
    text('분대 ' + (i+1), x+sw/2, y+5, { size:7, align:'center', color:C.fade });
    if (c){
      P.drawImage(portrait(c, 3, false), x+sw/2-17, y+16);
      text(c.name, x+sw/2, y+58, { size:9, align:'center', color: c.status==='injured' ? C.rustHi : C.ink });
      text(clsOf(c).name, x+sw/2, y+69, { size:8, align:'center', color:C.fade });
      const wp = DATA.weapons[c.load.w];
      text(wp.name, x+sw/2, y+79, { size:7, align:'center', color:C.brass });
      addHit(x, y, sw, sh, () => { App.selc = c.id; sfx('click'); }, false, 'slot:'+i);
      button(x+sw-16, y+3, 13, 11, '✕', () => {
        S.squad.splice(i,1); saveGame(); sfx('click');
      }, { size:7, label:'unslot:'+i });
    } else {
      text('비어 있음', x+sw/2, y+40, { size:8, align:'center', color:C.fade });
      const cand = crewById(App.selc);
      const can = cand && cand.status !== 'dead' && !S.squad.includes(cand.id);
      button(x+8, y+56, sw-16, 18, '배치', () => {
        S.squad.push(cand.id); saveGame(); sfx('buy');
      }, { size:8, primary:can, disabled:!can, label:'assign:'+i });
    }
  }
  // 오퍼레이터 슬롯
  const x = x0 + 4*(sw+gap);
  const o = opById(S.operator);
  panel(x, y, sw+18, sh, { fill: o ? '#1b2229' : 'rgba(20,16,11,.7)', edge: o ? C.steel : C.brassLo });
  text('오퍼레이터', x+(sw+18)/2, y+5, { size:7, align:'center', color:C.fade });
  if (o){
    P.drawImage(portrait(o, 3, true), x+(sw+18)/2-17, y+16);
    text(o.name, x+(sw+18)/2, y+58, { size:9, align:'center', color:C.ink });
    text(DATA.operators[o.type].name, x+(sw+18)/2, y+69, { size:8, align:'center', color:C.steel });
    text(DATA.operators[o.type].ability, x+(sw+18)/2, y+79, { size:7, align:'center', color:C.brass });
    addHit(x, y, sw+18, sh, () => { App.selc = o.id; sfx('click'); }, false, 'opslot');
  } else text('배치 없음', x+(sw+18)/2, y+40, { size:8, align:'center', color:C.fade });
}

/* ── 로드아웃 편집 ──────────────────────────────────────────────── */
export function chip(x, y, w, label, on, locked, onClick, tag){
  button(x, y, w, 18, label, onClick, { size:8, primary:on, disabled:locked, label:tag });
}
export function drawLoadout(){
  const x = 216, y = 120, w = 418, h = LH - y - 36;
  panel(x, y, w, h, { fill:'rgba(20,16,11,.9)' });
  const sel = crewById(App.selc), selOp = opById(App.selc);

  if (selOp){
    const d = DATA.operators[selOp.type];
    text(selOp.name + ' · ' + d.name, x+10, y+8, { size:11, color:C.steel });
    text('전장에는 나가지 않고 모선에서 분대를 지원합니다', x+10, y+24, { size:8, color:C.fade });
    hline(x+10, y+38, w-20);
    text('지원 능력  ' + d.ability, x+10, y+46, { size:9, color:C.brassHi });
    text(d.desc, x+10, y+60, { size:8, color:C.dim });
    text('상시 효과  ' + d.passive, x+10, y+78, { size:9, color:C.mossHi });
    const on = S.operator === selOp.id;
    button(x+10, y+100, 130, 22, on ? '배치 중' : '관제 배치', () => {
      S.operator = selOp.id; saveGame(); sfx('buy');
    }, { size:9, primary:!on, disabled:on, label:'setop' });
    text('관제 강화 Lv.' + T('trooper','orbital') + ' — 지원 능력 위력과 재장전에 영향', x+10, y+130, { size:8, color:C.fade });
    return;
  }
  if (!sel){ text('명부에서 승무원을 선택하세요', x+w/2, y+h/2-6, { size:9, align:'center', color:C.fade }); return; }

  const cl = clsOf(sel), inSquad = S.squad.includes(sel.id);
  text(sel.name, x+10, y+7, { size:11, color: sel.status==='injured' ? C.rustHi : C.ink });
  text(cl.name, x+10+textW(sel.name,{size:11})+8, y+9, { size:9, color:C.brass });
  text('체력 ' + crewMaxHp(sel) + ' · 이속 ' + cl.spd + ' · ' + cl.perk, x+10, y+22, { size:8, color:C.dim });
  text('출격 ' + sel.missions + '회 · 처치 ' + sel.kills + (sel.wounds ? ' · 부상 이력 ' + sel.wounds + '회' : ''),
       x+w-10, y+9, { size:8, align:'right', color:C.fade, mono:true });
  if (sel.status === 'injured')
    text('부상 — 이대로 출격하면 체력 ' + Math.round(PN.injuredHpPenalty*100) + '%, 재차 쓰러지면 전사',
         x+w-10, y+22, { size:8, align:'right', color:C.rustHi });
  if (!inSquad && sel.status !== 'dead'){
    const full = S.squad.length >= 4;
    button(x+w-96, y+34, 86, 16, full ? '분대 정원 초과' : '분대에 투입', () => {
      S.squad.push(sel.id); saveGame(); sfx('buy');
    }, { size:8, primary:!full, disabled:full, label:'add-squad' });
  }

  // 주무기
  text('주무기', x+10, y+40, { size:8, color:C.brassHi });
  const wkeys = Object.keys(DATA.weapons);
  wkeys.forEach((k,i) => {
    const wd = DATA.weapons[k], lock = !weaponUnlocked(k), on = sel.load.w === k;
    const pref = cl.pref === k;
    chip(x+10+i*100, y+50, 96, wd.name + (pref ? ' ★' : ''), on, lock,
      () => { sel.load.w = k; saveGame(); sfx('click'); }, 'w:'+k);
  });
  const wsel = DATA.weapons[sel.load.w];
  text('피해 ' + wsel.dmg + (wsel.pellets ? '×'+wsel.pellets : '') +
       ' · 연사 ' + (1/wsel.cd).toFixed(1) + '/초 · 사거리 ' + wsel.range +
       (cl.pref === sel.load.w ? '   ★ 선호 무기 피해 +' + Math.round((DATA.prefBonus-1)*100) + '%' : ''),
       x+10, y+72, { size:8, color:C.dim, mono:false });

  // 보조 장비
  text('보조 장비', x+10, y+88, { size:8, color:C.brassHi });
  const gkeys = Object.keys(DATA.gears);
  gkeys.forEach((k,i) => {
    const gd = DATA.gears[k], lock = !gearUnlocked(k), on = sel.load.g === k;
    const col = i % 4, row = (i - col)/4;
    chip(x+10+col*100, y+98+row*20, 96, gd.name, on, lock,
      () => { sel.load.g = k; saveGame(); sfx('click'); }, 'g:'+k);
  });
  text(DATA.gears[sel.load.g].desc, x+10, y+140, { size:8, color:C.dim });

  // 탄약
  text('탄약', x+10, y+154, { size:8, color:C.brassHi });
  const akeys = Object.keys(DATA.ammo);
  akeys.forEach((k,i) => {
    const ad = DATA.ammo[k], stock = ad.infinite ? '∞' : (S.ammo[k]|0);
    const out = !ad.infinite && (S.ammo[k]|0) <= 0;
    const on = sel.load.a === k;
    chip(x+10+i*80, y+164, 76, ad.name + ' ' + stock, on, out && !on,
      () => { sel.load.a = k; saveGame(); sfx('click'); }, 'a:'+k);
  });
  const asel = DATA.ammo[sel.load.a];
  text(asel.desc + (asel.infinite ? '' : ' · 출격 시 1탄창 소모'), x+10, y+186, { size:8, color:C.dim });
  if (asel.craft){
    const ok = canPay(asel.craft);
    button(x+w-104, y+182, 94, 18, '탄창 제작', () => {
      if (!pay(asel.craft)) return toast('자원이 부족합니다', 'bad');
      S.ammo[sel.load.a] = (S.ammo[sel.load.a]|0) + 1;
      saveGame(); sfx('buy'); toast(asel.name + ' 탄창 제작');
    }, { size:8, primary:ok, disabled:!ok, label:'craft' });
    let cx = x+w-104-6;
    for (const [k,v] of Object.entries(asel.craft).reverse()){
      cx -= 40; icon(k, cx, y+186, 1);
      text(fmt(v), cx+10, y+187, { size:8, color: (S.res[k]||0) >= v ? RES_COLOR[k] : C.rustHi, mono:true });
    }
  }
}

/* ── 하단 바 ────────────────────────────────────────────────────── */
export function drawCrewFooter(){
  const y = LH - 32;
  panel(0, y, LW, 32, { fill:'rgba(18,13,8,.95)', noRivet:true });
  hline(0, y, LW, C.brass);

  if (App.pending){
    const sq = squadList(), ready = sq.length;
    const injured = sq.filter(c => c.status === 'injured').length;
    const need = {};
    for (const c of sq){ if (!DATA.ammo[c.load.a].infinite) need[c.load.a] = (need[c.load.a]||0)+1; }
    const lack = Object.entries(need).filter(([k,v]) => (S.ammo[k]|0) < v).map(([k]) => DATA.ammo[k].name);
    const target = App.pending.mode === 'ship' ? '모선 요격 대응' :
      siteDef(App.pending.siteId).name + (App.pending.mode === 'defend' ? ' 방어전' : ' 개척전');
    text('작전 : ' + target, 10, y+6, { size:9, color:C.brassHi });
    text('편성 ' + ready + '/4' + (injured ? ' · 부상 동행 ' + injured + '명' : '') +
         (lack.length ? ' · ' + lack.join(',') + ' 부족 → 표준탄 대체' : ''),
         10, y+19, { size:8, color: lack.length || injured ? C.rustHi : C.fade });
    button(LW-232, y+5, 96, 22, '취소', () => { App.pending = null; App.scene = 'planet'; sfx('click'); }, { size:9, label:'cancel-deploy' });
    button(LW-130, y+5, 120, 22, '강하 개시', () => launchDeploy(), { size:11, primary:ready > 0, disabled: ready === 0, label:'launch' });
  } else {
    const full = crewCount() >= crewCap();
    const c1 = PN.recruitCost, c2 = PN.recruitOpCost;
    text('모집', 10, y+11, { size:9, color:C.brassHi });
    button(42, y+5, 128, 22, '전투원', () => recruitCrew(), { size:9, icon:'crew',
      disabled: full || !canPay(c1), label:'recruit' });
    button(174, y+5, 128, 22, '오퍼레이터', () => recruitOp(), { size:9, icon:'scan',
      disabled: full || !canPay(c2), label:'recruit-op' });
    let cx = 306;
    for (const [k,v] of Object.entries(c1)){ icon(k, cx, y+4, 1); text(fmt(v), cx+9, y+5, { size:7, color:RES_COLOR[k], mono:true }); cx += 42; }
    cx = 306;
    for (const [k,v] of Object.entries(c2)){ icon(k, cx, y+18, 1); text(fmt(v), cx+9, y+19, { size:7, color:RES_COLOR[k], mono:true }); cx += 42; }
    if (full) text('거주 정원이 가득 찼습니다 — 생활 구역 확장 필요', 400, y+11, { size:8, color:C.rustHi });
    button(LW-104, y+5, 94, 22, '브리지로', () => { App.scene = 'bridge'; sfx('click'); }, { size:9, label:'to-bridge' });
  }
}

/* ── 모집 · 출격 ────────────────────────────────────────────────── */
export function recruitCrew(){
  if (crewCount() >= crewCap()) return toast('거주 정원이 가득 찼습니다', 'bad');
  if (!pay(PN.recruitCost)) return toast('자원이 부족합니다', 'bad');
  const keys = Object.keys(DATA.classes);
  const c = makeCrew(keys[Math.floor(Math.random()*keys.length)]);
  c.load.w = clsOf(c).pref;
  if (!weaponUnlocked(c.load.w)) c.load.w = 'rifle';
  S.crew.push(c); App.selc = c.id;
  saveGame(); sfx('buy');
  toast(c.name + ' (' + clsOf(c).name + ') 합류');
}
export function recruitOp(){
  if (crewCount() >= crewCap()) return toast('거주 정원이 가득 찼습니다', 'bad');
  if (!pay(PN.recruitOpCost)) return toast('자원이 부족합니다', 'bad');
  const keys = Object.keys(DATA.operators);
  const o = makeOp(keys[Math.floor(Math.random()*keys.length)]);
  S.ops.push(o); App.selc = o.id;
  saveGame(); sfx('buy');
  toast(o.name + ' (' + DATA.operators[o.type].name + ') 합류');
}
export function launchDeploy(){
  const sq = squadList();
  if (!sq.length) return toast('분대원을 배치하세요', 'bad');
  const op = opById(S.operator);
  let save = op && DATA.operators[op.type].passive.includes('탄창') ? 1 : 0;
  for (const c of sq){
    const a = DATA.ammo[c.load.a];
    if (a.infinite) continue;
    if (save > 0){ save--; continue; }
    if ((S.ammo[c.load.a]|0) <= 0){ c.load.a = 'std'; continue; }
    S.ammo[c.load.a]--;
  }
  const p = App.pending; App.pending = null;
  saveGame();
  startBattle(p.mode, p.siteId);
}
