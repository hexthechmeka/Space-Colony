export const WIDTH = 960, HEIGHT = 600, CELL = 8, RADIUS = 6;
export const MOVE_SPEED = 120.4, HEIGHT_PIXELS = 32;
export const point = (x, y) => ({ x, y });
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mix = (a, b, t) => a + (b - a) * t;
const cross = (a, b) => a.x * b.y - a.y * b.x;
const sub = (a, b) => point(a.x - b.x, a.y - b.y);
export const plateau = [point(700,230),point(803,188),point(903,237),point(816,274)];
const onEdge = x => point(x, 230 + (x - 700) * 44 / 116);
export const ramp = [point(662,247),point(710,247+48*44/116),onEdge(776),onEdge(728)];
export const terrainSprites = [
  {id:'plateau',src:[512,512,512,512],draw:[694,105,234,226],depth:274},
  {id:'ramp',src:[1024,512,512,512],draw:[639,150,176,150],depth:274.5},
];
export const obstacles = [
  {id:'boulder',name:'낮은 바위',src:[0,0,512,512],draw:[104,310,155,126],hit:[180,400,57,22],height:.8,depth:400},
  {id:'spire',name:'현무암 기둥',src:[512,0,512,512],draw:[334,148,137,204],hit:[402,331,31,20],height:2.5,depth:331},
  {id:'wall',name:'보강 벽체',src:[1024,0,512,512],draw:[542,325,202,136],poly:[point(557,414),point(580,408),point(730,439),point(724,449)],height:1.7,depth:432},
  {id:'pillar',name:'정비 기둥',src:[0,512,512,512],draw:[334,374,88,164],hit:[376,507,20,13],height:2.3,depth:507},
];
export function inPolygon(p, vertices) {
  let result = false;
  for (let i=0,j=vertices.length-1;i<vertices.length;j=i++) {
    const a=vertices[i],b=vertices[j];
    if ((a.y>p.y)!==(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) result=!result;
  }
  return result;
}
export function segmentDistance(p,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
const edges = poly => poly.map((p,i)=>[p,poly[(i+1)%poly.length]]);
export function obstacleDepthAt(o,x) {
  if(!o.poly)return o.depth;
  const xs=o.poly.map(p=>p.x);
  x=Math.max(Math.min(...xs)+.001,Math.min(Math.max(...xs)-.001,x));
  const ys=edges(o.poly).filter(([a,b])=>a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))
    .map(([a,b])=>mix(a.y,b.y,(x-a.x)/(b.x-a.x)));
  return (Math.min(...ys)+Math.max(...ys))/2;
}
export function obstacleLayers(o) {
  if(!o.poly)return [o];
  const [sx,sy,sw,sh]=o.src,[x,y,w,h]=o.draw;
  // Slanted cover needs a local foot baseline, not one depth for its whole image.
  return Array.from({length:w},(_,i)=>({...o,src:[sx+i*sw/w,sy,sw/w,sh],
    draw:[x+i,y,1,h],depth:obstacleDepthAt(o,x+i+.5)}));
}
// Only the bottom and top ramp edges are portals. Side edges remain impassable.
export function createTerrain({width=WIDTH,height=HEIGHT,cell=CELL,plateau:top=plateau,ramp:slope=ramp,
  terrainSprites:sprites=terrainSprites,obstacles:objects=obstacles}={}) {
const WIDTH=width,HEIGHT=height,CELL=cell,plateau=top,ramp=slope,terrainSprites=sprites,obstacles=objects;
const barriers = [
  [ramp[0],ramp[3]], [ramp[1],ramp[2]],
  ...edges(plateau).slice(0,3), [plateau[3],ramp[2]], [ramp[3],plateau[0]],
];
function rampCoordinates(p) {
  const across=sub(ramp[1],ramp[0]),along=sub(ramp[3],ramp[0]),offset=sub(p,ramp[0]);
  const determinant=cross(along,across);
  return {progress:cross(offset,across)/determinant,lateral:cross(along,offset)/determinant};
}
function rampHeight(p) {
  return Math.max(0,Math.min(2,rampCoordinates(p).progress*2));
}
function surface(p) {
  if(inPolygon(p,plateau)) return {id:'plateau',z:2};
  if(inPolygon(p,ramp)) return {id:'ramp',z:rampHeight(p)};
  return {id:'ground',z:0};
}
const heightAt = p => surface(p).z;
function actorDepth(p) {
  const [left,,width]=terrainSprites.find(o=>o.id==='ramp').draw;
  const entryY=ramp[0].y+(p.x-ramp[0].x)*(ramp[1].y-ramp[0].y)/(ramp[1].x-ramp[0].x);
  // Actor coordinates are feet: the entry's front half-plane includes its flanks.
  const inFrontOfEntry=p.x>=left-RADIUS&&p.x<=left+width+RADIUS&&p.y>=entryY;
  const onSurface=surface(p).id!=='ground';
  const surfaceDepth=Math.max(...terrainSprites.map(o=>o.depth))+1;
  if(onSurface)return surfaceDepth+p.y*.001;
  return inFrontOfEntry?Math.max(p.y,surfaceDepth+p.y*.001):p.y;
}
const project = p => point(p.x,p.y-(p.z??heightAt(p))*HEIGHT_PIXELS);
const rampScreen = ramp.map((p,i)=>project({...p,z:i<2?0:2}));
const plateauScreen = plateau.map(p=>project({...p,z:2}));
function pickGround(p) {
  if(inPolygon(p,plateauScreen)) return point(p.x,p.y+2*HEIGHT_PIXELS);
  if(inPolygon(p,rampScreen)) {
    const bottom=sub(rampScreen[1],rampScreen[0]);
    const t=cross(sub(p,rampScreen[0]),bottom)/cross(sub(rampScreen[3],rampScreen[0]),bottom);
    return point(p.x,p.y+Math.max(0,Math.min(2,t*2))*HEIGHT_PIXELS);
  }
  return point(p.x,p.y);
}
function insideObstacle(o,p,r=0) {
  if(o.poly) return inPolygon(p,o.poly)||edges(o.poly).some(([a,b])=>segmentDistance(p,a,b)<r);
  const [x,y,rx,ry]=o.hit;
  return ((p.x-x)/(rx+r))**2+((p.y-y)/(ry+r))**2<=1;
}
function blocked(p,r=RADIUS) {
  return p.x<r||p.y<r||p.x>WIDTH-r||p.y>HEIGHT-r||
    obstacles.some(o=>!o.passable&&insideObstacle(o,p,r))||barriers.some(([a,b])=>segmentDistance(p,a,b)<r);
}
function canTravel(a,b,r=RADIUS) {
  const steps=Math.max(1,Math.ceil(distance(a,b)/2));
  let last=heightAt(a);
  for(let i=0;i<=steps;i++) {
    const t=i/steps,p=point(mix(a.x,b.x,t),mix(a.y,b.y,t)),z=heightAt(p);
    if(blocked(p,r)||Math.abs(z-last)>.22) return false;
    last=z;
  }
  return true;
}
const rayBounds=(o,hit)=>hit?[hit[0]-hit[2],hit[1]-hit[3],hit[0]+hit[2],hit[1]+hit[3]]
  :[Math.min(...o.poly.map(p=>p.x)),Math.min(...o.poly.map(p=>p.y)),Math.max(...o.poly.map(p=>p.x)),Math.max(...o.poly.map(p=>p.y))];
const rayObjects=obstacles.map(o=>({...o,baseZ:heightAt(o.hit?point(o.hit[0],o.hit[1]):o.poly[0]),
  visionBounds:rayBounds(o,o.visionHit??o.hit),shotBounds:rayBounds(o,o.shotHit??o.hit)}));
function raycast(a,b,channel='shot') {
  const left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y);
  const candidates=rayObjects.filter(o=>{
    const bounds=channel==='vision'?o.visionBounds:o.shotBounds;
    return bounds[0]<=right&&bounds[2]>=left&&bounds[1]<=bottom&&bounds[3]>=top;
  });
  const steps=Math.max(1,Math.ceil(distance(a,b)/3));
  for(let i=1;i<steps;i++) {
    const t=i/steps,p={x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)};
    if(heightAt(p)>p.z+.03) return {...p,id:surface(p).id,name:'절벽 / 경사면'};
    const o=candidates.find(o=>{
      const h=channel==='vision'?(o.visionHeight??o.height):(o.shotHeight??o.height);
      const hit=channel==='vision'?o.visionHit:o.shotHit;
      return h>0&&o.baseZ+h>p.z+.03&&
        insideObstacle(hit?{hit}:o,p);
    });
    if(o) return {...p,id:o.id,name:o.name};
  }
  return null;
}
const cols=WIDTH/CELL,rows=HEIGHT/CELL;
const center=i=>point((i%cols+.5)*CELL,(Math.floor(i/cols)+.5)*CELL);
const key=p=>Math.floor(p.y/CELL)*cols+Math.floor(p.x/CELL);
const traversable=Array.from({length:cols*rows},(_,i)=>!blocked(center(i)));
const links=new Map();
function neighbors(i) {
  if(links.has(i)) return links.get(i);
  const a=center(i),out=[];
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]) {
    const x=i%cols+dx,y=Math.floor(i/cols)+dy,j=y*cols+x;
    if(x<0||y<0||x>=cols||y>=rows||!traversable[j])continue;
    if(canTravel(a,center(j)))out.push(j);
  }
  links.set(i,out);return out;
}
class Heap {
  items=[];
  push(v){const a=this.items;let i=a.length;a.push(v);while(i){const p=(i-1)>>1;if(a[p].f<=v.f)break;a[i]=a[p];i=p;}a[i]=v;}
  pop(){const a=this.items,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].f<a[c].f)c++;if(a[c].f>=last.f)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
function nearby(p,connect) {
  const out=[],cx=Math.floor(p.x/CELL),cy=Math.floor(p.y/CELL);
  for(let y=Math.max(0,cy-5);y<=Math.min(rows-1,cy+5);y++)for(let x=Math.max(0,cx-5);x<=Math.min(cols-1,cx+5);x++){
    const i=y*cols+x,q=center(i);
    if(traversable[i]&&surface(q).id===surface(p).id&&(!connect||canTravel(p,q)))out.push(i);
  }
  return out.sort((a,b)=>distance(p,center(a))-distance(p,center(b)));
}
function findPath(start,requested) {
  if(blocked(start))return null;
  const starts=nearby(start,true),ends=nearby(requested,!blocked(requested));
  if(!starts.length||!ends.length)return null;
  const end=ends[0],goal=center(end),open=new Heap(),cost=new Float64Array(cols*rows).fill(Infinity),prev=new Int32Array(cols*rows).fill(-1);
  for(const i of starts.slice(0,8)){cost[i]=distance(start,center(i));open.push({i,g:cost[i],f:cost[i]+distance(center(i),goal)});}
  let reached=false;
  while(open.items.length){const {i,g}=open.pop();if(g!==cost[i])continue;if(i===end){reached=true;break;}
    for(const j of neighbors(i)){const ng=g+distance(center(i),center(j));if(ng>=cost[j])continue;cost[j]=ng;prev[j]=i;open.push({i:j,g:ng,f:ng+distance(center(j),goal)});}
  }
  if(!reached)return null;
  const raw=[];for(let i=end;i!==-1;i=prev[i])raw.push(center(i));raw.reverse();
  if(!blocked(requested)&&canTravel(goal,requested))raw.push({...requested});
  const route=[];let anchor=start,index=0;
  while(index<raw.length){let far=index;while(far+1<raw.length&&canTravel(anchor,raw[far+1]))far++;route.push(raw[far]);anchor=raw[far];index=far+1;}
  return route;
}
function advance(unit,dt,speed=MOVE_SPEED) {
  let remaining=speed*dt;
  while(unit.path.length&&remaining>0){const next=unit.path[0],length=distance(unit,next);if(length<.001){unit.path.shift();continue;}
    const step=Math.min(remaining,length),p=point(mix(unit.x,next.x,step/length),mix(unit.y,next.y,step/length));
    if(!canTravel(unit,p)){unit.path=[];unit.stuck=true;return;}
    unit.x=p.x;unit.y=p.y;remaining-=step;if(step===length)unit.path.shift();
  }
}
return {width,height,cell,plateau,ramp,terrainSprites,obstacles,barriers,surface,heightAt,actorDepth,
  project,rampScreen,plateauScreen,pickGround,insideObstacle,blocked,canTravel,raycast,findPath,advance};
}
export const {barriers,surface,heightAt,actorDepth,project,rampScreen,plateauScreen,pickGround,
  insideObstacle,blocked,canTravel,raycast,findPath,advance}=createTerrain();
