import { sfx } from './audio.js';

/* ═══ 앱 공유 상태 ═════════════════════════════════════════════════
   씬과 전투가 함께 읽고 쓰는 값. 모듈 순환 참조를 피하려고 한곳에 모읍니다.
   ═══════════════════════════════════════════════════════════════ */

export const App = {
  scene:'bridge',      // bridge | starmap | planet | tech | crew | battle
  modal:null, clock:0,
  sel:null,            // 선택된 후보지 id
  pending:null,        // 출격 편성 대기 {mode, siteId}
  selc:null,           // 선택된 승무원 id
  tree:'ship',         // 개조 탭
  travel:null, mapMode:'system', mapFade:0, minZoomAt:-99, rosterTop:0,
};
/** 씬 진입 훅 — 씬 모듈이 자기 초기화 함수를 등록한다 (순환 import 방지) */
export const SceneHooks = {};

export function setScene(s){
  App.scene = s; App.sel = null;
  if (SceneHooks[s]) SceneHooks[s]();
  sfx('click');
}
export function openModal(m){ App.modal = m; }
export function closeModal(){ App.modal = null; }
