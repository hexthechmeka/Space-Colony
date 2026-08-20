import pw from 'playwright';
const { chromium } = pw;
const errs=[]; const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await (await b.newContext({viewport:{width:1440,height:900}})).newPage();
page.on('pageerror',e=>errs.push('PAGEERROR: '+e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const click = async l => { await page.waitForTimeout(130); const r=await page.evaluate(x=>__fo.click(x),l); if(r!=='OK')console.log('   실패:',r); await page.waitForTimeout(160); return r; };
const labels = () => page.evaluate(()=>__fo.labels());
await page.goto('http://127.0.0.1:4173/index.html'); await page.waitForTimeout(800);
await click('알겠다');
console.log('1) 초기 승무원:', await page.evaluate(()=>__fo.crew.map(c=>c.name+'/'+c.cls)), '| 오퍼:', await page.evaluate(()=>__fo.ops.map(o=>o.name+'/'+o.type)));
console.log('   브리지 버튼:', await labels());
await click('승무원'); await page.waitForTimeout(300);
console.log('2) 명부 화면 버튼:', await labels());
await page.screenshot({path:'/root/fo-repo/test-results/v6_crew.png'});

// 로드아웃 변경
await click('crew:c1'); await click('w:shotgun');
console.log('3) 무기 변경(잠금 확인):', await page.evaluate(()=>__fo.crew[0].load.w));
await page.evaluate(()=>{ __fo.tech('trooper','arsenal',3); __fo.tech('trooper','kit',3); __fo.grant({scrap:9000,fuel:4000,alloy:600}); });
await click('crew:c1'); await click('w:shotgun'); await click('g:plate'); await click('a:ap');
console.log('   변경 후:', await page.evaluate(()=>__fo.crew[0].load));
await page.screenshot({path:'/root/fo-repo/test-results/v6_loadout.png'});

// 탄창 제작
const before = await page.evaluate(()=>__fo.S.ammo.ap);
await click('craft');
console.log('4) 탄창 제작:', before, '→', await page.evaluate(()=>__fo.S.ammo.ap));

// 모집
await click('recruit');
console.log('5) 모집 후 인원:', await page.evaluate(()=>__fo.crew.length), '| 정원:', await page.evaluate(()=>__fo.S.tech.ship.quarters||0));
await click('recruit-op');
console.log('   오퍼레이터:', await page.evaluate(()=>__fo.ops.map(o=>o.type)));

// 출격 편성 진입
await click('to-bridge'); await page.waitForTimeout(200);
await click('루비콘-4 지표'); await page.waitForTimeout(300);
await click('site:r1'); await click('개척 편성'); await page.waitForTimeout(300);
console.log('6) 편성 모드:', await page.evaluate(()=>__fo.pending), '| 씬:', await page.evaluate(()=>__fo.scene));
console.log('   버튼:', await labels());
await page.screenshot({path:'/root/fo-repo/test-results/v6_deploy.png'});

// 한 명 빼고 출격
await click('unslot:3'); await page.waitForTimeout(200);
const ammoBefore = await page.evaluate(()=>__fo.S.ammo.ap);
await click('launch'); await page.waitForTimeout(400);
console.log('7) 출격:', await page.evaluate(()=>({scene:__fo.scene, units:__fo.B.units.length, names:__fo.B.units.map(u=>u.def.name), weapons:__fo.B.units.map(u=>u.w.name)})));
console.log('   탄창 소모:', ammoBefore, '→', await page.evaluate(()=>__fo.S.ammo.ap));

// 전투 강제 종료 (패배시키기: 대원 전멸 유도 대신 승리 진행)
await page.evaluate(()=>{ __fo.B.auto=true; __fo.B.prepLeft=0; });
await page.waitForFunction(()=>!__fo.B.active,null,{timeout:240000}).catch(()=>console.log('   (대기 초과)'));
await page.waitForTimeout(300);
console.log('8) 결과:', await page.evaluate(()=>({won:__fo.modal?.rep?.won, injured:__fo.modal?.rep?.injured, dead:__fo.modal?.rep?.dead})));
console.log('   출격 기록:', await page.evaluate(()=>__fo.crew.map(c=>c.name+':'+c.missions+'회/'+c.kills+'킬/'+c.status)));
await page.screenshot({path:'/root/fo-repo/test-results/v6_result.png'});
console.log('\n콘솔 오류:', errs.length?errs.slice(0,6):'없음');
await b.close();
