import './style.css';
import { drawBattle } from './battle/render.js';
import { updateBattle } from './battle/sim.js';
import { Battle, keys, operatorAbility, placeTurret, startBattle } from './battle/state.js';
import { App, closeModal, openModal, setScene } from './core/app.js';
import { settleOffline, tickMeta } from './core/economy.js';
import { S, T, crewMaxHp, freshState, injuryMs, loadGame, saveGame, setS } from './core/state.js';
import { KEY, OPT, Store } from './core/store.js';
import { clamp } from './core/util.js';
import { DATA } from './data/index.js';
import { sceneBridge } from './scenes/bridge.js';
import { drawToasts } from './scenes/common.js';
import { openCrew, sceneCrew } from './scenes/crew.js';
import { drawModal } from './scenes/modals.js';
import { scenePlanet } from './scenes/planet.js';
import { cam, camZ, centerOnShip, clampCam, openStarmap, planetPos, sceneStarmap, w2sx, w2sy, zoomAt } from './scenes/starmap.js';
import { sceneTech } from './scenes/tech.js';
import { LH, LW, U, VIEW, layout, stage } from './ui/canvas.js';
import { HITS, MOUSE, hitAt, resetHits } from './ui/widgets.js';

/* ═══════════════════════════════════════════════════════════════════
   프론티어 아웃포스트 — 진입점
   입력 처리 · 메인 루프 · 초기화 · 자동화 테스트 훅
   ═══════════════════════════════════════════════════════════════════ */


/* ── 입력 ──────────────────────────────────────────────────────── */
function toLogical(ev){
  const r = stage.getBoundingClientRect();
  return { x:(ev.clientX - r.left)/VIEW.scale, y:(ev.clientY - r.top)/VIEW.scale };
}
let DRAG = null;                       // 성계도 드래그 상태

addEventListener('pointermove', ev => {
  const p = toLogical(ev); MOUSE.x = p.x; MOUSE.y = p.y;
  if (DRAG){
    const dx = p.x - DRAG.sx, dy = p.y - DRAG.sy;
    DRAG.moved = Math.max(DRAG.moved, Math.hypot(dx, dy));   // 끌었으면 클릭으로 치지 않는다
    if (DRAG.pan){
      cam.x = DRAG.cx - dx/camZ();
      cam.y = DRAG.cy - dy/camZ();
      clampCam();
      stage.style.cursor = DRAG.moved > 4 ? 'grabbing' : '';
    }
  } else if (App.scene === 'starmap' && !App.modal){
    stage.style.cursor = hitAt(p.x, p.y) ? 'pointer' : (App.mapMode === 'galaxy' ? '' : 'grab');
  } else stage.style.cursor = '';
}, { passive:true });

addEventListener('pointerdown', ev => {
  const p = toLogical(ev); MOUSE.x = p.x; MOUSE.y = p.y;
  if (p.x < 0 || p.y < 0 || p.x > LW || p.y > LH) return;
  // 성계도에서는 클릭 판정을 pointerup 으로 미루고, 그 사이 드래그로 화면을 끈다
  if (App.scene === 'starmap' && !App.modal){
    DRAG = { sx:p.x, sy:p.y, cx:cam.x, cy:cam.y, moved:0, hit:hitAt(p.x, p.y), pan: App.mapMode === 'system' };
    return;
  }
  const h = hitAt(p.x, p.y);
  if (h){ if (!h.dis && h.onClick) h.onClick(); return; }
  if (App.modal) return;
  if (App.scene === 'battle' && Battle.active){
    if (Battle.placing) placeTurret(p.x, p.y);
    else MOUSE.down = true;
  }
});
addEventListener('pointerup', () => {
  if (DRAG){
    if (DRAG.moved < 5 && DRAG.hit && !DRAG.hit.dis && DRAG.hit.onClick) DRAG.hit.onClick();
    DRAG = null; stage.style.cursor = '';
  }
  MOUSE.down = false;
});
addEventListener('pointercancel', () => { DRAG = null; MOUSE.down = false; });
addEventListener('contextmenu', e => { if (App.scene === 'battle') e.preventDefault(); });
addEventListener('wheel', ev => {
  if (App.scene !== 'starmap' || App.modal) return;
  ev.preventDefault();
  const p = toLogical(ev);
  zoomAt(ev.deltaY < 0 ? 1 : -1, clamp(p.x,0,LW), clamp(p.y,0,LH), true);
}, { passive:false });

addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'escape'){
    if (App.modal){ closeModal(); if (App.modal === null) Battle.paused = false; }
    else if (App.scene === 'battle' && Battle.active){ Battle.paused = true; openModal({ type:'pause' }); }
    else if (App.scene !== 'bridge') setScene('bridge');
    return;
  }
  if (App.scene !== 'battle' || !Battle.active) return;
  if (k === ' '){
    e.preventDefault();
    if (Battle.phase === 'prep') Battle.prepLeft = 0;
    else if (Battle.phase === 'inter') Battle.interLeft = 0;
    else operatorAbility(MOUSE.x, MOUSE.y);
  }
  if (k === 't'){ Battle.auto = !Battle.auto; }
  if (k === 'b' && Battle.turretLeft > 0) Battle.placing = !Battle.placing;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
addEventListener('pagehide', () => saveGame());
addEventListener('resize', layout);

/* ── 메인 루프 ─────────────────────────────────────────────────── */
let lastTs = 0, metaAcc = 0, saveAcc = 0;
function frame(ts){
  const dt = Math.min(0.05, (ts - lastTs)/1000 || 0);
  lastTs = ts; App.clock += dt;
  U.clearRect(0, 0, LW, LH);
  resetHits();

  if (App.scene === 'battle' && Battle.active){
    updateBattle(dt);
    if (Battle.active) drawBattle(dt);
  } else {
    metaAcc += dt;
    if (metaAcc >= 1){ tickMeta(metaAcc); metaAcc = 0; }
    if (App.scene === 'crew') sceneCrew(dt);
    else if (App.scene === 'starmap') sceneStarmap(dt);
    else if (App.scene === 'planet') scenePlanet(dt);
    else if (App.scene === 'tech') sceneTech(dt);
    else sceneBridge(dt);
  }
  drawToasts(dt);
  if (App.modal) drawModal();

  saveAcc += dt;
  if (saveAcc > 20){ saveAcc = 0; saveGame(); }
  requestAnimationFrame(frame);
}

/* ── 시작 ──────────────────────────────────────────────────────── */
layout();
document.getElementById('scan').style.display = OPT.scan ? '' : 'none';
{
  const had = loadGame();
  if (!had) setS(freshState());
  const rep = had ? settleOffline() : null;
  saveGame();
  if (rep) openModal({ type:'report', rep });
  else if (!S.seenHelp) openModal({ type:'help' });
  requestAnimationFrame(frame);
}

/* ── 자동화 테스트 훅 ──────────────────────────────────────────── */
window.__fo = {
  get S(){ return S }, get B(){ return Battle }, get scene(){ return App.scene },
  get modal(){ return App.modal }, get pending(){ return App.pending },
  get crew(){ return S.crew }, get ops(){ return S.ops },
  get cam(){ return { x:cam.x, y:cam.y, z:camZ() } }, get mapMode(){ return App.mapMode },
  DATA, Store, KEY, T, crewMaxHp, injuryMs, planetPos, openCrew, startBattle, saveGame,
  w2s(wx, wy){ return { x:w2sx(wx), y:w2sy(wy) }; },
  labels(){ return HITS.map(h => h.label).filter(Boolean); },
  click(label){
    const h = HITS.find(x => x.label === label);
    if (!h) return 'NOT_FOUND:' + label;
    if (h.dis) return 'DISABLED:' + label;
    h.onClick(); return 'OK';
  },
  goto(s){ App.scene = s; if (s === 'starmap') openStarmap(); },
  grant(r){ Object.assign(S.res, r); },
  tech(tree, id, l){ S.tech[tree][id] = l; },
  recenter(){ centerOnShip(false); },
};
