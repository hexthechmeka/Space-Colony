const CYCLE=5.8,LIFETIME=2.8;
const CLOUD=[[-2,0,4,2],[-3,-1,6,2],[-2,-2,4,2],[-1,-3,3,2]];
export function geyserParticles(geyser,now){
  const seed=geyser.hit[0]*.013+geyser.hit[1]*.007;
  const time=now/1000+seed,particles=[];
  for(let i=0;i<22;i++){
    const age=((time-i*LIFETIME/22)%LIFETIME+LIFETIME)%LIFETIME;
    const progress=age/LIFETIME;
    const birthPhase=((time-age)%CYCLE+CYCLE)%CYCLE/CYCLE;
    const pulse=Math.pow(Math.max(0,Math.sin(birthPhase*Math.PI*2)),2);
    const spread=1.5+progress*3.8;
    particles.push({
      x:Math.round(geyser.hit[0]+Math.sin(i*2.4+seed)*progress*18+Math.sin(time*1.4+i)*3),
      y:Math.round(geyser.hit[1]-30-progress*(95+pulse*26)),
      size:spread,alpha:(.16+pulse*.38)*Math.sin(Math.PI*progress)**.7,
      bright:pulse>.5,
    });
  }
  return particles;
}
export function drawGeyser(ctx,image,geyser,now){
  const [sx,sy,sw,sh]=geyser.src,[x,y,w,h]=geyser.draw;
  // Keep the rock base; replace the atlas's static plume with moving pixel clouds.
  const base=420;
  ctx.drawImage(image,sx,sy+base,sw,sh-base,x,y+h*base/sh,w,h*(sh-base)/sh);
  ctx.save();
  for(const p of geyserParticles(geyser,now)){
    ctx.globalAlpha=p.alpha;ctx.fillStyle=p.bright?'#a5d5a8':'#729f88';
    for(const [dx,dy,dw,dh] of CLOUD){
      ctx.fillRect(Math.round(p.x+dx*p.size),Math.round(p.y+dy*p.size),Math.ceil(dw*p.size),Math.ceil(dh*p.size));
    }
    ctx.fillStyle='#d0e9ac';ctx.globalAlpha=p.alpha*.45;
    ctx.fillRect(Math.round(p.x-p.size),Math.round(p.y-p.size*2),Math.ceil(p.size*2),Math.ceil(p.size));
  }
  ctx.restore();
}
