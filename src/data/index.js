/* ═══ 밸런스 데이터 조립 ═══════════════════════════════════════════
   도메인별 파일을 하나의 DATA 객체로 합칩니다.
   레벨 디자인을 교체할 때는 각 파일의 수치만 고치면 됩니다.
   ═══════════════════════════════════════════════════════════════ */
import meta from './meta.js';
import planets from './planets.js';
import enemies from './enemies.js';
import weapons from './weapons.js';
import crew from './crew.js';
import tech from './tech.js';
import galaxy from './galaxy.js';

export const DATA = { ...meta, ...planets, ...enemies, ...weapons, ...crew, ...tech, ...galaxy };
export default DATA;
