import {distance,heightAt,raycast} from './terrain-geometry.js';

export const VISION_RANGE=330;
// Temporary demo values; distances use the terrain's world-coordinate units.
export const WEAPONS={
  pistol:{name:'권총',range:170,interval:.7,damage:1,mode:'bullet'},
  pdw:{name:'PDW',range:210,interval:.18,damage:.35,mode:'bullet'},
  rifle:{name:'소총',range:280,interval:.55,damage:1,mode:'bullet'},
  sniper:{name:'저격총',range:480,interval:1.8,damage:3,mode:'bullet'},
  beam:{name:'빔 무기',range:350,interval:.1,damage:.18,mode:'beam'},
};
export const STATUS={unseen:'시야 미확보',far:'사거리 밖',blocked:'사격 경로 차폐',ready:'사격 가능'};
export const eye=u=>({...u,z:heightAt(u)+(u.eye??.65)});
export const canSee=(u,e)=>distance(u,e)<=VISION_RANGE&&!raycast(eye(u),eye(e));
export const muzzle=u=>({...u,z:heightAt(u)+1});
export const aim=e=>({...e,z:heightAt(e)+.65});
export function firingState(u,e,known=canSee(u,e)) {
  const weapon=WEAPONS[u.weapon],d=distance(u,e);
  if(!known)return {status:'unseen'};
  if(d>weapon.range)return {status:'far'};
  const a=muzzle(u),b=aim(e),hit=raycast(a,b);
  return {status:hit?'blocked':'ready',a,b,hit};
}
