import {distance} from './terrain-geometry.js';

export function createBattleMission(site,lz){
  let stage='scan',elapsed=0,secured=0;
  return {
    reset(){stage='scan';elapsed=0;secured=0;},
    tick(dt,crew,enemies){
      if(stage==='complete')return;
      elapsed+=dt;
      if(stage==='scan'&&crew.some(u=>distance(u,site)<85)&&!enemies.some(e=>e.hp>0&&distance(e,site)<160)){
        secured=Math.min(12,secured+dt);if(secured>=12)stage='return';
      }
      if(stage==='return'&&crew.length&&crew.every(u=>distance(u,lz)<85))stage='complete';
    },
    snapshot(){return {stage,elapsed,progress:Math.floor(secured/12*100),goal:stage==='scan'?site:lz};},
  };
}
