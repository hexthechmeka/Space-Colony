import assert from 'node:assert/strict';
import {field} from '../lab/field-map-data.js';
import {geyserParticles,drawGeyser} from '../lab/geyser-animation.js';

assert.equal(field.obstacles.length,44);
for(let i=0;i<field.obstacles.length;i++)for(let j=i+1;j<field.obstacles.length;j++){
  const a=field.obstacles[i],b=field.obstacles[j];
  if(a.atlas!==b.atlas||a.src.join()!==b.src.join())continue;
  assert.ok(Math.hypot(a.hit[0]-b.hit[0],a.hit[1]-b.hit[1])>=220,`${a.id}/${b.id}: repeated assets too close`);
}
const geysers=field.obstacles.filter(o=>o.kind==='geyser'),g=geysers[0];
assert.notDeepEqual(geyserParticles(g,1000),geyserParticles(g,1600));
assert.deepEqual(geyserParticles(g,1000),geyserParticles(g,1000));
assert.notDeepEqual(geyserParticles(g,1000).map(p=>p.alpha),geyserParticles(geysers[1],1000).map(p=>p.alpha));
for(let time=0;time<12000;time+=100){
  for(const p of geyserParticles(g,time)){
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    assert.ok(p.alpha>=0&&p.alpha<=.54);
    assert.ok(p.y<=g.hit[1]-30&&p.y>=g.hit[1]-152);
    assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));
  }
}
const base=[],clouds=[];let saved=0;
const ctx={drawImage(...args){base.push(args)},save(){saved++},restore(){saved--},fillRect(...args){clouds.push(args)}};
drawGeyser(ctx,{},g,1400);
assert.equal(saved,0);assert.equal(base.length,1);assert.equal(base[0][2],420);
assert.equal(clouds.length,110);
assert.ok(clouds.every(c=>c.every(Number.isInteger)));
console.log('PASS: sparse layout, repeated asset spacing, rising pixel gas, staggered emission, rock base crop');
