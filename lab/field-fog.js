export const MEMORY_COLOR='#62676b';
export const MEMORY_OPACITY=.66;
export function drawFog(ctx,explored,visions,width,height){
  ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  ctx.clearRect(0,0,width,height);ctx.fillStyle='#000000';ctx.fillRect(0,0,width,height);
  ctx.globalCompositeOperation='destination-out';ctx.drawImage(explored,0,0);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=MEMORY_OPACITY;ctx.drawImage(explored,0,0);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';
  for(const points of visions){
    ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
  }
  ctx.restore();
}
