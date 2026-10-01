import assert from 'node:assert/strict';
import {field,CREW_START,SITE} from '../lab/field-map-data.js';
import {createSquadMovement} from '../lab/squad-movement.js';
import {distance} from '../lab/terrain-geometry.js';

const movement=createSquadMovement(field);
const create=()=>CREW_START.map((p,id)=>({...p,id,path:[]}));
for(const destination of [{x:480,y:780},{x:1058,y:470},SITE]){
  const crew=create();assert.equal(movement.order(crew,destination),0);
  assert.ok(new Set(crew.map(u=>u.reaction)).size>1);
  movement.update(crew,.05);
  assert.ok(crew.some((u,i)=>distance(u,CREW_START[i])>0)&&crew.some((u,i)=>distance(u,CREW_START[i])===0),'staggered departure');
  let steps=0;
  for(;steps<12000&&crew.some(u=>u.path.length);steps++){
    const before=crew.map(u=>({...u}));movement.update(crew,1/30);
    for(let i=0;i<crew.length;i++){
      assert.ok(field.canTravel(before[i],crew[i]),'each movement respects collision and ramp edges');
      assert.equal(crew[i].stuck,false,`${JSON.stringify(destination)} step ${steps} unit ${i}: ${JSON.stringify(crew[i])}`);
      for(let j=i+1;j<crew.length;j++)assert.ok(distance(crew[i],crew[j])>=12.9,'members do not overlap');
    }
  }
  assert.ok(steps<12000,`squad stalled at ${JSON.stringify(destination)}: ${JSON.stringify(crew)}`);
  for(let i=0;i<crew.length;i++){
    assert.ok(distance(crew[i],destination)<56,'blocked members settle within the arrival area instead of forcing a slot');
    assert.equal(field.surface(crew[i]).id,field.surface(destination).id);
  }
  const stopped=crew.map(u=>({x:u.x,y:u.y}));
  for(let i=0;i<100;i++)movement.update(crew,1/30);
  assert.deepEqual(crew.map(u=>({x:u.x,y:u.y})),stopped,'no automatic reformation after arrival');
}
const nearby=create(),positions=nearby.map(u=>({x:u.x,y:u.y}));
assert.equal(movement.order(nearby,{x:160,y:910}),0);
assert.ok(nearby.every(u=>!u.path.length),'nearby click keeps current loose positions');
assert.deepEqual(nearby.map(u=>({x:u.x,y:u.y})),positions);
movement.order(nearby,SITE);movement.update(nearby,.1);movement.stop(nearby);
assert.ok(nearby.every(u=>!u.path.length&&!u.moveSpeed&&!u.reaction));
const touring=create();
for(const destination of [{x:1058,y:470},{x:480,y:780},{x:1220,y:850},{x:160,y:910}]){
  assert.equal(movement.order(touring,destination),0);
  let i=0;for(;i<6000&&touring.some(u=>u.path.length);i++)movement.update(touring,1/30);
  assert.ok(i<6000,`repeated command stalled: ${JSON.stringify(destination)} ${JSON.stringify(touring)}`);
  assert.ok(touring.every(u=>!u.stuck&&distance(u,destination)<56));
}
movement.order(touring,SITE);for(let i=0;i<30;i++)movement.update(touring,1/30);
const movingSpeed=touring[0].moveSpeed;movement.order(touring,{x:600,y:950});
if(movingSpeed>5)assert.equal(touring[0].reaction,0,'redirecting a moving crew member does not repeat departure delay');
for(const dt of [1/60,.04]){
  const crew=create();movement.order(crew,{x:1058,y:470});
  let i=0;for(;i<150/dt&&crew.some(u=>u.path.length);i++)movement.update(crew,dt);
  assert.ok(crew.every(u=>!u.path.length&&!u.stuck),`ramp traversal at timestep ${dt}`);
}
console.log('PASS: loose arrival positions, staggered departure, terrain-safe separation, ramp/site routes, stable stop, no nearby reformation');
