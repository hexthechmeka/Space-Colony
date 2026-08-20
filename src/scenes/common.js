import { App, openModal, setScene } from '../core/app.js';
import { S, heldSites, shipMaxHp, slotMax } from '../core/state.js';
import { TOASTS } from '../core/store.js';
import { clamp } from '../core/util.js';
import { C, LH, LW, P, U } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { bar, button, panel, resChip, text, textW } from '../ui/widgets.js';

/* ── 공통 상단 바 ────────────────────────────────────────────────── */
export function topBar(title, backTo){
  panel(0, 0, LW, 20, { fill:'#161009', edge:C.brassLo, noRivet:true, accent:'rgba(200,162,74,.25)' });
  let x = 4;
  const chips = [['scrap',S.res.scrap],['fuel',S.res.fuel],['alloy',S.res.alloy]];
  for (const [k,v] of chips){ resChip(x, 2, k, v, 64); x += 68; }
  panel(x, 2, 52, 16, { fill:C.p1 }); icon('base', x+3, 6, 1);
  text(heldSites().length+'/'+slotMax(), x+48, 6, { size:9, align:'right', color:C.mossHi, mono:true });
  x += 56;
  panel(x, 2, 58, 16, { fill:C.p1 }); icon('ship', x+3, 6, 1);
  const shipR = clamp((S.ship.hp||0)/shipMaxHp(), 0, 1);
  bar(x+13, 6, 40, 8, shipR, shipR < 0.4 ? C.bad : C.steel);
  x += 62;
  if (title) text(title, x+6, 6, { size:10, color:C.brassHi });

  button(LW-40, 2, 36, 16, '설정', () => openModal({ type:'opt' }), { size:8 });
  if (backTo) button(LW-80, 2, 38, 16, '◀ 뒤로', () => setScene(backTo), { size:8 });
}

/* ── 토스트 ─────────────────────────────────────────────────────── */
export function drawToasts(dt){
  for (let i=TOASTS.length-1;i>=0;i--){ TOASTS[i].life -= dt; if (TOASTS[i].life <= 0) TOASTS.splice(i,1); }
  TOASTS.forEach((tt,i) => {
    // 화면마다 겹치지 않는 위치에 띄운다
    const top = App.scene !== 'crew';
    const w = Math.max(120, textW(tt.msg, {size:9}) + 20);
    const y = top ? 26 + i*20 : LH - 56 - i*20;
    const a = clamp(tt.life, 0, 1);
    P.globalAlpha = a; U.globalAlpha = a;
    panel(LW/2 - w/2, y, w, 17, { fill:'#1d1610', edge: tt.kind==='bad' ? C.rust : C.brass });
    P.fillStyle = tt.kind==='bad' ? C.rust : C.brass; P.fillRect(Math.round(LW/2-w/2), y, 2, 17);
    text(tt.msg, LW/2, y+5, { size:9, align:'center', color: tt.kind==='bad' ? C.rustHi : C.ink });
    P.globalAlpha = 1; U.globalAlpha = 1;
  });
}
