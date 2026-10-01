import {distance,segmentDistance,MOVE_SPEED} from './terrain-geometry.js';

const routeLength=u=>u.path.reduce((state,p)=>({length:state.length+distance(state.last,p),last:p}),{length:0,last:u}).length;
export function createSquadMovement(terrain){
  function stop(crew){for(const u of crew){u.path=[];u.moveSpeed=0;u.reaction=0;}}
  function order(crew,destination){
    const used=[],area=terrain.surface(destination).id;let failed=0;
    for(const u of crew)u.squadDestination={...destination};
    const nearby=crew.filter(u=>distance(u,destination)<=38&&!terrain.blocked(u)&&terrain.surface(u).id===area);
    // Nearby members keep their positions instead of reforming around a new click.
    for(const u of nearby){u.path=[];u.moveSpeed=0;u.reaction=0;u.stuck=false;used.push({...u});}
    for(const u of crew.filter(u=>!nearby.includes(u)).sort((a,b)=>distance(a,destination)-distance(b,destination))){
      const angle=Math.atan2(u.y-destination.y,u.x-destination.x)+(u.id-1.5)*.19;
      const radius=18+(u.id*7%17),desired={x:destination.x+Math.cos(angle)*radius,y:destination.y+Math.sin(angle)*radius};
      const candidates=[];
      for(let y=-48;y<=48;y+=8)for(let x=-48;x<=48;x+=8){
        const p={x:destination.x+x,y:destination.y+y};
        const clearExit=area!=='plateau'||segmentDistance(p,terrain.ramp[2],terrain.ramp[3])>=32;
        if(clearExit&&Math.hypot(x,y)<=46&&terrain.surface(p).id===area&&!terrain.blocked(p)&&used.every(q=>distance(p,q)>=22))candidates.push(p);
      }
      candidates.sort((a,b)=>(distance(a,desired)+distance(u,a)*.15)-(distance(b,desired)+distance(u,b)*.15));
      let path=null;
      for(const p of candidates){const attempt=terrain.findPath(u,p);if(attempt?.length&&used.every(q=>distance(attempt.at(-1),q)>=22)){path=attempt;used.push(path.at(-1));break;}}
      u.path=path??[];u.stuck=!path;
      u.reaction=(u.moveSpeed??0)>5?0:[.04,.17,.09,.25][u.id%4];
      if(!path){u.moveSpeed=0;failed++;}
    }
    return failed;
  }
  function update(crew,dt){
    const remaining=new Map(crew.map(u=>[u,routeLength(u)]));
    const longest=Math.max(...remaining.values(),0);
    for(const u of [...crew].sort((a,b)=>remaining.get(a)-remaining.get(b))){
      if(!u.path.length){u.moveSpeed=0;continue;}
      u.reaction=Math.max(0,(u.reaction??0)-dt);if(u.reaction>0)continue;
      const length=remaining.get(u),goal=u.path.at(-1);
      if(distance(u,goal)<7&&terrain.surface(u).id===terrain.surface(goal).id&&crew.every(v=>v===u||distance(u,v)>=17)){
        u.path=[];u.moveSpeed=0;continue;
      }
      const lead=longest-length;
      const cohesion=lead>170&&length>60?0:lead>85&&length>60?.55:1;
      const speed=Math.min(MOVE_SPEED*(.98+(u.id%4)*.014),Math.max(14,Math.sqrt(length*280)))*cohesion;
      const acceleration=260+u.id*28;
      u.moveSpeed=(u.moveSpeed??0)+Math.max(-acceleration*dt,Math.min(acceleration*dt,speed-(u.moveSpeed??0)));
      const predicted={...u,path:[...u.path]};
      const substeps=Math.max(1,Math.ceil(u.moveSpeed*dt));
      for(let i=0;i<substeps&&!predicted.stuck;i++)terrain.advance(predicted,dt/substeps,u.moveSpeed);
      if(predicted.stuck){
        const retry=terrain.findPath(u,goal);u.path=retry??[];u.stuck=!retry?.length;u.moveSpeed=0;continue;
      }
      const clear=p=>crew.every(v=>v===u||distance(p,v)>=13||distance(p,v)>distance(u,v));
      if(clear(predicted)){u.x=predicted.x;u.y=predicted.y;u.path=predicted.path;continue;}
      if(distance(u,u.squadDestination)<56&&terrain.surface(u).id===terrain.surface(u.squadDestination).id){
        u.path=[];u.moveSpeed=0;continue;
      }
      // Bypass a stopped member with a validated waypoint, not per-frame jitter.
      const surface=terrain.surface(u).id;
      const nearRamp=surface==='ramp'||surface==='ground'&&terrain.ramp.some((p,i)=>segmentDistance(u,p,terrain.ramp[(i+1)%4])<20);
      const blocker=crew.find(v=>v!==u&&!v.path.length&&distance(predicted,v)<13),detours=[];
      if(blocker&&!nearRamp)for(const radius of [22,32,44])for(let i=0;i<16;i++){
        const angle=i*Math.PI/8,p={x:blocker.x+Math.cos(angle)*radius,y:blocker.y+Math.sin(angle)*radius};
        const safeSegment=(a,b)=>crew.every(v=>v===u||segmentDistance(v,a,b)>=12.9);
        if(terrain.surface(p).id===surface&&terrain.canTravel(u,p)&&terrain.canTravel(p,u.path[0])&&safeSegment(u,p)&&safeSegment(p,u.path[0]))detours.push(p);
      }
      detours.sort((a,b)=>(distance(u,a)+distance(a,u.path[0]))-(distance(u,b)+distance(b,u.path[0])));
      if(detours.length)u.path.unshift(detours[0]);
      u.moveSpeed=0;
    }
  }
  return {order,update,stop};
}
