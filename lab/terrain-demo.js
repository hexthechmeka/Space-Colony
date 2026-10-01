import {WIDTH as W,HEIGHT as H,MOVE_SPEED,point,distance,obstacles,terrainSprites,
  rampScreen,plateauScreen,surface,heightAt,actorDepth,obstacleLayers,project,pickGround,blocked,
  raycast,findPath,advance} from './terrain-geometry.js';
import {VISION_RANGE,WEAPONS,STATUS,eye,canSee,firingState} from './terrain-weapons.js';

const canvas=document.querySelector('#view'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const ui=Object.fromEntries(['loading','sceneStatus','crewSelect','memberInfo','targetInfo',
  'showVision','showHits','showShot','showGrid','cameraTruth','reset','allVision'].map(id=>[id,document.getElementById(id)]));
const initialCrew=[
  {x:100,y:430,color:'#dfc56e',name:'반 하이드',role:'산탄총',eye:1.2},
  {x:132,y:454,color:'#8fc879',name:'오르타',role:'저격총',eye:1.25},
  {x:166,y:456,color:'#d59b62',name:'두골',role:'권총',eye:1.15},
  {x:95,y:393,color:'#90a6b6',name:'마르타',role:'중화기',eye:1.25},
];
let crew=[],enemies=[],selected=0,order=null,attackTarget=null,shots=[],allVision=false,ready=false;
let last=performance.now(),visionTime=-Infinity,visionShapes=[];
const weaponSelect=document.createElement('select');weaponSelect.id='weaponSelect';
weaponSelect.setAttribute('aria-label','무기군');
weaponSelect.style.cssText='width:100%;margin-top:8px;padding:7px;background:#0b1211;color:#9af5d7;border:1px solid #34534a';
for(const [id,w] of Object.entries(WEAPONS)){const option=document.createElement('option');option.value=id;option.textContent=w.name;weaponSelect.appendChild(option);}
ui.memberInfo.after(weaponSelect);
const weaponInfo=document.createElement('div');weaponInfo.className='readout';weaponSelect.after(weaponInfo);
const targetStates=document.createElement('div');targetStates.className='readout';ui.targetInfo.after(targetStates);
weaponSelect.onchange=()=>{if(!ready)return;crew[selected].weapon=weaponSelect.value;crew[selected].fire=0;};
const atlas=new Image();
function selectCrew(i){selected=i;visionTime=-Infinity;if(crew[i])weaponSelect.value=crew[i].weapon;[...ui.crewSelect.children].forEach((b,n)=>b.classList.toggle('active',n===i));}
function reset(){
  crew=initialCrew.map((u,id)=>({...u,id,weapon:['pistol','sniper','rifle','pdw'][id],path:[],fire:0,stuck:false}));
  enemies=[{x:282,y:240},{x:505,y:188},{x:788,y:396},{x:818,y:228}]
    .map((e,id)=>({...e,id,hp:5,path:[],alert:false,repath:0}));
  selectCrew(0);order=null;attackTarget=null;shots=[];visionTime=-Infinity;
  ui.targetInfo.textContent='이동 대기';
}
const spotters=e=>crew.filter(u=>canSee(u,e));
function moveGroup(target){
  attackTarget=null;order=target;const used=[],area=surface(target).id;let failed=0;
  crew.forEach((u,i)=>{
    const [ox,oy]=[[-12,-12],[12,-12],[-12,12],[12,12]][i],desired=point(target.x+ox,target.y+oy),candidates=[];
    for(let y=-40;y<=40;y+=8)for(let x=-40;x<=40;x+=8){const p=point(target.x+x,target.y+y);
      if(surface(p).id===area&&!blocked(p)&&used.every(q=>distance(p,q)>=13))candidates.push(p);}
    candidates.sort((a,b)=>distance(a,desired)-distance(b,desired));
    let route=null;for(const p of candidates.slice(0,16)){route=findPath(u,p);if(route?.length){used.push(route.at(-1));break;}}
    u.path=route??[];u.stuck=!route;if(!route)failed++;
  });
  ui.targetInfo.textContent=failed?`${failed}명은 목적지로 이동할 수 없습니다.`:'분대 이동 중';
}
function commandAttack(e){
  const members=spotters(e);if(!members.length){ui.targetInfo.textContent='시야 미확보';return;}
  attackTarget=e;order=null;crew.forEach(u=>u.path=[]);e.alert=true;
  ui.targetInfo.textContent=`${members.map(u=>u.name).join(', ')} 교전 중`;
}
function update(dt){
  for(const u of crew){u.fire=Math.max(0,u.fire-dt);advance(u,dt);}
  for(const e of enemies){if(e.hp<=0)continue;e.repath-=dt;
    const closest=crew.reduce((a,b)=>distance(a,e)<distance(b,e)?a:b);
    if(canSee({...e,eye:1},closest))e.alert=true;
    if(e.alert&&distance(e,closest)>148){if(e.repath<=0){e.repath=1.5;e.path=findPath(e,closest)??[];}advance(e,dt,25);}else e.path=[];
  }
  if(attackTarget?.hp>0)for(const u of crew){
    const state=firingState(u,attackTarget),weapon=WEAPONS[u.weapon];
    if(u.fire>0||state.status!=='ready')continue;u.fire=weapon.interval;
    shots.push({a:project(state.a),b:project(state.b),life:weapon.mode==='beam'?.11:.08,beam:weapon.mode==='beam'});
    attackTarget.hp=Math.max(0,attackTarget.hp-weapon.damage);
    if(attackTarget.hp<=0){ui.targetInfo.textContent='표적 제압';attackTarget=null;break;}
  }
  shots=shots.filter(s=>(s.life-=dt)>0);
}
function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
function line(a,b,color,dash=[]){ctx.strokeStyle=color;ctx.lineWidth=1;ctx.setLineDash(dash);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);}
const background=document.createElement('canvas');background.width=W;background.height=H;
const bg=background.getContext('2d');bg.fillStyle='#32382c';bg.fillRect(0,0,W,H);
for(let y=0;y<H;y+=20)for(let x=0;x<W;x+=20){bg.fillStyle=(x*13+y*7)%23<4?'#293024':'#3d422f';bg.fillRect(x+(x+y)%5,y+(x*3+y)%7,2,2);}
function drawSprite(o){ctx.drawImage(atlas,...o.src,...o.draw);}
const worldSprites=[...terrainSprites,...obstacles.flatMap(obstacleLayers)];
function drawActor(u,enemy=false){
  const p=project(u);ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
  if(enemy){
    if(u.hp<=0){ctx.fillStyle='#6d5143';ctx.fillRect(-8,-3,16,5);ctx.restore();return;}
    const seen=spotters(u).length>0;if(!seen)ctx.globalAlpha=.4;
    ctx.fillStyle='#9a8267';polygon([point(0,-23),point(9,-10),point(6,0),point(-6,0),point(-9,-10)]);ctx.fill();
    ctx.fillStyle='#eb9b65';ctx.fillRect(-2,-17,4,2);ctx.fillStyle='#ef7c67';ctx.fillRect(-10,-29,20*u.hp/5,3);
    if(ui.cameraTruth.checked&&!seen){ctx.fillStyle='#b4c2bc';ctx.font='10px system-ui';ctx.fillText('미탐지',-14,-34);}
  }else{
    ctx.fillStyle='#151d18';ctx.fillRect(-8,-2,16,4);ctx.fillStyle='#26312e';ctx.fillRect(-7,-20,14,18);
    ctx.fillStyle=u.color;ctx.fillRect(-6,-27,12,9);ctx.fillRect(-10,-17,3,8);ctx.fillRect(7,-17,3,8);
    ctx.fillStyle='#e4d6b3';ctx.fillRect(-3,-25,6,5);ctx.fillStyle='#0c1514';ctx.fillRect(-6,-4,4,5);ctx.fillRect(2,-4,4,5);
    ctx.strokeStyle=u.id===selected?'#fff0a0':'#b6c9bd';ctx.lineWidth=u.id===selected?2:1;ctx.strokeRect(-10,-29,20,33);
    ctx.fillStyle='#bdd4c7';ctx.font='9px ui-monospace';ctx.fillText(String(u.id+1),-3,13);
  }
  ctx.restore();
}
function drawWorld(){
  const items=worldSprites.map(o=>({depth:o.depth,draw:()=>drawSprite(o)}));
  for(const u of crew)items.push({depth:actorDepth(u),draw:()=>drawActor(u)});
  for(const e of enemies)items.push({depth:actorDepth(e),draw:()=>drawActor(e,true)});
  items.sort((a,b)=>a.depth-b.depth);items.forEach(o=>o.draw());
}
function drawNavigation(){
  for(const u of crew){let previous=u;ctx.beginPath();const start=project(u);ctx.moveTo(start.x,start.y);
    for(const next of u.path){const steps=Math.max(1,Math.ceil(distance(previous,next)/4));
      for(let i=1;i<=steps;i++){const p=project(point(previous.x+(next.x-previous.x)*i/steps,previous.y+(next.y-previous.y)*i/steps));ctx.lineTo(p.x,p.y);}previous=next;}
    ctx.strokeStyle='rgba(210,232,220,.5)';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.stroke();ctx.setLineDash([]);
  }
  if(order){const p=project(order);ctx.strokeStyle='#bdeedc';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke();}
}
function drawHitboxes(){
  ctx.save();ctx.lineWidth=1;
  for(const o of obstacles){ctx.fillStyle='rgba(255,83,75,.12)';ctx.strokeStyle='#ff776b';
    if(o.poly)polygon(o.poly);else{const [x,y,a,b]=o.hit;ctx.beginPath();ctx.ellipse(x,y,a,b,0,0,Math.PI*2);}ctx.fill();ctx.stroke();
  }
  for(const poly of [plateauScreen,rampScreen]){polygon(poly);ctx.fillStyle='rgba(96,230,190,.07)';ctx.strokeStyle='#6bd9b4';ctx.fill();ctx.stroke();}
  for(const [a,b] of [[rampScreen[0],rampScreen[1]],[rampScreen[3],rampScreen[2]]])line(a,b,'#c9f5e6',[3,3]);
  for(const u of crew){const p=project(u);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,3);}
  ctx.restore();
}
function drawGrid(){
  for(let y=0;y<H;y+=16)for(let x=0;x<W;x+=16){const p=point(x+8,y+8),z=heightAt(p),q=project(p);ctx.fillStyle=blocked(p)?'rgba(255,93,82,.25)':z?'rgba(84,211,175,.25)':'rgba(196,215,206,.10)';ctx.fillRect(q.x-1,q.y-1,2,2);}
}
function drawVision(now){
  if(now-visionTime>100){visionTime=now;visionShapes=(allVision?crew:[crew[selected]]).map(u=>{
    const from=eye(u),points=[];
    for(let i=0;i<192;i++){const a=i*Math.PI*2/192,to={x:u.x+Math.cos(a)*VISION_RANGE,y:u.y+Math.sin(a)*VISION_RANGE,z:from.z};
      const hit=raycast(from,to),end=hit??to;points.push(project({...end,z:0}));}
    return {u,points};
  });}
  ctx.save();for(const {points} of visionShapes){polygon(points);ctx.fillStyle=allVision?'rgba(76,218,169,.055)':'rgba(76,218,169,.10)';ctx.fill();ctx.strokeStyle='rgba(96,238,190,.20)';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
}
function drawShotLines(){
  const u=crew[selected],weapon=WEAPONS[u.weapon],foot=project(u);
  ctx.strokeStyle='rgba(96,181,242,.5)';ctx.lineWidth=1;ctx.setLineDash([6,5]);
  ctx.beginPath();ctx.arc(foot.x,foot.y,weapon.range,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  for(const e of enemies){
    if(e.hp<=0||!canSee(u,e))continue;
    const state=firingState(u,e);
    if(state.status==='far'){line(foot,project(e),'rgba(122,150,175,.5)',[2,7]);continue;}
    line(project(state.a),project(state.hit??state.b),state.hit?'#ffb85c':'#6bd9b4',state.hit?[]:[3,5]);
    if(state.hit){const p=project(state.hit);ctx.fillStyle='#ffbd67';ctx.fillRect(p.x-2,p.y-2,4,4);}
  }
}
function draw(now){
  ctx.clearRect(0,0,W,H);ctx.drawImage(background,0,0);
  if(ui.showVision.checked)drawVision(now);
  drawNavigation();drawWorld();
  if(ui.showGrid.checked)drawGrid();if(ui.showHits.checked)drawHitboxes();if(ui.showShot.checked)drawShotLines();
  for(const s of shots){line(s.a,s.b,s.beam?'#77d9ff':'#e9e29a');if(s.beam)line(point(s.a.x+1,s.a.y),point(s.b.x+1,s.b.y),'rgba(119,217,255,.4)');}
  const u=crew[selected],count=enemies.filter(e=>e.hp>0&&canSee(u,e)).length;
  ui.memberInfo.textContent=`${u.name} · ${WEAPONS[u.weapon].name} / 고도 ${heightAt(u).toFixed(1)} / 표적 ${count}`;
  const weapon=WEAPONS[u.weapon];
  weaponInfo.textContent=`시야 ${VISION_RANGE} / 사거리 ${weapon.range} / 발사 간격 ${weapon.interval}초`;
  targetStates.textContent=enemies.filter(e=>e.hp>0).map(e=>`표적 ${e.id+1}: ${STATUS[firingState(u,e).status]} (${Math.round(distance(u,e))})`).join('\n');
  targetStates.style.whiteSpace='pre-line';
  ui.sceneStatus.textContent=`${crew.filter(u=>u.path.length).length}명 이동 중 · 속도 ${MOVE_SPEED} · 표적 ${enemies.filter(e=>e.hp>0&&spotters(e).length).length}/${enemies.filter(e=>e.hp>0).length}`;
}
function frame(now){const dt=Math.min(.04,(now-last)/1000);last=now;if(ready){update(dt);draw(now);}requestAnimationFrame(frame);}
initialCrew.forEach((u,i)=>{const b=document.createElement('button');b.className='crew';b.textContent=String(i+1);b.title=u.name;b.onclick=()=>selectCrew(i);ui.crewSelect.appendChild(b);});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
  if(!ready)return;const r=canvas.getBoundingClientRect(),p=point((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);
  if(e.button===2){moveGroup(pickGround(p));return;}if(e.button!==0)return;
  const member=crew.find(u=>distance(project(u),point(p.x,p.y+12))<18);if(member){selectCrew(member.id);return;}
  const enemy=enemies.find(u=>u.hp>0&&distance(project(u),point(p.x,p.y+12))<20);if(enemy)commandAttack(enemy);
  else if(e.pointerType==='touch')moveGroup(pickGround(p));
});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='4')selectCrew(+e.key-1);if(e.key==='Escape'){attackTarget=null;order=null;crew.forEach(u=>u.path=[]);}});
ui.reset.onclick=reset;ui.allVision.onclick=()=>{allVision=!allVision;visionTime=-Infinity;ui.showVision.checked=true;ui.allVision.textContent=allVision?'개인 시야로':'분대 시야 비교';};
atlas.onload=()=>{reset();ready=true;ui.loading.remove();};
atlas.onerror=()=>{ui.loading.textContent='지형 이미지 로드 실패';ui.loading.classList.add('error');};
atlas.src='../assets/terrain/drafts/terrain-spritesheet-v3.png';
requestAnimationFrame(frame);
