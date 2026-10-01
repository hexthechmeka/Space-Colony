import {distance,heightAt,raycast} from './terrain-geometry.js';

export const VISION_RANGE=330;
// Temporary demo values; distances use the terrain's world-coordinate units.
export const WEAPONS={
  pistol:{name:'권총',range:170,interval:.42,damage:1,mode:'bullet',magazine:12,reserve:48,reload:1.4,spread:.025,move:1},
  pdw:{name:'PDW',range:210,interval:.07,damage:.55,mode:'bullet',magazine:30,reserve:90,reload:1.7,spread:.04,move:1},
  rifle:{name:'소총',range:280,interval:.12,damage:1,mode:'bullet',magazine:30,reserve:90,reload:1.9,spread:.025,move:1},
  sniper:{name:'저격총',range:480,interval:1.6,damage:4,mode:'bullet',magazine:5,reserve:15,reload:2.4,spread:.006,move:.9,vision:150,aimTime:.3},
  shotgun:{name:'샷건',range:155,interval:.9,damage:.6,mode:'bullet',magazine:6,reserve:24,reload:2.3,spread:.14,pellets:7,move:.96},
  machinegun:{name:'기관총',range:320,interval:.065,damage:.7,mode:'bullet',magazine:60,reserve:120,reload:3.4,spread:.05,move:.78},
  beam:{name:'빔 소총',range:350,interval:.1,damage:1.1,mode:'beam',battery:100,batteries:3,reload:2.8,spread:.001,energy:6,move:1},
  beamSniper:{name:'빔 저격총',range:520,interval:1.8,damage:6,mode:'channel',battery:100,batteries:3,reload:3.1,spread:.001,energy:40,move:.85,vision:170,aimTime:.5,duration:1.25},
};
export const STATUS={unseen:'시야 미확보',far:'사거리 밖',blocked:'사격 경로 차폐',ready:'사격 가능'};
export function createWeaponRules(terrain) {
const {heightAt,raycast}=terrain;
const eye=u=>({...u,z:heightAt(u)+(u.eye??.65)});
const visionRange=u=>VISION_RANGE+(WEAPONS[u.weapon]?.vision??0);
const canSee=(u,e)=>distance(u,e)<=visionRange(u)&&!raycast(eye(u),eye(e),'vision');
const muzzle=u=>({...u,z:heightAt(u)+.65});
const aim=e=>({...e,z:heightAt(e)+.65});
function visibilityState(u,e){
  if(!canSee(u,e))return 'hidden';
  return raycast(muzzle(u),aim(e),'shot')?'visible':'clear';
}
function firingState(u,e,known=canSee(u,e)) {
  const weapon=WEAPONS[u.weapon],d=distance(u,e);
  if(!known)return {status:'unseen'};
  if(d>weapon.range)return {status:'far'};
  const a=muzzle(u),b=aim(e),hit=raycast(a,b,'shot');
  return {status:hit?'blocked':'ready',a,b,hit};
}
return {eye,visionRange,canSee,muzzle,aim,firingState,visibilityState};
}
export const {eye,canSee,muzzle,aim,firingState,visibilityState}=createWeaponRules({heightAt,raycast});
