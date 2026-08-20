/* 자동 분리된 밸런스 데이터 — 이 파일의 수치만 고쳐도 밸런스가 바뀝니다 */
export default {
  classes: {
    assault:  { name:'돌격병',   hp:112, spd:94, pref:'shotgun', perk:'근접 피해 +15%',   perkDmgNear:1.15 },
    marksman: { name:'사수',     hp:96,  spd:88, pref:'rifle',   perk:'사거리 +15%',      perkRange:1.15 },
    engineer: { name:'공병',     hp:106, spd:84, pref:'rifle',   perk:'포탑 내구 +30%',   perkTurret:1.30 },
    heavy:    { name:'중화기병', hp:134, spd:74, pref:'hmg',     perk:'받는 피해 -12%',   perkArmor:0.88 },
    pyro:     { name:'화공병',   hp:104, spd:82, pref:'flamer',  perk:'화상 피해 +40%',   perkBurn:1.40 },
  },

  prefBonus: 1.12,

  operators: {
    gunnery:{ name:'포격 관제', ability:'궤도 포격', desc:'지정 지점에 모선 주포 사격 (피해 110)',
              passive:'없음', cd:30, dmg:110, radius:52 },
    recon:  { name:'정찰 관제', ability:'조명탄',   desc:'범위 내 적 이동 속도 -45% (6초)',
              passive:'분대 사거리 +10%', cd:22, radius:78, slow:0.55, dur:6, passRange:1.10 },
    supply: { name:'보급 관제', ability:'보급 낙하', desc:'분대 전원 체력 35% 회복',
              passive:'출격 시 탄창 1개 절약', cd:38, heal:0.35 },
    tech:   { name:'공학 관제', ability:'긴급 수리', desc:'거점·포탑 내구 30% 복구',
              passive:'포탑 화력 +20%', cd:30, repair:0.30, passTurret:1.20 },
  },

  personnel: {
    startCapacity: 6,          // 거주구 Lv.0 정원 (전투원 + 오퍼레이터 합산)
    perQuarters: 2,            // 거주구 레벨당 정원 증가
    injuryMinutes: 15,         // 기본 회복 시간
    medbayCut: 0.25,           // 의무실 레벨당 회복 시간 단축 비율
    injuredHpPenalty: 0.65,    // 부상 상태로 출격 시 최대 체력 배율
    recruitCost: { scrap:180, fuel:40 },
    recruitOpCost: { scrap:260, alloy:6 },
    firstNames: ['반','오르타','두굴','마르타','케이','네르바','솔','하딘','비크','유나','로렌','타샤','굴','메이','아즈','피오'],
    lastNames:  ['','·홉','·레이','·콘','·스카','·발트','·미르','·유','·크로','·펜'],
  },
};
