import {createElement,Pause,Square,LocateFixed,Backpack,Maximize,X,MapPin} from 'lucide';
import {WEAPONS} from './terrain-weapons.js';
import {distance} from './terrain-geometry.js';

const byId=id=>document.getElementById(id);
const icon=(id,node)=>byId(id).append(createElement(node,{'aria-hidden':'true'}));
const loadImage=async url=>{const image=new Image();image.src=url;await image.decode();return image;};
export function mountBattleHUD({ui,onCenter,onGoal,onPause,onReset}){
  const menu=byId('battle-menu'),equipment=byId('equipment-panel');let paused=false,finished=false;
  icon('pause-action',Pause);icon('center-action',LocateFixed);icon('stop',Square);icon('equipment-action',Backpack);icon('fullscreen-action',Maximize);icon('objective-icon',MapPin);
  menu.querySelector('.close-menu').append(createElement(X,{'aria-hidden':'true'}));
  function pause(showEquipment=false){paused=true;onPause();equipment.hidden=!showEquipment;byId('menu-title').textContent=showEquipment?'출격 장비':'작전 일시 정지';if(!menu.open)menu.showModal();}
  function resume(){paused=false;menu.close();}
  byId('resume-action').onclick=resume;menu.querySelector('.close-menu').onclick=resume;
  byId('pause-action').onclick=()=>pause();byId('equipment-action').onclick=()=>pause(true);
  byId('center-action').onclick=onCenter;byId('objective-action').onclick=onGoal;
  byId('fullscreen-action').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await byId('battle-stage').requestFullscreen();}catch{byId('order').textContent='전체 화면 전환 불가';}};
  menu.addEventListener('close',()=>{paused=false;});
  menu.addEventListener('cancel',e=>{e.preventDefault();resume();});
  byId('reset').onclick=()=>{resume();onReset();};
  const portraits=[],weapons=[];
  [...ui.crew.children].forEach((button,i)=>{
    button.setAttribute('aria-label',`${i+1}번 대원 선택`);
    const frame=document.createElement('span');frame.className='portrait-frame';
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=72;canvas.setAttribute('aria-hidden','true');frame.append(canvas);button.append(frame);portraits.push(canvas);
    const hp=document.createElement('span');hp.className='health';hp.setAttribute('role','meter');hp.setAttribute('aria-label','전투 체력');hp.setAttribute('aria-valuemin','0');hp.setAttribute('aria-valuemax','100');hp.setAttribute('aria-valuenow','100');hp.innerHTML='<i></i>';button.append(hp);
    const slot=document.createElement('span');slot.className='slot';slot.textContent=String(i+1).padStart(2,'0');button.append(slot);
    const mark=document.createElement('canvas');mark.width=90;mark.height=26;mark.className='weapon-mark';mark.setAttribute('aria-hidden','true');button.append(mark);weapons.push(mark);
  });
  ui.weapon.title='장비 변경 시 시험용 탄약 재지급';
  const assets=Promise.all([
    loadImage(new URL('../assets/portraits/drafts/mouth-expressions-v1.png',import.meta.url).href),
    loadImage(new URL('../assets/ui/drafts/battle-lcd-hud-v2.png',import.meta.url).href),
  ]).then(([faces,atlas])=>{
    portraits.forEach((canvas,i)=>{const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(faces,i*faces.width/4,faces.height*.46,faces.width/4,faces.height*.48,0,0,64,72);});
    return atlas;
  });
  let atlas=null;assets.then(image=>{atlas=image;}).catch(()=>{ui.order.textContent='승무원 영상 수신 실패';});
  const lastWeapons=[];
  return {
    get paused(){return paused;},
    togglePause(){if(paused)resume();else pause();},
    assets,
    reset(){finished=false;byId('menu-result').hidden=true;paused=false;if(menu.open)menu.close();},
    update({crew,selected,mission,engaged}){
      const state=mission.snapshot(),u=crew[selected];
      byId('mission-title').textContent=state.stage==='scan'?'관측 지점 확보':state.stage==='return'?'착륙 지점으로 복귀':'작전 완료';
      byId('mission-progress').value=state.progress;byId('mission-percent').textContent=`${state.progress}%`;
      const seconds=Math.floor(state.elapsed);byId('mission-clock').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
      byId('link-state').textContent=engaged?'교전 중':crew.some(u=>u.path.length)?'이동 중':'통신 양호';
      byId('objective-distance').textContent=`${state.stage==='scan'?'관측 지점':'착륙 지점'} · ${Math.round(distance(u,state.goal))}m`;
      crew.forEach((u,i)=>{
        const hp=ui.crew.children[i].querySelector('.health'),ratio=Math.max(0,Math.min(1,u.hp/u.maxHp));
        hp.setAttribute('aria-valuenow',String(Math.round(ratio*100)));hp.firstChild.style.width=`${ratio*100}%`;
        if(!atlas||lastWeapons[i]===u.weapon)return;lastWeapons[i]=u.weapon;
        const index=u.weapon==='shotgun'?1:u.weapon==='sniper'||u.weapon==='beamSniper'?2:u.weapon==='machinegun'?3:0;
        const ctx=weapons[i].getContext('2d');ctx.clearRect(0,0,90,26);ctx.imageSmoothingEnabled=false;
        const sx=[36,234,426,602][index];ctx.drawImage(atlas,sx/1672*atlas.width,690/941*atlas.height,87/1672*atlas.width,29/941*atlas.height,0,0,90,26);
        ui.crew.children[i].title=`${u.name} · ${WEAPONS[u.weapon].name}`;
      });
      if(state.stage==='complete'&&!finished){finished=true;pause();byId('menu-title').textContent='작전 완료';byId('menu-result').hidden=false;byId('menu-result').textContent='관측 자료 확보 · 분대 전원 복귀';}
    },
  };
}
