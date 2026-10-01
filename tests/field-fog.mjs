import assert from 'node:assert/strict';
import {drawFog,MEMORY_COLOR,MEMORY_OPACITY} from '../lab/field-fog.js';

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
assert.deepEqual(pixels,[1,MEMORY_OPACITY,MEMORY_OPACITY],'visited ground remains gray after sight leaves');
drawFog(ctx,[0,0,0],[],3,1);
assert.deepEqual(pixels,[1,1,1],'cleared exploration returns to opaque black');
console.log('PASS: opaque unexplored black, translucent remembered gray, clear current vision, exploration reset');
