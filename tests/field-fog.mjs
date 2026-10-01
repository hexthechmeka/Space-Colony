import assert from 'node:assert/strict';
import {drawFog,MEMORY_COLOR,MEMORY_OPACITY,FOG_EDGE_BLUR,VISION_REFRESH_MS,terrainObjectVisible} from '../lab/field-fog.js';
import {createTerrain} from '../lab/terrain-geometry.js';

// Three representative pixels: unexplored, remembered, currently visible.
const pixels=[0,0,0],colors=[null,null,null];let saves=0,inside=false;
const ctx={globalAlpha:1,globalCompositeOperation:'source-over',fillStyle:null,
  save(){saves++},restore(){saves--},clearRect(){pixels.fill(0);colors.fill(null)},
  blend(i,alpha,color){
    if(this.globalCompositeOperation==='destination-out')pixels[i]*=1-alpha;
    else {pixels[i]=alpha+pixels[i]*(1-alpha);if(alpha)colors[i]=color;}
  },
  fillRect(){for(let i=0;i<3;i++)this.blend(i,this.globalAlpha,this.fillStyle)},
  drawImage(image){for(let i=0;i<3;i++)this.blend(i,image[i]*this.globalAlpha,MEMORY_COLOR)},
  beginPath(){inside=false},moveTo(){inside=true},lineTo(){},closePath(){},
  fill(){if(inside)this.blend(2,this.globalAlpha,this.fillStyle)},
};
drawFog(ctx,[0,1,1],[[{x:2,y:0},{x:3,y:0},{x:3,y:1}]],3,1);
assert.deepEqual(pixels,[1,MEMORY_OPACITY,0]);
assert.equal(colors[0],'#000000');assert.equal(colors[1],MEMORY_COLOR);assert.equal(saves,0);
drawFog(ctx,[0,1,1],[],3,1);
assert.deepEqual(pixels,[1,MEMORY_OPACITY,MEMORY_OPACITY],'visited ground keeps a translucent black overlay');
drawFog(ctx,[0,0,0],[],3,1);
assert.deepEqual(pixels,[1,1,1],'cleared exploration returns to opaque black');
assert.equal(MEMORY_COLOR,'#000000');
assert.equal(ctx.filter,`blur(${FOG_EDGE_BLUR}px)`);
assert.ok(FOG_EDGE_BLUR>0&&FOG_EDGE_BLUR<=8,'only a narrow fog boundary is softened');
assert.ok(VISION_REFRESH_MS<=50,'moving vision refreshes at least twenty times per second');
const tree={id:'tree',name:'tree',hit:[220,100,20,12],height:4};
const blocker={id:'front-tree',name:'tree',hit:[160,100,35,30],height:5};
const crew=[{x:100,y:100,eye:1.2}];
const terrain=createTerrain({obstacles:[tree]});
assert.ok(terrainObjectVisible(tree,crew,terrain,330),'the visible front of a tall object reveals the entire sprite');
assert.equal(terrainObjectVisible(tree,crew,terrain,50),false,'camera or tall sprite does not bypass vision range');
const occluded=createTerrain({obstacles:[blocker,tree]});
assert.equal(terrainObjectVisible(tree,crew,occluded,330),false,'a separate object with the same name still blocks sight');
assert.equal(occluded.raycast({...crew[0],z:1.2},{x:220,y:100,z:3},'vision').id,blocker.id);
console.log('PASS: opaque unexplored black, translucent remembered black, clear current vision, exploration reset, sprite visibility and self-occlusion');
