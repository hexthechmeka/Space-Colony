/* 자동 분리된 밸런스 데이터 — 이 파일의 수치만 고쳐도 밸런스가 바뀝니다 */
export default {
  meta: {
    startRes:      { scrap:150, fuel:60, alloy:0 },
    offlineCapH:   8,      // 오프라인 정산 최대 시간
    baseSlots:     2,      // 동시 유지 가능한 전초기지 수 (격납고로 증가)
    prepSec:       30,     // 건설(준비) 시간
    interWaveSec:  8,      // 웨이브 간 간격
    threatMeanMin: [0, 16, 12, 9, 6.5, 5],  // 위험도별 재공격 평균 간격(분)
    threatGraceMin:6,      // 재공격 경보 후 자동 상실까지(분) — 정찰로 연장
    abandonRefund: 0.4,    // 자진 철수 시 건설비 환급
    storeMinutes:  20,     // 저장고 기본 용량 = 분당 생산량 × 이 값
  },

  res: {
    scrap:{ name:'고철', icon:'▣', color:'#c98f4a' },
    fuel: { name:'연료', icon:'◍', color:'#d2b04a' },
    alloy:{ name:'희귀합금', icon:'◈', color:'#9fb6c8' },
  },
};
