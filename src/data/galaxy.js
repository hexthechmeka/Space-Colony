/* 자동 분리된 밸런스 데이터 — 이 파일의 수치만 고쳐도 밸런스가 바뀝니다 */
export default {
  galaxy: {
    region:'오리온 변방 · 제3 개척구',
    arms:5, spin:2.6,                       // 나선 팔 개수와 감김 정도
    systems: [
      { id:'skyla',   name:'스카이라',      x:0.72, y:0.74, current:true },
      { id:'karon',   name:'카론 성단',      x:0.30, y:0.32, warp:4, note:'항속 기관 Lv.4' },
      { id:'hadrian', name:'하드리안 성역',  x:0.76, y:0.26, warp:5, note:'항속 기관 Lv.5' },
      { id:'tundra',  name:'툰드라-9',       x:0.16, y:0.66, warp:5, note:'항속 기관 Lv.5' },
      { id:'redring', name:'붉은 고리',      x:0.92, y:0.48, warp:6, note:'좌표 미확보' },
      { id:'orpheus', name:'오르페우스 잔해', x:0.44, y:0.88, warp:6, note:'좌표 미확보' },
      { id:'blackgap',name:'검은 협곡',      x:0.56, y:0.12, warp:7, note:'좌표 미확보' },
    ],
  },
};
