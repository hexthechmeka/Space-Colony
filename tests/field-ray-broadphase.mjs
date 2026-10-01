import assert from 'node:assert/strict';
import {field} from '../lab/field-map-data.js';

const objects=field.obstacles.map(o=>({...o,baseZ:field.heightAt(o.hit?{x:o.hit[0],y:o.hit[1]}:o.poly[0])}));
function reference(a,b,channel){
  const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/3));
  for(let i=1;i<steps;i++){
    const t=i/steps,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};
    if(field.heightAt(p)>p.z+.03)return {...p,id:field.surface(p).id};
    const o=objects.find(o=>{
      const h=channel==='vision'?(o.visionHeight??o.height):(o.shotHeight??o.height);
      const hit=channel==='vision'?o.visionHit:o.shotHit;
      return h>0&&o.baseZ+h>p.z+.03&&field.insideObstacle(hit?{hit}:o,p);
    });
    if(o)return {...p,id:o.id};
  }
  return null;
}
let seed=73;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(let i=0;i<300;i++){
  const a={x:random()*field.width,y:random()*field.height,z:random()*5};
  const b={x:random()*field.width,y:random()*field.height,z:random()*5};
  for(const channel of ['vision','shot']){
    const expected=reference(a,b,channel),actual=field.raycast(a,b,channel);
    assert.equal(actual?.id,expected?.id);
    if(expected)for(const axis of ['x','y','z'])assert.equal(actual[axis],expected[axis]);
  }
}
console.log('PASS: broadphase preserves all 600 reference sight/shot ray results');
