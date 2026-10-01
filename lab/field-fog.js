export const MEMORY_COLOR='#000000';
export const MEMORY_OPACITY=.66;
export const FOG_EDGE_BLUR=6;
export const VISION_REFRESH_MS=50;
export function drawFog(ctx,explored,visions,width,height){
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#000000';ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation='destination-out';ctx.drawImage(explored,0,0,width,height);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=MEMORY_OPACITY;ctx.drawImage(explored,0,0,width,height);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';ctx.filter=`blur(${FOG_EDGE_BLUR}px)`;
  ctx.beginPath();for(const points of visions){
    points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
  }ctx.fill();
  ctx.restore();
}
export function terrainObjectVisible(object,crew,terrain,range){
  const polygon=object.poly??(object.id==='plateau'?terrain.plateau:object.id==='ramp'?terrain.ramp:null);
  const hit=object.visionHit??object.hit;
  const samples=polygon?[...polygon,{x:polygon.reduce((s,p)=>s+p.x,0)/polygon.length,y:polygon.reduce((s,p)=>s+p.y,0)/polygon.length}]
    :[[0,0],[-.9,0],[.9,0],[0,-.9],[0,.9]].map(([dx,dy])=>({x:hit[0]+dx*hit[2],y:hit[1]+dy*hit[3]}));
  return crew.some(u=>samples.some(p=>{
    if(Math.hypot(u.x-p.x,u.y-p.y)>range)return false;
    const a={...u,z:terrain.heightAt(u)+(u.eye??.65)};
    const b={...p,z:terrain.heightAt(p)+(polygon?.length ? .05:(object.height??0)*.75)};
    const obstruction=terrain.raycast(a,b,'vision');
    // Seeing the object's own front face is enough; it must not hide itself.
    return !obstruction||obstruction.id===object.id;
  }));
}
