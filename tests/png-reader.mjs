import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

export function readRgbaPng(path){
  const file=readFileSync(path),width=file.readUInt32BE(16),height=file.readUInt32BE(20);
  assert.equal(file[24],8);assert.equal(file[25],6);
  const chunks=[];
  for(let p=8;p<file.length;){const n=file.readUInt32BE(p),type=file.toString('ascii',p+4,p+8);
    if(type==='IDAT')chunks.push(file.subarray(p+8,p+8+n));p+=n+12;}
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,rgba=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){
    const filter=raw[y*(stride+1)];assert.ok(filter<=4);
    for(let x=0;x<stride;x++){
      const i=y*stride+x,a=x>=4?rgba[i-4]:0,b=y?rgba[i-stride]:0,c=y&&x>=4?rgba[i-stride-4]:0;
      const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      rgba[i]=(raw[y*(stride+1)+1+x]+predictor)&255;
    }
  }
  return {width,height,rgba,alpha:(x,y)=>rgba[(y*width+x)*4+3]};
}
