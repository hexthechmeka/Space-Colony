/* ═══ 5. 캔버스 · 레이아웃 ══════════════════════════════════════════ */
export const LW = 640, LH = 360;                   // 논리 해상도 (16:9)
export const stage = document.getElementById('stage');
export const pxc = document.getElementById('px'), P = pxc.getContext('2d');
export const uic = document.getElementById('ui'),  U = uic.getContext('2d');
export let VIEW = { scale:2, dpr:1 };

export function layout(){
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  const availW = window.innerWidth, availH = window.innerHeight;
  let sc = Math.min(availW/LW, availH/LH);
  sc = sc >= 1 ? Math.max(1, Math.floor(sc*2)/2) : sc;   // 0.5 단위로 스냅
  VIEW.scale = sc; VIEW.dpr = dpr;
  const w = Math.round(LW*sc), h = Math.round(LH*sc);
  stage.style.width = w+'px'; stage.style.height = h+'px';
  pxc.width = LW; pxc.height = LH;
  pxc.style.width = w+'px'; pxc.style.height = h+'px';
  uic.width = Math.round(w*dpr); uic.height = Math.round(h*dpr);
  uic.style.width = w+'px'; uic.style.height = h+'px';
  U.setTransform(sc*dpr, 0, 0, sc*dpr, 0, 0);            // 논리 좌표로 그리되 선명하게
  P.imageSmoothingEnabled = false;
}
addEventListener('resize', layout);

/* ═══ 6. 색 ═════════════════════════════════════════════════════════ */
export const C = {
  ink:'#e8dcc4', dim:'#a8967a', fade:'#7a6a52',
  brass:'#c8a24a', brassHi:'#e6c56d', brassLo:'#6b5227',
  rust:'#a4432c', rustHi:'#c9603f', moss:'#6f7a45', mossHi:'#9bad63',
  steel:'#8d97a0', gold:'#ffd76a',
  p0:'#0d0a08', p1:'#1a150f', p2:'#241d16', p3:'#33291d', p4:'#453425',
  bad:'#c1452f', ok:'#7f9c4a',
};
export const RES_COLOR = { scrap:'#c98f4a', fuel:'#d2b04a', alloy:'#9fb6c8' };
