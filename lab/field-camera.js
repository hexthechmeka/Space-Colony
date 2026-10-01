export function createCamera(width,height,vw=960,vh=600){
  return {x:vw/2,y:height-vh/2,zoom:1,width,height,vw,vh};
}
export function clampCamera(c){
  const hw=c.edgeCenter?0:Math.min(c.width/2,c.vw/c.zoom/2),hh=c.edgeCenter?0:Math.min(c.height/2,c.vh/c.zoom/2);
  c.x=Math.max(hw,Math.min(c.width-hw,c.x));c.y=Math.max(hh,Math.min(c.height-hh,c.y));
}
export function centerCamera(c,p){c.edgeCenter=true;c.x=p.x;c.y=p.y;clampCamera(c);}
export function edgeCameraDirection(pointer,margin=24){
  if(!pointer)return {x:0,y:0};
  const {x,y,width,height}=pointer;
  if(x<0||y<0||x>width||y>height)return {x:0,y:0};
  const axis=(p,size)=>p<margin?-(1-p/margin):p>size-margin?1-(size-p)/margin:0;
  const dx=axis(x,width),dy=axis(y,height),length=Math.max(1,Math.hypot(dx,dy));
  return {x:dx/length,y:dy/length};
}
export const screenToWorld=(c,p)=>({x:(p.x-c.vw/2)/c.zoom+c.x,y:(p.y-c.vh/2)/c.zoom+c.y});
export const worldToScreen=(c,p)=>({x:(p.x-c.x)*c.zoom+c.vw/2,y:(p.y-c.y)*c.zoom+c.vh/2});
export function zoomCamera(c,zoom,anchor={x:c.vw/2,y:c.vh/2}){
  const before=screenToWorld(c,anchor);c.zoom=Math.max(.55,Math.min(1.8,zoom));
  const after=screenToWorld(c,anchor);c.x+=before.x-after.x;c.y+=before.y-after.y;clampCamera(c);
}
