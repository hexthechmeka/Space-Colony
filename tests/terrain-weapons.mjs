import assert from 'node:assert/strict';
import {WEAPONS,VISION_RANGE,canSee,firingState} from '../lab/terrain-weapons.js';

assert.deepEqual(Object.keys(WEAPONS),['pistol','pdw','rifle','sniper','beam']);
const u={x:50,y:40,eye:1.2};
for(const [weapon,w] of Object.entries(WEAPONS)){
  const user={...u,weapon};
  assert.ok(w.interval>0&&w.damage>0);
  assert.equal(firingState(user,{x:u.x+w.range,y:u.y},true).status,'ready','inclusive range boundary');
  assert.equal(firingState(user,{x:u.x+w.range+.01,y:u.y},true).status,'far');
  assert.equal(firingState(user,{x:100,y:40},false).status,'unseen');
  assert.equal(canSee(user,{x:200,y:40}),true,'changing weapons must not change vision');
}
const distant={x:50+VISION_RANGE+20,y:40};
assert.equal(canSee(u,distant),false);
assert.equal(firingState({...u,weapon:'sniper'},distant).status,'unseen','long range does not grant vision');
assert.equal(firingState({...u,weapon:'sniper'},distant,true).status,'ready','explicit spotting can grant target knowledge');
assert.equal(firingState({...u,weapon:'pistol'},{x:250,y:40}).status,'far','visible target can be out of range');
const rear={x:376,y:450,eye:1.2,weapon:'rifle'},front={x:376,y:560};
assert.equal(canSee(rear,front),false);
assert.equal(firingState(rear,front,true).status,'blocked','known target behind pillar cannot be shot');
const highEyes={...rear,eye:3};
const otherHighEyes={...front,eye:3};
assert.equal(canSee(highEyes,otherHighEyes),true);
assert.equal(firingState(highEyes,otherHighEyes).status,'blocked','clear eye ray must not imply clear muzzle ray');
console.log('PASS: five weapon groups, range boundaries, independent vision, muzzle obstruction');
