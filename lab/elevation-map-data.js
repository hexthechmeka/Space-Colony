import {createTerrain,point,HEIGHT_PIXELS} from './terrain-geometry.js';

export const TILE=64,MAP_WIDTH=1920,MAP_HEIGHT=1120;
const cols=MAP_WIDTH/TILE,rows=Math.ceil(MAP_HEIGHT/TILE);
function level(x,y){
  let z=1;
  if(x>=320&&x<640&&y>=768&&y<1024)z=2;
  if(x>=640&&x<1152&&y>=128&&y<512)z=3;
  if(x>=1280&&x<1792&&y>=384&&y<960)z=3;
  if(x>=1408&&x<1664&&y>=512&&y<832)z=0;
  if(x>=1472&&x<1600&&y>=832&&y<896)z=1;
  if(x>=1472&&x<1600&&y>=896&&y<960)z=2;
  if(x>=1216&&x<1280&&y>=768&&y<1024)z=2;
  return z;
}
const onRamp=p=>p.x>=768&&p.x<896&&p.y>=512&&p.y<768;
export const cells=Array.from({length:cols*rows},(_,i)=>{
  const x=i%cols*TILE,y=Math.floor(i/cols)*TILE;
  return {x,y,z:level(x+32,y+32)};
});
const surface=p=>onRamp(p)?{id:'wide-ramp',z:3-(p.y-512)/128}
  :{id:`level-${level(p.x,p.y)}`,z:level(p.x,p.y)};
const heightAt=p=>surface(p).z;
export const boundaries=[],barriers=[];
for(const c of cells)for(const [dx,dy] of [[1,0],[0,1]]){
  const p={x:c.x+(dx?TILE:0),y:c.y+(dy?TILE:0)};
  const a=point(p.x,p.y),b=dx?point(p.x,p.y+TILE):point(p.x+TILE,p.y);
  const before=dx?point(p.x-.01,p.y+32):point(p.x+32,p.y-.01);
  const after=dx?point(p.x+.01,p.y+32):point(p.x+32,p.y+.01);
  if(onRamp(before)||onRamp(after))continue;
  const high=Math.max(heightAt(before),heightAt(after)),low=Math.min(heightAt(before),heightAt(after));
  if(high===low)continue;
  boundaries.push({a,b,high,low,front:heightAt(before)>heightAt(after),depth:(a.y+b.y)/2});
  if(high-low>1)barriers.push([a,b]);
}
function pickGround(p){
  // Highest visible surface wins where projected land overlaps a cliff face.
  const candidates=[];
  for(let z=5;z>=0;z--){const q=point(p.x,p.y+z*HEIGHT_PIXELS);if(!onRamp(q)&&heightAt(q)===z)candidates.push(q);}
  const q=point(p.x,(p.y+224)/1.25);if(onRamp(q))candidates.push(q);
  candidates.sort((a,b)=>heightAt(b)-heightAt(a));
  return candidates[0]??point(p.x,p.y+HEIGHT_PIXELS);
}
const empty=[point(-200,-200),point(-100,-200),point(-100,-100),point(-200,-100)];
export const field=createTerrain({width:MAP_WIDTH,height:MAP_HEIGHT,cell:8,plateau:empty,ramp:empty,
  terrainSprites:[],obstacles:[],elevation:{surface,pickGround,barriers,arrivalRadius:80}});
export const LZ=point(192,928),SITE=point(1024,320);
export const CREW_START=[point(174,910),point(210,910),point(174,942),point(210,942)];
export const ENEMY_START=[point(480,870),point(928,320),point(1120,640),point(1344,640),point(1536,672),point(1728,640)];
export const ZONES=[{id:'landing',name:'출발 평지',x:192,y:928},
  {id:'terrace',name:'낮은 단차',x:480,y:880},{id:'highland',name:'넓은 고원',x:928,y:320},
  {id:'ramp',name:'고원 경사로',x:832,y:640},{id:'rim',name:'협곡 상단',x:1384,y:640},
  {id:'canyon',name:'협곡 바닥',x:1536,y:672},{id:'steps',name:'협곡 단차 통로',x:1536,y:896}];
export function paintElevationGround(ctx,image){
  const half=image.width/2;
  for(const c of cells){
    const p=point(c.x+32,c.y+32),z=heightAt(p),ramp=onRamp(p);
    ctx.drawImage(image,ramp?half:0,half,half,half,c.x,c.y-z*HEIGHT_PIXELS,TILE,TILE+(ramp?16:0));
    ctx.fillStyle=`rgba(180,218,205,${z*.025})`;ctx.fillRect(c.x,c.y-z*HEIGHT_PIXELS,TILE,TILE);
  }
}
export function drawElevationEdge(ctx,image,edge,dark=false){
  const {a,b,high,low,front}=edge,half=image.width/2;
  if(a.y===b.y&&front){
    for(let z=low;z<high;z++)ctx.drawImage(image,((a.x/TILE)%2)*half,128,256,128,a.x,a.y-(z+1)*HEIGHT_PIXELS,TILE,HEIGHT_PIXELS);
    if(dark){ctx.fillStyle='rgba(0,0,0,.66)';ctx.fillRect(a.x,a.y-high*HEIGHT_PIXELS,TILE,(high-low)*HEIGHT_PIXELS);}
  }
  ctx.strokeStyle=dark?'#373b2e':'#a0aa86';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(a.x,a.y-high*HEIGHT_PIXELS);ctx.lineTo(b.x,b.y-high*HEIGHT_PIXELS);ctx.stroke();
}
