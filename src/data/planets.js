/* 자동 분리된 밸런스 데이터 — 이 파일의 수치만 고쳐도 밸런스가 바뀝니다 */
export default {
  planets: [
    { id:'rubicon', name:'루비콘-4', sub:'녹슨 사막', warp:0, ground:'#6b5334', sky:'#2a1d12',
      sites:[
        { id:'r1', name:'폐선 잔해지',   risk:1, tier:1, res:'scrap', rate:16, cost:{scrap:40},            waves:3 },
        { id:'r2', name:'마른 우물터',   risk:1, tier:1, res:'fuel',  rate:7,  cost:{scrap:60},            waves:3 },
        { id:'r3', name:'굴착 붕괴지',   risk:2, tier:2, res:'scrap', rate:30, cost:{scrap:120},           waves:4 },
        { id:'r4', name:'무너진 정제소', risk:3, tier:3, res:'alloy', rate:4,  cost:{scrap:220,fuel:30},   waves:5 },
      ]},
    { id:'cerberus', name:'케르베로스-2', sub:'화산 폐광', warp:1, ground:'#5a3a30', sky:'#2c1512',
      sites:[
        { id:'c1', name:'유황 단층',     risk:2, tier:2, res:'scrap', rate:38, cost:{scrap:160},           waves:4 },
        { id:'c2', name:'용암관 갱도',   risk:3, tier:3, res:'alloy', rate:8,  cost:{scrap:260,fuel:40},   waves:5 },
        { id:'c3', name:'파열된 노심',   risk:4, tier:4, res:'fuel',  rate:26, cost:{scrap:380,alloy:12},  waves:6 },
      ]},
    { id:'aquila', name:'아쿠일라-9', sub:'폭풍 대륙', warp:2, ground:'#41504a', sky:'#161f22',
      sites:[
        { id:'a1', name:'번개 평원',     risk:3, tier:3, res:'fuel',  rate:34, cost:{scrap:300,fuel:50},   waves:5 },
        { id:'a2', name:'침몰한 정거장', risk:4, tier:4, res:'alloy', rate:15, cost:{scrap:460,alloy:18},  waves:6 },
        { id:'a3', name:'태풍의 눈',     risk:5, tier:5, res:'scrap', rate:95, cost:{scrap:700,alloy:30},  waves:7 },
      ]},
  ],
};
