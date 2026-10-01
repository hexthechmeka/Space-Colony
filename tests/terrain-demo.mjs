import assert from 'node:assert/strict';
import {point,distance,ramp,plateau,heightAt,surface,project,pickGround,blocked,
  canTravel,findPath,advance,raycast,MOVE_SPEED,actorDepth,terrainSprites,obstacles} from '../lab/terrain-geometry.js';

const starts=[point(100,430),point(132,454),point(166,456),point(95,393)];
const high=point(818,230),behindPillar=point(376,451),frontPillar=point(376,550);
for(const p of [...starts,high,behindPillar,frontPillar])assert.equal(blocked(p),false,'spawn/destination must be walkable');

function walk(a,b){
  const path=findPath(a,b);assert.ok(path?.length,`route missing: ${JSON.stringify({a,b})}`);
  let prev=a;for(const next of path){assert.ok(canTravel(prev,next),'route crosses obstacle/cliff');prev=next;}
  const u={...a,path:[...path]};let seenRamp=false;
  for(let i=0;i<2400&&u.path.length;i++){
    const last={...u};advance(u,1/60);assert.equal(u.stuck,undefined,'runtime movement diverged from pathfinding');
    assert.ok(canTravel(last,u));assert.equal(blocked(u),false);seenRamp ||= surface(u).id==='ramp';
  }
  assert.equal(u.path.length,0,'unit never arrived');assert.ok(distance(u,b)<.1,'destination changed');
  return seenRamp;
}
for(const p of starts){assert.ok(walk(p,high),'ascent must use ramp');assert.ok(walk(high,p),'descent must use ramp');}
walk(behindPillar,frontPillar);walk(frontPillar,behindPillar);
assert.equal(canTravel(behindPillar,frontPillar),false,'pillar body footprint cannot be crossed');
assert.equal(canTravel(point(818,290),high),false,'cliff must not be climbed');
assert.equal(canTravel(point(720,230),point(690,270)),false,'ramp side must not be entered');

for(let t=.05;t<1;t+=.1){
  const a=point((ramp[0].x+ramp[1].x)/2,(ramp[0].y+ramp[1].y)/2);
  const b=point((ramp[2].x+ramp[3].x)/2,(ramp[2].y+ramp[3].y)/2);
  const p=point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
  assert.ok(Math.abs(heightAt(p)-2*t)<.001,'slope must rise continuously');
  assert.ok(distance(p,pickGround(project(p)))<.001,'render/pick projection must agree');
}
assert.ok(distance(high,pickGround(project(high)))<.001);
const rampDepth=terrainSprites.find(o=>o.id==='ramp').depth;
const bottom=point((ramp[0].x+ramp[1].x)/2,(ramp[0].y+ramp[1].y)/2);
const top=point((ramp[2].x+ramp[3].x)/2,(ramp[2].y+ramp[3].y)/2);
for(const lane of [.15,.5,.85])for(const t of [-.4,-.1,0,.0001,.004,.02,.3,.9]){
  const p=point(ramp[0].x+(ramp[1].x-ramp[0].x)*lane+(top.x-bottom.x)*t,
    ramp[0].y+(ramp[1].y-ramp[0].y)*lane+(top.y-bottom.y)*t);
  assert.ok(actorDepth(p)>rampDepth,'ramp entry must not cover actors before/after gaining height');
}
const pillarDepth=obstacles.find(o=>o.id==='pillar').depth;
for(const p of [point(650,265),point(660,273),point(720,274)]){
  assert.equal(surface(p).id,'ground');
  assert.ok(actorDepth(p)>rampDepth,'ground actors beside the entry must render in front based on feet');
}
assert.ok(actorDepth(point(650,230))<rampDepth,'feet behind the extended entry edge must stay behind');
assert.equal(actorDepth(point(680,550)),550,'entry ordering must not lower normal ground depth');
assert.ok(actorDepth(behindPillar)<pillarDepth,'pillar must still cover actors behind it');
assert.ok(actorDepth(frontPillar)>pillarDepth,'actors in front of pillar must remain visible');
assert.ok(actorDepth(point(735,205))<rampDepth,'ground behind the ramp must remain behind terrain');
assert.ok(raycast({x:376,y:450,z:1.2},{x:376,y:560,z:1.2}),'pillar must occlude');
assert.equal(raycast({x:100,y:400,z:1.2},{x:250,y:400,z:1.2}),null,'low boulder should not occlude eye height');
const u={x:80,y:80,path:[point(300,80)]};advance(u,1);assert.equal(u.x,80+MOVE_SPEED);assert.equal(MOVE_SPEED,86);
console.log('PASS: ramp entry layering, pillar occlusion, 4-person ascent/descent, projection, LOS, speed');
