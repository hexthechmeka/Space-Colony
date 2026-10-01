import {point,distance,obstacleLayers} from './terrain-geometry.js';
import {createSquadMovement} from './squad-movement.js';
import {createFieldCombat,pickFocusTarget} from './field-combat.js';
import * as originalMap from './field-map-data.js';
import * as elevationMap from './elevation-map-data.js';
import {WEAPONS,STATUS,createWeaponRules} from './terrain-weapons.js';
import {createCamera,clampCamera,centerCamera,edgeCameraDirection,screenToWorld,zoomCamera} from './field-camera.js';
import {drawGeyser} from './geyser-animation.js';
import {drawFog,MEMORY_COLOR,MEMORY_OPACITY,FOG_EDGE_BLUR,VISION_REFRESH_MS,terrainObjectVisible} from './field-fog.js';

const ui=Object.fromEntries(['view','minimap','loading','status','order','crew','weapon','readout','targets',
  'follow','fog','hits','range','zoom','zoomValue','zone','zones','stop','reset'].map(id=>[id,document.getElementById(id)]));
const ctx=ui.view.getContext('2d'),mini=ui.minimap.getContext('2d'),W=960,H=600;
const elevationMode=new URLSearchParams(location.search).get('terrain')==='elevation';
const {field,LZ,SITE,ZONES,CREW_START,ENEMY_START}=elevationMode?elevationMap:originalMap;
const mapLink=document.createElement('a');mapLink.href=elevationMode?'./field-map.html':'./field-map.html?terrain=elevation';mapLink.textContent=elevationMode?'기존 자연 지형':'고저차 지형';document.querySelector('header').append(mapLink);
let deploymentZone=ZONES[0];
const sightToggle=document.createElement('input'),sightLabel=document.createElement('label');
sightToggle.type='checkbox';sightToggle.checked=elevationMode;sightLabel.append(sightToggle,document.createTextNode('개인 시야'));ui.range.parentElement.after(sightLabel);
if(elevationMode){const deploy=document.createElement('button');deploy.textContent='관측 지점에 분대 배치';deploy.style.cssText='width:100%;margin-top:6px';ui.zones.after(deploy);
  deploy.onclick=()=>{if(!ready)return;stop();
    const used=[];
    for(const u of crew){
      const offsets=[[-18,-18],[18,-18],[-18,18],[18,18],[-36,0],[36,0],[0,-36],[0,36]];
      const p=offsets.map(([x,y])=>point(deploymentZone.x+x,deploymentZone.y+y)).find(p=>!field.blocked(p)&&used.every(q=>distance(p,q)>=24));
      if(p){u.x=p.x;u.y=p.y;u.stuck=false;used.push(p);}
    }
    visionAt=-Infinity;visionStamp=null;knownCache.clear();hudAt=-Infinity;ui.order.textContent='시험 배치 완료';
  };
}
const contactLabels={clear:'보임 · 사격 경로 확보',visible:'보임 · 사격 경로 차폐',hidden:'시야 완전 차단'};
const contactColors={clear:'#76ddba',visible:'#e3b562',hidden:'#e18884'};
const legend=document.createElement('div');legend.style.cssText='font-size:11px;margin-top:9px';
for(const [state,label] of Object.entries(contactLabels)){const row=document.createElement('div');row.textContent=label;row.style.color=contactColors[state];legend.appendChild(row);}ui.targets.after(legend);
const camera=createCamera(field.width,field.height,W,H),rules=createWeaponRules(field);
const squadMovement=createSquadMovement(field);
const combat=createFieldCombat(field,{known:e=>known(e)});
const textures={},names=['반 하이드','오르타','두골','마르타'],colors=['#dfc56e','#8fc879','#d59b62','#90a6b6'];
let crew=[],enemies=[],selected=0,target=null,manual=null,order=null,shots=[],ready=false,last=performance.now(),visionAt=0,visionStamp=null,visions=[],hudAt=0,spaceHeld=false;
const skillLabel=document.createElement('label'),skillSlider=document.createElement('input'),skillValue=document.createElement('span');
skillSlider.type='range';skillSlider.min=0;skillSlider.max=100;skillSlider.setAttribute('aria-label','사격 숙련도');
skillSlider.style.width='100%';skillLabel.textContent='사격 숙련도 ';skillLabel.appendChild(skillValue);ui.weapon.after(skillLabel,skillSlider);
const ammoMeters=[],ammoLabels=[];
const FOG_SCALE=.5;
const explored=document.createElement('canvas');explored.width=Math.ceil(field.width*FOG_SCALE);explored.height=Math.ceil(field.height*FOG_SCALE);
const memory=explored.getContext('2d'),fogCanvas=document.createElement('canvas');fogCanvas.width=explored.width;fogCanvas.height=explored.height;
const fogCtx=fogCanvas.getContext('2d');
memory.scale(FOG_SCALE,FOG_SCALE);fogCtx.scale(FOG_SCALE,FOG_SCALE);
const ground=document.createElement('canvas');ground.width=field.width;ground.height=field.height;
const sprites=[...field.terrainSprites,...field.obstacles.flatMap(obstacleLayers)];
const discoveredObjects=new Set(),visibleObjects=new Set(),darkSprites=new Map();
const discoveredEdges=new Set(),visibleEdges=new Set();
const knownCache=new Map();
ctx.imageSmoothingEnabled=false;mini.imageSmoothingEnabled=false;
ui.view.style.cursor='crosshair';
function poly(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
function line(a,b,color,dash=[],width=1){ctx.strokeStyle=color;ctx.lineWidth=width/camera.zoom;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
function select(i){manual=null;selected=i;crew.forEach(u=>{u.selected=u.id===i;});visionAt=-Infinity;knownCache.clear();hudAt=-Infinity;ui.weapon.value=crew[i].weapon;skillSlider.value=crew[i].skill*100;[...ui.crew.children].forEach((b,n)=>b.classList.toggle('active',n===i));}
function stop(){target=null;manual=null;order=null;squadMovement.stop(crew);crew.forEach(combat.cancel);ui.order.textContent='명령 중지';}
function reset(){
  edgePointer=null;spaceHeld=false;deploymentZone=ZONES[0];knownCache.clear();hudAt=-Infinity;
  discoveredObjects.clear();visibleObjects.clear();
  discoveredEdges.clear();visibleEdges.clear();
  crew=CREW_START.map((p,id)=>({...p,id,name:names[id],color:colors[id],eye:1.2,skill:[.65,.8,.55,.7][id],weapon:['pistol','sniper','rifle','pdw'][id],path:[]}));crew.forEach(combat.equip);
  enemies=ENEMY_START.map((p,id)=>({...p,id,eye:.65,hp:8}));target=null;manual=null;order=null;shots=[];memory.clearRect(0,0,field.width,field.height);
  camera.edgeCenter=false;camera.x=LZ.x;camera.y=LZ.y;camera.zoom=1;clampCamera(camera);ui.follow.checked=true;ui.zoom.value=100;
  select(0);visionAt=-Infinity;visionStamp=null;ui.order.textContent='착륙 완료';
}
const known=e=>{if(!knownCache.has(e))knownCache.set(e,crew.some(u=>rules.canSee(u,e)));return knownCache.get(e);};
function move(destination){
  target=null;manual=null;crew.forEach(combat.cancel);order=destination;const failed=squadMovement.order(crew,destination);
  ui.order.textContent=failed?`${failed}명 경로 없음`:'분대 이동';
}
function refreshVision(now){
  if(now-visionAt<VISION_REFRESH_MS)return;visionAt=now;
  const stamp=crew.map(u=>`${u.x.toFixed(1)},${u.y.toFixed(1)},${u.eye},${u.weapon},${u.selected}`).join(';');
  if(stamp===visionStamp)return;visionStamp=stamp;
  visibleObjects.clear();
  visibleEdges.clear();
  if(elevationMode)elevationMap.boundaries.forEach((edge,i)=>{
    const p={x:(edge.a.x+edge.b.x)/2,y:(edge.a.y+edge.b.y)/2,z:edge.high+.05};
    if(crew.some(u=>distance(u,p)<=rules.visionRange(u)&&!field.raycast(rules.eye(u),p,'vision'))){visibleEdges.add(i);discoveredEdges.add(i);}
  });
  for(const object of [...field.terrainSprites,...field.obstacles]){
    if(crew.some(u=>terrainObjectVisible(object,[u],field,rules.visionRange(u)))){visibleObjects.add(object.id);discoveredObjects.add(object.id);}
  }
  visions=crew.map(u=>{const from=rules.eye(u),points=[];
    for(let i=0;i<96;i++){const angle=i*Math.PI*2/96,range=rules.visionRange(u),to={x:u.x+Math.cos(angle)*range,y:u.y+Math.sin(angle)*range,z:from.z};
      const hit=field.raycast(from,to,'vision'),p=point((hit??to).x,(hit??to).y);points.push(elevationMode?field.project(p):p);}
    return points;});
  memory.save();memory.filter=`blur(${FOG_EDGE_BLUR}px)`;
  memory.fillStyle=MEMORY_COLOR;memory.beginPath();for(const points of visions){points.forEach((p,i)=>i?memory.lineTo(p.x,p.y):memory.moveTo(p.x,p.y));memory.closePath();}memory.fill();memory.restore();
  drawFog(fogCtx,explored,visions,field.width,field.height);
}
function fireIntent(u){
  if(manual?.id===u.id)return {point:screenToWorld(camera,manual.p)};
  if(target?.hp>0&&rules.firingState(u,target,known(target)).status==='ready')return {target};
  return null;
}
function emit(rays){shots.push(...rays.map(ray=>({...ray,a:field.project(ray.a),b:field.project(ray.b)})));}
function update(dt,now){
  for(const u of crew){u.weaponMove=WEAPONS[u.weapon].move;u.firingMove=u.weapon==='machinegun'&&fireIntent(u)&&!u.gun.reload&&u.gun.ammo>0?.28:1;}
  squadMovement.update(crew,dt);
  knownCache.clear();
  for(const u of crew)emit(combat.tick(u,dt,fireIntent(u),enemies));
  if(target&&target.hp<=0){target=null;ui.order.textContent='표적 제압';}
  shots=shots.filter(s=>(s.life-=dt)>0);refreshVision(now);
  if(spaceHeld||ui.follow.checked){const foot=field.project(crew[selected]),t=spaceHeld?1:Math.min(1,dt*7);camera.x+=(foot.x-camera.x)*t;camera.y+=(foot.y-camera.y)*t;}
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
    ctx.scale(1.4,1.4);
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
  if(ui.fog.checked)mini.drawImage(fogCanvas,0,0,field.width,field.height);
  for(const e of enemies){if(e.hp<=0||!known(e))continue;const p=elevationMode?field.project(e):e;mini.fillStyle='#f1887c';mini.fillRect(p.x-12,p.y-12,24,24);}
  for(const z of [LZ,SITE]){mini.strokeStyle='#72cde5';mini.lineWidth=2/sx;mini.strokeRect(z.x-20,z.y-20,40,40);}
  for(const u of crew){const p=elevationMode?field.project(u):u;mini.fillStyle=u.color;mini.fillRect(p.x-9,p.y-9,18,18);}
  mini.strokeStyle='#b9dfda';mini.lineWidth=1/sx;mini.strokeRect(camera.x-W/camera.zoom/2,camera.y-H/camera.zoom/2,W/camera.zoom,H/camera.zoom);mini.restore();
}
function draw(now){
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#000000';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
  ctx.drawImage(ground,0,0);
  if(ui.fog.checked){ctx.imageSmoothingEnabled=true;ctx.drawImage(fogCanvas,0,0,field.width,field.height);ctx.imageSmoothingEnabled=false;}
  for(const z of [LZ,SITE]){ctx.strokeStyle='#87bcc5';ctx.lineWidth=1;ctx.setLineDash([6,6]);ctx.beginPath();ctx.arc(z.x,z.y,45,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  ctx.strokeStyle='rgba(148,217,203,.45)';ctx.lineWidth=1/camera.zoom;ctx.beginPath();
  for(const u of crew){let p=u;const start=field.project(p);ctx.moveTo(start.x,start.y);for(const q of u.path){
    const steps=Math.max(1,Math.ceil(distance(p,q)/4));
    for(let i=1;i<=steps;i++){const next=field.project(point(p.x+(q.x-p.x)*i/steps,p.y+(q.y-p.y)*i/steps));ctx.lineTo(next.x,next.y);}p=q;
  }}ctx.stroke();
  const items=sprites.filter(s=>!ui.fog.checked||discoveredObjects.has(s.id)).map(s=>({depth:s.depth,draw:()=>{
    if(ui.fog.checked&&!visibleObjects.has(s.id)){ctx.drawImage(darkSprites.get(s),...s.draw);return;}
    if(s.kind==='geyser')drawGeyser(ctx,textures[s.atlas],s,now);
    else ctx.drawImage(textures[s.atlas],...s.src,...s.draw);
  }}));
  if(elevationMode)elevationMap.boundaries.forEach((edge,i)=>{
    if(ui.fog.checked&&!discoveredEdges.has(i))return;
    items.push({depth:edge.depth,draw:()=>elevationMap.drawElevationEdge(ctx,textures.elevation,edge,ui.fog.checked&&!visibleEdges.has(i))});
  });
  crew.forEach(u=>items.push({depth:field.actorDepth(u),draw:()=>actor(u)}));
  enemies.filter(e=>!ui.fog.checked||known(e)).forEach(e=>items.push({depth:field.actorDepth(e),draw:()=>actor(e,true)}));
  items.sort((a,b)=>a.depth-b.depth).forEach(i=>i.draw());
  const u=crew[selected],w=WEAPONS[u.weapon],foot=field.project(u);
  if(sightToggle.checked){ctx.strokeStyle='rgba(139,224,171,.7)';ctx.lineWidth=1/camera.zoom;ctx.setLineDash([2,5]);ctx.beginPath();ctx.arc(foot.x,foot.y,rules.visionRange(u),0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  if(ui.range.checked){ctx.strokeStyle='rgba(105,185,226,.55)';ctx.lineWidth=1/camera.zoom;ctx.setLineDash([5,7]);ctx.beginPath();ctx.arc(foot.x,foot.y,w.range,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  if(ui.hits.checked)drawHits();
  for(const e of enemies){if(e.hp<=0||!known(e)||distance(u,e)>rules.visionRange(u))continue;
    const state=rules.visibilityState(u,e),p=field.project(e);ctx.fillStyle=contactColors[state];ctx.font='10px monospace';ctx.fillText(contactLabels[state],p.x-35,p.y-34);
    if(state!=='hidden'){
      const check=rules.firingState(u,e,true);
      if(check.a)line(field.project(check.a),field.project(check.hit??check.b),contactColors[state],[3,5]);
    }
  }
  for(const s of shots){line(s.a,s.b,s.beam?'#81dcff':'#e9d798',[],s.beam?3:2);}
  if(manual){const p=screenToWorld(camera,manual.p);line(point(p.x-5,p.y),point(p.x+5,p.y),'#c5e8df');line(point(p.x,p.y-5),point(p.x,p.y+5),'#c5e8df');}
  if(target&&known(target)){const p=field.project(target);ctx.strokeStyle='#f08e7c';ctx.lineWidth=1/camera.zoom;ctx.strokeRect(p.x-13,p.y-30,26,34);}
  ctx.restore();if(now-hudAt<100)return;hudAt=now;drawMini();
  ui.readout.textContent=`${u.name}\n시야 ${rules.visionRange(u)} · 사거리 ${w.range}\n좌표 ${Math.round(u.x)}, ${Math.round(u.y)} · 고도 ${field.heightAt(u).toFixed(1)}\n${u.gun.reload>0?'교체 중 '+u.gun.reload.toFixed(1)+'초':u.gun.channel>0?'지속 조사':u.gun.charge>0?'조준 중':u.gun.ammo<=0?'보급 없음':'사격 대기'}`;
  skillValue.textContent=`${Math.round(u.skill*100)}%`;
  ui.status.textContent=`${crew.filter(u=>u.path.length).length}명 이동 · 잔여 표적 ${enemies.filter(e=>e.hp>0).length}`;
  ui.zoomValue.textContent=`${Math.round(camera.zoom*100)}%`;ui.zoom.value=Math.round(camera.zoom*100);
  const nearby=enemies.filter(e=>e.hp>0&&distance(u,e)<=rules.visionRange(u));
  ui.targets.textContent=nearby.length?nearby.map(e=>{
    const state=rules.visibilityState(u,e),fire=rules.firingState(u,e,known(e));
    return `표적 ${e.id+1} · ${contactLabels[state]}${fire.status==='far'?' · '+STATUS.far:''}`;
  }).join('\n'):'시야 거리 내 표적 없음';
  ui.zone.textContent=ZONES.reduce((a,b)=>distance(a,u)<distance(b,u)?a:b).name;
  return true;
}
for(const [key,w] of Object.entries(WEAPONS)){const o=document.createElement('option');o.value=key;o.textContent=w.name;ui.weapon.appendChild(o);}
for(let i=0;i<4;i++){const b=document.createElement('button');b.onclick=()=>select(i);b.innerHTML=`<b>${i+1} · ${names[i]}</b><small></small>`;
  const meter=document.createElement('meter'),label=document.createElement('span');meter.min=0;meter.max=100;meter.style.cssText='width:min(52px,45%);height:10px;margin-right:5px';meter.setAttribute('aria-label',`${names[i]} 배터리 충전량`);
  b.append(meter,label);ammoMeters.push(meter);ammoLabels.push(label);label.style.fontSize='11px';ui.crew.appendChild(b);}
ui.weapon.onchange=()=>{if(!ready)return;manual=null;target=null;crew[selected].weapon=ui.weapon.value;combat.equip(crew[selected]);visionAt=-Infinity;};
skillSlider.oninput=()=>{if(ready)crew[selected].skill=+skillSlider.value/100;};
for(const z of ZONES){const b=document.createElement('button');b.textContent=z.name;b.onclick=()=>{deploymentZone=z;ui.follow.checked=false;camera.x=z.x;camera.y=elevationMode?field.project(z).y:z.y;clampCamera(camera);};ui.zones.appendChild(b);}
ui.zoom.oninput=()=>zoomCamera(camera,+ui.zoom.value/100);ui.reset.onclick=()=>{if(ready)reset();};ui.stop.onclick=stop;
const keys=new Set();let drag=null,edgePointer=null;
addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||e.target!==ui.view){edgePointer=null;return;}
  const r=ui.view.getBoundingClientRect();edgePointer={x:e.clientX-r.left,y:e.clientY-r.top,width:r.width,height:r.height};
});
ui.view.onpointerleave=()=>{edgePointer=null;};
addEventListener('visibilitychange',()=>{if(document.hidden){spaceHeld=false;keys.clear();edgePointer=null;manual=null;}});
function canvasPoint(e){const r=ui.view.getBoundingClientRect();return point((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);}
function command(p,canvasPosition){
  const e=pickFocusTarget(enemies,p,field.project,known);
  if(e){stop();target=e;ui.order.textContent='분대 집중 사격';return;}
  target=null;manual={id:selected,p:canvasPosition};
  if(crew[selected].weapon!=='machinegun')squadMovement.stop([crew[selected]]);
  ui.order.textContent='직접 사격';emit(combat.tick(crew[selected],1/60,fireIntent(crew[selected]),enemies));
}
ui.view.oncontextmenu=e=>e.preventDefault();
ui.view.onpointerdown=e=>{
  if(!ready)return;const p=canvasPoint(e);ui.view.setPointerCapture(e.pointerId);
  if(e.button===1||e.pointerType==='touch'){drag={p,start:p,x:camera.x,y:camera.y,touch:e.pointerType==='touch',moved:false};return;}
  if(e.button===2)move(field.pickGround(screenToWorld(camera,p)));else if(e.button===0)command(screenToWorld(camera,p),p);
};
ui.view.onpointermove=e=>{const p=canvasPoint(e);if(manual)manual.p=p;if(!drag)return;if(distance(p,drag.start)>6){drag.moved=true;ui.follow.checked=false;}
  if(drag.moved){camera.x=drag.x-(p.x-drag.start.x)/camera.zoom;camera.y=drag.y-(p.y-drag.start.y)/camera.zoom;clampCamera(camera);}};
ui.view.onpointerup=e=>{if(drag?.touch&&!drag.moved){const p=canvasPoint(e);command(screenToWorld(camera,p),p);}manual=null;drag=null;};
ui.view.onpointercancel=()=>{manual=null;drag=null;edgePointer=null;};
ui.view.onlostpointercapture=()=>{manual=null;};
ui.view.addEventListener('wheel',e=>{e.preventDefault();zoomCamera(camera,camera.zoom*Math.exp(-e.deltaY*.0012),canvasPoint(e));},{passive:false});
ui.minimap.onpointerdown=e=>{const r=ui.minimap.getBoundingClientRect();ui.follow.checked=false;camera.x=(e.clientX-r.left)/r.width*field.width;camera.y=(e.clientY-r.top)/r.height*field.height;clampCamera(camera);};
addEventListener('keydown',e=>{
  if(!ready||e.target.isContentEditable||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(e.code==='Space'){e.preventDefault();spaceHeld=true;edgePointer=null;if(!e.repeat)centerCamera(camera,field.project(crew[selected]));return;}
  if(e.repeat)return;
  if(e.target.tagName==='BUTTON')return;keys.add(e.key.toLowerCase());
  if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();
  if(e.key>='1'&&e.key<='4')select(+e.key-1);if(e.key==='Escape')stop();if(e.key.toLowerCase()==='m')ui.follow.checked=!ui.follow.checked;
});addEventListener('keyup',e=>{if(e.code==='Space')spaceHeld=false;keys.delete(e.key.toLowerCase());});addEventListener('blur',()=>{spaceHeld=false;keys.clear();manual=null;drag=null;edgePointer=null;});
function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(ready){
  let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  if(!dx&&!dy&&!drag&&!spaceHeld){const edge=edgeCameraDirection(edgePointer);dx=edge.x;dy=edge.y;}
  if(dx||dy){ui.follow.checked=false;camera.x+=dx*400*dt/camera.zoom;camera.y+=dy*400*dt/camera.zoom;}
  update(dt,now);if(draw(now))crew.forEach((u,i)=>{
    const w=WEAPONS[u.weapon];ui.crew.children[i].querySelector('small').textContent=w.name;
    ammoMeters[i].hidden=!w.battery;ammoMeters[i].value=u.gun.ammo;
    ammoLabels[i].textContent=w.battery?`예비 ${u.gun.reserve}`:`${u.gun.ammo} / ${u.gun.reserve}`;
  });
}requestAnimationFrame(frame);}requestAnimationFrame(frame);
async function load(){
  for(const [key,url] of Object.entries({terrain:'../assets/terrain/drafts/terrain-spritesheet-v3.png',nature:'../assets/terrain/drafts/nature-atlas-v1.png',cover:'../assets/terrain/drafts/natural-cover-atlas-v1.png',ground:'../assets/terrain/drafts/regolith-tile-v1.png'})){
    const image=new Image();image.src=url;await image.decode();textures[key]=image;
  }
  if(elevationMode){const image=new Image();image.src='../assets/terrain/drafts/elevation-textures-v1.png';await image.decode();textures.elevation=image;}
  const bg=ground.getContext('2d');bg.imageSmoothingEnabled=false;
  for(const sprite of sprites){
    const image=document.createElement('canvas');image.width=sprite.src[2];image.height=sprite.src[3];
    const paint=image.getContext('2d');paint.drawImage(textures[sprite.atlas],...sprite.src,0,0,image.width,image.height);
    paint.globalCompositeOperation='source-atop';paint.fillStyle=`rgba(0,0,0,${MEMORY_OPACITY})`;paint.fillRect(0,0,image.width,image.height);
    darkSprites.set(sprite,image);
  }
  for(let y=0;y<field.height;y+=192)for(let x=0;x<field.width;x+=192)bg.drawImage(textures.ground,x,y,192,192);
  if(elevationMode)elevationMap.paintElevationGround(bg,textures.elevation);
  reset();ready=true;ui.loading.remove();
}
load().catch(()=>{ui.loading.textContent='지형 자료를 불러오지 못했습니다.';});
