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

- `assets/terrain/drafts/regolith-tile-v1.png`: 자연 지면 반복 텍스처.
- `assets/terrain/drafts/nature-atlas-v1.png`: 투명 배경 암석/광맥/식생/현무암 2×2 시트. 실제 출력 1254×1254, 셀 627×627.
- 기존 `terrain-spritesheet-v3.png`의 자연 암석, 바위 기둥, 고지대와 경사로도 재사용한다. 금속 벽/인공 기둥은 사용하지 않는다.
- 내장 이미지 생성 도구로 생성했다. 자연 시트는 투명 여백과 네 셀의 실제 픽셀 존재를 검사했다.

## 검증

`node tests/field-map.mjs`, `node tests/field-assets.mjs`, `node tests/terrain-demo.mjs`, `node tests/terrain-weapons.mjs`

## 생성 요청문

### 자연 시트

Transparent alpha game spritesheet 1024x1024 exact 2x2 grid each cell512x512. Four entirely natural features of an uninhabited alien planet. TOP LEFT: low cluster of gray-green rounded volcanic boulders. TOP RIGHT: low turquoise mineral outcrop, natural unmined crystals among gray rock. BOTTOM LEFT: clump of alien dull green fern-like succulent vegetation and a few mossy stones, no glow. BOTTOM RIGHT: tall thin jagged dark basalt rock formation. NO artificial objects, NO buildings, NO landing pad, NO machinery, NO vehicle tracks, NO people, NO lettering or grid separators. Low-resolution hard-edged pixel art from 1990s SF strategy games, top-down with subtle visible front faces, consistent overhead camera (not diamond isometric). Limited gray green charcoal cyan mineral palette. Each object fully inside its cell centered x256, bottom ground contact y400 in local cell, generous transparent margin all sides. Background actual alpha zero; no black painted backdrop, no checkerboard painted backdrop, no gradient, no glow haze. Tight small attached contact shadow only. Natural alien wilderness.

### 지면 텍스처

A single seamless repeating ground texture for a top-down low-resolution pixel-art SF game on a pristine uninhabited alien planet. 1024x1024 square, edge-to-edge opaque texture of muted gray-green volcanic regolith with very sparse tiny gravel and patches of dusty moss. Low contrast readable as a playable walking surface, no large rocks, no elevation, no craters that imply collision. Crisp hard pixel boundaries, limited restrained palette, 1990s strategy game density, pixels approximately4sourcepixels. No buildings, no paths, no tire tracks, no machinery, no grid, no labels, no text, no gradients, no blurring, no lighting vignette, no artificial features. All four edges tile seamlessly. Flat natural terrain texture only.


