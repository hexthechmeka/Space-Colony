import assert from 'node:assert/strict';
import {createTerrain,point} from '../lab/terrain-geometry.js';
import {createWeaponRules} from '../lab/terrain-weapons.js';
import {field} from '../lab/field-map-data.js';
import {readRgbaPng} from './png-reader.mjs';

const u={x:100,y:100,eye:1.2,weapon:'rifle'},e={x:300,y:100,eye:1.2};
function setup(visionHeight,shotHeight,extra={}){
  const terrain=createTerrain({obstacles:[{id:'test',name:'검증 장애물',hit:[200,100,20,15],height:3,visionHeight,shotHeight,...extra}]});
  return {terrain,rules:createWeaponRules(terrain)};
}
const low=setup(.2,.2);assert.equal(low.rules.visibilityState(u,e),'clear');assert.equal(low.rules.firingState(u,e).status,'ready');
const crystal=setup(0,1.6);assert.equal(crystal.rules.visibilityState(u,e),'visible');assert.equal(crystal.rules.firingState(u,e).status,'blocked');
const tree=setup(3.2,3.2);assert.equal(tree.rules.visibilityState(u,e),'hidden');assert.equal(tree.rules.firingState(u,e).status,'unseen');
const gas=setup(4,.4);assert.equal(gas.rules.visibilityState(u,e),'hidden');
assert.equal(gas.terrain.raycast({...u,z:1},{...e,z:1},'shot'),null,'gas is not a solid bullet barrier');
assert.ok(gas.terrain.raycast({...u,z:1},{...e,z:1},'vision'));
assert.equal(crystal.terrain.raycast({...u,z:2.8},{...e,z:2.8},'shot'),null,'higher rays clear low solid cover');
assert.ok(tree.terrain.raycast({...u,z:2.8},{...e,z:2.8},'vision'),'tall cover still blocks elevated rays');
assert.equal(tree.terrain.raycast({...u,z:3.8},{...e,z:3.8},'vision'),null);
const foliage=setup(1.2,.2,{visionHit:[200,100,60,35],hit:[200,100,10,7]});
assert.equal(foliage.terrain.blocked(point(240,100)),false,'canopy is not the movement footprint');
assert.ok(foliage.terrain.raycast({x:240,y:50,z:1},{x:240,y:150,z:1},'vision'));
const passable=setup(.2,.2,{passable:true});assert.equal(passable.terrain.blocked(point(200,100)),false);
assert.equal(field.obstacles.filter(o=>o.atlas==='cover').length,30);
for(const type of ['pine','tree','geyser','vent','crystal','grass'])assert.ok(field.obstacles.some(o=>o.kind===type));
const atlas=readRgbaPng(new URL('../assets/terrain/drafts/natural-cover-atlas-v1.png',import.meta.url));
assert.equal(atlas.width,1536);assert.equal(atlas.height,1024);
for(const p of [[2,2],[1500,1020],[510,510]])assert.equal(atlas.alpha(...p),0);
for(const o of field.obstacles.filter(o=>o.atlas==='cover')){
  const [x,y,w,h]=o.src;assert.ok(x+w<=atlas.width&&y+h<=atlas.height);
  let visible=0,clear=0;
  for(let j=y;j<y+h;j+=4)for(let i=x;i<x+w;i+=4){if(atlas.alpha(i,j)>200)visible++;if(atlas.alpha(i,j)===0)clear++;}
  assert.ok(visible>100&&clear>100,'each new asset has real art and transparent margin');
}
console.log('PASS: three contact states, independent sight/shot cover, height clearance, canopy/root separation, six natural assets');
