# 미개척 행성 테스트 맵

## 범위

- 주소: `/lab/field-map.html`. 기존 판정실과 전투 프로토타입은 유지한다.
- 1920×1120 고정 맵. 사람이나 시설이 존재했던 흔적 없이 자연 지형만 배치한다.
- 착륙 구역, 암석 지대, 고지대, 암석 협곡, 설치 예정지. 양 끝 지점은 지도 표식일 뿐 건물이 아니다.
- 분대 이동, 경사로와 우회 경로, 개별 발 위치 정렬, 시야 공유와 개별 무기 사거리/차폐 판정을 시험한다.
- 적은 위치 고정 테스트 표적이다. 자동 교전, 적 AI, 디펜스 진행, 채굴, 보급, 회수는 아직 넣지 않았다.
- 광맥과 식생에는 별도로 작성한 바닥 충돌 영역이 있다. 이미지 전체를 충돌 영역으로 쓰지 않는다.

## 조작

- 우클릭: 분대 이동. 적 좌클릭: 분대 집중 사격. 대원 좌클릭 또는 1~4: 선택.
- 휠: 포인터 기준 줌. 가운데 버튼 드래그 또는 스페이스+드래그: 카메라 이동.
- WASD/방향키: 카메라 이동. M: 대원 추적 전환. Esc: 정지.
- 미니맵 또는 관측 지점: 카메라 이동만 수행하며 대원은 순간이동하지 않는다.
- 터치: 지점 탭 이동/표적 탭 공격, 드래그 카메라 이동. 배율 슬라이더 사용.

## 에셋

- `assets/terrain/drafts/natural-cover-atlas-v1.png`: 추가 자연 엄폐물 여섯 종류. 실제 1536×1024이며 생성 결과에 맞춰 개별 소스 영역과 발 접점을 지정했다.
- 추가 침엽수 5개, 넓은 수관 나무 4개, 활성 간헐천 3개, 휴면 분화구 3개, 반투명 결정 3개, 낮은 식생 5개.
- 전체 자연물은 67개에서 44개로 줄였다. 동일 이미지의 접지점 간격은 최소 220 이상이며 이동 공간과 여백을 확보한다.

## 시야와 탄환 차폐

- 미탐색 지역은 불투명 검정, 탐색했지만 현재 시야가 없는 지역은 66% 반투명 검정 덮개, 현재 시야 안은 원래 화면으로 표시한다. 탐색 기록은 분대의 시야로만 누적하며 카메라 이동으로 해제되지 않는다. 전장과 미니맵에 같은 안개를 사용하고 초기화 시 탐색 기록도 지운다.
- 바닥 안개는 지형물을 그리기 전에 적용한다. 나무·바위·고지대·경사로는 높이와 여러 표본 지점의 시야로 개별 발견 여부를 판단하고, 자신의 앞면에 닿은 시야는 발견으로 인정한다. 보이는 물체는 전체 스프라이트를 표시하며, 발견 후 시야 밖인 물체는 알파를 보존한 검정 음영으로 남긴다. 지형물 윗부분을 바닥용 마스크로 잘라 가리지 않는다.
- 초록: 보이고 사격 경로 확보. 주황: 보이지만 사격 경로 차폐. 빨강: 선택 대원 시야 차단.
- 무기 사거리는 별도로 판단한다. 경로가 열려 있어도 사거리 밖이면 발사하지 않는다.
- `visionHeight`, `shotHeight`는 장애물이 서 있는 지면 기준 높이다. 시야는 눈에서 눈으로, 사격은 총구에서 표적 몸통으로 검사한다.
- `visionHit`, `shotHit`, 이동용 `hit`를 따로 쓸 수 있다. 나무 수관은 넓은 시야 차폐 범위, 뿌리는 작은 이동 충돌 범위를 사용한다.
- 반투명 결정은 시야를 통과시키고 탄환을 막는다. 가스는 시야를 막지만 기체 자체는 탄환을 막지 않으며 바닥의 낮은 분출구만 고체로 취급한다.
- 낮은 식생은 걸어 지나갈 수 있다. 고지대에서 낮은 장애물을 넘는 광선은 통과하고, 여전히 광선보다 높은 장애물은 차단한다.
- 분대원이 대신 발견한 적은 공격 명령을 공유할 수 있지만, 각 대원의 실제 탄도 차폐와 사거리는 따로 검사한다.
- 표적 판정 패널은 검증용으로 시야 거리 내 숨은 표적도 차단 상태로 표시한다. 실제 화면의 안개 속 위치를 드러내지는 않는다.
- 간헐천은 고정 암석 위에서 픽셀 가스가 상승·확산·소멸한다. 5.8초 주기로 분출 강도가 변하며 위치별로 타이밍을 분산한다. 약한 분출도 지속되므로 기존 고정 시야 차단 판정은 유지한다. 독성 피해와 바람에 따른 판정 변화는 아직 없다.

- `assets/terrain/drafts/regolith-tile-v1.png`: 자연 지면 반복 텍스처.
- `assets/terrain/drafts/nature-atlas-v1.png`: 투명 배경 암석/광맥/식생/현무암 2×2 시트. 실제 출력 1254×1254, 셀 627×627.
- 기존 `terrain-spritesheet-v3.png`의 자연 암석, 바위 기둥, 고지대와 경사로도 재사용한다. 금속 벽/인공 기둥은 사용하지 않는다.
- 내장 이미지 생성 도구로 생성했다. 자연 시트는 투명 여백과 네 셀의 실제 픽셀 존재를 검사했다.

## 검증

`node tests/field-map.mjs`, `node tests/field-assets.mjs`, `node tests/terrain-demo.mjs`, `node tests/terrain-weapons.mjs`, `node tests/terrain-occlusion.mjs`, `node tests/field-animation.mjs`, `node tests/field-fog.mjs`

## 생성 요청문

### 추가 자연 엄폐물

Use case: stylized-concept. Production low-resolution pixel-art game atlas for a pristine uninhabited alien planet, top-down camera with small visible front faces, NOT isometric diamond perspective. Exact 3 columns by 2 rows, six equal square cells, output landscape1536x1024. No labels, no grid lines, no border, no text, no artificial objects. ALL background actually transparent alpha0, no painted black background, no checkerboard, no glows, no haze behind sprites. Limited muted moss green, blue-green leaves, charcoal volcanic stone, pale turquoise crystals. Hard 1990s strategy-game pixels, no smooth painting. Every asset fully within its own cell with generous transparent margins and bottom foot contact at local y410 of512. TOP LEFT: a tall alien conifer tree, visible dark trunk and compact layered dull green needles. TOP MIDDLE: a wide alien broadleaf tree with twisted trunk and dense dark blue-green crown. TOP RIGHT: active natural gas geyser, small volcanic vent at base and a compact vertical pale green-gray opaque steam plume, pale pixel clusters not blurred glow, fully contained within cell. BOTTOM LEFT: dormant rocky gas vent, low cracked volcanic mound with a small dark opening and no plume. BOTTOM MIDDLE: a low broad cluster of pale semi-transparent faceted mineral slabs/crystals among stones, enough transparent gaps between slabs to see through. BOTTOM RIGHT: low alien grass and fern patch. Consistent lighting from upper left, crisp silhouettes, natural wilderness only. Shadows tightly attached to ground contacts.

투명 배경과 셀 내부 배치를 정리하는 이미지 편집을 한 번 수행했다. 모든 생성/편집에는 내장 이미지 생성 도구를 사용했다.

### 자연 시트

Transparent alpha game spritesheet 1024x1024 exact 2x2 grid each cell512x512. Four entirely natural features of an uninhabited alien planet. TOP LEFT: low cluster of gray-green rounded volcanic boulders. TOP RIGHT: low turquoise mineral outcrop, natural unmined crystals among gray rock. BOTTOM LEFT: clump of alien dull green fern-like succulent vegetation and a few mossy stones, no glow. BOTTOM RIGHT: tall thin jagged dark basalt rock formation. NO artificial objects, NO buildings, NO landing pad, NO machinery, NO vehicle tracks, NO people, NO lettering or grid separators. Low-resolution hard-edged pixel art from 1990s SF strategy games, top-down with subtle visible front faces, consistent overhead camera (not diamond isometric). Limited gray green charcoal cyan mineral palette. Each object fully inside its cell centered x256, bottom ground contact y400 in local cell, generous transparent margin all sides. Background actual alpha zero; no black painted backdrop, no checkerboard painted backdrop, no gradient, no glow haze. Tight small attached contact shadow only. Natural alien wilderness.

### 지면 텍스처

A single seamless repeating ground texture for a top-down low-resolution pixel-art SF game on a pristine uninhabited alien planet. 1024x1024 square, edge-to-edge opaque texture of muted gray-green volcanic regolith with very sparse tiny gravel and patches of dusty moss. Low contrast readable as a playable walking surface, no large rocks, no elevation, no craters that imply collision. Crisp hard pixel boundaries, limited restrained palette, 1990s strategy game density, pixels approximately4sourcepixels. No buildings, no paths, no tire tracks, no machinery, no grid, no labels, no text, no gradients, no blurring, no lighting vignette, no artificial features. All four edges tile seamlessly. Flat natural terrain texture only.


