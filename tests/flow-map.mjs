import pw from 'playwright';
const { chromium } = pw;
const URL='http://127.0.0.1:4173/index.html';
const errs=[]; const browser=await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page=await (await browser.newContext({viewport:{width:1440,height:900}})).newPage();
page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const click = async (l) => { const r = await page.evaluate(x=>__fo.click(x), l); if(r!=='OK') console.log('   click 실패:', r); return r; };

await page.goto(URL); await page.waitForTimeout(800);
console.log('1) 씬:', await page.evaluate(()=>__fo.scene), '| 모달:', await page.evaluate(()=>__fo.modal?.type));
console.log('   버튼:', await page.evaluate(()=>__fo.labels()));
await page.screenshot({path:'/root/fo-repo/test-results/v2_help.png'});
await click('알겠다'); await page.waitForTimeout(400);
await page.screenshot({path:'/root/fo-repo/test-results/v2_bridge.png'});
console.log('2) 브리지 버튼:', await page.evaluate(()=>__fo.labels()));

await click('항행 도표'); await page.waitForTimeout(600);
await page.screenshot({path:'/root/fo-repo/test-results/v2_starmap.png'});
console.log('3) 성계도 버튼:', await page.evaluate(()=>__fo.labels()));

// 잠긴 행성 클릭 → 거부, 현재 행성 클릭 → 지표 진입
await click('planet:cerberus'); await page.waitForTimeout(300);
console.log('   잠긴 행성 클릭 후 씬:', await page.evaluate(()=>__fo.scene));
await click('planet:rubicon'); await page.waitForTimeout(500);
console.log('4) 지표 씬:', await page.evaluate(()=>__fo.scene), '| 마커:', await page.evaluate(()=>__fo.labels().filter(l=>l.startsWith('site:'))));
await click('site:r1'); await page.waitForTimeout(400);
await page.screenshot({path:'/root/fo-repo/test-results/v2_planet.png'});
console.log('   선택 후 버튼:', await page.evaluate(()=>__fo.labels()));

await click('개척 편성'); await page.waitForTimeout(300); await click('launch'); await page.waitForTimeout(500);
console.log('5) 전투 진입:', await page.evaluate(()=>({scene:__fo.scene, phase:__fo.B.phase, waves:__fo.B.waveDefs.length})));
await page.screenshot({path:'/root/fo-repo/test-results/v2_prep.png'});
await page.evaluate(()=>{ __fo.B.auto=true; __fo.B.prepLeft=0; });
await page.waitForTimeout(3000);
await page.screenshot({path:'/root/fo-repo/test-results/v2_battle.png'});
console.log('   교전:', await page.evaluate(()=>({enemies:__fo.B.enemies.length, kills:__fo.B.kills, core:Math.round(__fo.B.core.hp)})));
await page.waitForFunction(()=>!__fo.B.active,null,{timeout:180000}).catch(()=>console.log('   (전투 대기 초과)'));
await page.waitForTimeout(400);
console.log('6) 결과 모달:', await page.evaluate(()=>__fo.modal?.type), '| 승리:', await page.evaluate(()=>__fo.modal?.rep?.won));
await page.screenshot({path:'/root/fo-repo/test-results/v2_result.png'});
await click('귀환'); await page.waitForTimeout(400);
console.log('   r1:', await page.evaluate(()=>__fo.S.sites.r1.status), '| r2:', await page.evaluate(()=>__fo.S.sites.r2.status));

// 개조 화면
await page.evaluate(()=>{ __fo.grant({scrap:9000,fuel:6000,alloy:600}); __fo.goto('tech'); });
await page.waitForTimeout(400);
await page.screenshot({path:'/root/fo-repo/test-results/v2_tech.png'});
console.log('7) 개조 버튼:', await page.evaluate(()=>__fo.labels()));
await click('tech:warp'); await click('tech:warp');
await page.waitForTimeout(300);
console.log('   항속:', await page.evaluate(()=>__fo.S.tech.ship.warp));

// 항행 연출
await page.evaluate(()=>__fo.goto('starmap')); await page.waitForTimeout(400);
await click('planet:cerberus');
await page.waitForTimeout(700);
await page.screenshot({path:'/root/fo-repo/test-results/v2_travel.png'});
console.log('8) 항행 중 씬:', await page.evaluate(()=>__fo.scene));
await page.waitForTimeout(1800);
console.log('   도착 후:', await page.evaluate(()=>({scene:__fo.scene, at:__fo.S.at})));
await page.screenshot({path:'/root/fo-repo/test-results/v2_planet2.png'});

console.log('\n콘솔 오류:', errs.length?errs.slice(0,8):'없음');
await browser.close();
