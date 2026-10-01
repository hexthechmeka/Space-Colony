import assert from 'node:assert/strict';
import {WEAPONS,VISION_RANGE,canSee,firingState,createWeaponRules} from '../lab/terrain-weapons.js';
import {createTerrain} from '../lab/terrain-geometry.js';

assert.deepEqual(Object.keys(WEAPONS),['pistol','pdw','rifle','sniper','shotgun','machinegun','beam','beamSniper']);
assert.equal(WEAPONS.rifle.range,550);assert.equal(WEAPONS.pdw.range,350);assert.equal(WEAPONS.sniper.range,700);
assert.equal(WEAPONS.rifle.spread,.035);assert.equal(WEAPONS.pdw.spread,.06);
assert.ok(WEAPONS.pdw.spread>WEAPONS.rifle.spread,'PDW has a wider firing cone than AR');
const selectedRules=createWeaponRules(createTerrain({obstacles:[]}));
for(const weapon of ['sniper','beamSniper']){
  const selectedUser={x:50,y:40,weapon,selected:true};
  const edge={x:50+WEAPONS[weapon].range,y:40};
  assert.equal(selectedRules.visionRange(selectedUser),WEAPONS[weapon].range);
  assert.equal(selectedRules.canSee(selectedUser,edge),true,'selected sniper sees to the range boundary');
  assert.equal(selectedRules.canSee(selectedUser,{...edge,x:edge.x+.01}),false);
  selectedUser.selected=false;
  assert.equal(selectedRules.visionRange(selectedUser),VISION_RANGE+WEAPONS[weapon].vision);
  assert.equal(selectedRules.canSee(selectedUser,edge),false,'deselection restores normal vision');
}
assert.equal(selectedRules.visionRange({weapon:'rifle',selected:true}),VISION_RANGE,'non-sniper selection has no vision bonus');
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
assert.equal(firingState({...u,weapon:'sniper'},distant).status,'ready','sniper optics extend personal vision');
assert.equal(firingState({...u,weapon:'sniper'},{x:50+VISION_RANGE+160,y:40}).status,'unseen');
assert.equal(firingState({...u,weapon:'sniper'},distant,true).status,'ready','explicit spotting can grant target knowledge');
assert.equal(firingState({...u,weapon:'pistol'},{x:250,y:40}).status,'far','visible target can be out of range');
const rear={x:376,y:450,eye:1.2,weapon:'rifle'},front={x:376,y:560};
assert.equal(canSee(rear,front),false);
assert.equal(firingState(rear,front,true).status,'blocked','known target behind pillar cannot be shot');
const highEyes={...rear,eye:3};
const otherHighEyes={...front,eye:3};
assert.equal(canSee(highEyes,otherHighEyes),true);
assert.equal(firingState(highEyes,otherHighEyes).status,'blocked','clear eye ray must not imply clear muzzle ray');
console.log('PASS: eight weapon groups, range boundaries, personal sniper vision, muzzle obstruction');
