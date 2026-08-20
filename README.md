# 프론티어 아웃포스트 (Frontier Outpost)

개척 전함에서 행성으로 분대를 내려보내 전초기지를 세우고 지켜내는 **픽셀 SF 스팀펑크 디펜스**.
캔버스로만 그리는 웹 게임이며 외부 이미지·폰트·백엔드가 없습니다.

```
브리지 → 항행 도표 → 행성 지표 → 출격 편성 → 강하 전투 → 확보 → 자원 회수 → 재공격 방어
```

## 개발

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/ 정적 번들 (Vercel 배포 대상)
npm run build:single   # dist-single/index.html — 단일 HTML 산출물
npm test           # dist 를 띄우고 Playwright 시나리오 전부 실행
```

테스트에 브라우저가 필요합니다: `npx playwright install chromium`
(이미 크로미움이 있다면 `CHROME_PATH=/경로/chrome npm test` 로 지정 가능)

## 배포 (Vercel)

리포지토리를 Vercel에 연결하면 `vercel.json` 설정대로 `npm run build` → `dist` 를 서빙합니다.
푸시할 때마다 프리뷰 URL이 생성됩니다.

## 구조

```
src/
  main.js          진입점 · 입력 · 메인 루프 · 테스트 훅
  core/            util 저장소 상태 경제 사운드 앱공유상태
  data/            ★ 밸런스 수치 (meta planets enemies weapons crew tech galaxy)
  ui/              캔버스 레이아웃 · 픽셀 아이콘 · 위젯(패널/버튼/게이지/텍스트)
  art/             우주 행성 모선 지표 은하 초상 전투스프라이트
  scenes/          bridge starmap galaxymap planet tech crew modals common
  battle/          state(편성→유닛 생성) sim(업데이트) render hud
```

### 화면 구성

논리 해상도 **640×360(16:9) 고정**을 정수 배율로 확대하고 남는 영역은 레터박스 처리합니다.
캔버스가 두 겹입니다 — `#px`(픽셀 아트, 확대해도 도트 유지) 위에 `#ui`(텍스트 전용, 기기 해상도).

### 밸런스 수정

`src/data/*.js` 의 수치만 고치면 됩니다. 각 파일은 도메인 하나만 담고 있습니다.
상세 스키마는 `docs/데이터가이드.md` 참고.

### 저장 데이터

`localStorage` 의 `fo_save_v2`(진행) / `fo_opt_v2`(설정).
저장소가 차단된 환경에서는 메모리 폴백으로 동작하며 화면에 상태를 표시합니다.

## 조작

| 화면 | 조작 |
|---|---|
| 항행 도표 | 드래그 이동 · 휠 확대/축소 · 최대 축소에서 한 번 더 → 성간 지도 |
| 전투 | `WASD` 이동 · 마우스 조준 · 좌클릭 사격 · `Space` 오퍼레이터 지원 · `T` 자동 전투 · `B` 포탑 배치 · `Esc` 일시정지 |
