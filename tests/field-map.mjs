import assert from 'node:assert/strict';
import {field,CREW_START,ENEMY_START,SITE,ZONES} from '../lab/field-map-data.js';
import {createCamera,clampCamera,screenToWorld,worldToScreen,zoomCamera} from '../lab/field-camera.js';
import {createWeaponRules} from '../lab/terrain-weapons.js';
import {distance,point} from '../lab/terrain-geometry.js';

assert.equal(field.width,1920);assert.equal(field.height,1120);
assert.ok(field.obstacles.every(o=>!o.id.startsWith('wall')&&!o.id.startsWith('pillar')&&!o.id.startsWith('crate')&&!o.id.startsWith('rover')));
for(const p of [...CREW_START,...ENEMY_START,SITE])assert.equal(field.blocked(p),false,`blocked spawn ${JSON.stringify(p)}`);
const high=point(1058,470);
for(const start of CREW_START)for(const end of [SITE,high]){
  const path=field.findPath(start,end);assert.ok(path?.length,'destination must be reachable');
  let last=start;for(const next of path){assert.ok(field.canTravel(last,next));last=next;}
  const u={...start,path:[...path]};for(let i=0;i<8000&&u.path.length;i++)field.advance(u,1/30);
  assert.equal(u.stuck,undefined);assert.ok(distance(u,end)<.1);
}
const rules=createWeaponRules(field);
assert.equal(rules.firingState({...CREW_START[0],weapon:'pistol'},CREW_START[1]).status,'ready');
const c=createCamera(field.width,field.height);clampCamera(c);
for(const zoom of [.55,1,1.8]){
  zoomCamera(c,zoom);const p=point(410,810);assert.ok(distance(p,screenToWorld(c,worldToScreen(c,p)))<.001);
  assert.ok(c.x>=c.vw/c.zoom/2&&c.y>=c.vh/c.zoom/2);
}
const anchor=point(600,250);c.x=1000;c.y=550;c.zoom=1;
const before=screenToWorld(c,anchor);zoomCamera(c,1.4,anchor);assert.ok(distance(before,screenToWorld(c,anchor))<.001);
assert.equal(ZONES.length,5);
console.log('PASS: natural map, all spawns, squad routes to site/highland, weapon rules, camera projection/zoom');
