import assert from 'node:assert/strict';
import {field,CREW_START,SITE,boundaries,TILE} from '../lab/elevation-map-data.js';
import {createWeaponRules} from '../lab/terrain-weapons.js';
import {createSquadMovement} from '../lab/squad-movement.js';

assert.equal(field.heightAt({x:200,y:900}),1);
assert.equal(field.heightAt({x:480,y:880}),2);
assert.equal(field.heightAt({x:928,y:320}),3);
assert.equal(field.heightAt({x:1536,y:672}),0);
assert.ok(boundaries.length>20);
assert.ok(field.canTravel({x:300,y:880},{x:350,y:880}),'one level step is walkable without a ramp');
assert.equal(field.canTravel({x:600,y:320},{x:680,y:320}),false,'two level cliff cannot be climbed directly');
assert.ok(field.canTravel({x:832,y:800},{x:832,y:450}),'wide ramp connects plateau to plain');
assert.equal(field.canTravel({x:1344,y:640},{x:1472,y:640}),false,'three level canyon cliff blocks walking');
assert.ok(field.canTravel({x:1536,y:1000},{x:1536,y:700}),'canyon has a walkable stepped exit');
for(const p of [{x:928,y:320},{x:480,y:880},{x:1536,y:672},{x:832,y:640}]){
  const q=field.pickGround(field.project(p));assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<.001,'projected feet resolve to the correct height');
}
const rules=createWeaponRules(field),low={x:600,y:320,weapon:'rifle'},high={x:660,y:320,weapon:'rifle'};
assert.equal(rules.canSee(low,{x:750,y:320}),false,'low observer cannot see through raised terrain');
assert.equal(rules.canSee(high,{x:750,y:320}),true,'high observer sees along the plateau');
assert.equal(rules.canSee(high,{x:600,y:320}),true,'high observer can look down over the edge');
assert.equal(rules.canSee({x:1384,y:640,weapon:'rifle',eye:1.2},{x:1536,y:672,eye:.65}),true,'observer near the canyon lip can see the floor');
assert.equal(rules.canSee({x:1536,y:672,weapon:'rifle',eye:1.2},{x:1326,y:622,eye:.65}),false,'canyon wall hides a target set back from the upper rim');
for(const goal of [SITE,{x:480,y:880},{x:1536,y:672}]){
  const crew=CREW_START.map((p,id)=>({...p,id,path:[]})),movement=createSquadMovement(field);
  assert.equal(movement.order(crew,goal),0);
  let i=0;for(;i<12000&&crew.some(u=>u.path.length);i++)movement.update(crew,1/30);
  assert.ok(i<12000&&crew.every(u=>!u.stuck),`squad reaches ${JSON.stringify(goal)}`);
}
assert.equal(TILE,64);
console.log('PASS: reusable elevation borders, one-step traversal, ramp, canyon exit, height-aware sight, picking and squad routes');
