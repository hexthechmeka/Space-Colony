import {createTerrain,point,plateau,ramp,terrainSprites,obstacles} from './terrain-geometry.js';

export const MAP_WIDTH=1920,MAP_HEIGHT=1120;
export const LZ=point(160,910),SITE=point(1710,240);
const shift=p=>point(p.x+240,p.y+240);
const topSprites=terrainSprites.map(o=>({...o,atlas:'terrain',draw:[o.draw[0]+240,o.draw[1]+240,...o.draw.slice(2)],depth:o.depth+240}));
const objects=[];
function add(type,x,y){
  const template=obstacles.find(o=>o.id===type),dx=x-(template.hit?.[0]??640),dy=y-template.depth;
  objects.push({...template,id:`${type}-${objects.length}`,atlas:'terrain',
    draw:[template.draw[0]+dx,template.draw[1]+dy,...template.draw.slice(2)],depth:y,
    ...(template.hit?{hit:[x,template.hit[1]+dy,...template.hit.slice(2)]}:{poly:template.poly.map(p=>point(p.x+dx,p.y+dy))})});
}
for(const [x,y] of [[350,850],[455,730],[305,650],[580,925],[685,770],[810,650],[910,720],
  [1150,720],[1300,605],[1240,420],[1510,440],[1640,570],[1520,140]])add('boulder',x,y);
for(const [x,y] of [[530,620],[620,475],[760,850],[880,360],[1290,795],[1500,660]])add('spire',x,y);
for(const [x,y] of [[1400,335],[1580,350],[1440,515],[1150,905]])add('boulder',x,y);
for(const [x,y] of [[1330,245],[1535,235],[1650,430],[1775,365]])add('spire',x,y);
// New asset contact points are authored separately from the transparent image bounds.
function naturalFeature(type,x,y){
  const specs={ore:{src:[627,0,627,627],size:[100,100],hit:[30,15],height:.7},
    shrub:{src:[0,627,627,627],size:[92,92],hit:[28,14],height:.4}};
  const s=specs[type],[w,h]=s.size;
  objects.push({id:`${type}-${objects.length}`,name:type==='ore'?'광맥':'외계 식생',
    atlas:'nature',src:s.src,draw:[x-w/2,y-h*.87,w,h],hit:[x,y,...s.hit],height:s.height,depth:y});
}
naturalFeature('ore',430,535);naturalFeature('ore',1185,625);naturalFeature('ore',1595,185);
for(const [x,y] of [[250,780],[570,800],[720,570],[900,955],[1220,330],[1430,685],[1730,550]])naturalFeature('shrub',x,y);
export const field=createTerrain({width:MAP_WIDTH,height:MAP_HEIGHT,cell:8,
  plateau:plateau.map(shift),ramp:ramp.map(shift),terrainSprites:topSprites,obstacles:objects});
export const ZONES=[
  {id:'landing',name:'착륙 구역',x:160,y:910},
  {id:'rocks',name:'암석 지대',x:440,y:690},
  {id:'highland',name:'고지대',x:1040,y:460},
  {id:'ravine',name:'암석 협곡',x:1450,y:400},
  {id:'site',name:'설치 예정지',x:1710,y:240},
];
export const CREW_START=[point(142,894),point(178,894),point(142,926),point(178,926)];
export const ENEMY_START=[point(490,570),point(790,740),point(1035,465),point(1220,650),
  point(1390,280),point(1525,490),point(1670,180),point(1740,300)];
