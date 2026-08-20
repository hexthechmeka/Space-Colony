import pw from 'playwright';
const { chromium } = pw;
const errs=[]; const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const click = async l => { await page.waitForTimeout(130); const r=await page.evaluate(x=>__fo.click(x),l); if(r!=='OK')console.log('   실패:',r); await page.waitForTimeout(160); return r; };
await page.goto('http://127.0.0.1:4173/index.html'); await page.waitForTimeout(800);
await click('알겠다');
await page.evaluate(()=>__fo.grant({scrap:9000,fuel:4000,alloy:600}));

// 1차 출격 → 전멸시켜 부상 유도
await page.evaluate(()=>__fo.openCrew({mode:'claim', siteId:'r1'}));
await page.waitForTimeout(300);
await click('launch'); await page.waitForTimeout(400);
await page.evaluate(()=>{ __fo.B.prepLeft=0; });
await page.waitForTimeout(1200);
await page.evaluate(()=>{ __fo.B.units.forEach(u=>{u.down=true;u.hp=0;}); __fo.B.core.hp = 1; });
await page.waitForFunction(()=>!__fo.B.active,null,{timeout:120000}).catch(()=>console.log('   (대기 초과)'));
await page.waitForTimeout(300);
console.log('1) 패배 결과 — 부상:', await page.evaluate(()=>__fo.modal?.rep?.injured), '| 전사:', await page.evaluate(()=>__fo.modal?.rep?.dead));
console.log('   명부 상태:', await page.evaluate(()=>__fo.crew.map(c=>c.name+':'+c.status+':'+(c.healAt?Math.round((c.healAt-Date.now())/60000)+'분':''))));
await click('귀환');

// 부상자 편성 시 체력 페널티 확인
await page.evaluate(()=>__fo.openCrew({mode:'claim', siteId:'r1'}));
await page.waitForTimeout(300);
await page.screenshot({path:'/root/fo-repo/test-results/v6_injured.png'});
console.log('2) 부상 상태 편성 가능:', await page.evaluate(()=>__fo.S.squad.length), '| 예상 체력:', await page.evaluate(()=>__fo.crew.map(c=>c.name+':'+__fo.crewMaxHp(c))));

// 2차 출격 → 다시 쓰러지면 전사
await click('launch'); await page.waitForTimeout(400);
console.log('   출격 유닛 체력:', await page.evaluate(()=>__fo.B.units.map(u=>u.def.name+':'+u.max)));
await page.evaluate(()=>{ __fo.B.prepLeft=0; });
await page.waitForTimeout(1000);
await page.evaluate(()=>{ __fo.B.units.forEach(u=>{u.down=true;u.hp=0;}); __fo.B.core.hp = 1; });
await page.waitForFunction(()=>!__fo.B.active,null,{timeout:120000}).catch(()=>console.log('   (대기 초과)'));
await page.waitForTimeout(300);
console.log('3) 2차 패배 — 부상:', await page.evaluate(()=>__fo.modal?.rep?.injured), '| 전사:', await page.evaluate(()=>__fo.modal?.rep?.dead));
console.log('   남은 명부:', await page.evaluate(()=>__fo.crew.map(c=>c.name)), '| 분대:', await page.evaluate(()=>__fo.S.squad));
await click('귀환');

// 의무실로 회복 단축 + 회복 처리
await page.evaluate(()=>{ __fo.tech('ship','medbay',3); __fo.crew.forEach(c=>{ if(c.status==='injured') c.healAt = Date.now()+500; }); });
await page.waitForTimeout(2200);
console.log('4) 회복 후 상태:', await page.evaluate(()=>__fo.crew.map(c=>c.name+':'+c.status)));
console.log('\n콘솔 오류:', errs.length?errs.slice(0,6):'없음');
await b.close();
