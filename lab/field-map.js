import {point,distance,MOVE_SPEED,obstacleLayers} from './terrain-geometry.js';
import {field,LZ,SITE,ZONES,CREW_START,ENEMY_START} from './field-map-data.js';
import {WEAPONS,STATUS,VISION_RANGE,createWeaponRules} from './terrain-weapons.js';
import {createCamera,clampCamera,screenToWorld,zoomCamera} from './field-camera.js';
import {drawGeyser} from './geyser-animation.js';

const ui=Object.fromEntries(['view','minimap','loading','status','order','crew','weapon','readout','targets',
  'follow','fog','hits','range','zoom','zoomValue','zone','zones','stop','reset'].map(id=>[id,document.getElementById(id)]));
const ctx=ui.view.getContext('2d'),mini=ui.minimap.getContext('2d'),W=960,H=600;
const contactLabels={clear:'보임 · 사격 경로 확보',visible:'보임 · 사격 경로 차폐',hidden:'시야 완전 차단'};
const contactColors={clear:'#76ddba',visible:'#e3b562',hidden:'#e18884'};
const legend=document.createElement('div');legend.style.cssText='font-size:11px;margin-top:9px';
for(const [state,label] of Object.entries(contactLabels)){const row=document.createElement('div');row.textContent=label;row.style.color=contactColors[state];legend.appendChild(row);}ui.targets.after(legend);
const camera=createCamera(field.width,field.height,W,H),rules=createWeaponRules(field);
const textures={},names=['반 하이드','오르타','두골','마르타'],colors=['#dfc56e','#8fc879','#d59b62','#90a6b6'];
let crew=[],enemies=[],selected=0,target=null,order=null,shots=[],ready=false,last=performance.now(),visionAt=0,visions=[];
const explored=document.createElement('canvas');explored.width=field.width;explored.height=field.height;
const memory=explored.getContext('2d'),fogCanvas=document.createElement('canvas');fogCanvas.width=field.width;fogCanvas.height=field.height;
const fogCtx=fogCanvas.getContext('2d');
const ground=document.createElement('canvas');ground.width=field.width;ground.height=field.height;
const sprites=[...field.terrainSprites,...field.obstacles.flatMap(obstacleLayers)];
ctx.imageSmoothingEnabled=false;mini.imageSmoothingEnabled=false;
function poly(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
function line(a,b,color,dash=[]){ctx.strokeStyle=color;ctx.lineWidth=1/camera.zoom;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
function select(i){selected=i;ui.weapon.value=crew[i].weapon;[...ui.crew.children].forEach((b,n)=>b.classList.toggle('active',n===i));}
function stop(){target=null;order=null;crew.forEach(u=>u.path=[]);ui.order.textContent='명령 중지';}
function reset(){
  crew=CREW_START.map((p,id)=>({...p,id,name:names[id],color:colors[id],eye:1.2,weapon:['pistol','sniper','rifle','pdw'][id],fire:0,path:[]}));
  enemies=ENEMY_START.map((p,id)=>({...p,id,eye:.65,hp:8}));target=null;order=null;shots=[];memory.clearRect(0,0,field.width,field.height);
  camera.x=LZ.x;camera.y=LZ.y;camera.zoom=1;clampCamera(camera);ui.follow.checked=true;ui.zoom.value=100;
  select(0);visionAt=-Infinity;ui.order.textContent='착륙 완료';
}
const known=e=>crew.some(u=>rules.canSee(u,e));
function move(destination){
  target=null;order=destination;const used=[],area=field.surface(destination).id;let failed=0;
  for(const u of crew){
    const [ox,oy]=[[-14,-14],[14,-14],[-14,14],[14,14]][u.id],desired=point(destination.x+ox,destination.y+oy),candidates=[];
    for(let y=-48;y<=48;y+=8)for(let x=-48;x<=48;x+=8){const p=point(destination.x+x,destination.y+y);
      if(field.surface(p).id===area&&!field.blocked(p)&&used.every(q=>distance(p,q)>=18))candidates.push(p);}
    candidates.sort((a,b)=>distance(a,desired)-distance(b,desired));let path=null;
    for(const p of candidates.slice(0,24)){path=field.findPath(u,p);if(path?.length){used.push(path.at(-1));break;}}
    u.path=path??[];u.stuck=false;if(!path)failed++;
  }
  ui.order.textContent=failed?`${failed}명 경로 없음`:'분대 이동';
}
function refreshVision(now){
  if(now-visionAt<160)return;visionAt=now;
  visions=crew.map(u=>{const from=rules.eye(u),points=[];
    for(let i=0;i<96;i++){const angle=i*Math.PI*2/96,to={x:u.x+Math.cos(angle)*VISION_RANGE,y:u.y+Math.sin(angle)*VISION_RANGE,z:from.z};
      const hit=field.raycast(from,to,'vision');points.push(point((hit??to).x,(hit??to).y));}
    return points;});
  memory.fillStyle='#ffffff';for(const points of visions){poly(memory,points);memory.fill();}
  fogCtx.globalCompositeOperation='source-over';fogCtx.clearRect(0,0,field.width,field.height);
  fogCtx.fillStyle='rgba(3,9,11,.96)';fogCtx.fillRect(0,0,field.width,field.height);
  fogCtx.globalCompositeOperation='destination-out';fogCtx.globalAlpha=.35;fogCtx.drawImage(explored,0,0);fogCtx.globalAlpha=1;
  for(const points of visions){poly(fogCtx,points);fogCtx.fill();}fogCtx.globalCompositeOperation='source-over';
}
function update(dt,now){
  crew.forEach(u=>{u.fire=Math.max(0,u.fire-dt);field.advance(u,dt);});
  if(target?.hp>0){const spotted=known(target);for(const u of crew){
    const state=rules.firingState(u,target,spotted),w=WEAPONS[u.weapon];if(u.fire>0||state.status!=='ready')continue;
    u.fire=w.interval;target.hp=Math.max(0,target.hp-w.damage);shots.push({a:field.project(state.a),b:field.project(state.b),beam:w.mode==='beam',life:w.mode==='beam'?.12:.08});
    if(target.hp<=0){target=null;ui.order.textContent='표적 제압';break;}
  }}
  shots=shots.filter(s=>(s.life-=dt)>0);refreshVision(now);
  if(ui.follow.checked){const foot=field.project(crew[selected]),t=Math.min(1,dt*7);camera.x+=(foot.x-camera.x)*t;camera.y+=(foot.y-camera.y)*t;}
  clampCamera(camera);
  if(order&&crew.every(u=>!u.path.length)){ui.order.textContent=crew.some(u=>u.stuck)?'이동 중단':'목적지 도착';order=null;}
}
function actor(u,enemy=false){
  const p=field.project(u);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
  if(enemy){
    if(u.hp<=0){ctx.fillStyle='#725d55';ctx.fillRect(-7,-2,14,4);}
    else{ctx.fillStyle='#ac9474';poly(ctx,[point(0,-20),point(9,-8),point(5,0),point(-5,0),point(-9,-8)]);ctx.fill();
      ctx.fillStyle='#dc806f';ctx.fillRect(-10,-27,20*u.hp/8,2);}
  }else{
    ctx.fillStyle='#172421';ctx.fillRect(-7,-18,14,18);ctx.fillStyle=u.color;ctx.fillRect(-6,-25,12,9);
    ctx.fillStyle='#e2d4b0';ctx.fillRect(-3,-23,6,4);ctx.fillStyle='#0c1717';ctx.fillRect(-6,-4,4,5);ctx.fillRect(2,-4,4,5);
    ctx.strokeStyle=u.id===selected?'#a6f5dd':'#799e98';ctx.lineWidth=1;ctx.strokeRect(-9,-27,18,29);
    ctx.fillStyle='#d4e6df';ctx.font='9px monospace';ctx.fillText(String(u.id+1),-3,12);
  }ctx.restore();
}
function drawHits(){
  ctx.strokeStyle='#ed897c';ctx.lineWidth=1/camera.zoom;
  for(const o of field.obstacles){if(o.poly)poly(ctx,o.poly);else{ctx.beginPath();ctx.ellipse(...o.hit,0,0,Math.PI*2);}ctx.stroke();}
  for(const o of field.obstacles){if(o.visionHeight===undefined)continue;
    for(const [hit,color] of [[o.visionHit,'#87bdda'],[o.shotHit??o.hit,'#e3b562']]){
      ctx.strokeStyle=color;ctx.beginPath();ctx.ellipse(...hit,0,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#d4e8df';ctx.font='9px monospace';ctx.fillText(`시야 ${o.visionHeight} / 탄환 ${o.shotHeight}`,o.hit[0]-35,o.hit[1]+16);
  }
  ctx.strokeStyle='#8edfc5';for(const points of [field.rampScreen,field.plateauScreen]){poly(ctx,points);ctx.stroke();}
  for(const u of crew){const p=field.project(u);ctx.fillStyle='#fff';ctx.fillRect(p.x-1,p.y-1,3,3);}
}
function drawMini(){
  const sx=240/field.width,sy=140/field.height;mini.clearRect(0,0,240,140);mini.drawImage(ground,0,0,240,140);
  mini.save();mini.scale(sx,sy);mini.fillStyle='#555e53';
  for(const o of field.obstacles){mini.beginPath();if(o.hit)mini.ellipse(...o.hit,0,0,Math.PI*2);else poly(mini,o.poly);mini.fill();}
  mini.fillStyle='#7c8973';poly(mini,field.plateau);mini.fill();
  if(ui.fog.checked)mini.drawImage(fogCanvas,0,0);
  for(const e of enemies){if(e.hp<=0||!known(e))continue;mini.fillStyle='#f1887c';mini.fillRect(e.x-12,e.y-12,24,24);}
  for(const z of [LZ,SITE]){mini.strokeStyle='#72cde5';mini.lineWidth=2/sx;mini.strokeRect(z.x-20,z.y-20,40,40);}
  for(const u of crew){mini.fillStyle=u.color;mini.fillRect(u.x-9,u.y-9,18,18);}
  mini.strokeStyle='#b9dfda';mini.lineWidth=1/sx;mini.strokeRect(camera.x-W/camera.zoom/2,camera.y-H/camera.zoom/2,W/camera.zoom,H/camera.zoom);mini.restore();
}
function draw(now){
  ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
  ctx.drawImage(ground,0,0);
  for(const z of [LZ,SITE]){ctx.strokeStyle='#87bcc5';ctx.lineWidth=1;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(z.x,z.y,45,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  for(const u of crew){let p=u;for(const q of u.path){
    const steps=Math.max(1,Math.ceil(distance(p,q)/4));let previous=field.project(p);
    for(let i=1;i<=steps;i++){const next=field.project(point(p.x+(q.x-p.x)*i/steps,p.y+(q.y-p.y)*i/steps));line(previous,next,'rgba(148,217,203,.45)');previous=next;}p=q;
  }}
  const items=sprites.map(s=>({depth:s.depth,draw:()=>s.kind==='geyser'
    ?drawGeyser(ctx,textures[s.atlas],s,now):ctx.drawImage(textures[s.atlas],...s.src,...s.draw)}));
  crew.forEach(u=>items.push({depth:field.actorDepth(u),draw:()=>actor(u)}));
  enemies.filter(e=>!ui.fog.checked||known(e)).forEach(e=>items.push({depth:field.actorDepth(e),draw:()=>actor(e,true)}));
  items.sort((a,b)=>a.depth-b.depth).forEach(i=>i.draw());
  if(ui.fog.checked)ctx.drawImage(fogCanvas,0,0);
  const u=crew[selected],w=WEAPONS[u.weapon],foot=field.project(u);
  if(ui.range.checked){ctx.strokeStyle='rgba(105,185,226,.55)';ctx.lineWidth=1/camera.zoom;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(foot.x,foot.y,w.range,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  if(ui.hits.checked)drawHits();
  for(const e of enemies){if(e.hp<=0||!known(e)||distance(u,e)>VISION_RANGE)continue;
    const state=rules.visibilityState(u,e),p=field.project(e);ctx.fillStyle=contactColors[state];ctx.font='10px monospace';ctx.fillText(contactLabels[state],p.x-35,p.y-34);
    if(state!=='hidden'){
      const check=rules.firingState(u,e,true);
      if(check.a)line(field.project(check.a),field.project(check.hit??check.b),contactColors[state],[3,5]);
    }
  }
  for(const s of shots){line(s.a,s.b,s.beam?'#81dcff':'#e9d798');}
  ctx.restore();drawMini();
  ui.readout.textContent=`${u.name}\n시야 ${VISION_RANGE} · 사거리 ${w.range}\n좌표 ${Math.round(u.x)}, ${Math.round(u.y)} · 고도 ${field.heightAt(u).toFixed(1)}`;
  ui.status.textContent=`${crew.filter(u=>u.path.length).length}명 이동 · 잔여 표적 ${enemies.filter(e=>e.hp>0).length}`;
  ui.zoomValue.textContent=`${Math.round(camera.zoom*100)}%`;ui.zoom.value=Math.round(camera.zoom*100);
  const nearby=enemies.filter(e=>e.hp>0&&distance(u,e)<=VISION_RANGE);
  ui.targets.textContent=nearby.length?nearby.map(e=>{
    const state=rules.visibilityState(u,e),fire=rules.firingState(u,e,known(e));
    return `표적 ${e.id+1} · ${contactLabels[state]}${fire.status==='far'?' · '+STATUS.far:''}`;
  }).join('\n'):'시야 거리 내 표적 없음';
  ui.zone.textContent=ZONES.reduce((a,b)=>distance(a,u)<distance(b,u)?a:b).name;
}
for(const [key,w] of Object.entries(WEAPONS)){const o=document.createElement('option');o.value=key;o.textContent=w.name;ui.weapon.appendChild(o);}
for(let i=0;i<4;i++){const b=document.createElement('button');b.onclick=()=>select(i);b.innerHTML=`<b>${i+1} · ${names[i]}</b><small></small>`;ui.crew.appendChild(b);}
ui.weapon.onchange=()=>{if(!ready)return;crew[selected].weapon=ui.weapon.value;crew[selected].fire=0;};
for(const z of ZONES){const b=document.createElement('button');b.textContent=z.name;b.onclick=()=>{ui.follow.checked=false;camera.x=z.x;camera.y=z.y;clampCamera(camera);};ui.zones.appendChild(b);}
ui.zoom.oninput=()=>zoomCamera(camera,+ui.zoom.value/100);ui.reset.onclick=()=>{if(ready)reset();};ui.stop.onclick=stop;
const keys=new Set();let drag=null;
function canvasPoint(e){const r=ui.view.getBoundingClientRect();return point((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);}
function command(p){
  const e=enemies.find(e=>e.hp>0&&known(e)&&distance(field.project(e),point(p.x,p.y+10))<20);
  if(e){stop();target=e;ui.order.textContent='분대 집중 사격';return;}
  const member=crew.find(u=>distance(field.project(u),point(p.x,p.y+12))<18);
  if(member){select(member.id);return;}move(field.pickGround(p));
}
ui.view.oncontextmenu=e=>e.preventDefault();
ui.view.onpointerdown=e=>{
  if(!ready)return;const p=canvasPoint(e);ui.view.setPointerCapture(e.pointerId);
  if(e.button===1||keys.has(' ')||e.pointerType==='touch'){drag={p,start:p,x:camera.x,y:camera.y,touch:e.pointerType==='touch',moved:false};return;}
  if(e.button===2)move(field.pickGround(screenToWorld(camera,p)));else command(screenToWorld(camera,p));
};
ui.view.onpointermove=e=>{if(!drag)return;const p=canvasPoint(e);if(distance(p,drag.start)>6){drag.moved=true;ui.follow.checked=false;}
  if(drag.moved){camera.x=drag.x-(p.x-drag.start.x)/camera.zoom;camera.y=drag.y-(p.y-drag.start.y)/camera.zoom;clampCamera(camera);}};
ui.view.onpointerup=e=>{if(drag?.touch&&!drag.moved)command(screenToWorld(camera,canvasPoint(e)));drag=null;};
ui.view.onpointercancel=()=>{drag=null;};
ui.view.addEventListener('wheel',e=>{e.preventDefault();zoomCamera(camera,camera.zoom*Math.exp(-e.deltaY*.0012),canvasPoint(e));},{passive:false});
ui.minimap.onpointerdown=e=>{const r=ui.minimap.getBoundingClientRect();ui.follow.checked=false;camera.x=(e.clientX-r.left)/r.width*field.width;camera.y=(e.clientY-r.top)/r.height*field.height;clampCamera(camera);};
addEventListener('keydown',e=>{if(!ready||['INPUT','SELECT','BUTTON'].includes(e.target.tagName))return;keys.add(e.key.toLowerCase());
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  if(e.key>='1'&&e.key<='4')select(+e.key-1);if(e.key==='Escape')stop();if(e.key.toLowerCase()==='m')ui.follow.checked=!ui.follow.checked;
});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();drag=null;});
function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(ready){
  const dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  if(dx||dy){ui.follow.checked=false;camera.x+=dx*400*dt/camera.zoom;camera.y+=dy*400*dt/camera.zoom;}
  update(dt,now);draw(now);crew.forEach((u,i)=>ui.crew.children[i].querySelector('small').textContent=WEAPONS[u.weapon].name);
}requestAnimationFrame(frame);}requestAnimationFrame(frame);
async function load(){
  for(const [key,url] of Object.entries({terrain:'../assets/terrain/drafts/terrain-spritesheet-v3.png',nature:'../assets/terrain/drafts/nature-atlas-v1.png',cover:'../assets/terrain/drafts/natural-cover-atlas-v1.png',ground:'../assets/terrain/drafts/regolith-tile-v1.png'})){
    const image=new Image();image.src=url;await image.decode();textures[key]=image;
  }
  const bg=ground.getContext('2d');bg.imageSmoothingEnabled=false;
  for(let y=0;y<field.height;y+=192)for(let x=0;x<field.width;x+=192)bg.drawImage(textures.ground,x,y,192,192);
  reset();ready=true;ui.loading.remove();
}
load().catch(()=>{ui.loading.textContent='지형 자료를 불러오지 못했습니다.';});
