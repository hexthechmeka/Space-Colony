import { drawSpace } from '../art/space.js';
import { App } from '../core/app.js';
import { sfx } from '../core/audio.js';
import { canPay, pay } from '../core/economy.js';
import { S, T, saveGame } from '../core/state.js';
import { toast } from '../core/store.js';
import { fmt } from '../core/util.js';
import { DATA } from '../data/index.js';
import { topBar } from './common.js';
import { C, LH, LW, P, RES_COLOR } from '../ui/canvas.js';
import { icon } from '../ui/icons.js';
import { button, panel, text } from '../ui/widgets.js';

/* ═══ 14. 함선 개조 ═════════════════════════════════════════════════ */
export const TREE_META = {
  ship:    { name:'모선', note:'항로와 함대 규모를 넓힙니다' },
  outpost: { name:'전초기지', note:'모든 전초기지에 동시 적용됩니다' },
  trooper: { name:'전투원', note:'강하 분대의 무장과 생존성' },
};
export function sceneTech(dt){
  P.fillStyle = '#100c14'; P.fillRect(0,0,LW,LH);
  drawSpace(App.clock*0.15, 0);
  P.fillStyle = 'rgba(10,8,12,.72)'; P.fillRect(0,0,LW,LH);

  let tx = 16;
  for (const k of ['ship','outpost','trooper']){
    const on = App.tree === k, w = 96;
    button(tx, 26, w, 20, TREE_META[k].name, () => { App.tree = k; sfx('click'); }, { primary:on, size:10 });
    tx += w + 8;
  }
  text(TREE_META[App.tree].note, tx + 8, 32, { size:8, color:C.fade });

  const list = DATA.tech[App.tree];
  list.forEach((t, i) => {
    const col = i % 2, row = (i - col) / 2;
    const x = 16 + col*312, y = 56 + row*72, w = 296, h = 64;
    const l = T(App.tree, t.id), maxed = l >= t.max;
    const cost = maxed ? {} : t.cost(l);
    const ok = !maxed && canPay(cost);
    panel(x, y, w, h, { fill: ok ? '#262016' : C.p2, edge: ok ? C.brass : C.brassLo });
    icon(t.id, x+10, y+10, 3, maxed ? C.mossHi : null);
    text(t.name, x+42, y+9, { size:10, color: maxed ? C.mossHi : C.ink });
    // 레벨 핍
    for (let k=0;k<t.max;k++){
      P.fillStyle = k < l ? C.brass : '#191309';
      P.fillRect(x+42+k*8, y+23, 6, 5);
      P.strokeStyle = C.brassLo; P.strokeRect(x+42+k*8+0.5, y+23+0.5, 5, 4);
    }
    text(t.note, x+42, y+33, { size:8, color:C.fade });
    text('현재 ' + t.desc(l) + (maxed ? '' : '  →  ' + t.desc(l+1)), x+10, y+48, { size:8, color: maxed ? C.mossHi : C.brassHi });
    // 비용 버튼
    if (maxed){
      panel(x+w-84, y+8, 76, 22, { fill:'#1d2416', edge:C.moss });
      text('완료', x+w-46, y+14, { size:9, align:'center', color:C.mossHi });
    } else {
      const bx = x+w-90, by = y+8;
      button(bx, by, 82, 22, '', () => {
        const cur = T(App.tree, t.id);
        if (cur >= t.max) return;
        if (!pay(t.cost(cur))) { toast('자원이 부족합니다', 'bad'); return; }
        S.tech[App.tree][t.id] = cur+1; sfx('buy'); toast(t.name + ' Lv.' + (cur+1)); saveGame();
      }, { primary:ok, disabled:!ok, label:'tech:'+t.id });
      let cx = bx + 8;
      const ents = Object.entries(cost).filter(([,v]) => v > 0);
      const each = Math.floor(66/ents.length);
      for (const [k,v] of ents){
        icon(k, cx, by+7, 1);
        text(fmt(v), cx+9, by+7, { size:8, color: ok ? '#1b1509' : ((S.res[k]||0) >= v ? RES_COLOR[k] : C.rustHi), mono:true });
        cx += each;
      }
    }
  });
  topBar('함선 개조', 'bridge');
}
