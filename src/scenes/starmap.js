import { planetSprite } from '../art/planets.js';
import { drawSpace } from '../art/space.js';
import { App, SceneHooks, setScene } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { S, planetDef, planetOpen, saveGame } from '../core/state.js';
import { toast } from '../core/store.js';
import { clamp, lerp } from '../core/util.js';
import { DATA } from '../data/index.js';
import { topBar } from './common.js';
import { sceneGalaxy } from './galaxymap.js';
import { C, LH, LW, P } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { MOUSE, addHit, button, inRect, panel, text } from '../ui/widgets.js';

/* ═══ 12. 항행 도표 (월드 좌표 + 드래그/줌) ═══════════════════════ */
export const WW = 2000, WH = 1120;                    // 성계 월드 크기 (화면보다 넓다)
export const SUNX = WW/2, SUNY = WH/2;               // 항성은 성계 한가운데
export const ORBIT = [[320,175],[600,315],[880,450]]; // [가로 반지름, 세로 반지름]
export const ZOOMS = [0.32, 0.5, 0.75, 1.1];         // 0.32 = 성계 전체가 한 화면에
export const cam = { x:SUNX, y:SUNY, zi:1 };
export const camZ = () => ZOOMS[cam.zi];
export const w2sx = wx => (wx - cam.x)*camZ() + LW/2;
export const w2sy = wy => (wy - cam.y)*camZ() + LH/2;
export const s2wx = sx => (sx - LW/2)/camZ() + cam.x;
export const s2wy = sy => (sy - LH/2)/camZ() + cam.y;
export function clampCam(){
  const z = camZ(), halfW = LW/(2*z), halfH = LH/(2*z);
  cam.x = WW <= halfW*2 ? WW/2 : clamp(cam.x, halfW, WW-halfW);
  cam.y = WH <= halfH*2 ? WH/2 : clamp(cam.y, halfH, WH-halfH);
}
export function planetPos(i){
  // 중앙 항성을 도는 공전 (월드 좌표)
  const a = App.clock*0.019*(1 - i*0.24) + i*2.25;
  return { x: SUNX + Math.cos(a)*ORBIT[i][0], y: SUNY + Math.sin(a)*ORBIT[i][1] };
}
/** 항행 도표를 열 때는 성계 전체가 보이도록 최대 축소 상태로 시작 */
export function openStarmap(){ App.mapMode = 'system'; App.mapFade = 0; cam.zi = 0; App.minZoomAt = App.clock; cam.x = SUNX; cam.y = SUNY; clampCam(); }
export function centerOnShip(smooth){
  const i = DATA.planets.findIndex(p => p.id === (App.travel ? App.travel.to : S.at));
  const pos = planetPos(Math.max(0,i));
  if (smooth){ cam.x = lerp(cam.x, pos.x, 0.12); cam.y = lerp(cam.y, pos.y, 0.12); }
  else { cam.x = pos.x; cam.y = pos.y; }
  clampCam();
}
export function zoomAt(dir, sx, sy, fromWheel){
  if (App.mapMode === 'galaxy'){                 // 성간 지도에서 확대하면 성계로 복귀
    if (dir > 0) enterSystemMap();
    return;
  }
  if (dir < 0 && cam.zi === 0){              // 최대 축소에서 한 번 더 축소 → 성간 지도
    // 휠은 한 번의 동작으로 튀지 않도록 유예를 두고, 버튼은 즉시 전환
    if (!fromWheel || App.clock - App.minZoomAt > 0.35) enterGalaxyMap();
    return;
  }
  const bx = s2wx(sx), by = s2wy(sy);
  const ni = clamp(cam.zi + dir, 0, ZOOMS.length-1);
  if (ni === cam.zi) return;
  cam.zi = ni;
  if (ni === 0) App.minZoomAt = App.clock;
  cam.x += bx - s2wx(sx); cam.y += by - s2wy(sy);
  clampCam(); sfx('click');
}
export function enterGalaxyMap(){ if (App.travel) return; App.mapMode = 'galaxy'; App.mapFade = 0; sfx('warp'); }
export function enterSystemMap(){ App.mapMode = 'system'; App.mapFade = 0; cam.zi = 0; App.minZoomAt = App.clock; cam.x = SUNX; cam.y = SUNY; clampCam(); sfx('warp'); }

export function sceneStarmap(dt){
  App.mapFade = Math.min(1, App.mapFade + dt*3.2);
  if (App.mapMode === 'galaxy'){ sceneGalaxy(dt); return; }
  const z = camZ();
  drawSpace(App.clock*0.3, cam.x*0.06);
  if (App.travel) centerOnShip(true);

  // 항성
  const sx = w2sx(SUNX), sy = w2sy(SUNY), sr = 19*z;
  const g = P.createRadialGradient(sx, sy, 4, sx, sy, 96*z);
  g.addColorStop(0,'rgba(255,226,150,.85)'); g.addColorStop(0.35,'rgba(230,140,60,.26)'); g.addColorStop(1,'rgba(180,80,30,0)');
  P.fillStyle = g; P.beginPath(); P.arc(sx, sy, 96*z, 0, 6.29); P.fill();
  P.fillStyle = '#ffe6a0'; P.beginPath(); P.arc(sx, sy, sr, 0, 6.29); P.fill();
  P.fillStyle = '#fff6d8'; P.beginPath(); P.arc(sx-sr*0.22, sy-sr*0.26, sr*0.5, 0, 6.29); P.fill();
  if (sx > -40 && sx < LW+40) text('스카이라', sx, sy+sr+7, { size:8, align:'center', color:'rgba(230,197,109,.6)' });

  // 궤도
  P.strokeStyle = 'rgba(200,162,74,.16)'; P.setLineDash([2,4]); P.lineWidth = 1;
  for (const r of ORBIT){ P.beginPath(); P.ellipse(sx, sy, r[0]*z, r[1]*z, 0, 0, 6.29); P.stroke(); }
  P.setLineDash([]);

  // 행성
  DATA.planets.forEach((p,i) => {
    const wp = planetPos(i), open = planetOpen(p);
    const px_ = w2sx(wp.x), py_ = w2sy(wp.y);
    const d = Math.max(10, Math.round((46 + i*10) * z));
    if (px_ < -d || px_ > LW+d || py_ < -d || py_ > LH+d+30) return;
    const held = p.sites.filter(s2 => S.sites[s2.id].status === 'held').length;
    const sieged = p.sites.some(s2 => S.sites[s2.id].threatAt);
    if (!open) P.globalAlpha = 0.62;
    P.drawImage(planetSprite(p, d), Math.round(px_-d/2), Math.round(py_-d/2));
    P.globalAlpha = 1;
    if (S.at === p.id && !App.travel){
      P.strokeStyle = C.brass; P.setLineDash([3,3]); P.lineWidth = 1;
      P.beginPath(); P.arc(px_, py_, d/2+7, 0, 6.29); P.stroke(); P.setLineDash([]);
    }
    if (!open) icon('lock', px_-3, py_-4, 1, '#6b6152');
    if (held){ icon('flag', px_+d/2-2, py_-d/2-6, 1, C.mossHi); text(String(held), px_+d/2+7, py_-d/2-6, { size:8, color:C.mossHi }); }
    if (sieged && Math.sin(App.clock*6) > 0) icon('skull', px_-d/2-8, py_-d/2-4, 1, C.rustHi);
    text(p.name, px_, py_+d/2+5, { size:9, align:'center', color: open ? C.ink : C.fade });
    text(open ? p.sub : '항속 기관 Lv.'+p.warp+' 필요', px_, py_+d/2+16, { size:8, align:'center', color: open ? C.fade : C.rust });
    if (!App.travel){
      const hov = inRect(MOUSE.x,MOUSE.y,px_-d/2-6,py_-d/2-6,d+12,d+12);
      addHit(px_-d/2-6, py_-d/2-6, d+12, d+12, () => {
        if (!open) { toast('항속 기관이 부족합니다', 'bad'); return; }
        if (S.at === p.id){ setScene('planet'); return; }
        App.travel = { from:S.at, to:p.id, t:0, dur:1.9 };
        sfx('warp');
      }, false, 'planet:'+p.id);
      if (hov){
        P.strokeStyle = C.brassHi; P.lineWidth = 1;
        P.strokeRect(Math.round(px_-d/2-5)+0.5, Math.round(py_-d/2-5)+0.5, d+10, d+10);
      }
    }
  });

  // 모선 마커 / 항행 연출
  let wsp;
  if (App.travel){
    App.travel.t += dt;
    const k = clamp(App.travel.t/App.travel.dur, 0, 1);
    const a = planetPos(DATA.planets.findIndex(p=>p.id===App.travel.from));
    const b = planetPos(DATA.planets.findIndex(p=>p.id===App.travel.to));
    const ease = k<0.5 ? 2*k*k : 1-Math.pow(-2*k+2,2)/2;
    wsp = { x: lerp(a.x,b.x,ease), y: lerp(a.y,b.y,ease) - Math.sin(ease*Math.PI)*40 };
    P.strokeStyle = 'rgba(230,197,109,.35)'; P.setLineDash([4,4]); P.lineWidth = 1;
    P.beginPath(); P.moveTo(w2sx(a.x), w2sy(a.y)); P.lineTo(w2sx(wsp.x), w2sy(wsp.y)); P.stroke(); P.setLineDash([]);
    panel(LW/2-72, 28, 144, 22, { fill:'#1d1811', edge:C.brass });
    text('항행 중 — ' + planetDef(App.travel.to).name, LW/2, 34, { size:9, align:'center', color:C.brassHi });
    if (k >= 1){
      S.at = App.travel.to; App.travel = null; saveGame();
      toast(planetDef(S.at).name + ' 궤도 진입');
      setScene('planet');
    }
  } else {
    const pp = planetPos(DATA.planets.findIndex(p => p.id === S.at));
    wsp = { x: pp.x + 34, y: pp.y - 30 };
  }
  const mx = w2sx(wsp.x), my = w2sy(wsp.y), ms = Math.max(1, Math.round(z*1.2));
  P.fillStyle = '#4a5057'; P.fillRect(Math.round(mx-9*ms), Math.round(my-3*ms), 18*ms, 6*ms);
  P.fillStyle = '#8d97a0'; P.fillRect(Math.round(mx-3*ms), Math.round(my-6*ms), 8*ms, 3*ms);
  P.fillStyle = '#c8a24a'; P.fillRect(Math.round(mx-9*ms), Math.round(my), 18*ms, ms);
  P.fillStyle = '#e6c56d'; P.fillRect(Math.round(mx+9*ms), Math.round(my-2*ms), 3*ms, 4*ms);

  // 미니맵 — 확대 상태에서만 (우측 상단)
  if (cam.zi > 0){
    const mw = 88, mh = Math.round(mw*WH/WW), mxp = LW-mw-6, myp = 26;
    panel(mxp, myp, mw, mh, { fill:'rgba(12,9,14,.8)', noRivet:true });
    P.fillStyle = 'rgba(255,226,150,.85)'; P.fillRect(mxp+Math.round(SUNX/WW*mw)-1, myp+Math.round(SUNY/WH*mh)-1, 3, 3);
    DATA.planets.forEach((p,i) => {
      const wp = planetPos(i);
      P.fillStyle = planetOpen(p) ? C.brass : '#5a5040';
      P.fillRect(mxp+Math.round(wp.x/WW*mw)-1, myp+Math.round(wp.y/WH*mh)-1, 2, 2);
    });
    const vw = clamp(LW/z/WW*mw, 4, mw), vh = clamp(LH/z/WH*mh, 3, mh);
    P.strokeStyle = 'rgba(230,197,109,.75)'; P.lineWidth = 1;
    P.strokeRect(clamp(Math.round(mxp+(cam.x/WW*mw)-vw/2), mxp, mxp+mw-vw)+0.5,
                 clamp(Math.round(myp+(cam.y/WH*mh)-vh/2), myp, myp+mh-vh)+0.5,
                 Math.round(vw), Math.round(vh));
  }

  // 좌측 하단 — 성간 지도 진입
  panel(6, LH-30, 132, 24, { fill:'rgba(12,9,14,.82)', edge:C.brassLo, noRivet:true });
  button(10, LH-27, 124, 18, '성간 지도', () => enterGalaxyMap(),
    { size:9, icon:'scan', label:'galaxy', disabled: !!App.travel });

  // 우측 하단 — 조작 안내 / 줌
  const cbx = LW-292;
  panel(cbx, LH-26, 286, 20, { fill:'rgba(12,9,14,.72)', noRivet:true });
  text(cam.zi === 0 ? '한 번 더 축소하면 성간 지도' : '드래그 이동 · 휠 확대',
       cbx+8, LH-21, { size:8, color: cam.zi === 0 ? C.brass : C.fade });
  text('×' + z.toFixed(2), cbx+130, LH-21, { size:8, color:C.brass, mono:true });
  button(cbx+166, LH-24, 26, 16, '＋', () => zoomAt(1, LW/2, LH/2), { size:9, disabled: cam.zi >= ZOOMS.length-1, label:'zoom+' });
  button(cbx+194, LH-24, 26, 16, '－', () => zoomAt(-1, LW/2, LH/2), { size:9, label:'zoom-' });
  button(cbx+224, LH-24, 54, 16, '모선 위치', () => { cam.zi = Math.max(cam.zi, 2); centerOnShip(false); sfx('click'); }, { size:8, label:'recenter' });

  text('항행 도표 · 스카이라 성계', LW/2, 26, { size:10, align:'center', color: App.travel ? 'rgba(0,0,0,0)' : C.brassHi });
  topBar(null, 'bridge');
}

/* ── 성간 지도 패널 ─────────────────────────────────────────────── */

SceneHooks.starmap = openStarmap;   // 항행 도표 진입 시 성계 전체 보기로
