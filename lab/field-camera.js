export function createCamera(width,height,vw=960,vh=600){
  return {x:vw/2,y:height-vh/2,zoom:1,width,height,vw,vh};
}
export function clampCamera(c){
  const hw=Math.min(c.width/2,c.vw/c.zoom/2),hh=Math.min(c.height/2,c.vh/c.zoom/2);
  c.x=Math.max(hw,Math.min(c.width-hw,c.x));c.y=Math.max(hh,Math.min(c.height-hh,c.y));
}
export const screenToWorld=(c,p)=>({x:(p.x-c.vw/2)/c.zoom+c.x,y:(p.y-c.vh/2)/c.zoom+c.y});
export const worldToScreen=(c,p)=>({x:(p.x-c.x)*c.zoom+c.vw/2,y:(p.y-c.y)*c.zoom+c.vh/2});
export function zoomCamera(c,zoom,anchor={x:c.vw/2,y:c.vh/2}){
  const before=screenToWorld(c,anchor);c.zoom=Math.max(.55,Math.min(1.8,zoom));
  const after=screenToWorld(c,anchor);c.x+=before.x-after.x;c.y+=before.y-after.y;clampCamera(c);
}
