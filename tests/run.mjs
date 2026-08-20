/* 빌드 결과물(dist)을 띄우고 전 시나리오를 순서대로 돌린다 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio:'ignore', detached:true });
await sleep(2500);
let failed = 0;
for (const spec of ['flow-map','flow-loop','flow-galaxy','flow-crew','flow-casualty']){
  console.log('\n──────── ' + spec + ' ────────');
  const code = await new Promise(res => {
    const p = spawn(process.execPath, ['tests/' + spec + '.mjs'], { stdio:'inherit' });
    p.on('exit', res);
  });
  if (code !== 0){ failed++; console.log('✗ ' + spec + ' 실패 (exit ' + code + ')'); }
}
try { process.kill(-server.pid); } catch {}
console.log(failed ? '\n✗ 실패 ' + failed + '건' : '\n✓ 전 시나리오 통과');
process.exit(failed ? 1 : 0);
