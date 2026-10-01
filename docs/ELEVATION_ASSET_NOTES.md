# 고저차 에셋 시연 메모

## 사용 파일

- `assets/terrain/drafts/elevation-textures-v1.png`
- 기본 이미지 생성 도구로 만든 불투명 2×2 텍스처 시트다. 결과 해상도는 1254×1254이며 코드가 이미지 폭의 절반을 셀 크기로 사용한다.
- 위쪽 두 셀은 절벽 벽면 변형, 왼쪽 아래는 지면, 오른쪽 아래는 침식된 경사 지면이다.
- 지형 영역과 경계는 `lab/elevation-map-data.js`의 높이 데이터에서 만든다. 그림의 모양을 충돌 영역으로 사용하지 않는다.
- 앞을 향한 절벽은 높이 한 단계당 32단위 벽면 밴드를 반복한다. 뒤쪽 벽은 바닥을 덮지 않도록 벽면 대신 상단 경계를 표시한다.
- 현재는 연결 방식을 검증하는 초기 구현이다. 자연스러운 코너, 경계 변형, 텍스처 반복 이음새 보정은 후속 작업이다.

## 최종 생성 요청

```text
Production game terrain texture sheet, 1024x1024 square, exact 2x2 cells each512x512, no gutters and no labels. Low resolution crisp pixel art, restrained charcoal gray volcanic basalt with sparse muted gray green moss, natural untouched alien planet, 1990s RTS terrain. Top-left cell: seamless horizontally and vertically repeating flat VERTICAL CLIFF WALL texture, straight-on rock strata with narrow fissures, uniformly filled edge-to-edge, no grass skyline, no transparency, no ground plane, no perspective, no shadows outside. Top-right: second seamless variant of the same basalt vertical wall texture, slightly smaller rock fragments. Bottom-left: seamless top-down flat dusty gray-green rocky ground texture, low contrast with tiny gravel and sparse moss, edge-to-edge. Bottom-right: seamless top-down slightly eroded transition/ramp ground texture, same palette with small parallel natural erosion lines running vertically. All four cells must be completely filled rectangular texture samples, no rendered hill objects, no isolated assets, no corners illustrated, no frame, no diagram, no numbers, no logo, no watermark, no characters or man-made objects. This atlas will be cropped and tiled by game code around arbitrary plateau and canyon edges; no whole hill sprite.
```
