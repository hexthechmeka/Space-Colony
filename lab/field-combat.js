import {WEAPONS,createWeaponRules} from './terrain-weapons.js';
import {distance,HEIGHT_PIXELS} from './terrain-geometry.js';

export function pickFocusTarget(enemies,p,project,known){
  return enemies.find(e=>e.hp>0&&known(e)&&distance(project(e),{x:p.x,y:p.y+10})<20)??null;
}
export function createFieldCombat(terrain,{random=Math.random,known=()=>true}={}){
  const rules=createWeaponRules(terrain);
  function equip(u){
    const w=WEAPONS[u.weapon];
    u.gun={ammo:w.battery??w.magazine,reserve:w.batteries??w.reserve,reload:0,cooldown:0,charge:0,channel:0,bias:0,biasTarget:0,biasTime:0,heat:0,aim:0};
  }
  function cancel(u){if(u.gun){u.gun.charge=0;u.gun.channel=0;u.gun.lock=null;u.gun.channelRay=null;u.gun.aim=0;}}
  function reload(u){const g=u.gun,w=WEAPONS[u.weapon];if(g.ammo<=0&&g.reserve>0&&!g.reload)g.reload=w.reload;}
  function intentPoint(u,intent){
    if(intent.target)return rules.aim(intent.target);
    const ground=terrain.pickGround({x:intent.point.x,y:intent.point.y+.65*HEIGHT_PIXELS});
    return {...ground,z:terrain.heightAt(ground)+.65};
  }
  function trace(u,point,offset,enemies){
    const w=WEAPONS[u.weapon],a=rules.muzzle(u),d=Math.max(.001,distance(a,point));
    const angle=Math.atan2(point.y-a.y,point.x-a.x)+offset;
    const b={x:a.x+Math.cos(angle)*w.range,y:a.y+Math.sin(angle)*w.range,z:a.z+(point.z-a.z)*w.range/d};
    const obstruction=terrain.raycast(a,b,'shot');let limit=obstruction?distance(a,obstruction):w.range,end=obstruction??b,victim=null;
    // Use the visible enemy body, while retaining height and terrain ray checks.
    const screenA=terrain.project(a),screenB=terrain.project(b);
    for(const e of enemies){if(e.hp<=0)continue;
      const foot=terrain.project(e),radius=e.radius??10;let enter=0,leave=1;
      for(const [start,delta,low,high] of [[screenA.x,screenB.x-screenA.x,foot.x-radius,foot.x+radius],[screenA.y,screenB.y-screenA.y,foot.y-25,foot.y]]){
        if(Math.abs(delta)<1e-8){if(start<low||start>high){leave=-1;break;}continue;}
        const t0=(low-start)/delta,t1=(high-start)/delta;enter=Math.max(enter,Math.min(t0,t1));leave=Math.min(leave,Math.max(t0,t1));
      }
      if(enter>leave)continue;
      const t=enter*w.range,z=a.z+(b.z-a.z)*enter,base=terrain.heightAt(e);
      if(t>limit||z<base||z>base+1.4)continue;
      limit=t;victim=e;end={x:a.x+Math.cos(angle)*t,y:a.y+Math.sin(angle)*t,z};
    }
    return {a,b:end,victim,beam:w.mode!=='bullet',life:w.mode==='bullet'?.1:.09};
  }
  function tick(u,dt,intent,enemies){
    if(!u.gun)equip(u);const g=u.gun,w=WEAPONS[u.weapon],shots=[];
    g.cooldown=Math.max(0,g.cooldown-dt);g.heat=Math.max(0,g.heat-dt*.35);
    if(g.reload>0){g.reload=Math.max(0,g.reload-dt);
      if(!g.reload){if(w.battery){g.ammo=w.battery;g.reserve--;}else{const n=Math.min(w.magazine,g.reserve);g.ammo=n;g.reserve-=n;}}
      return shots;
    }
    if(g.ammo<=0){cancel(u);reload(u);return shots;}
    let aimIntent=intent;
    if(g.channel>0){
      aimIntent=g.lock;
      if(aimIntent.target&&(!known(aimIntent.target)||aimIntent.target.hp<=0))aimIntent={point:g.lastPoint};
    }
    if(!aimIntent){g.charge=0;g.aim=Math.max(0,g.aim-dt);return shots;}
    const point=intentPoint(u,aimIntent);g.lastPoint=terrain.project(point);
    const heading=Math.atan2(point.y-u.y,point.x-u.x);
    if(g.heading!==undefined&&Math.abs(Math.atan2(Math.sin(heading-g.heading),Math.cos(heading-g.heading)))>.18){g.aim=0;if(!g.channel)g.charge=0;}
    g.heading=heading;g.aim=Math.min(1,g.aim+dt*2);
    g.biasTime-=dt;if(g.biasTime<=0){g.biasTime=.3;g.biasTarget=(random()*2-1)*.1*(1-(u.skill??.65));}
    g.bias+=(g.biasTarget-g.bias)*Math.min(1,dt*10);
    const moving=(u.moveSpeed??0)>4;
    const error=g.bias*(1.5-g.aim*.8)*(moving&&w.mode==='bullet'?2.5:1);
    if(w.mode==='channel'){
      if(!g.channel){if(g.cooldown>0)return shots;g.charge+=dt;if(g.charge<w.aimTime)return shots;g.charge=0;g.channel=w.duration;g.lock=aimIntent;
        // Resolve accuracy once: a hit tracks that victim; a miss keeps its original ray.
        g.channelRay=trace(u,point,error,enemies);
      }
      const duration=Math.min(dt,g.channel,g.ammo/w.energy),locked=g.channelRay;
      const victim=locked.victim?.hp>0?locked.victim:null;
      const ray={...locked,a:{...locked.a},b:victim?rules.aim(victim):{...locked.b},victim};
      if(ray.victim)ray.victim.hp=Math.max(0,ray.victim.hp-w.damage*duration);
      shots.push(ray);g.channel=Math.max(0,g.channel-duration);g.ammo=Math.max(0,g.ammo-w.energy*duration);
      if(!g.channel||g.ammo<=0){g.channel=0;g.lock=null;g.channelRay=null;g.cooldown=w.interval;}reload(u);return shots;
    }
    if(g.cooldown>0)return shots;
    if(w.aimTime){g.charge+=dt;if(g.charge<w.aimTime)return shots;g.charge=0;}
    const spread=w.mode==='bullet'?w.spread*(1+g.heat*1.5)*(moving?(u.weapon==='machinegun'?5:2):1):0;
    for(let i=0;i<(w.pellets??1);i++){
      const ray=trace(u,point,error+(random()*2-1)*spread,enemies);
      if(ray.victim)ray.victim.hp=Math.max(0,ray.victim.hp-w.damage);shots.push(ray);
    }
    g.ammo=Math.max(0,g.ammo-(w.energy??1));g.cooldown=w.interval;if(w.mode==='bullet')g.heat=Math.min(1,g.heat+.08);reload(u);
    return shots;
  }
  return {equip,cancel,tick,trace};
}
