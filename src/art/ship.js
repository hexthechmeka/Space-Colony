import { P } from '../ui/canvas.js';

/* 개척 전함 — 측면 도트 아트 (한 번 구워서 재사용) */
export let shipSprite = null;
export function motherShip(){
  if (shipSprite) return shipSprite;
  const w = 168, h = 74;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const R = (x,y,ww,hh,col) => { g.fillStyle = col; g.fillRect(x,y,ww,hh); };
  // 하부 화물 램프
  R(24,50,112,10,'#2b2f34'); R(24,50,112,2,'#3f454c');
  R(30,60,16,6,'#22262a'); R(118,60,16,6,'#22262a');
  // 주 선체
  R(16,26,140,26,'#4a5057'); R(16,26,140,3,'#5f676f'); R(16,49,140,3,'#31363b');
  R(150,28,14,22,'#3c4147');                     // 함미
  R(6,32,12,14,'#565d64');                       // 함수
  R(2,36,6,6,'#6f7a80');
  // 화물 포드
  R(44,32,26,14,'#3a3f45'); R(44,32,26,2,'#555c63'); R(46,35,22,3,'#c8a24a');
  R(80,32,26,14,'#3a3f45'); R(80,32,26,2,'#555c63'); R(82,35,22,3,'#a4432c');
  // 함교
  R(104,12,34,15,'#6f7a80'); R(104,12,34,2,'#8d97a0');
  R(108,16,6,5,'#1e2226'); R(117,16,6,5,'#1e2226'); R(126,16,6,5,'#1e2226');
  R(120,4,4,9,'#8d97a0'); R(118,2,8,3,'#c8a24a');
  // 굴뚝 / 배기
  R(88,16,8,12,'#3a3f45'); R(88,14,8,3,'#565d64');
  R(74,20,6,9,'#3a3f45'); R(74,18,6,3,'#565d64');
  // 황동 띠와 리벳
  R(16,44,140,2,'#c8a24a');
  g.fillStyle = '#8a6c2e';
  for (let x=20;x<154;x+=8) g.fillRect(x,29,2,2);
  // 엔진 노즐
  R(156,30,10,8,'#2b2f34'); R(156,42,10,8,'#2b2f34');
  R(154,31,4,6,'#e6c56d'); R(154,43,4,6,'#e6c56d');
  // 안테나
  R(36,20,2,8,'#8d97a0'); R(32,18,10,2,'#8d97a0');
  shipSprite = c; return c;
}
export function drawMotherShip(x, y, t, scale){
  const c = motherShip(), s = scale || 1;
  const w = c.width*s, h = c.height*s;
  const bob = Math.sin(t*0.8)*2;
  const dx = Math.round(x - w/2), dy = Math.round(y - h/2 + bob);
  // 엔진 분사
  const flick = 0.6 + 0.4*Math.sin(t*14);
  for (let i=0;i<2;i++){
    const ey = dy + (30 + i*12)*s + 4*s;
    const len = (16 + 10*flick)*s;
    const gr = P.createLinearGradient(dx+w, ey, dx+w+len, ey);
    gr.addColorStop(0,'rgba(255,214,130,.95)'); gr.addColorStop(0.4,'rgba(230,120,60,.55)'); gr.addColorStop(1,'rgba(180,60,30,0)');
    P.fillStyle = gr; P.fillRect(dx+w, ey-3*s, len, 6*s);
  }
  P.drawImage(c, dx, dy, w, h);
  // 항행등
  if (Math.floor(t*2) % 2 === 0){
    P.fillStyle = '#ff8f6b'; P.fillRect(dx+8*s, dy+22*s, 3*s, 3*s);
    P.fillStyle = '#9bd6ff'; P.fillRect(dx+148*s, dy+20*s, 3*s, 3*s);
  }
}
