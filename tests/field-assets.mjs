import assert from 'node:assert/strict';
import {readRgbaPng} from './png-reader.mjs';

const {width,height,alpha}=readRgbaPng(new URL('../assets/terrain/drafts/nature-atlas-v1.png',import.meta.url));
assert.equal(width,1254);assert.equal(height,1254);
for(const [x,y] of [[2,2],[625,2],[2,625],[629,629],[1250,1250]])assert.equal(alpha(x,y),0,'sprite margins must be transparent');
for(const [x,y] of [[0,0],[627,0],[0,627],[627,627]]){
  let opaque=0,clear=0;
  for(let j=0;j<627;j++)for(let i=0;i<627;i++){const a=alpha(x+i,y+j);if(a>200)opaque++;if(a===0)clear++;}
  assert.ok(opaque>10000&&clear>10000,'each natural sprite must have visible art and clear alpha');
}
console.log('PASS: natural atlas dimensions, four nonblank sprites, true transparent margins');
