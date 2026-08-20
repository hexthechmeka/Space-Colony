/* 자동 분리된 밸런스 데이터 — 이 파일의 수치만 고쳐도 밸런스가 바뀝니다 */
export default {
  weapons: {
    rifle:  { name:'증기 소총',   dmg:9,  cd:0.30, range:190, spd:265, spread:0.045, tier:0 },
    shotgun:{ name:'파쇄 산탄총', dmg:5,  cd:0.78, range:112, spd:230, spread:0.26, pellets:5, tier:1 },
    hmg:    { name:'중기관총',    dmg:6,  cd:0.11, range:178, spd:280, spread:0.10, moveMul:0.82, tier:2 },
    flamer: { name:'화염 방사기', dmg:4,  cd:0.07, range:82,  spd:150, spread:0.30, pierce:true, life:0.55, tier:3 },
  },

  turret:   { hp:140, dmg:8, cd:0.5, range:152, cost:{scrap:25} },

  core:     { hp:300, r:16 },

  orbital:  { dmg:[0,90,150,240], radius:52, cd:[0,34,26,20] },

  gears: {
    none:   { name:'없음',       tier:0, desc:'보조 장비 없음' },
    plate:  { name:'방탄판',     tier:0, desc:'최대 체력 +22%',        hp:1.22 },
    stim:   { name:'각성제',     tier:1, desc:'이동 속도 +18%',        spd:1.18 },
    magpack:{ name:'예비 탄창',  tier:1, desc:'연사 속도 +16%',        rate:0.84 },
    medkit: { name:'의료 키트',  tier:2, desc:'5초마다 체력 5% 회복',  regen:0.05 },
    smoke:  { name:'연막 발생기',tier:2, desc:'받는 피해 -18%',        armor:0.82 },
    scope:  { name:'조준경',     tier:3, desc:'사거리 +22% · 산포 감소', range:1.22, spread:0.6 },
  },

  ammo: {
    std:    { name:'표준탄',   desc:'보정 없음 · 무제한',        infinite:true },
    ap:     { name:'관통탄',   desc:'피해 +22%',                 dmg:1.22,  craft:{scrap:40, alloy:1} },
    incend: { name:'소이탄',   desc:'명중 시 화상 (초당 피해)',   burn:6,    craft:{scrap:55} },
    frag:   { name:'파쇄탄',   desc:'명중 시 주변 파편 피해',     frag:9,    craft:{scrap:60, alloy:1} },
    hv:     { name:'고속탄',   desc:'탄속 +45% · 사거리 +18%',    spd:1.45, range:1.18, craft:{scrap:45} },
  },

  ammoStart: { ap:6, incend:4, frag:3, hv:5 },
};
