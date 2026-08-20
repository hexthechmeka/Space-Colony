import pw from 'playwright';
const { chromium } = pw;
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
const errs=[]; page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const click = async l => { await page.waitForTimeout(130); const r=await page.evaluate(x=>__fo.click(x),l); if(r!=='OK')console.log('   실패:',r,await page.evaluate(()=>__fo.labels())); await page.waitForTimeout(160); return r; };
const mode = () => page.evaluate(()=>__fo.mapMode);
await page.goto('http://127.0.0.1:4173/index.html'); await page.waitForTimeout(700);
await click('알겠다'); await click('항행 도표');
console.log('1) 성계 지도 진입:', await mode(), '| 줌:', await page.evaluate(()=>__fo.cam.z));
console.log('   버튼:', await page.evaluate(()=>__fo.labels()));

// 버튼으로 성간 지도
await click('galaxy'); await page.waitForTimeout(600);
console.log('2) 버튼 → 모드:', await mode());
console.log('   성계 노드:', await page.evaluate(()=>__fo.labels().filter(l=>l.startsWith('sys:'))));
await page.screenshot({path:'/root/fo-repo/test-results/v5_galaxy.png'});

// 미해금 성계 클릭
await click('sys:karon');
console.log('3) 미해금 클릭 후 모드:', await mode());
// 현재 성계 클릭 → 성계 지도 복귀
await click('sys:skyla'); await page.waitForTimeout(500);
console.log('4) 현재 성계 클릭 → 모드:', await mode(), '| 줌:', await page.evaluate(()=>__fo.cam.z));

// 최대 축소에서 한 번 더 축소 → 성간 지도
const box = await page.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
await page.mouse.move(box.x+box.w/2, box.y+box.h/2);
await page.mouse.wheel(0, 300); await page.waitForTimeout(600);
console.log('5) 휠 축소(최대에서 한 번 더) → 모드:', await mode());
// 휠 확대로 복귀
await page.mouse.wheel(0, -300); await page.waitForTimeout(600);
console.log('6) 휠 확대 → 모드:', await mode(), '| 줌:', await page.evaluate(()=>__fo.cam.z));
await page.screenshot({path:'/root/fo-repo/test-results/v5_system.png'});

// 성간 지도에서 드래그해도 카메라 안 움직이는지
await click('galaxy'); await page.waitForTimeout(400);
const c1 = await page.evaluate(()=>({x:Math.round(__fo.cam.x),y:Math.round(__fo.cam.y)}));
await page.mouse.move(box.x+box.w/2, box.y+box.h/2); await page.mouse.down();
await page.mouse.move(box.x+box.w/2-300, box.y+box.h/2, {steps:8}); await page.mouse.up();
await page.waitForTimeout(200);
const c2 = await page.evaluate(()=>({x:Math.round(__fo.cam.x),y:Math.round(__fo.cam.y)}));
console.log('7) 성간 지도 드래그 무시:', JSON.stringify(c1)===JSON.stringify(c2), '| 모드:', await mode());
await click('back-system'); await page.waitForTimeout(400);
console.log('8) 돌아가기 → 모드:', await mode());
console.log('\n콘솔 오류:', errs.length?errs.slice(0,6):'없음');
await b.close();
