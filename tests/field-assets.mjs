import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

const file=readFileSync(new URL('../assets/terrain/drafts/nature-atlas-v1.png',import.meta.url));
const width=file.readUInt32BE(16),height=file.readUInt32BE(20);
assert.equal(width,1254);assert.equal(height,1254);assert.equal(file[24],8);assert.equal(file[25],6);
const chunks=[];
for(let p=8;p<file.length;){const n=file.readUInt32BE(p),type=file.toString('ascii',p+4,p+8);
  if(type==='IDAT')chunks.push(file.subarray(p+8,p+8+n));p+=n+12;}
const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,rgba=Buffer.alloc(stride*height);
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
for(let y=0;y<height;y++){
  const filter=raw[y*(stride+1)];assert.ok(filter<=4);
  for(let x=0;x<stride;x++){
    const i=y*stride+x,a=x>=4?rgba[i-4]:0,b=y?rgba[i-stride]:0,c=y&&x>=4?rgba[i-stride-4]:0;
    const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
    rgba[i]=(raw[y*(stride+1)+1+x]+predictor)&255;
  }
}
const alpha=(x,y)=>rgba[(y*width+x)*4+3];
for(const [x,y] of [[2,2],[625,2],[2,625],[629,629],[1250,1250]])assert.equal(alpha(x,y),0,'sprite margins must be transparent');
for(const [x,y] of [[0,0],[627,0],[0,627],[627,627]]){
  let opaque=0,clear=0;
  for(let j=0;j<627;j++)for(let i=0;i<627;i++){const a=alpha(x+i,y+j);if(a>200)opaque++;if(a===0)clear++;}
  assert.ok(opaque>10000&&clear>10000,'each natural sprite must have visible art and clear alpha');
}
console.log('PASS: natural atlas dimensions, four nonblank sprites, true transparent margins');
