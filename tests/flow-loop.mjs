import pw from 'playwright';
const { chromium } = pw;
const URL='http://127.0.0.1:4173/index.html';
const errs=[]; const browser=await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page=await (await browser.newContext({viewport:{width:1440,height:900}})).newPage();
page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message));
page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const click = async l => { await page.waitForTimeout(120); const r = await page.evaluate(x=>__fo.click(x), l); if(r!=='OK') console.log('   click 실패:', r, '| 가능:', await page.evaluate(()=>__fo.labels())); await page.waitForTimeout(120); return r; };
const finish = async () => { await page.evaluate(()=>{ __fo.B.auto=true; __fo.B.prepLeft=0; __fo.B.interLeft=0; });
  await page.waitForFunction(()=>!__fo.B.active,null,{timeout:240000}).catch(()=>console.log('   (전투 대기 초과)')); await page.waitForTimeout(300); };

await page.goto(URL); await page.waitForTimeout(700);
await click('알겠다');
// 자원 지급 후 두 곳 개척
await page.evaluate(()=>{ __fo.grant({scrap:4000,fuel:2000,alloy:200}); __fo.goto('planet'); });
await page.waitForTimeout(300);
await click('site:r1'); await click('개척 편성'); await click('launch'); await finish(); await click('귀환');
await page.waitForTimeout(300);
await click('site:r2'); await click('개척 편성'); await click('launch'); await finish(); await click('귀환');
console.log('1) 확보 상태:', await page.evaluate(()=>({r1:__fo.S.sites.r1.status, r2:__fo.S.sites.r2.status, r3:__fo.S.sites.r3.status})));
console.log('   슬롯:', await page.evaluate(()=>__fo.S.sites && Object.values(__fo.S.sites).filter(s=>s.status==='held').length) + '/2');

// 저장고 회수 (자동 전송 미연구 상태)
await page.evaluate(()=>{ __fo.S.sites.r1.store = 120; });
await page.waitForTimeout(200);
await click('site:r1');
const before = await page.evaluate(()=>Math.floor(__fo.S.res.scrap));
await click('자원 회수');
console.log('2) 회수:', before, '→', await page.evaluate(()=>Math.floor(__fo.S.res.scrap)));

// 오프라인 정산
await page.goto('http://127.0.0.1:4173/blank.html');
await page.evaluate(()=>{ const s=JSON.parse(localStorage.getItem('fo_save_v2')); s.lastSeen=Date.now()-2*3600*1000; s.tech.outpost.relay=2; localStorage.setItem('fo_save_v2', JSON.stringify(s)); });
await page.goto(URL); await page.waitForTimeout(900);
console.log('3) 귀환 보고:', await page.evaluate(()=>__fo.modal?.type), '| 수령:', await page.evaluate(()=>JSON.stringify(__fo.modal?.rep?.gained)), '| 포위:', await page.evaluate(()=>__fo.modal?.rep?.threats));
await page.screenshot({path:'/root/fo-repo/test-results/v2_report.png'});
await click('확인');

// 포위 → 브리지 경보 → 방어전
await page.evaluate(()=>{ __fo.S.sites.r1.threatAt = Date.now(); __fo.goto('bridge'); });
await page.waitForTimeout(400);
await page.screenshot({path:'/root/fo-repo/test-results/v2_alert.png'});
console.log('4) 브리지 경보 버튼:', await page.evaluate(()=>__fo.labels()));
await click('방어 편성'); await page.waitForTimeout(200); await click('launch'); await page.waitForTimeout(300);
console.log('   방어전:', await page.evaluate(()=>({mode:__fo.B.mode, waves:__fo.B.waveDefs.length})));
await finish();
console.log('   결과:', await page.evaluate(()=>__fo.modal?.rep?.won), '| r1:', await page.evaluate(()=>({s:__fo.S.sites.r1.status, t:__fo.S.sites.r1.threatAt})));
await click('귀환');

// 모선 요격
await page.evaluate(()=>{ __fo.S.pendingShipRaid = true; __fo.goto('bridge'); });
await page.waitForTimeout(400);
await click('요격 대응'); await page.waitForTimeout(200); await click('launch'); await page.waitForTimeout(300);
console.log('5) 모선전:', await page.evaluate(()=>({mode:__fo.B.mode, coreMax:__fo.B.core.max})));
await page.waitForTimeout(2500);
await page.screenshot({path:'/root/fo-repo/test-results/v2_shipbattle.png'});
await finish();
console.log('   결과:', await page.evaluate(()=>__fo.modal?.rep?.won), '| 경보 해제:', await page.evaluate(()=>!__fo.S.pendingShipRaid));
await click('귀환');

// 지속성
const snap = await page.evaluate(()=>JSON.stringify({tech:__fo.S.tech, sites:Object.fromEntries(Object.entries(__fo.S.sites).map(([k,v])=>[k,v.status])), at:__fo.S.at}));
await page.reload(); await page.waitForTimeout(900);
const snap2 = await page.evaluate(()=>JSON.stringify({tech:__fo.S.tech, sites:Object.fromEntries(Object.entries(__fo.S.sites).map(([k,v])=>[k,v.status])), at:__fo.S.at}));
console.log('6) 새로고침 후 동일:', snap===snap2);
console.log('   씬:', await page.evaluate(()=>__fo.scene));
console.log('\n콘솔 오류:', errs.length?errs.slice(0,8):'없음');
await browser.close();
